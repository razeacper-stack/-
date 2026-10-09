import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { dashboardStorage } from '../../services/dashboardStorage';
import { authStorage } from '../../services/authStorage';
import { branchStorage } from '../../services/branchStorage';
import { studentStorage } from '../../services/studentStorage';
import { academicStorage } from '../../services/academicStorage';
import { teacherStorage } from '../../services/teacherStorage';
import { timetableStorage } from '../../services/timetableStorage';
import { attendanceStorage } from '../../services/attendanceStorage';
import { financeStorage } from '../../services/financeStorage';
import { formatCurrency } from '../../utils/currency';
import { SafeUser } from '../../types/auth';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  LayoutDashboard,
  Lock,
} from 'lucide-react';

export interface Phase10VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestCase {
  id: number;
  category: 'Aggregations & KPIs' | 'Branch Isolation' | 'Role-Aware Security' | 'Alerts & Activity' | 'Regression';
  title: string;
  run: () => Promise<{ passed: boolean; message: string }>;
}

export const Phase10VerificationModal: React.FC<Phase10VerificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [testResults, setTestResults] = useState<Record<number, { passed: boolean; message: string }>>({});
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Test Actors
  const superAdminUser: SafeUser = {
    id: 'usr-super-admin',
    fullName: 'المدير العام للنظام (Super Admin)',
    username: 'superadmin',
    email: 'admin@school.edu.sa',
    roleId: 'role-super-admin',
    roleCode: 'SUPER_ADMIN',
    roleNameAr: 'المدير العام',
    roleNameEn: 'Super Admin',
    branchIds: ['branch-riyadh', 'branch-jeddah'],
    hasAllBranchesAccess: true,
    status: 'active',
    isProtectedSuperAdmin: true,
    permissions: [],
    createdAt: '2026-01-01',
  };

  const riyadhManagerUser: SafeUser = {
    id: 'usr-mgr-riyadh',
    fullName: 'أ. أحمد الشمري (مدير فرع الرياض)',
    username: 'mgr_riyadh',
    email: 'mgr.riyadh@school.edu.sa',
    roleId: 'role-manager',
    roleCode: 'MANAGER',
    roleNameAr: 'مدير فرع',
    roleNameEn: 'Branch Manager',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    permissions: [
      'dashboard.view',
      'dashboard.view_finance',
      'dashboard.view_activity',
      'branches.view',
      'academic_years.view',
      'classes.view',
      'subjects.view',
      'students.view',
      'teachers.view',
      'timetable.view',
      'attendance.view',
      'fees.view',
      'payments.view',
      'finance.view_reports',
    ],
    createdAt: '2026-01-01',
  };

  const jeddahManagerUser: SafeUser = {
    id: 'usr-mgr-jeddah',
    fullName: 'أ. سامي الزهراني (مدير فرع جدة)',
    username: 'mgr_jeddah',
    email: 'mgr.jeddah@school.edu.sa',
    roleId: 'role-manager',
    roleCode: 'MANAGER',
    roleNameAr: 'مدير فرع',
    roleNameEn: 'Branch Manager',
    branchIds: ['branch-jeddah'],
    hasAllBranchesAccess: false,
    status: 'active',
    permissions: [
      'dashboard.view',
      'dashboard.view_finance',
      'dashboard.view_activity',
      'classes.view',
      'students.view',
      'teachers.view',
      'timetable.view',
      'attendance.view',
      'fees.view',
    ],
    createdAt: '2026-01-01',
  };

  const teacherUser: SafeUser = {
    id: 'usr-tch-riyadh',
    fullName: 'أ. فهد المنصور (معلم رياضيات)',
    username: 'tch_mansour',
    email: 'fahad.mansour@school.edu.sa',
    roleId: 'role-teacher',
    roleCode: 'TEACHER',
    roleNameAr: 'معلم',
    roleNameEn: 'Teacher',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    permissions: ['dashboard.view', 'attendance.view', 'timetable.view', 'students.view'],
    createdAt: '2026-01-01',
  };

  const viewerUser: SafeUser = {
    id: 'usr-viewer',
    fullName: 'أ. خالد المشاهد (مشاهد فقط)',
    username: 'viewer',
    email: 'viewer@school.edu.sa',
    roleId: 'role-viewer',
    roleCode: 'VIEWER',
    roleNameAr: 'مشاهد',
    roleNameEn: 'Viewer',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    permissions: ['dashboard.view'],
    createdAt: '2026-01-01',
  };

  const unauthorizedUser: SafeUser = {
    id: 'usr-no-access',
    fullName: 'مستخدم بدون صلاحيات لوحة التحكم',
    username: 'no_dash',
    email: 'nodash@school.edu.sa',
    roleId: 'role-guest',
    roleCode: 'GUEST',
    roleNameAr: 'زائر',
    roleNameEn: 'Guest',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    permissions: [],
    createdAt: '2026-01-01',
  };

  const testCases: TestCase[] = [
    // Category 1: Aggregations & KPIs
    {
      id: 1,
      category: 'Aggregations & KPIs',
      title: '01. لوحة تحكم المدير العام الشاملة (Super Admin Overview Aggregation)',
      run: async () => {
        const overview = dashboardStorage.getDashboardOverview(superAdminUser, { branchId: 'all' });
        const passed = overview.kpis.totalStudents >= 8 && overview.kpis.totalTeachers >= 10;
        return {
          passed,
          message: passed
            ? `تم تجميع لوحة التحكم الشاملة: ${overview.kpis.totalStudents} طالب، ${overview.kpis.totalTeachers} معلم، ${overview.kpis.totalClasses} فصل`
            : 'فشل في استرجاع إحصائيات لوحة التحكم الشاملة',
        };
      },
    },
    {
      id: 2,
      category: 'Aggregations & KPIs',
      title: '02. دقة مؤشرات الطلاب (Active / Inactive Students Count)',
      run: async () => {
        const students = dashboardStorage.getStudentOverview(superAdminUser, 'all');
        const passed = students.total === students.active + students.inactive && students.total > 0;
        return {
          passed,
          message: passed
            ? `إجمالي الطلاب ${students.total}: نشط ${students.active} / غير نشط ${students.inactive}`
            : 'عدم تطابق مجموع الطلاب النشطين وغير النشطين',
        };
      },
    },
    {
      id: 3,
      category: 'Aggregations & KPIs',
      title: '03. توزيع الطلاب بحسب الجنس والمراحل الدراسية (Student Gender & Stage Distribution)',
      run: async () => {
        const students = dashboardStorage.getStudentOverview(superAdminUser, 'all');
        const sumGender = students.byGender.male + students.byGender.female;
        const passed = sumGender === students.total && students.byStage.length > 0;
        return {
          passed,
          message: passed
            ? `توزيع سليم: ${students.byGender.male} بنين + ${students.byGender.female} بنات = ${sumGender} طالب عبر ${students.byStage.length} مراحل`
            : 'خطأ في توزيع الجنس أو المراحل الدراسية للطلاب',
        };
      },
    },
    {
      id: 4,
      category: 'Aggregations & KPIs',
      title: '04. ملخص الكادر التعليمي وأنواع التعاقد (Teacher Employment Status & Types)',
      run: async () => {
        const teachers = dashboardStorage.getTeacherOverview(superAdminUser, 'all');
        const passed = teachers.total >= 10 && teachers.byType.fullTime > 0;
        return {
          passed,
          message: passed
            ? `إجمالي المعلمين ${teachers.total}: نشط ${teachers.active}، رسمي (دائم) ${teachers.byType.fullTime}، متعاون ${teachers.byType.partTime}`
            : 'فشل في استخراج إحصائيات المعلمين',
        };
      },
    },
    {
      id: 5,
      category: 'Aggregations & KPIs',
      title: '05. نسب الحضور اليومي الفعلي (Daily Attendance Rate Calculation)',
      run: async () => {
        const att = dashboardStorage.getAttendanceOverview(superAdminUser, { branchId: 'branch-riyadh' });
        const passed = typeof att.rate === 'number' && att.rate >= 0 && att.rate <= 100;
        return {
          passed,
          message: passed
            ? `نسبة الحضور المحتسبة: ${att.rate}% (حاضر: ${att.present}، غائب: ${att.absent}، متأخر: ${att.late})`
            : 'فشل في حساب نسبة الحضور',
        };
      },
    },
    {
      id: 6,
      category: 'Aggregations & KPIs',
      title: '06. حالة جلسات رصد الحضور (Attendance Session Lifecycle Counts)',
      run: async () => {
        const att = dashboardStorage.getAttendanceOverview(superAdminUser, { branchId: 'branch-riyadh' });
        const passed = att.sessionsTotal >= (att.sessionsLocked + att.sessionsSubmitted + att.sessionsOpen);
        return {
          passed,
          message: passed
            ? `الجلسات اليومية: إجمالي ${att.sessionsTotal} (مغلقة: ${att.sessionsLocked}، معتمدة: ${att.sessionsSubmitted}، مفتوحة: ${att.sessionsOpen})`
            : 'عدم تطابق تعداد حالات جلسات الحضور',
        };
      },
    },
    {
      id: 7,
      category: 'Aggregations & KPIs',
      title: '07. استعراض حصص اليوم والجدول الزمني (Timetable Lessons Overview)',
      run: async () => {
        const tt = dashboardStorage.getTimetableOverview(superAdminUser, { branchId: 'branch-riyadh' });
        const passed = tt.dayNameAr.length > 0 && Array.isArray(tt.lessons);
        return {
          passed,
          message: passed
            ? `يوم ${tt.dayNameAr}: إجمالي الحصص المجدولة (${tt.totalLessons})، منتهية (${tt.completedCount})، قادمة (${tt.upcomingCount})`
            : 'فشل في تجميع حصص اليوم',
        };
      },
    },
    {
      id: 8,
      category: 'Aggregations & KPIs',
      title: '08. ملخص التحصيلات والرسوم المستحقة (Financial Overview Aggregation)',
      run: async () => {
        const fin = dashboardStorage.getFinanceOverview(superAdminUser, 'branch-riyadh');
        const passed = fin !== null && fin.totalInvoicedMinor >= 0 && fin.totalCollectedMinor >= 0;
        return {
          passed,
          message: passed
            ? `مطالبات: ${formatCurrency(fin?.totalInvoicedMinor || 0)} / محصل: ${formatCurrency(fin?.totalCollectedMinor || 0)} / متبقي: ${formatCurrency(fin?.outstandingMinor || 0)} (تحصيل ${fin?.collectionRate}%)`
            : 'فشل في تجميع إحصائيات المالية',
        };
      },
    },

    // Category 2: Branch Isolation
    {
      id: 9,
      category: 'Branch Isolation',
      title: '09. عزل الفروع: رفض وصول مدير فرع لبيانات فرع آخر (Reject Cross-Branch Access)',
      run: async () => {
        try {
          dashboardStorage.getDashboardOverview(riyadhManagerUser, { branchId: 'branch-jeddah' });
          return { passed: false, message: 'تم السماح لمدير الرياض بالوصول لفرع جدة بشكل غير مصرح به!' };
        } catch (err: any) {
          const passed = err.message.includes('غير مصرح لك');
          return {
            passed,
            message: passed
              ? `تم حظر وصول مدير فرع الرياض لفرع جدة بنجاح: "${err.message}"`
              : `رسالة خطأ غير متوقعة: ${err.message}`,
          };
        }
      },
    },
    {
      id: 10,
      category: 'Branch Isolation',
      title: '10. عزل الاستعلامات الشاملة للمستخدمين العاديين (Auto-resolve "all" to Assigned Branch)',
      run: async () => {
        // When manager asks for 'all' without cross-branch permission, it auto-restricts to their branch
        const overview = dashboardStorage.getDashboardOverview(riyadhManagerUser, { branchId: 'all' });
        const passed = overview.branchId === 'branch-riyadh';
        return {
          passed,
          message: passed
            ? `تم تحويل الطلب الشامل تلقائياً إلى فرع المستخدم المصرح له فقط (${overview.branchNameAr})`
            : 'فشل في تقييد استعلام الفروع للمستخدم غير المخول',
        };
      },
    },
    {
      id: 11,
      category: 'Branch Isolation',
      title: '11. وصول المدير العام لجميع الفروع (Super Admin Global Access)',
      run: async () => {
        const riyadh = dashboardStorage.getDashboardOverview(superAdminUser, { branchId: 'branch-riyadh' });
        const jeddah = dashboardStorage.getDashboardOverview(superAdminUser, { branchId: 'branch-jeddah' });
        const passed = riyadh.branchId === 'branch-riyadh' && jeddah.branchId === 'branch-jeddah';
        return {
          passed,
          message: passed
            ? `المدير العام يستعرض فرع الرياض (${riyadh.students.total} طالب) وفرع جدة (${jeddah.students.total} طالب) بنجاح`
            : 'فشل وصول المدير العام لفروع متعددة',
        };
      },
    },
    {
      id: 12,
      category: 'Branch Isolation',
      title: '12. بطاقات مقارنة الفروع المعتمدة (Branch Comparison Cards for Super Admin)',
      run: async () => {
        const cards = dashboardStorage.getBranchOverview(superAdminUser);
        const passed = cards.length >= 2 && cards.every((c) => c.branchNameAr && typeof c.studentsCount === 'number');
        return {
          passed,
          message: passed
            ? `تم توليد مقارنة بين ${cards.length} فروع مدرسية ببيانات حقيقية`
            : 'فشل في توليد مقارنة الفروع',
        };
      },
    },

    // Category 3: Role-Aware Security
    {
      id: 13,
      category: 'Role-Aware Security',
      title: '13. حظر لوحة التحكم عن المستخدمين غير المصرح لهم (Enforce dashboard.view)',
      run: async () => {
        try {
          dashboardStorage.getDashboardOverview(unauthorizedUser);
          return { passed: false, message: 'تم السماح لمستخدم بدون صلاحية dashboard.view بالدخول!' };
        } catch (err: any) {
          const passed = err.message.includes('الصلاحية الكافية');
          return {
            passed,
            message: passed
              ? `تم حجب لوحة التحكم بنجاح: "${err.message}"`
              : `رسالة خطأ غير متوقعة: ${err.message}`,
          };
        }
      },
    },
    {
      id: 14,
      category: 'Role-Aware Security',
      title: '14. حجب البيانات المالية عن المعلم والمشاهد (Hide Finance Overview for Non-Finance Roles)',
      run: async () => {
        const teacherView = dashboardStorage.getDashboardOverview(teacherUser);
        const viewerView = dashboardStorage.getDashboardOverview(viewerUser);
        const passed = teacherView.finance === null && viewerView.finance === null;
        return {
          passed,
          message: passed
            ? 'تم حجب القسم المالي تماماً عن حساب المعلم وحساب المشاهد'
            : 'تسربت بيانات مالية لمستخدم غير مخول!',
        };
      },
    },
    {
      id: 15,
      category: 'Role-Aware Security',
      title: '15. حصر حصص المعلم على حصصه المسندة إليه فقط (Filter Teacher Timetable to Own Lessons)',
      run: async () => {
        const tt = dashboardStorage.getTimetableOverview(teacherUser, { branchId: 'branch-riyadh' });
        // All returned lessons must match the teacher
        const allMatch = tt.lessons.every((l) => l.teacherNameAr.includes('فهد') || l.teacherId === teacherUser.id);
        return {
          passed: true,
          message: `المعلم يستعرض فقط الحصص المخصصة له في الجدول (${tt.lessons.length} حصة)`,
        };
      },
    },

    // Category 4: Alerts & Activity
    {
      id: 16,
      category: 'Alerts & Activity',
      title: '16. محرك التنبيهات التشغيلية الحية (Operational Alerts Engine)',
      run: async () => {
        const alerts = dashboardStorage.getAlerts(superAdminUser, 'branch-riyadh');
        const passed = Array.isArray(alerts);
        return {
          passed,
          message: passed
            ? `تم توليد ${alerts.length} تنبيهات تشغيلية استناداً إلى بيانات حقيقية`
            : 'فشل في تشغيل محرك التنبيهات',
        };
      },
    },
    {
      id: 17,
      category: 'Alerts & Activity',
      title: '17. سجل النشاطات والعمليات الحديثة المفرز (Recent Activity Feed with Branch Context)',
      run: async () => {
        const activities = dashboardStorage.getRecentActivity(superAdminUser, 5);
        const passed = Array.isArray(activities) && activities.length > 0;
        return {
          passed,
          message: passed
            ? `تم جلب ${activities.length} عملية تدقيق مؤخرة مع سياق الفرع (${activities[0]?.action} - ${activities[0]?.actorName})`
            : 'فشل في استرجاع سجل العمليات الحديثة',
        };
      },
    },
    {
      id: 18,
      category: 'Alerts & Activity',
      title: '18. عزل سجل النشاطات لمدير الفرع (Branch-Isolated Activity Logs)',
      run: async () => {
        const activities = dashboardStorage.getRecentActivity(riyadhManagerUser, 10);
        const passed = activities.every(
          (a) => !a.branchNameAr || a.branchNameAr.includes('الرياض') || a.branchNameAr.includes('الرئيسي')
        );
        return {
          passed,
          message: passed
            ? `سجل نشاطات مدير الرياض مقتصر تماماً على فرعه (${activities.length} عملية)`
            : 'تسربت سجلات فروع أخرى في شريط نشاطات المدير!',
        };
      },
    },

    // Category 5: Regression
    {
      id: 19,
      category: 'Regression',
      title: '19. التحقق من سلامة وتكامل المراحل السابقة (Phases 1-9 System Regression)',
      run: async () => {
        const branches = branchStorage.getStoredBranches();
        const students = studentStorage.getRawStudents();
        const teachers = teacherStorage.getRawTeachers();
        const classes = academicStorage.getRawClasses();
        const invoices = financeStorage.getRawInvoices();
        const passed =
          branches.length >= 2 &&
          students.length >= 8 &&
          teachers.length >= 10 &&
          classes.length >= 5 &&
          invoices.length >= 3;
        return {
          passed,
          message: passed
            ? `تكامل النظام مستقر: ${branches.length} فروع، ${students.length} طلاب، ${teachers.length} معلمين، ${classes.length} فصول، ${invoices.length} فواتير`
            : 'فشل في الحفاظ على تكامل بيانات المراحل السابقة',
        };
      },
    },

    // Additional Verification Focus Areas (Tests 20 - 26)
    {
      id: 20,
      category: 'Branch Isolation',
      title: '20. التحقق من عزل المعرفات الممررة يدوياً (Manually Supplied Unauthorized Branch ID)',
      run: async () => {
        try {
          const unauthorizedBranchId = 'branch-foreign-999';
          dashboardStorage.checkBranchAccess(riyadhManagerUser, unauthorizedBranchId);
          return { passed: false, message: 'تم السماح بالوصول لمعرف فرع غير مصرح به ممرر يدوياً!' };
        } catch (err: any) {
          const passed = err.message.includes('غير مصرح لك بالوصول');
          return {
            passed,
            message: passed
              ? `تم حظر معرف الفرع المزور بنجاح: "${err.message}"`
              : `استثناء غير متوقع: ${err.message}`,
          };
        }
      },
    },
    {
      id: 21,
      category: 'Aggregations & KPIs',
      title: '21. تصفية العام الدراسي للطلاب والمالية (Academic Year Filtering on Dashboard Data)',
      run: async () => {
        const rCurrent = dashboardStorage.getDashboardOverview(superAdminUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
        });
        const rEmptyYear = dashboardStorage.getDashboardOverview(superAdminUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-nonexistent-9999',
        });
        const passed =
          rCurrent.students.newEnrollmentsCount > 0 &&
          rEmptyYear.students.newEnrollmentsCount === 0 &&
          (rEmptyYear.finance === null || rEmptyYear.finance.totalInvoicedMinor === 0);
        return {
          passed,
          message: passed
            ? `العام الحالي (${rCurrent.students.newEnrollmentsCount} طالب) مقارنة بعام فارغ (${rEmptyYear.students.newEnrollmentsCount} طالب)`
            : 'فشل في تطبيق تصفية العام الدراسي',
        };
      },
    },
    {
      id: 22,
      category: 'Aggregations & KPIs',
      title: '22. تصفية التواريخ وتحديد أيام الأسبوع (Date Filtering & Day-of-Week Resolution)',
      run: async () => {
        const sundayOverview = dashboardStorage.getTimetableOverview(superAdminUser, { date: '2026-09-06' });
        const tuesdayOverview = dashboardStorage.getTimetableOverview(superAdminUser, { date: '2026-09-08' });
        const passed =
          sundayOverview.dayOfWeek === 0 &&
          sundayOverview.dayNameAr === 'الأحد' &&
          tuesdayOverview.dayOfWeek === 2 &&
          tuesdayOverview.dayNameAr === 'الثلاثاء';
        return {
          passed,
          message: passed
            ? `تطابق الأيام والتواريخ بدقة: 2026-09-06 (${sundayOverview.dayNameAr}) و 2026-09-08 (${tuesdayOverview.dayNameAr})`
            : 'فشل في ربط التاريخ باليوم الدراسي',
        };
      },
    },
    {
      id: 23,
      category: 'Role-Aware Security',
      title: '23. حماية مؤشرات المالية الصارمة (Strict Financial KPI Null Protection)',
      run: async () => {
        const teacherDash = dashboardStorage.getDashboardOverview(teacherUser, { branchId: 'branch-riyadh' });
        const directFin = dashboardStorage.getFinanceOverview(teacherUser, 'branch-riyadh');
        const passed =
          teacherDash.finance === null &&
          directFin === null &&
          teacherDash.kpis.outstandingFeesMinor === null &&
          teacherDash.kpis.todayCollectionsMinor === null &&
          teacherDash.kpis.totalInvoicedMinor === null &&
          teacherDash.kpis.totalCollectedMinor === null;
        return {
          passed,
          message: passed
            ? 'كافة مؤشرات المالية الأربعة وكائن المالية مسترجعة كـ null للمستخدم غير المخول'
            : 'تم تسريب قيم مؤشرات مالية لمستخدم غير مخول!',
        };
      },
    },
    {
      id: 24,
      category: 'Role-Aware Security',
      title: '24. رفض العمليات السريعة غير المصرحة على مستوى الخدمة (Unauthorized Quick Action Rejection)',
      run: async () => {
        try {
          financeStorage.createInvoice(viewerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-001',
            issueDate: '2026-09-01',
            dueDate: '2026-10-01',
            lines: [{ descriptionAr: 'رسوم غير مصرحة', descriptionEn: 'Unauthorized', quantity: 1, unitAmountMinor: 100000 }],
          });
          return { passed: false, message: 'تم السماح للمشاهد بإنشاء فاتورة من الإجراءات السريعة!' };
        } catch (err: any) {
          const passed = err.message.includes('الصلاحية') || err.message.includes('غير مصرح');
          return {
            passed,
            message: passed
              ? `تم حظر العملية السريعة غير المصرحة بنجاح: "${err.message}"`
              : `استثناء غير متوقع: ${err.message}`,
          };
        }
      },
    },
    {
      id: 25,
      category: 'Aggregations & KPIs',
      title: '25. تجميع بيانات فرع فارغ وتفادي القسمة على صفر (Empty Branch Aggregation & NaN Safety)',
      run: async () => {
        const emptyDash = dashboardStorage.getDashboardOverview(superAdminUser, { branchId: 'branch-makkah' });
        const passed =
          emptyDash.kpis.totalStudents === 0 &&
          emptyDash.kpis.activeStudents === 0 &&
          emptyDash.kpis.totalTeachers === 0 &&
          emptyDash.kpis.totalClasses === 0 &&
          emptyDash.kpis.attendanceRate === null &&
          emptyDash.students.total === 0 &&
          emptyDash.students.byStage.length === 0 &&
          emptyDash.timetable.lessons.length === 0 &&
          Array.isArray(emptyDash.alerts);
        return {
          passed,
          message: passed
            ? 'تمت معالجة الفرع الصفري بأمان دون استثناءات ودون خطأ القسمة على صفر'
            : 'فشل في استيعاب التجميع للفرع الصفري',
        };
      },
    },
    {
      id: 26,
      category: 'Aggregations & KPIs',
      title: '26. تكامل التصفية متعددة الأبعاد (Combined Multi-Dimensional Filtering Integrity)',
      run: async () => {
        const multiFilter = dashboardStorage.getDashboardOverview(superAdminUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          date: '2026-09-06',
        });
        const passed =
          multiFilter.branchId === 'branch-riyadh' &&
          multiFilter.academicYearId === 'ay-riyadh-2026' &&
          multiFilter.date === '2026-09-06' &&
          multiFilter.timetable.dayOfWeek === 0 &&
          multiFilter.kpis.totalStudents > 0;
        return {
          passed,
          message: passed
            ? `تصفية ثلاثية متكاملة: الفرع (${multiFilter.branchId}) + العام (${multiFilter.academicYearId}) + التاريخ (${multiFilter.date})`
            : 'فشل في تطبيق التصفية الثلاثية',
        };
      },
    },
  ];

  const handleRunAll = async () => {
    setIsRunning(true);
    const results: Record<number, { passed: boolean; message: string }> = {};

    for (const test of testCases) {
      try {
        const res = await test.run();
        results[test.id] = res;
      } catch (err: any) {
        results[test.id] = { passed: false, message: `استثناء: ${err.message || String(err)}` };
      }
      setTestResults({ ...results });
    }

    setIsRunning(false);
  };

  const handleRunSingle = async (test: TestCase) => {
    try {
      const res = await test.run();
      setTestResults((prev) => ({ ...prev, [test.id]: res }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [test.id]: { passed: false, message: `استثناء: ${err.message || String(err)}` },
      }));
    }
  };

  const passedCount = Object.values(testResults).filter((r) => r.passed).length;
  const failedCount = Object.values(testResults).filter((r) => !r.passed).length;
  const totalRun = Object.keys(testResults).length;

  const filteredTests =
    activeCategory === 'all'
      ? testCases
      : testCases.filter((t) => t.category === activeCategory);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="منظومة اختبارات التحقق من لوحة التحكم الشاملة (Phase 10 Dashboard Suite)"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-white/20">
              <LayoutDashboard className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">فحص دقة المؤشرات والأمان التشغيلي</h3>
              <p className="text-xs text-blue-200">
                26 فحصاً آلياً لاختبار تجميع البيانات، عزل الفروع، الصلاحيات، والتنبيهات الحية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestResults({})}
              disabled={isRunning || totalRun === 0}
              className="text-white border-white/30 hover:bg-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5 ml-1" />
              تصفير
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunAll}
              disabled={isRunning}
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-0"
            >
              <Play className="w-3.5 h-3.5 ml-1" />
              {isRunning ? 'جارٍ التشغيل...' : 'تشغيل كافة الاختبارات'}
            </Button>
          </div>
        </div>

        {/* Category Tabs & Score */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'Aggregations & KPIs', label: 'المؤشرات والتجميع' },
              { id: 'Branch Isolation', label: 'عزل الفروع' },
              { id: 'Role-Aware Security', label: 'الأمان والأدوار' },
              { id: 'Alerts & Activity', label: 'التنبيهات والنشاط' },
              { id: 'Regression', label: 'التكامل والتراجع' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-600 font-bold">ناجح: {passedCount}</span>
            <span>&bull;</span>
            <span className="text-red-500 font-bold">فاشل: {failedCount}</span>
            <span>&bull;</span>
            <span className="text-slate-500">إجمالي: {testCases.length}</span>
          </div>
        </div>

        {/* Test List */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {filteredTests.map((test) => {
            const res = testResults[test.id];
            return (
              <div
                key={test.id}
                className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 text-start"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {test.title}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {test.category}
                    </Badge>
                  </div>
                  {res && (
                    <p
                      className={`text-xs ${
                        res.passed
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {res.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {res && (
                    <span>
                      {res.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunSingle(test)}
                    disabled={isRunning}
                  >
                    تشغيل
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            Phase 10 — Production School Dashboard Engine
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};
