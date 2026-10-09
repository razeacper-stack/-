/**
 * Phase 10: Dashboard & School Overview Aggregation Service
 * 
 * Central data layer aggregating real application services with zero fake/mock data.
 * Enforces strict branch isolation and granular permission control.
 */

import { SafeUser } from '../types/auth';
import {
  DashboardFilterParams,
  DashboardOverviewData,
  DashboardKpis,
  StudentDashboardOverview,
  TeacherDashboardOverview,
  AttendanceDashboardOverview,
  TimetableDashboardOverview,
  FinanceDashboardOverview,
  BranchDashboardCard,
  DashboardAlert,
  DashboardActivityItem,
  DashboardLessonItem,
  LessonTimeStatus,
} from '../types/dashboard';
import { DayOfWeek } from '../types/timetable';
import { authStorage } from './authStorage';
import { branchStorage } from './branchStorage';
import { academicStorage } from './academicStorage';
import { studentStorage } from './studentStorage';
import { teacherStorage } from './teacherStorage';
import { timetableStorage } from './timetableStorage';
import { attendanceStorage } from './attendanceStorage';
import { financeStorage } from './financeStorage';
import { FinancialCalculationEngine } from './financialCalculationEngine';
import { addMinor, subtractMinor, SUPPORTED_CURRENCIES } from '../utils/currency';

export class DashboardStorageService {
  private static instance: DashboardStorageService;

  public static getInstance(): DashboardStorageService {
    if (!DashboardStorageService.instance) {
      DashboardStorageService.instance = new DashboardStorageService();
    }
    return DashboardStorageService.instance;
  }

  // =========================================================================
  // Permission & Branch Security Guards
  // =========================================================================

