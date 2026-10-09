import { SafeUser } from '../types/auth';
import { authStorage } from './authStorage';
import { attendanceStorage } from './attendanceStorage';
import { timetableStorage } from './timetableStorage';
import { financeStorage } from './financeStorage';
import { teacherStorage } from './teacherStorage';
import {
  AppNotification,
  NotificationFilterParams,
  NotificationPreferences,
  NotificationPriority,
  NotificationSeverity,
  NotificationType,
} from '../types/notification';

const NOTIFICATIONS_STORAGE_KEY = 'sms_notifications_v2';
const NOTIFICATION_READS_KEY = 'sms_notification_reads_v2';
const NOTIFICATION_PREFS_KEY = 'sms_notification_prefs_v2';
const NOTIFICATION_DISMISSED_KEY = 'sms_notification_dismissed_v2';

export class NotificationStorageService {
  private static instance: NotificationStorageService;
  private syncInitialized = false;

  public static getInstance(): NotificationStorageService {
    if (!NotificationStorageService.instance) {
      NotificationStorageService.instance = new NotificationStorageService();
    }
    return NotificationStorageService.instance;
  }

  // =========================================================================
  // Storage Operations
  // =========================================================================

  private getStoredNotifications(): AppNotification[] {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveNotifications(notifications: AppNotification[]): void {
    try {
      // Keep up to 300 notifications
      const capped = notifications.slice(0, 300);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(capped));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }

  private getStoredReads(): Record<string, string> {
    try {
      const raw = localStorage.getItem(NOTIFICATION_READS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveReads(reads: Record<string, string>): void {
    try {
      localStorage.setItem(NOTIFICATION_READS_KEY, JSON.stringify(reads));
    } catch (e) {
      console.error('Failed to save notification reads', e);
    }
  }

  private getStoredDismissedKeys(): Set<string> {
    try {
      const raw = localStorage.getItem(NOTIFICATION_DISMISSED_KEY);
      if (!raw) return new Set<string>();
      const list = JSON.parse(raw);
      return new Set<string>(Array.isArray(list) ? list : []);
    } catch {
      return new Set<string>();
    }
  }

  private saveDismissedKeys(keys: Set<string>): void {
    try {
      const arr = Array.from(keys).slice(-500);
      localStorage.setItem(NOTIFICATION_DISMISSED_KEY, JSON.stringify(arr));
    } catch (e) {
      console.error('Failed to save dismissed notification keys', e);
    }
  }

  public getPreferences(userId: string): NotificationPreferences {
    try {
      const raw = localStorage.getItem(`${NOTIFICATION_PREFS_KEY}_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch {}

    return {
      enabledTypes: {
        SYSTEM: true,
        SECURITY: true,
        ATTENDANCE: true,
        TIMETABLE: true,
        FINANCE: true,
        STUDENT: true,
        TEACHER: true,
        REPORT: true,
        AI: true,
        TASK: true,
        GENERAL: true,
      },
      allowCriticalAlways: true,
      emailDigest: false,
    };
  }

  public savePreferences(userId: string, prefs: NotificationPreferences): void {
    localStorage.setItem(`${NOTIFICATION_PREFS_KEY}_${userId}`, JSON.stringify(prefs));
  }

  // =========================================================================
  // Real School Event Synchronization (Rule-based, Real Data)
  // =========================================================================

  public syncRealEvents(): void {
    if (this.syncInitialized) return;
    this.syncInitialized = true;

    try {
      const existing = this.getStoredNotifications();
      const existingKeys = new Set(existing.map((n) => n.dedupKey).filter(Boolean));
      const dismissedKeys = this.getStoredDismissedKeys();
      const newItems: AppNotification[] = [];
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // 1. Attendance incomplete notifications
      try {
        const openSessions = attendanceStorage.getRawSessions().filter(
          (s) => s.date === todayStr && s.status === 'OPEN'
        );
        if (openSessions.length > 0) {
          const dedupKey = `att_open_${todayStr}`;
          if (!existingKeys.has(dedupKey) && !dismissedKeys.has(dedupKey)) {
            newItems.push({
              id: `notif-att-${Date.now()}`,
              branchId: openSessions[0]?.branchId || 'all',
              type: 'ATTENDANCE',
              titleAr: 'جلسات حضور معلقة قيد الرصد والاعتماد',
              titleEn: 'Pending Attendance Roll-calls',
              messageAr: `يوجد ${openSessions.length} جلسات حضور لليوم ما زالت مفتوحة ولم تُعتمد بعد.`,
              messageEn: `${openSessions.length} attendance sessions for today are still open and pending submission.`,
              severity: 'WARNING',
              priority: 'NORMAL',
              createdAt: now.toISOString(),
              isRead: false,
              relatedEntityType: 'ATTENDANCE',
              actionTab: 'attendance',
              actionLabelAr: 'فتح شاشة الحضور',
              actionLabelEn: 'Open Attendance',
              requiredPermission: 'attendance.view',
              dedupKey,
            });
          }
        }
      } catch {}

      // 2. Finance overdue notifications (Protected: requires fees.view)
      try {
        const invoices = financeStorage.getRawInvoices().filter((i) => i.status !== 'VOID');
        const overdueInvoices = invoices.filter(
          (i) => i.balanceDueMinor > 0 && i.dueDate < todayStr
        );
        if (overdueInvoices.length > 0) {
          const dedupKey = `fin_overdue_${todayStr}`;
          if (!existingKeys.has(dedupKey) && !dismissedKeys.has(dedupKey)) {
            newItems.push({
              id: `notif-fin-${Date.now()}`,
              branchId: overdueInvoices[0]?.branchId || 'all',
              type: 'FINANCE',
              titleAr: 'فواتير ومستحقات دراسية متأخرة السداد',
              titleEn: 'Overdue Tuition Fee Invoices',
              messageAr: `تم رصد ${overdueInvoices.length} فواتير دراسية متأخرة عن موعد استحقاقها تتطلب متابعة التحصيل.`,
              messageEn: `${overdueInvoices.length} fee invoices have passed their due dates.`,
              severity: 'WARNING',
              priority: 'HIGH',
              createdAt: now.toISOString(),
              isRead: false,
              relatedEntityType: 'INVOICE',
              actionTab: 'fees',
              actionLabelAr: 'متابعة الفواتير',
              actionLabelEn: 'Review Invoices',
              requiredPermission: 'fees.view',
              dedupKey,
            });
          }
        }
      } catch {}

      // 3. Timetable unpublished classes notifications
      try {
        const entries = timetableStorage.getRawTimetableEntries();
        const drafts = entries.filter((e) => e.status === 'DRAFT');
        if (drafts.length > 0) {
          const dedupKey = `tt_drafts_${todayStr}`;
          if (!existingKeys.has(dedupKey) && !dismissedKeys.has(dedupKey)) {
            newItems.push({
              id: `notif-tt-${Date.now()}`,
              branchId: drafts[0]?.branchId || 'all',
              type: 'TIMETABLE',
              titleAr: 'جداول دراسية أسبوعية بانتظار الاعتماد',
              titleEn: 'Unpublished Draft Timetables',
              messageAr: `يوجد ${drafts.length} حصة دراسية مجدولة بحالة مسودة ولم تُنشر للطلاب بعد.`,
              messageEn: `${drafts.length} scheduled periods are in draft status and pending publication.`,
              severity: 'INFO',
              priority: 'NORMAL',
              createdAt: now.toISOString(),
              isRead: false,
              relatedEntityType: 'TIMETABLE',
              actionTab: 'timetable',
              actionLabelAr: 'عرض الجداول',
              actionLabelEn: 'View Timetable',
              requiredPermission: 'timetable.view',
              dedupKey,
            });
          }
        }
      } catch {}

      // 4. Security incidents from Audit Log (Protected: requires audit.view_security / Super Admin)
      try {
        const rawLogs = authStorage.getAuditLogs();
        const recentDenied = rawLogs.filter(
          (l) =>
            l.result === 'DENIED' ||
            l.action.includes('UNAUTHORIZED') ||
            l.action.includes('INJECTION')
        ).slice(0, 3);

        for (const log of recentDenied) {
          const dedupKey = `sec_audit_${log.id}`;
          if (!existingKeys.has(dedupKey) && !dismissedKeys.has(dedupKey)) {
            newItems.push({
              id: `notif-sec-${log.id}`,
              branchId: log.branchContext || 'all',
              type: 'SECURITY',
              titleAr: 'تنبيه أمني: رصد محاولة وصول محجوبة',
              titleEn: 'Security Alert: Access Denial Recorded',
              messageAr: `تم حجب محاولة غير مصرح بها (${log.action}) بواسطة "${log.actorName}".`,
              messageEn: `Unauthorized attempt (${log.action}) was blocked for actor "${log.actorName}".`,
              severity: 'CRITICAL',
              priority: 'CRITICAL',
              createdAt: log.timestamp,
              isRead: false,
              relatedEntityType: 'SECURITY',
              actionTab: 'audit_logs',
              actionLabelAr: 'فحص سجل الأمان',
              actionLabelEn: 'Inspect Audit Log',
              requiredPermission: 'audit.view_security',
              dedupKey,
            });
          }
        }
      } catch {}

      // 5. Overloaded Teacher alert
      try {
        const rawTeachers = teacherStorage.getRawTeachers();
        const activeCount = rawTeachers.filter((t) => t.employmentStatus === 'ACTIVE').length;
        if (activeCount > 0) {
          const dedupKey = `teacher_faculty_active_${todayStr}`;
          if (!existingKeys.has(dedupKey) && !dismissedKeys.has(dedupKey)) {
            newItems.push({
              id: `notif-tch-${Date.now()}`,
              branchId: 'all',
              type: 'TEACHER',
              titleAr: 'اكتمال طاقم الهيئة التدريسية',
              titleEn: 'Faculty Members Active',
              messageAr: `تم تسجيل ${activeCount} معلماً نشطاً بنجاح في المنظومة المدرسية.`,
              messageEn: `${activeCount} faculty members are currently active in the school system.`,
              severity: 'INFO',
              priority: 'LOW',
              createdAt: now.toISOString(),
              isRead: false,
              relatedEntityType: 'TEACHER',
              actionTab: 'teachers',
              actionLabelAr: 'قائمة المعلمين',
              actionLabelEn: 'View Teachers',
              requiredPermission: 'teachers.view',
              dedupKey,
            });
          }
        }
      } catch {}

      if (newItems.length > 0) {
        this.saveNotifications([...newItems, ...existing]);
      }
    } catch (e) {
      console.error('Error syncing real events into notifications', e);
    }
  }

  // =========================================================================
  // Notification Retrieval & Filtering
  // =========================================================================

  public getNotifications(
    actingUser: SafeUser,
    params: NotificationFilterParams = {}
  ): AppNotification[] {
    this.syncRealEvents();

    const all = this.getStoredNotifications();
    const reads = this.getStoredReads();
    const prefs = this.getPreferences(actingUser.id);
    const isSuperAdmin = authStorage.isSuperAdmin(actingUser) || actingUser.hasAllBranchesAccess === true;
    const userBranchIds = new Set(actingUser.branchIds || []);

    const result: AppNotification[] = [];

    for (const notif of all) {
      // 1. Branch Isolation
      if (!isSuperAdmin) {
        if (notif.branchId !== 'all' && !userBranchIds.has(notif.branchId)) {
          continue; // strictly isolated from other branches
        }
      }

      // Branch filter in UI
      if (params.branchId && params.branchId !== 'all' && notif.branchId !== params.branchId && notif.branchId !== 'all') {
        continue;
      }

      // 2. Permission Check (CRITICAL)
      if (notif.requiredPermission) {
        if (!authStorage.hasPermission(actingUser, notif.requiredPermission)) {
          // If security permission required:
          if (notif.requiredPermission === 'audit.view_security' && actingUser.roleCode !== 'ADMIN' && !isSuperAdmin) {
            continue;
          }
          // If finance permission required:
          if (
            (notif.requiredPermission === 'fees.view' || notif.requiredPermission === 'audit.view_finance') &&
            !authStorage.hasPermission(actingUser, 'fees.view') &&
            !authStorage.hasPermission(actingUser, 'finance.view_reports')
          ) {
            continue;
          }
          // General check:
          if (!authStorage.hasPermission(actingUser, notif.requiredPermission) && !isSuperAdmin) {
            continue;
          }
        }
      }

      // 3. User & Role Targeting
      if (notif.userId && notif.userId !== actingUser.id) {
        continue;
      }
      if (notif.targetRoles && notif.targetRoles.length > 0 && !notif.targetRoles.includes(actingUser.roleCode)) {
        continue;
      }

      // 4. Preferences (Allow critical always)
      if (notif.severity !== 'CRITICAL' && prefs.allowCriticalAlways !== true) {
        if (prefs.enabledTypes[notif.type] === false) {
          continue;
        }
      }

      // 5. Read state resolution
      const readKey = `${notif.id}_${actingUser.id}`;
      const isRead = notif.isRead || Boolean(reads[readKey]);

      // Filter by read state
      if (params.isRead === true && !isRead) continue;
      if (params.isRead === false && isRead) continue;

      // Filter by type
      if (params.type && params.type !== 'ALL' && notif.type !== params.type) {
        continue;
      }

      // Filter by severity
      if (params.severity && params.severity !== 'ALL' && notif.severity !== params.severity) {
        continue;
      }

      // Filter by search text
      if (params.search && params.search.trim()) {
        const q = params.search.trim().toLowerCase();
        const matches =
          notif.titleAr.toLowerCase().includes(q) ||
          notif.titleEn.toLowerCase().includes(q) ||
          notif.messageAr.toLowerCase().includes(q) ||
          notif.messageEn.toLowerCase().includes(q);
        if (!matches) continue;
      }

      result.push({
        ...notif,
        isRead,
      });
    }

    return result;
  }

  public getUnreadCount(actingUser: SafeUser, branchId?: string): number {
    const list = this.getNotifications(actingUser, { isRead: false, branchId });
    return list.length;
  }

  private notifyUpdate(): void {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('sms_notifications_updated'));
      } catch {}
    }
  }

  // =========================================================================
  // Mutation Operations
  // =========================================================================

  public markAsRead(actingUser: SafeUser, notificationId: string): void {
    const all = this.getStoredNotifications();
    const target = all.find((n) => n.id === notificationId);
    if (!target) {
      return;
    }

    // Branch isolation guard
    const isSuperAdmin = authStorage.isSuperAdmin(actingUser) || actingUser.hasAllBranchesAccess === true;
    if (!isSuperAdmin && target.branchId !== 'all') {
      const userBranchIds = actingUser.branchIds || [];
      if (!userBranchIds.includes(target.branchId)) {
        throw new Error(`غير مصرح لك بالوصول إلى إشعارات الفرع المحدد (${target.branchId}).`);
      }
    }

    const reads = this.getStoredReads();
    reads[`${notificationId}_${actingUser.id}`] = new Date().toISOString();
    this.saveReads(reads);
    this.notifyUpdate();
  }

  public markAsUnread(actingUser: SafeUser, notificationId: string): void {
    const all = this.getStoredNotifications();
    const target = all.find((n) => n.id === notificationId);
    if (!target) {
      return;
    }

    const reads = this.getStoredReads();
    delete reads[`${notificationId}_${actingUser.id}`];
    this.saveReads(reads);
    this.notifyUpdate();
  }

  public markAllAsRead(actingUser: SafeUser, branchId?: string): void {
    const list = this.getNotifications(actingUser, { isRead: false, branchId });
    const reads = this.getStoredReads();
    const now = new Date().toISOString();

    for (const item of list) {
      reads[`${item.id}_${actingUser.id}`] = now;
    }

    this.saveReads(reads);
    this.notifyUpdate();
  }

  public markNotificationsReadBulk(actingUser: SafeUser, notificationIds: string[]): number {
    if (!notificationIds || notificationIds.length === 0) return 0;
    const reads = this.getStoredReads();
    const now = new Date().toISOString();
    let count = 0;

    for (const id of notificationIds) {
      reads[`${id}_${actingUser.id}`] = now;
      count++;
    }

    this.saveReads(reads);
    this.notifyUpdate();
    return count;
  }

  public markNotificationsUnreadBulk(actingUser: SafeUser, notificationIds: string[]): number {
    if (!notificationIds || notificationIds.length === 0) return 0;
    const reads = this.getStoredReads();
    let count = 0;

    for (const id of notificationIds) {
      if (reads[`${id}_${actingUser.id}`]) {
        delete reads[`${id}_${actingUser.id}`];
        count++;
      }
    }

    this.saveReads(reads);
    this.notifyUpdate();
    return count;
  }

  public createNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): AppNotification {
    const existing = this.getStoredNotifications();
    const now = new Date().toISOString();

    // Check dedupKey within 24h
    if (notification.dedupKey) {
      const duplicate = existing.find((n) => n.dedupKey === notification.dedupKey);
      if (duplicate) {
        return duplicate;
      }
    }

    const created: AppNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      isRead: false,
    };

    this.saveNotifications([created, ...existing]);
    this.notifyUpdate();
    return created;
  }

  public deleteNotification(actingUser: SafeUser, notificationId: string): void {
    const existing = this.getStoredNotifications();
    const target = existing.find((n) => n.id === notificationId);
    if (!target) {
      return;
    }

    const isSuperAdmin = authStorage.isSuperAdmin(actingUser) || actingUser.hasAllBranchesAccess === true;
    if (!isSuperAdmin && target.branchId !== 'all') {
      const userBranchIds = actingUser.branchIds || [];
      if (!userBranchIds.includes(target.branchId)) {
        throw new Error(`غير مصرح لك بحذف إشعارات الفرع المحدد (${target.branchId}).`);
      }
    }

    const filtered = existing.filter((n) => n.id !== notificationId);
    this.saveNotifications(filtered);

    // Save dismissed key so auto-sync never brings it back
    const dismissed = this.getStoredDismissedKeys();
    dismissed.add(notificationId);
    if (target.dedupKey) {
      dismissed.add(target.dedupKey);
    }
    this.saveDismissedKeys(dismissed);

    // Also clean up read record
    const reads = this.getStoredReads();
    delete reads[`${notificationId}_${actingUser.id}`];
    this.saveReads(reads);

    this.notifyUpdate();
  }

  public deleteNotificationsBulk(actingUser: SafeUser, notificationIds: string[]): number {
    if (!notificationIds || notificationIds.length === 0) return 0;
    const targetSet = new Set(notificationIds);
    const all = this.getStoredNotifications();
    const toDelete = all.filter((n) => targetSet.has(n.id));
    if (toDelete.length === 0) return 0;

    const remaining = all.filter((n) => !targetSet.has(n.id));
    this.saveNotifications(remaining);

    const dismissed = this.getStoredDismissedKeys();
    for (const item of toDelete) {
      dismissed.add(item.id);
      if (item.dedupKey) {
        dismissed.add(item.dedupKey);
      }
    }
    this.saveDismissedKeys(dismissed);

    const reads = this.getStoredReads();
    for (const item of toDelete) {
      delete reads[`${item.id}_${actingUser.id}`];
    }
    this.saveReads(reads);

    this.notifyUpdate();
    return toDelete.length;
  }

  public deleteAllNotifications(actingUser: SafeUser, branchId?: string): number {
    const currentList = this.getNotifications(actingUser, { branchId });
    if (currentList.length === 0) return 0;

    const idsToDelete = new Set(currentList.map((n) => n.id));
    const all = this.getStoredNotifications();
    const remaining = all.filter((n) => !idsToDelete.has(n.id));
    this.saveNotifications(remaining);

    const dismissed = this.getStoredDismissedKeys();
    for (const item of currentList) {
      dismissed.add(item.id);
      if (item.dedupKey) {
        dismissed.add(item.dedupKey);
      }
    }
    this.saveDismissedKeys(dismissed);

    const reads = this.getStoredReads();
    for (const id of idsToDelete) {
      delete reads[`${id}_${actingUser.id}`];
    }
    this.saveReads(reads);

    this.notifyUpdate();
    return idsToDelete.size;
  }

  public clearReadNotifications(actingUser: SafeUser, branchId?: string): number {
    const readList = this.getNotifications(actingUser, { branchId, isRead: true });
    if (readList.length === 0) return 0;

    const idsToDelete = new Set(readList.map((n) => n.id));
    const all = this.getStoredNotifications();
    const remaining = all.filter((n) => !idsToDelete.has(n.id));
    this.saveNotifications(remaining);

    const dismissed = this.getStoredDismissedKeys();
    for (const item of readList) {
      dismissed.add(item.id);
      if (item.dedupKey) {
        dismissed.add(item.dedupKey);
      }
    }
    this.saveDismissedKeys(dismissed);

    const reads = this.getStoredReads();
    for (const id of idsToDelete) {
      delete reads[`${id}_${actingUser.id}`];
    }
    this.saveReads(reads);

    this.notifyUpdate();
    return idsToDelete.size;
  }

  public getNotificationById(actingUser: SafeUser, notificationId: string): AppNotification | null {
    const list = this.getNotifications(actingUser);
    return list.find((n) => n.id === notificationId) || null;
  }

  // =========================================================================
  // Re-validate Permission on Action Click
  // =========================================================================

  public validateActionPermission(
    actingUser: SafeUser,
    notification: AppNotification
  ): { isAllowed: boolean; reasonAr?: string; reasonEn?: string } {
    if (authStorage.isSuperAdmin(actingUser)) {
      return { isAllowed: true };
    }

    if (notification.requiredPermission) {
      if (!authStorage.hasPermission(actingUser, notification.requiredPermission)) {
        return {
          isAllowed: false,
          reasonAr: `تم سحب أو تعذر توفر الصلاحية المطلوبة (${notification.requiredPermission}) لإتمام هذا الإجراء.`,
          reasonEn: `The required permission (${notification.requiredPermission}) is no longer available.`,
        };
      }
    }

    // Branch re-check
    if (notification.branchId !== 'all') {
      if (!actingUser.branchIds.includes(notification.branchId)) {
        return {
          isAllowed: false,
          reasonAr: `ليس لديك حق الوصول إلى فرع هذا الإشعار (${notification.branchId}).`,
          reasonEn: `You do not have access to this notification branch.`,
        };
      }
    }

    return { isAllowed: true };
  }
}

export const notificationStorage = NotificationStorageService.getInstance();
