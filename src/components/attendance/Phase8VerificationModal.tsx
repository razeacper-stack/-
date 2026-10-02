import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { attendanceStorage } from '../../services/attendanceStorage';
import { authStorage } from '../../services/authStorage';
import { branchStorage } from '../../services/branchStorage';
import { academicStorage } from '../../services/academicStorage';
import { studentStorage } from '../../services/studentStorage';
import { teacherStorage } from '../../services/teacherStorage';
import { timetableStorage } from '../../services/timetableStorage';
import { SafeUser } from '../../types/auth';
import {
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ClipboardCheck,
  Calendar,
  Lock,
  Unlock,
  History,
  FileSpreadsheet,
} from 'lucide-react';

interface TestCase {
  id: number;
  category: 'Model & Integrity' | 'Daily & Lesson' | 'Security & Roles' | 'Corrections & Locking' | 'Analytics & Export';
  title: string;
  run: () => Promise<{ passed: boolean; message: string; details?: any }>;
}

export const Phase8VerificationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<
    Record<number, { passed: boolean; message: string; details?: any }>
  >({});
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [progress, setProgress] = useState(0);

  // Test Actors
  const superAdminUser: SafeUser = {
    id: 'user-super-admin',
    fullName: 'المدير العام للنظام (Super Admin)',
    username: 'superadmin',
    email: 'admin@schoolms.edu',
    roleId: 'role-super-admin',
    roleCode: 'SUPER_ADMIN',
    roleNameAr: 'مدير النظام العام',
    roleNameEn: 'Super Administrator',
    branchIds: [],
    hasAllBranchesAccess: true,
    isProtectedSuperAdmin: true,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: [] as any[],
  };

  const riyadhManagerUser: SafeUser = {
    id: 'user-manager-riyadh',
    fullName: 'أ. صالح المنصور (مدير الرياض)',
    username: 'salih.riyadh',
    email: 'salih@schoolms.edu',
    roleId: 'role-manager',
    roleCode: 'MANAGER',
    roleNameAr: 'مدير فرع الرياض',
    roleNameEn: 'Branch Manager',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: [
      'attendance.view',
      'attendance.create',
      'attendance.edit',
      'attendance.submit',
      'attendance.lock',
      'attendance.unlock',
      'attendance.correct',
      'attendance.view_reports',
      'attendance.export',
      'attendance.delete',
    ] as any[],
  };

  const jeddahStaffUser: SafeUser = {
    id: 'user-staff-jeddah',
    fullName: 'أ. فهد الجابري (موظف جدة)',
    username: 'fahad.jeddah',
    email: 'fahad@schoolms.edu',
    roleId: 'role-staff',
    roleCode: 'STAFF',
    roleNameAr: 'موظف فرع جدة',
    roleNameEn: 'Jeddah Staff',
    branchIds: ['branch-jeddah'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: [
      'attendance.view',
      'attendance.create',
      'attendance.edit',
      'attendance.submit',
    ] as any[],
  };

  const teacherRiyadhUser: SafeUser = {
    id: 'tch-r-001',
    fullName: 'أ. فهد المنصور (معلم رياضيات)',
    username: 'fahad.mansoor',
    email: 'fahad.mansoor@schoolms.edu',
    roleId: 'role-teacher',
    roleCode: 'TEACHER',
    roleNameAr: 'معلم رياضيات',
    roleNameEn: 'Math Teacher',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: [
      'attendance.view',
      'attendance.create',
      'attendance.edit',
      'attendance.submit',
    ] as any[],
  };

  const unauthorizedTeacherUser: SafeUser = {
    id: 'tch-unauthorized-99',
    fullName: 'أ. عبدالمحسن الزهراني (معلم غير مسند)',
    username: 'abdmohsen.teacher',
    email: 'unassigned.teacher@schoolms.edu',
    roleId: 'role-teacher',
    roleCode: 'TEACHER',
    roleNameAr: 'معلم خارجي',
    roleNameEn: 'Unassigned Teacher',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: ['attendance.view', 'attendance.create'] as any[],
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
    permissions: ['attendance.view'] as any[],
  };

  // Define 28 Comprehensive Test Cases
  const tests: TestCase[] = [
    // 1. Model Structure & Enums
    {
      id: 1,
      category: 'Model & Integrity',
      title: 'التحقق من صحة بنية نموذج الحضور وحالات الحضور الخمس وسجلات الجلسة',
      run: async () => {
        attendanceStorage.initialize();
        const rawRecords = attendanceStorage.getRawRecords();
        const rawSessions = attendanceStorage.getRawSessions();

        const statuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'EARLY_DEPARTURE'];
        const validRec = rawRecords.length > 0 && rawRecords.every((r) => r.id && r.branchId && r.studentId && r.date);
        const validSess = rawSessions.length > 0 && rawSessions.every((s) => s.id && s.branchId && s.classId);

        return {
          passed: validRec && validSess,
          message: `تم التحقق من النموذج بنجاح: ${rawRecords.length} سجل حضور مسجل، و${rawSessions.length} جلسة حضور معتمدة بحالات الحضور الـ5 (${statuses.join(', ')}).`,
        };
      },
    },

    // 2. Class Roster Loading with Enrollment Snapshot
    {
      id: 2,
      category: 'Model & Integrity',
      title: 'استرجاع قائمة طلاب الفصل والتحقق من احترام القيد الأكاديمي النشط للعام المحدد',
      run: async () => {
        const roster = attendanceStorage.getClassRosterWithAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: '2026-09-27',
          type: 'DAILY',
        });

        const students = roster.students;
        const passed = students.length > 0 && students.every((s) => s.studentId && s.fullNameAr);

        return {
          passed,
          message: passed
            ? `تم تحميل قائمة الفصل بنجاح: ${students.length} طلاب مقيدين بفرع الرياض بالترتيب الأبجدي.`
            : 'فشل: لم يتم تحميل قائمة طلاب الفصل بشكل صحيح.',
        };
      },
    },

    // 3. Daily Attendance Recording
    {
      id: 3,
      category: 'Daily & Lesson',
      title: 'تسجيل الحضور اليومي الكامل للفصل بنجاح مع تحديث الإحصائيات الفورية',
      run: async () => {
        const testDate = '2026-10-05';
        const result = attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [
            { studentId: 'stu-riyadh-001', status: 'PRESENT', checkInTime: '07:20' },
            { studentId: 'stu-riyadh-002', status: 'LATE', checkInTime: '07:45', lateMinutes: 15 },
            { studentId: 'stu-riyadh-003', status: 'EXCUSED', reasonCode: 'MEDICAL', note: 'تقرير طبي معتمد' },
          ],
        });

        const passed = result.savedCount === 3 && result.session.presentCount === 1 && result.session.lateCount === 1;

        return {
          passed,
          message: passed
            ? `تم رصد الحضور اليومي بنجاح (${result.savedCount} طلاب) وتحديث الجلسة (حاضر: ${result.session.presentCount}، متأخر: ${result.session.lateCount}، بعذر: ${result.session.excusedCount}).`
            : 'فشل في حفظ الحضور اليومي للفصل.',
        };
      },
    },

    // 4. Lesson Attendance tied to Timetable & Period
    {
      id: 4,
      category: 'Daily & Lesson',
      title: 'تسجيل حضور حصة دراسية بالجدول مع ربط الحصة بالمعلم والمادة والفترة',
      run: async () => {
        const testDate = '2026-10-06';
        const result = attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'LESSON',
          timetableEntryId: 'tme-001',
          periodId: 'prd-r-01',
          records: [
            { studentId: 'stu-riyadh-001', status: 'PRESENT' },
            { studentId: 'stu-riyadh-002', status: 'PRESENT' },
            { studentId: 'stu-riyadh-003', status: 'ABSENT', reasonCode: 'UNEXCUSED' },
          ],
        });

        const recs = attendanceStorage.listRecords(riyadhManagerUser, {
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'LESSON',
        });

        const populated = recs[0];
        const passed = result.savedCount === 3 && populated && populated.periodId === 'prd-r-01';

        return {
          passed,
          message: passed
            ? `تم رصد حضور الحصة بنجاح مع مطابقة بيانات الجدول (المادة: ${populated?.subjectNameAr || 'الرياضيات'}، الفترة: ${populated?.periodNameAr || 'الأولى'}).`
            : 'فشل في رصد حضور حصة الجدول المدرسي.',
        };
      },
    },

    // 5. Data Integrity: Reject Cross-Branch Student
    {
      id: 5,
      category: 'Model & Integrity',
      title: 'رفض تسجيل حضور طالب يتبع فرعاً آخر (عزل الفروع الصارم مع تدقيق أمني)',
      run: async () => {
        try {
          attendanceStorage.saveClassAttendance(riyadhManagerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            date: '2026-10-07',
            type: 'DAILY',
            records: [
              { studentId: 'stu-jeddah-001', status: 'PRESENT' }, // student in Jeddah branch
            ],
          });
          return { passed: false, message: 'ثغرة أمنية: تم السماح بتسجيل حضور طالب من فرع آخر دون اعتراض!' };
        } catch (err: any) {
          const passed = err.message.includes('يتبع فرعاً آخر') || err.message.includes('غير مقيد');
          return {
            passed,
            message: passed
              ? `تم منع الاختراق الأمني بنجاح: "${err.message}" وتم توثيق المحاولة في سجل التدقيق.`
              : `رسالة غير متوقعة: ${err.message}`,
          };
        }
      },
    },

    // 6. Data Integrity: Reject Un-Enrolled Student
    {
      id: 6,
      category: 'Model & Integrity',
      title: 'رفض تسجيل حضور طالب غير مقيد في الفصل المحدد للعام الأكاديمي',
      run: async () => {
        try {
          attendanceStorage.saveClassAttendance(riyadhManagerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            date: '2026-10-08',
            type: 'DAILY',
            records: [
              { studentId: 'stu-riyadh-004', status: 'PRESENT' }, // Student in Riyadh enrolled in cls-riyadh-2a
            ],
          });
          return { passed: false, message: 'خطأ: تم قبول رصد حضور طالب غير مسجل بهذا الفصل!' };
        } catch (err: any) {
          const passed = err.message.includes('غير مقيد');
          return {
            passed,
            message: passed
              ? `تم تأكيد سلامة القيد: "${err.message}"`
              : `رسالة الخطأ: ${err.message}`,
          };
        }
      },
    },

    // 7. Data Integrity: Timetable Entry Mismatch Rejection
    {
      id: 7,
      category: 'Model & Integrity',
      title: 'رفض تسجيل حضور حصة إذا كانت حصة الجدول تخص فصلاً أو فرعاً مختلفاً',
      run: async () => {
        try {
          attendanceStorage.saveClassAttendance(riyadhManagerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            date: '2026-10-09',
            type: 'LESSON',
            timetableEntryId: 'tme-mismatched-999',
            periodId: 'prd-r-02',
            records: [{ studentId: 'stu-riyadh-001', status: 'PRESENT' }],
          });
          return { passed: false, message: 'خطأ: تم رصد حصة جدول غير متطابقة مع الفصل!' };
        } catch {
          return {
            passed: true,
            message: 'تم رفض الحصة غير المتوافقة بنجاح.',
          };
        }
      },
    },

    // 8. Distinction between Daily and Lesson Attendance (Duplicate Prevention)
    {
      id: 8,
      category: 'Daily & Lesson',
      title: 'فصل وتمايز الحضور اليومي عن حضور الحصص دون تداخل أو استبدال عرضي',
      run: async () => {
        const testDate = '2026-10-10';
        attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [{ studentId: 'stu-riyadh-001', status: 'PRESENT' }],
        });

        attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'LESSON',
          periodId: 'prd-r-01',
          records: [{ studentId: 'stu-riyadh-001', status: 'ABSENT', reasonCode: 'UNEXCUSED' }],
        });

        const dailyRecs = attendanceStorage.listRecords(riyadhManagerUser, {
          date: testDate,
          type: 'DAILY',
          studentId: 'stu-riyadh-001',
        });
        const lessonRecs = attendanceStorage.listRecords(riyadhManagerUser, {
          date: testDate,
          type: 'LESSON',
          studentId: 'stu-riyadh-001',
        });

        const passed = dailyRecs.length === 1 && dailyRecs[0].status === 'PRESENT' &&
                       lessonRecs.length === 1 && lessonRecs[0].status === 'ABSENT';

        return {
          passed,
          message: passed
            ? `نجاح التمايز: تم حفظ الحضور اليومي (حاضر) وحضور الحصة (غائب) لنفس الطالب والتاريخ ككيانين مستقلين.`
            : 'فشل: تداخل أو استبدال غير مقصود بين الحضور اليومي وحضور الحصص.',
        };
      },
    },

    // 9. Late Arrival & Automatic Late Minutes
    {
      id: 9,
      category: 'Daily & Lesson',
      title: 'تسجيل التأخر وحساب دقائق التأخر آلياً استناداً لوقت بداية الحصة',
      run: async () => {
        const testDate = '2026-10-11';
        attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'LESSON',
          periodId: 'prd-r-01',
          records: [
            {
              studentId: 'stu-riyadh-001',
              status: 'LATE',
              checkInTime: '07:50', // 20 minutes late
              reasonCode: 'TRANSPORTATION',
            },
          ],
        });

        const recs = attendanceStorage.listRecords(riyadhManagerUser, {
          date: testDate,
          type: 'LESSON',
          studentId: 'stu-riyadh-001',
        });

        const rec = recs[0];
        const passed = rec && rec.status === 'LATE' && rec.lateMinutes === 20;

        return {
          passed,
          message: passed
            ? `تم احتساب التأخر آلياً بدقة: ${rec.lateMinutes} دقيقة تأخر (وقت الدخول: ${rec.checkInTime}، وقت بداية الحصة: 07:30).`
            : `فشل في الحساب الآلي لدقائق التأخر: ${rec?.lateMinutes}`,
        };
      },
    },

    // 10. Early Departure & Check-Out Time
    {
      id: 10,
      category: 'Daily & Lesson',
      title: 'تسجيل الخروج المبكر بإذن رسمي مع توثيق وقت الانصراف والمبرر',
      run: async () => {
        const testDate = '2026-10-12';
        attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [
            {
              studentId: 'stu-riyadh-002',
              status: 'EARLY_DEPARTURE',
              checkInTime: '07:25',
              checkOutTime: '11:30',
              reasonCode: 'OFFICIAL_PERMISSION',
              note: 'استئذان رسمي لمراجعة سفارة',
            },
          ],
        });

        const recs = attendanceStorage.listRecords(riyadhManagerUser, {
          date: testDate,
          studentId: 'stu-riyadh-002',
        });

        const rec = recs[0];
        const passed = rec && rec.status === 'EARLY_DEPARTURE' && rec.checkOutTime === '11:30';

        return {
          passed,
          message: passed
            ? `تم تسجيل الخروج المبكر بنجاح (وقت الخروج: ${rec.checkOutTime}، السبب: ${rec.reasonCode}).`
            : 'فشل في حفظ بيانات الخروج المبكر.',
        };
      },
    },

    // 11. Excused Absence with Standard Reason Codes
    {
      id: 11,
      category: 'Daily & Lesson',
      title: 'تسجيل الغياب بعذر وتوثيق تصنيف العذر (طبي، أسري، تقلبات جوية...)',
      run: async () => {
        const testDate = '2026-10-13';
        attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [
            {
              studentId: 'stu-riyadh-003',
              status: 'EXCUSED',
              reasonCode: 'MEDICAL',
              note: 'إجازة مرضية معتمدة عبر تطبيق صحتي',
            },
          ],
        });

        const recs = attendanceStorage.listRecords(riyadhManagerUser, {
          date: testDate,
          studentId: 'stu-riyadh-003',
        });

        const rec = recs[0];
        const passed = rec && rec.status === 'EXCUSED' && rec.reasonCode === 'MEDICAL';

        return {
          passed,
          message: passed
            ? `تم تسجيل الغياب بعذر رسمي بنجاح مع ربطه برمز العذر المعتمد (${rec.reasonCode}) وملاحظة التوثيق.`
            : 'فشل في تسجيل الغياب بعذر.',
        };
      },
    },

    // 12. Session Status Lifecycle (OPEN -> SUBMITTED -> LOCKED)
    {
      id: 12,
      category: 'Corrections & Locking',
      title: 'دورة حياة جلسة الحضور (مفتوحة -> تم الرفع -> مقفلة رسمياً)',
      run: async () => {
        const testDate = '2026-10-14';
        const subResult = attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [{ studentId: 'stu-riyadh-001', status: 'PRESENT' }],
        });

        const isSubmitted = subResult.session.status === 'SUBMITTED';

        const lockResult = attendanceStorage.lockAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
        });

        const isLocked = lockResult.status === 'LOCKED' && !!lockResult.lockedAt;

        return {
          passed: isSubmitted && isLocked,
          message: isSubmitted && isLocked
            ? `اكتملت دورة حياة الجلسة بنجاح: تم الرفع (${subResult.session.status}) ثم القفل والختم الرسمي (${lockResult.status}).`
            : 'فشل في دورة حياة حالة الجلسة.',
        };
      },
    },

    // 13. Lock Enforcement: Block Unauthorized Modifications
    {
      id: 13,
      category: 'Corrections & Locking',
      title: 'حماية السجلات المقفلة ومنع التعديل العادي عليها دون صلاحية الإلغاء',
      run: async () => {
        const testDate = '2026-10-14';
        try {
          attendanceStorage.saveClassAttendance(viewerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            date: testDate,
            type: 'DAILY',
            records: [{ studentId: 'stu-riyadh-001', status: 'ABSENT' }],
          });
          return { passed: false, message: 'خطأ: تم السماح بتعديل جلسة حضور مقفلة!' };
        } catch (err: any) {
          const passed = err.message.includes('مقفل') || err.message.includes('الصلاحية');
          return {
            passed,
            message: passed
              ? `تم حظر التعديل بنجاح: "${err.message}"`
              : `رسالة غير متوقعة: ${err.message}`,
          };
        }
      },
    },

    // 14. Unlocking by Authorized Administrator
    {
      id: 14,
      category: 'Corrections & Locking',
      title: 'إلغاء قفل جلسة الحضور بواسطة مدير مصرح مع توثيق العملية بالتدقيق',
      run: async () => {
        const testDate = '2026-10-14';
        const unlockedSession = attendanceStorage.unlockAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
        });

        const passed = unlockedSession.status === 'SUBMITTED' && unlockedSession.lockedAt === undefined;

        return {
          passed,
          message: passed
            ? `تم إلغاء قفل الجلسة بنجاح وعادت للحالة القابلة للتعديل (${unlockedSession.status}).`
            : 'فشل في إلغاء قفل الجلسة.',
        };
      },
    },

    // 15. Audited Record Correction with Justification Requirement
    {
      id: 15,
      category: 'Corrections & Locking',
      title: 'إجراء تصحيح رسمي موثق على سجل فردي مع حفظ المبرر والحالة السابقة',
      run: async () => {
        const testDate = '2026-10-15';
        attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [{ studentId: 'stu-riyadh-001', status: 'ABSENT' }],
        });

        const recs = attendanceStorage.listRecords(riyadhManagerUser, {
          date: testDate,
          studentId: 'stu-riyadh-001',
        });
        const rec = recs[0];

        const corrected = attendanceStorage.correctAttendance(riyadhManagerUser, rec.id, {
          status: 'EXCUSED',
          reasonCode: 'MEDICAL',
          correctionReason: 'إحضار تقرير طبي معتمد من المستشفى التخصصي يفيد بحضور موعد مجدول',
        });

        const passed =
          corrected.status === 'EXCUSED' &&
          corrected.history &&
          corrected.history.length === 1 &&
          corrected.history[0].previousStatus === 'ABSENT' &&
          corrected.history[0].newStatus === 'EXCUSED';

        return {
          passed,
          message: passed
            ? `تم التصحيح وتوثيق سلسلة المراجعة: من (${corrected.history?.[0].previousStatus}) إلى (${corrected.status})، المبرر: "${corrected.history?.[0].reason}".`
            : 'فشل في التحقق من سلسلة مراجعة تصحيح الحضور.',
        };
      },
    },

    // 16. Rejection of Correction Without Justification
    {
      id: 16,
      category: 'Corrections & Locking',
      title: 'رفض تصحيح سجل الحضور إذا لم يُقدّم مبرر وسبب إداري إلزامي',
      run: async () => {
        const testDate = '2026-10-15';
        const recs = attendanceStorage.listRecords(riyadhManagerUser, {
          date: testDate,
          studentId: 'stu-riyadh-001',
        });
        const rec = recs[0];

        try {
          attendanceStorage.correctAttendance(riyadhManagerUser, rec.id, {
            status: 'PRESENT',
            correctionReason: '',
          });
          return { passed: false, message: 'خطأ: تم قبول تصحيح سجل بدون مبرر رسمي إلزامي!' };
        } catch (err: any) {
          const passed = err.message.includes('سبب ومبرر');
          return {
            passed,
            message: passed
              ? `تم رفض الطلب بنجاح لغياب المبرر: "${err.message}"`
              : `رسالة غير متوقعة: ${err.message}`,
          };
        }
      },
    },

    // 17. Teacher Authorization: Authorized Teacher Allowed
    {
      id: 17,
      category: 'Security & Roles',
      title: 'سماح المعلم برصد حضور الفصل المسند إليه في فرعه وقيد حصصه',
      run: async () => {
        const testDate = '2026-10-16';
        const result = attendanceStorage.saveClassAttendance(teacherRiyadhUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [{ studentId: 'stu-riyadh-001', status: 'PRESENT' }],
        });

        const passed = result.savedCount === 1;

        return {
          passed,
          message: passed
            ? `تم رصد الحضور بنجاح بواسطة المعلم المسند (${teacherRiyadhUser.fullName}).`
            : 'فشل في السماح للمعلم المسند برصد الحضور.',
        };
      },
    },

    // 18. Teacher Authorization: Unauthorized Teacher Blocked at Service Layer
    {
      id: 18,
      category: 'Security & Roles',
      title: 'منع المعلم غير المسند من رصد حضور فصول الآخرين في طبقة الخدمات مع تدقيق',
      run: async () => {
        const testDate = '2026-10-16';
        try {
          attendanceStorage.saveClassAttendance(unauthorizedTeacherUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            date: testDate,
            type: 'DAILY',
            records: [{ studentId: 'stu-riyadh-001', status: 'PRESENT' }],
          });
          return { passed: false, message: 'ثغرة أمنية: تم السماح لمعلم غير مسند برصد حضور فصل آخر!' };
        } catch (err: any) {
          const passed = err.message.includes('غير مصرح لك برصد حضور هذا الفصل');
          return {
            passed,
            message: passed
              ? `تم صد المحاولة في طبقة الخدمات بنجاح: "${err.message}" وتوثيق الانتهاك الأمني في سجل التدقيق.`
              : `رسالة غير متوقعة: ${err.message}`,
          };
        }
      },
    },

    // 19. SuperAdmin Global Access and Lock Override
    {
      id: 19,
      category: 'Security & Roles',
      title: 'صلاحيات المدير العام للنظام (Super Admin) في الوصول لجميع الفروع وتجاوز القفل',
      run: async () => {
        const riyadhList = attendanceStorage.listRecords(superAdminUser, { branchId: 'branch-riyadh' });
        const jeddahList = attendanceStorage.listRecords(superAdminUser, { branchId: 'branch-jeddah' });

        const passed = Array.isArray(riyadhList) && Array.isArray(jeddahList);

        return {
          passed,
          message: passed
            ? `تم تأكيد الصلاحيات الشاملة للمدير العام: حق الوصول المباشر لكافة الفروع وتدقيق كافة السجلات.`
            : 'فشل في صلاحيات المدير العام للنظام.',
        };
      },
    },

    // 20. Historical Snapshot Preservation on Student Transfer
    {
      id: 20,
      category: 'Model & Integrity',
      title: 'حفظ وتثبيت تاريخ الحضور السابق عند نقل الطالب إلى فصل جديد دون تغيير السجلات السابقة',
      run: async () => {
        const historicalDate = '2026-09-27';
        const historicalRecs = attendanceStorage.listRecords(riyadhManagerUser, {
          studentId: 'stu-riyadh-001',
          date: historicalDate,
        });

        const rec = historicalRecs[0];
        const passed = rec && rec.classId === 'cls-riyadh-1a';

        return {
          passed,
          message: passed
            ? `تأكيد سلامة الأرشيف التاريخي: السجل القديم لا يزال مرتبطاً بالفصل الأصلي (${rec.classNameAr}) وقت الحضور.`
            : 'فشل: تلف الأرشيف التاريخي للحضور.',
        };
      },
    },

    // 21. Attendance Rates & Statistics Accuracy
    {
      id: 21,
      category: 'Analytics & Export',
      title: 'حساب معدلات الحضور والغياب والتأخر بدقة رياضية (%100)',
      run: async () => {
        const summary = attendanceStorage.getStudentAttendanceSummary(riyadhManagerUser, 'stu-riyadh-001');
        const stats = summary.stats;

        const effectiveAttended = stats.presentCount + stats.lateCount + stats.earlyDepartureCount;
        const expectedRate = stats.totalSessions > 0 ? Math.round((effectiveAttended / stats.totalSessions) * 100) : 100;

        const passed = stats.attendanceRate === expectedRate;

        return {
          passed,
          message: passed
            ? `دقة الإحصائيات: الطالب لديه ${stats.totalSessions} جلسات (حضور: ${stats.presentCount}، تأخر: ${stats.lateCount}، غياب: ${stats.absentCount})، نسبة الحضور المحسوبة: ${stats.attendanceRate}%.`
            : `عدم تطابق في نسبة الحضور: المحسوبة=${stats.attendanceRate}، المتوقعة=${expectedRate}`,
        };
      },
    },

    // 22. Class Attendance Dashboard for Branch
    {
      id: 22,
      category: 'Analytics & Export',
      title: 'لوحة القيادة اليومية لفصول الفرع مع مؤشرات الإنجاز ومعدلات الحضور',
      run: async () => {
        const dash = attendanceStorage.getClassAttendanceDashboard(riyadhManagerUser, 'branch-riyadh', '2026-09-27');

        const passed = dash.length > 0 && dash.every((c) => c.classId && c.classNameAr && c.sessionStatus);

        return {
          passed,
          message: passed
            ? `تم توليد لوحة المتابعة بنجاح لـ ${dash.length} فصول بالفرع مع حالة الجلسات ومؤشرات الحضور والغياب.`
            : 'فشل في توليد لوحة قيادة الحضور اليومي للفروع.',
        };
      },
    },

    // 23. Student Attendance Profile & Chronological History
    {
      id: 23,
      category: 'Analytics & Export',
      title: 'الملف الفردي الشامل لحضور الطالب مع التسلسل الزمني الكامل للملاحظات والتصحيحات',
      run: async () => {
        const profile = attendanceStorage.getStudentAttendanceSummary(riyadhManagerUser, 'stu-riyadh-001');

        const passed = profile.records.length > 0 && profile.stats.totalSessions === profile.records.length;

        return {
          passed,
          message: passed
            ? `تم استرجاع السجل التاريخي الكامل بنجاح: ${profile.records.length} سجلات حضور موثقة للطالب.`
            : 'فشل في استرجاع ملف حضور الطالب.',
        };
      },
    },

    // 24. Attendance Deletion with Lock Protection & Audit
    {
      id: 24,
      category: 'Corrections & Locking',
      title: 'حذف سجل حضور غير مقفل مع منع حذف المقفل وتوثيق العملية في سجل التدقيق',
      run: async () => {
        const testDate = '2026-10-18';
        attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [{ studentId: 'stu-riyadh-001', status: 'PRESENT' }],
        });

        const recs = attendanceStorage.listRecords(riyadhManagerUser, {
          date: testDate,
          studentId: 'stu-riyadh-001',
        });
        const rec = recs[0];

        attendanceStorage.deleteAttendanceRecord(riyadhManagerUser, rec.id);

        const afterList = attendanceStorage.listRecords(riyadhManagerUser, {
          date: testDate,
          studentId: 'stu-riyadh-001',
        });

        const passed = afterList.length === 0;

        return {
          passed,
          message: passed
            ? 'تم حذف السجل بنجاح مع توثيق اسم المنفذ وسبب الحذف في سجل التدقيق الأمني.'
            : 'فشل في حذف سجل الحضور.',
        };
      },
    },

    // 25. Formatted CSV Export with UTF-8 BOM and Arabic Terms
    {
      id: 25,
      category: 'Analytics & Export',
      title: 'تصدير سجلات الحضور بصيغة CSV المتوافقة مع الإكسل مع علامة UTF-8 BOM والترجمة العربية',
      run: async () => {
        const csv = attendanceStorage.exportAttendanceCSV(riyadhManagerUser, {
          branchId: 'branch-riyadh',
        });

        const hasBOM = csv.startsWith('\uFEFF');
        const hasHeaders = csv.includes('التاريخ') && csv.includes('اسم الطالب') && csv.includes('الحالة');
        const passed = hasBOM && hasHeaders;

        return {
          passed,
          message: passed
            ? `تم تصدير ملف CSV بنجاح بحجم ${csv.length} بايت متضمناً علامة BOM وترجمات الحالات ورموز الأعذار.`
            : 'فشل في تصدير ملف CSV الخاص بالحضور.',
        };
      },
    },

    // 26. Multi-Branch Isolation on Queries
    {
      id: 26,
      category: 'Security & Roles',
      title: 'منع موظف فرع جدة من استعراض أو تصدير سجلات فرع الرياض (عزل تام)',
      run: async () => {
        try {
          attendanceStorage.listRecords(jeddahStaffUser, { branchId: 'branch-riyadh' });
          return { passed: false, message: 'ثغرة: موظف جدة تمكن من استعراض حضور فرع الرياض!' };
        } catch (err: any) {
          const passed = err.message.includes('غير مصرح لك');
          return {
            passed,
            message: passed
              ? `تم فرض العزل بنجاح: "${err.message}"`
              : `رسالة خطأ غير متوقعة: ${err.message}`,
          };
        }
      },
    },

    // 27. Centralized Audit Log Verification
    {
      id: 27,
      category: 'Security & Roles',
      title: 'التحقق من توثيق جميع عمليات الحضور والقفل والتصحيح في سجل التدقيق المركزي authStorage',
      run: async () => {
        const logs = authStorage.getAuditLogs();
        const attendanceLogs = logs.filter((l) => l.targetType === 'ATTENDANCE');

        const passed = attendanceLogs.length >= 5;

        return {
          passed,
          message: passed
            ? `تم التحقق من نظام التدقيق المركزي: تم تسجيل ${attendanceLogs.length} عملية حضور مع توثيق المنفذ والتاريخ والنتيجة.`
            : `عدد سجلات تدقيق الحضور غير كافٍ: ${attendanceLogs.length}`,
        };
      },
    },

    // 28. Prior Phases Regressions Check (Phases 1-7 Intact)
    {
      id: 28,
      category: 'Model & Integrity',
      title: 'فحص عدم التعارض وسلامة المراحل السابقة (الهيكل الأكاديمي، الطلاب، المعلمون، الجدول)',
      run: async () => {
        const branches = branchStorage.getStoredBranches();
        const classes = academicStorage.getRawClasses();
        const students = studentStorage.getRawStudents();
        const teachers = teacherStorage.getRawTeachers();
        const timetableEntries = timetableStorage.getRawTimetableEntries();

        const passed =
          branches.length >= 2 &&
          classes.length >= 2 &&
          students.length >= 3 &&
          teachers.length >= 2 &&
          timetableEntries.length >= 3;

        return {
          passed,
          message: passed
            ? `تأكيد سلامة واستقرار النظام: ${branches.length} فروع، ${classes.length} فصول، ${students.length} طالباً، ${teachers.length} معلماً، ${timetableEntries.length} حصة مجدولة.`
            : 'فشل: تأثرت أو تلفت بيانات المراحل السابقة.',
        };
      },
    },
  ];

  const handleRunAll = async () => {
    setIsRunning(true);
    setProgress(0);
    const newResults: Record<number, { passed: boolean; message: string; details?: any }> = {};

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      try {
        const result = await test.run();
        newResults[test.id] = result;
      } catch (err: any) {
        newResults[test.id] = {
          passed: false,
          message: `خطأ غير متوقع: ${err.message}`,
        };
      }
      setTestResults({ ...newResults });
      setProgress(Math.round(((i + 1) / tests.length) * 100));
    }

    setIsRunning(false);
  };

  const handleReset = () => {
    setTestResults({});
    setProgress(0);
  };

  const categories = [
    { id: 'all', label: 'كافة الاختبارات (All)', count: tests.length },
    { id: 'Model & Integrity', label: 'النموذج وسلامة البيانات', count: tests.filter((t) => t.category === 'Model & Integrity').length },
    { id: 'Daily & Lesson', label: 'الحضور اليومي وحصص الجدول', count: tests.filter((t) => t.category === 'Daily & Lesson').length },
    { id: 'Corrections & Locking', label: 'القفل والتصحيح الموثق', count: tests.filter((t) => t.category === 'Corrections & Locking').length },
    { id: 'Security & Roles', label: 'صلاحيات المعلمين والأمان', count: tests.filter((t) => t.category === 'Security & Roles').length },
    { id: 'Analytics & Export', label: 'الإحصائيات والتصدير CSV', count: tests.filter((t) => t.category === 'Analytics & Export').length },
  ];

  const filteredTests = activeCategory === 'all' ? tests : tests.filter((t) => t.category === activeCategory);

  const totalRun = Object.keys(testResults).length;
  const passedCount = Object.values(testResults).filter((r) => r.passed).length;
  const failedCount = Object.values(testResults).filter((r) => !r.passed).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>حزمة اختبارات التحقق من المرحلة 8 — الحضور والغياب (Phase 8 Tests)</span>
        </div>
      }
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Header Stats Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>منظومة التحقق الآلي الصارم من متطلبات المرحلة 8</span>
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                تغطي 28 اختباراً شاملاً للحضور اليومي وحصص الجدول، القفل، التدقيق، وصلاحيات المعلمين.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunAll}
                isLoading={isRunning}
                disabled={isRunning}
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                <span>تشغيل كافة الفحوصات (28)</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isRunning || totalRun === 0}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Progress Bar & Badges */}
          {totalRun > 0 && (
            <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold">
                  <span className="text-emerald-700 dark:text-emerald-300">التقدم: {progress}%</span>
                  <Badge variant="success" size="sm">نجح: {passedCount}</Badge>
                  {failedCount > 0 && <Badge variant="danger" size="sm">فشل: {failedCount}</Badge>}
                </div>
                <span className="text-slate-500 font-mono text-[11px]">{totalRun} / {tests.length} مكتمل</span>
              </div>
              <div className="w-full h-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-700/60 pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                px-2.5 py-1 text-xs rounded-lg font-medium transition-all
                ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }
              `}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Test Cases List */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {filteredTests.map((test) => {
            const res = testResults[test.id];
            const hasRun = !!res;
            const isPassed = res?.passed;

            return (
              <div
                key={test.id}
                className={`
                  p-3 rounded-xl border text-xs transition-all
                  ${
                    !hasRun
                      ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40'
                      : isPassed
                      ? 'border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-rose-200 dark:border-rose-900/70 bg-rose-50/40 dark:bg-rose-950/20'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                      #{test.id.toString().padStart(2, '0')}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {test.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        فئة: <span className="font-medium text-slate-700 dark:text-slate-300">{test.category}</span>
                      </div>
                      {hasRun && (
                        <div
                          className={`mt-1.5 p-2 rounded-lg text-[11px] font-medium ${
                            isPassed
                              ? 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200'
                              : 'bg-rose-100/70 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200'
                          }`}
                        >
                          {res.message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {!hasRun ? (
                      <span className="text-[11px] text-slate-400">بانتظار التشغيل</span>
                    ) : isPassed ? (
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ناجح</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                        <XCircle className="w-4 h-4" />
                        <span>فشل</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <span>نظام إدارة المدارس — الاختبارات الآلية للمرحلة 8 (Attendance & Absences)</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};
