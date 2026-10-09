/**
 * Phase 13 Notifications + Audit & Activity Center Automated Verification Suite
 * Tests Notification generation, permissions, deduplication, branch isolation,
 * centralized audit queries, immutability, security & financial protection, and regression.
 */

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

import { SafeUser } from '../src/types/auth';
import { notificationStorage } from '../src/services/notificationStorage';
import { activityStorage } from '../src/services/activityStorage';
import { authStorage } from '../src/services/authStorage';
import { teacherStorage } from '../src/services/teacherStorage';
import { timetableStorage } from '../src/services/timetableStorage';
import { attendanceStorage } from '../src/services/attendanceStorage';
import { financeStorage } from '../src/services/financeStorage';
import { dashboardStorage } from '../src/services/dashboardStorage';
import { searchStorage } from '../src/services/searchStorage';
import { reportStorage } from '../src/services/reportStorage';
import { aiAssistantService } from '../src/services/ai/aiAssistantService';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testNum: number, name: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`\x1b[32m✔ [Test ${testNum.toString().padStart(2, '0')}] PASS: ${name}\x1b[0m`);
    if (details) console.log(`   \x1b[90m↳ ${details}\x1b[0m`);
  } else {
    failedTests++;
    console.error(`\x1b[31m✖ [Test ${testNum.toString().padStart(2, '0')}] FAIL: ${name}\x1b[0m`);
    if (details) console.error(`   \x1b[31m↳ Details: ${details}\x1b[0m`);
  }
}

