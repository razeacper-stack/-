import { SafeUser, StandardPermissionKey } from '../../types/auth';
import { authStorage } from '../authStorage';

export interface AIPermissionCheckResult {
  isAllowed: boolean;
  reasonAr?: string;
  reasonEn?: string;
  requiredPermission?: string;
}

export class AIPermissionService {
  private static instance: AIPermissionService;

  public static getInstance(): AIPermissionService {
    if (!AIPermissionService.instance) {
      AIPermissionService.instance = new AIPermissionService();
    }
    return AIPermissionService.instance;
  }

  /**
   * Validates if the user is authorized to access the specified branch context.
   */
  public isBranchAuthorized(actingUser: SafeUser, targetBranchId: string): boolean {
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
   * Asserts branch access; throws standard error if unauthorized.
   */
  public assertBranchAccess(actingUser: SafeUser, targetBranchId: string): void {
    if (!this.isBranchAuthorized(actingUser, targetBranchId)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'AI_CROSS_BRANCH_DENIED',
        targetType: 'AI',
        branchContext: targetBranchId,
        result: 'DENIED',
        details: `محاولة وصول غير مصرح بها لفرع آخر عبر المساعد الذكي: ${targetBranchId}`,
      });
      throw new Error(`غير مصرح لك بالوصول إلى بيانات الفرع المحدد (${targetBranchId}).`);
    }
  }

  /**
   * Checks whether the acting user has permission for a specific tool.
   */
  public canAccessTool(
    actingUser: SafeUser,
    toolName: string,
    requiredPermission: StandardPermissionKey | null,
    targetBranchId?: string
  ): AIPermissionCheckResult {
    // 1. Branch check if target branch specified
    if (targetBranchId && !this.isBranchAuthorized(actingUser, targetBranchId)) {
      return {
        isAllowed: false,
        reasonAr: `غير مصرح لك بالوصول إلى بيانات الفرع المطلوب (${targetBranchId}).`,
        reasonEn: `Access to target branch (${targetBranchId}) is not authorized.`,
      };
    }

    // 2. Super admin bypass
    if (authStorage.isSuperAdmin(actingUser)) {
      return { isAllowed: true };
    }

    // 3. No permission required
    if (!requiredPermission) {
      return { isAllowed: true };
    }

    // 4. Validate through centralized authStorage.hasPermission
    const hasPerm = authStorage.hasPermission(actingUser, requiredPermission);
    if (!hasPerm) {
      return {
        isAllowed: false,
        requiredPermission,
        reasonAr: `ليس لديك صلاحية كافية (${requiredPermission}) لتنفيذ هذه العملية.`,
        reasonEn: `Insufficient permissions (${requiredPermission}) to execute this tool.`,
      };
    }

    return { isAllowed: true };
  }

  /**
   * Checks whether the user can access financial data (fees/invoices/payments).
   */
  public canAccessFinance(actingUser: SafeUser, targetBranchId?: string): boolean {
    if (targetBranchId && !this.isBranchAuthorized(actingUser, targetBranchId)) {
      return false;
    }
    if (authStorage.isSuperAdmin(actingUser)) {
      return true;
    }
    return (
      authStorage.hasPermission(actingUser, 'fees.view') ||
      authStorage.hasPermission(actingUser, 'finance.view_reports')
    );
  }

  /**
   * Checks if user has permission to execute a safe administrative action.
   */
  public canExecuteAction(
    actingUser: SafeUser,
    actionType: string,
    targetBranchId: string
  ): AIPermissionCheckResult {
    if (!this.isBranchAuthorized(actingUser, targetBranchId)) {
      return {
        isAllowed: false,
        reasonAr: 'لا يمكنك تنفيذ إجراءات إدارية على فرع غير مصرح لك به.',
        reasonEn: 'You cannot perform administrative actions on an unauthorized branch.',
      };
    }

    if (authStorage.isSuperAdmin(actingUser)) {
      return { isAllowed: true };
    }

    let requiredPerm: StandardPermissionKey = 'students.edit';
    if (actionType === 'update_student_status') {
      requiredPerm = 'students.edit';
    } else if (actionType === 'update_teacher_status') {
      requiredPerm = 'teachers.edit';
    } else if (actionType === 'toggle_class_status') {
      requiredPerm = 'classes.edit';
    }

    const hasPerm = authStorage.hasPermission(actingUser, requiredPerm);
    if (!hasPerm) {
      return {
        isAllowed: false,
        requiredPermission: requiredPerm,
        reasonAr: `يتطلب تنفيذ هذا الإجراء صلاحية (${requiredPerm}).`,
        reasonEn: `Action requires (${requiredPerm}) permission.`,
      };
    }

    return { isAllowed: true };
  }
}

export const aiPermissionService = AIPermissionService.getInstance();
