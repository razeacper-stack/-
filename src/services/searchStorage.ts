import { SafeUser } from '../types/auth';
import { SearchDomain, SearchFilters, SearchResponse, SearchResultItem } from '../types/search';
import { authStorage } from './authStorage';
import { studentStorage } from './studentStorage';
import { teacherStorage } from './teacherStorage';
import { academicStorage } from './academicStorage';
import { timetableStorage } from './timetableStorage';
import { financeStorage } from './financeStorage';
import { branchStorage } from './branchStorage';

export class SearchStorageService {
  private static instance: SearchStorageService;

  public static getInstance(): SearchStorageService {
    if (!SearchStorageService.instance) {
      SearchStorageService.instance = new SearchStorageService();
    }
    return SearchStorageService.instance;
  }

  /**
   * Helper to normalize Arabic and English text for flexible matching.
   */
  public normalizeText(text: any): string {
    if (text === null || text === undefined) return '';
    return String(text)
      .toLowerCase()
      .trim()
      // Normalize Arabic alefs
      .replace(/[أإآ]/g, 'ا')
      // Normalize Arabic yeh
      .replace(/ى/g, 'ي')
      // Normalize teh marbuta
      .replace(/ة/g, 'ه')
      // Remove Arabic diacritics / tashkeel
      .replace(/[\u064B-\u0652]/g, '');
  }

  /**
   * Check if a candidate text contains the normalized query.
   */
  private matches(candidate: string | undefined | null, normalizedQuery: string): boolean {
    if (!candidate || !normalizedQuery) return false;
    const normCand = this.normalizeText(candidate);
    return normCand.includes(normalizedQuery);
  }

  /**
   * Get the list of branch IDs accessible to the acting user.
   */
  public getAllowedBranchIds(actingUser: SafeUser): string[] {
    const allBranches = branchStorage.getRawBranches();
    if (authStorage.isSuperAdmin(actingUser) || actingUser.hasAllBranchesAccess === true) {
      return allBranches.map((b) => b.id);
    }
    const userBranchIds = actingUser.branchIds || [];
    return allBranches.filter((b) => userBranchIds.includes(b.id)).map((b) => b.id);
  }

  /**
   * Check if a specific branch ID is permitted for the user.
   */
  public isBranchAllowed(actingUser: SafeUser, branchId: string): boolean {
    if (branchId === 'all') {
      return (
        authStorage.isSuperAdmin(actingUser) ||
        actingUser.hasAllBranchesAccess === true ||
        authStorage.hasPermission(actingUser, 'dashboard.view_cross_branch')
      );
    }
    const allowed = this.getAllowedBranchIds(actingUser);
    return allowed.includes(branchId);
  }

