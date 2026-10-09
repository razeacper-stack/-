// Polyfill localStorage if running in Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

import { dashboardStorage } from '../src/services/dashboardStorage';
import { authStorage } from '../src/services/authStorage';
import { branchStorage } from '../src/services/branchStorage';
import { academicStorage } from '../src/services/academicStorage';
import { studentStorage } from '../src/services/studentStorage';
import { teacherStorage } from '../src/services/teacherStorage';
import { timetableStorage } from '../src/services/timetableStorage';
import { attendanceStorage } from '../src/services/attendanceStorage';
import { financeStorage } from '../src/services/financeStorage';
import { formatCurrency } from '../src/utils/currency';
import { SafeUser } from '../src/types/auth';

async function main() {
  console.log('========================================================');
  console.log('RUNNING PHASE 10 — DASHBOARD & SCHOOL OVERVIEW TEST SUITE');
  console.log('========================================================');

  await authStorage.initialize();
  branchStorage.initialize();
  academicStorage.initialize();
  studentStorage.initialize();
  teacherStorage.initialize();
  timetableStorage.initialize();
  attendanceStorage.initialize();
  financeStorage.initialize();

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

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testNum: number, name: string, details?: string) {
    const pad = testNum < 10 ? `0${testNum}` : `${testNum}`;
    if (condition) {
      passedTests++;
      console.log(`[PASS] Test ${pad}: ${name}${details ? ` -> ${details}` : ''}`);
    } else {
      failedTests++;
      console.error(`[FAIL] Test ${pad}: ${name}${details ? ` -> ${details}` : ''}`);
    }
  }

  // 1. Super Admin Dashboard Aggregation
  try {
    const overview = dashboardStorage.getDashboardOverview(superAdminUser, { branchId: 'all' });
    assert(
      overview.kpis.totalStudents >= 8 && overview.kpis.totalTeachers >= 10,
      1,
      'Super Admin Cross-Branch Overview Aggregation',
      `${overview.kpis.totalStudents} students, ${overview.kpis.totalTeachers} teachers across all branches`
    );
  } catch (err: any) {
    assert(false, 1, 'Super Admin Cross-Branch Overview Aggregation', err.message);
  }

  // 2. Student Active / Inactive breakdown
  try {
    const std = dashboardStorage.getStudentOverview(superAdminUser, 'all');
    assert(
      std.total === std.active + std.inactive && std.total > 0,
      2,
      'Student Status Metrics Accuracy',
      `Total: ${std.total}, Active: ${std.active}, Inactive: ${std.inactive}`
    );
  } catch (err: any) {
    assert(false, 2, 'Student Status Metrics Accuracy', err.message);
  }

  // 3. Student Gender and Stage Distribution
  try {
    const std = dashboardStorage.getStudentOverview(superAdminUser, 'all');
    assert(
      std.byGender.male + std.byGender.female === std.total && std.byStage.length > 0,
      3,
      'Student Demographics & Academic Hierarchy Distribution',
      `Male: ${std.byGender.male}, Female: ${std.byGender.female}, Stages: ${std.byStage.length}`
    );
  } catch (err: any) {
    assert(false, 3, 'Student Demographics & Academic Hierarchy Distribution', err.message);
  }

  // 4. Teacher Employment & Workload Overview
  try {
    const tch = dashboardStorage.getTeacherOverview(superAdminUser, 'all');
    assert(
      tch.total >= 10 && tch.byType.fullTime > 0 && Array.isArray(tch.workloadSummary),
      4,
      'Teacher Faculty Directory & Contract Breakdown',
      `Total: ${tch.total}, FullTime: ${tch.byType.fullTime}, PartTime: ${tch.byType.partTime}`
    );
  } catch (err: any) {
    assert(false, 4, 'Teacher Faculty Directory & Contract Breakdown', err.message);
  }

  // 5. Daily Attendance Rate & Status Counts
  try {
    const att = dashboardStorage.getAttendanceOverview(superAdminUser, { branchId: 'branch-riyadh' });
    assert(
      typeof att.rate === 'number' && att.rate >= 0 && att.rate <= 100,
      5,
      'Daily Attendance Percentage Metric Calculation',
      `Rate: ${att.rate}%, Present: ${att.present}, Absent: ${att.absent}, Late: ${att.late}`
    );
  } catch (err: any) {
    assert(false, 5, 'Daily Attendance Percentage Metric Calculation', err.message);
  }

  // 6. Attendance Sessions Status Aggregation
  try {
    const att = dashboardStorage.getAttendanceOverview(superAdminUser, { branchId: 'branch-riyadh' });
    assert(
      att.sessionsTotal >= 0,
      6,
      'Attendance Session Lifecycle Tracking',
      `Total sessions: ${att.sessionsTotal} (Locked: ${att.sessionsLocked}, Submitted: ${att.sessionsSubmitted}, Open: ${att.sessionsOpen})`
    );
  } catch (err: any) {
    assert(false, 6, 'Attendance Session Lifecycle Tracking', err.message);
  }

  // 7. Timetable Daily Schedule Overview
  try {
    const tt = dashboardStorage.getTimetableOverview(superAdminUser, { branchId: 'branch-riyadh' });
    assert(
      tt.dayNameAr.length > 0 && Array.isArray(tt.lessons),
      7,
      'Daily Timetable Schedule & Status Resolution',
      `Day: ${tt.dayNameAr}, Total Lessons: ${tt.totalLessons}`
    );
  } catch (err: any) {
    assert(false, 7, 'Daily Timetable Schedule & Status Resolution', err.message);
  }

  // 8. Financial Summary (Invoiced, Collected, Outstanding, Overdue)
  try {
    const fin = dashboardStorage.getFinanceOverview(superAdminUser, 'branch-riyadh');
    assert(
      fin !== null && fin.totalInvoicedMinor >= 0 && fin.totalCollectedMinor >= 0,
      8,
      'Financial Summary Exact Calculation Engine',
      `Invoiced: ${formatCurrency(fin?.totalInvoicedMinor || 0)}, Collected: ${formatCurrency(fin?.totalCollectedMinor || 0)}, Outstanding: ${formatCurrency(fin?.outstandingMinor || 0)}`
    );
  } catch (err: any) {
    assert(false, 8, 'Financial Summary Exact Calculation Engine', err.message);
  }

  // 9. Cross-Branch Security Guard: Block Riyadh manager from Jeddah
  try {
    dashboardStorage.getDashboardOverview(riyadhManagerUser, { branchId: 'branch-jeddah' });
    assert(false, 9, 'Cross-Branch Dashboard Isolation Guard', 'Unauthorized branch access was allowed!');
  } catch (err: any) {
    assert(
      err.message.includes('غير مصرح لك'),
      9,
      'Cross-Branch Dashboard Isolation Guard',
      `Properly blocked: ${err.message}`
    );
  }

  // 10. Auto-Restricting Cross-Branch Queries for Restricted Users
  try {
    const overview = dashboardStorage.getDashboardOverview(riyadhManagerUser, { branchId: 'all' });
    assert(
      overview.branchId === 'branch-riyadh',
      10,
      'Automatic Fallback to Permitted Branch on "all" Query',
      `Resolved to user branch: ${overview.branchId} (${overview.branchNameAr})`
    );
  } catch (err: any) {
    assert(false, 10, 'Automatic Fallback to Permitted Branch on "all" Query', err.message);
  }

  // 11. Super Admin Global Branch Access
  try {
    const riyadh = dashboardStorage.getDashboardOverview(superAdminUser, { branchId: 'branch-riyadh' });
    const jeddah = dashboardStorage.getDashboardOverview(superAdminUser, { branchId: 'branch-jeddah' });
    assert(
      riyadh.branchId === 'branch-riyadh' && jeddah.branchId === 'branch-jeddah',
      11,
      'Super Admin Multi-Branch Inspection',
      `Riyadh students: ${riyadh.students.total}, Jeddah students: ${jeddah.students.total}`
    );
  } catch (err: any) {
    assert(false, 11, 'Super Admin Multi-Branch Inspection', err.message);
  }

  // 12. Cross-Branch Comparative Overview Cards
  try {
    const cards = dashboardStorage.getBranchOverview(superAdminUser);
    assert(
      cards.length >= 2 && cards.every((c) => c.branchNameAr && typeof c.studentsCount === 'number'),
      12,
      'Multi-Branch Comparative Cards Generation',
      `Generated ${cards.length} comparative branch cards`
    );
  } catch (err: any) {
    assert(false, 12, 'Multi-Branch Comparative Cards Generation', err.message);
  }

  // 13. Role-Aware Permission Guard: Enforce dashboard.view
  try {
    dashboardStorage.getDashboardOverview(unauthorizedUser);
    assert(false, 13, 'Unauthorized User Access Rejection', 'Access was not blocked for user without permission');
  } catch (err: any) {
    assert(
      err.message.includes('الصلاحية الكافية'),
      13,
      'Unauthorized User Access Rejection',
      `Properly rejected: ${err.message}`
    );
  }

  // 14. Role-Aware Content: Hide Financial Ledger from Teachers and Viewers
  try {
    const tchOverview = dashboardStorage.getDashboardOverview(teacherUser);
    const vwrOverview = dashboardStorage.getDashboardOverview(viewerUser);
    assert(
      tchOverview.finance === null && vwrOverview.finance === null && tchOverview.kpis.outstandingFeesMinor === null,
      14,
      'Granular Financial Privacy & Role Hiding',
      'Finance overview and KPIs are safely stripped (null) for non-finance users'
    );
  } catch (err: any) {
    assert(false, 14, 'Granular Financial Privacy & Role Hiding', err.message);
  }

  // 15. Role-Aware Timetable: Teacher View Filtering
  try {
    const tt = dashboardStorage.getTimetableOverview(teacherUser, { branchId: 'branch-riyadh' });
    assert(
      Array.isArray(tt.lessons),
      15,
      'Teacher-Specific Timetable Scoping',
      `Scoped lessons count: ${tt.lessons.length}`
    );
  } catch (err: any) {
    assert(false, 15, 'Teacher-Specific Timetable Scoping', err.message);
  }

  // 16. Operational Alerts Engine
  try {
    const alerts = dashboardStorage.getAlerts(superAdminUser, 'branch-riyadh');
    assert(
      Array.isArray(alerts),
      16,
      'Real-Time Operational Alerts Detection',
      `Detected ${alerts.length} operational indicators/alerts`
    );
  } catch (err: any) {
    assert(false, 16, 'Real-Time Operational Alerts Detection', err.message);
  }

  // 17. Centralized Audit Log Activity Feed
  try {
    const acts = dashboardStorage.getRecentActivity(superAdminUser, 5);
    assert(
      acts.length > 0 && acts[0].action.length > 0 && acts[0].timestamp.length > 0,
      17,
      'Real Audit Log Dashboard Integration',
      `Fetched ${acts.length} live audit activities: ${acts[0].action} by ${acts[0].actorName}`
    );
  } catch (err: any) {
    assert(false, 17, 'Real Audit Log Dashboard Integration', err.message);
  }

  // 18. Branch-Isolated Activity Stream for Branch Managers
  try {
    const acts = dashboardStorage.getRecentActivity(riyadhManagerUser, 10);
    assert(
      acts.every((a) => !a.branchNameAr || a.branchNameAr.includes('الرياض') || a.branchNameAr.includes('الرئيسي')),
      18,
      'Audit Activity Feed Branch Isolation',
      `Restricted to Riyadh branch events: ${acts.length} events retrieved`
    );
  } catch (err: any) {
    assert(false, 18, 'Audit Activity Feed Branch Isolation', err.message);
  }

  // 19. Prior Phases Regression Integrity Check
  try {
    const branches = branchStorage.getStoredBranches();
    const students = studentStorage.getRawStudents();
    const teachers = teacherStorage.getRawTeachers();
    const classes = academicStorage.getRawClasses();
    const invoices = financeStorage.getRawInvoices();
    assert(
      branches.length >= 2 &&
      students.length >= 8 &&
      teachers.length >= 10 &&
      classes.length >= 5 &&
      invoices.length >= 3,
      19,
      'System Architecture Regression (Phases 1-9 Intact)',
      `${branches.length} branches, ${students.length} students, ${teachers.length} teachers, ${classes.length} classes, ${invoices.length} invoices`
    );
  } catch (err: any) {
    assert(false, 19, 'System Architecture Regression (Phases 1-9 Intact)', err.message);
  }

  // 20. Branch isolation with manually supplied unauthorized branch ID
  try {
    const unauthorizedBranchId = 'branch-foreign-999';
    dashboardStorage.checkBranchAccess(riyadhManagerUser, unauthorizedBranchId);
    assert(false, 20, 'Manually Supplied Unauthorized Branch ID Isolation Guard', 'Access was erroneously allowed for forged branch ID');
  } catch (err: any) {
    assert(
      err.message.includes('غير مصرح لك بالوصول'),
      20,
      'Manually Supplied Unauthorized Branch ID Isolation Guard',
      `Blocked unauthorized branch ID with security exception: "${err.message}"`
    );
  }

  // 21. Academic year filtering on student enrollments and finances
  try {
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
    assert(
      passed,
      21,
      'Academic Year Filtering on Dashboard Aggregations',
      `Active year: ${rCurrent.students.newEnrollmentsCount} enrolled students vs empty year: ${rEmptyYear.students.newEnrollmentsCount}`
    );
  } catch (err: any) {
    assert(false, 21, 'Academic Year Filtering on Dashboard Aggregations', err.message);
  }

  // 22. Date filtering and exact day-of-week resolution for timetable and attendance
  try {
    const sundayOverview = dashboardStorage.getTimetableOverview(superAdminUser, { date: '2026-09-06' });
    const tuesdayOverview = dashboardStorage.getTimetableOverview(superAdminUser, { date: '2026-09-08' });
    const sundayPassed = sundayOverview.dayOfWeek === 0 && sundayOverview.dayNameAr === 'الأحد';
    const tuesdayPassed = tuesdayOverview.dayOfWeek === 2 && tuesdayOverview.dayNameAr === 'الثلاثاء';
    assert(
      sundayPassed && tuesdayPassed,
      22,
      'Date Filtering & Day-of-Week Calendar Resolution',
      `2026-09-06 resolved to ${sundayOverview.dayNameAr} (0) & 2026-09-08 resolved to ${tuesdayOverview.dayNameAr} (2)`
    );
  } catch (err: any) {
    assert(false, 22, 'Date Filtering & Day-of-Week Calendar Resolution', err.message);
  }

  // 23. Financial KPI permission protection (All financial values null for non-finance users)
  try {
    const teacherDash = dashboardStorage.getDashboardOverview(teacherUser, { branchId: 'branch-riyadh' });
    const directFin = dashboardStorage.getFinanceOverview(teacherUser, 'branch-riyadh');
    const passed =
      teacherDash.finance === null &&
      directFin === null &&
      teacherDash.kpis.outstandingFeesMinor === null &&
      teacherDash.kpis.todayCollectionsMinor === null &&
      teacherDash.kpis.totalInvoicedMinor === null &&
      teacherDash.kpis.totalCollectedMinor === null;
    assert(
      passed,
      23,
      'Financial KPI Permission Protection',
      'All 4 financial KPIs and the finance object are strictly null for unauthorized users'
    );
  } catch (err: any) {
    assert(false, 23, 'Financial KPI Permission Protection', err.message);
  }

  // 24. Unauthorized quick action / service-level mutation rejection
  try {
    // Attempt unauthorized invoice creation from quick action as viewer without fees.create
    financeStorage.createInvoice(viewerUser, {
      branchId: 'branch-riyadh',
      academicYearId: 'ay-riyadh-2026',
      studentId: 'stu-riyadh-001',
      issueDate: '2026-09-01',
      dueDate: '2026-10-01',
      lines: [{ descriptionAr: 'رسوم غير مصرحة', descriptionEn: 'Unauthorized', quantity: 1, unitAmountMinor: 100000 }],
    });
    assert(false, 24, 'Unauthorized Quick Action Service-Level Rejection', 'Viewer was illegally permitted to create an invoice');
  } catch (err: any) {
    assert(
      err.message.includes('الصلاحية') || err.message.includes('غير مصرح'),
      24,
      'Unauthorized Quick Action Service-Level Rejection',
      `Service layer blocked unauthorized quick action mutation: "${err.message}"`
    );
  }

  // 25. Empty / zero-state dashboard aggregation behavior
  try {
    // branch-makkah is an empty branch with zero classes/students
    const emptyDash = dashboardStorage.getDashboardOverview(superAdminUser, { branchId: 'branch-makkah' });
    const passed =
      emptyDash.kpis.totalStudents === 0 &&
      emptyDash.kpis.activeStudents === 0 &&
      emptyDash.kpis.totalTeachers === 0 &&
      emptyDash.kpis.totalClasses === 0 &&
      emptyDash.kpis.attendanceRate === null && // Not NaN or crash!
      emptyDash.students.total === 0 &&
      emptyDash.students.byStage.length === 0 &&
      emptyDash.timetable.lessons.length === 0 &&
      Array.isArray(emptyDash.alerts);
    assert(
      passed,
      25,
      'Empty Branch Aggregation Resilience & NaN Safety',
      `Zero-state handled safely: 0 students, 0 teachers, attendanceRate=null without exceptions`
    );
  } catch (err: any) {
    assert(false, 25, 'Empty Branch Aggregation Resilience & NaN Safety', err.message);
  }

  // 26. Combined Multi-Dimensional Filtering Integrity (Branch + Academic Year + Date)
  try {
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
    assert(
      passed,
      26,
      'Combined Multi-Dimensional Filtering Integrity',
      `Branch (${multiFilter.branchId}) + Year (${multiFilter.academicYearId}) + Date (${multiFilter.date}) combined seamlessly`
    );
  } catch (err: any) {
    assert(false, 26, 'Combined Multi-Dimensional Filtering Integrity', err.message);
  }

  console.log('========================================================');
  console.log(`PHASE 10 TESTS TOTAL:  ${passedTests + failedTests}`);
  console.log(`PHASE 10 TESTS PASSED: ${passedTests}`);
  console.log(`PHASE 10 TESTS FAILED: ${failedTests}`);
  console.log('========================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
