// Polyfill localStorage if running in Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] || null,
  };
}

import { authStorage } from '../src/services/authStorage';
import { branchStorage } from '../src/services/branchStorage';
import { academicStorage } from '../src/services/academicStorage';
import { studentStorage } from '../src/services/studentStorage';
import { teacherStorage } from '../src/services/teacherStorage';
import { timetableStorage } from '../src/services/timetableStorage';
import { attendanceStorage } from '../src/services/attendanceStorage';
import { financeStorage } from '../src/services/financeStorage';
import { searchStorage } from '../src/services/searchStorage';
import { reportStorage } from '../src/services/reportStorage';
import { exportReportToCSV, exportReportToXLSX } from '../src/utils/export';
import { SafeUser } from '../src/types/auth';

console.log('========================================================');
console.log('RUNNING PHASE 11 — SEARCH, REPORTS, EXPORT & PRINT TEST SUITE');
console.log('========================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testNum: number, name: string, details?: string) {
  if (condition) {
    passedTests++;
    console.log(`[PASS] Test ${testNum < 10 ? '0' + testNum : testNum}: ${name}${details ? ' -> ' + details : ''}`);
  } else {
    failedTests++;
    console.error(`[FAIL] Test ${testNum < 10 ? '0' + testNum : testNum}: ${name}${details ? ' -> ' + details : ''}`);
  }
}

// -------------------------------------------------------------------------
// Seed & User Fixtures
// -------------------------------------------------------------------------
authStorage.initialize();
branchStorage.initialize();
academicStorage.initialize();
studentStorage.initialize();
teacherStorage.initialize();
timetableStorage.initialize();
attendanceStorage.initialize();
financeStorage.initialize();

const superAdminUser: SafeUser = {
  id: 'usr-super-admin',
  fullName: 'مدير عام النظام',
  username: 'superadmin',
  email: 'admin@school.sa',
  roleId: 'role-super-admin',
  roleCode: 'SUPER_ADMIN',
  roleNameAr: 'مدير عام النظام',
  roleNameEn: 'Super Administrator',
  branchIds: ['branch-riyadh', 'branch-jeddah', 'branch-dammam'],
  hasAllBranchesAccess: true,
  status: 'active',
  permissions: [],
  createdAt: '2026-01-01',
};

const riyadhManager: SafeUser = {
  id: 'usr-manager-riyadh',
  fullName: 'أ. أحمد الشمري',
  username: 'mgr_riyadh',
  email: 'manager.riyadh@school.sa',
  roleId: 'role-manager',
  roleCode: 'MANAGER',
  roleNameAr: 'مدير فرع',
  roleNameEn: 'Branch Manager',
  branchIds: ['branch-riyadh'],
  hasAllBranchesAccess: false,
  status: 'active',
  permissions: [
    'dashboard.view',
    'students.view',
    'reports.export',
    'teachers.view',
    'teachers.export',
    'classes.view',
    'subjects.view',
    'timetable.view',
    'timetable.export',
    'attendance.view',
    'attendance.export',
    'fees.view',
    'payments.view',
    'finance.view_reports',
  ],
  createdAt: '2026-01-01',
};

const riyadhTeacher: SafeUser = {
  id: 'usr-teacher-1',
  fullName: 'أ. ياسر الحربي',
  username: 'yasser_teacher',
  email: 'yasser@school.sa',
  roleId: 'role-teacher',
  roleCode: 'TEACHER',
  roleNameAr: 'معلم',
  roleNameEn: 'Teacher',
  branchIds: ['branch-riyadh'],
  hasAllBranchesAccess: false,
  status: 'active',
  permissions: [
    'students.view',
    'timetable.view',
    'attendance.view',
    'attendance.create',
    'attendance.edit',
  ],
  createdAt: '2026-01-01',
};

const riyadhViewer: SafeUser = {
  id: 'usr-viewer-1',
  fullName: 'أ. خالد المشاهد',
  username: 'viewer_riyadh',
  email: 'viewer@school.sa',
  roleId: 'role-viewer',
  roleCode: 'VIEWER',
  roleNameAr: 'مشاهد',
  roleNameEn: 'Viewer',
  branchIds: ['branch-riyadh'],
  hasAllBranchesAccess: false,
  status: 'active',
  permissions: [
    'students.view',
    'teachers.view',
    'classes.view',
    'timetable.view',
    'attendance.view',
  ],
  createdAt: '2026-01-01',
};

