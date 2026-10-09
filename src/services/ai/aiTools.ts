import { SafeUser } from '../../types/auth';
import { AIToolDefinition } from '../../types/ai';
import { authStorage } from '../authStorage';
import { branchStorage } from '../branchStorage';
import { studentStorage } from '../studentStorage';
import { teacherStorage } from '../teacherStorage';
import { academicStorage } from '../academicStorage';
import { timetableStorage } from '../timetableStorage';
import { attendanceStorage } from '../attendanceStorage';
import { financeStorage } from '../financeStorage';
import { searchStorage } from '../searchStorage';
import { reportStorage } from '../reportStorage';
import { formatCurrency } from '../../utils/currency';

/**
 * Validates branch isolation for an acting user.
 * Returns true if permitted, false otherwise.
 */
export function isBranchPermitted(actingUser: SafeUser, targetBranchId: string): boolean {
  if (!targetBranchId || targetBranchId === 'all') {
    return (
      authStorage.isSuperAdmin(actingUser) ||
      actingUser.hasAllBranchesAccess === true ||
      authStorage.hasPermission(actingUser, 'dashboard.view_cross_branch')
    );
  }
  if (authStorage.isSuperAdmin(actingUser) || actingUser.hasAllBranchesAccess === true) {
    return true;
  }
  const userBranches = actingUser.branchIds || [];
  return userBranches.includes(targetBranchId);
}

/**
 * Asserts branch isolation and throws standard security error if violated.
 */
export function enforceBranchIsolation(actingUser: SafeUser, targetBranchId: string): void {
  if (!isBranchPermitted(actingUser, targetBranchId)) {
    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'AI_CROSS_BRANCH_DENIED',
      targetType: 'AI_TOOL',
      branchContext: targetBranchId,
      result: 'DENIED',
      details: `محاولة وصول غير مصرح بها لفرع آخر عبر المساعد الذكي: ${targetBranchId}`,
    });
    throw new Error(`غير مصرح لك بالوصول إلى بيانات الفرع المحدد (${targetBranchId}).`);
  }
}

/**
 * Asserts required permission and throws security error if missing.
 */
export function enforcePermission(
  actingUser: SafeUser,
  permission: string | null,
  toolName: string,
  branchId?: string
): void {
  if (!permission) return;
  if (authStorage.isSuperAdmin(actingUser)) return;

  if (!authStorage.hasPermission(actingUser, permission as any)) {
    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'AI_UNAUTHORIZED_REQUEST',
      targetType: 'AI_TOOL',
      targetIdentifier: toolName,
      branchContext: branchId,
      result: 'DENIED',
      details: `تم حجب أداة الذكاء الاصطناعي (${toolName}) لعدم وجود الصلاحية (${permission})`,
    });
    throw new Error(`ليس لديك الصلاحية الكافية لتنفيذ هذا الاستعلام (${permission}).`);
  }
}