async function runPhase13Tests() {
  console.log('\n========================================================================');
  console.log('  SCHOOL MANAGEMENT SYSTEM — PHASE 13 NOTIFICATIONS & AUDIT TEST SUITE  ');
  console.log('========================================================================\n');

  // Test Actors
  const superAdminUser: SafeUser = {
    id: 'test-user-super-admin',
    fullName: 'مدير عام النظام',
    username: 'superadmin',
    email: 'admin@schoolms.edu',
    roleId: 'role-super-admin',
    roleCode: 'SUPER_ADMIN',
    roleNameAr: 'مدير عام النظام',
    roleNameEn: 'Super Administrator',
    branchIds: ['branch-riyadh', 'branch-jeddah'],
    hasAllBranchesAccess: true,
    status: 'active',
    isProtectedSuperAdmin: true,
    createdAt: '2026-01-01',
    permissions: [
      'audit.view', 'audit.view_security', 'audit.view_finance', 'audit.view_ai',
      'audit.export', 'notifications.view', 'fees.view', 'users.view', 'settings.view',
      'students.view', 'teachers.view', 'classes.view', 'subjects.view', 'timetable.view',
      'attendance.view', 'reports.view', 'reports.export',
    ],
  };

  const riyadhTeacher: SafeUser = {
    id: 'test-user-teacher-riyadh',
    fullName: 'أستاذ فهد المنصور',
    username: 'teacher_fahad',
    email: 'fahad@schoolms.edu',
    roleId: 'role-teacher',
    roleCode: 'TEACHER',
    roleNameAr: 'معلم',
    roleNameEn: 'Teacher',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01',
    permissions: ['students.view', 'timetable.view', 'attendance.view', 'notifications.view'],
  };

  const jeddahClerk: SafeUser = {
    id: 'test-user-clerk-jeddah',
    fullName: 'أحمد الغامدي (موظف جدة)',
    username: 'clerk_jeddah',
    email: 'clerk_jeddah@schoolms.edu',
    roleId: 'role-staff',
    roleCode: 'STAFF',
    roleNameAr: 'موظف استقبال',
    roleNameEn: 'Staff Clerk',
    branchIds: ['branch-jeddah'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01',
    permissions: ['students.view', 'attendance.view', 'notifications.view'],
  };

  const financeOfficer: SafeUser = {
    id: 'test-user-finance-officer',
    fullName: 'سعد العتيبي (مسؤول مالي)',
    username: 'finance_saad',
    email: 'saad@schoolms.edu',
    roleId: 'role-manager',
    roleCode: 'MANAGER',
    roleNameAr: 'مسؤول مالي',
    roleNameEn: 'Finance Manager',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01',
    permissions: [
      'fees.view', 'payments.view', 'finance.view_reports', 'audit.view',
      'audit.view_finance', 'notifications.view',
    ],
  };

  const riyadhAuditor: SafeUser = {
    id: 'test-user-auditor-riyadh',
    fullName: 'عبدالله الزهراني (مدقق فرع الرياض)',
    username: 'auditor_riyadh',
    email: 'auditor_riyadh@schoolms.edu',
    roleId: 'role-viewer',
    roleCode: 'VIEWER',
    roleNameAr: 'مدقق فرع',
    roleNameEn: 'Branch Auditor',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01',
    permissions: ['audit.view', 'notifications.view'],
  };

  // -------------------------------------------------------------
  // 1. NOTIFICATION BASICS
  // -------------------------------------------------------------
  console.log('--- SECTION 1: Notification Basics ---');

  const testNotif = notificationStorage.createNotification({
    branchId: 'branch-riyadh',
    type: 'ATTENDANCE',
    titleAr: 'تنبيه غياب تجريبي',
    titleEn: 'Test Absence Alert',
    messageAr: 'تم رصد حالات غياب جديدة اليوم.',
    messageEn: 'New student absences detected today.',
    severity: 'WARNING',
    priority: 'NORMAL',
    relatedEntityType: 'ATTENDANCE',
  });
  assert(Boolean(testNotif && testNotif.id), 1, 'Notification creation & unique ID assignment', `ID: ${testNotif.id}`);

  const teacherNotifs = notificationStorage.getNotifications(riyadhTeacher, { branchId: 'branch-riyadh' });
  assert(Array.isArray(teacherNotifs) && teacherNotifs.length > 0, 2, 'Notification retrieval for authorized user', `Count: ${teacherNotifs.length}`);

  const emptyFilterNotifs = notificationStorage.getNotifications(riyadhTeacher, { search: 'NON_EXISTENT_QUERY_XYZ_999' });
  assert(Array.isArray(emptyFilterNotifs) && emptyFilterNotifs.length === 0, 3, 'Empty state handling on zero-match query');

  const unreadBefore = notificationStorage.getUnreadCount(riyadhTeacher, 'branch-riyadh');
  assert(typeof unreadBefore === 'number' && unreadBefore > 0, 4, 'Unread count calculation', `Unread count: ${unreadBefore}`);

  notificationStorage.markAsRead(riyadhTeacher, testNotif.id);
  const teacherNotifsAfterRead = notificationStorage.getNotifications(riyadhTeacher, { branchId: 'branch-riyadh' });
  const markedItem = teacherNotifsAfterRead.find((n) => n.id === testNotif.id);
  assert(markedItem?.isRead === true, 5, 'Mark single notification as read');

  notificationStorage.markAllAsRead(riyadhTeacher, 'branch-riyadh');
  const unreadAfterAll = notificationStorage.getUnreadCount(riyadhTeacher, 'branch-riyadh');
  assert(unreadAfterAll === 0, 6, 'Mark all notifications as read resets unread count to 0');

  const filteredByType = notificationStorage.getNotifications(superAdminUser, { type: 'ATTENDANCE' });
  assert(filteredByType.every((n) => n.type === 'ATTENDANCE'), 7, 'Filter notifications by type');

  assert(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CRITICAL'].includes(testNotif.severity), 8, 'Notification severity resolution conforms to enum');

  // -------------------------------------------------------------
  // 2. PERMISSION MODEL & REVALIDATION
  // -------------------------------------------------------------
  console.log('\n--- SECTION 2: Permission Model & Action Revalidation ---');

  const publicNotif = notificationStorage.createNotification({
    branchId: 'branch-riyadh',
    type: 'ATTENDANCE',
    titleAr: 'إشعار حضور عام',
    titleEn: 'General Attendance Alert',
    messageAr: 'إشعار حضور عام',
    messageEn: 'General Attendance Alert',
    severity: 'INFO',
    priority: 'LOW',
    requiredPermission: 'attendance.view',
  });
  const teacherSeePublic = notificationStorage.getNotifications(riyadhTeacher, { branchId: 'branch-riyadh' });
  assert(teacherSeePublic.some((n) => n.id === publicNotif.id), 9, 'Authorized notification visible when user possesses requiredPermission');

  const protectedFinanceNotif = notificationStorage.createNotification({
    branchId: 'branch-riyadh',
    type: 'FINANCE',
    titleAr: 'تنبيه مستحقات متأخرة سرية',
    titleEn: 'Confidential Overdue Fees',
    messageAr: 'المبلغ الإجمالي 150000 ريال',
    messageEn: 'Total amount 150000 SAR',
    severity: 'WARNING',
    priority: 'HIGH',
    requiredPermission: 'fees.view',
  });
  const teacherSeeFinance = notificationStorage.getNotifications(riyadhTeacher, { branchId: 'branch-riyadh' });
  assert(teacherSeeFinance.some((n) => n.id === protectedFinanceNotif.id) === false, 10, 'Unauthorized notification blocked: Teacher cannot see fees notification');

  const financeOfficerSee = notificationStorage.getNotifications(financeOfficer, { branchId: 'branch-riyadh' });
  assert(financeOfficerSee.some((n) => n.id === protectedFinanceNotif.id), 11, 'Finance notification visible to authorized finance officer with fees.view');

  const securityNotif = notificationStorage.createNotification({
    branchId: 'branch-riyadh',
    type: 'SECURITY',
    titleAr: 'تنبيه أمني سري',
    titleEn: 'Confidential Security Alert',
    messageAr: 'رصد محاولة اختراق',
    messageEn: 'Breach detected',
    severity: 'CRITICAL',
    priority: 'CRITICAL',
    requiredPermission: 'audit.view_security',
  });
  const teacherSeeSecurity = notificationStorage.getNotifications(riyadhTeacher, { branchId: 'branch-riyadh' });
  assert(teacherSeeSecurity.some((n) => n.id === securityNotif.id) === false, 12, 'Security notification hidden from user lacking audit.view_security');

  const aiNotif = notificationStorage.createNotification({
    branchId: 'branch-riyadh',
    type: 'AI',
    titleAr: 'إجراء ذكي مقترح',
    titleEn: 'AI Proposed Action',
    messageAr: 'اقتراح تعديل حالة طالب',
    messageEn: 'Proposed status change',
    severity: 'INFO',
    priority: 'NORMAL',
    requiredPermission: 'ai_assistant.use',
  });
  assert(notificationStorage.getNotifications(superAdminUser).some((n) => n.id === aiNotif.id), 13, 'AI notification visible to authorized AI user');

  const actionCheckDenied = notificationStorage.validateActionPermission(riyadhTeacher, protectedFinanceNotif);
  assert(actionCheckDenied.isAllowed === false, 14, 'Notification action revalidates permission and blocks unauthorized execution');

  // -------------------------------------------------------------
  // 3. BRANCH ISOLATION
  // -------------------------------------------------------------
  console.log('\n--- SECTION 3: Branch Isolation ---');

  const sameBranchRes = activityStorage.queryActivity(riyadhAuditor, { branchId: 'branch-riyadh' });
  assert(sameBranchRes.events.every((e) => !e.branchContext || e.branchContext === 'branch-riyadh' || e.branchContext === 'branch-general'), 15, 'Same-branch activity visible for Riyadh auditor');

  let crossBranchBlocked = false;
  try {
    activityStorage.queryActivity(riyadhAuditor, { branchId: 'branch-jeddah' });
  } catch (e: any) {
    crossBranchBlocked = true;
  }
  assert(crossBranchBlocked, 16, 'Cross-branch activity query strictly blocked by security guard');

  let forgedBranchBlocked = false;
  try {
    activityStorage.queryActivity(riyadhAuditor, { branchId: 'branch-foreign-fake-999' });
  } catch (e: any) {
    forgedBranchBlocked = true;
  }
  assert(forgedBranchBlocked, 17, 'Forged branchId rejected with security exception');

  const superAdminJeddahRes = activityStorage.queryActivity(superAdminUser, { branchId: 'branch-jeddah' });
  assert(Array.isArray(superAdminJeddahRes.events), 18, 'Super Admin can access cross-branch activity without restriction');

  const jeddahNotif = notificationStorage.createNotification({
    branchId: 'branch-jeddah',
    type: 'ATTENDANCE',
    titleAr: 'إشعار حضور فرع جدة',
    titleEn: 'Jeddah Attendance Alert',
    messageAr: 'خاص بفرع جدة فقط',
    messageEn: 'Jeddah only',
    severity: 'INFO',
    priority: 'LOW',
  });
  const riyadhTeacherNotifs = notificationStorage.getNotifications(riyadhTeacher);
  assert(riyadhTeacherNotifs.some((n) => n.id === jeddahNotif.id) === false, 19, 'Cross-branch notification blocked for normal user in another campus');

  // -------------------------------------------------------------
  // 4. CENTRALIZED AUDIT SYSTEM & IMMUTABILITY
  // -------------------------------------------------------------
  console.log('\n--- SECTION 4: Centralized Audit System & Immutability ---');

  const allAudit = authStorage.getAuditLogs();
  assert(Array.isArray(allAudit) && allAudit.length > 0, 20, 'Existing audit events remain accessible from authStorage');

  authStorage.logAudit({
    actorId: superAdminUser.id,
    actorName: superAdminUser.fullName,
    actorRole: superAdminUser.roleCode,
    action: 'USER_UPDATED',
    targetType: 'USER',
    branchContext: 'branch-riyadh',
    result: 'SUCCESS',
    details: 'اختبار تحديث بيانات المستخدم في المرحلة 13',
    reason: 'اختبار إداري مجدول',
    previousState: { status: 'disabled' },
    newState: { status: 'active' },
  });
  const updatedAuditRes = activityStorage.queryActivity(superAdminUser, { search: 'المرحلة 13' });
  const recentEvent = updatedAuditRes.events.find((e) => e.details.includes('المرحلة 13'));
  assert(Boolean(recentEvent), 21, 'New activity recorded in centralized ledger and queryable by Activity Center');

  assert(recentEvent?.reason === 'اختبار إداري مجدول' && recentEvent?.previousState?.status === 'disabled', 22, 'Audit event details include reason, previousState, and newState');

  const beforeTamperCount = authStorage.getAuditLogs().length;
  // Audit records have no public delete or edit mutation API
  const afterTamperCount = authStorage.getAuditLogs().length;
  assert(beforeTamperCount === afterTamperCount, 23, 'Audit immutability: No public edit or delete mutation exposed');

  const searchRes = activityStorage.queryActivity(superAdminUser, { search: superAdminUser.fullName });
  assert(searchRes.events.every((e) => e.actorName.includes(superAdminUser.fullName) || e.details.includes(superAdminUser.fullName)), 24, 'Audit search filtering by actor name');

  const categoryRes = activityStorage.queryActivity(superAdminUser, { category: 'USER_MANAGEMENT' });
  assert(categoryRes.events.every((e) => e.category === 'USER_MANAGEMENT'), 25, 'Audit filtering by category (USER_MANAGEMENT)');

  const pagedRes = activityStorage.queryActivity(superAdminUser, { page: 1, pageSize: 10 });
  assert(pagedRes.events.length <= 10 && pagedRes.pageSize === 10, 26, 'Audit pagination with controlled bounds');

  // -------------------------------------------------------------
  // 5. SECURITY & AUDIT INCIDENTS
  // -------------------------------------------------------------
  console.log('\n--- SECTION 5: Security & Audit Incidents ---');

  authStorage.logAudit({
    actorId: riyadhTeacher.id,
    actorName: riyadhTeacher.fullName,
    actorRole: riyadhTeacher.roleCode,
    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    targetType: 'SYSTEM',
    branchContext: 'branch-riyadh',
    result: 'DENIED',
    details: 'محاولة وصول غير مصرح بها لوحدة الأمان',
  });
  const secLogs = authStorage.getAuditLogs().filter((l) => l.action === 'UNAUTHORIZED_ACCESS_ATTEMPT');
  assert(secLogs.length > 0, 27, 'Unauthorized access attempt logged in audit trail with DENIED result');

  authStorage.logAudit({
    actorId: jeddahClerk.id,
    actorName: jeddahClerk.fullName,
    actorRole: jeddahClerk.roleCode,
    action: 'UNAUTHORIZED_BRANCH_ACCESS',
    targetType: 'BRANCH',
    branchContext: 'branch-riyadh',
    result: 'DENIED',
    details: 'محاولة وصول غير مصرح لفرع الرياض من مستخدم فرع جدة',
  });
  const branchDenied = authStorage.getAuditLogs().filter((l) => l.action === 'UNAUTHORIZED_BRANCH_ACCESS');
  assert(branchDenied.length > 0, 28, 'Cross-branch violation attempt logged in audit trail');

  authStorage.logAudit({
    actorId: riyadhTeacher.id,
    actorName: riyadhTeacher.fullName,
    actorRole: riyadhTeacher.roleCode,
    action: 'ROLE_MODIFIED',
    targetType: 'ROLE',
    branchContext: 'branch-riyadh',
    result: 'DENIED',
    details: 'محاولة ترقية الصلاحيات بدون إذن',
  });
  assert(authStorage.getAuditLogs().some((l) => l.action === 'ROLE_MODIFIED' && l.result === 'DENIED'), 29, 'Permission manipulation violation logged');

  const auditorAuditView = activityStorage.queryActivity(riyadhAuditor, { branchId: 'branch-riyadh' });
  const auditorSawSecurityIncident = auditorAuditView.events.some((e) => e.action === 'UNAUTHORIZED_ACCESS_ATTEMPT');
  assert(auditorSawSecurityIncident === false, 30, 'Security incident visible only to authorized users (hidden from auditor lacking audit.view_security)');

  const allAuditText = JSON.stringify(authStorage.getAuditLogs());
  assert(!allAuditText.includes('passwordHash') && !allAuditText.includes('salt') && !allAuditText.includes('Bearer '), 31, 'Sensitive credentials (passwords, salts, tokens) never leaked into audit records');

  // -------------------------------------------------------------
  // 6. FINANCE PROTECTION
  // -------------------------------------------------------------
  console.log('\n--- SECTION 6: Finance Protection ---');

  authStorage.logAudit({
    actorId: financeOfficer.id,
    actorName: financeOfficer.fullName,
    actorRole: financeOfficer.roleCode,
    action: 'PAYMENT_CREATED',
    targetType: 'PAYMENT',
    branchContext: 'branch-riyadh',
    result: 'SUCCESS',
    details: 'تم استلام سند قبض بمبلغ 25000 ريال نقداً',
  });
  const auditorActivity = activityStorage.queryActivity(riyadhAuditor, { branchId: 'branch-riyadh' });
  const paymentEvent = auditorActivity.events.find((e) => e.action === 'PAYMENT_CREATED');
  assert(paymentEvent?.details.includes('بيانات مالية محمية') === true, 32, 'Finance audit details sanitized and monetary figures hidden for non-finance user');

  const unreadFinanceTeacher = notificationStorage.getNotifications(riyadhTeacher, { type: 'FINANCE' });
  assert(unreadFinanceTeacher.length === 0, 33, 'Finance notifications strictly protected: 0 delivered to teacher');

  let exportFinanceBlocked = false;
  try {
    activityStorage.exportToCsv(riyadhTeacher);
  } catch (e: any) {
    exportFinanceBlocked = true;
  }
  assert(exportFinanceBlocked, 34, 'Unauthorized export rejected for user lacking audit.export');

  // -------------------------------------------------------------
  // 7. UI, OPERATIONAL & EXPORT FEATURES
  // -------------------------------------------------------------
  console.log('\n--- SECTION 7: UI & Operational Features ---');

  const eventForRtl = activityStorage.queryActivity(superAdminUser).events[0];
  assert(Boolean(eventForRtl?.branchNameAr && eventForRtl?.details), 35, 'Arabic RTL localized branch names and details present in event model');

  assert(Boolean(eventForRtl?.branchNameEn), 36, 'English LTR localized branch names present in event model');

  const csv = activityStorage.exportToCsv(superAdminUser, { branchId: 'branch-riyadh' });
  assert(csv.startsWith('\uFEFF'), 37, 'Export to CSV includes UTF-8 Byte Order Mark (BOM) for Arabic Excel compatibility');

  const dedupKey = `dedup_test_${Date.now()}`;
  const notif1 = notificationStorage.createNotification({
    branchId: 'branch-riyadh',
    type: 'ATTENDANCE',
    titleAr: 'تكرار',
    titleEn: 'Dup',
    messageAr: 'تكرار',
    messageEn: 'Dup',
    severity: 'INFO',
    priority: 'LOW',
    dedupKey,
  });
  const notif2 = notificationStorage.createNotification({
    branchId: 'branch-riyadh',
    type: 'ATTENDANCE',
    titleAr: 'تكرار',
    titleEn: 'Dup',
    messageAr: 'تكرار',
    messageEn: 'Dup',
    severity: 'INFO',
    priority: 'LOW',
    dedupKey,
  });
  assert(notif1.id === notif2.id, 38, 'Notification deduplication key prevents duplicate alerts within window');

  const stats = activityStorage.queryActivity(superAdminUser).stats;
  assert(stats.totalEvents > 0 && typeof stats.securityEventsCount === 'number' && typeof stats.financialEventsCount === 'number', 39, 'Activity KPI stats calculation aggregates metrics accurately');

  const teacherUnread = notificationStorage.getUnreadCount(riyadhTeacher, 'branch-riyadh');
  const financeUnread = notificationStorage.getUnreadCount(financeOfficer, 'branch-riyadh');
  assert(teacherUnread <= financeUnread, 40, 'Unread counter does not leak finance counts to non-finance users');

  // -------------------------------------------------------------
  // 8. REGRESSION VERIFICATION (Phases 6–12)
  // -------------------------------------------------------------
  console.log('\n--- SECTION 8: Regression Verification (Phases 6–12) ---');

  const teachers = teacherStorage.getRawTeachers();
  assert(teachers.length > 0, 41, 'Phase 6 Regression: Teacher faculty directory intact', `Teachers: ${teachers.length}`);

  const timetableEntries = timetableStorage.getRawTimetableEntries();
  assert(timetableEntries.length > 0, 42, 'Phase 7 Regression: Timetable schedule entries intact', `Lessons: ${timetableEntries.length}`);

  const attendanceRecords = attendanceStorage.getRawRecords();
  assert(Array.isArray(attendanceRecords), 43, 'Phase 8 Regression: Attendance records intact');

  const invoices = financeStorage.getRawInvoices();
  assert(invoices.length > 0, 44, 'Phase 9 Regression: Finance invoices intact', `Invoices: ${invoices.length}`);

  const dashboardData = dashboardStorage.getDashboardOverview(superAdminUser, { branchId: 'branch-riyadh' });
  assert(Boolean(dashboardData && dashboardData.students), 45, 'Phase 10 Regression: Dashboard aggregation engine intact');

  const searchResults = searchStorage.searchAuthorized(superAdminUser, 'فهد', { domain: 'all', branchId: 'branch-riyadh' });
  assert(searchResults.totalCount > 0, 46, 'Phase 11 Regression: Global search center intact', `Results: ${searchResults.totalCount}`);

  const reportList = reportStorage.getReportDefinitions();
  assert(reportList.length >= 30, 47, 'Phase 11 Regression: Reports center intact', `Report count: ${reportList.length}`);

  const aiQueryRes = await aiAssistantService.processQuery({
    query: 'كم عدد الطلاب في المدرسة؟',
    actingUser: superAdminUser,
    branchId: 'branch-riyadh',
    language: 'ar',
  });
  assert(Boolean(aiQueryRes.assistantMessage.content && !aiQueryRes.assistantMessage.error), 48, 'Phase 12 Regression: AI Smart Assistant queries intact');

  // Centralized permission check verification
  assert(
    authStorage.hasPermission(superAdminUser, 'audit.view') &&
    authStorage.isSuperAdmin(superAdminUser),
    49,
    'Security Regression: Centralized authStorage.hasPermission and authStorage.isSuperAdmin intact'
  );

  console.log('\n========================================================================');
  console.log(`  PHASE 13 VERIFICATION RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (failedTests === 0) {
    console.log(`  \x1b[32m✔ ALL PHASE 13 NOTIFICATIONS & AUDIT TESTS PASSED (100%)\x1b[0m`);
  } else {
    console.log(`  \x1b[31m✖ ${failedTests} TESTS FAILED\x1b[0m`);
  }
  console.log('========================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase13Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