// =========================================================================
// SECTION 1: SEARCH TESTS (1-16)
// =========================================================================

// Test 01: Authorized student search
const s1 = searchStorage.searchAuthorized(superAdminUser, 'فهد');
assert(
  s1.results.some((r) => r.domain === 'students' && r.title.includes('فهد')),
  1,
  'Authorized student search',
  `Found student: ${s1.results.find((r) => r.domain === 'students')?.title}`
);

// Test 02: Partial name search
const s2 = searchStorage.searchAuthorized(superAdminUser, 'قحط');
assert(
  s2.results.some((r) => r.domain === 'students' && r.title.includes('القحطاني')),
  2,
  'Partial name search',
  `Matched 'قحط' to student: ${s2.results[0]?.title}`
);

// Test 03: ID search
const s3 = searchStorage.searchAuthorized(superAdminUser, 'STU-');
assert(
  s3.results.some((r) => r.subtitle.includes('STU-')),
  3,
  'Student ID search',
  `Matched student ID: ${s3.results[0]?.subtitle}`
);

// Test 04: Arabic normalization search (أحمد without hamza)
const s4 = searchStorage.searchAuthorized(superAdminUser, 'احمد');
assert(
  s4.results.length > 0 && s4.results.some((r) => r.title.includes('أحمد') || r.title.includes('احمد')),
  4,
  'Arabic text normalization (hamza/alef flexibility)',
  `Normalized query 'احمد' matched correctly`
);

// Test 05: English query search
const s5 = searchStorage.searchAuthorized(superAdminUser, 'Math');
assert(
  s5.executionTimeMs >= 0,
  5,
  'English query search without error',
  `Execution time: ${s5.executionTimeMs}ms`
);

// Test 06: Teacher search
const s6 = searchStorage.searchAuthorized(superAdminUser, 'طارق');
assert(
  s6.results.some((r) => r.domain === 'teachers' && r.title.includes('طارق')),
  6,
  'Teacher faculty search',
  `Found teacher: ${s6.results.find((r) => r.domain === 'teachers')?.title}`
);

// Test 07: Class search
const s7 = searchStorage.searchAuthorized(superAdminUser, '1/أ');
assert(
  s7.results.some((r) => r.domain === 'classes'),
  7,
  'Classroom section search',
  `Found class: ${s7.results.find((r) => r.domain === 'classes')?.title}`
);

// Test 08: Subject search
const s8 = searchStorage.searchAuthorized(superAdminUser, 'رياضيات');
assert(
  s8.results.some((r) => r.domain === 'subjects'),
  8,
  'Curriculum subject search',
  `Found subject: ${s8.results.find((r) => r.domain === 'subjects')?.title}`
);

// Test 09: Timetable search
const s9 = searchStorage.searchAuthorized(superAdminUser, 'الأحد');
assert(
  s9.results.some((r) => r.domain === 'timetable'),
  9,
  'Timetable schedule search',
  `Found timetable lesson on Sunday`
);

// Test 10: Invoice search with authorized financial user
const s10 = searchStorage.searchAuthorized(superAdminUser, 'INV-');
assert(
  s10.results.some((r) => r.domain === 'invoices'),
  10,
  'Authorized financial invoice search',
  `Found invoice: ${s10.results.find((r) => r.domain === 'invoices')?.title}`
);

// Test 11: Financial privacy guard: teacher without finance permissions cannot search invoices
const s11 = searchStorage.searchAuthorized(riyadhTeacher, 'INV-');
assert(
  !s11.results.some((r) => r.domain === 'invoices'),
  11,
  'Financial search privacy (teacher denied invoice access)',
  `Invoices count for teacher: 0`
);

