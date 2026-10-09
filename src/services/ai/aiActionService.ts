import { SafeUser } from '../../types/auth';
import { AIProposedAction } from '../../types/ai';
import { studentStorage } from '../studentStorage';
import { teacherStorage } from '../teacherStorage';
import { aiPermissionService } from './aiPermissionService';
import { aiAuditService } from './aiAuditService';

export interface ActionExecutionResult {
  success: boolean;
  messageAr: string;
  messageEn: string;
  action: AIProposedAction;
  details?: any;
}

export class AIActionService {
  private static instance: AIActionService;

  public static getInstance(): AIActionService {
    if (!AIActionService.instance) {
      AIActionService.instance = new AIActionService();
    }
    return AIActionService.instance;
  }

  /**
   * Generates a safe proposed action for changing student status.
   */
  public proposeStudentStatusChange(
    actingUser: SafeUser,
    studentId: string,
    targetStatus: 'ACTIVE' | 'INACTIVE',
    reason: string = 'تعديل عبر المساعد الذكي'
  ): AIProposedAction {
    const students = studentStorage.getRawStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      throw new Error(`الطالب ذو المعرف (${studentId}) غير موجود.`);
    }

    aiPermissionService.assertBranchAccess(actingUser, student.branchId);

    const action: AIProposedAction = {
      actionId: `act-stu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'update_student_status',
      title: 'تغيير حالة قيد الطالب',
      description: `تغيير حالة الطالب ${student.fullNameAr || `${student.firstNameAr} ${student.lastNameAr}`} من ${student.status} إلى ${targetStatus}`,
      entityType: 'STUDENT',
      entityId: student.id,
      entityName: student.fullNameAr || `${student.firstNameAr} ${student.lastNameAr}`,
      changes: [
        {
          field: 'status',
          label: 'حالة القيد',
          from: student.status,
          to: targetStatus,
        },
      ],
      requiredPermission: 'students.edit',
      status: 'pending',
      requiresConfirmation: true,
      payload: {
        studentId: student.id,
        newStatus: targetStatus,
        reason,
        branchId: student.branchId,
      },
    };

    aiAuditService.logActionProposed(actingUser, action.type, action.entityName, student.branchId);
    return action;
  }

  /**
   * Generates a safe proposed action for changing teacher employment status.
   */
  public proposeTeacherStatusChange(
    actingUser: SafeUser,
    teacherId: string,
    targetStatus: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'SUSPENDED',
    reason: string = 'تعديل عبر المساعد الذكي'
  ): AIProposedAction {
    const teachers = teacherStorage.getRawTeachers();
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) {
      throw new Error(`المعلم ذو المعرف (${teacherId}) غير موجود.`);
    }

    aiPermissionService.assertBranchAccess(actingUser, teacher.branchId);

    const action: AIProposedAction = {
      actionId: `act-tch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'update_teacher_status',
      title: 'تغيير حالة تعاقد المعلم',
      description: `تغيير حالة المعلم ${teacher.fullNameAr || `${teacher.firstNameAr} ${teacher.lastNameAr}`} من ${teacher.employmentStatus} إلى ${targetStatus}`,
      entityType: 'TEACHER',
      entityId: teacher.id,
      entityName: teacher.fullNameAr || `${teacher.firstNameAr} ${teacher.lastNameAr}`,
      changes: [
        {
          field: 'employmentStatus',
          label: 'حالة التعاقد',
          from: teacher.employmentStatus,
          to: targetStatus,
        },
      ],
      requiredPermission: 'teachers.edit',
      status: 'pending',
      requiresConfirmation: true,
      payload: {
        teacherId: teacher.id,
        newStatus: targetStatus,
        reason,
        branchId: teacher.branchId,
      },
    };

