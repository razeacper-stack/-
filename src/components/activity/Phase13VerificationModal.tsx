import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { SafeUser } from '../../types/auth';
import { notificationStorage } from '../../services/notificationStorage';
import { activityStorage } from '../../services/activityStorage';
import { authStorage } from '../../services/authStorage';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Bell,
  ShieldCheck,
  History,
  Lock,
} from 'lucide-react';

export interface Phase13VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestResult {
  id: number;
  title: string;
  category: 'notifications' | 'permissions' | 'branch_isolation' | 'audit' | 'security_finance';
  passed: boolean;
  message: string;
  details?: string;
}

export const Phase13VerificationModal: React.FC<Phase13VerificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'notifications' | 'permissions' | 'branch_isolation' | 'audit' | 'security_finance'>('all');

  const runAllTests = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    // Test Users
    const superAdminUser: SafeUser = {
      id: 'test-super-admin',
      fullName: 'مدير عام النظام',
      username: 'superadmin',
      email: 'admin@sms.edu',
      roleId: 'role-super-admin',
      roleCode: 'SUPER_ADMIN',
      roleNameAr: 'مدير عام النظام',
      roleNameEn: 'Super Admin',
      branchIds: ['branch-riyadh', 'branch-jeddah'],
      hasAllBranchesAccess: true,
      status: 'active',
      isProtectedSuperAdmin: true,
      createdAt: '2026-01-01',
      permissions: ['audit.view', 'audit.view_security', 'audit.view_finance', 'audit.view_ai', 'audit.export', 'notifications.view', 'fees.view', 'users.view'],
    };

    const riyadhTeacher: SafeUser = {
      id: 'test-teacher-user',
      fullName: 'معلم فرع الرياض',
      username: 'teacher_riyadh',
      email: 'teacher@sms.edu',
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

    const financeOfficer: SafeUser = {
      id: 'test-finance-officer',
      fullName: 'مسؤول الحسابات',
      username: 'finance_officer',
      email: 'finance@sms.edu',
      roleId: 'role-manager',
      roleCode: 'MANAGER',
      roleNameAr: 'مسؤول مالي',
      roleNameEn: 'Finance Officer',
      branchIds: ['branch-riyadh'],
      hasAllBranchesAccess: false,
      status: 'active',
      createdAt: '2026-01-01',
      permissions: ['fees.view', 'payments.view', 'finance.view_reports', 'audit.view', 'audit.view_finance', 'notifications.view'],
    };

    let testId = 1;

    // SECTION A: NOTIFICATION BASICS
    try {
      const created = notificationStorage.createNotification({
        branchId: 'branch-riyadh',
        type: 'ATTENDANCE',
        titleAr: 'تنبيه غياب تجريبي',
        titleEn: 'Test Absence Alert',
        messageAr: 'تم رصد 3 حالات غياب بدون عذر مقبول.',
        messageEn: '3 unexcused absences recorded.',
        severity: 'WARNING',
        priority: 'NORMAL',
        relatedEntityType: 'ATTENDANCE',
      });
      testResults.push({
        id: testId++,
        title: 'Notification creation & storage',
        category: 'notifications',
        passed: Boolean(created && created.id),
        message: 'Notification created with unique identifier and timestamp',
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Notification creation', category: 'notifications', passed: false, message: e.message });
    }

    try {
      const list = notificationStorage.getNotifications(riyadhTeacher, { branchId: 'branch-riyadh' });
      testResults.push({
        id: testId++,
        title: 'Notification retrieval',
        category: 'notifications',
        passed: Array.isArray(list) && list.length > 0,
        message: `Retrieved ${list.length} notifications for authorized teacher`,
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Notification retrieval', category: 'notifications', passed: false, message: e.message });
    }

    try {
      const unreadCount = notificationStorage.getUnreadCount(riyadhTeacher, 'branch-riyadh');
      testResults.push({
        id: testId++,
        title: 'Unread counter accuracy',
        category: 'notifications',
        passed: typeof unreadCount === 'number' && unreadCount >= 0,
        message: `Unread count resolved to ${unreadCount}`,
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Unread counter', category: 'notifications', passed: false, message: e.message });
    }

    try {
      const all = notificationStorage.getNotifications(riyadhTeacher, { branchId: 'branch-riyadh' });
      if (all.length > 0) {
        notificationStorage.markAsRead(riyadhTeacher, all[0].id);
        const after = notificationStorage.getNotifications(riyadhTeacher, { branchId: 'branch-riyadh' });
        const item = after.find((n) => n.id === all[0].id);
        testResults.push({
          id: testId++,
          title: 'Mark single notification as read',
          category: 'notifications',
          passed: item?.isRead === true,
          message: 'Read status updated and persisted cleanly',
        });
      }
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Mark as read', category: 'notifications', passed: false, message: e.message });
    }

    try {
      notificationStorage.markAllAsRead(riyadhTeacher, 'branch-riyadh');
      const unreadAfter = notificationStorage.getUnreadCount(riyadhTeacher, 'branch-riyadh');
      testResults.push({
        id: testId++,
        title: 'Mark all notifications as read',
        category: 'notifications',
        passed: unreadAfter === 0,
        message: 'All notifications marked as read; unread count equals 0',
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Mark all as read', category: 'notifications', passed: false, message: e.message });
    }

    try {
      const tempNotif = notificationStorage.createNotification({
        branchId: 'branch-riyadh',
        type: 'SYSTEM',
        titleAr: 'إشعار اختبار الحذف',
        titleEn: 'Test Delete Notification',
        messageAr: 'نص الاختبار للحذف',
        messageEn: 'Test message for deletion',
        severity: 'INFO',
        priority: 'NORMAL',
      });
      notificationStorage.deleteNotification(riyadhTeacher, tempNotif.id);
      const afterDelete = notificationStorage.getNotifications(riyadhTeacher, { branchId: 'branch-riyadh' });
      const found = afterDelete.some((n) => n.id === tempNotif.id);
      testResults.push({
        id: testId++,
        title: 'Delete notification functionality',
        category: 'notifications',
        passed: found === false,
        message: 'Notification deleted and persistently suppressed from re-syncing',
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Delete notification', category: 'notifications', passed: false, message: e.message });
    }

    // SECTION B: PERMISSION PROTECTION
    try {
      notificationStorage.createNotification({
        branchId: 'branch-riyadh',
        type: 'FINANCE',
        titleAr: 'إشعار مالي محمي',
        titleEn: 'Protected Finance Notification',
        messageAr: 'تم تحصيل 50,000 ريال.',
        messageEn: 'SAR 50,000 collected.',
        severity: 'INFO',
        priority: 'NORMAL',
        requiredPermission: 'fees.view',
      });
      const teacherList = notificationStorage.getNotifications(riyadhTeacher, { branchId: 'branch-riyadh' });
      const teacherSawFinance = teacherList.some((n) => n.type === 'FINANCE' && n.titleAr === 'إشعار مالي محمي');
      testResults.push({
        id: testId++,
        title: 'Finance notification hidden from teacher lacking fees.view',
        category: 'permissions',
        passed: teacherSawFinance === false,
        message: 'Teacher cannot see finance notifications without permission',
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Finance notification protection', category: 'permissions', passed: false, message: e.message });
    }

    try {
      const financeList = notificationStorage.getNotifications(financeOfficer, { branchId: 'branch-riyadh' });
      const financeSaw = financeList.some((n) => n.type === 'FINANCE' && n.titleAr === 'إشعار مالي محمي');
      testResults.push({
        id: testId++,
        title: 'Finance notification visible to authorized user',
        category: 'permissions',
        passed: financeSaw === true,
        message: 'Authorized finance officer sees fee notification',
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Finance notification visible to officer', category: 'permissions', passed: false, message: e.message });
    }

    try {
      const dummyFinanceNotif = {
        id: 'test-fin-1',
        branchId: 'branch-riyadh',
        type: 'FINANCE' as const,
        titleAr: 'فاتورة',
        titleEn: 'Invoice',
        messageAr: 'فاتورة',
        messageEn: 'Invoice',
        severity: 'INFO' as const,
        priority: 'NORMAL' as const,
        createdAt: new Date().toISOString(),
        isRead: false,
        requiredPermission: 'fees.view' as const,
      };
      const check = notificationStorage.validateActionPermission(riyadhTeacher, dummyFinanceNotif);
      testResults.push({
        id: testId++,
        title: 'Notification action revalidates permission and blocks unauthorized execution',
        category: 'permissions',
        passed: check.isAllowed === false,
        message: check.reasonAr || 'Action blocked due to missing permission',
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Action revalidation', category: 'permissions', passed: false, message: e.message });
    }

    // SECTION C: BRANCH ISOLATION
    try {
      notificationStorage.createNotification({
        branchId: 'branch-jeddah',
        type: 'ATTENDANCE',
        titleAr: 'إشعار خاص بفرع جدة',
        titleEn: 'Jeddah Exclusive Notification',
        messageAr: 'إشعار خاص بفرع جدة فقط',
        messageEn: 'Jeddah branch only',
        severity: 'INFO',
        priority: 'NORMAL',
      });
      const riyadhTeacherList = notificationStorage.getNotifications(riyadhTeacher);
      const sawJeddah = riyadhTeacherList.some((n) => n.titleAr === 'إشعار خاص بفرع جدة');
      testResults.push({
        id: testId++,
        title: 'Branch isolation: Riyadh user cannot see Jeddah notifications',
        category: 'branch_isolation',
        passed: sawJeddah === false,
        message: 'Strict isolation enforced across campus notifications',
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Branch isolation notifications', category: 'branch_isolation', passed: false, message: e.message });
    }

    try {
      let threw = false;
      try {
        activityStorage.queryActivity(riyadhTeacher, { branchId: 'branch-jeddah' });
      } catch (err: any) {
        threw = true;
      }
      testResults.push({
        id: testId++,
        title: 'Activity center throws security error on forged foreign branchId',
        category: 'branch_isolation',
        passed: threw === true,
        message: 'Service layer blocked unauthorized branch access attempt',
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Forged branchId audit rejection', category: 'branch_isolation', passed: false, message: e.message });
    }

    try {
      const superAdminRes = activityStorage.queryActivity(superAdminUser, { branchId: 'branch-jeddah' });
      testResults.push({
        id: testId++,
        title: 'Super Admin can access any branch activity',
        category: 'branch_isolation',
        passed: Array.isArray(superAdminRes.events),
        message: 'Super Admin successfully queried cross-branch activity',
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Super Admin branch access', category: 'branch_isolation', passed: false, message: e.message });
    }

    // SECTION D: AUDIT ARCHITECTURE & IMMUTABILITY
    try {
      authStorage.logAudit({
        actorId: superAdminUser.id,
        actorName: superAdminUser.fullName,
        actorRole: superAdminUser.roleCode,
        action: 'USER_UPDATED',
        targetType: 'USER',
        branchContext: 'branch-riyadh',
        result: 'SUCCESS',
        details: 'تحديث بيانات المستخدم في اختبار المرحلة 13',
      });
      const res = activityStorage.queryActivity(superAdminUser, { branchId: 'branch-riyadh' });
      const found = res.events.some((e) => e.details.includes('تحديث بيانات المستخدم في اختبار المرحلة 13'));
      testResults.push({
        id: testId++,
        title: 'New audit event logged and retrieved from central ledger',
        category: 'audit',
        passed: found === true,
        message: 'Activity Center successfully retrieved real audit entry',
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Audit logging and retrieval', category: 'audit', passed: false, message: e.message });
    }

    try {
      const res = activityStorage.queryActivity(superAdminUser, { search: 'المرحلة 13' });
      testResults.push({
        id: testId++,
        title: 'Activity search filtering by keyword',
        category: 'audit',
        passed: res.events.length > 0,
        message: `Search matched ${res.events.length} records cleanly`,
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Search filtering', category: 'audit', passed: false, message: e.message });
    }

    try {
      const paged = activityStorage.queryActivity(superAdminUser, { page: 1, pageSize: 5 });
      testResults.push({
        id: testId++,
        title: 'Controlled pagination without loading unlimited records',
        category: 'audit',
        passed: paged.events.length <= 5 && typeof paged.totalCount === 'number',
        message: `Page size capped at 5; total count is ${paged.totalCount}`,
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Pagination', category: 'audit', passed: false, message: e.message });
    }

    // SECTION E: SECURITY & FINANCIAL PRIVACY
    try {
      authStorage.logAudit({
        actorId: riyadhTeacher.id,
        actorName: riyadhTeacher.fullName,
        actorRole: riyadhTeacher.roleCode,
        action: 'INVOICE_CREATED',
        targetType: 'INVOICE',
        branchContext: 'branch-riyadh',
        result: 'SUCCESS',
        details: 'تم تحصيل مبلغ 15000 ريال بموجب فاتورة رسمية',
      });

      // Query as teacher without finance permission
      const teacherAuditRes = activityStorage.queryActivity(riyadhTeacher, { branchId: 'branch-riyadh' });
      const targetLog = teacherAuditRes.events.find((e) => e.action === 'INVOICE_CREATED');
      const sanitized = targetLog?.details.includes('بيانات مالية محمية');
      testResults.push({
        id: testId++,
        title: 'Financial audit details sanitized for user lacking finance permission',
        category: 'security_finance',
        passed: sanitized === true,
        message: 'Sensitive monetary figures redacted from unauthorized users',
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Financial redaction', category: 'security_finance', passed: false, message: e.message });
    }

    try {
      authStorage.logAudit({
        actorId: riyadhTeacher.id,
        actorName: riyadhTeacher.fullName,
        actorRole: riyadhTeacher.roleCode,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        targetType: 'SYSTEM',
        branchContext: 'branch-riyadh',
        result: 'DENIED',
        details: 'محاولة وصول غير مصرح بها إلى وحدة الأمان',
      });

      // Teacher does NOT have audit.view_security
      const teacherRes = activityStorage.queryActivity(riyadhTeacher, { branchId: 'branch-riyadh' });
      const teacherSawSecurity = teacherRes.events.some((e) => e.action === 'UNAUTHORIZED_ACCESS_ATTEMPT');
      testResults.push({
        id: testId++,
        title: 'Security incident audit records hidden from normal teacher',
        category: 'security_finance',
        passed: teacherSawSecurity === false,
        message: 'Security denials require audit.view_security or admin privilege',
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'Security incident privacy', category: 'security_finance', passed: false, message: e.message });
    }

    try {
      const csv = activityStorage.exportToCsv(superAdminUser, { branchId: 'branch-riyadh' });
      testResults.push({
        id: testId++,
        title: 'Activity export generation with UTF-8 BOM',
        category: 'audit',
        passed: typeof csv === 'string' && csv.startsWith('\uFEFF'),
        message: 'Exported CSV cleanly with UTF-8 byte order mark for Excel',
      });
    } catch (e: any) {
      testResults.push({ id: testId++, title: 'CSV export', category: 'audit', passed: false, message: e.message });
    }

    setResults(testResults);
    setIsRunning(false);
  };

  const filteredResults = results.filter((r) => {
    if (activeFilter === 'all') return true;
    return r.category === activeFilter;
  });

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const isAllPassed = totalCount > 0 && passedCount === totalCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>فحص واختبار المرحلة 13 — الإشعارات ومركز النشاط</span>
              {totalCount > 0 && (
                <Badge variant={isAllPassed ? 'success' : 'warning'} size="sm">
                  {passedCount}/{totalCount}
                </Badge>
              )}
            </div>
            <span className="text-xs text-slate-400">
              فحوصات آلية شاملة للإشعارات، عزل الفروع، الخصوصية المالية وسجل العمليات
            </span>
          </div>
        </div>
      }
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs font-semibold">
            {totalCount > 0 ? (
              <span className={isAllPassed ? 'text-emerald-600' : 'text-rose-600'}>
                تم اجتياز {passedCount} من أصل {totalCount} اختبار بنجاح (
                {Math.round((passedCount / totalCount) * 100)}%)
              </span>
            ) : (
              <span className="text-slate-400">جاهز لتشغيل حزمة اختبارات المرحلة 13</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              إغلاق
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={runAllTests}
              disabled={isRunning}
              leftIcon={
                isRunning ? (
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )
              }
            >
              {isRunning ? 'جارٍ الفحص...' : results.length > 0 ? 'إعادة الفحص' : 'تشغيل الاختبارات'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'كافة الفحوصات' },
            { id: 'notifications', label: 'نظام الإشعارات' },
            { id: 'permissions', label: 'الصلاحيات' },
            { id: 'branch_isolation', label: 'عزل الفروع' },
            { id: 'audit', label: 'سجل العمليات والبحث' },
            { id: 'security_finance', label: 'الأمان والمالية' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer shrink-0 ${
                activeFilter === f.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[380px] overflow-y-auto space-y-2 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-900/50">
          {results.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-xs">
              اضغط على "تشغيل الاختبارات" للبدء بالتحقق الآلي لحزمة المرحلة 13.
            </div>
          ) : (
            filteredResults.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  {r.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{r.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                        #{r.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      {r.message}
                    </p>
                  </div>
                </div>

                <Badge variant={r.passed ? 'success' : 'danger'} size="sm">
                  {r.passed ? 'اجتياز' : 'فشل'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