// Test 12: Branch isolation in global search
const s12 = searchStorage.searchAuthorized(riyadhManager, 'Jeddah');
assert(
  !s12.results.some((r) => r.branchId === 'branch-jeddah'),
  12,
  'Branch isolation in global search',
  `Riyadh manager received 0 Jeddah records`
);

// Test 13: Forged foreign branch ID search rejection
const s13 = searchStorage.searchAuthorized(riyadhManager, 'طالب', {
  domain: 'all',
  branchId: 'branch-foreign-999',
});
assert(
  s13.totalCount === 0 && s13.results.length === 0,
  13,
  'Forged foreign branch ID search rejection',
  `Blocked unauthorized branch with zero records`
);

// Test 14: Empty search string handling
const s14 = searchStorage.searchAuthorized(superAdminUser, '   ');
assert(
  s14.totalCount === 0 && s14.results.length === 0,
  14,
  'Empty search string resilience',
  `Returned empty results safely`
);

// Test 15: No-result search handling
const s15 = searchStorage.searchAuthorized(superAdminUser, 'nonexistent_query_xyz_999');
assert(
  s15.totalCount === 0 && s15.results.length === 0,
  15,
  'Zero-match query handling',
  `Safe empty array returned`
);

// Test 16: Payment receipt search with financial user
const s16 = searchStorage.searchAuthorized(superAdminUser, 'RCP-');
assert(
  s16.results.some((r) => r.domain === 'payments'),
  16,
  'Payment receipt search',
  `Found receipt: ${s16.results.find((r) => r.domain === 'payments')?.title}`
);

// =========================================================================
// SECTION 2: REPORT TESTS (17-42)
// =========================================================================

// Test 17: Student Directory report
const rep1 = reportStorage.generateReport(superAdminUser, 'student_directory', { branchId: 'branch-riyadh' });
assert(
  rep1.rows.length > 0 && rep1.columns.length >= 8 && rep1.summary.length >= 3,
  17,
  'Student Directory report generation',
  `Generated ${rep1.rows.length} student records`
);

// Test 18: Students by Branch report
const rep2 = reportStorage.generateReport(superAdminUser, 'students_by_branch');
assert(
  rep2.rows.length >= 3,
  18,
  'Students by Branch report',
  `Aggregated counts for ${rep2.rows.length} campuses`
);

// Test 19: Students by Stage report
const rep3 = reportStorage.generateReport(superAdminUser, 'students_by_stage', { branchId: 'branch-riyadh' });
assert(
  rep3.rows.length > 0,
  19,
  'Students by Stage distribution report',
  `Calculated stage counts and percentages`
);

// Test 20: Students by Grade report
const rep4 = reportStorage.generateReport(superAdminUser, 'students_by_grade', { branchId: 'branch-riyadh' });
assert(
  rep4.rows.length > 0,
  20,
  'Students by Grade breakdown report',
  `Generated grade breakdown`
);

// Test 21: Students by Class roster report
const rep5 = reportStorage.generateReport(superAdminUser, 'students_by_class', { branchId: 'branch-riyadh' });
assert(
  rep5.columns.some((c) => c.key === 'classNameAr'),
  21,
  'Students by Class roster report',
  `Class roster generated`
);

// Test 22: Enrollment Log report
const rep6 = reportStorage.generateReport(superAdminUser, 'enrollment_report', { branchId: 'branch-riyadh' });
assert(
  rep6.rows.length > 0,
  22,
  'Enrollment Log report',
  `Found ${rep6.rows.length} enrollment admissions`
);

// Test 23: Student Guardian Directory report
const rep7 = reportStorage.generateReport(superAdminUser, 'student_guardian_directory', { branchId: 'branch-riyadh' });
assert(
  rep7.columns.some((c) => c.key === 'guardianNameAr'),
  23,
  'Student Guardian Directory report',
  `Directory includes guardian contacts`
);

// Test 24: Teacher Directory report
const rep8 = reportStorage.generateReport(superAdminUser, 'teacher_directory', { branchId: 'branch-riyadh' });
assert(
  rep8.rows.length > 0 && rep8.columns.some((c) => c.key === 'specializationAr'),
  24,
  'Teacher Faculty Directory report',
  `Extracted ${rep8.rows.length} teachers`
);

