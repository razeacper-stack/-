import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { timetableStorage } from '../../services/timetableStorage';
import { authStorage } from '../../services/authStorage';
import { branchStorage } from '../../services/branchStorage';
import { academicStorage } from '../../services/academicStorage';
import { teacherStorage } from '../../services/teacherStorage';
import { SafeUser } from '../../types/auth';
import {
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Layers,
  Calendar,
  Building2,
  BookOpen,
} from 'lucide-react';

interface TestCase {
  id: number;
  category: 'Model & Periods' | 'Conflict Detection' | 'Academic Relations' | 'Publish & Audit' | 'Security & Regressions';
  title: string;
  run: () => Promise<{ passed: boolean; message: string; details?: any }>;
}

export const Phase7VerificationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<
    Record<number, { passed: boolean; message: string; details?: any }>
  >({});
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [progress, setProgress] = useState(0);

  // Mock test users
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
      'timetable.view',
      'timetable.create',
      'timetable.edit',
      'timetable.publish',
      'timetable.manage_periods',
      'timetable.manage_rooms',
      'timetable.export',
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
    permissions: ['timetable.view'] as any[],
  };

  const testCases: TestCase[] = [
    // 1. Timetable Model Validation
    {
      id: 1,
      category: 'Model & Periods',
      title: 'التحقق من سلامة نموذج الحصة المجدولة (Timetable Entry Model)',
      run: async () => {
        timetableStorage.initialize();
        const entries = timetableStorage.getRawTimetableEntries();
        if (entries.length === 0) return { passed: false, message: 'قاعدة بيانات الجداول فارغة.' };
        const sample = entries[0];
        const valid =
          Boolean(sample.id) &&
          Boolean(sample.branchId) &&
          Boolean(sample.academicYearId) &&
          Boolean(sample.classId) &&
          Boolean(sample.subjectId) &&
          Boolean(sample.teacherId) &&
          sample.dayOfWeek !== undefined &&
          Boolean(sample.periodId) &&
          Boolean(sample.status);
        return {
          passed: valid,
          message: valid ? `تم التحقق من النموذج القياسي للحصة: [${sample.id}]` : 'حقول إلزامية مفقودة في النموذج.',
        };
      },
    },

    // 2. Period Creation
    {
      id: 2,
      category: 'Model & Periods',
      title: 'إنشاء فترة دراسية جديدة وحساب المدة تلقائياً',
      run: async () => {
        const newPrd = timetableStorage.createPeriod(superAdminUser, {
          branchId: 'branch-riyadh',
          nameAr: 'حصة نشاط تجريبية',
          nameEn: 'Activity Period',
          periodNumber: 99,
          startTime: '14:00',
          endTime: '14:45',
          isBreak: false,
        });
        const passed = newPrd.durationMinutes === 45 && newPrd.periodNumber === 99;
        return {
          passed,
          message: passed ? `تم إنشاء الفترة وحساب المدة (45 دقيقة): ${newPrd.nameAr}` : 'فشل في إنشاء الفترة أو حساب المدة.',
        };
      },
    },

    // 3. Period Time Validation (startTime < endTime)
    {
      id: 3,
      category: 'Model & Periods',
      title: 'التحقق من صحة التوقيت (منع وقت البدء بعد وقت الانتهاء)',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createPeriod(superAdminUser, {
            branchId: 'branch-riyadh',
            nameAr: 'فترة غير صالحة',
            nameEn: 'Invalid Period',
            periodNumber: 100,
            startTime: '10:00',
            endTime: '09:00', // Invalid: start > end
          });
        } catch (err: any) {
          blocked = err.message.includes('أسبق');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم رفض الفترة غير الصالحة زمنياً بنجاح.' : 'فشل: تم السماح بوقت بدء متأخر عن وقت الانتهاء.',
        };
      },
    },

    // 4. Period Overlap Prevention
    {
      id: 4,
      category: 'Model & Periods',
      title: 'منع تداخل الفترات والحصص النشطة في نفس الفرع',
      run: async () => {
        let blocked = false;
        try {
          // Attempt overlap with Period 1 (07:30 - 08:15)
          timetableStorage.createPeriod(superAdminUser, {
            branchId: 'branch-riyadh',
            nameAr: 'حصة متداخلة',
            nameEn: 'Overlapping Period',
            periodNumber: 101,
            startTime: '07:45',
            endTime: '08:30',
          });
        } catch (err: any) {
          blocked = err.message.includes('يتعارض') || err.message.includes('تداخل');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع تداخل أوقات الحصص النشطة بالفرع بنجاح.' : 'فشل: تم السماح بتداخل فترات دراسية.',
        };
      },
    },

    // 5. Timetable Creation
    {
      id: 5,
      category: 'Conflict Detection',
      title: 'تسكين حصة جديدة وتوثيقها في جدول الفصل',
      run: async () => {
        // Schedule Tuesday Period 4 for Class 1A
        const entry = timetableStorage.createTimetableEntry(superAdminUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          subjectId: 'sbj-riyadh-math',
          teacherId: 'tch-r-001',
          dayOfWeek: 2, // Tuesday
          periodId: 'prd-r-04',
          status: 'DRAFT',
        });
        const passed = Boolean(entry.id && entry.classCode);
        return {
          passed,
          message: passed ? `تم تسكين الحصة بنجاح: ${entry.subjectNameAr} مع ${entry.teacherNameAr}` : 'فشل تسكين الحصة.',
        };
      },
    },

    // 6. Teacher Conflict Rejection
    {
      id: 6,
      category: 'Conflict Detection',
      title: 'كشف وحجب تعارض المعلم (منع تدريس فصلين في نفس الوقت)',
      run: async () => {
        // Teacher tch-r-001 teaches cls-riyadh-1a on Sunday Period 1 (prd-r-01)
        // Attempt to assign same teacher to cls-riyadh-1b on Sunday Period 1
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1b', // Different class
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-r-001', // Same teacher
            dayOfWeek: 0,
            periodId: 'prd-r-01', // Same period
          });
        } catch (err: any) {
          blocked = err.message.includes('تعارض في جدول المعلم') || err.message.includes('مشغول');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم كشف ومنع تعارض المعلم بنجاح.' : 'ثغرة: سُمح بتسكين المعلم في فصلين بنفس الوقت.',
        };
      },
    },

    // 7. Class Conflict Rejection
    {
      id: 7,
      category: 'Conflict Detection',
      title: 'كشف وحجب تعارض الفصل (منع حصتين لنفس الفصل في نفس الموعد)',
      run: async () => {
        // Class cls-riyadh-1a has Math on Sunday Period 1
        // Attempt to schedule Arabic for Class 1A on Sunday Period 1
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a', // Same class
            subjectId: 'sbj-riyadh-arabic',
            teacherId: 'tch-r-002', // Different teacher
            dayOfWeek: 0,
            periodId: 'prd-r-01', // Same period
          });
        } catch (err: any) {
          blocked = err.message.includes('تعارض في جدول الفصل') || err.message.includes('مجدولة');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع تعارض الفصل الدراسي بنجاح.' : 'ثغرة: سُمح بجدولة حصتين لنفس الفصل بنفس الوقت.',
        };
      },
    },

    // 8. Room Conflict Rejection
    {
      id: 8,
      category: 'Conflict Detection',
      title: 'كشف وحجب تعارض القاعة (منع إشغال القاعة بأكثر من فصل)',
      run: async () => {
        // rm-r-101 is used on Sunday Period 1
        // Attempt to place another class in rm-r-101 on Sunday Period 1
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1b',
            subjectId: 'sbj-riyadh-science',
            teacherId: 'tch-r-003',
            roomId: 'rm-r-101', // Occupied room!
            dayOfWeek: 0,
            periodId: 'prd-r-01',
          });
        } catch (err: any) {
          blocked = err.message.includes('تعارض قاعة') || err.message.includes('مشغولة');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع تعارض القاعة الدراسية بنجاح.' : 'ثغرة: سُمح بإشغال قاعة مشغولة.',
        };
      },
    },

    // 9. Duplicate Lesson Rejection
    {
      id: 9,
      category: 'Conflict Detection',
      title: 'منع تكرار الحصة المطابقة تماماً (Duplicate Lesson Guard)',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-r-001',
            dayOfWeek: 0,
            periodId: 'prd-r-01',
          });
        } catch (err: any) {
          blocked = err.message.includes('تكرار غير مسموح') || err.message.includes('مسبقاً');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم رفض الحصة المكررة بنجاح.' : 'فشل: تم السماح بإدخال حصة مكررة.',
        };
      },
    },

    // 10. Cross-Branch Rejection
    {
      id: 10,
      category: 'Academic Relations',
      title: 'حجب إسناد أي مدخلات عبر الفروع (معلم/فصل/مادة/قاعة)',
      run: async () => {
        // Riyadh class + Jeddah teacher
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-j-001', // Jeddah Teacher!
            dayOfWeek: 3,
            periodId: 'prd-r-01',
          });
        } catch (err: any) {
          blocked = err.message.includes('فرع آخر') || err.message.includes('CROSS_BRANCH');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم حجب التعيين عبر الفروع بنجاح.' : 'ثغرة أمنية: تم السماح بجدولة معلم من فرع آخر.',
        };
      },
    },

    // 11. Academic-Year Mismatch Rejection
    {
      id: 11,
      category: 'Academic Relations',
      title: 'منع خلط الفصول بأعوام دراسية غير متوافقة',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2025', // Wrong year (Class is 2026)
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-r-001',
            dayOfWeek: 3,
            periodId: 'prd-r-01',
          });
        } catch (err: any) {
          blocked = err.message.includes('عام دراسي مختلف') || err.message.includes('ACADEMIC_YEAR_MISMATCH');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع عدم توافق العام الدراسي بنجاح.' : 'فشل: سُمح بخلط الأعوام الدراسية.',
        };
      },
    },

    // 12. Invalid Teacher-Subject Rejection
    {
      id: 12,
      category: 'Academic Relations',
      title: 'التحقق من أهلية المعلم لتدريس المادة (Teacher-Subject Eligibility)',
      run: async () => {
        // Teacher tch-r-001 teaches Math, NOT Science
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-science', // Science
            teacherId: 'tch-r-001', // Math teacher
            dayOfWeek: 3,
            periodId: 'prd-r-05',
          });
        } catch (err: any) {
          blocked = err.message.includes('غير مسند لتدريس') || err.message.includes('أهلية');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم تطبيق شرط أهلية تخصص المعلم بنجاح.' : 'فشل: سُمح بتسكين معلم لمادة غير مسندة له.',
        };
      },
    },

    // 13. Inactive Teacher Rejection
    {
      id: 13,
      category: 'Academic Relations',
      title: 'منع تسكين حصص لمعلم مؤرشف أو في إجازة',
      run: async () => {
        // tch-r-004 is ON_LEAVE
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-english',
            teacherId: 'tch-r-004',
            dayOfWeek: 3,
            periodId: 'prd-r-01',
          });
        } catch (err: any) {
          blocked = err.message.includes('حالته الحالية') || err.message.includes('ON_LEAVE');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع تسكين حصة لمعلم غير نشط بنجاح.' : 'فشل: سُمح بتسكين حصة لمعلم مجاز.',
        };
      },
    },

    // 14. Break Period Rejection
    {
      id: 14,
      category: 'Model & Periods',
      title: 'منع تسكين حصص دراسية في فترات الفسحة والصلاة (Break Guard)',
      run: async () => {
        // prd-r-brk1 is break
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-r-001',
            dayOfWeek: 3,
            periodId: 'prd-r-brk1',
          });
        } catch (err: any) {
          blocked = err.message.includes('الفسحة') || err.message.includes('استراحة');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع الجدولة في أوقات الفسحة بنجاح.' : 'فشل: سُمح بجدولة حصة أثناء الفسحة.',
        };
      },
    },

    // 15. Weekly Subject Load Validation
    {
      id: 15,
      category: 'Academic Relations',
      title: 'حساب النصاب الأسبوعي المعتمد ومقارنته بالمجدول (Weekly Subject Load)',
      run: async () => {
        const loads = timetableStorage.getWeeklySubjectLoad('cls-riyadh-1a', 'ay-riyadh-2026');
        const hasLoads = loads.length > 0;
        const sample = loads[0];
        const valid = hasLoads && sample.requiredPeriods > 0;
        return {
          passed: valid,
          message: valid
            ? `تم حساب النصاب لمادة ${sample.subjectNameAr}: (المجدول ${sample.scheduledPeriods} / المعتمد ${sample.requiredPeriods})`
            : 'فشل في استرجاع النصاب الأسبوعي.',
        };
      },
    },

    // 16. Timetable Move Validation
    {
      id: 16,
      category: 'Conflict Detection',
      title: 'التحقق من نقل الحصة والتحقق المسبق من الهدف (Move Operation)',
      run: async () => {
        // Create an entry then move it
        const entry = timetableStorage.createTimetableEntry(superAdminUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          subjectId: 'sbj-riyadh-arabic',
          teacherId: 'tch-r-002',
          dayOfWeek: 4, // Thursday
          periodId: 'prd-r-01',
        });
        const moved = timetableStorage.moveTimetableEntry(superAdminUser, entry.id, {
          dayOfWeek: 4,
          periodId: 'prd-r-02',
        });
        const passed = moved.dayOfWeek === 4 && moved.periodId === 'prd-r-02';
        return {
          passed,
          message: passed ? 'تم نقل الحصة بنجاح بعد التحقق من خلو الوجهة من التعارضات.' : 'فشل نقل الحصة.',
        };
      },
    },

    // 17. Publish Validation (Empty Schedule Rejection)
    {
      id: 17,
      category: 'Publish & Audit',
      title: 'منع نشر جدول فارغ والتحقق الشامل قبل الاعتماد',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.publishClassTimetable(superAdminUser, 'branch-riyadh', 'ay-riyadh-2026', 'cls-riyadh-s1a');
        } catch (err: any) {
          blocked = err.message.includes('فارغ');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع اعتماد جدول فارغ بنجاح.' : 'فشل: سُمح بنشر جدول بدون حصص.',
        };
      },
    },

    // 18. Successful Publish Workflow
    {
      id: 18,
      category: 'Publish & Audit',
      title: 'دورة النشر والاعتماد وتحويل الحالة إلى PUBLISHED',
      run: async () => {
        const res = timetableStorage.publishClassTimetable(
          superAdminUser,
          'branch-riyadh',
          'ay-riyadh-2026',
          'cls-riyadh-1a'
        );
        const entries = timetableStorage.getRawTimetableEntries().filter((e) => e.classId === 'cls-riyadh-1a');
        const allPublished = entries.every((e) => e.status === 'PUBLISHED');
        return {
          passed: allPublished && res.publishedCount > 0,
          message: allPublished
            ? `تم اعتماد ونشر ${res.publishedCount} حصة دراسية للفصل بنجاح.`
            : 'فشل في دورة اعتماد الجدول.',
        };
      },
    },

    // 19. Branch Isolation for Campus Managers
    {
      id: 19,
      category: 'Security & Regressions',
      title: 'عزل الفروع: منع مدير فرع الرياض من جدولة حصص في فرع جدة',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(riyadhManagerUser, {
            branchId: 'branch-jeddah', // Cross-branch intrusion
            academicYearId: 'ay-jeddah-2026',
            classId: 'cls-j-p1-a',
            subjectId: 'sbj-jeddah-math',
            teacherId: 'tch-j-001',
            dayOfWeek: 0,
            periodId: 'prd-j-01',
          });
        } catch (err: any) {
          blocked = err.message.includes('غير مصرح') || err.message.includes('الفرع المحدد');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم رفض التدخل عبر الفروع لمدير الفرع وتوثيق الواقعة.' : 'ثغرة: تم اختراق عزل الفروع.',
        };
      },
    },

    // 20. Role Permissions: Viewer Denial
    {
      id: 20,
      category: 'Security & Regressions',
      title: 'حجب عمليات الإضافة والتعديل للمشاهد (Viewer Denial)',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(viewerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-r-001',
            dayOfWeek: 1,
            periodId: 'prd-r-03',
          });
        } catch (err: any) {
          blocked = err.message.includes('الصلاحية الكافية') || err.message.includes('timetable.create');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم حجب محاولة الإنشاء للمشاهد بنجاح.' : 'ثغرة: سُمح لمشاهد بإنشاء حصة.',
        };
      },
    },

    // 21. Direct Service-Layer Authorization Guard
    {
      id: 21,
      category: 'Security & Regressions',
      title: 'التحقق من الصلاحيات الصارمة في طبقة الخدمة المركزية',
      run: async () => {
        const canSuperAdmin = authStorage.hasPermission(superAdminUser, 'timetable.create');
        const canManager = authStorage.hasPermission(riyadhManagerUser, 'timetable.create');
        const canViewer = authStorage.hasPermission(viewerUser, 'timetable.create');
        const passed = canSuperAdmin && canManager && !canViewer;
        return {
          passed,
          message: passed ? 'طبقة الصلاحيات المركزية تفصل بدقة بين الأدوار.' : 'فشل في مصفوفة الصلاحيات.',
        };
      },
    },

    // 22. Audit Trail Ledger Verification
    {
      id: 22,
      category: 'Publish & Audit',
      title: 'توثيق كافة عمليات الجداول في سجل التدقيق الأمني (Audit Ledger)',
      run: async () => {
        const logs = authStorage.getAuditLogs();
        const timetableLogs = logs.filter((l) => l.targetType === 'TIMETABLE');
        const passed = timetableLogs.length > 0;
        return {
          passed,
          message: passed
            ? `تم العثور على ${timetableLogs.length} سجل تدقيق أمني خاص بجدولة الحصص.`
            : 'فشل: لم يتم توثيق العمليات في سجل التدقيق.',
        };
      },
    },

    // 23. Concurrent Double Booking Protection
    {
      id: 23,
      category: 'Conflict Detection',
      title: 'محاكاة الجدولة المتزامنة لمنع الحجز المزدوج (Concurrency Simulation)',
      run: async () => {
        // Attempt simultaneous creation in the same slot
        let success1 = false;
        let blocked2 = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-r-001',
            dayOfWeek: 3,
            periodId: 'prd-r-07',
          });
          success1 = true;

          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1b',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-r-001', // Same teacher!
            dayOfWeek: 3,
            periodId: 'prd-r-07',
          });
        } catch {
          blocked2 = true;
        }
        const passed = success1 && blocked2;
        return {
          passed,
          message: passed
            ? 'نجاح التسكين الأول وحجب الحجز المزدوج المتزامن بنجاح.'
            : 'فشل في منع الحجز المزدوج المتزامن.',
        };
      },
    },

    // 24. Super Admin Stale Cache Regression Test
    {
      id: 24,
      category: 'Security & Regressions',
      title: 'اختبار ارتداد حماية Super Admin ضد الكاش أو نقص مصفوفة الصلاحيات',
      run: async () => {
        const userWithEmptyPerms: SafeUser = {
          ...superAdminUser,
          permissions: [], // Empty cached array!
        };
        const hasAccess = authStorage.hasPermission(userWithEmptyPerms, 'timetable.publish');
        const isMaster = authStorage.isSuperAdmin(userWithEmptyPerms);
        const passed = hasAccess && isMaster;
        return {
          passed,
          message: passed
            ? 'Super Admin يحتفظ بالصلاحيات السيادية حتى مع خلو مصفوفة الأذونات المخزنة.'
            : 'فشل: تأثر Super Admin بفراغ مصفوفة الصلاحيات.',
        };
      },
    },

    // 25. Regression Test: PHASES 1–6 Integrity
    {
      id: 25,
      category: 'Security & Regressions',
      title: 'اختبار عدم ارتداد الأنظمة السابقة (الفروع، الطلاب، المعلمين، الهيكل الأكاديمي)',
      run: async () => {
        const branches = branchStorage.getStoredBranches();
        const years = academicStorage.getRawYears();
        const stages = academicStorage.getRawStages();
        const classes = academicStorage.getRawClasses();
        const teachers = teacherStorage.getRawTeachers();

        const passed =
          branches.length >= 3 &&
          years.length >= 1 &&
          stages.length >= 1 &&
          classes.length >= 1 &&
          teachers.length >= 1;

        return {
          passed,
          message: passed
            ? `تأكيد سلامة المراحل السابقة: ${branches.length} فروع، ${classes.length} فصول، ${teachers.length} معلماً.`
            : 'فشل: تلف أو فقدان بيانات المراحل السابقة.',
        };
      },
    },
  ];

  const handleRunAll = async () => {
    setIsRunning(true);
    setTestResults({});
    setProgress(0);

    const results: Record<number, { passed: boolean; message: string; details?: any }> = {};

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      try {
        const res = await tc.run();
        results[tc.id] = res;
      } catch (err: any) {
        results[tc.id] = { passed: false, message: `استثناء: ${err.message}` };
      }
      setTestResults({ ...results });
      setProgress(Math.round(((i + 1) / testCases.length) * 100));
      await new Promise((r) => setTimeout(r, 40));
    }

    setIsRunning(false);
  };

  const handleRunSingle = async (tc: TestCase) => {
    try {
      const res = await tc.run();
      setTestResults((prev) => ({ ...prev, [tc.id]: res }));
    } catch (err: any) {
      setTestResults((prev) => ({ ...prev, [tc.id]: { passed: false, message: err.message } }));
    }
  };

  const filteredTests =
    activeCategory === 'all' ? testCases : testCases.filter((tc) => tc.category === activeCategory);

  const passedCount = Object.values(testResults).filter((r) => r.passed).length;
  const failedCount = Object.values(testResults).filter((r) => !r.passed).length;

  if (!isOpen) return null;

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
              دليل التحقق والاختبارات الآلية للمرحلة 7 (Phase 7 Verification Suite)
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              25 اختباراً شاملاً لإدارة الجداول، كشف التعارضات، التسكين الذري، والنشر
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Progress & Quick Run Bar */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                مجموعة الفحص الشامل (25 اختباراً نظامياً)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                اختبارات مباشرة لطبقة الخدمة لمنع أي تعارض في الجداول
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunAll}
                disabled={isRunning}
                leftIcon={<Play className="w-3.5 h-3.5" />}
              >
                {isRunning ? `جارٍ الفحص (${progress}%)...` : 'تشغيل كافة الاختبارات'}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Metrics */}
          {Object.keys(testResults).length > 0 && (
            <div className="flex items-center gap-4 text-xs font-semibold pt-1">
              <span className="text-slate-600 dark:text-slate-300">
                تم تنفيذ: {Object.keys(testResults).length} / {testCases.length}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ناجح: {passedCount}
              </span>
              {failedCount > 0 && (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> راسب: {failedCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-1 text-xs">
          {[
            { id: 'all', label: 'الكل (25)' },
            { id: 'Model & Periods', label: 'النموذج والفترات' },
            { id: 'Conflict Detection', label: 'كشف التعارضات' },
            { id: 'Academic Relations', label: 'العلاقات الأكاديمية' },
            { id: 'Publish & Audit', label: 'النشر والتدقيق' },
            { id: 'Security & Regressions', label: 'الأمان والارتداد' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
                activeCategory === cat.id
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Test List */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredTests.map((tc) => {
            const res = testResults[tc.id];
            return (
              <div key={tc.id} className="pt-2 pb-2 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 text-[10px]">#{tc.id}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{tc.title}</span>
                  </div>
                  {res && (
                    <div
                      className={`text-[11px] flex items-center gap-1.5 mt-0.5 ${
                        res.passed
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {res.passed ? (
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                      ) : (
                        <XCircle className="w-3 h-3 shrink-0" />
                      )}
                      <span>{res.message}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {res ? (
                    res.passed ? (
                      <Badge variant="success" size="sm">
                        ناجح
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm">
                        راسب
                      </Badge>
                    )
                  ) : (
                    <Badge variant="neutral" size="sm">
                      جاهز
                    </Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRunSingle(tc)}
                    disabled={isRunning}
                    className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="تشغيل منفرد"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            إغلاق النافذة
          </Button>
        </div>
      </div>
    </Modal>
  );
};
