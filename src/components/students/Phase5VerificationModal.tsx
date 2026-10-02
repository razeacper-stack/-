import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { studentStorage } from '../../services/studentStorage';
import { academicStorage } from '../../services/academicStorage';
import { authStorage } from '../../services/authStorage';
import { SafeUser } from '../../types/auth';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Check,
  ShieldAlert,
  ClipboardList,
  Sparkles,
} from 'lucide-react';

interface TestCase {
  id: number;
  title: string;
  category: 'Registration' | 'Guardians' | 'Enrollment' | 'Lifecycle' | 'Search & Security';
  run: () => Promise<{ passed: boolean; message: string; details?: any }>;
}

export const Phase5VerificationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<
    Record<number, { passed: boolean; message: string; details?: any }>
  >({});
  const [progress, setProgress] = useState(0);

  // Mock Safe Actors for Verification
  const superAdminUser: SafeUser = {
    id: 'user-super-admin',
    fullName: 'د. عبدالرحمن العتيبي (Super Admin)',
    username: 'superadmin',
    email: 'superadmin@schoolms.edu',
    roleId: 'role-super-admin',
    roleCode: 'SUPER_ADMIN',
    roleNameAr: 'مدير عام النظام',
    roleNameEn: 'Super Admin',
    branchIds: [],
    hasAllBranchesAccess: true,
    isProtectedSuperAdmin: true,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: [
      'students.view',
      'students.create',
      'students.edit',
      'students.delete',
      'classes.view',
      'classes.create',
      'classes.edit',
      'academic_years.view',
      'academic_stages.view',
      'grades.view',
    ] as any[],
  };

  const riyadhManagerUser: SafeUser = {
    id: 'user-manager-riyadh',
    fullName: 'أ. منى الغامدي (Manager)',
    username: 'manager',
    email: 'manager@schoolms.edu',
    roleId: 'role-manager',
    roleCode: 'MANAGER',
    roleNameAr: 'مدير فرع الرياض',
    roleNameEn: 'Branch Manager',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: [
      'students.view',
      'students.create',
      'students.edit',
      'classes.view',
    ] as any[],
  };

  const viewerUser: SafeUser = {
    id: 'user-viewer',
    fullName: 'عبدالله الزهراني (Viewer)',
    username: 'viewer',
    email: 'viewer@schoolms.edu',
    roleId: 'role-viewer',
    roleCode: 'VIEWER',
    roleNameAr: 'مشاهد مدقق',
    roleNameEn: 'Viewer',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: ['students.view'] as any[],
  };

  const tests: TestCase[] = [
    {
      id: 1,
      category: 'Registration',
      title: 'استعراض سجل الطلاب وعزل الفروع أمنياً (Branch Isolation)',
      run: async () => {
        studentStorage.initialize();
        const riyadhList = studentStorage.listStudents(riyadhManagerUser, { branchId: 'branch-riyadh' });
        const allList = studentStorage.listStudents(superAdminUser, { branchId: 'all' });
        const hasOnlyRiyadh = riyadhList.students.every((s) => s.branchId === 'branch-riyadh');
        return {
          passed: hasOnlyRiyadh && allList.totalCount >= riyadhList.totalCount,
          message: `تم جلب ${riyadhList.totalCount} طالب لفرع الرياض و ${allList.totalCount} طالب للنظام كاملاً بعزل تام.`,
        };
      },
    },
    {
      id: 2,
      category: 'Registration',
      title: 'التوليد التلقائي للرقم التعريفي الفريد (STU-YYYY-XXX)',
      run: async () => {
        const nextNum = studentStorage.generateNextStudentNumber('branch-riyadh');
        const pattern = /^STU-\d{4}-\d{3}$/;
        return {
          passed: pattern.test(nextNum),
          message: `تم توليد الرقم بنجاح وفق النمط المعتمد: ${nextNum}`,
        };
      },
    },
    {
      id: 3,
      category: 'Registration',
      title: 'تسجيل طالب برقم تعريفي مخصص والتحقق من الحقول الإلزامية',
      run: async () => {
        const customNum = `TEST-STU-${Date.now().toString().slice(-4)}`;
        const student = studentStorage.createStudentWithEnrollment(superAdminUser, {
          branchId: 'branch-riyadh',
          studentNumber: customNum,
          firstNameAr: 'فهد',
          lastNameAr: 'الدوسري',
          firstNameEn: 'Fahad',
          lastNameEn: 'Al-Dossary',
          dateOfBirth: '2019-05-10',
          gender: 'male',
          nationality: 'سعودي',
          academicYearId: 'ay-riyadh-2026',
          stageId: 'stg-riyadh-pri',
          gradeId: 'grd-riyadh-p1',
          classId: 'cls-riyadh-p1-a',
          guardian: {
            fullName: 'سلطان الدوسري',
            relationship: 'father',
            phoneNumber: '0551122334',
          },
        });
        return {
          passed: student.studentNumber === customNum && student.firstNameAr === 'فهد',
          message: `تم تسجيل الطالب بنجاح برقم: ${student.studentNumber} وقيد في فصل 1/أ`,
        };
      },
    },
    {
      id: 4,
      category: 'Registration',
      title: 'منع تكرار رقم الطالب في قاعدة البيانات (Unique Student Number)',
      run: async () => {
        try {
          studentStorage.createStudentWithEnrollment(superAdminUser, {
            branchId: 'branch-riyadh',
            studentNumber: 'STU-2026-001', // Existing seeded student number
            firstNameAr: 'مكرر',
            lastNameAr: 'الاختبار',
            firstNameEn: 'Duplicate',
            lastNameEn: 'Test',
            dateOfBirth: '2019-01-01',
            gender: 'male',
            nationality: 'سعودي',
            academicYearId: 'ay-riyadh-2026',
            stageId: 'stg-riyadh-pri',
            gradeId: 'grd-riyadh-p1',
            classId: 'cls-riyadh-p1-a',
            guardian: {
              fullName: 'ولي أمر',
              relationship: 'father',
              phoneNumber: '0500000000',
            },
          });
          return { passed: false, message: 'فشل الفحص: تم السماح برقم طالب مكرر!' };
        } catch (e: any) {
          return {
            passed: true,
            message: `تم رفض الرقم المكرر بأمان: ${e.message}`,
          };
        }
      },
    },
    {
      id: 5,
      category: 'Guardians',
      title: 'دعم أولياء أمور متعددين مع تحديد جهة اتصال أساسية واحدة',
      run: async () => {
        const student = studentStorage.createStudentWithEnrollment(superAdminUser, {
          branchId: 'branch-riyadh',
          studentNumber: `STU-MULTI-${Date.now().toString().slice(-4)}`,
          firstNameAr: 'سارة',
          lastNameAr: 'المنصور',
          firstNameEn: 'Sara',
          lastNameEn: 'Al-Mansoor',
          dateOfBirth: '2019-07-20',
          gender: 'female',
          nationality: 'سعودية',
          academicYearId: 'ay-riyadh-2026',
          stageId: 'stg-riyadh-pri',
          gradeId: 'grd-riyadh-p1',
          classId: 'cls-riyadh-p1-a',
          guardian: {
            fullName: 'منصور العبدالله',
            relationship: 'father',
            phoneNumber: '0553344112',
            isPrimaryContact: true,
          },
          secondaryGuardian: {
            fullName: 'نوال الخالد',
            relationship: 'mother',
            phoneNumber: '0553344113',
            isEmergencyContact: true,
          },
        });

        const primaryCount = student.guardians.filter((g) => g.isPrimaryContact).length;
        return {
          passed: student.guardians.length === 2 && primaryCount === 1,
          message: `تم ربط وليين (أب وأم) وتحديد ولي الأمر الأساسي بنجاح.`,
        };
      },
    },
    {
      id: 6,
      category: 'Enrollment',
      title: 'التحقق من صحة التسلسل الأكاديمي (Academic Hierarchy Integrity)',
      run: async () => {
        try {
          studentStorage.createStudentWithEnrollment(superAdminUser, {
            branchId: 'branch-riyadh',
            studentNumber: `TEST-HIER-${Date.now().toString().slice(-4)}`,
            firstNameAr: 'علي',
            lastNameAr: 'الخطأ',
            firstNameEn: 'Ali',
            lastNameEn: 'Error',
            dateOfBirth: '2019-01-01',
            gender: 'male',
            nationality: 'سعودي',
            academicYearId: 'ay-riyadh-2026',
            stageId: 'stg-riyadh-sec', // Secondary Stage
            gradeId: 'grd-riyadh-p1', // Primary Grade 1 (MISMATCH!)
            classId: 'cls-riyadh-p1-a',
            guardian: {
              fullName: 'ولي أمر',
              relationship: 'father',
              phoneNumber: '0500000000',
            },
          });
          return { passed: false, message: 'فشل الفحص: تم السماح بتسكين غير متطابق هرمياً!' };
        } catch (e: any) {
          return {
            passed: true,
            message: `تم رصد عدم تطابق المرحلة والصف ورفضه بأمان: ${e.message}`,
          };
        }
      },
    },
    {
      id: 7,
      category: 'Enrollment',
      title: 'منع الربط المتقاطع بين الفروع (Cross-Branch Linkage Protection)',
      run: async () => {
        try {
          studentStorage.createStudentWithEnrollment(superAdminUser, {
            branchId: 'branch-riyadh',
            studentNumber: `TEST-CROSS-${Date.now().toString().slice(-4)}`,
            firstNameAr: 'خالد',
            lastNameAr: 'الفرع',
            firstNameEn: 'Khaled',
            lastNameEn: 'Branch',
            dateOfBirth: '2019-01-01',
            gender: 'male',
            nationality: 'سعودي',
            academicYearId: 'ay-jeddah-2026', // Jeddah year in Riyadh branch!
            stageId: 'stg-riyadh-pri',
            gradeId: 'grd-riyadh-p1',
            classId: 'cls-riyadh-p1-a',
            guardian: {
              fullName: 'ولي أمر',
              relationship: 'father',
              phoneNumber: '0500000000',
            },
          });
          return { passed: false, message: 'فشل الفحص: تم السماح بربط عام دراسي لفرع آخر!' };
        } catch (e: any) {
          return {
            passed: true,
            message: `تم منع الربط المتقاطع بين الفروع بنجاح: ${e.message}`,
          };
        }
      },
    },
    {
      id: 8,
      category: 'Enrollment',
      title: 'التحقق من سعة الفصل والاستيعاب (Class Capacity Check)',
      run: async () => {
        const classes = academicStorage.getRawClasses();
        const testClass = classes.find((c) => c.id === 'cls-riyadh-p1-a');
        const enrollments = studentStorage.getRawEnrollments();
        const activeCount = enrollments.filter(
          (e) => e.classId === 'cls-riyadh-p1-a' && (e.status === 'ENROLLED' || e.status === 'PROMOTED')
        ).length;

        return {
          passed: !!testClass && testClass.capacity > 0 && activeCount <= testClass.capacity,
          message: `فصل ${testClass?.nameAr}: السعة القصوى ${testClass?.capacity}، المقيدون حالياً ${activeCount}.`,
        };
      },
    },
    {
      id: 9,
      category: 'Enrollment',
      title: 'منع تجاوز السعة القصوى للفصل الدراسي (Capacity Limit Enforcement)',
      run: async () => {
        // Create temporary dummy class with capacity = 1
        const tempClassId = `cls-test-cap-${Date.now()}`;
        const tempClasses = academicStorage.getRawClasses();
        tempClasses.push({
          id: tempClassId,
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          stageId: 'stg-riyadh-pri',
          gradeId: 'grd-riyadh-p1',
          nameAr: 'فصل اختبار السعة',
          nameEn: 'Capacity Test Section',
          classCode: 'CAP-TEST',
          capacity: 1, // Only 1 student allowed
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        localStorage.setItem('sms_academic_classes_v4', JSON.stringify(tempClasses));

        // Register 1st student (Should succeed)
        studentStorage.createStudentWithEnrollment(superAdminUser, {
          branchId: 'branch-riyadh',
          studentNumber: `STU-CAP-1-${Date.now().toString().slice(-4)}`,
          firstNameAr: 'طالب',
          lastNameAr: 'أول',
          firstNameEn: 'First',
          lastNameEn: 'Student',
          dateOfBirth: '2019-01-01',
          gender: 'male',
          nationality: 'سعودي',
          academicYearId: 'ay-riyadh-2026',
          stageId: 'stg-riyadh-pri',
          gradeId: 'grd-riyadh-p1',
          classId: tempClassId,
          guardian: { fullName: 'ولي أمر', relationship: 'father', phoneNumber: '0501111111' },
        });

        // Register 2nd student into the same class (MUST BE REJECTED)
        try {
          studentStorage.createStudentWithEnrollment(superAdminUser, {
            branchId: 'branch-riyadh',
            studentNumber: `STU-CAP-2-${Date.now().toString().slice(-4)}`,
            firstNameAr: 'طالب',
            lastNameAr: 'ثان',
            firstNameEn: 'Second',
            lastNameEn: 'Student',
            dateOfBirth: '2019-01-01',
            gender: 'male',
            nationality: 'سعودي',
            academicYearId: 'ay-riyadh-2026',
            stageId: 'stg-riyadh-pri',
            gradeId: 'grd-riyadh-p1',
            classId: tempClassId,
            guardian: { fullName: 'ولي أمر', relationship: 'father', phoneNumber: '0502222222' },
          });
          return { passed: false, message: 'فشل الفحص: تم تسجيل طالب في فصل ممتلئ بالسعة القصوى!' };
        } catch (e: any) {
          return {
            passed: true,
            message: `تم منع التسجيل بنجاح لاكتمال سعة الفصل: ${e.message}`,
          };
        }
      },
    },
    {
      id: 10,
      category: 'Lifecycle',
      title: 'دورة حياة الطالب: تعليق القيد وتغيير الحالة إلى INACTIVE',
      run: async () => {
        const student = studentStorage.changeStudentStatus(
          superAdminUser,
          'stu-riyadh-003',
          'INACTIVE',
          'سفر عائلي مؤقت'
        );
        return {
          passed: student.status === 'INACTIVE',
          message: `تم تحويل حالة الطالب إلى INACTIVE وتعليق القيد بنجاح.`,
        };
      },
    },
    {
      id: 11,
      category: 'Lifecycle',
      title: 'دورة حياة الطالب: إعادة تفعيل القيد وانتظام الطالب إلى ACTIVE',
      run: async () => {
        const student = studentStorage.changeStudentStatus(
          superAdminUser,
          'stu-riyadh-003',
          'ACTIVE',
          'انتهاء فترة السفر والعودة للدراسة'
        );
        return {
          passed: student.status === 'ACTIVE',
          message: `تمت إعادة تفعيل قيد الطالب إلى ACTIVE بنجاح.`,
        };
      },
    },
    {
      id: 12,
      category: 'Lifecycle',
      title: 'أرشفة الطالب المصرح بها وسحب القيد الدراسي (Archive Student)',
      run: async () => {
        const tempStudent = studentStorage.createStudentWithEnrollment(superAdminUser, {
          branchId: 'branch-riyadh',
          studentNumber: `STU-ARCH-${Date.now().toString().slice(-4)}`,
          firstNameAr: 'طالب',
          lastNameAr: 'للأرشفة',
          firstNameEn: 'Archive',
          lastNameEn: 'Candidate',
          dateOfBirth: '2019-01-01',
          gender: 'male',
          nationality: 'سعودي',
          academicYearId: 'ay-riyadh-2026',
          stageId: 'stg-riyadh-pri',
          gradeId: 'grd-riyadh-p1',
          classId: 'cls-riyadh-p1-a',
          guardian: { fullName: 'ولي أمر', relationship: 'father', phoneNumber: '0509999999' },
        });

        const archived = studentStorage.archiveStudent(
          superAdminUser,
          tempStudent.id,
          'انتقال أسرة الطالب لخارج المدينة'
        );

        const enrollments = studentStorage.getRawEnrollments();
        const enr = enrollments.find((e) => e.studentId === tempStudent.id);

        return {
          passed: archived.status === 'ARCHIVED' && enr?.status === 'WITHDRAWN',
          message: `تمت أرشفة الطالب بنجاح وتحديث حالة القيد إلى WITHDRAWN مع توثيق السبب.`,
        };
      },
    },
    {
      id: 13,
      category: 'Enrollment',
      title: 'نقل الطالب إلى فصل آخر وتوثيق سجل التحويل (Class Section Transfer)',
      run: async () => {
        const targetStudent = studentStorage.getRawStudents().find((s) => s.id === 'stu-riyadh-001')!;
        const transferred = studentStorage.transferStudentClass(
          superAdminUser,
          targetStudent.id,
          'cls-riyadh-p1-b',
          'توزيع وتوازن الكثافة الصفية'
        );

        const enrollments = studentStorage.getRawEnrollments().filter((e) => e.studentId === targetStudent.id);
        const hasTransferredOld = enrollments.some((e) => e.status === 'TRANSFERRED');
        const hasEnrolledNew = enrollments.some((e) => e.status === 'ENROLLED' && e.classId === 'cls-riyadh-p1-b');

        return {
          passed: hasTransferredOld && hasEnrolledNew,
          message: `تم نقل الطالب بنجاح وتوثيق القيد السابق كـ TRANSFERRED والجديد كـ ENROLLED.`,
        };
      },
    },
    {
      id: 14,
      category: 'Guardians',
      title: 'إضافة ولي أمر جديد لطالب مسجل مسبقاً (Add Secondary Guardian)',
      run: async () => {
        const student = studentStorage.addGuardianToStudent(superAdminUser, 'stu-riyadh-002', {
          fullName: 'ابتسام السعيد',
          relationship: 'mother',
          phoneNumber: '0507788990',
          email: 'ebtisam@example.com',
          isPrimaryContact: false,
          isEmergencyContact: true,
        });

        const hasMother = student.guardians.some((g) => g.relationship === 'mother');
        return {
          passed: hasMother && student.guardians.length >= 2,
          message: `تمت إضافة ولي أمر إضافي للطالب برقم هاتف وتحديد كجهة طوارئ.`,
        };
      },
    },
    {
      id: 15,
      category: 'Guardians',
      title: 'إعادة تعيين جهة الاتصال الأساسية وضمان انفرادية الصفة (Single Primary)',
      run: async () => {
        const student = studentStorage.addGuardianToStudent(superAdminUser, 'stu-riyadh-002', {
          fullName: 'عمرو الشمري',
          relationship: 'uncle',
          phoneNumber: '0501234599',
          isPrimaryContact: true, // Make uncle primary!
          isEmergencyContact: false,
        });

        const primaryGuardians = student.guardians.filter((g) => g.isPrimaryContact);
        return {
          passed: primaryGuardians.length === 1 && primaryGuardians[0].relationship === 'uncle',
          message: `تم نقل صفة جهة الاتصال الأساسية بنجاح وضمان وجود جهة أساسية واحدة فقط.`,
        };
      },
    },
    {
      id: 16,
      category: 'Search & Security',
      title: 'البحث عن الطالب بالاسم العربي (Arabic Name Search)',
      run: async () => {
        const res = studentStorage.listStudents(superAdminUser, { search: 'ريان' });
        const found = res.students.some((s) => s.fullNameAr.includes('ريان'));
        return {
          passed: found && res.totalCount >= 1,
          message: `عثر محرك البحث على ${res.totalCount} طالب مطابق للاسم العربي "ريان".`,
        };
      },
    },
    {
      id: 17,
      category: 'Search & Security',
      title: 'البحث عن الطالب بالاسم الإنجليزي (English Name Search)',
      run: async () => {
        const res = studentStorage.listStudents(superAdminUser, { search: 'Noura' });
        const found = res.students.some((s) => s.fullNameEn.toLowerCase().includes('noura'));
        return {
          passed: found && res.totalCount >= 1,
          message: `عثر محرك البحث على ${res.totalCount} طالب مطابق للاسم الإنجليزي "Noura".`,
        };
      },
    },
    {
      id: 18,
      category: 'Search & Security',
      title: 'البحث بالرقم التعريفي للطالب (Student ID Number Search)',
      run: async () => {
        const res = studentStorage.listStudents(superAdminUser, { search: 'STU-2026-002' });
        const found = res.students.some((s) => s.studentNumber === 'STU-2026-002');
        return {
          passed: found && res.totalCount === 1,
          message: `تم العثور على الطالب بدقة بواسطة الرقم التعريفي STU-2026-002.`,
        };
      },
    },
    {
      id: 19,
      category: 'Search & Security',
      title: 'البحث برقم هاتف ولي الأمر (Guardian Phone Search)',
      run: async () => {
        const res = studentStorage.listStudents(superAdminUser, { search: '0501122334' });
        return {
          passed: res.totalCount >= 1,
          message: `تم العثور على الطالب المرتبط برقم هاتف ولي الأمر 0501122334 بنجاح.`,
        };
      },
    },
    {
      id: 20,
      category: 'Search & Security',
      title: 'الأمان وعزل الفروع: منع وصول المستخدم لطلاب فرع غير مصرح (Branch Security)',
      run: async () => {
        try {
          // riyadhManagerUser is NOT allowed to view or edit students in branch-jeddah
          studentStorage.listStudents(riyadhManagerUser, { branchId: 'branch-jeddah' });
          return { passed: false, message: 'فشل الفحص الأمني: تم السماح لمستخدم بالوصول لفرع غير مخصص له!' };
        } catch (e: any) {
          const audit = authStorage.getAuditLogs();
          const deniedLog = audit.find(
            (l) => l.action === 'UNAUTHORIZED_BRANCH_ACCESS' && l.actorId === riyadhManagerUser.id
          );
          return {
            passed: !!deniedLog,
            message: `تم التصدي لمحاولة الوصول غير المصرح لفرع جدة وتوثيق الحدث في سجل التدقيق الأمني.`,
          };
        }
      },
    },
    {
      id: 21,
      category: 'Search & Security',
      title: 'صلاحيات الأدوار: منع دور المشاهد من تسجيل أو تعديل طالب (RBAC Enforcement)',
      run: async () => {
        try {
          // viewerUser only has 'students.view', NO 'students.create'
          studentStorage.createStudentWithEnrollment(viewerUser, {
            branchId: 'branch-riyadh',
            firstNameAr: 'غير',
            lastNameAr: 'مصرح',
            firstNameEn: 'Not',
            lastNameEn: 'Authorized',
            dateOfBirth: '2019-01-01',
            gender: 'male',
            nationality: 'سعودي',
            academicYearId: 'ay-riyadh-2026',
            stageId: 'stg-riyadh-pri',
            gradeId: 'grd-riyadh-p1',
            classId: 'cls-riyadh-p1-a',
            guardian: { fullName: 'ولي أمر', relationship: 'father', phoneNumber: '0500000000' },
          });
          return { passed: false, message: 'فشل الصلاحيات: سُمح لمشاهد بتسجيل طالب!' };
        } catch (e: any) {
          return {
            passed: true,
            message: `تم رفض عملية التسجيل بنجاح لمطالبة الصلاحية: ${e.message}`,
          };
        }
      },
    },
    {
      id: 22,
      category: 'Search & Security',
      title: 'سجل التدقيق الأمني لعمليات الطلاب (Audit Trail Verification)',
      run: async () => {
        const audit = authStorage.getAuditLogs();
        const hasRegistered = audit.some((l) => l.action === 'STUDENT_REGISTERED');
        const hasStatus = audit.some((l) => l.action === 'STUDENT_STATUS_CHANGED' || l.action === 'STUDENT_TRANSFERRED');
        const hasArchived = audit.some((l) => l.action === 'STUDENT_ARCHIVED');

        return {
          passed: hasRegistered && hasStatus && hasArchived,
          message: `تم التحقق من توثيق كافة أحداث دورة حياة الطالب في سجل العمليات الأمني (Audit Logs).`,
        };
      },
    },
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});
    setProgress(0);

    const newResults: Record<number, { passed: boolean; message: string; details?: any }> = {};

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      try {
        const res = await test.run();
        newResults[test.id] = res;
      } catch (err: any) {
        newResults[test.id] = {
          passed: false,
          message: err.message || 'حدث استثناء غير معالج أثناء الاختبار',
        };
      }
      setTestResults({ ...newResults });
      setProgress(Math.round(((i + 1) / tests.length) * 100));
      // Brief yield for smooth UI animation
      await new Promise((r) => setTimeout(r, 60));
    }

    setIsRunning(false);
  };

  const totalPassed = Object.values(testResults).filter((r) => r.passed).length;
  const isCompleted = Object.keys(testResults).length === tests.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>الفحص والتحقق الآلي للمرحلة الخامسة (Phase 5 Verification)</span>
              {isCompleted && totalPassed === tests.length && (
                <Badge variant="success">100% Passed</Badge>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              22 اختباراً مؤتمتاً للتحقق من شؤون الطلاب، أولياء الأمور، التسكين الأكاديمي، الصلاحيات والأمان
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Progress Bar & Summary */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <span>نسبة الإنجاز: {progress}%</span>
              {isCompleted && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  ({totalPassed} من أصل {tests.length} فحص اجتاز بنجاح)
                </span>
              )}
            </div>
            <div className="w-full sm:w-64 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  totalPassed === tests.length ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTestResults({});
                setProgress(0);
              }}
              disabled={isRunning}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              إعادة تهيئة
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={runAllTests}
              isLoading={isRunning}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              {isCompleted ? 'إعادة الفحص الكامل' : 'تشغيل كافة الاختبارات'}
            </Button>
          </div>
        </div>

        {/* Tests List */}
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
          {tests.map((test) => {
            const res = testResults[test.id];
            return (
              <div
                key={test.id}
                className={`p-3 rounded-xl border transition-all ${
                  !res
                    ? 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                    : res.passed
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">
                      {!res ? (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                      ) : res.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          #{test.id}. {test.title}
                        </span>
                        <Badge variant="neutral" size="sm">
                          {test.category}
                        </Badge>
                      </div>
                      {res && (
                        <p
                          className={`text-[11px] mt-1 ${
                            res.passed
                              ? 'text-emerald-800 dark:text-emerald-300'
                              : 'text-red-700 dark:text-red-400'
                          }`}
                        >
                          {res.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-xs">
                    {res ? (
                      res.passed ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          اجتاز ✓
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-bold">
                          فشل ✗
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400">في الانتظار</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            إغلاق نافذة الفحص
          </Button>
        </div>
      </div>
    </Modal>
  );
};