// Test 25: Teachers by Branch report
const rep9 = reportStorage.generateReport(superAdminUser, 'teachers_by_branch');
assert(
  rep9.rows.length >= 3,
  25,
  'Teachers by Branch comparative report',
  `Aggregated faculty across campuses`
);

// Test 26: Teachers by Subject report
const rep10 = reportStorage.generateReport(superAdminUser, 'teachers_by_subject', { branchId: 'branch-riyadh' });
assert(
  rep10.columns.some((c) => c.key === 'teacherNameAr'),
  26,
  'Teachers by Subject allocation report',
  `Mapped subjects to teachers`
);

// Test 27: Teacher Workload report
const rep11 = reportStorage.generateReport(superAdminUser, 'teacher_workload', { branchId: 'branch-riyadh' });
assert(
  rep11.rows.length > 0 && rep11.columns.some((c) => c.key === 'utilizationRate'),
  27,
  'Teacher Workload & Periods report',
  `Calculated workload utilization against max load`
);

// Test 28: Academic Structure report
const rep12 = reportStorage.generateReport(superAdminUser, 'academic_structure', { branchId: 'branch-riyadh' });
assert(
  rep12.rows.length > 0,
  28,
  'Academic Structure report',
  `Retrieved stages and grades structure`
);

// Test 29: Classes & Capacity report
const rep13 = reportStorage.generateReport(superAdminUser, 'classes_report', { branchId: 'branch-riyadh' });
assert(
  rep13.rows.length > 0 && rep13.columns.some((c) => c.key === 'occupancyRate'),
  29,
  'Classes and Capacity report',
  `Calculated class capacity and occupancy`
);

// Test 30: Curriculum Subjects report
const rep14 = reportStorage.generateReport(superAdminUser, 'subjects_report', { branchId: 'branch-riyadh' });
assert(
  rep14.rows.length > 0,
  30,
  'Curriculum Subjects report',
  `Listed approved subjects`
);

// Test 31: Weekly Timetable report
const rep15 = reportStorage.generateReport(superAdminUser, 'weekly_timetable', { branchId: 'branch-riyadh' });
assert(
  rep15.columns.some((c) => c.key === 'periodNumber'),
  31,
  'Weekly Timetable schedule report',
  `Listed weekly lessons`
);

// Test 32: Daily Attendance report
const rep16 = reportStorage.generateReport(superAdminUser, 'daily_attendance', { branchId: 'branch-riyadh' });
assert(
  rep16.columns.some((c) => c.key === 'status'),
  32,
  'Daily Attendance roll-call report',
  `Extracted attendance records`
);

// Test 33: Attendance by Class report
const rep17 = reportStorage.generateReport(superAdminUser, 'attendance_by_class', { branchId: 'branch-riyadh' });
assert(
  rep17.rows.length > 0,
  33,
  'Attendance by Class report',
  `Generated attendance statistics by class`
);

// Test 34: Attendance Summary report
const rep18 = reportStorage.generateReport(superAdminUser, 'attendance_summary', { branchId: 'branch-riyadh' });
assert(
  rep18.rows.length > 0,
  34,
  'Attendance KPI Summary report',
  `Computed school attendance summary`
);

// Test 35: Fee Collection Summary report
const rep19 = reportStorage.generateReport(superAdminUser, 'fee_collection_summary', { branchId: 'branch-riyadh' });
assert(
  rep19.rows.length >= 5 && rep19.summary.length >= 3,
  35,
  'Fee Collection & Revenue Summary report',
  `Computed invoiced vs collected revenue`
);

// Test 36: Outstanding Fees report
const rep20 = reportStorage.generateReport(superAdminUser, 'outstanding_fees', { branchId: 'branch-riyadh' });
assert(
  rep20.columns.some((c) => c.key === 'balanceDueFormatted'),
  36,
  'Outstanding Tuition Fees report',
  `Found outstanding fees list`
);

// Test 37: Overdue Fees report
const rep21 = reportStorage.generateReport(superAdminUser, 'overdue_fees', { branchId: 'branch-riyadh' });
assert(
  rep21.columns.some((c) => c.key === 'daysOverdue'),
  37,
  'Overdue Invoices Aging report',
  `Generated overdue aging report`
);

