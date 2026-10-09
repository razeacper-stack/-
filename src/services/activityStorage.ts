import { SafeUser } from '../types/auth';
import { authStorage } from './authStorage';
import { branchStorage } from './branchStorage';
import {
  ActivityEvent,
  ActivityFilterParams,
  ActivityQueryResult,
  ActivityStats,
  AuditCategory,
  AuditSeverity,
} from '../types/activity';

export class ActivityStorageService {
  private static instance: ActivityStorageService;

  public static getInstance(): ActivityStorageService {
    if (!ActivityStorageService.instance) {
      ActivityStorageService.instance = new ActivityStorageService();
    }
    return ActivityStorageService.instance;
  }

  // =========================================================================
  // Permission & Security Checks
  // =========================================================================

  public canAccessAudit(actingUser: SafeUser): boolean {
    if (authStorage.isSuperAdmin(actingUser)) return true;
    return (
      authStorage.hasPermission(actingUser, 'audit.view') ||
      authStorage.hasPermission(actingUser, 'users.view') ||
      authStorage.hasPermission(actingUser, 'settings.view')
    );
  }

  public canViewSecurityEvents(actingUser: SafeUser): boolean {
    if (authStorage.isSuperAdmin(actingUser)) return true;
    return (
      authStorage.hasPermission(actingUser, 'audit.view_security') ||
      actingUser.roleCode === 'ADMIN'
    );
  }

  public canViewFinancialEvents(actingUser: SafeUser): boolean {
    if (authStorage.isSuperAdmin(actingUser)) return true;
    return (
      authStorage.hasPermission(actingUser, 'audit.view_finance') ||
      authStorage.hasPermission(actingUser, 'fees.view') ||
      authStorage.hasPermission(actingUser, 'finance.view_reports')
    );
  }

  public canViewAIEvents(actingUser: SafeUser): boolean {
    if (authStorage.isSuperAdmin(actingUser)) return true;
    return (
      authStorage.hasPermission(actingUser, 'audit.view_ai') ||
      authStorage.hasPermission(actingUser, 'ai_assistant.use') ||
      authStorage.hasPermission(actingUser, 'users.view')
    );
  }

  public canExportAudit(actingUser: SafeUser): boolean {
    if (authStorage.isSuperAdmin(actingUser)) return true;
    return (
      authStorage.hasPermission(actingUser, 'audit.export') ||
      authStorage.hasPermission(actingUser, 'reports.export')
    );
  }

  public isBranchAuthorized(actingUser: SafeUser, targetBranchId: string): boolean {
    if (authStorage.isSuperAdmin(actingUser) || actingUser.hasAllBranchesAccess === true) {
      return true;
    }
    const userBranches = actingUser.branchIds || [];
    return userBranches.includes(targetBranchId);
  }