    aiAuditService.logActionProposed(actingUser, action.type, action.entityName, teacher.branchId);
    return action;
  }

  /**
   * Confirms and executes a pending proposed action through existing domain services.
   * RE-VALIDATES PERMISSIONS & BRANCH ISOLATION AT EXECUTION TIME!
   */
  public executeAction(actingUser: SafeUser, action: AIProposedAction): ActionExecutionResult {
    if (action.status !== 'pending') {
      return {
        success: false,
        messageAr: 'هذا الإجراء تم التعامل معه مسبقاً ولا يمكن تنفيذه مرة أخرى.',
        messageEn: 'Action has already been processed.',
        action,
      };
    }

    const branchId = action.payload?.branchId;
    // 1. Re-validate branch isolation
    aiPermissionService.assertBranchAccess(actingUser, branchId);

    // 2. Re-validate permission at the moment of execution
    const permCheck = aiPermissionService.canExecuteAction(actingUser, action.type, branchId);
    if (!permCheck.isAllowed) {
      const rejectedAction: AIProposedAction = {
        ...action,
        status: 'rejected',
      };
      return {
        success: false,
        messageAr: permCheck.reasonAr || 'ليس لديك الصلاحية لتنفيذ هذا الإجراء الإداري.',
        messageEn: permCheck.reasonEn || 'Permission denied.',
        action: rejectedAction,
      };
    }

    try {
      if (action.type === 'update_student_status') {
        const studentId = action.payload.studentId;
        const newStatus = action.payload.newStatus;
        const reason = action.payload.reason || 'بناءً على تأكيد المساعد الذكي';

        const updated = studentStorage.changeStudentStatus(actingUser, studentId, newStatus, reason);

        const executedAction: AIProposedAction = {
          ...action,
          status: 'executed',
        };

        aiAuditService.logActionExecuted(
          actingUser,
          action.type,
          action.entityName,
          branchId,
          `تم تغيير حالة الطالب إلى ${newStatus}`
        );

        return {
          success: true,
          messageAr: `تم تحديث حالة الطالب "${action.entityName}" بنجاح إلى (${newStatus}).`,
          messageEn: `Student status successfully updated to (${newStatus}).`,
          action: executedAction,
          details: updated,
        };
      } else if (action.type === 'update_teacher_status') {
        const teacherId = action.payload.teacherId;
        const newStatus = action.payload.newStatus;
        const reason = action.payload.reason || 'بناءً على تأكيد المساعد الذكي';

        const updated = teacherStorage.changeTeacherStatus(actingUser, teacherId, newStatus, reason);

        const executedAction: AIProposedAction = {
          ...action,
          status: 'executed',
        };

        aiAuditService.logActionExecuted(
          actingUser,
          action.type,
          action.entityName,
          branchId,
          `تم تغيير حالة تعاقد المعلم إلى ${newStatus}`
        );

        return {
          success: true,
          messageAr: `تم تحديث حالة المعلم "${action.entityName}" بنجاح إلى (${newStatus}).`,
          messageEn: `Teacher status successfully updated to (${newStatus}).`,
          action: executedAction,
          details: updated,
        };
      }

      throw new Error(`نوع الإجراء غير مدعوم: ${action.type}`);
    } catch (err: any) {
      const failedAction: AIProposedAction = {
        ...action,
        status: 'rejected',
      };
      return {
        success: false,
        messageAr: `فشل تنفيذ الإجراء: ${err.message || 'خطأ غير متوقع'}`,
        messageEn: `Action execution failed: ${err.message}`,
        action: failedAction,
      };
    }
  }

  /**
   * Cancels a pending proposed action.
   */
  public cancelAction(actingUser: SafeUser, action: AIProposedAction): AIProposedAction {
    const cancelledAction: AIProposedAction = {
      ...action,
      status: 'cancelled',
    };

    aiAuditService.log({
      actingUser,
      action: 'AI_ACTION_CANCELLED',
      branchContext: action.payload?.branchId,
      details: `تم إلغاء الإجراء المقترح (${action.type}) على "${action.entityName}" من قبل المستخدم`,
      result: 'SUCCESS',
    });

    return cancelledAction;
  }
}

export const aiActionService = AIActionService.getInstance();
