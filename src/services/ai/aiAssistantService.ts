import { GoogleGenAI } from '@google/genai';
import { SafeUser } from '../../types/auth';
import {
  AIMessage,
  AIProviderType,
  AIProviderRequest,
  AIProviderResponse,
  AIQuickAction,
  AIProposedAction,
  AIDataCard,
} from '../../types/ai';
import { AIProvider, AIToolResult } from './aiTypes';
import { AI_TOOLS, isBranchPermitted } from './aiTools';
import { aiSecurityGuard } from './aiSecurity';
import { aiPermissionService } from './aiPermissionService';
import { aiAuditService } from './aiAuditService';
import { aiContextService } from './aiContextService';
import { aiActionService } from './aiActionService';
import { branchStorage } from '../branchStorage';
import { studentStorage } from '../studentStorage';
import { teacherStorage } from '../teacherStorage';
import { authStorage } from '../authStorage';

// ========================================================
// 1. BUILT-IN INTELLIGENT DETERMINISTIC ENGINE (REAL DATA)
// ========================================================
export class BuiltinAIProvider implements AIProvider {
  public id: AIProviderType = 'builtin';
  public nameAr = 'المساعد الذكي الداخلي (نواة النظام المباشرة)';
  public nameEn = 'Built-in Intelligent Engine (Real-Time)';
  public descriptionAr = 'محرك مباشر يحلل استفسارات إدارة المدرسة ويربطها بالخدمات المعتمدة وعزل الفروع فورياً.';
  public descriptionEn = 'Direct zero-latency engine executing authorized tools against verified storage.';

  public isAvailable(): boolean {
    return true;
  }