// Test 38: Payments Register report
const rep22 = reportStorage.generateReport(superAdminUser, 'payments_register', { branchId: 'branch-riyadh' });
assert(
  rep22.rows.length > 0 && rep22.columns.some((c) => c.key === 'receiptNumber'),
  38,
  'Payments & Receipts Register report',
  `Retrieved payment vouchers: ${rep22.rows.length}`
);

// Test 39: Refunds Register report
const rep23 = reportStorage.generateReport(superAdminUser, 'refunds_report', { branchId: 'branch-riyadh' });
assert(
  rep23.columns.some((c) => c.key === 'refundNumber'),
  39,
  'Refunds & Disbursements Register report',
  `Generated refunds log`
);

// Test 40: Student Financial Statement report
const rep24 = reportStorage.generateReport(superAdminUser, 'student_financial_statement', { branchId: 'branch-riyadh' });
assert(
  rep24.columns.some((c) => c.key === 'balanceFormatted'),
  40,
  'Student Financial Statement report',
  `Generated student financial ledger`
);

// Test 41: Invoices Register report
const rep25 = reportStorage.generateReport(superAdminUser, 'invoices_register', { branchId: 'branch-riyadh' });
assert(
  rep25.rows.length > 0 && rep25.columns.some((c) => c.key === 'netTotalFormatted'),
  41,
  'Invoices & Billing Register report',
  `Retrieved ${rep25.rows.length} invoices`
);

// Test 42: Branch Overview report
const rep26 = reportStorage.generateReport(superAdminUser, 'branch_overview', { branchId: 'branch-riyadh' });
assert(
  rep26.rows.length > 0 && rep26.columns.some((c) => c.key === 'studentsCount'),
  42,
  'Branch Campus Profile report',
  `Generated campus overview`
);

// Test 43: Cross-Branch Benchmark Comparison report
const rep27 = reportStorage.generateReport(superAdminUser, 'cross_branch_comparison');
assert(
  rep27.rows.length >= 3 && rep27.columns.some((c) => c.key === 'invoicedFormatted'),
  43,
  'Cross-Branch Comparative Benchmark report',
  `Generated multi-campus benchmark for ${rep27.rows.length} branches`
);

// Test 44: Academic Year Filtering in report
const repYear1 = reportStorage.generateReport(superAdminUser, 'enrollment_report', {
  branchId: 'branch-riyadh',
  academicYearId: 'ay-riyadh-2026',
});
const repYear2 = reportStorage.generateReport(superAdminUser, 'enrollment_report', {
  branchId: 'branch-riyadh',
  academicYearId: 'ay-empty-year-999',
});
assert(
  repYear1.rows.length > 0 && repYear2.rows.length === 0,
  44,
  'Academic Year Isolation in Reports',
  `Active year: ${repYear1.rows.length} vs empty year: ${repYear2.rows.length}`
);

// Test 45: Cross-branch report access denial
let rejectedCrossBranch = false;
try {
  reportStorage.generateReport(riyadhManager, 'student_directory', { branchId: 'branch-jeddah' });
} catch (e: any) {
  rejectedCrossBranch = true;
}
assert(
  rejectedCrossBranch,
  45,
  'Cross-Branch Report Denial Guard',
  `Riyadh manager blocked from Jeddah student directory`
);

// Test 46: Financial report access denial (teacher blocked from finance reports)
let rejectedFinanceReport = false;
try {
  reportStorage.generateReport(riyadhTeacher, 'fee_collection_summary', { branchId: 'branch-riyadh' });
} catch (e: any) {
  rejectedFinanceReport = true;
}
assert(
  rejectedFinanceReport,
  46,
  'Financial Report Permission Protection',
  `Teacher correctly blocked from finance report`
);

// Test 47: Forged branch ID in report rejection
let rejectedForgedBranch = false;
try {
  reportStorage.generateReport(riyadhManager, 'student_directory', { branchId: 'branch-foreign-999' });
} catch (e: any) {
  rejectedForgedBranch = true;
}
assert(
  rejectedForgedBranch,
  47,
  'Forged Foreign Branch ID Rejection',
  `Blocked foreign branch ID 'branch-foreign-999'`
);

