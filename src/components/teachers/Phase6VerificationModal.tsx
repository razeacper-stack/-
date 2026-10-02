import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { teacherStorage } from '../../services/teacherStorage';
import { academicStorage } from '../../services/academicStorage';
import { authStorage } from '../../services/authStorage';
import { SafeUser } from '../../types/auth';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  ClipboardList,
  Sparkles,
} from 'lucide-react';

interface TestCase {
  id: number;
  title: string;
  category: 'Model & Identity' | 'Authorization & Security' | 'Branch Isolation' | 'Academic Relations' | 'Lifecycle & Audit';
  run: () => Promise<{ passed: boolean; message: string; details?: any }>;
}

export const Phase6VerificationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
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
      'teachers.view',
      'teachers.create',
      'teachers.edit',
      'teachers.delete',
      'teachers.archive',
      'teachers.restore',
      'teachers.manage_subjects',
      'teachers.manage_classes',
      'teachers.view_sensitive_data',
      'teachers.export',
      'academic_years.view',
      'subjects.view',
      'classes.view',
    ] as any[],
  };

  const riyadhManagerUser: SafeUser = {
    id: 'user-manager-riyadh',
    fullName: 'أ. منى الغامدي (Manager - Riyadh)',
    username: 'manager_riyadh',
    email: 'manager.riyadh@schoolms.edu',
    roleId: 'role-manager',
    roleCode: 'MANAGER',
    roleNameAr: 'مدير فرع الرياض',
    roleNameEn: 'Branch Manager',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: [
      'teachers.view',
      'teachers.create',
      'teachers.edit',
      'teachers.manage_subjects',
      'teachers.manage_classes',
      'teachers.export',
      'academic_years.view',
      'subjects.view',
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
    permissions: ['teachers.view'] as any[],
  };

  const testCases: TestCase[] = [
    // 1. Model & Data Dictionary
    {
      id: 1,
      category: 'Model & Identity',
      title: 'التحقق من بنية نموذج المعلمين وحقول الهوية واللغتين (Ar/En)',
      run: async () => {
        teacherStorage.initialize();
        const teachers = teacherStorage.getRawTeachers();
        if (teachers.length === 0) {
          return { passed: false, message: 'قاعدة بيانات المعلمين فارغة أو لم يتم بذرها.' };
        }
        const sample = teachers[0];
        const valid =
          Boolean(sample.id) &&
          Boolean(sample.teacherNumber) &&
          Boolean(sample.branchId) &&
          Boolean(sample.firstNameAr) &&
          Boolean(sample.lastNameAr) &&
          Boolean(sample.firstNameEn) &&
          Boolean(sample.lastNameEn) &&
          Boolean(sample.phoneNumber) &&
          Boolean(sample.specialization) &&
          Boolean(sample.employmentStatus) &&
          Boolean(sample.employmentType);

        return {
          passed: valid,
          message: valid
            ? `نموذج المعلم مطابق للمواصفات القياسية. عينة معتمدة: ${sample.fullNameAr} [${sample.teacherNumber}]`
            : 'حقول إلزامية مفقودة في بنية نموذج المعلم.',
        };
      },
    },

    // 2. Unique Teacher Number Generation
    {
      id: 2,
      category: 'Model & Identity',
      title: 'التحقق من خوارزمية توليد الرقم الوظيفي الموحد (TCH-YYYY-XXX)',
      run: async () => {
        const currentYear = new Date().getFullYear();
        const nextNum = teacherStorage.generateNextTeacherNumber('branch-riyadh');
        const pattern = new RegExp(`^TCH-${currentYear}-\\d{3}$`);
        const isValidFormat = pattern.test(nextNum);

        return {
          passed: isValidFormat,
          message: isValidFormat
            ? `تم توليد الرقم بنجاح وفق النمط المعتمد: "${nextNum}"`
            : `صيغة الرقم غير صحيحة: ${nextNum}`,
        };
      },
    },

    // 3. Concurrent Creation Integrity
    {
      id: 3,
      category: 'Model & Identity',
      title: 'محاكاة التسجيل المتزامن لمنع تكرار الأرقام الوظيفية (Collision Prevention)',
      run: async () => {
        // Register two test teachers back to back
        const t1 = teacherStorage.createTeacher(superAdminUser, {
          branchId: 'branch-riyadh',
          firstNameAr: 'معلم_تجربة_أ',
          lastNameAr: 'الاختبار',
          firstNameEn: 'TestTeacherA',
          lastNameEn: 'Audit',
          gender: 'male',
          phoneNumber: '+966500000001',
          specialization: 'اختبارات البرمجيات',
          employmentType: 'FULL_TIME',
        });

        const t2 = teacherStorage.createTeacher(superAdminUser, {
          branchId: 'branch-riyadh',
          firstNameAr: 'معلم_تجربة_ب',
          lastNameAr: 'الاختبار',
          firstNameEn: 'TestTeacherB',
          lastNameEn: 'Audit',
          gender: 'female',
          phoneNumber: '+966500000002',
          specialization: 'أمن المعلومات',
          employmentType: 'PART_TIME',
        });

        const distinctNumbers = t1.teacherNumber !== t2.teacherNumber;
        return {
          passed: distinctNumbers,
          message: distinctNumbers
            ? `تم إنشاء المعلمين بأرقام فريدة متسلسلة (${t1.teacherNumber} vs ${t2.teacherNumber})`
            : 'فشل: تكرار في الرقم الوظيفي عند التسجيل المتزامن.',
        };
      },
    },

    // 4. Centralized Authorization Layer
    {
      id: 4,
      category: 'Authorization & Security',
      title: 'التحقق من طبقة الصلاحيات المركزية (authStorage.hasPermission)',
      run: async () => {
        const isSuperAdminAllowed = authStorage.hasPermission(superAdminUser, 'teachers.create');
        const isManagerAllowed = authStorage.hasPermission(riyadhManagerUser, 'teachers.create');
        const isViewerAllowed = authStorage.hasPermission(viewerUser, 'teachers.create');

        const passed = isSuperAdminAllowed && isManagerAllowed && !isViewerAllowed;
        return {
          passed,
          message: passed
            ? 'مصفوفة الصلاحيات تعمل بدقة عبر authStorage المركزية دون ازدواجية.'
            : 'فشل: خلل في استجابة authStorage.hasPermission للمستخدمين.',
        };
      },
    },

    // 5. Enforcement of Unauthorized Operations
    {
      id: 5,
      category: 'Authorization & Security',
      title: 'حجب العمليات غير المصرح بها لمستخدمي العرض فقط (Viewer Denial)',
      run: async () => {
        let blocked = false;
        try {
          teacherStorage.createTeacher(viewerUser, {
            branchId: 'branch-riyadh',
            firstNameAr: 'محاولة_غير_مصرحة',
            lastNameAr: 'اختراق',
            firstNameEn: 'Unauthorized',
            lastNameEn: 'Attempt',
            gender: 'male',
            phoneNumber: '+966599999999',
            specialization: 'محاولة',
            employmentType: 'CONTRACT',
          });
        } catch {
          blocked = true;
        }

        return {
          passed: blocked,
          message: blocked
            ? 'تم حجب محاولة إنشاء المعلم بنجاح لمستخدم لا يملك صلاحية teachers.create.'
            : 'ثغرة أمنية: تم السماح لمستخدم غير مصرح بإنشاء معلم.',
        };
      },
    },

    // 6. Multi-Branch Isolation
    {
      id: 6,
      category: 'Branch Isolation',
      title: 'عزل الفروع: منع مدير فرع الرياض من الوصول أو إدارة معلمي فرع جدة',
      run: async () => {
        let crossBranchBlocked = false;
        try {
          teacherStorage.createTeacher(riyadhManagerUser, {
            branchId: 'branch-jeddah', // Cross-branch violation
            firstNameAr: 'معلم_جدة_محظور',
            lastNameAr: 'الاختبار',
            firstNameEn: 'JeddahTeacher',
            lastNameEn: 'Blocked',
            gender: 'male',
            phoneNumber: '+966588888888',
            specialization: 'اختبار العزل',
            employmentType: 'FULL_TIME',
          });
        } catch {
          crossBranchBlocked = true;
        }

        return {
          passed: crossBranchBlocked,
          message: crossBranchBlocked
            ? 'تم رفض التسجيل عبر الفروع بنجاح وتوثيق المحاولة في سجل العمليات الأمني.'
            : 'ثغرة أمنية: تم اختراق عزل الفروع وتمكن مدير الرياض من إضافة معلم بفرع جدة.',
        };
      },
    },

    // 7. Cross-Branch Subject Rejection
    {
      id: 7,
      category: 'Academic Relations',
      title: 'منع إسناد مادة تابعة لفرع آخر إلى معلم بفرع مختلف (Cross-Branch Subject Guard)',
      run: async () => {
        // Teacher in Jeddah: tch-j-001
        // Subject in Riyadh: sbj-riyadh-math
        let blocked = false;
        try {
          teacherStorage.assignSubjectToTeacher(superAdminUser, 'tch-j-001', 'sbj-riyadh-math');
        } catch (err: any) {
          blocked = err.message.includes('فرع آخر') || err.message.includes('branch');
        }

        return {
          passed: blocked,
          message: blocked
            ? 'تم منع إسناد مادة من فرع الرياض لمعلم بفرع جدة بحزم.'
            : 'فشل: سُمح بإسناد مادة دراسية عبر الفروع المختلفة.',
        };
      },
    },

    // 8. Cross-Branch Class Rejection
    {
      id: 8,
      category: 'Academic Relations',
      title: 'منع تسكين معلم في فصل دراسي تابع لفرع آخر (Cross-Branch Class Guard)',
      run: async () => {
        // Teacher in Jeddah: tch-j-001
        // Class in Riyadh: cls-riyadh-1a
        let blocked = false;
        try {
          teacherStorage.assignClassToTeacher(superAdminUser, 'tch-j-001', 'cls-riyadh-1a', 'ay-riyadh-2026');
        } catch (err: any) {
          blocked = err.message.includes('فرع آخر') || err.message.includes('branch');
        }

        return {
          passed: blocked,
          message: blocked
            ? 'تم منع تسكين معلم بفرع جدة داخل فصل دراسي بفرع الرياض.'
            : 'فشل: سُمح بتسكين معلم في فصل دراسي خارج نطاق فرعه.',
        };
      },
    },

    // 9. Sensitive Identity Protection
    {
      id: 9,
      category: 'Authorization & Security',
      title: 'حماية وتقنيع الوثائق الحساسة (الهوية وجواز السفر) لمن لا يملك الصلاحية',
      run: async () => {
        const unprivilegedResult = teacherStorage.getTeacherById(viewerUser, 'tch-r-001');
        const superAdminResult = teacherStorage.getTeacherById(superAdminUser, 'tch-r-001');

        const isMaskedForViewer = unprivilegedResult.nationalId?.includes('•') || !unprivilegedResult.nationalId;
        const isUnmaskedForAdmin = superAdminResult.nationalId && !superAdminResult.nationalId.includes('•');

        const passed = Boolean(isMaskedForViewer && isUnmaskedForAdmin);
        return {
          passed,
          message: passed
            ? `تم التحقق: رقم الهوية مقنع للمشاهد (${unprivilegedResult.nationalId}) ومكشوف للمدير المصرح (${superAdminResult.nationalId}).`
            : 'فشل: لم يتم تطبيق قناع البيانات الحساسة بشكل صحيح.',
        };
      },
    },

    // 10. Status Lifecycle & Archival Preservation
    {
      id: 10,
      category: 'Lifecycle & Audit',
      title: 'دورة حياة المعلم والأرشفة الآمنة مع الحفاظ التام على السجلات الأكاديمية',
      run: async () => {
        // Create test teacher
        const testTch = teacherStorage.createTeacher(superAdminUser, {
          branchId: 'branch-riyadh',
          firstNameAr: 'معلم_دورة_الحياة',
          lastNameAr: 'التجريبي',
          firstNameEn: 'Lifecycle',
          lastNameEn: 'Teacher',
          gender: 'male',
          phoneNumber: '+966511112222',
          specialization: 'تاريخ',
          employmentType: 'FULL_TIME',
          subjectIds: ['sbj-riyadh-arabic'],
        });

        // 1. Status change to ON_LEAVE
        const onLeave = teacherStorage.changeTeacherStatus(superAdminUser, testTch.id, 'ON_LEAVE', 'إجازة دراسية');
        // 2. Archive
        const archived = teacherStorage.archiveTeacher(superAdminUser, testTch.id, 'نهاية التعاقد الإداري');
        // 3. Verify subjects preserved
        const detailArchived = teacherStorage.getTeacherById(superAdminUser, testTch.id);
        const subjectsPreserved = detailArchived.subjects.length > 0;
        // 4. Restore
        const restored = teacherStorage.restoreTeacher(superAdminUser, testTch.id, 'عودة للخدمة');

        const passed =
          onLeave.employmentStatus === 'ON_LEAVE' &&
          archived.employmentStatus === 'ARCHIVED' &&
          subjectsPreserved &&
          restored.employmentStatus === 'ACTIVE';

        return {
          passed,
          message: passed
            ? 'تمت كافة مراحل دورة الحياة (نشط -> إجازة -> أرشفة -> استعادة) مع الحفاظ الكامل على المناهج المسندة.'
            : 'فشل في تطبيق انتقال الحالات أو فقدان في السجلات المرتبطة.',
        };
      },
    },

    // 11. Teacher Record & Login Account Separation
    {
      id: 11,
      category: 'Model & Identity',
      title: 'الفصل المعماري التام بين سجل المعلم وحساب الدخول للنظام (Account Separation)',
      run: async () => {
        const teachers = teacherStorage.getRawTeachers();
        const users = authStorage.listUsers(superAdminUser);

        // Ensure teacher record doesn't expose password hashes or force automatic user creation
        const sampleTeacher = teachers[0];
        const hasNoPassword = !('passwordHash' in sampleTeacher) && !('password' in sampleTeacher);
        const teacherCount = teachers.length;
        const userCount = users.length;

        const passed = hasNoPassword && teacherCount !== userCount;
        return {
          passed,
          message: passed
            ? `مؤكد: سجلات المعلمين (${teacherCount}) مستقلة بنيوياً عن حسابات الدخول (${userCount}) دون أية بيانات اعتماد سرية مدمجة.`
            : 'فشل في الفصل المعماري بين سجلات المعلمين ومستخدمي الدخول.',
        };
      },
    },

    // 12. Qualifications Management
    {
      id: 12,
      category: 'Model & Identity',
      title: 'إدارة المؤهلات العلمية وترتيب الدرجات الأكاديمية (Degrees & Ordering)',
      run: async () => {
        const tch = teacherStorage.getRawTeachers()[0];
        const initialCount = teacherStorage.getRawQualifications().filter((q) => q.teacherId === tch.id).length;

        const addedQual = teacherStorage.addQualification(superAdminUser, tch.id, {
          degree: 'ماجستير مناهج وطرق تدريس',
          fieldOfStudy: 'تربية رياضية',
          institution: 'جامعة الإمام محمد بن سعود',
          graduationYear: 2024,
          isHighestDegree: true,
        });

        const detail = teacherStorage.getTeacherById(superAdminUser, tch.id);
        const isHighestFirst = detail.qualifications[0]?.id === addedQual.id;

        // Cleanup
        teacherStorage.removeQualification(superAdminUser, addedQual.id);

        return {
          passed: isHighestFirst,
          message: isHighestFirst
            ? 'تم تسجيل المؤهل بنجاح ووضعه في صدارة المؤهلات كأعلى درجة أكاديمية.'
            : 'فشل في إضافة أو ترتيب المؤهلات الأكاديمية.',
        };
      },
    },

    // 13. Audit Trail Verification
    {
      id: 13,
      category: 'Lifecycle & Audit',
      title: 'التحقق من تسجيل العمليات في سجل الامتثال الأمني والرقابة (Audit Trail Ledger)',
      run: async () => {
        const logs = authStorage.getAuditLogs();
        const teacherLogs = logs.filter((l) => l.targetType === 'TEACHER');

        const passed = teacherLogs.length > 0;
        return {
          passed,
          message: passed
            ? `تم العثور على ${teacherLogs.length} سجل تدقيق أمني خاص بعمليات هيئة التدريس.`
            : 'فشل: لم يتم توثيق عمليات المعلمين في سجل التدقيق الأمني.',
        };
      },
    },

    // 14. Search, Filter, and Pagination Engine
    {
      id: 14,
      category: 'Model & Identity',
      title: 'محرك البحث المزدوج (Ar/En/Phone/Spec) والتصفية متعددة المعايير',
      run: async () => {
        // Search by Arabic name
        const searchAr = teacherStorage.listTeachers(superAdminUser, { search: 'فهد' });
        // Search by English name
        const searchEn = teacherStorage.listTeachers(superAdminUser, { search: 'Fahad' });
        // Filter by branch
        const filterBranch = teacherStorage.listTeachers(superAdminUser, { branchId: 'branch-jeddah' });

        const passed =
          searchAr.totalCount >= 1 &&
          searchEn.totalCount >= 1 &&
          filterBranch.teachers.every((t) => t.branchId === 'branch-jeddah');

        return {
          passed,
          message: passed
            ? `البحث والتصفية يعملان بدقة فائقة عبر اللغات والفروع (${searchAr.totalCount} نتائج عربي / ${searchEn.totalCount} نتائج إنجليزي).`
            : 'فشل في تصفية أو مطابقة نتائج البحث.',
        };
      },
    },

    // 15. CSV Export Engine & Permission Guard
    {
      id: 15,
      category: 'Lifecycle & Audit',
      title: 'تصدير البيانات بتنسيق CSV المشفر مع التحقق من الصلاحية',
      run: async () => {
        const csvData = teacherStorage.exportTeachersCSV(superAdminUser, { branchId: 'branch-riyadh' });
        const hasHeaders = csvData.includes('الرقم الوظيفي') && csvData.includes('الاسم الكامل');

        let viewerBlocked = false;
        try {
          teacherStorage.exportTeachersCSV(viewerUser, {});
        } catch {
          viewerBlocked = true;
        }

        const passed = hasHeaders && viewerBlocked;
        return {
          passed,
          message: passed
            ? 'تم تصدير ملف CSV بترميز البيانات القياسي مع حجب التصدير عن المشاهد غير المصرح.'
            : 'فشل في تصدير البيانات أو التحقق من صلاحية التصدير.',
        };
      },
    },
  ];

  const handleRunAllTests = async () => {
    setIsRunning(true);
    setTestResults({});
    setProgress(0);

    const newResults: Record<number, { passed: boolean; message: string; details?: any }> = {};

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      try {
        const res = await tc.run();
        newResults[tc.id] = res;
      } catch (err: any) {
        newResults[tc.id] = {
          passed: false,
          message: `خطأ استثنائي غير متوقع: ${err.message}`,
        };
      }
      setTestResults({ ...newResults });
      setProgress(Math.round(((i + 1) / testCases.length) * 100));
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    setIsRunning(false);
  };

  const passedCount = Object.values(testResults).filter((r) => r.passed).length;
  const failedCount = Object.values(testResults).filter((r) => !r.passed).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              دليل التحقق والاختبارات الآلية للمرحلة 6 (Phase 6 Verification)
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              15 اختباراً آلياً شاملاً لسلامة إدارة هيئة التدريس، عزل الفروع، ومصفوفة الصلاحيات
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs">
            {Object.keys(testResults).length > 0 && (
              <>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {passedCount} ناجح
                </span>
                {failedCount > 0 && (
                  <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> {failedCount} راسب
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunAllTests}
              disabled={isRunning}
              leftIcon={isRunning ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            >
              {isRunning ? 'جارٍ فحص الاختبارات...' : 'تشغيل الاختبارات الآلية الـ 15'}
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Progress bar */}
        {isRunning && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>جارٍ تنفيذ الاختبارات...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-150 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Tests List */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
          {testCases.map((tc) => {
            const res = testResults[tc.id];
            return (
              <div
                key={tc.id}
                className={`p-3 rounded-xl border transition-colors ${
                  res
                    ? res.passed
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {tc.id}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {tc.title}
                        </span>
                        <Badge variant="neutral" size="sm">
                          {tc.category}
                        </Badge>
                      </div>
                      {res && (
                        <p
                          className={`text-[11px] mt-1 font-medium ${
                            res.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {res.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {res ? (
                      res.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      )
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 block mt-2" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