  public checkBranchAccess(actingUser: SafeUser, targetBranchId: string): void {
    if (!targetBranchId || targetBranchId === 'all') {
      return;
    }

    if (authStorage.isSuperAdmin(actingUser) || actingUser.hasAllBranchesAccess) {
      return;
    }

    if (!actingUser.branchIds || !actingUser.branchIds.includes(targetBranchId)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_BRANCH_ACCESS',
        targetType: 'BRANCH',
        targetId: targetBranchId,
        branchContext: targetBranchId,
        result: 'DENIED',
        details: `محاولة وصول غير مصرح بها للوحة تحكم الفرع (${targetBranchId}) من المستخدم (${actingUser.username})`,
      });
      throw new Error(`غير مصرح لك بالوصول إلى بيانات الفرع المحدد (${targetBranchId}).`);
    }
  }

  public canAccessFinance(actingUser: SafeUser): boolean {
    return (
      authStorage.isSuperAdmin(actingUser) ||
      authStorage.hasPermission(actingUser, 'dashboard.view_finance') ||
      authStorage.hasPermission(actingUser, 'fees.view') ||
      authStorage.hasPermission(actingUser, 'finance.view_reports')
    );
  }

  public canAccessCrossBranch(actingUser: SafeUser): boolean {
    return (
      authStorage.isSuperAdmin(actingUser) ||
      actingUser.hasAllBranchesAccess === true ||
      authStorage.hasPermission(actingUser, 'dashboard.view_cross_branch')
    );
  }

  // =========================================================================
  // Central Dashboard Aggregator
  // =========================================================================

  public getDashboardOverview(
    actingUser: SafeUser,
    params: DashboardFilterParams = {}
  ): DashboardOverviewData {
    if (!authStorage.hasPermission(actingUser, 'dashboard.view')) {
      throw new Error('ليس لديك الصلاحية الكافية للوصول إلى لوحة التحكم (dashboard.view).');
    }

    const branches = branchStorage.getStoredBranches();
    const years = academicStorage.getRawYears();

    // Determine target branch
    let targetBranchId = params.branchId || 'all';

    // If user is restricted to specific branch and asks for 'all' without cross-branch permission
    if (targetBranchId === 'all' && !this.canAccessCrossBranch(actingUser)) {
      targetBranchId = actingUser.branchIds[0] || '';
    }

    if (targetBranchId !== 'all') {
      this.checkBranchAccess(actingUser, targetBranchId);
    }

    // Determine academic year
    const activeYear = years.find((y) => y.isCurrent) || years[0];
    const academicYearId = params.academicYearId || activeYear?.id || '';

    // Date
    const todayStr = params.date || new Date().toISOString().split('T')[0];

    // Branch names
    let branchNameAr = 'كافة الفروع المدرسية';
    let branchNameEn = 'All School Branches';
    if (targetBranchId !== 'all') {
      const b = branches.find((item) => item.id === targetBranchId);
      if (b) {
        branchNameAr = b.nameAr;
        branchNameEn = b.nameEn;
      }
    }

    // Academic Year names
    let academicYearNameAr = 'العام الدراسي الحالي';
    let academicYearNameEn = 'Current Academic Year';
    const targetYear = years.find((y) => y.id === academicYearId);
    if (targetYear) {
      academicYearNameAr = targetYear.nameAr;
      academicYearNameEn = targetYear.nameEn;
    }

    // 1. Student Aggregations
    const studentsOverview = this.getStudentOverview(actingUser, targetBranchId, academicYearId);

    // 2. Teacher Aggregations
    const teachersOverview = this.getTeacherOverview(actingUser, targetBranchId);

    // 3. Attendance Aggregations
    const attendanceOverview = this.getAttendanceOverview(actingUser, {
      branchId: targetBranchId,
      date: todayStr,
      classId: params.classId,
    });

    // 4. Timetable Aggregations
    const timetableOverview = this.getTimetableOverview(actingUser, {
      branchId: targetBranchId,
      date: todayStr,
      classId: params.classId,
      academicYearId,
    });

    // 5. Finance Aggregations (Permission Protected)
    const financeOverview = this.canAccessFinance(actingUser)
      ? this.getFinanceOverview(actingUser, targetBranchId, academicYearId)
      : null;

    // 6. Branch Comparison (for cross-branch view)
    const branchCards = this.getBranchOverview(actingUser, academicYearId);

    // 7. Dynamic Real Alerts
    const alerts = this.getAlerts(actingUser, targetBranchId, academicYearId, todayStr);

    // 8. Recent Activity
    const recentActivity = this.getRecentActivity(actingUser, 10);

    // 9. Classes and subjects counts
    let allClasses = academicStorage.getRawClasses();
    let allSubjects = academicStorage.getRawSubjects();
    if (targetBranchId !== 'all') {
      allClasses = allClasses.filter((c) => c.branchId === targetBranchId);
      allSubjects = allSubjects.filter((s) => s.branchId === targetBranchId);
    } else if (!authStorage.isSuperAdmin(actingUser) && !actingUser.hasAllBranchesAccess) {
      allClasses = allClasses.filter((c) => actingUser.branchIds.includes(c.branchId));
      allSubjects = allSubjects.filter((s) => actingUser.branchIds.includes(s.branchId));
    }

    // 10. Top KPIs
    const kpis: DashboardKpis = {
      totalStudents: studentsOverview.total,
      activeStudents: studentsOverview.active,
      inactiveStudents: studentsOverview.inactive,
      totalTeachers: teachersOverview.total,
      activeTeachers: teachersOverview.active,
      totalClasses: allClasses.filter((c) => c.status === 'active').length,
      totalSubjects: allSubjects.filter((s) => s.status === 'active').length,
      attendanceRate: attendanceOverview.hasRecords ? attendanceOverview.rate : null,
      todayPresentCount: attendanceOverview.present,
      todayAbsentCount: attendanceOverview.absent,
      todayLateCount: attendanceOverview.late,
      todayExcusedCount: attendanceOverview.excused,
      todayEarlyDepartureCount: attendanceOverview.earlyDeparture,
      todayLessonsCount: timetableOverview.totalLessons,
      outstandingFeesMinor: financeOverview ? financeOverview.outstandingMinor : null,
      todayCollectionsMinor: financeOverview ? this.getTodayCollections(targetBranchId, todayStr) : null,
      totalInvoicedMinor: financeOverview ? financeOverview.totalInvoicedMinor : null,
      totalCollectedMinor: financeOverview ? financeOverview.totalCollectedMinor : null,
    };

    return {
      branchId: targetBranchId,
      branchNameAr,
      branchNameEn,
      academicYearId,
      academicYearNameAr,
      academicYearNameEn,
      date: todayStr,
      isSuperAdmin: authStorage.isSuperAdmin(actingUser),
      canViewFinance: !!financeOverview,
      canViewCrossBranch: this.canAccessCrossBranch(actingUser),
      kpis,
      students: studentsOverview,
      teachers: teachersOverview,
      attendance: attendanceOverview,
      timetable: timetableOverview,
      finance: financeOverview,
      branches: branchCards,
      alerts,
      recentActivity,
    };
  }

  // =========================================================================
  // Student Overview Section
  // =========================================================================

  public getStudentOverview(
    actingUser: SafeUser,
    branchId = 'all',
    academicYearId?: string
  ): StudentDashboardOverview {
    if (branchId !== 'all') {
      this.checkBranchAccess(actingUser, branchId);
    }

    let students = studentStorage.getRawStudents();
    let enrollments = studentStorage.getRawEnrollments();
    const stages = academicStorage.getRawStages();
    const grades = academicStorage.getRawGrades();
    const classes = academicStorage.getRawClasses();

    if (branchId !== 'all') {
      students = students.filter((s) => s.branchId === branchId);
      enrollments = enrollments.filter((e) => e.branchId === branchId);
    } else if (!authStorage.isSuperAdmin(actingUser) && !actingUser.hasAllBranchesAccess) {
      students = students.filter((s) => actingUser.branchIds.includes(s.branchId));
      enrollments = enrollments.filter((e) => actingUser.branchIds.includes(e.branchId));
    }

    if (academicYearId) {
      enrollments = enrollments.filter((e) => e.academicYearId === academicYearId);
    }

    const total = students.length;
    const active = students.filter((s) => s.status === 'ACTIVE').length;
    const inactive = total - active;

    const male = students.filter((s) => s.gender === 'male').length;
    const female = students.filter((s) => s.gender === 'female').length;

    // By Stage
    const byStage = stages
      .filter((st) => (branchId === 'all' ? true : st.branchId === branchId))
      .map((st) => {
        const stageEnrollments = enrollments.filter((e) => e.stageId === st.id && e.status === 'ENROLLED');
        return {
          stageId: st.id,
          nameAr: st.nameAr,
          nameEn: st.nameEn,
          count: stageEnrollments.length,
        };
      })
      .filter((item) => item.count > 0 || total === 0);

    // By Grade
    const byGrade = grades
      .filter((gr) => (branchId === 'all' ? true : gr.branchId === branchId))
      .map((gr) => {
        const stage = stages.find((s) => s.id === gr.stageId);
        const gradeEnrollments = enrollments.filter((e) => e.gradeId === gr.id && e.status === 'ENROLLED');
        return {
          gradeId: gr.id,
          nameAr: gr.nameAr,
          nameEn: gr.nameEn,
          stageNameAr: stage?.nameAr || '',
          count: gradeEnrollments.length,
        };
      })
      .filter((item) => item.count > 0 || total === 0);

    // By Class
    const byClass = classes
      .filter((c) => (branchId === 'all' ? true : c.branchId === branchId) && c.status === 'active')
      .map((c) => {
        const grade = grades.find((g) => g.id === c.gradeId);
        const classEnrollments = enrollments.filter((e) => e.classId === c.id && e.status === 'ENROLLED');
        return {
          classId: c.id,
          nameAr: c.nameAr,
          nameEn: c.nameEn,
          gradeNameAr: grade?.nameAr || '',
          count: classEnrollments.length,
          capacity: c.capacity,
        };
      });

    return {
      total,
      active,
      inactive,
      byGender: { male, female },
      byStage,
      byGrade,
      byClass,
      newEnrollmentsCount: enrollments.filter((e) => e.status === 'ENROLLED').length,
    };
  }

  // =========================================================================
  // Teacher Overview Section
  // =========================================================================

  public getTeacherOverview(actingUser: SafeUser, branchId = 'all'): TeacherDashboardOverview {
    if (branchId !== 'all') {
      this.checkBranchAccess(actingUser, branchId);
    }

    let teachers = teacherStorage.getRawTeachers();
    const subjects = academicStorage.getRawSubjects();
    const teacherSubjectLinks = teacherStorage.getRawTeacherSubjects();
    let entries = timetableStorage.getRawTimetableEntries();

    if (branchId !== 'all') {
      teachers = teachers.filter((t) => t.branchId === branchId);
      entries = entries.filter((e) => e.branchId === branchId);
    } else if (!authStorage.isSuperAdmin(actingUser) && !actingUser.hasAllBranchesAccess) {
      teachers = teachers.filter((t) => actingUser.branchIds.includes(t.branchId));
      entries = entries.filter((e) => actingUser.branchIds.includes(e.branchId));
    }

    const total = teachers.length;
    const active = teachers.filter((t) => t.employmentStatus === 'ACTIVE').length;
    const inactive = teachers.filter((t) => t.employmentStatus === 'INACTIVE').length;
    const onLeave = teachers.filter((t) => t.employmentStatus === 'ON_LEAVE').length;
    const suspended = teachers.filter((t) => t.employmentStatus === 'SUSPENDED').length;

    const fullTime = teachers.filter((t) => t.employmentType === 'FULL_TIME').length;
    const partTime = teachers.filter((t) => t.employmentType === 'PART_TIME').length;

    // By Subject
    const subjectMap: Record<string, { nameAr: string; count: number }> = {};
    for (const t of teachers) {
      const subLinks = teacherSubjectLinks.filter((ts) => ts.teacherId === t.id);
      for (const link of subLinks) {
        const sub = subjects.find((s) => s.id === link.subjectId);
        const name = sub?.nameAr || link.subjectId;
        if (!subjectMap[link.subjectId]) {
          subjectMap[link.subjectId] = { nameAr: name, count: 0 };
        }
        subjectMap[link.subjectId].count++;
      }
    }

    const bySubject = Object.entries(subjectMap).map(([subjectId, data]) => ({
      subjectId,
      nameAr: data.nameAr,
      count: data.count,
    }));

    // Workload Summary (Weekly periods assigned)
    const workloadSummary = teachers
      .filter((t) => t.employmentStatus === 'ACTIVE')
      .map((t) => {
        const teacherPeriods = entries.filter((e) => e.teacherId === t.id && e.status === 'PUBLISHED').length;
        const max = 24;
        return {
          teacherId: t.id,
          nameAr: `${t.firstNameAr} ${t.lastNameAr}`,
          weeklyPeriods: teacherPeriods,
          isOverloaded: teacherPeriods > max,
        };
      });

    return {
      total,
      active,
      inactive,
      onLeave,
      suspended,
      byType: { fullTime, partTime },
      bySubject,
      workloadSummary,
    };
  }

  // =========================================================================
  // Attendance Overview Section
  // =========================================================================

  public getAttendanceOverview(
    actingUser: SafeUser,
    params: { branchId?: string; date?: string; classId?: string }
  ): AttendanceDashboardOverview {
    const branchId = params.branchId || 'all';
    if (branchId !== 'all') {
      this.checkBranchAccess(actingUser, branchId);
    }

    const date = params.date || new Date().toISOString().split('T')[0];
    let records = attendanceStorage.getRawRecords().filter((r) => r.date === date && r.type === 'DAILY');
    let sessions = attendanceStorage.getRawSessions().filter((s) => s.date === date && s.type === 'DAILY');
    let students = studentStorage.getRawStudents().filter((s) => s.status === 'ACTIVE');

    if (branchId !== 'all') {
      records = records.filter((r) => r.branchId === branchId);
      sessions = sessions.filter((s) => s.branchId === branchId);
      students = students.filter((s) => s.branchId === branchId);
    } else if (!authStorage.isSuperAdmin(actingUser) && !actingUser.hasAllBranchesAccess) {
      records = records.filter((r) => actingUser.branchIds.includes(r.branchId));
      sessions = sessions.filter((s) => actingUser.branchIds.includes(s.branchId));
      students = students.filter((s) => actingUser.branchIds.includes(s.branchId));
    }

    if (params.classId) {
      records = records.filter((r) => r.classId === params.classId);
      sessions = sessions.filter((s) => s.classId === params.classId);
    }

    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const excused = records.filter((r) => r.status === 'EXCUSED').length;
    const earlyDeparture = records.filter((r) => r.status === 'EARLY_DEPARTURE').length;

    const totalRecorded = records.length;
    const effectivePresent = present + late + earlyDeparture;
    const rate = totalRecorded > 0 ? Math.round((effectivePresent / totalRecorded) * 100) : 0;

    const unrecordedCount = Math.max(0, students.length - totalRecorded);

    const sessionsLocked = sessions.filter((s) => s.status === 'LOCKED').length;
    const sessionsSubmitted = sessions.filter((s) => s.status === 'SUBMITTED').length;
    const sessionsOpen = sessions.filter((s) => s.status === 'OPEN').length;

    return {
      date,
      rate,
      present,
      absent,
      late,
      excused,
      earlyDeparture,
      unrecordedCount,
      hasRecords: totalRecorded > 0,
      sessionsTotal: sessions.length,
      sessionsLocked,
      sessionsSubmitted,
      sessionsOpen,
    };
  }

  // =========================================================================
  // Timetable Overview Section
  // =========================================================================

  public getTimetableOverview(
    actingUser: SafeUser,
    params: { branchId?: string; date?: string; classId?: string; academicYearId?: string }
  ): TimetableDashboardOverview {
    const branchId = params.branchId || 'all';
    if (branchId !== 'all') {
      this.checkBranchAccess(actingUser, branchId);
    }

    const dateStr = params.date || new Date().toISOString().split('T')[0];
    const targetDate = new Date(dateStr);
    const dayOfWeek = (targetDate.getDay() % 7) as DayOfWeek;

    const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let entries = timetableStorage.getRawTimetableEntries().filter(
      (e) => e.dayOfWeek === dayOfWeek && e.status === 'PUBLISHED'
    );
    const periods = timetableStorage.getRawPeriods();
    const classes = academicStorage.getRawClasses();
    const subjects = academicStorage.getRawSubjects();
    const teachers = teacherStorage.getRawTeachers();
    const rooms = timetableStorage.getRawRooms();

    if (branchId !== 'all') {
      entries = entries.filter((e) => e.branchId === branchId);
    } else if (!authStorage.isSuperAdmin(actingUser) && !actingUser.hasAllBranchesAccess) {
      entries = entries.filter((e) => actingUser.branchIds.includes(e.branchId));
    }

    if (params.academicYearId) {
      entries = entries.filter((e) => e.academicYearId === params.academicYearId);
    }

    if (params.classId) {
      entries = entries.filter((e) => e.classId === params.classId);
    }

    // Role-aware filtering: If acting user is a TEACHER, show only their assigned lessons
    if (actingUser.roleCode === 'TEACHER') {
      const teacherProfile = teachers.find(
        (t) => (t.email && actingUser.email && t.email.toLowerCase() === actingUser.email.toLowerCase()) || t.id === actingUser.id
      );
      if (teacherProfile) {
        entries = entries.filter((e) => e.teacherId === teacherProfile.id);
      }
    }

    // Time determination (HH:mm)
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMins = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMins}`;
    const isToday = dateStr === now.toISOString().split('T')[0];

    const lessons: DashboardLessonItem[] = entries
      .map((entry) => {
        const prd = periods.find((p) => p.id === entry.periodId);
        const cls = classes.find((c) => c.id === entry.classId);
        const sub = subjects.find((s) => s.id === entry.subjectId);
        const tch = teachers.find((t) => t.id === entry.teacherId);
        const rm = rooms.find((r) => r.id === entry.roomId);

        const startTime = prd?.startTime || '08:00';
        const endTime = prd?.endTime || '08:45';

        let status: LessonTimeStatus = 'UPCOMING';
        if (isToday) {
          if (currentTimeStr >= endTime) {
            status = 'COMPLETED';
          } else if (currentTimeStr >= startTime && currentTimeStr < endTime) {
            status = 'CURRENT';
          } else {
            status = 'UPCOMING';
          }
        }

        return {
          id: entry.id,
          periodId: entry.periodId,
          periodNumber: prd?.periodNumber || 1,
          periodNameAr: prd?.nameAr || `الحصة ${prd?.periodNumber || 1}`,
          periodNameEn: prd?.nameEn || `Period ${prd?.periodNumber || 1}`,
          startTime,
          endTime,
          classId: entry.classId,
          classNameAr: cls?.nameAr || 'فصل غير محدد',
          subjectId: entry.subjectId,
          subjectNameAr: sub?.nameAr || 'مادة غير محددة',
          subjectCode: sub?.subjectCode || '',
          teacherId: entry.teacherId,
          teacherNameAr: tch ? `${tch.firstNameAr} ${tch.lastNameAr}` : 'معلم غير محدد',
          roomId: entry.roomId,
          roomNameAr: rm?.nameAr,
          status,
        };
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const completedCount = lessons.filter((l) => l.status === 'COMPLETED').length;
    const upcomingCount = lessons.filter((l) => l.status === 'UPCOMING' || l.status === 'CURRENT').length;

    // Check published vs unpublished classes
    let branchClasses = classes;
    if (branchId !== 'all') {
      branchClasses = branchClasses.filter((c) => c.branchId === branchId);
    }
    const allPublishedEntries = timetableStorage.getRawTimetableEntries().filter((e) => e.status === 'PUBLISHED');
    const publishedClassesCount = branchClasses.filter((c) => c.status === 'active' && allPublishedEntries.some((e) => e.classId === c.id)).length;
    const unpublishedClassesCount = branchClasses.filter((c) => c.status === 'active' && !allPublishedEntries.some((e) => e.classId === c.id)).length;

    return {
      date: dateStr,
      dayOfWeek,
      dayNameAr: dayNamesAr[dayOfWeek],
      dayNameEn: dayNamesEn[dayOfWeek],
      totalLessons: lessons.length,
      completedCount,
      upcomingCount,
      lessons,
      publishedClassesCount,
      unpublishedClassesCount,
    };
  }

  // =========================================================================
  // Finance Overview Section (Permission Protected)
  // =========================================================================

  public getFinanceOverview(
    actingUser: SafeUser,
    branchId = 'all',
    academicYearId?: string
  ): FinanceDashboardOverview | null {
    if (!this.canAccessFinance(actingUser)) {
      return null;
    }

    if (branchId !== 'all') {
      this.checkBranchAccess(actingUser, branchId);
    }

    const settings = financeStorage.getFinanceSettings();
    let invoices = financeStorage.getRawInvoices().filter((i) => i.status !== 'VOID');
    let payments = financeStorage.getRawPayments().filter((p) => p.status === 'COMPLETED');
    let refunds = financeStorage.getRawRefunds().filter((r) => r.status === 'PROCESSED');

    if (branchId !== 'all') {
      invoices = invoices.filter((i) => i.branchId === branchId);
      payments = payments.filter((p) => p.branchId === branchId);
      refunds = refunds.filter((r) => r.branchId === branchId);
    } else if (!authStorage.isSuperAdmin(actingUser) && !actingUser.hasAllBranchesAccess) {
      invoices = invoices.filter((i) => actingUser.branchIds.includes(i.branchId));
      payments = payments.filter((p) => actingUser.branchIds.includes(p.branchId));
      refunds = refunds.filter((r) => actingUser.branchIds.includes(r.branchId));
    }

    if (academicYearId) {
      invoices = invoices.filter((i) => i.academicYearId === academicYearId);
      payments = payments.filter((p) => p.academicYearId === academicYearId);
    }

    let totalInvoicedMinor = 0;
    let totalCollectedMinor = 0;
    let outstandingMinor = 0;
    let overdueMinor = 0;
    let overdueInvoicesCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    for (const inv of invoices) {
      totalInvoicedMinor = addMinor(totalInvoicedMinor, inv.netTotalMinor);
      totalCollectedMinor = addMinor(totalCollectedMinor, inv.paidTotalMinor);
      outstandingMinor = addMinor(outstandingMinor, inv.balanceDueMinor);

      if (inv.balanceDueMinor > 0 && inv.dueDate < todayStr) {
        overdueMinor = addMinor(overdueMinor, inv.balanceDueMinor);
        overdueInvoicesCount++;
      }
    }

    let refundsMinor = 0;
    for (const ref of refunds) {
      refundsMinor = addMinor(refundsMinor, ref.amountMinor);
    }

    const netCollected = Math.max(0, subtractMinor(totalCollectedMinor, refundsMinor));
    const collectionRate =
      totalInvoicedMinor > 0
        ? Math.round((netCollected / totalInvoicedMinor) * 100)
        : 0;

    return {
      currency: SUPPORTED_CURRENCIES[settings.currency] || SUPPORTED_CURRENCIES.SAR,
      totalInvoicedMinor,
      totalCollectedMinor,
      outstandingMinor,
      overdueMinor,
      refundsMinor,
      collectionRate,
      invoicesCount: invoices.length,
      paymentsCount: payments.length,
      overdueInvoicesCount,
    };
  }

  private getTodayCollections(branchId: string, date: string): number {
    let payments = financeStorage.getRawPayments().filter(
      (p) => p.status === 'COMPLETED' && p.paymentDate === date
    );
    if (branchId !== 'all') {
      payments = payments.filter((p) => p.branchId === branchId);
    }
    return payments.reduce((acc, p) => addMinor(acc, p.amountMinor), 0);
  }

  // =========================================================================
  // Branch Overview (Multi-Branch Card Comparison)
  // =========================================================================

  public getBranchOverview(actingUser: SafeUser, academicYearId?: string): BranchDashboardCard[] {
    const branches = branchStorage.getStoredBranches();
    const canSeeFinance = this.canAccessFinance(actingUser);
    const students = studentStorage.getRawStudents();
    const teachers = teacherStorage.getRawTeachers();
    const classes = academicStorage.getRawClasses();
    const records = attendanceStorage.getRawRecords().filter((r) => r.type === 'DAILY');
    const invoices = financeStorage.getRawInvoices().filter((i) => i.status !== 'VOID');
    const payments = financeStorage.getRawPayments().filter((p) => p.status === 'COMPLETED');

    // Filter branches accessible to user
    let allowedBranches = branches;
    if (!authStorage.isSuperAdmin(actingUser) && !actingUser.hasAllBranchesAccess) {
      allowedBranches = branches.filter((b) => actingUser.branchIds.includes(b.id));
    }

    return allowedBranches.map((b) => {
      const bStudents = students.filter((s) => s.branchId === b.id && s.status === 'ACTIVE').length;
      const bTeachers = teachers.filter((t) => t.branchId === b.id && t.employmentStatus === 'ACTIVE').length;
      const bClasses = classes.filter((c) => c.branchId === b.id && c.status === 'active').length;

      const bRecords = records.filter((r) => r.branchId === b.id);
      const bPresent = bRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
      const attendanceRate = bRecords.length > 0 ? Math.round((bPresent / bRecords.length) * 100) : null;

      let financeSummary: { invoicedMinor: number; collectedMinor: number; outstandingMinor: number } | undefined;
      if (canSeeFinance) {
        let bInvoices = invoices.filter((i) => i.branchId === b.id);
        let bPayments = payments.filter((p) => p.branchId === b.id);
        if (academicYearId) {
          bInvoices = bInvoices.filter((i) => i.academicYearId === academicYearId);
          bPayments = bPayments.filter((p) => p.academicYearId === academicYearId);
        }
        const invoicedMinor = bInvoices.reduce((acc, i) => addMinor(acc, i.netTotalMinor), 0);
        const collectedMinor = bPayments.reduce((acc, p) => addMinor(acc, p.amountMinor), 0);
        const outstandingMinor = bInvoices.reduce((acc, i) => addMinor(acc, i.balanceDueMinor), 0);
        financeSummary = { invoicedMinor, collectedMinor, outstandingMinor };
      }

      return {
        branchId: b.id,
        branchNameAr: b.nameAr,
        branchNameEn: b.nameEn,
        code: b.code,
        city: b.city || '',
        status: b.status,
        studentsCount: bStudents,
        teachersCount: bTeachers,
        classesCount: bClasses,
        attendanceRate,
        financeSummary,
      };
    });
  }

  // =========================================================================
  // Operational Alerts Engine (Rule-based on Real Data)
  // =========================================================================

  public getAlerts(
    actingUser: SafeUser,
    branchId = 'all',
    academicYearId?: string,
    date?: string
  ): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];
    const todayStr = date || new Date().toISOString().split('T')[0];

    // 1. Attendance incomplete alert
    const attendance = this.getAttendanceOverview(actingUser, { branchId, date: todayStr });
    if (attendance.unrecordedCount > 0 && attendance.hasRecords) {
      alerts.push({
        id: 'alert-att-unrecorded',
        type: 'warning',
        category: 'attendance',
        severity: 'medium',
        titleAr: 'سجلات حضور غير مكتملة',
        titleEn: 'Incomplete Attendance Records',
        messageAr: `يوجد ${attendance.unrecordedCount} طالب لم يتم رصد حضورهم لليوم (${todayStr}).`,
        messageEn: `${attendance.unrecordedCount} students have unrecorded attendance for today.`,
        count: attendance.unrecordedCount,
        actionTab: 'attendance',
      });
    }

    // 2. Overdue fees alert (if authorized)
    if (this.canAccessFinance(actingUser)) {
      const finance = this.getFinanceOverview(actingUser, branchId, academicYearId);
      if (finance && finance.overdueInvoicesCount > 0) {
        alerts.push({
          id: 'alert-fin-overdue',
          type: 'danger',
          category: 'finance',
          severity: 'high',
          titleAr: 'فواتير ومستحقات متأخرة السداد',
          titleEn: 'Overdue Fee Invoices',
          messageAr: `يوجد ${finance.overdueInvoicesCount} فاتورة مستحقة متأخرة السداد بمبلغ إجمالي يتطلب المتابعة.`,
          messageEn: `${finance.overdueInvoicesCount} fee invoices are past their due date.`,
          count: finance.overdueInvoicesCount,
          actionTab: 'fees',
        });
      }
    }

    // 3. Unpublished Timetable Alert
    const timetable = this.getTimetableOverview(actingUser, { branchId, date: todayStr, academicYearId });
    if (timetable.unpublishedClassesCount > 0) {
      alerts.push({
        id: 'alert-tt-unpublished',
        type: 'info',
        category: 'timetable',
        severity: 'low',
        titleAr: 'جداول دراسية غير منشورة',
        titleEn: 'Unpublished Timetables',
        messageAr: `يوجد ${timetable.unpublishedClassesCount} فصول دراسية نشطة لم يتم نشر جداولها الأسبوعية بعد.`,
        messageEn: `${timetable.unpublishedClassesCount} active classes do not have a published timetable.`,
        count: timetable.unpublishedClassesCount,
        actionTab: 'timetable',
      });
    }

    // 4. Overloaded Teacher Alert
    const teachers = this.getTeacherOverview(actingUser, branchId);
    const overloadedTeachers = teachers.workloadSummary.filter((t) => t.isOverloaded);
    if (overloadedTeachers.length > 0) {
      alerts.push({
        id: 'alert-tch-overloaded',
        type: 'warning',
        category: 'teacher',
        severity: 'medium',
        titleAr: 'تجاوز النصاب الأسبوعي للمعلمين',
        titleEn: 'Teacher Workload Limit Exceeded',
        messageAr: `تم تسجيل ${overloadedTeachers.length} معلماً تجاوزوا النصاب التدريسي الأقصى المسموح به.`,
        messageEn: `${overloadedTeachers.length} teachers exceeded their maximum weekly period quota.`,
        count: overloadedTeachers.length,
        actionTab: 'teachers',
      });
    }

    return alerts;
  }

  // =========================================================================
  // Recent Activity Feed (Permission & Branch Isolated)
  // =========================================================================

  public getRecentActivity(actingUser: SafeUser, limit = 10): DashboardActivityItem[] {
    const rawLogs = authStorage.getAuditLogs();
    const branches = branchStorage.getStoredBranches();

    // Filter by branch visibility
    let filteredLogs = rawLogs;
    if (!authStorage.isSuperAdmin(actingUser) && !actingUser.hasAllBranchesAccess) {
      filteredLogs = rawLogs.filter((log) => {
        if (!log.branchContext) return true;
        return actingUser.branchIds.includes(log.branchContext);
      });
    }

    // Map to activity items
    return filteredLogs
      .slice(0, limit)
      .map((log) => {
        const branch = branches.find((b) => b.id === log.branchContext);
        const branchNameAr = branch?.nameAr || 'الفرع الرئيسي';

        let type: DashboardActivityItem['type'] = 'system';
        if (log.targetType === 'STUDENT' || log.targetType === 'ENROLLMENT') {
          type = 'student';
        } else if (log.targetType === 'TEACHER') {
          type = 'teacher';
        } else if (log.targetType === 'ATTENDANCE') {
          type = 'attendance';
        } else if (log.targetType === 'INVOICE' || log.targetType === 'PAYMENT' || log.targetType === 'REFUND' || log.targetType === 'FINANCE') {
          type = 'finance';
        } else if (log.targetType === 'TIMETABLE' || log.targetType === 'PERIOD' || log.targetType === 'ROOM') {
          type = 'timetable';
        } else if (log.targetType === 'ACADEMIC') {
          type = 'academic';
        }

        return {
          id: log.id,
          action: log.action,
          actorName: log.actorName,
          targetIdentifier: log.targetIdentifier || log.targetId || '',
          branchNameAr,
          timestamp: log.timestamp,
          timeAgo: this.formatTimeAgo(log.timestamp),
          type,
          result: log.result,
          details: log.details,
        };
      });
  }

  private formatTimeAgo(timestamp: string): string {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'الآن / Just now';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  }
}

export const dashboardStorage = DashboardStorageService.getInstance();