// Test 48: Report summary metric consistency
const totalInRep = rep1.rows.length;
const summaryVal = rep1.summary.find((s) => s.key === 'total')?.value;
assert(
  summaryVal === totalInRep,
  48,
  'Report Summary Consistency with Dataset',
  `Summary value ${summaryVal} matches rows count ${totalInRep}`
);

// =========================================================================
// SECTION 3: EXPORT & AUDIT TESTS (49-54)
// =========================================================================

// Test 49: CSV Export with UTF-8 BOM
const csv = exportReportToCSV(superAdminUser, rep1);
assert(
  csv.startsWith('\uFEFF') && csv.includes('دليل الطلاب'),
  49,
  'CSV Export Generation with UTF-8 BOM',
  `Generated valid UTF-8 BOM CSV (${csv.length} bytes)`
);

// Test 50: Proper RFC 4180 Escaping in CSV
assert(
  csv.includes('"') && !csv.includes('undefined') && !csv.includes('null'),
  50,
  'RFC 4180 CSV Escaping & Cleanliness',
  `Quoted fields safely escaped without null/undefined`
);

// Test 51: Excel-compatible XML Spreadsheet generation
const xlsx = exportReportToXLSX(superAdminUser, rep1);
assert(
  xlsx.includes('urn:schemas-microsoft-com:office:spreadsheet') && xlsx.includes('<Worksheet'),
  51,
  'Excel XML Spreadsheet Generation',
  `Generated native Excel XML workbook with styles`
);

// Test 52: Unauthorized Export Rejection (Viewer has no export permission)
let rejectedViewerExport = false;
try {
  exportReportToCSV(riyadhViewer, rep1);
} catch (e: any) {
  rejectedViewerExport = true;
}
assert(
  rejectedViewerExport,
  52,
  'Unauthorized Export Rejection',
  `Viewer blocked from exporting reports`
);

// Test 53: Financial Export Permission Guard
let rejectedTeacherFinExport = false;
try {
  exportReportToCSV(riyadhTeacher, rep19);
} catch (e: any) {
  rejectedTeacherFinExport = true;
}
assert(
  rejectedTeacherFinExport,
  53,
  'Financial Export Permission Protection',
  `Teacher blocked from exporting financial summaries`
);

// Test 54: Centralized Audit Logging Integration
const auditLogs = authStorage.getAuditLogs();
const searchAudited = auditLogs.some((a) => a.action === 'GLOBAL_SEARCH_PERFORMED');
const reportAudited = auditLogs.some((a) => a.action === 'REPORT_GENERATED');
const exportAudited = auditLogs.some((a) => a.action === 'REPORT_EXPORTED');
assert(
  searchAudited && reportAudited && exportAudited,
  54,
  'Centralized Audit Logging Integration',
  `Search, report, and export operations recorded in centralized ledger`
);

// Test 55: System Architecture Regression (Phases 1-10 Intact)
const totalBranches = branchStorage.getRawBranches().length;
const totalStudents = studentStorage.getRawStudents().length;
const totalTeachers = teacherStorage.getRawTeachers().length;
const totalClasses = academicStorage.getRawClasses().length;
const totalInvoices = financeStorage.getRawInvoices().length;
assert(
  totalBranches >= 5 &&
  totalStudents >= 8 &&
  totalTeachers >= 10 &&
  totalClasses >= 5 &&
  totalInvoices >= 3,
  55,
  'System Architecture Regression (Phases 1-10 Intact)',
  `${totalBranches} branches, ${totalStudents} students, ${totalTeachers} teachers, ${totalClasses} classes, ${totalInvoices} invoices`
);

console.log('\n========================================================');
console.log(`PHASE 11 TESTS TOTAL:  ${passedTests + failedTests}`);
console.log(`PHASE 11 TESTS PASSED: ${passedTests}`);
console.log(`PHASE 11 TESTS FAILED: ${failedTests}`);
console.log('========================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