  /**
   * Main Search Endpoint: searchAuthorized
   */
  public searchAuthorized(
    actingUser: SafeUser,
    query: string,
    filters?: SearchFilters
  ): SearchResponse {
    const startTime = performance.now();
    const trimmedQuery = (query || '').trim();
    const normalizedQuery = this.normalizeText(trimmedQuery);
    const domain = filters?.domain || 'all';
    const targetBranchId = filters?.branchId;

    const countsByDomain: Record<SearchDomain, number> = {
      all: 0,
      students: 0,
      teachers: 0,
      classes: 0,
      subjects: 0,
      timetable: 0,
      invoices: 0,
      payments: 0,
      branches: 0,
    };

    if (!trimmedQuery) {
      return {
        query: trimmedQuery,
        domain,
        totalCount: 0,
        results: [],
        countsByDomain,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    // Determine target branches
    const allowedBranchIds = this.getAllowedBranchIds(actingUser);
    let effectiveBranchIds: string[] = allowedBranchIds;

    if (targetBranchId && targetBranchId !== 'all') {
      if (!allowedBranchIds.includes(targetBranchId)) {
        // Unauthorized branch requested: enforce branch isolation and return empty
        authStorage.logAudit({
          actorId: actingUser.id,
          actorName: actingUser.fullName,
          actorRole: actingUser.roleCode,
          action: 'REPORT_UNAUTHORIZED_ATTEMPT',
          targetType: 'SEARCH',
          branchContext: targetBranchId,
          result: 'DENIED',
          details: `محاولة بحث غير مصرح بها في فرع غير مخول: ${targetBranchId}`,
        });

        return {
          query: trimmedQuery,
          domain,
          totalCount: 0,
          results: [],
          countsByDomain,
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }
      effectiveBranchIds = [targetBranchId];
    }

    const branchesMap = new Map(branchStorage.getRawBranches().map((b) => [b.id, b]));
    const results: SearchResultItem[] = [];

    // 1. STUDENTS DOMAIN
    if ((domain === 'all' || domain === 'students') && authStorage.hasPermission(actingUser, 'students.view')) {
      const allStudents = studentStorage.getRawStudents();
      const studentResults: SearchResultItem[] = [];

      for (const s of allStudents) {
        if (!effectiveBranchIds.includes(s.branchId)) continue;
        if (filters?.status && s.status !== filters.status) continue;

        const nameAr = s.fullNameAr || `${s.firstNameAr} ${s.lastNameAr}`;
        const nameEn = s.fullNameEn || `${s.firstNameEn || ''} ${s.lastNameEn || ''}`.trim();
        const branch = branchesMap.get(s.branchId);

        let match =
          this.matches(nameAr, normalizedQuery) ||
          this.matches(nameEn, normalizedQuery) ||
          this.matches(s.firstNameAr, normalizedQuery) ||
          this.matches(s.lastNameAr, normalizedQuery) ||
          this.matches(s.studentNumber, normalizedQuery) ||
          (s.phoneNumber && this.matches(s.phoneNumber, normalizedQuery));

        // National ID search allowed if user has permission
        if (!match && s.nationalId && authStorage.hasPermission(actingUser, 'students.view')) {
          match = this.matches(s.nationalId, normalizedQuery);
        }

        if (match) {
          countsByDomain.students++;
          studentResults.push({
            id: `student-${s.id}`,
            domain: 'students',
            title: nameAr,
            subtitle: `${s.studentNumber} • ${nameEn || 'طالب مسجل'}`,
            meta: branch ? (branch.nameAr || branch.nameEn) : s.branchId,
            badge: {
              text: s.status === 'ACTIVE' ? 'نشط' : s.status === 'INACTIVE' ? 'غير نشط' : s.status,
              variant: s.status === 'ACTIVE' ? 'success' : 'neutral',
            },
            branchId: s.branchId,
            branchName: branch?.nameAr,
            targetTab: 'students',
            targetId: s.id,
          });
        }
      }

      results.push(...studentResults.slice(0, domain === 'students' ? 100 : 8));
    }

    // 2. TEACHERS DOMAIN
    if ((domain === 'all' || domain === 'teachers') && authStorage.hasPermission(actingUser, 'teachers.view')) {
      const allTeachers = teacherStorage.getRawTeachers();
      const teacherResults: SearchResultItem[] = [];

      for (const t of allTeachers) {
        if (!effectiveBranchIds.includes(t.branchId)) continue;
        if (filters?.status && t.employmentStatus !== filters.status) continue;

        const nameAr = t.fullNameAr || `${t.firstNameAr} ${t.lastNameAr}`;
        const nameEn = t.fullNameEn || `${t.firstNameEn || ''} ${t.lastNameEn || ''}`.trim();
        const branch = branchesMap.get(t.branchId);

        const match =
          this.matches(nameAr, normalizedQuery) ||
          this.matches(nameEn, normalizedQuery) ||
          this.matches(t.firstNameAr, normalizedQuery) ||
          (t.middleNameAr && this.matches(t.middleNameAr, normalizedQuery)) ||
          this.matches(t.lastNameAr, normalizedQuery) ||
          this.matches(t.teacherNumber, normalizedQuery) ||
          (t.specialization && this.matches(t.specialization, normalizedQuery)) ||
          this.matches(t.email, normalizedQuery) ||
          (t.phoneNumber && this.matches(t.phoneNumber, normalizedQuery));

        if (match) {
          countsByDomain.teachers++;
          teacherResults.push({
            id: `teacher-${t.id}`,
            domain: 'teachers',
            title: nameAr,
            subtitle: `${t.teacherNumber} • ${t.specialization || 'معلم'}`,
            meta: branch ? (branch.nameAr || branch.nameEn) : t.branchId,
            badge: {
              text: t.employmentStatus === 'ACTIVE' ? 'نشط' : t.employmentStatus,
              variant: t.employmentStatus === 'ACTIVE' ? 'success' : 'neutral',
            },
            branchId: t.branchId,
            branchName: branch?.nameAr,
            targetTab: 'teachers',
            targetId: t.id,
          });
        }
      }

      results.push(...teacherResults.slice(0, domain === 'teachers' ? 100 : 8));
    }

    // 3. CLASSES DOMAIN
    if ((domain === 'all' || domain === 'classes') && authStorage.hasPermission(actingUser, 'classes.view')) {
      const allClasses = academicStorage.getRawClasses();
      const classResults: SearchResultItem[] = [];

      for (const c of allClasses) {
        if (!effectiveBranchIds.includes(c.branchId)) continue;
        if (filters?.academicYearId && c.academicYearId !== filters.academicYearId) continue;
        if (filters?.status && c.status !== filters.status) continue;

        const branch = branchesMap.get(c.branchId);
        const match =
          this.matches(c.nameAr, normalizedQuery) ||
          this.matches(c.nameEn, normalizedQuery) ||
          this.matches(c.classCode, normalizedQuery) ||
          this.matches(c.roomNumber, normalizedQuery);

        if (match) {
          countsByDomain.classes++;
          classResults.push({
            id: `class-${c.id}`,
            domain: 'classes',
            title: c.nameAr,
            subtitle: `${c.classCode} • سعة: ${c.capacity} طالب`,
            meta: branch ? (branch.nameAr || branch.nameEn) : c.branchId,
            badge: {
              text: c.status === 'active' ? 'نشط' : 'معطل',
              variant: c.status === 'active' ? 'success' : 'neutral',
            },
            branchId: c.branchId,
            branchName: branch?.nameAr,
            targetTab: 'classes',
            targetId: c.id,
          });
        }
      }

      results.push(...classResults.slice(0, domain === 'classes' ? 100 : 8));
    }

    // 4. SUBJECTS DOMAIN
    if ((domain === 'all' || domain === 'subjects') && authStorage.hasPermission(actingUser, 'subjects.view')) {
      const allSubjects = academicStorage.getRawSubjects();
      const subjectResults: SearchResultItem[] = [];

      for (const sb of allSubjects) {
        if (!effectiveBranchIds.includes(sb.branchId)) continue;
        if (filters?.status && sb.status !== filters.status) continue;

        const branch = branchesMap.get(sb.branchId);
        const match =
          this.matches(sb.nameAr, normalizedQuery) ||
          this.matches(sb.nameEn, normalizedQuery) ||
          this.matches(sb.subjectCode, normalizedQuery);

        if (match) {
          countsByDomain.subjects++;
          subjectResults.push({
            id: `subject-${sb.id}`,
            domain: 'subjects',
            title: sb.nameAr,
            subtitle: `${sb.subjectCode} • ${sb.nameEn || 'مادة دراسية'}`,
            meta: branch ? (branch.nameAr || branch.nameEn) : sb.branchId,
            badge: {
              text: sb.status === 'active' ? 'نشطة' : 'معطلة',
              variant: sb.status === 'active' ? 'info' : 'neutral',
            },
            branchId: sb.branchId,
            branchName: branch?.nameAr,
            targetTab: 'subjects',
            targetId: sb.id,
          });
        }
      }

      results.push(...subjectResults.slice(0, domain === 'subjects' ? 100 : 8));
    }

    // 5. TIMETABLE DOMAIN
    if ((domain === 'all' || domain === 'timetable') && authStorage.hasPermission(actingUser, 'timetable.view')) {
      const allEntries = timetableStorage.getRawTimetableEntries();
      const classes = academicStorage.getRawClasses();
      const subjects = academicStorage.getRawSubjects();
      const teachers = teacherStorage.getRawTeachers();
      const rooms = timetableStorage.getRawRooms();
      const periods = timetableStorage.getRawPeriods();

      const dayNames: Record<number, { ar: string; en: string }> = {
        0: { ar: 'الأحد', en: 'Sunday' },
        1: { ar: 'الإثنين', en: 'Monday' },
        2: { ar: 'الثلاثاء', en: 'Tuesday' },
        3: { ar: 'الأربعاء', en: 'Wednesday' },
        4: { ar: 'الخميس', en: 'Thursday' },
        5: { ar: 'الجمعة', en: 'Friday' },
        6: { ar: 'السبت', en: 'Saturday' },
      };

      const timetableResults: SearchResultItem[] = [];

      for (const e of allEntries) {
        if (!effectiveBranchIds.includes(e.branchId)) continue;
        if (filters?.academicYearId && e.academicYearId !== filters.academicYearId) continue;
        if (filters?.status && e.status !== filters.status) continue;

        const cls = classes.find((c) => c.id === e.classId);
        const sbj = subjects.find((s) => s.id === e.subjectId);
        const tch = teachers.find((t) => t.id === e.teacherId);
        const rm = rooms.find((r) => r.id === e.roomId);
        const prd = periods.find((p) => p.id === e.periodId);
        const branch = branchesMap.get(e.branchId);

        const teacherName = tch ? (tch.fullNameAr || `${tch.firstNameAr} ${tch.lastNameAr}`) : '';
        const className = cls?.nameAr || '';
        const subjectName = sbj?.nameAr || '';
        const roomCode = rm?.roomCode || '';
        const periodNum = prd?.periodNumber ?? (e as any).periodNumber ?? 1;

        const dayNum = typeof e.dayOfWeek === 'number' ? e.dayOfWeek : parseInt(String(e.dayOfWeek), 10);
        const dayInfo = !isNaN(dayNum) ? dayNames[dayNum] : undefined;
        const dayTextAr = dayInfo?.ar || String(e.dayOfWeek);
        const dayTextEn = dayInfo?.en || '';

        const match =
          this.matches(subjectName, normalizedQuery) ||
          this.matches(teacherName, normalizedQuery) ||
          this.matches(className, normalizedQuery) ||
          this.matches(roomCode, normalizedQuery) ||
          this.matches(dayTextAr, normalizedQuery) ||
          this.matches(dayTextEn, normalizedQuery) ||
          this.matches(String(e.dayOfWeek), normalizedQuery);

        if (match) {
          countsByDomain.timetable++;
          timetableResults.push({
            id: `timetable-${e.id}`,
            domain: 'timetable',
            title: `${subjectName} - ${className}`,
            subtitle: `${teacherName} • ${dayTextAr} • حصة ${periodNum}`,
            meta: rm ? `قاعة: ${rm.roomCode}` : branch?.nameAr,
            badge: {
              text: e.status === 'PUBLISHED' ? 'معتمد' : 'مسودة',
              variant: e.status === 'PUBLISHED' ? 'success' : 'warning',
            },
            branchId: e.branchId,
            branchName: branch?.nameAr,
            targetTab: 'timetable',
            targetId: e.id,
          });
        }
      }

      results.push(...timetableResults.slice(0, domain === 'timetable' ? 100 : 8));
    }

    // 6. INVOICES DOMAIN (Guarded by fees.view or finance.view_reports)
    const canViewFinance =
      authStorage.hasPermission(actingUser, 'fees.view') ||
      authStorage.hasPermission(actingUser, 'finance.view_reports') ||
      authStorage.isSuperAdmin(actingUser);

    if ((domain === 'all' || domain === 'invoices') && canViewFinance) {
      const allInvoices = financeStorage.getRawInvoices();
      const allStudents = studentStorage.getRawStudents();
      const studentMap = new Map(allStudents.map((s) => [s.id, s]));
      const invoiceResults: SearchResultItem[] = [];

      for (const inv of allInvoices) {
        if (!effectiveBranchIds.includes(inv.branchId)) continue;
        if (filters?.academicYearId && inv.academicYearId !== filters.academicYearId) continue;
        if (filters?.status && inv.status !== filters.status) continue;

        const branch = branchesMap.get(inv.branchId);
        const std = studentMap.get(inv.studentId);
        const studentNameAr = std ? (std.fullNameAr || `${std.firstNameAr} ${std.lastNameAr}`) : '-';
        const studentNumber = std ? std.studentNumber : '-';

        const match =
          this.matches(inv.invoiceNumber, normalizedQuery) ||
          this.matches(studentNameAr, normalizedQuery) ||
          this.matches(studentNumber, normalizedQuery);

        if (match) {
          countsByDomain.invoices++;
          invoiceResults.push({
            id: `invoice-${inv.id}`,
            domain: 'invoices',
            title: `فاتورة #${inv.invoiceNumber}`,
            subtitle: `${studentNameAr} • ${studentNumber}`,
            meta: branch?.nameAr || inv.branchId,
            badge: {
              text:
                inv.status === 'PAID'
                  ? 'مسددة'
                  : inv.status === 'OVERDUE'
                  ? 'متأخرة'
                  : inv.status === 'PARTIALLY_PAID'
                  ? 'سداد جزئي'
                  : inv.status === 'ISSUED'
                  ? 'مستحقة'
                  : inv.status,
              variant:
                inv.status === 'PAID'
                  ? 'success'
                  : inv.status === 'OVERDUE'
                  ? 'danger'
                  : inv.status === 'PARTIALLY_PAID'
                  ? 'warning'
                  : 'neutral',
            },
            branchId: inv.branchId,
            branchName: branch?.nameAr,
            targetTab: 'fees',
            targetId: inv.id,
          });
        }
      }

      results.push(...invoiceResults.slice(0, domain === 'invoices' ? 100 : 8));
    }

    // 7. PAYMENTS / RECEIPTS DOMAIN (Guarded by payments.view or finance.view_reports)
    const canViewPayments =
      authStorage.hasPermission(actingUser, 'payments.view') ||
      authStorage.hasPermission(actingUser, 'finance.view_reports') ||
      authStorage.isSuperAdmin(actingUser);

    if ((domain === 'all' || domain === 'payments') && canViewPayments) {
      const allPayments = financeStorage.getRawPayments();
      const allInvoices = financeStorage.getRawInvoices();
      const allStudents = studentStorage.getRawStudents();
      const invoiceMap = new Map(allInvoices.map((i) => [i.id, i]));
      const studentMap = new Map(allStudents.map((s) => [s.id, s]));
      const paymentResults: SearchResultItem[] = [];

      for (const pay of allPayments) {
        if (!effectiveBranchIds.includes(pay.branchId)) continue;

        const branch = branchesMap.get(pay.branchId);
        const inv = invoiceMap.get(pay.invoiceId);
        const invNumber = inv?.invoiceNumber || '-';
        const std = studentMap.get(pay.studentId);
        const studentNameAr = std ? (std.fullNameAr || `${std.firstNameAr} ${std.lastNameAr}`) : '-';
        const studentNumber = std ? std.studentNumber : '-';

        const match =
          this.matches(pay.receiptNumber, normalizedQuery) ||
          this.matches(invNumber, normalizedQuery) ||
          this.matches(studentNameAr, normalizedQuery) ||
          this.matches(studentNumber, normalizedQuery) ||
          this.matches(pay.reference, normalizedQuery);

        if (match) {
          countsByDomain.payments++;
          paymentResults.push({
            id: `payment-${pay.id}`,
            domain: 'payments',
            title: `سند قبض #${pay.receiptNumber}`,
            subtitle: `${studentNameAr} • فاتورة: ${invNumber}`,
            meta: branch?.nameAr || pay.branchId,
            badge: {
              text: pay.method,
              variant: 'info',
            },
            branchId: pay.branchId,
            branchName: branch?.nameAr,
            targetTab: 'fees',
            targetId: pay.id,
          });
        }
      }

      results.push(...paymentResults.slice(0, domain === 'payments' ? 100 : 8));
    }

    // 8. BRANCHES DOMAIN
    if ((domain === 'all' || domain === 'branches') && authStorage.hasPermission(actingUser, 'branches.view')) {
      const allBranches = branchStorage.getRawBranches();
      const branchResults: SearchResultItem[] = [];

      for (const b of allBranches) {
        if (!allowedBranchIds.includes(b.id)) continue;

        const match =
          this.matches(b.nameAr, normalizedQuery) ||
          this.matches(b.nameEn, normalizedQuery) ||
          this.matches(b.code, normalizedQuery) ||
          this.matches(b.city, normalizedQuery);

        if (match) {
          countsByDomain.branches++;
          branchResults.push({
            id: `branch-${b.id}`,
            domain: 'branches',
            title: b.nameAr,
            subtitle: `${b.code} • ${b.city}`,
            meta: b.phone || b.email,
            badge: {
              text: b.status === 'active' ? 'نشط' : 'معطل',
              variant: b.status === 'active' ? 'success' : 'neutral',
            },
            branchId: b.id,
            branchName: b.nameAr,
            targetTab: 'branches',
            targetId: b.id,
          });
        }
      }

      results.push(...branchResults.slice(0, domain === 'branches' ? 100 : 8));
    }

    countsByDomain.all =
      countsByDomain.students +
      countsByDomain.teachers +
      countsByDomain.classes +
      countsByDomain.subjects +
      countsByDomain.timetable +
      countsByDomain.invoices +
      countsByDomain.payments +
      countsByDomain.branches;

    // Log audit for non-empty search
    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'GLOBAL_SEARCH_PERFORMED',
      targetType: 'SEARCH',
      branchContext: targetBranchId || 'all',
      result: 'SUCCESS',
      details: `بحث شامل عن "${trimmedQuery}" في نطاق (${domain}) وأسفر عن ${results.length} نتيجة`,
    });

    return {
      query: trimmedQuery,
      domain,
      totalCount: results.length,
      results,
      countsByDomain,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }
}

export const searchStorage = SearchStorageService.getInstance();