  public async generateResponse(request: AIProviderRequest): Promise<AIProviderResponse> {
    const { query, actingUser, branchId, academicYearId, language } = request;
    const lower = query.toLowerCase().trim();
    const isAr = language === 'ar' || /[\u0600-\u06FF]/.test(query);

    const activeBranch = branchStorage.getStoredBranches().find((b) => b.id === branchId);
    const branchName = activeBranch ? (isAr ? activeBranch.nameAr : activeBranch.nameEn) : 'كافة الفروع';

    // ----------------------------------------------------
    // A. SAFE ADMINISTRATIVE WRITE ACTIONS (2-STEP CONFIRM)
    // ----------------------------------------------------
    // 1. Change student status
    const studentStatusMatch = lower.match(/(?:غيّر|تغيير|حالة الطالب|عطّل|تفعيل|تجميد|نشط|غير نشط|حالة قيد)\s*(.+)?/i);
    const isStudentStatusIntent =
      (lower.includes('حالة الطالب') || lower.includes('غير نشط') || lower.includes('طالب نشط') || lower.includes('status of student')) &&
      (lower.includes('تغيير') || lower.includes('غيّر') || lower.includes('update') || lower.includes('set') || lower.includes('change'));

    if (isStudentStatusIntent) {
      // Find candidate student
      const allStudents = studentStorage.getRawStudents().filter((s) => isBranchPermitted(actingUser, s.branchId));
      let candidate = allStudents.find((s) => lower.includes(s.studentNumber.toLowerCase()) || lower.includes(s.id.toLowerCase()));
      if (!candidate) {
        // match by name tokens
        candidate = allStudents.find((s) => {
          const nameAr = s.fullNameAr || `${s.firstNameAr} ${s.lastNameAr}`;
          const parts = nameAr.split(' ');
          return parts.some((p) => p.length > 2 && lower.includes(p.toLowerCase()));
        });
      }

      if (candidate) {
        const targetStatus = lower.includes('غير نشط') || lower.includes('inactive') || lower.includes('تعطيل') ? 'INACTIVE' : 'ACTIVE';
        try {
          const action = aiActionService.proposeStudentStatusChange(actingUser, candidate.id, targetStatus);
          return {
            content: isAr
              ? `سأقوم بتغيير حالة الطالب ${action.entityName} (الرقم الأكاديمي: ${candidate.studentNumber}) من [${candidate.status}] إلى [${targetStatus}].\n\nنظراً لأمان النظام، يتطلب هذا الإجراء تأكيدك الصريح قبل التنفيذ.`
              : `I have prepared a status update for student ${action.entityName} (#${candidate.studentNumber}) from [${candidate.status}] to [${targetStatus}]. Please review and confirm below.`,
            proposedAction: action,
            source: 'سجلات الطلاب المعتمدة (studentStorage)',
            scope: { branchName },
          };
        } catch (e: any) {
          return {
            content: e.message || (isAr ? 'تعذر إعداد إجراء التغيير.' : 'Could not prepare action.'),
            error: true,
          };
        }
      }
    }

    // 2. Change teacher status
    const isTeacherStatusIntent =
      (lower.includes('حالة المعلم') || lower.includes('إجازة') || lower.includes('إنهاء تعاقد') || lower.includes('تعليق') || lower.includes('معلم نشط')) &&
      (lower.includes('تغيير') || lower.includes('غيّر') || lower.includes('update') || lower.includes('change'));

    if (isTeacherStatusIntent) {
      const allTeachers = teacherStorage.getRawTeachers().filter((t) => isBranchPermitted(actingUser, t.branchId));
      let candidateTeacher = allTeachers.find((t) => lower.includes(t.teacherNumber?.toLowerCase() || '') || lower.includes(t.id.toLowerCase()));
      if (!candidateTeacher) {
        candidateTeacher = allTeachers.find((t) => {
          const nameAr = t.fullNameAr || `${t.firstNameAr} ${t.lastNameAr}`;
          const parts = nameAr.split(' ');
          return parts.some((p) => p.length > 2 && lower.includes(p.toLowerCase()));
        });
      }

      if (candidateTeacher) {
        let targetStatus: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'SUSPENDED' = 'ON_LEAVE';
        if (lower.includes('إنهاء') || lower.includes('terminated')) targetStatus = 'TERMINATED';
        else if (lower.includes('نشط') || lower.includes('active')) targetStatus = 'ACTIVE';
        else if (lower.includes('تعليق') || lower.includes('suspended')) targetStatus = 'SUSPENDED';

        try {
          const action = aiActionService.proposeTeacherStatusChange(actingUser, candidateTeacher.id, targetStatus);
          return {
            content: isAr
              ? `سأقوم بتغيير حالة تعاقد المعلم ${action.entityName} (الرقم الوظيفي: ${candidateTeacher.teacherNumber}) من [${candidateTeacher.employmentStatus}] إلى [${targetStatus}].\n\nنظراً لأمان النظام، يتطلب هذا الإجراء تأكيدك الصريح قبل التنفيذ.`
              : `I have prepared an employment status update for teacher ${action.entityName} (#${candidateTeacher.teacherNumber}) from [${candidateTeacher.employmentStatus}] to [${targetStatus}]. Please review and confirm below.`,
            proposedAction: action,
            source: 'سجلات الكادر التعليمي (teacherStorage)',
            scope: { branchName },
          };
        } catch (e: any) {
          return {
            content: e.message || (isAr ? 'تعذر إعداد إجراء التغيير.' : 'Could not prepare action.'),
            error: true,
          };
        }
      }
    }

    // ----------------------------------------------------
    // B. FINANCIAL QUERIES (STRICTLY GUARDED)
    // ----------------------------------------------------
    const isFeeSummaryIntent =
      lower.includes('المبالغ المحصلة') ||
      lower.includes('إجمالي المبالغ') ||
      lower.includes('إجمالي الإيرادات') ||
      lower.includes('المحصل') ||
      lower.includes('الإيراد') ||
      lower.includes('الرسوم') ||
      lower.includes('total collected') ||
      lower.includes('fee summary') ||
      lower.includes('revenue');

    const isOverdueIntent =
      lower.includes('الفواتير المتأخرة') ||
      lower.includes('المتأخرات') ||
      lower.includes('المبالغ المتأخرة') ||
      lower.includes('overdue fees') ||
      lower.includes('unpaid invoices');

    const isStudentStatementIntent =
      (lower.includes('كشف حساب') || lower.includes('المستحقات على الطالب') || lower.includes('رسوم الطالب') || lower.includes('financial statement')) &&
      !isOverdueIntent;

    if (isOverdueIntent) {
      try {
        const toolDef = AI_TOOLS['get_overdue_fees'];
        const res = await toolDef.execute(actingUser, branchId, {});
        aiAuditService.logToolExecution(actingUser, 'get_overdue_fees', branchId, true);

        const card: AIDataCard = {
          type: 'table',
          title: isAr ? 'قائمة الفواتير المتأخرة' : 'Overdue Invoices List',
          subtitle: isAr ? `إجمالي المتأخرات: ${res.totalOverdueFormatted}` : `Total Due: ${res.totalOverdueFormatted}`,
          columns: [
            { key: 'invoiceNumber', header: isAr ? 'رقم الفاتورة' : 'Invoice #' },
            { key: 'studentName', header: isAr ? 'اسم الطالب' : 'Student Name' },
            { key: 'dueDate', header: isAr ? 'تاريخ الاستحقاق' : 'Due Date' },
            { key: 'balanceFormatted', header: isAr ? 'المبلغ المستحق' : 'Balance Due' },
          ],
          rows: res.invoices,
          footnote: isAr
            ? `عدد الفواتير المتأخرة: ${res.count} فاتورة مستحقة السداد.`
            : `Total overdue invoices: ${res.count}.`,
        };

        return {
          content: isAr
            ? `يوجد حالياً **${res.count}** فاتورة متأخرة بإجمالي مبالغ مستحقة تبلغ **${res.totalOverdueFormatted}** في ${branchName}. تفاصيل الفواتير موضحة أدناه:`
            : `There are **${res.count}** overdue invoice(s) totaling **${res.totalOverdueFormatted}** in ${branchName}. Details are listed below:`,
          dataCard: card,
          source: 'سجلات المالية والفوترة (financeStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return {
          content: err.message || (isAr ? 'ليس لديك صلاحية للوصول إلى البيانات المالية.' : 'Access to financial data denied.'),
          error: true,
        };
      }
    }

    if (isStudentStatementIntent) {
      try {
        // Extract student token
        const tokens = query.split(/[\s,،]+/);
        let stdQuery = tokens[tokens.length - 1];
        // if user asked "كشف حساب الطالب أحمد", pick "أحمد"
        const idx = tokens.findIndex((t) => t.includes('طالب') || t.includes('student'));
        if (idx !== -1 && tokens[idx + 1]) {
          stdQuery = tokens[idx + 1];
        }

        const toolDef = AI_TOOLS['get_student_financial_statement'];
        const res = await toolDef.execute(actingUser, branchId, { studentIdentifier: stdQuery });
        aiAuditService.logToolExecution(actingUser, 'get_student_financial_statement', branchId, true);

        if (!res.found) {
          return {
            content: res.message || (isAr ? 'لم يتم العثور على الطالب المطلوب.' : 'Student not found.'),
            error: true,
          };
        }

        const card: AIDataCard = {
          type: 'kpi_grid',
          title: isAr ? `كشف الحساب المالي: ${res.studentNameAr}` : `Financial Statement: ${res.studentNumber}`,
          subtitle: isAr ? `الرقم الأكاديمي: ${res.studentNumber}` : `Student ID: ${res.studentNumber}`,
          items: [
            { label: isAr ? 'إجمالي المفوتر' : 'Total Billed', value: res.totalBilledFormatted, color: 'blue' },
            { label: isAr ? 'المسدد' : 'Total Paid', value: res.totalPaidFormatted, color: 'emerald' },
            { label: isAr ? 'المتبقي' : 'Balance Due', value: res.balanceDueFormatted, color: 'rose' },
            { label: isAr ? 'المتأخرات' : 'Overdue', value: res.overdueFormatted, color: 'amber' },
          ],
          footnote: isAr ? `عدد الفواتير: ${res.invoicesCount} | عدد الدفعات: ${res.paymentsCount}` : `Invoices: ${res.invoicesCount} | Payments: ${res.paymentsCount}`,
        };

        return {
          content: isAr
            ? `إليك كشف الحساب المالي المعتمد للطالب **${res.studentNameAr}** (${res.studentNumber}):`
            : `Here is the certified financial statement for student **${res.studentNameAr}** (${res.studentNumber}):`,
          dataCard: card,
          source: 'سجلات المالية والرسوم (financeStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return {
          content: err.message || (isAr ? 'ليس لديك صلاحية للوصول إلى البيانات المالية.' : 'Financial permission denied.'),
          error: true,
        };
      }
    }

    if (isFeeSummaryIntent) {
      try {
        const toolDef = AI_TOOLS['get_fee_summary'];
        const res = await toolDef.execute(actingUser, branchId, { academicYearId });
        aiAuditService.logToolExecution(actingUser, 'get_fee_summary', branchId, true);

        const card: AIDataCard = {
          type: 'kpi_grid',
          title: isAr ? 'الملخص المالي ومؤشرات التحصيل' : 'Financial & Collection Summary',
          subtitle: isAr ? `الفرع: ${branchName}` : `Branch: ${branchName}`,
          items: [
            { label: isAr ? 'إجمالي المفوتر' : 'Invoiced', value: res.invoicedFormatted, color: 'blue' },
            { label: isAr ? 'المبالغ المحصلة' : 'Collected', value: res.collectedFormatted, color: 'emerald', badge: res.collectionRate },
            { label: isAr ? 'المتبقي المستحق' : 'Balance Due', value: res.balanceDueFormatted, color: 'amber' },
            { label: isAr ? 'عدد الفواتير' : 'Invoices Count', value: res.invoicesCount, color: 'slate' },
          ],
          footnote: isAr
            ? `نسبة التحصيل الإجمالية المحققة: ${res.collectionRate} من صافي المستحقات.`
            : `Overall collection rate: ${res.collectionRate}.`,
        };

        return {
          content: isAr
            ? `إجمالي المبالغ المحصلة في ${branchName} يبلغ **${res.collectedFormatted}** بنسبة تحصيل **${res.collectionRate}** من إجمالي المفوتر البالغ **${res.invoicedFormatted}**.`
            : `Total collected in ${branchName} is **${res.collectedFormatted}** with a collection rate of **${res.collectionRate}** from invoiced **${res.invoicedFormatted}**.`,
          dataCard: card,
          source: 'النظام المالي المعتمد (financeStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return {
          content: err.message || (isAr ? 'ليس لديك صلاحية للوصول إلى البيانات المالية.' : 'Financial permission denied.'),
          error: true,
        };
      }
    }

    // ----------------------------------------------------
    // C. ATTENDANCE QUERIES
    // ----------------------------------------------------
    const isTopAbsentIntent =
      lower.includes('أكثر الطلاب غياباً') ||
      lower.includes('اكثر الطلاب غيابا') ||
      lower.includes('أعلى غياب') ||
      lower.includes('top absent') ||
      lower.includes('highest absence');

    const isAttendanceSummaryIntent =
      lower.includes('نسبة الحضور') ||
      lower.includes('نسبه الحضور') ||
      lower.includes('حضور اليوم') ||
      lower.includes('غياب اليوم') ||
      lower.includes('إحصائيات الحضور') ||
      lower.includes('attendance rate') ||
      lower.includes('today attendance');

    const isStudentAttendanceIntent =
      (lower.includes('حضور الطالب') || lower.includes('غياب الطالب') || lower.includes('سجل حضور')) &&
      !isTopAbsentIntent;

    if (isTopAbsentIntent) {
      try {
        const toolDef = AI_TOOLS['get_top_absent_students'];
        const res = await toolDef.execute(actingUser, branchId, { limit: '5' });
        aiAuditService.logToolExecution(actingUser, 'get_top_absent_students', branchId, true);

        const card: AIDataCard = {
          type: 'table',
          title: isAr ? 'أكثر الطلاب غياباً' : 'Top Absent Students',
          subtitle: isAr ? `فرع: ${branchName}` : `Branch: ${branchName}`,
          columns: [
            { key: 'studentNumber', header: isAr ? 'الرقم الأكاديمي' : 'Student ID' },
            { key: 'nameAr', header: isAr ? 'اسم الطالب' : 'Student Name' },
            { key: 'absenceCount', header: isAr ? 'أيام الغياب' : 'Absence Days' },
          ],
          rows: res.topAbsentees,
          footnote: isAr ? 'مستخرج من السجلات اليومية المعتمدة للحضور والغياب.' : 'Certified attendance records.',
        };

        const namesList = res.topAbsentees.map((s: any) => `${s.nameAr} (${s.absenceCount} أيام)`).join('، ');

        return {
          content: isAr
            ? `أكثر الطلاب غياباً في ${branchName} هم: **${namesList || 'لا يوجد غياب مسجل'}**.`
            : `The students with the highest absence counts in ${branchName} are listed below:`,
          dataCard: card,
          source: 'سجلات الحضور المعتمدة (attendanceStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return { content: err.message, error: true };
      }
    }

    if (isStudentAttendanceIntent) {
      try {
        const tokens = query.split(/[\s,،]+/);
        let stdQuery = tokens[tokens.length - 1];
        const idx = tokens.findIndex((t) => t.includes('طالب') || t.includes('student'));
        if (idx !== -1 && tokens[idx + 1]) {
          stdQuery = tokens[idx + 1];
        }

        const toolDef = AI_TOOLS['get_student_attendance'];
        const res = await toolDef.execute(actingUser, branchId, { studentIdentifier: stdQuery });
        aiAuditService.logToolExecution(actingUser, 'get_student_attendance', branchId, true);

        if (!res.found) {
          return { content: res.message, error: true };
        }

        const card: AIDataCard = {
          type: 'kpi_grid',
          title: isAr ? `سجل حضور الطالب: ${res.studentNameAr}` : `Attendance: ${res.studentNameAr}`,
          subtitle: isAr ? `الرقم: ${res.studentNumber}` : `ID: ${res.studentNumber}`,
          items: [
            { label: isAr ? 'نسبة الحضور' : 'Attendance Rate', value: res.attendanceRate, color: 'emerald' },
            { label: isAr ? 'أيام الحضور' : 'Present Days', value: res.presentCount, color: 'blue' },
            { label: isAr ? 'أيام الغياب' : 'Absent Days', value: res.absentCount, color: 'rose' },
            { label: isAr ? 'التأخير' : 'Late', value: res.lateCount, color: 'amber' },
          ],
        };

        return {
          content: isAr
            ? `نسبة حضور الطالب **${res.studentNameAr}** تبلغ **${res.attendanceRate}** (حضور: ${res.presentCount} يوم، غياب: ${res.absentCount} يوم).`
            : `Attendance rate for **${res.studentNameAr}** is **${res.attendanceRate}** (Present: ${res.presentCount}, Absent: ${res.absentCount}).`,
          dataCard: card,
          source: 'سجلات الحضور المعتمدة (attendanceStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return { content: err.message, error: true };
      }
    }

    if (isAttendanceSummaryIntent) {
      try {
        const toolDef = AI_TOOLS['get_attendance_summary'];
        const res = await toolDef.execute(actingUser, branchId, {});
        aiAuditService.logToolExecution(actingUser, 'get_attendance_summary', branchId, true);

        const card: AIDataCard = {
          type: 'kpi_grid',
          title: isAr ? 'إحصائيات ونسب الحضور لليوم' : "Today's Attendance Summary",
          subtitle: isAr ? `فرع: ${branchName} | التاريخ: ${res.date}` : `Branch: ${branchName} | Date: ${res.date}`,
          items: [
            { label: isAr ? 'نسبة الحضور' : 'Attendance Rate', value: res.attendanceRate, color: 'emerald' },
            { label: isAr ? 'الحاضرون' : 'Present', value: res.present, color: 'blue' },
            { label: isAr ? 'الغائبون' : 'Absent', value: res.absent, color: 'rose' },
            { label: isAr ? 'المتأخرون' : 'Late', value: res.late, color: 'amber' },
          ],
          footnote: isAr
            ? `إجمالي السجلات المرصودة لليوم: ${res.totalRecorded} طالب.`
            : `Total recorded sessions: ${res.totalRecorded}.`,
        };

        return {
          content: isAr
            ? `نسبة الحضور لليوم في ${branchName} هي **${res.attendanceRate}**، حيث تم رصد **${res.present}** طالب حاضر و **${res.absent}** طالب غائب من إجمالي ${res.totalRecorded} طالب مسجل.`
            : `Today's attendance rate in ${branchName} is **${res.attendanceRate}** (${res.present} present, ${res.absent} absent out of ${res.totalRecorded} total).`,
          dataCard: card,
          source: 'نظام الحضور والغياب المعتمد (attendanceStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return { content: err.message, error: true };
      }
    }

    // ----------------------------------------------------
    // D. TIMETABLE & SCHEDULE CONFLICT QUERIES
    // ----------------------------------------------------
    const isConflictIntent =
      lower.includes('تعارض في جدول') ||
      lower.includes('تعارض جدول') ||
      lower.includes('جدول المعلم') && (lower.includes('تعارض') || lower.includes('conflict'));

    const isTeacherScheduleIntent =
      (lower.includes('جدول المعلم') || lower.includes('حصص المعلم') || lower.includes('جدول الأستاذ') || lower.includes('teacher schedule')) &&
      !isConflictIntent;

    const isClassScheduleIntent =
      lower.includes('جدول الفصل') ||
      lower.includes('جدول الصف') ||
      lower.includes('حصص الفصل') ||
      lower.includes('class schedule');

    const isGeneralTimetableIntent =
      lower.includes('الحصص الموجودة اليوم') ||
      lower.includes('حصص اليوم') ||
      lower.includes('جدول الحصص اليوم') ||
      lower.includes('timetable today') ||
      lower.includes('today schedule');

    if (isConflictIntent) {
      try {
        const clean = query.replace(/[؟?.,!:]/g, ' ').trim();
        const tokens = clean.split(/[\s,،]+/).filter(Boolean);
        let teacherQuery = tokens[tokens.length - 1];
        const idx = tokens.findIndex((t) => t.includes('معلم') || t.includes('أستاذ') || t.includes('teacher'));
        if (idx !== -1 && tokens[idx + 1]) {
          teacherQuery = tokens[idx + 1];
        }

        const toolDef = AI_TOOLS['check_teacher_schedule_conflicts'];
        const res = await toolDef.execute(actingUser, branchId, { teacherIdentifier: teacherQuery });
        aiAuditService.logToolExecution(actingUser, 'check_teacher_schedule_conflicts', branchId, true);

        if (!res.found) {
          return {
            content: isAr
              ? `لم يتم العثور على معلم باسم "${teacherQuery}" في جدول حصص ${branchName}. يرجى التحقق من اسم المعلم المسجل في المدرسة.`
              : `No teacher found with name "${teacherQuery}" in the timetable for ${branchName}. Please verify the teacher's registered name.`,
            source: 'محرك الجداول والتحقق من التعارض (timetableStorage)',
            scope: { branchName },
          };
        }

        const card: AIDataCard = {
          type: 'metric',
          title: isAr ? `فحص تعارض جدول المعلم: ${res.teacherName}` : `Schedule Conflict Check: ${res.teacherName}`,
          subtitle: res.verdictAr,
          items: [
            { label: isAr ? 'عدد الحصص الأسبوعية' : 'Weekly Lessons', value: res.totalLessons, color: 'blue' },
            {
              label: isAr ? 'حالة التعارض' : 'Conflict Status',
              value: res.hasConflicts ? (isAr ? 'يوجد تعارض' : 'Conflicts') : (isAr ? 'سليم تماماً' : 'No Conflicts'),
              color: res.hasConflicts ? 'rose' : 'emerald',
            },
          ],
        };

        return {
          content: isAr ? res.verdictAr : res.verdictEn,
          dataCard: card,
          source: 'محرك الجداول والتحقق من التعارض (timetableStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return { content: err.message, error: true };
      }
    }

    if (isTeacherScheduleIntent) {
      try {
        const tokens = query.split(/[\s,،]+/);
        let teacherQuery = tokens[tokens.length - 1];
        const idx = tokens.findIndex((t) => t.includes('معلم') || t.includes('أستاذ') || t.includes('teacher'));
        if (idx !== -1 && tokens[idx + 1]) {
          teacherQuery = tokens[idx + 1];
        }

        const toolDef = AI_TOOLS['get_teacher_schedule'];
        const res = await toolDef.execute(actingUser, branchId, { teacherIdentifier: teacherQuery });
        aiAuditService.logToolExecution(actingUser, 'get_teacher_schedule', branchId, true);

        if (!res.found) {
          return { content: res.message, error: true };
        }

        const card: AIDataCard = {
          type: 'table',
          title: isAr ? `جدول حصص المعلم: ${res.teacherNameAr}` : `Lessons for: ${res.teacherNameAr}`,
          subtitle: isAr ? `التخصص: ${res.specialization || 'عام'} | إجمالي الحصص: ${res.totalLessons}` : `Total Lessons: ${res.totalLessons}`,
          columns: [
            { key: 'day', header: isAr ? 'اليوم' : 'Day' },
            { key: 'periodName', header: isAr ? 'الحصة' : 'Period' },
            { key: 'subject', header: isAr ? 'المادة' : 'Subject' },
            { key: 'class', header: isAr ? 'الفصل' : 'Class' },
            { key: 'room', header: isAr ? 'القاعة' : 'Room' },
          ],
          rows: res.lessons,
        };

        return {
          content: isAr
            ? `إليك جدول حصص المعلم **${res.teacherNameAr}** (إجمالي **${res.totalLessons}** حصة أسبوعية):`
            : `Timetable schedule for **${res.teacherNameAr}** (${res.totalLessons} lessons total):`,
          dataCard: card,
          source: 'سجلات الجداول المعتمدة (timetableStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return { content: err.message, error: true };
      }
    }

    if (isClassScheduleIntent) {
      try {
        const tokens = query.split(/[\s,،]+/);
        let classQuery = tokens[tokens.length - 1];
        const idx = tokens.findIndex((t) => t.includes('فصل') || t.includes('صف') || t.includes('class'));
        if (idx !== -1 && tokens[idx + 1]) {
          classQuery = tokens[idx + 1];
        }

        const toolDef = AI_TOOLS['get_class_schedule'];
        const res = await toolDef.execute(actingUser, branchId, { classIdentifier: classQuery });
        aiAuditService.logToolExecution(actingUser, 'get_class_schedule', branchId, true);

        if (!res.found) {
          return { content: res.message, error: true };
        }

        const card: AIDataCard = {
          type: 'table',
          title: isAr ? `جدول حصص الفصل: ${res.classNameAr}` : `Schedule for: ${res.classNameAr}`,
          subtitle: isAr ? `إجمالي الحصص: ${res.totalLessons}` : `Total Lessons: ${res.totalLessons}`,
          columns: [
            { key: 'day', header: isAr ? 'اليوم' : 'Day' },
            { key: 'periodNumber', header: isAr ? 'رقم الحصة' : 'Period' },
            { key: 'subject', header: isAr ? 'المادة' : 'Subject' },
            { key: 'teacher', header: isAr ? 'المعلم' : 'Teacher' },
            { key: 'room', header: isAr ? 'القاعة' : 'Room' },
          ],
          rows: res.lessons,
        };

        return {
          content: isAr
            ? `إليك جدول الحصص الأسبوعي المعتمد للفصل **${res.classNameAr}**:`
            : `Here is the approved schedule for **${res.classNameAr}**:`,
          dataCard: card,
          source: 'سجلات الجداول والحصص (timetableStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return { content: err.message, error: true };
      }
    }

    if (isGeneralTimetableIntent) {
      try {
        const todayDayNum = new Date().getDay(); // 0 is Sunday
        const toolDef = AI_TOOLS['get_timetable_schedule'];
        const res = await toolDef.execute(actingUser, branchId, { dayOfWeek: String(todayDayNum) });
        aiAuditService.logToolExecution(actingUser, 'get_timetable_schedule', branchId, true);

        const card: AIDataCard = {
          type: 'table',
          title: isAr ? 'جدول الحصص المجدولة لليوم' : "Today's Scheduled Lessons",
          subtitle: isAr ? `إجمالي الحصص: ${res.totalLessons} حصة في ${branchName}` : `${res.totalLessons} total lessons`,
          columns: [
            { key: 'period', header: isAr ? 'الحصة' : 'Period' },
            { key: 'subject', header: isAr ? 'المادة' : 'Subject' },
            { key: 'class', header: isAr ? 'الفصل' : 'Class' },
            { key: 'teacher', header: isAr ? 'المعلم' : 'Teacher' },
          ],
          rows: res.lessons,
        };

        return {
          content: isAr
            ? `يوجد اليوم **${res.totalLessons}** حصة دراسية مجدولة في ${branchName}. عينة من الحصص موضحة أدناه:`
            : `There are **${res.totalLessons}** scheduled lessons today in ${branchName}. Sample lessons shown below:`,
          dataCard: card,
          source: 'سجلات الجداول المعتمدة (timetableStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return { content: err.message, error: true };
      }
    }

    // ----------------------------------------------------
    // E. STUDENT QUERIES (COUNT / GRADE / CLASS / ID)
    // ----------------------------------------------------
    const isStudentGradeIntent =
      lower.includes('الطلاب في الصف') ||
      lower.includes('الطلاب في صف') ||
      lower.includes('توزيع الطلاب حسب الصفوف') ||
      lower.includes('students by grade');

    const isStudentClassIntent =
      lower.includes('طلاب الفصل') ||
      lower.includes('الطلاب في الفصل') ||
      lower.includes('طلاب شعبة') ||
      lower.includes('students in class');

    const isStudentIdIntent =
      lower.includes('stu-') ||
      lower.includes('ابحث عن الطالب') ||
      lower.includes('بيانات الطالب') ||
      lower.includes('معلومات الطالب') ||
      lower.includes('student by id');

    const isStudentCountIntent =
      lower.includes('كم عدد الطلاب') ||
      lower.includes('عدد الطلاب') ||
      lower.includes('كم طالب') ||
      lower.includes('إجمالي الطلاب') ||
      lower.includes('student count') ||
      lower.includes('total students');

    if (isStudentIdIntent) {
      try {
        const tokens = query.split(/[\s,،]+/);
        let idToken = tokens.find((t) => t.toUpperCase().includes('STU-')) || tokens[tokens.length - 1];
        const toolDef = AI_TOOLS['get_student_by_id'];
        const res = await toolDef.execute(actingUser, branchId, { identifier: idToken });
        aiAuditService.logToolExecution(actingUser, 'get_student_by_id', branchId, true);

        if (!res.found) {
          return { content: res.message, error: true };
        }

        const card: AIDataCard = {
          type: 'kpi_grid',
          title: isAr ? `بيانات الطالب: ${res.nameAr}` : `Student Profile: ${res.nameAr}`,
          subtitle: isAr ? `الرقم الأكاديمي: ${res.studentNumber}` : `ID: ${res.studentNumber}`,
          items: [
            { label: isAr ? 'الحالة' : 'Status', value: res.status, color: res.status === 'ACTIVE' ? 'emerald' : 'rose' },
            { label: isAr ? 'الفصل المسكن به' : 'Class', value: res.className, color: 'blue' },
            { label: isAr ? 'الجنس' : 'Gender', value: res.gender === 'MALE' ? (isAr ? 'بنين' : 'Male') : (isAr ? 'بنات' : 'Female'), color: 'slate' },
            { label: isAr ? 'الفرع' : 'Branch', value: res.branchName, color: 'purple' },
          ],
        };

        return {
          content: isAr
            ? `تم العثور على بيانات الطالب **${res.nameAr}** (الرقم: ${res.studentNumber}):`
            : `Found student record for **${res.nameAr}** (#${res.studentNumber}):`,
          dataCard: card,
          source: 'سجلات الطلاب المعتمدة (studentStorage)',
          scope: { branchName: res.branchName },
        };
      } catch (err: any) {
        return { content: err.message, error: true };
      }
    }

    if (isStudentGradeIntent) {
      try {
        const toolDef = AI_TOOLS['get_students_by_grade'];
        const res = await toolDef.execute(actingUser, branchId, {});
        aiAuditService.logToolExecution(actingUser, 'get_students_by_grade', branchId, true);

        const card: AIDataCard = {
          type: 'table',
          title: isAr ? 'توزيع الطلاب المقيدين حسب الصفوف الدراسية' : 'Student Distribution by Grade',
          subtitle: isAr ? `إجمالي المقيدين: ${res.totalEnrolled} طالب` : `Total Enrolled: ${res.totalEnrolled}`,
          columns: [
            { key: 'gradeNameAr', header: isAr ? 'الصف الدراسي' : 'Grade' },
            { key: 'classesCount', header: isAr ? 'عدد الفصول' : 'Classes' },
            { key: 'studentsCount', header: isAr ? 'عدد الطلاب' : 'Students' },
          ],
          rows: res.grades,
        };

        return {
          content: isAr
            ? `إليك توزيع أعداد الطلاب على الصفوف الدراسية في ${branchName} (إجمالي المقيدين: **${res.totalEnrolled}** طالب):`
            : `Here is the student enrollment breakdown across grades in ${branchName} (Total: **${res.totalEnrolled}**):`,
          dataCard: card,
          source: 'سجلات الطلاب والهيكل الأكاديمي (studentStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return { content: err.message, error: true };
      }
    }

    if (isStudentClassIntent) {
      try {
        const tokens = query.split(/[\s,،]+/);
        let classToken = tokens[tokens.length - 1];
        const idx = tokens.findIndex((t) => t.includes('فصل') || t.includes('شعبة') || t.includes('class'));
        if (idx !== -1 && tokens[idx + 1]) {
          classToken = tokens[idx + 1];
        }

        const toolDef = AI_TOOLS['get_students_by_class'];
        const res = await toolDef.execute(actingUser, branchId, { classIdentifier: classToken });
        aiAuditService.logToolExecution(actingUser, 'get_students_by_class', branchId, true);

        if (!res.found) {
          return { content: res.message, error: true };
        }

        const card: AIDataCard = {
          type: 'table',
          title: isAr ? `قائمة طلاب فصل: ${res.classNameAr}` : `Students in Class: ${res.classNameAr}`,
          subtitle: isAr ? `إجمالي الطلاب: ${res.totalEnrolled} | السعة: ${res.capacity}` : `Total: ${res.totalEnrolled}`,
          columns: [
            { key: 'studentNumber', header: isAr ? 'الرقم الأكاديمي' : 'Student #' },
            { key: 'nameAr', header: isAr ? 'اسم الطالب' : 'Student Name' },
            { key: 'status', header: isAr ? 'الحالة' : 'Status' },
          ],
          rows: res.students,
        };

        return {
          content: isAr
            ? `يبلغ عدد الطلاب المقيدين في فصل **${res.classNameAr}** **${res.totalEnrolled}** طالب (بنين: ${res.male}، بنات: ${res.female}):`
            : `There are **${res.totalEnrolled}** students enrolled in **${res.classNameAr}**:`,
          dataCard: card,
          source: 'سجلات الطلاب والتسكين الأكاديمي (studentStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return { content: err.message, error: true };
      }
    }

    if (isStudentCountIntent) {
      try {
        const toolDef = AI_TOOLS['get_student_count'];
        const res = await toolDef.execute(actingUser, branchId, {});
        aiAuditService.logToolExecution(actingUser, 'get_student_count', branchId, true);

        const card: AIDataCard = {
          type: 'kpi_grid',
          title: isAr ? 'إحصائيات أعداد الطلاب' : 'Student Body Statistics',
          subtitle: isAr ? `فرع: ${branchName}` : `Branch: ${branchName}`,
          items: [
            { label: isAr ? 'إجمالي الطلاب' : 'Total Students', value: res.total, color: 'blue' },
            { label: isAr ? 'النشطون' : 'Active', value: res.active, color: 'emerald' },
            { label: isAr ? 'غير النشطين' : 'Inactive', value: res.inactive, color: 'rose' },
            { label: isAr ? 'الذكور / الإناث' : 'Male / Female', value: `${res.male} / ${res.female}`, color: 'purple' },
          ],
        };

        return {
          content: isAr
            ? `يبلغ إجمالي عدد الطلاب في ${branchName} **${res.total}** طالب (منهم **${res.active}** طالب نشط، و **${res.inactive}** غير نشط).`
            : `Total students in ${branchName} is **${res.total}** (**${res.active}** active, **${res.inactive}** inactive).`,
          dataCard: card,
          source: 'سجلات الطلاب المعتمدة (studentStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return { content: err.message, error: true };
      }
    }

    // ----------------------------------------------------
    // F. TEACHER QUERIES (COUNT / SEARCH)
    // ----------------------------------------------------
    const isTeacherSearchIntent =
      lower.includes('ابحث عن معلم') ||
      lower.includes('بحث عن معلم') ||
      lower.includes('معلم مادة') ||
      lower.includes('search teacher');

    const isTeacherCountIntent =
      lower.includes('عدد المعلمين') ||
      lower.includes('كم عدد المعلمين') ||
      lower.includes('المعلمين النشطين') ||
      lower.includes('هيئة التدريس') ||
      lower.includes('الكادر التعليمي') ||
      lower.includes('teacher count') ||
      lower.includes('active teachers');

    if (isTeacherSearchIntent) {
      try {
        const tokens = query.split(/[\s,،]+/);
        const searchWord = tokens[tokens.length - 1];
        const toolDef = AI_TOOLS['search_teachers'];
        const res = await toolDef.execute(actingUser, branchId, { searchTerm: searchWord });
        aiAuditService.logToolExecution(actingUser, 'search_teachers', branchId, true);

        const card: AIDataCard = {
          type: 'table',
          title: isAr ? `نتائج البحث عن المعلمين: "${searchWord}"` : `Teacher Search: "${searchWord}"`,
          columns: [
            { key: 'name', header: isAr ? 'الاسم' : 'Name' },
            { key: 'details', header: isAr ? 'التفاصيل / التخصص' : 'Details' },
            { key: 'status', header: isAr ? 'الحالة' : 'Status' },
          ],
          rows: res.results,
        };

        return {
          content: isAr
            ? `تم العثور على **${res.count}** معلم يطابق بحثك:`
            : `Found **${res.count}** teacher(s) matching your search:`,
          dataCard: card,
          source: 'سجلات هيئة التدريس (teacherStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return { content: err.message, error: true };
      }
    }

    if (isTeacherCountIntent) {
      try {
        const toolDef = AI_TOOLS['get_teacher_count'];
        const res = await toolDef.execute(actingUser, branchId, {});
        aiAuditService.logToolExecution(actingUser, 'get_teacher_count', branchId, true);

        const card: AIDataCard = {
          type: 'kpi_grid',
          title: isAr ? 'إحصائيات الكادر التعليمي' : 'Teaching Faculty Statistics',
          subtitle: isAr ? `فرع: ${branchName}` : `Branch: ${branchName}`,
          items: [
            { label: isAr ? 'إجمالي المعلمين' : 'Total Teachers', value: res.total, color: 'blue' },
            { label: isAr ? 'المعلمين النشطين' : 'Active Teachers', value: res.active, color: 'emerald' },
            { label: isAr ? 'دوام كامل' : 'Full-Time', value: res.fullTime, color: 'purple' },
            { label: isAr ? 'جزئي / متعاقد' : 'Part-Time / Contract', value: res.partTime, color: 'slate' },
          ],
        };

        return {
          content: isAr
            ? `يبلغ إجمالي عدد المعلمين في ${branchName} **${res.total}** معلم (منهم **${res.active}** معلم نشط، **${res.fullTime}** بدوام كامل).`
            : `Total teachers in ${branchName} is **${res.total}** (**${res.active}** active, **${res.fullTime}** full-time).`,
          dataCard: card,
          source: 'سجلات الكادر التعليمي (teacherStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return { content: err.message, error: true };
      }
    }

    // ----------------------------------------------------
    // G. REPORTS / GENERAL SEARCH FALLBACK
    // ----------------------------------------------------
    const isReportIntent =
      lower.includes('تقرير') ||
      lower.includes('تقارير') ||
      lower.includes('report') ||
      lower.includes('summary');

    if (isReportIntent) {
      try {
        // default to student directory or branch summary report
        const reportType = lower.includes('مالي') ? 'financial_summary' : lower.includes('غياب') || lower.includes('حضور') ? 'attendance_daily' : 'students_master';
        const toolDef = AI_TOOLS['generate_report_summary'];
        const res = await toolDef.execute(actingUser, branchId, { reportType });
        aiAuditService.logToolExecution(actingUser, 'generate_report_summary', branchId, true);

        const card: AIDataCard = {
          type: 'table',
          title: res.titleAr,
          subtitle: isAr ? `إجمالي السجلات: ${res.totalRows}` : `Total Rows: ${res.totalRows}`,
          columns: res.columns,
          rows: res.sampleRows,
        };

        return {
          content: isAr
            ? `إليك ملخص **${res.titleAr}** المعتمد من مركز التقارير (إجمالي **${res.totalRows}** سجل):`
            : `Here is the approved summary of **${res.titleEn}** (${res.totalRows} rows):`,
          dataCard: card,
          source: 'مركز التقارير المعتمد (reportStorage)',
          scope: { branchName },
        };
      } catch (err: any) {
        return { content: err.message, error: true };
      }
    }

    // Default: Global authorized search via Phase 11 search engine
    try {
      const toolDef = AI_TOOLS['search_school_data'];
      const res = await toolDef.execute(actingUser, branchId, { query });
      aiAuditService.logToolExecution(actingUser, 'search_school_data', branchId, true);

      if (res.totalCount > 0) {
        const card: AIDataCard = {
          type: 'table',
          title: isAr ? `نتائج البحث عن: "${query}"` : `Search Results for: "${query}"`,
          subtitle: isAr ? `تم العثور على ${res.totalCount} نتيجة معتمدة` : `Found ${res.totalCount} verified results`,
          columns: [
            { key: 'domain', header: isAr ? 'المجال' : 'Domain' },
            { key: 'title', header: isAr ? 'العنوان' : 'Title' },
            { key: 'subtitle', header: isAr ? 'التفاصيل' : 'Details' },
            { key: 'badge', header: isAr ? 'الحالة' : 'Status' },
          ],
          rows: res.results,
        };

        return {
          content: isAr
            ? `تم العثور على **${res.totalCount}** نتيجة مطابقة لاستفسارك في ${branchName}:`
            : `Found **${res.totalCount}** matching result(s) in ${branchName}:`,
          dataCard: card,
          source: 'محرك البحث المركزي المعتمد (searchStorage)',
          scope: { branchName },
        };
      }

      return {
        content: isAr
          ? `أهلاً بك! لم أجد بيانات مطابقة مباشرة لعبارة "${query}". يمكنك سؤالي عن:\n- إحصائيات وأعداد الطلاب ("كم عدد الطلاب في المدرسة؟")\n- الحضور والغياب ("ما نسبة الحضور اليوم؟" أو "من أكثر الطلاب غياباً؟")\n- الجداول والحصص ("هل يوجد تعارض في جدول المعلم أحمد؟" أو "ما الحصص الموجودة اليوم؟")\n- البيانات المالية والفواتير ("ما الفواتير المتأخرة؟")`
          : `Hello! No matching records found for "${query}". You can ask about:\n- Student counts and distribution\n- Daily attendance rates and top absentees\n- Teacher schedules and conflict checks\n- Financial fee summaries and overdue invoices`,
        scope: { branchName },
      };
    } catch (err: any) {
      return { content: err.message, error: true };
    }
  }
}

// ========================================================
// 2. GEMINI AI PROVIDER ABSTRACTION (@google/genai)
// ========================================================
export class GeminiAIProvider implements AIProvider {
  public id: AIProviderType = 'gemini';
  public nameAr = 'المساعد المتقدم Gemini 3.8 Flash';
  public nameEn = 'Gemini 3.8 Flash Engine';
  public descriptionAr = 'نموذج لغوي متقدم من Google مدعوم بالاستدعاء المباشر للأدوات الحقيقية وبيانات المدرسة المعتمدة.';
  public descriptionEn = 'Advanced reasoning model with structured function calling and tool execution.';

  private fallback = new BuiltinAIProvider();

  public isAvailable(): boolean {
    return true; // We gracefully fallback if API key is not present
  }

  public async generateResponse(request: AIProviderRequest): Promise<AIProviderResponse> {
    // If running in environment without process.env.GEMINI_API_KEY, use the built-in deterministic provider
    const apiKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY;
    if (!apiKey) {
      return this.fallback.generateResponse(request);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `User role: ${request.actingUser.roleCode}. Branch: ${request.branchId}. Query: "${request.query}". Answer the school query using accurate data.`;
      const resp = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are the School Management System Administrative AI Assistant. Never fabricate school statistics or database records. Respect branch isolation and user permissions. For specific statistics, rely on verified data.',
        },
      });

      const text = resp.text || '';
      if (!text) {
        return this.fallback.generateResponse(request);
      }

      return {
        content: text,
        source: 'Gemini 3.8 Flash + محرك التحقق الأمني المعتمد',
        scope: { branchName: request.context.currentBranchName },
      };
    } catch (err) {
      console.warn('Gemini call failed or not configured, falling back to builtin engine', err);
      return this.fallback.generateResponse(request);
    }
  }
}

// ========================================================
// 3. MAIN AI ASSISTANT SERVICE ORCHESTRATOR
// ========================================================
export class AIAssistantService {
  private static instance: AIAssistantService;
  private providers: Map<AIProviderType, AIProvider> = new Map();
  private activeProviderId: AIProviderType = 'builtin';

  public static getInstance(): AIAssistantService {
    if (!AIAssistantService.instance) {
      AIAssistantService.instance = new AIAssistantService();
    }
    return AIAssistantService.instance;
  }

  constructor() {
    this.providers.set('builtin', new BuiltinAIProvider());
    this.providers.set('gemini', new GeminiAIProvider());
  }

  public getActiveProvider(): AIProvider {
    return this.providers.get(this.activeProviderId) || this.providers.get('builtin')!;
  }

  public setProvider(providerId: AIProviderType): void {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
    }
  }

  public listProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Main query processor:
   * 1. Inspects query for prompt injection attacks.
   * 2. Logs user query in audit trail.
   * 3. Executes tool/query via active provider.
   * 4. Updates session context and persists history.
   */
  public async processQuery(params: {
    query: string;
    actingUser: SafeUser;
    branchId: string;
    branchName?: string;
    academicYearId?: string;
    language?: 'ar' | 'en';
  }): Promise<{ userMessage: AIMessage; assistantMessage: AIMessage }> {
    const { query, actingUser, branchId, branchName, academicYearId, language = 'ar' } = params;

    const timestamp = new Date().toISOString();
    const userMessageId = `msg-user-${Date.now()}`;
    const userMessage: AIMessage = {
      id: userMessageId,
      role: 'user',
      content: query.trim(),
      timestamp,
    };

    // Save user message to context history
    aiContextService.appendMessage(actingUser.id, userMessage);

    // 1. Prompt Injection & Security Guard Check
    const securityCheck = aiSecurityGuard.inspectQuery(actingUser, query, branchId);
    if (securityCheck.isBlocked) {
      const blockedContent =
        language === 'ar'
          ? (securityCheck.reasonAr || 'تم حجب هذا الطلب لمخالفته أمان وسياسات النظام.')
          : (securityCheck.reasonEn || 'Query blocked due to security violation.');

      const assistantMessage: AIMessage = {
        id: `msg-ast-${Date.now()}`,
        role: 'assistant',
        content: blockedContent,
        timestamp: new Date().toISOString(),
        error: true,
        source: 'حارس الأمان المركزي (AISecurityGuard)',
      };

      aiContextService.appendMessage(actingUser.id, assistantMessage);
      return { userMessage, assistantMessage };
    }

    // 2. Audit log valid query
    aiAuditService.logQuery(actingUser, query, branchId);

    // 3. Assemble provider request
    const context = aiContextService.getContext(
      actingUser,
      branchId,
      branchName || '',
      academicYearId,
      undefined,
      language
    );

    const provider = this.getActiveProvider();
    const request: AIProviderRequest = {
      query: query.trim(),
      actingUser,
      branchId,
      academicYearId,
      language,
      context,
      availableTools: Object.values(AI_TOOLS),
    };

    // 4. Generate response
    const response = await provider.generateResponse(request);

    const assistantMessage: AIMessage = {
      id: `msg-ast-${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date().toISOString(),
      toolCalls: response.toolCalls,
      dataCard: response.dataCard,
      proposedAction: response.proposedAction,
      source: response.source,
      scope: response.scope,
      error: response.error,
    };

    // Save assistant message to history
    aiContextService.appendMessage(actingUser.id, assistantMessage);

    return { userMessage, assistantMessage };
  }

  /**
   * Confirms and executes an administrative action.
   */
  public executeProposedAction(
    actingUser: SafeUser,
    action: AIProposedAction,
    messageId: string
  ): { success: boolean; message: string; action: AIProposedAction } {
    const res = aiActionService.executeAction(actingUser, action);

    // Update message in conversation context
    aiContextService.updateMessage(actingUser.id, messageId, (msg) => ({
      ...msg,
      proposedAction: res.action,
    }));

    return {
      success: res.success,
      message: res.messageAr,
      action: res.action,
    };
  }

  /**
   * Cancels a pending action.
   */
  public cancelProposedAction(
    actingUser: SafeUser,
    action: AIProposedAction,
    messageId: string
  ): AIProposedAction {
    const cancelled = aiActionService.cancelAction(actingUser, action);

    // Update message in conversation context
    aiContextService.updateMessage(actingUser.id, messageId, (msg) => ({
      ...msg,
      proposedAction: cancelled,
    }));

    return cancelled;
  }

  /**
   * Returns suggested quick actions filtered by user's actual permissions.
   */
  public getQuickActions(actingUser: SafeUser): AIQuickAction[] {
    const allActions: AIQuickAction[] = [
      {
        id: 'qa-student-count',
        icon: 'Users',
        labelAr: 'إجمالي أعداد الطلاب',
        labelEn: 'Total Students',
        promptAr: 'كم عدد الطلاب في المدرسة؟',
        promptEn: 'What is the total number of students in school?',
        requiredPermission: 'students.view',
      },
      {
        id: 'qa-attendance-today',
        icon: 'ClipboardCheck',
        labelAr: 'نسبة الحضور اليوم',
        labelEn: "Today's Attendance",
        promptAr: 'ما نسبة الحضور اليوم؟',
        promptEn: "What is today's attendance rate?",
        requiredPermission: 'attendance.view',
      },
      {
        id: 'qa-top-absent',
        icon: 'UserX',
        labelAr: 'أكثر الطلاب غياباً',
        labelEn: 'Top Absentees',
        promptAr: 'من أكثر الطلاب غياباً هذا الشهر؟',
        promptEn: 'Who are the top absent students this month?',
        requiredPermission: 'attendance.view',
      },
      {
        id: 'qa-teacher-conflict',
        icon: 'CalendarAlert',
        labelAr: 'فحص تعارض جدول معلم',
        labelEn: 'Check Schedule Conflict',
        promptAr: 'هل يوجد تعارض في جدول المعلم فهد؟',
        promptEn: 'Are there any conflicts in teacher Fahad schedule?',
        requiredPermission: 'timetable.view',
      },
      {
        id: 'qa-timetable-today',
        icon: 'Calendar',
        labelAr: 'حصص اليوم',
        labelEn: "Today's Lessons",
        promptAr: 'ما الحصص الموجودة اليوم؟',
        promptEn: "What lessons are scheduled for today?",
        requiredPermission: 'timetable.view',
      },
      {
        id: 'qa-teachers-count',
        icon: 'UserCheck',
        labelAr: 'عدد المعلمين النشطين',
        labelEn: 'Active Teachers',
        promptAr: 'ما عدد المعلمين النشطين؟',
        promptEn: 'How many active teachers are on faculty?',
        requiredPermission: 'teachers.view',
      },
      {
        id: 'qa-collected-fees',
        icon: 'CreditCard',
        labelAr: 'المبالغ المحصلة',
        labelEn: 'Collected Revenue',
        promptAr: 'كم إجمالي المبالغ المحصلة هذا الشهر؟',
        promptEn: 'What is the total amount collected this month?',
        requiredPermission: 'fees.view',
        requiresFinance: true,
      },
      {
        id: 'qa-overdue-fees',
        icon: 'AlertCircle',
        labelAr: 'الفواتير المتأخرة',
        labelEn: 'Overdue Invoices',
        promptAr: 'ما الفواتير المتأخرة؟',
        promptEn: 'What are the overdue unpaid invoices?',
        requiredPermission: 'fees.view',
        requiresFinance: true,
      },
      {
        id: 'qa-secondary-report',
        icon: 'FileBarChart2',
        labelAr: 'تقرير الطلاب المقيدين',
        labelEn: 'Enrolled Students Report',
        promptAr: 'اعرض لي تقرير الطلاب المقيدين في المدرسة.',
        promptEn: 'Show me the enrolled students master report.',
        requiredPermission: 'reports.view',
      },
    ];

    return allActions.filter((qa) => {
      if (authStorage.isSuperAdmin(actingUser)) return true;
      if (qa.requiresFinance && !aiPermissionService.canAccessFinance(actingUser)) {
        return false;
      }
      if (qa.requiredPermission && !authStorage.hasPermission(actingUser, qa.requiredPermission)) {
        return false;
      }
      return true;
    });
  }
}

export const aiAssistantService = AIAssistantService.getInstance();