export const AI_TOOLS: Record<string, AIToolDefinition> = {
  // 1. get_student_count
  get_student_count: {
    name: 'get_student_count',
    descriptionAr: 'الحصول على إجمالي عدد الطلاب مع تفصيل النشطين وغير النشطين حسب الفرع',
    descriptionEn: 'Get total students count with active/inactive breakdown by branch',
    requiredPermission: 'students.view',
    parameters: {
      type: 'object',
      properties: {
        branchId: { type: 'string', description: 'معرف الفرع المستهدف أو all' },
        status: { type: 'string', description: 'حالة القيد (ACTIVE / INACTIVE)', enum: ['ACTIVE', 'INACTIVE'] },
      },
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'students.view', 'get_student_count', targetBranch);

      const all = studentStorage.getRawStudents();
      const filtered = all.filter((s) => {
        if (targetBranch !== 'all' && s.branchId !== targetBranch) return false;
        if (args?.status && s.status !== args.status) return false;
        return true;
      });

      const active = filtered.filter((s) => s.status === 'ACTIVE').length;
      const inactive = filtered.filter((s) => s.status === 'INACTIVE').length;

      return {
        branchId: targetBranch,
        total: filtered.length,
        active,
        inactive,
        male: filtered.filter((s) => String(s.gender).toLowerCase() === 'male').length,
        female: filtered.filter((s) => String(s.gender).toLowerCase() === 'female').length,
      };
    },
  },

  // 2. get_student_by_id
  get_student_by_id: {
    name: 'get_student_by_id',
    descriptionAr: 'البحث عن طالب محدد برقم الهوية أو الرقم الأكاديمي أو المعرف',
    descriptionEn: 'Lookup a specific student by ID, studentNumber, or nationalId',
    requiredPermission: 'students.view',
    parameters: {
      type: 'object',
      properties: {
        identifier: { type: 'string', description: 'رقم الطالب أو الهوية أو الاسم' },
      },
      required: ['identifier'],
    },
    execute: (actingUser, branchId, args) => {
      enforcePermission(actingUser, 'students.view', 'get_student_by_id', branchId);
      const query = (args?.identifier || '').trim().toLowerCase();
      if (!query) throw new Error('يرجى تقديم معرف الطالب المطلوب.');

      const students = studentStorage.getRawStudents();
      const enrollments = studentStorage.getRawEnrollments();
      const classes = academicStorage.getRawClasses();

      const student = students.find((s) => {
        if (!isBranchPermitted(actingUser, s.branchId)) return false;
        const nameAr = (s.fullNameAr || `${s.firstNameAr} ${s.lastNameAr}`).toLowerCase();
        const nameEn = (s.fullNameEn || `${s.firstNameEn || ''} ${s.lastNameEn || ''}`).toLowerCase();
        return (
          s.id.toLowerCase() === query ||
          s.id.toLowerCase().includes(query) ||
          s.studentNumber.toLowerCase().includes(query) ||
          (s.nationalId && s.nationalId.includes(query)) ||
          nameAr.includes(query) ||
          nameEn.includes(query)
        );
      });

      if (!student) {
        return { found: false, message: 'لم يتم العثور على طالب مطابق ضمن الفروع المصرح لك بها.' };
      }

      const activeEnr = enrollments.find((e) => e.studentId === student.id && e.status === 'ENROLLED');
      const cls = activeEnr ? classes.find((c) => c.id === activeEnr.classId) : undefined;
      const branch = branchStorage.getRawBranches().find((b) => b.id === student.branchId);

      return {
        found: true,
        id: student.id,
        studentNumber: student.studentNumber,
        nameAr: student.fullNameAr || `${student.firstNameAr} ${student.lastNameAr}`,
        nameEn: student.fullNameEn || `${student.firstNameEn || ''} ${student.lastNameEn || ''}`.trim(),
        gender: student.gender,
        status: student.status,
        branchId: student.branchId,
        branchName: branch?.nameAr,
        className: cls?.nameAr || 'غير مسكن بفصل',
      };
    },
  },

  // 3. search_students
  search_students: {
    name: 'search_students',
    descriptionAr: 'البحث عن الطلاب بالاسم أو الرقم مع تطبيق عزل الفروع',
    descriptionEn: 'Search students by name or number with branch isolation',
    requiredPermission: 'students.view',
    parameters: {
      type: 'object',
      properties: {
        searchTerm: { type: 'string', description: 'كلمة البحث' },
        branchId: { type: 'string', description: 'معرف الفرع' },
      },
      required: ['searchTerm'],
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'students.view', 'search_students', targetBranch);

      const resp = searchStorage.searchAuthorized(actingUser, args.searchTerm, {
        domain: 'students',
        branchId: targetBranch,
      });

      return {
        query: args.searchTerm,
        count: resp.totalCount,
        results: resp.results.slice(0, 10).map((r) => ({
          id: r.targetId || r.id,
          title: r.title,
          subtitle: r.subtitle,
          branchName: r.branchName,
          status: r.badge?.text,
        })),
      };
    },
  },

  // 4. get_students_by_grade
  get_students_by_grade: {
    name: 'get_students_by_grade',
    descriptionAr: 'توزيع أعداد الطلاب حسب الصفوف الدراسية في الفرع',
    descriptionEn: 'Get student distribution across grades in the branch',
    requiredPermission: 'students.view',
    parameters: {
      type: 'object',
      properties: {
        branchId: { type: 'string', description: 'معرف الفرع' },
      },
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'students.view', 'get_students_by_grade', targetBranch);

      const grades = academicStorage.getRawGrades();
      const classes = academicStorage.getRawClasses();
      const enrollments = studentStorage.getRawEnrollments();
      const students = studentStorage.getRawStudents();

      const branchStudents = students.filter(
        (s) => (targetBranch === 'all' || s.branchId === targetBranch) && s.status === 'ACTIVE'
      );
      const studentMap = new Map(branchStudents.map((s) => [s.id, s]));

      const gradeStats = grades.map((g) => {
        const grdClasses = classes.filter((c) => c.gradeId === g.id && (targetBranch === 'all' || c.branchId === targetBranch));
        const grdClassIds = new Set(grdClasses.map((c) => c.id));
        const enrolled = enrollments.filter((e) => grdClassIds.has(e.classId) && e.status === 'ENROLLED' && studentMap.has(e.studentId));

        return {
          gradeId: g.id,
          gradeNameAr: g.nameAr,
          gradeNameEn: g.nameEn,
          classesCount: grdClasses.length,
          studentsCount: enrolled.length,
        };
      });

      return {
        branchId: targetBranch,
        grades: gradeStats,
        totalEnrolled: gradeStats.reduce((acc, curr) => acc + curr.studentsCount, 0),
      };
    },
  },

  // 5. get_teacher_count
  get_teacher_count: {
    name: 'get_teacher_count',
    descriptionAr: 'الحصول على إجمالي عدد المعلمين والكادر التعليمي وتوزيعهم حسب الفرع وحالة التعاقد',
    descriptionEn: 'Get teacher faculty count and employment breakdown by branch',
    requiredPermission: 'teachers.view',
    parameters: {
      type: 'object',
      properties: {
        branchId: { type: 'string', description: 'معرف الفرع' },
      },
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'teachers.view', 'get_teacher_count', targetBranch);

      const all = teacherStorage.getRawTeachers();
      const filtered = all.filter((t) => targetBranch === 'all' || t.branchId === targetBranch);

      const active = filtered.filter((t) => t.employmentStatus === 'ACTIVE').length;
      const fullTime = filtered.filter((t) => t.employmentType === 'FULL_TIME').length;
      const partTime = filtered.filter((t) => t.employmentType === 'PART_TIME' || t.employmentType === 'CONTRACT').length;

      return {
        branchId: targetBranch,
        total: filtered.length,
        active,
        fullTime,
        partTime,
      };
    },
  },

  // 6. search_teachers
  search_teachers: {
    name: 'search_teachers',
    descriptionAr: 'البحث عن المعلمين بالاسم أو التخصص مع تطبيق عزل الفروع',
    descriptionEn: 'Search teachers by name or specialization with branch isolation',
    requiredPermission: 'teachers.view',
    parameters: {
      type: 'object',
      properties: {
        searchTerm: { type: 'string', description: 'اسم المعلم أو تخصصه' },
        branchId: { type: 'string', description: 'معرف الفرع' },
      },
      required: ['searchTerm'],
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'teachers.view', 'search_teachers', targetBranch);

      const resp = searchStorage.searchAuthorized(actingUser, args.searchTerm, {
        domain: 'teachers',
        branchId: targetBranch,
      });

      return {
        query: args.searchTerm,
        count: resp.totalCount,
        results: resp.results.slice(0, 10).map((r) => ({
          id: r.targetId || r.id,
          name: r.title,
          details: r.subtitle,
          branchName: r.branchName,
          status: r.badge?.text,
        })),
      };
    },
  },

  // 7. get_attendance_summary
  get_attendance_summary: {
    name: 'get_attendance_summary',
    descriptionAr: 'الحصول على نسبة الحضور والغياب لليوم أو لتاريخ محدد مع إحصائيات الطلاب',
    descriptionEn: 'Get attendance rate and presence/absence summary for a date',
    requiredPermission: 'attendance.view',
    parameters: {
      type: 'object',
      properties: {
        branchId: { type: 'string', description: 'معرف الفرع' },
        date: { type: 'string', description: 'التاريخ بصيغة YYYY-MM-DD (افتراضياً اليوم)' },
      },
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'attendance.view', 'get_attendance_summary', targetBranch);

      const records = attendanceStorage.getRawRecords().filter((r) => {
        if (targetBranch !== 'all' && r.branchId !== targetBranch) return false;
        if (args?.date && r.date !== args.date) return false;
        return true;
      });

      const present = records.filter((r) => r.status === 'PRESENT').length;
      const absent = records.filter((r) => r.status === 'ABSENT').length;
      const late = records.filter((r) => r.status === 'LATE').length;
      const excused = records.filter((r) => r.status === 'EXCUSED').length;
      const total = records.length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        branchId: targetBranch,
        date: args?.date || 'اليوم',
        totalRecorded: total,
        present,
        absent,
        late,
        excused,
        attendanceRate: `${rate}%`,
      };
    },
  },

  // 8. get_top_absent_students
  get_top_absent_students: {
    name: 'get_top_absent_students',
    descriptionAr: 'قائمة بأكثر الطلاب غياباً خلال الفصل الدراسي أو الشهر الحالي',
    descriptionEn: 'List students with highest absence counts',
    requiredPermission: 'attendance.view',
    parameters: {
      type: 'object',
      properties: {
        branchId: { type: 'string', description: 'معرف الفرع' },
        limit: { type: 'string', description: 'الحد الأقصى للنتائج' },
      },
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'attendance.view', 'get_top_absent_students', targetBranch);

      const records = attendanceStorage.getRawRecords().filter((r) => {
        if (targetBranch !== 'all' && r.branchId !== targetBranch) return false;
        return r.status === 'ABSENT';
      });

      const studentCounts = new Map<string, number>();
      for (const r of records) {
        studentCounts.set(r.studentId, (studentCounts.get(r.studentId) || 0) + 1);
      }

      const allStudents = studentStorage.getRawStudents();
      const studentMap = new Map(allStudents.map((s) => [s.id, s]));

      const sorted = Array.from(studentCounts.entries())
        .map(([stdId, count]) => {
          const s = studentMap.get(stdId);
          return {
            studentId: stdId,
            studentNumber: s?.studentNumber || '-',
            nameAr: s ? (s.fullNameAr || `${s.firstNameAr} ${s.lastNameAr}`) : 'طالب',
            absenceCount: count,
            branchId: s?.branchId,
          };
        })
        .sort((a, b) => b.absenceCount - a.absenceCount)
        .slice(0, parseInt(args?.limit || '5', 10));

      return {
        branchId: targetBranch,
        topAbsentees: sorted,
      };
    },
  },

  // 9. get_timetable_schedule
  get_timetable_schedule: {
    name: 'get_timetable_schedule',
    descriptionAr: 'استعلام جدول الحصص اليومي حسب الفصل أو المعلم أو القاعة',
    descriptionEn: 'Query timetable schedule by class, teacher, or day',
    requiredPermission: 'timetable.view',
    parameters: {
      type: 'object',
      properties: {
        branchId: { type: 'string', description: 'معرف الفرع' },
        dayOfWeek: { type: 'string', description: 'اليوم بالأرقام (0=الأحد إلى 4=الخميس) أو بالاسم' },
      },
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'timetable.view', 'get_timetable_schedule', targetBranch);

      const allEntries = timetableStorage.getRawTimetableEntries().filter((e) => {
        if (targetBranch !== 'all' && e.branchId !== targetBranch) return false;
        if (e.status !== 'PUBLISHED') return false;
        if (args?.dayOfWeek !== undefined) {
          const d = parseInt(args.dayOfWeek, 10);
          if (!isNaN(d) && e.dayOfWeek !== d) return false;
        }
        return true;
      });

      const classes = academicStorage.getRawClasses();
      const subjects = academicStorage.getRawSubjects();
      const teachers = teacherStorage.getRawTeachers();
      const periods = timetableStorage.getRawPeriods();

      const dayNames: Record<number, string> = {
        0: 'الأحد',
        1: 'الإثنين',
        2: 'الثلاثاء',
        3: 'الأربعاء',
        4: 'الخميس',
      };

      const items = allEntries.slice(0, 15).map((e) => {
        const cls = classes.find((c) => c.id === e.classId);
        const sbj = subjects.find((s) => s.id === e.subjectId);
        const tch = teachers.find((t) => t.id === e.teacherId);
        const prd = periods.find((p) => p.id === e.periodId);

        return {
          day: dayNames[e.dayOfWeek] || String(e.dayOfWeek),
          period: prd?.periodNumber ?? 1,
          subject: sbj?.nameAr || '-',
          class: cls?.nameAr || '-',
          teacher: tch ? (tch.fullNameAr || `${tch.firstNameAr} ${tch.lastNameAr}`) : '-',
        };
      });

      return {
        branchId: targetBranch,
        totalLessons: allEntries.length,
        lessons: items,
      };
    },
  },

  // 10. get_fee_summary (Strictly guarded by fees.view or finance.view_reports)
  get_fee_summary: {
    name: 'get_fee_summary',
    descriptionAr: 'الملخص المالي الشامل: إجمالي المبالغ المفوترة، المحصلة، والمتأخرات (محمي بصلاحيات المالية)',
    descriptionEn: 'Comprehensive financial summary: Invoiced, Collected, and Balance Due',
    requiredPermission: 'fees.view',
    requiresFinance: true,
    parameters: {
      type: 'object',
      properties: {
        branchId: { type: 'string', description: 'معرف الفرع' },
        academicYearId: { type: 'string', description: 'العام الدراسي' },
      },
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);

      const hasFinance =
        authStorage.isSuperAdmin(actingUser) ||
        authStorage.hasPermission(actingUser, 'fees.view') ||
        authStorage.hasPermission(actingUser, 'finance.view_reports');

      if (!hasFinance) {
        authStorage.logAudit({
          actorId: actingUser.id,
          actorName: actingUser.fullName,
          actorRole: actingUser.roleCode,
          action: 'AI_UNAUTHORIZED_REQUEST',
          targetType: 'FINANCE',
          branchContext: targetBranch,
          result: 'DENIED',
          details: 'محاولة استعلام مالي دون صلاحية fees.view عبر المساعد الذكي',
        });
        throw new Error('ليس لديك صلاحية للوصول إلى البيانات والتقارير المالية.');
      }

      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'AI_FINANCIAL_QUERY',
        targetType: 'FINANCE',
        branchContext: targetBranch,
        result: 'SUCCESS',
        details: 'استعلام عن الملخص المالي عبر المساعد الذكي',
      });

      const invoices = financeStorage.getRawInvoices().filter((i) => {
        if (targetBranch !== 'all' && i.branchId !== targetBranch) return false;
        if (args?.academicYearId && i.academicYearId !== args.academicYearId) return false;
        return true;
      });

      const invoicedMinor = invoices.reduce((acc, i) => acc + i.netTotalMinor, 0);
      const collectedMinor = invoices.reduce((acc, i) => acc + i.paidTotalMinor, 0);
      const balanceDueMinor = invoices.reduce((acc, i) => acc + i.balanceDueMinor, 0);
      const collectionRate = invoicedMinor > 0 ? Math.round((collectedMinor / invoicedMinor) * 100) : 0;

      return {
        branchId: targetBranch,
        invoicedMinor,
        invoicedFormatted: formatCurrency(invoicedMinor),
        collectedMinor,
        collectedFormatted: formatCurrency(collectedMinor),
        balanceDueMinor,
        balanceDueFormatted: formatCurrency(balanceDueMinor),
        collectionRate: `${collectionRate}%`,
        invoicesCount: invoices.length,
      };
    },
  },

  // 11. get_overdue_fees (Strictly guarded by fees.view or finance.view_reports)
  get_overdue_fees: {
    name: 'get_overdue_fees',
    descriptionAr: 'قائمة الفواتير المتأخرة المستحقة على أولياء الأمور والطلاب',
    descriptionEn: 'List overdue unpaid tuition fees and student balances',
    requiredPermission: 'fees.view',
    requiresFinance: true,
    parameters: {
      type: 'object',
      properties: {
        branchId: { type: 'string', description: 'معرف الفرع' },
      },
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);

      const hasFinance =
        authStorage.isSuperAdmin(actingUser) ||
        authStorage.hasPermission(actingUser, 'fees.view') ||
        authStorage.hasPermission(actingUser, 'finance.view_reports');

      if (!hasFinance) {
        authStorage.logAudit({
          actorId: actingUser.id,
          actorName: actingUser.fullName,
          actorRole: actingUser.roleCode,
          action: 'AI_UNAUTHORIZED_REQUEST',
          targetType: 'FINANCE',
          branchContext: targetBranch,
          result: 'DENIED',
          details: 'محاولة استعلام فواتير متأخرة دون صلاحية fees.view',
        });
        throw new Error('ليس لديك صلاحية للوصول إلى بيانات الفواتير المتأخرة.');
      }

      const today = new Date().toISOString().slice(0, 10);
      const overdue = financeStorage.getRawInvoices().filter((inv) => {
        if (targetBranch !== 'all' && inv.branchId !== targetBranch) return false;
        return inv.balanceDueMinor > 0 && inv.dueDate < today;
      });

      const students = studentStorage.getRawStudents();
      const studentMap = new Map(students.map((s) => [s.id, s]));

      const list = overdue.map((inv) => {
        const s = studentMap.get(inv.studentId);
        return {
          invoiceNumber: inv.invoiceNumber,
          studentName: s ? (s.fullNameAr || `${s.firstNameAr} ${s.lastNameAr}`) : 'طالب',
          dueDate: inv.dueDate,
          balanceFormatted: formatCurrency(inv.balanceDueMinor),
        };
      });

      const totalOverdueMinor = overdue.reduce((acc, i) => acc + i.balanceDueMinor, 0);

      return {
        branchId: targetBranch,
        count: overdue.length,
        totalOverdueFormatted: formatCurrency(totalOverdueMinor),
        invoices: list,
      };
    },
  },

  // 12. search_school_data
  search_school_data: {
    name: 'search_school_data',
    descriptionAr: 'بحث شامل عبر محرك البحث المركزي المعتمد في المرحلة 11',
    descriptionEn: 'Global search across all authorized domains via Phase 11 search engine',
    requiredPermission: null, // Sub-domain permissions are enforced inside searchAuthorized
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'نص البحث' },
        branchId: { type: 'string', description: 'الفرع' },
      },
      required: ['query'],
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);

      const resp = searchStorage.searchAuthorized(actingUser, args.query, {
        domain: 'all',
        branchId: targetBranch,
      });

      return {
        query: args.query,
        totalCount: resp.totalCount,
        countsByDomain: resp.countsByDomain,
        results: resp.results.slice(0, 8).map((r) => ({
          domain: r.domain,
          title: r.title,
          subtitle: r.subtitle,
          meta: r.meta,
          badge: r.badge?.text,
        })),
      };
    },
  },

  // 13. generate_report_summary
  generate_report_summary: {
    name: 'generate_report_summary',
    descriptionAr: 'توليد ملخص تقرير معتمد من مركز التقارير بالبيانات الحقيقية',
    descriptionEn: 'Generate summary of any certified report from Report Center',
    requiredPermission: 'reports.view',
    parameters: {
      type: 'object',
      properties: {
        reportType: { type: 'string', description: 'معرف التقرير' },
        branchId: { type: 'string', description: 'معرف الفرع' },
      },
      required: ['reportType'],
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'reports.view', 'generate_report_summary', targetBranch);

      const rep = reportStorage.generateReport(actingUser, args.reportType, {
        branchId: targetBranch,
      });

      return {
        titleAr: rep.definition.titleAr,
        titleEn: rep.definition.titleEn,
        category: rep.definition.category,
        totalRows: rep.rows.length,
        summary: rep.summary,
        columns: rep.columns.map((c) => ({ key: c.key, header: c.labelAr })),
        sampleRows: rep.rows.slice(0, 5),
      };
    },
  },

  // 14. get_students_by_class
  get_students_by_class: {
    name: 'get_students_by_class',
    descriptionAr: 'قائمة وتفاصيل الطلاب المقيدين في فصل أو شعبة محددة',
    descriptionEn: 'List and details of enrolled students in a specific class',
    requiredPermission: 'students.view',
    parameters: {
      type: 'object',
      properties: {
        classIdentifier: { type: 'string', description: 'معرف الفصل أو اسمه (مثال: أول ثانوي أ)' },
        branchId: { type: 'string', description: 'معرف الفرع' },
      },
      required: ['classIdentifier'],
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'students.view', 'get_students_by_class', targetBranch);

      const query = (args?.classIdentifier || '').trim().toLowerCase();
      if (!query) throw new Error('يرجى تحديد الفصل الدراسي المطلوب.');

      const classes = academicStorage.getRawClasses();
      const targetClass = classes.find((c) => {
        if (targetBranch !== 'all' && c.branchId !== targetBranch) return false;
        return (
          c.id.toLowerCase() === query ||
          c.nameAr.toLowerCase().includes(query) ||
          (c.nameEn && c.nameEn.toLowerCase().includes(query)) ||
          (c.classCode && c.classCode.toLowerCase() === query)
        );
      });

      if (!targetClass) {
        return {
          found: false,
          message: 'لم يتم العثور على الفصل المطلوب ضمن الفرع المحدد.',
        };
      }

      const enrollments = studentStorage.getRawEnrollments().filter(
        (e) => e.classId === targetClass.id && (e.status === 'ENROLLED' || e.status === 'PROMOTED')
      );
      const studentIds = new Set(enrollments.map((e) => e.studentId));
      const allStudents = studentStorage.getRawStudents().filter(
        (s) => studentIds.has(s.id) && (targetBranch === 'all' || s.branchId === targetBranch)
      );

      const activeList = allStudents.map((s) => ({
        id: s.id,
        studentNumber: s.studentNumber,
        nameAr: s.fullNameAr || `${s.firstNameAr} ${s.lastNameAr}`,
        nameEn: s.fullNameEn || `${s.firstNameEn || ''} ${s.lastNameEn || ''}`.trim(),
        gender: s.gender,
        status: s.status,
      }));

      return {
        found: true,
        classId: targetClass.id,
        classNameAr: targetClass.nameAr,
        classNameEn: targetClass.nameEn,
        classCode: targetClass.classCode,
        capacity: targetClass.capacity,
        totalEnrolled: activeList.length,
        male: activeList.filter((s) => String(s.gender).toLowerCase() === 'male').length,
        female: activeList.filter((s) => String(s.gender).toLowerCase() === 'female').length,
        students: activeList.slice(0, 25),
      };
    },
  },

  // 15. get_teacher_schedule
  get_teacher_schedule: {
    name: 'get_teacher_schedule',
    descriptionAr: 'استعلام جدول الحصص الأسبوعي أو اليومي لمعلم محدد بالاسم أو الرقم',
    descriptionEn: 'Get timetable lessons schedule for a specific teacher',
    requiredPermission: 'timetable.view',
    parameters: {
      type: 'object',
      properties: {
        teacherIdentifier: { type: 'string', description: 'اسم المعلم أو رقمه أو معرفه' },
        branchId: { type: 'string', description: 'معرف الفرع' },
        dayOfWeek: { type: 'string', description: 'اليوم بالأرقام (0-4) أو بالاسم' },
      },
      required: ['teacherIdentifier'],
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'timetable.view', 'get_teacher_schedule', targetBranch);

      const query = (args?.teacherIdentifier || '').trim().toLowerCase();
      if (!query) throw new Error('يرجى تحديد المعلم المطلوب.');

      const teachers = teacherStorage.getRawTeachers();
      const teacher = teachers.find((t) => {
        if (targetBranch !== 'all' && t.branchId !== targetBranch) return false;
        return (
          t.id.toLowerCase() === query ||
          (t.teacherNumber && t.teacherNumber.toLowerCase() === query) ||
          (t.fullNameAr && t.fullNameAr.toLowerCase().includes(query)) ||
          (t.fullNameEn && t.fullNameEn.toLowerCase().includes(query)) ||
          `${t.firstNameAr} ${t.lastNameAr}`.toLowerCase().includes(query)
        );
      });

      if (!teacher) {
        return {
          found: false,
          message: 'لم يتم العثور على المعلم المطلوب في الفرع المحدد.',
        };
      }

      let entries = timetableStorage.getRawTimetableEntries().filter(
        (e) => e.teacherId === teacher.id && e.status === 'PUBLISHED'
      );

      if (args?.dayOfWeek !== undefined && args?.dayOfWeek !== '') {
        const d = parseInt(args.dayOfWeek, 10);
        if (!isNaN(d)) {
          entries = entries.filter((e) => e.dayOfWeek === d);
        }
      }

      const classes = academicStorage.getRawClasses();
      const subjects = academicStorage.getRawSubjects();
      const rooms = timetableStorage.getRawRooms();
      const periods = timetableStorage.getRawPeriods();

      const dayNames: Record<number, string> = {
        0: 'الأحد',
        1: 'الإثنين',
        2: 'الثلاثاء',
        3: 'الأربعاء',
        4: 'الخميس',
      };

      const lessons = entries.map((e) => {
        const cls = classes.find((c) => c.id === e.classId);
        const sbj = subjects.find((s) => s.id === e.subjectId);
        const rm = rooms.find((r) => r.id === e.roomId);
        const prd = periods.find((p) => p.id === e.periodId);

        return {
          day: dayNames[e.dayOfWeek] || String(e.dayOfWeek),
          dayNumber: e.dayOfWeek,
          periodNumber: prd?.periodNumber ?? 1,
          periodName: prd?.nameAr || `الحصة ${prd?.periodNumber ?? 1}`,
          subject: sbj?.nameAr || '-',
          class: cls?.nameAr || '-',
          room: rm?.nameAr || '-',
        };
      }).sort((a, b) => {
        if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
        return a.periodNumber - b.periodNumber;
      });

      return {
        found: true,
        teacherId: teacher.id,
        teacherNumber: teacher.teacherNumber,
        teacherNameAr: teacher.fullNameAr || `${teacher.firstNameAr} ${teacher.lastNameAr}`,
        teacherNameEn: teacher.fullNameEn || `${teacher.firstNameEn} ${teacher.lastNameEn}`,
        specialization: teacher.specialization,
        totalLessons: entries.length,
        lessons,
      };
    },
  },

  // 16. check_teacher_schedule_conflicts
  check_teacher_schedule_conflicts: {
    name: 'check_teacher_schedule_conflicts',
    descriptionAr: 'فحص والتحقق من وجود أي تعارض في جدول حصص معلم معين',
    descriptionEn: 'Check for scheduling conflicts in a teacher timetable',
    requiredPermission: 'timetable.view',
    parameters: {
      type: 'object',
      properties: {
        teacherIdentifier: { type: 'string', description: 'اسم المعلم أو رقمه' },
        branchId: { type: 'string', description: 'معرف الفرع' },
      },
      required: ['teacherIdentifier'],
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'timetable.view', 'check_teacher_schedule_conflicts', targetBranch);

      const query = (args?.teacherIdentifier || '').trim().toLowerCase();
      if (!query) throw new Error('يرجى تحديد المعلم المطلوب.');

      const normalize = (str: string) => str.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').toLowerCase();
      const normQuery = normalize(query);

      const teachers = teacherStorage.getRawTeachers();
      let teacher = teachers.find((t) => {
        if (targetBranch !== 'all' && t.branchId !== targetBranch) return false;
        const normName = normalize(t.fullNameAr || `${t.firstNameAr} ${t.lastNameAr}`);
        return (
          t.id.toLowerCase() === query ||
          (t.teacherNumber && t.teacherNumber.toLowerCase() === query) ||
          normName.includes(normQuery)
        );
      });

      if (!teacher && (targetBranch === 'all' || isBranchPermitted(actingUser, 'all'))) {
        teacher = teachers.find((t) => {
          if (!isBranchPermitted(actingUser, t.branchId)) return false;
          const normName = normalize(t.fullNameAr || `${t.firstNameAr} ${t.lastNameAr}`);
          return normName.includes(normQuery);
        });
      }

      if (!teacher) {
        return {
          found: false,
          message: `لم يتم العثور على المعلم المطلوب (${query}) للتحقق من جدوله.`,
        };
      }

      const entries = timetableStorage.getRawTimetableEntries().filter(
        (e) => e.teacherId === teacher.id && e.status === 'PUBLISHED'
      );

      // Check slot overlaps (same day + same period)
      const slotMap = new Map<string, any[]>();
      for (const e of entries) {
        const slotKey = `${e.dayOfWeek}_${e.periodId}`;
        const list = slotMap.get(slotKey) || [];
        list.push(e);
        slotMap.set(slotKey, list);
      }

      const classes = academicStorage.getRawClasses();
      const subjects = academicStorage.getRawSubjects();
      const periods = timetableStorage.getRawPeriods();
      const dayNames: Record<number, string> = {
        0: 'الأحد',
        1: 'الإثنين',
        2: 'الثلاثاء',
        3: 'الأربعاء',
        4: 'الخميس',
      };

      const conflicts: any[] = [];
      for (const [slotKey, slotEntries] of slotMap.entries()) {
        if (slotEntries.length > 1) {
          const first = slotEntries[0];
          const prd = periods.find((p) => p.id === first.periodId);
          conflicts.push({
            day: dayNames[first.dayOfWeek] || String(first.dayOfWeek),
            period: prd?.nameAr || `الحصة ${prd?.periodNumber ?? 1}`,
            entriesCount: slotEntries.length,
            classes: slotEntries.map((se) => {
              const c = classes.find((cl) => cl.id === se.classId);
              const s = subjects.find((sb) => sb.id === se.subjectId);
              return `${c?.nameAr || '-'} (${s?.nameAr || '-'})`;
            }),
          });
        }
      }

      const teacherName = teacher.fullNameAr || `${teacher.firstNameAr} ${teacher.lastNameAr}`;
      const hasConflicts = conflicts.length > 0;

      return {
        found: true,
        teacherId: teacher.id,
        teacherName,
        totalLessons: entries.length,
        hasConflicts,
        conflictsCount: conflicts.length,
        conflicts,
        verdictAr: hasConflicts
          ? `يوجد ${conflicts.length} تعارض في جدول المعلم ${teacherName}.`
          : `لا يوجد أي تعارض في جدول المعلم ${teacherName}، والجدول سليم ومكتمل بنجاح.`,
        verdictEn: hasConflicts
          ? `Found ${conflicts.length} conflict(s) in schedule for ${teacherName}.`
          : `No scheduling conflicts found for ${teacherName}. The timetable is verified.`,
      };
    },
  },

  // 17. get_class_schedule
  get_class_schedule: {
    name: 'get_class_schedule',
    descriptionAr: 'استعلام جدول الحصص الأسبوعي لفصل محدد',
    descriptionEn: 'Get weekly timetable schedule for a specific class',
    requiredPermission: 'timetable.view',
    parameters: {
      type: 'object',
      properties: {
        classIdentifier: { type: 'string', description: 'اسم الفصل أو معرفه' },
        branchId: { type: 'string', description: 'معرف الفرع' },
        dayOfWeek: { type: 'string', description: 'اليوم بالأرقام أو الاسم' },
      },
      required: ['classIdentifier'],
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'timetable.view', 'get_class_schedule', targetBranch);

      const query = (args?.classIdentifier || '').trim().toLowerCase();
      if (!query) throw new Error('يرجى تحديد الفصل الدراسي المطلوب.');

      const classes = academicStorage.getRawClasses();
      const targetClass = classes.find((c) => {
        if (targetBranch !== 'all' && c.branchId !== targetBranch) return false;
        return (
          c.id.toLowerCase() === query ||
          c.nameAr.toLowerCase().includes(query) ||
          (c.nameEn && c.nameEn.toLowerCase().includes(query)) ||
          (c.classCode && c.classCode.toLowerCase() === query)
        );
      });

      if (!targetClass) {
        return {
          found: false,
          message: 'لم يتم العثور على الفصل المطلوب في الفرع المحدد.',
        };
      }

      let entries = timetableStorage.getRawTimetableEntries().filter(
        (e) => e.classId === targetClass.id && e.status === 'PUBLISHED'
      );

      if (args?.dayOfWeek !== undefined && args?.dayOfWeek !== '') {
        const d = parseInt(args.dayOfWeek, 10);
        if (!isNaN(d)) {
          entries = entries.filter((e) => e.dayOfWeek === d);
        }
      }

      const subjects = academicStorage.getRawSubjects();
      const teachers = teacherStorage.getRawTeachers();
      const periods = timetableStorage.getRawPeriods();
      const rooms = timetableStorage.getRawRooms();

      const dayNames: Record<number, string> = {
        0: 'الأحد',
        1: 'الإثنين',
        2: 'الثلاثاء',
        3: 'الأربعاء',
        4: 'الخميس',
      };

      const lessons = entries.map((e) => {
        const sbj = subjects.find((s) => s.id === e.subjectId);
        const tch = teachers.find((t) => t.id === e.teacherId);
        const prd = periods.find((p) => p.id === e.periodId);
        const rm = rooms.find((r) => r.id === e.roomId);

        return {
          day: dayNames[e.dayOfWeek] || String(e.dayOfWeek),
          dayNumber: e.dayOfWeek,
          periodNumber: prd?.periodNumber ?? 1,
          subject: sbj?.nameAr || '-',
          teacher: tch ? (tch.fullNameAr || `${tch.firstNameAr} ${tch.lastNameAr}`) : '-',
          room: rm?.nameAr || '-',
        };
      }).sort((a, b) => {
        if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
        return a.periodNumber - b.periodNumber;
      });

      return {
        found: true,
        classId: targetClass.id,
        classNameAr: targetClass.nameAr,
        totalLessons: entries.length,
        lessons,
      };
    },
  },

  // 18. get_room_schedule
  get_room_schedule: {
    name: 'get_room_schedule',
    descriptionAr: 'استعلام جدول إشغال قاعة دراسية أو معمل',
    descriptionEn: 'Get timetable schedule and occupancy for a specific room',
    requiredPermission: 'timetable.view',
    parameters: {
      type: 'object',
      properties: {
        roomIdentifier: { type: 'string', description: 'اسم القاعة أو رقمها' },
        branchId: { type: 'string', description: 'معرف الفرع' },
      },
      required: ['roomIdentifier'],
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'timetable.view', 'get_room_schedule', targetBranch);

      const query = (args?.roomIdentifier || '').trim().toLowerCase();
      const rooms = timetableStorage.getRawRooms();
      const room = rooms.find((r) => {
        if (targetBranch !== 'all' && r.branchId !== targetBranch) return false;
        return (
          r.id.toLowerCase() === query ||
          r.nameAr.toLowerCase().includes(query) ||
          (r.roomCode && r.roomCode.toLowerCase() === query)
        );
      });

      if (!room) {
        return { found: false, message: 'لم يتم العثور على القاعة المحددة.' };
      }

      const entries = timetableStorage.getRawTimetableEntries().filter(
        (e) => e.roomId === room.id && e.status === 'PUBLISHED'
      );

      const classes = academicStorage.getRawClasses();
      const subjects = academicStorage.getRawSubjects();
      const teachers = teacherStorage.getRawTeachers();
      const periods = timetableStorage.getRawPeriods();

      const dayNames: Record<number, string> = {
        0: 'الأحد',
        1: 'الإثنين',
        2: 'الثلاثاء',
        3: 'الأربعاء',
        4: 'الخميس',
      };

      const lessons = entries.map((e) => {
        const cls = classes.find((c) => c.id === e.classId);
        const sbj = subjects.find((s) => s.id === e.subjectId);
        const tch = teachers.find((t) => t.id === e.teacherId);
        const prd = periods.find((p) => p.id === e.periodId);

        return {
          day: dayNames[e.dayOfWeek] || String(e.dayOfWeek),
          periodNumber: prd?.periodNumber ?? 1,
          class: cls?.nameAr || '-',
          subject: sbj?.nameAr || '-',
          teacher: tch ? (tch.fullNameAr || `${tch.firstNameAr} ${tch.lastNameAr}`) : '-',
        };
      });

      return {
        found: true,
        roomId: room.id,
        roomNameAr: room.nameAr,
        roomCode: room.roomCode,
        capacity: room.capacity,
        totalBookings: entries.length,
        lessons,
      };
    },
  },

  // 19. get_student_attendance
  get_student_attendance: {
    name: 'get_student_attendance',
    descriptionAr: 'استعلام سجل وتفاصيل حضور وغياب طالب محدد ونسبته',
    descriptionEn: 'Get attendance history, stats, and rate for a specific student',
    requiredPermission: 'attendance.view',
    parameters: {
      type: 'object',
      properties: {
        studentIdentifier: { type: 'string', description: 'اسم الطالب أو رقمه أو هويته' },
        branchId: { type: 'string', description: 'معرف الفرع' },
        academicYearId: { type: 'string', description: 'معرف العام الدراسي' },
      },
      required: ['studentIdentifier'],
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);
      enforcePermission(actingUser, 'attendance.view', 'get_student_attendance', targetBranch);

      const query = (args?.studentIdentifier || '').trim().toLowerCase();
      if (!query) throw new Error('يرجى تحديد الطالب المطلوب.');

      const students = studentStorage.getRawStudents();
      const student = students.find((s) => {
        if (!isBranchPermitted(actingUser, s.branchId)) return false;
        const nameAr = (s.fullNameAr || `${s.firstNameAr} ${s.lastNameAr}`).toLowerCase();
        const nameEn = (s.fullNameEn || `${s.firstNameEn || ''} ${s.lastNameEn || ''}`).toLowerCase();
        return (
          s.id.toLowerCase() === query ||
          s.id.toLowerCase().includes(query) ||
          s.studentNumber.toLowerCase().includes(query) ||
          (s.nationalId && s.nationalId.includes(query)) ||
          nameAr.includes(query) ||
          nameEn.includes(query)
        );
      });

      if (!student) {
        return { found: false, message: 'لم يتم العثور على الطالب المطلوب ضمن الفروع المصرح لك بها.' };
      }

      let records = attendanceStorage.getRawRecords().filter((r) => r.studentId === student.id);
      if (args?.academicYearId) {
        records = records.filter((r) => r.academicYearId === args.academicYearId);
      }

      const total = records.length;
      const present = records.filter((r) => r.status === 'PRESENT').length;
      const absent = records.filter((r) => r.status === 'ABSENT').length;
      const late = records.filter((r) => r.status === 'LATE').length;
      const excused = records.filter((r) => r.status === 'EXCUSED').length;
      const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

      return {
        found: true,
        studentId: student.id,
        studentNumber: student.studentNumber,
        studentNameAr: student.fullNameAr || `${student.firstNameAr} ${student.lastNameAr}`,
        totalSessions: total,
        presentCount: present,
        absentCount: absent,
        lateCount: late,
        excusedCount: excused,
        attendanceRate: `${rate}%`,
        recentRecords: records.slice(-5).map((r) => ({
          date: r.date,
          status: r.status,
          checkInTime: r.checkInTime || '-',
        })),
      };
    },
  },

  // 20. get_student_financial_statement (Strictly guarded by fees.view or finance.view_reports)
  get_student_financial_statement: {
    name: 'get_student_financial_statement',
    descriptionAr: 'كشف الحساب المالي للطالب: الرسوم المفوترة، المسددة، والمتبقي (محمي بالصلاحيات المالية)',
    descriptionEn: 'Student financial account statement: Invoiced, Paid, Balance, and Overdue',
    requiredPermission: 'fees.view',
    requiresFinance: true,
    parameters: {
      type: 'object',
      properties: {
        studentIdentifier: { type: 'string', description: 'اسم الطالب أو رقمه أو هويته' },
        branchId: { type: 'string', description: 'معرف الفرع' },
        academicYearId: { type: 'string', description: 'معرف العام الدراسي' },
      },
      required: ['studentIdentifier'],
    },
    execute: (actingUser, branchId, args) => {
      const targetBranch = args?.branchId || branchId;
      enforceBranchIsolation(actingUser, targetBranch);

      const hasFinance =
        authStorage.isSuperAdmin(actingUser) ||
        authStorage.hasPermission(actingUser, 'fees.view') ||
        authStorage.hasPermission(actingUser, 'finance.view_reports');

      if (!hasFinance) {
        authStorage.logAudit({
          actorId: actingUser.id,
          actorName: actingUser.fullName,
          actorRole: actingUser.roleCode,
          action: 'AI_UNAUTHORIZED_REQUEST',
          targetType: 'FINANCE',
          branchContext: targetBranch,
          result: 'DENIED',
          details: 'محاولة استعلام كشف حساب مالي لطالب دون صلاحية fees.view عبر المساعد الذكي',
        });
        throw new Error('ليس لديك صلاحية للوصول إلى البيانات والتقارير المالية للطلاب.');
      }

      const query = (args?.studentIdentifier || '').trim().toLowerCase();
      if (!query) throw new Error('يرجى تحديد الطالب المطلوب.');

      const students = studentStorage.getRawStudents();
      const student = students.find((s) => {
        if (!isBranchPermitted(actingUser, s.branchId)) return false;
        const nameAr = (s.fullNameAr || `${s.firstNameAr} ${s.lastNameAr}`).toLowerCase();
        const nameEn = (s.fullNameEn || `${s.firstNameEn || ''} ${s.lastNameEn || ''}`).toLowerCase();
        return (
          s.id.toLowerCase() === query ||
          s.id.toLowerCase().includes(query) ||
          s.studentNumber.toLowerCase().includes(query) ||
          (s.nationalId && s.nationalId.includes(query)) ||
          nameAr.includes(query) ||
          nameEn.includes(query)
        );
      });

      if (!student) {
        return { found: false, message: 'لم يتم العثور على الطالب المطلوب ضمن الفروع المصرح لك بها.' };
      }

      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'AI_FINANCIAL_QUERY',
        targetType: 'FINANCE',
        targetIdentifier: student.studentNumber,
        branchContext: student.branchId,
        result: 'SUCCESS',
        details: `استعلام عن كشف الحساب المالي للطالب (${student.studentNumber}) عبر المساعد الذكي`,
      });

      const statement = financeStorage.getStudentFinancialStatement(
        actingUser,
        student.id,
        args?.academicYearId
      );

      return {
        found: true,
        studentId: statement.studentId,
        studentNumber: statement.studentNumber,
        studentNameAr: statement.studentNameAr,
        branchNameAr: statement.branchNameAr,
        totalBilledFormatted: formatCurrency(statement.totalNetBilledMinor),
        totalPaidFormatted: formatCurrency(statement.netCollectedMinor),
        balanceDueFormatted: formatCurrency(statement.outstandingBalanceMinor),
        overdueFormatted: formatCurrency(statement.overdueAmountMinor),
        invoicesCount: statement.invoices.length,
        paymentsCount: statement.payments.length,
        invoices: statement.invoices.map((i) => ({
          number: i.invoiceNumber,
          title: i.notes || i.invoiceNumber,
          totalFormatted: formatCurrency(i.netTotalMinor),
          balanceFormatted: formatCurrency(i.balanceDueMinor),
          status: i.status,
          dueDate: i.dueDate,
        })),
      };
    },
  },
};