  public assertBranchAccess(actingUser: SafeUser, targetBranchId: string): void {
    if (!this.isBranchAuthorized(actingUser, targetBranchId)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_BRANCH_ACCESS',
        targetType: 'BRANCH',
        branchContext: targetBranchId,
        result: 'DENIED',
        details: `محاولة وصول غير مصرح بها لسجل نشاط فرع آخر: ${targetBranchId}`,
      });
      throw new Error(`غير مصرح لك بالوصول إلى بيانات الفرع المحدد (${targetBranchId}).`);
    }
  }

  // =========================================================================
  // Categorization & Severity Derivation
  // =========================================================================

  public deriveCategory(action: string, targetType: string): AuditCategory {
    const act = (action || '').toUpperCase();
    const tgt = (targetType || '').toUpperCase();

    if (act.startsWith('AI_') || tgt.startsWith('AI')) return 'AI';
    if (
      act.includes('LOGIN') ||
      act.includes('LOGOUT') ||
      act.includes('PASSWORD') ||
      act.includes('CREDENTIAL')
    ) {
      return 'AUTHENTICATION';
    }
    if (
      act.includes('UNAUTHORIZED') ||
      act.includes('INJECTION') ||
      act.includes('ATTEMPT') ||
      act.includes('DENIED') ||
      act.includes('REJECTED')
    ) {
      return 'SECURITY';
    }
    if (
      act.includes('FEE') ||
      act.includes('INVOICE') ||
      act.includes('PAYMENT') ||
      act.includes('REFUND') ||
      act.includes('DISCOUNT') ||
      act.includes('SCHOLARSHIP') ||
      act.includes('FINANCIAL') ||
      tgt === 'FINANCE' ||
      tgt === 'INVOICE' ||
      tgt === 'PAYMENT' ||
      tgt === 'REFUND' ||
      tgt === 'FEE_STRUCTURE' ||
      tgt === 'FEE_ASSIGNMENT'
    ) {
      return 'FINANCE';
    }
    if (act.includes('ATTENDANCE') || tgt === 'ATTENDANCE') return 'ATTENDANCE';
    if (
      act.includes('TIMETABLE') ||
      act.includes('PERIOD') ||
      act.includes('ROOM') ||
      tgt === 'TIMETABLE' ||
      tgt === 'PERIOD' ||
      tgt === 'ROOM'
    ) {
      return 'TIMETABLE';
    }
    if (act.includes('TEACHER') || tgt === 'TEACHER') return 'TEACHERS';
    if (act.includes('GUARDIAN') || tgt === 'GUARDIAN') return 'GUARDIANS';
    if (
      act.includes('STUDENT') ||
      act.includes('ENROLLMENT') ||
      tgt === 'STUDENT' ||
      tgt === 'ENROLLMENT'
    ) {
      return 'STUDENTS';
    }
    if (
      act.includes('ACADEMIC') ||
      act.includes('STAGE') ||
      act.includes('GRADE') ||
      act.includes('CLASS') ||
      act.includes('SUBJECT') ||
      tgt === 'ACADEMIC'
    ) {
      return 'ACADEMIC';
    }
    if (act.includes('BRANCH') || tgt === 'BRANCH') return 'BRANCH';
    if (act.includes('ROLE') || act.includes('PERMISSION') || tgt === 'ROLE') return 'PERMISSIONS';
    if (act.includes('USER') || tgt === 'USER') return 'USER_MANAGEMENT';
    if (act.includes('EXPORT') || act.includes('PRINT')) return 'EXPORT';
    if (act.includes('REPORT') || tgt === 'REPORT') return 'REPORTS';
    if (act.includes('SEARCH') || tgt === 'SEARCH') return 'SEARCH';

    return 'SYSTEM';
  }

  public deriveSeverity(
    action: string,
    result: 'SUCCESS' | 'DENIED' | 'FAILED',
    existingSeverity?: AuditSeverity
  ): AuditSeverity {
    if (existingSeverity) return existingSeverity;

    const act = (action || '').toUpperCase();
    if (
      result === 'DENIED' ||
      act.includes('UNAUTHORIZED') ||
      act.includes('INJECTION') ||
      act.includes('REJECTED') ||
      act.includes('DENIED') ||
      act.includes('ATTEMPT')
    ) {
      return 'SECURITY';
    }
    if (result === 'FAILED') return 'ERROR';
    if (
      act.includes('DISABLED') ||
      act.includes('DELETED') ||
      act.includes('VOID') ||
      act.includes('ARCHIVED') ||
      act.includes('PASSWORD_RESET') ||
      act.includes('OVERLOAD')
    ) {
      return 'WARNING';
    }
    if (result === 'SUCCESS') return 'SUCCESS';
    return 'INFO';
  }

  private formatTimeAgo(timestamp: string): string {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  }

  // =========================================================================
  // Query & Filtering
  // =========================================================================

  public queryActivity(
    actingUser: SafeUser,
    params: ActivityFilterParams = {}
  ): ActivityQueryResult {
    // 1. Permission Check
    if (!this.canAccessAudit(actingUser)) {
      throw new Error('ليس لديك الصلاحية الكافية للوصول إلى مركز النشاط وسجل العمليات.');
    }

    // 2. Branch Isolation Guard
    if (params.branchId && params.branchId !== 'all') {
      this.assertBranchAccess(actingUser, params.branchId);
    }

    const rawLogs = authStorage.getAuditLogs();
    const branches = branchStorage.getStoredBranches();

    // 3. User permission capabilities
    const canSeeSecurity = this.canViewSecurityEvents(actingUser);
    const canSeeFinance = this.canViewFinancialEvents(actingUser);
    const canSeeAI = this.canViewAIEvents(actingUser);
    const isSuperAdmin = authStorage.isSuperAdmin(actingUser) || actingUser.hasAllBranchesAccess === true;
    const userBranchIds = new Set(actingUser.branchIds || []);

    // 4. Map & enrich records
    const enrichedEvents: ActivityEvent[] = [];

    for (const log of rawLogs) {
      // Branch check at record level
      const logBranch = log.branchContext || 'branch-general';
      if (!isSuperAdmin) {
        if (logBranch !== 'branch-general' && !userBranchIds.has(logBranch)) {
          continue; // completely isolated from other branches
        }
      }

      // If specific branch filter requested
      if (params.branchId && params.branchId !== 'all' && logBranch !== params.branchId) {
        continue;
      }

      const category = (log.category as AuditCategory) || this.deriveCategory(log.action, log.targetType);
      const severity = this.deriveSeverity(log.action, log.result, log.severity as AuditSeverity);

      const isSecuritySensitive =
        severity === 'SECURITY' ||
        category === 'SECURITY' ||
        log.result === 'DENIED' ||
        log.action.includes('UNAUTHORIZED') ||
        log.action.includes('INJECTION') ||
        log.action.includes('PASSWORD_RESET');

      const isFinancial = category === 'FINANCE' || log.action.includes('FINANCIAL');

      // Security protection: hide security events if unauthorized
      if (isSecuritySensitive && !canSeeSecurity) {
        continue;
      }

      // AI protection: hide AI events if unauthorized
      if (category === 'AI' && !canSeeAI) {
        continue;
      }

      // Financial protection: sanitize financial details if unauthorized
      let details = log.details;
      if (isFinancial && !canSeeFinance) {
        details = 'بيانات مالية محمية - يتطلب الوصول صلاحية الشؤون المالية (fees.view)';
      }

      const branch = branches.find((b) => b.id === logBranch);
      const branchNameAr = branch?.nameAr || (logBranch === 'branch-general' ? 'النظام العام' : logBranch);
      const branchNameEn = branch?.nameEn || (logBranch === 'branch-general' ? 'General System' : logBranch);

      enrichedEvents.push({
        ...log,
        category,
        severity,
        details,
        branchNameAr,
        branchNameEn,
        timeAgo: this.formatTimeAgo(log.timestamp),
        isSecuritySensitive,
        isFinancial,
      });
    }

    // 5. Apply filters
    let filtered = enrichedEvents;

    // Category filter
    if (params.category && params.category !== 'ALL') {
      filtered = filtered.filter((e) => e.category === params.category);
    }

    // Severity filter
    if (params.severity && params.severity !== 'ALL') {
      filtered = filtered.filter((e) => e.severity === params.severity);
    }

    // Result filter
    if (params.result && params.result !== 'ALL') {
      filtered = filtered.filter((e) => e.result === params.result);
    }

    // User filter
    if (params.userId) {
      const uFilter = params.userId.toLowerCase();
      filtered = filtered.filter((e) => e.actorId.toLowerCase() === uFilter || e.actorName.toLowerCase().includes(uFilter));
    }

    // Role filter
    if (params.role) {
      filtered = filtered.filter((e) => e.actorRole.toLowerCase() === params.role!.toLowerCase());
    }

    // Entity Type filter
    if (params.entityType) {
      filtered = filtered.filter((e) => e.targetType === params.entityType);
    }

    // Action filter
    if (params.action) {
      filtered = filtered.filter((e) => e.action === params.action);
    }

    // Date Presets & Custom Dates
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (params.datePreset === 'today') {
      filtered = filtered.filter((e) => e.timestamp.startsWith(todayStr));
    } else if (params.datePreset === 'yesterday') {
      const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
      filtered = filtered.filter((e) => e.timestamp.startsWith(yesterday));
    } else if (params.datePreset === 'this_week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      filtered = filtered.filter((e) => e.timestamp >= sevenDaysAgo);
    } else if (params.datePreset === 'this_month') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
      filtered = filtered.filter((e) => e.timestamp >= thirtyDaysAgo);
    } else if (params.datePreset === 'custom') {
      if (params.startDate) {
        filtered = filtered.filter((e) => e.timestamp >= params.startDate!);
      }
      if (params.endDate) {
        filtered = filtered.filter((e) => e.timestamp <= params.endDate! + 'T23:59:59.999Z');
      }
    }

    // Search query
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.actorName.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q) ||
          (e.targetIdentifier && e.targetIdentifier.toLowerCase().includes(q)) ||
          e.branchNameAr.toLowerCase().includes(q) ||
          e.branchNameEn.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.reason && e.reason.toLowerCase().includes(q))
      );
    }

    // 6. Aggregate Stats
    const totalEvents = enrichedEvents.length;
    const securityEventsCount = enrichedEvents.filter((e) => e.isSecuritySensitive).length;
    const aiEventsCount = enrichedEvents.filter((e) => e.category === 'AI').length;
    const financialEventsCount = enrichedEvents.filter((e) => e.isFinancial).length;
    const failedOrDeniedCount = enrichedEvents.filter((e) => e.result !== 'SUCCESS').length;
    const uniqueActors = new Set(enrichedEvents.map((e) => e.actorId));
    const todayCount = enrichedEvents.filter((e) => e.timestamp.startsWith(todayStr)).length;

    const stats: ActivityStats = {
      totalEvents,
      securityEventsCount,
      aiEventsCount,
      financialEventsCount,
      failedOrDeniedCount,
      uniqueUsersCount: uniqueActors.size,
      todayCount,
    };

    // 7. Controlled Pagination
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(10, params.pageSize || 50));
    const startIndex = (page - 1) * pageSize;
    const pagedEvents = filtered.slice(startIndex, startIndex + pageSize);
    const hasMore = startIndex + pageSize < filtered.length;

    return {
      events: pagedEvents,
      totalCount: filtered.length,
      page,
      pageSize,
      hasMore,
      stats,
    };
  }

  public getActivityEventById(actingUser: SafeUser, eventId: string): ActivityEvent {
    if (!this.canAccessAudit(actingUser)) {
      throw new Error('ليس لديك الصلاحية الكافية للوصول إلى سجل العمليات.');
    }

    const rawLogs = authStorage.getAuditLogs();
    const target = rawLogs.find((l) => l.id === eventId);
    if (!target) {
      throw new Error(`سجل العملية ذو المعرف (${eventId}) غير موجود.`);
    }

    // Branch Isolation Guard
    const isSuperAdmin = authStorage.isSuperAdmin(actingUser) || actingUser.hasAllBranchesAccess === true;
    const logBranch = target.branchContext || 'branch-general';
    if (!isSuperAdmin) {
      const userBranchIds = new Set(actingUser.branchIds || []);
      if (logBranch !== 'branch-general' && !userBranchIds.has(logBranch)) {
        throw new Error(`غير مصرح لك بالوصول إلى سجلات الفرع المحدد (${logBranch}).`);
      }
    }

    const category = (target.category as AuditCategory) || this.deriveCategory(target.action, target.targetType);
    const severity = this.deriveSeverity(target.action, target.result, target.severity as AuditSeverity);

    const isSecuritySensitive =
      severity === 'SECURITY' ||
      category === 'SECURITY' ||
      target.result === 'DENIED' ||
      target.action.includes('UNAUTHORIZED') ||
      target.action.includes('INJECTION') ||
      target.action.includes('PASSWORD_RESET');

    const isFinancial = category === 'FINANCE' || target.action.includes('FINANCIAL');

    if (isSecuritySensitive && !this.canViewSecurityEvents(actingUser)) {
      throw new Error('غير مصرح لك باستعراض تفاصيل الأحداث الأمنية الحساسة.');
    }

    if (category === 'AI' && !this.canViewAIEvents(actingUser)) {
      throw new Error('غير مصرح لك باستعراض تفاصيل عمليات الذكاء الاصطناعي.');
    }

    let details = target.details;
    if (isFinancial && !this.canViewFinancialEvents(actingUser)) {
      details = 'بيانات مالية محمية - يتطلب الوصول صلاحية الشؤون المالية (fees.view)';
    }

    const branches = branchStorage.getStoredBranches();
    const branch = branches.find((b) => b.id === logBranch);
    const branchNameAr = branch?.nameAr || (logBranch === 'branch-general' ? 'النظام العام' : logBranch);
    const branchNameEn = branch?.nameEn || (logBranch === 'branch-general' ? 'General System' : logBranch);

    return {
      ...target,
      branchContext: logBranch,
      branchNameAr,
      branchNameEn,
      category,
      severity,
      timeAgo: this.formatTimeAgo(target.timestamp),
      isSecuritySensitive,
      isFinancial,
      details,
    };
  }

  // =========================================================================
  // Export & Print Utilities
  // =========================================================================

  public exportToCsv(actingUser: SafeUser, params: ActivityFilterParams = {}): string {
    if (!this.canExportAudit(actingUser)) {
      throw new Error('ليس لديك صلاحية تصدير سجل العمليات.');
    }

    // Fetch all records for current filter
    const result = this.queryActivity(actingUser, { ...params, page: 1, pageSize: 10000 });
    const BOM = '\uFEFF';

    const headers = [
      'المعرف',
      'التاريخ والوقت',
      'المستخدم',
      'الدور',
      'الفرع',
      'التصنيف',
      'العملية',
      'الهدف',
      'النتيجة',
      'مستوى الأهمية',
      'التفاصيل',
    ];

    const sanitizeCsvVal = (val: any): string => {
      let str = String(val ?? '').replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str}"`;
    };

    const rows = result.events.map((e) => [
      sanitizeCsvVal(e.id),
      sanitizeCsvVal(e.timestamp),
      sanitizeCsvVal(e.actorName),
      sanitizeCsvVal(e.actorRole),
      sanitizeCsvVal(e.branchNameAr),
      sanitizeCsvVal(e.category),
      sanitizeCsvVal(e.action),
      sanitizeCsvVal(e.targetIdentifier || e.targetId || '-'),
      sanitizeCsvVal(e.result),
      sanitizeCsvVal(e.severity),
      sanitizeCsvVal(e.details || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    return BOM + csvContent;
  }
}

export const activityStorage = ActivityStorageService.getInstance();
