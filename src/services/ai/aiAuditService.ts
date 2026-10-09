import { SafeUser } from '../../types/auth';
import { authStorage } from '../authStorage';

export type AIAuditActionType =
  | 'AI_QUERY_EXECUTED'
  | 'AI_TOOL_CALLED'
  | 'AI_UNAUTHORIZED_REQUEST'
  | 'AI_PROMPT_INJECTION_BLOCKED'
  | 'AI_CROSS_BRANCH_DENIED'
  | 'AI_ACTION_PROPOSED'
  | 'AI_ACTION_CONFIRMED'
  | 'AI_ACTION_CANCELLED'
  | 'AI_ACTION_EXECUTED'
  | 'AI_FINANCIAL_QUERY';

export class AIAuditService {
  private static instance: AIAuditService;

  public static getInstance(): AIAuditService {
    if (!AIAuditService.instance) {
      AIAuditService.instance = new AIAuditService();
    }
    return AIAuditService.instance;
  }

  /**
   * Log an AI-related audit entry directly to central audit storage.
   */
  public log(params: {
    actingUser: SafeUser;
    action: AIAuditActionType;
    branchContext?: string;
    targetIdentifier?: string;
    details: string;
    result?: 'SUCCESS' | 'DENIED' | 'FAILED';
  }): void {
    authStorage.logAudit({
      actorId: params.actingUser.id,
      actorName: params.actingUser.fullName,
      actorRole: params.actingUser.roleCode,
      action: params.action,
      targetType: 'AI',
      targetIdentifier: params.targetIdentifier,
      branchContext: params.branchContext || 'branch-general',
      result: params.result || 'SUCCESS',
      details: params.details,
    });
  }

  public logQuery(actingUser: SafeUser, query: string, branchId: string): void {
    const snippet = query.length > 90 ? `${query.slice(0, 87)}...` : query;
    this.log({
      actingUser,
      action: 'AI_QUERY_EXECUTED',
      branchContext: branchId,
      details: `استفسار المساعد الذكي: "${snippet}"`,
      result: 'SUCCESS',
    });
  }

  public logToolExecution(
    actingUser: SafeUser,
    toolName: string,
    branchId: string,
    success: boolean,
    details?: string
  ): void {
    this.log({
      actingUser,
      action: 'AI_TOOL_CALLED',
      targetIdentifier: toolName,
      branchContext: branchId,
      details: details || `تم استدعاء أداة (${toolName}) بواسطة المساعد الذكي`,
      result: success ? 'SUCCESS' : 'FAILED',
    });
  }

  public logUnauthorized(
    actingUser: SafeUser,
    toolName: string,
    requiredPermission: string,
    branchId: string
  ): void {
    this.log({
      actingUser,
      action: 'AI_UNAUTHORIZED_REQUEST',
      targetIdentifier: toolName,
      branchContext: branchId,
      details: `حجب أداة (${toolName}) لعدم توفر الصلاحية المطلوبة (${requiredPermission})`,
      result: 'DENIED',
    });
  }

  public logActionProposed(
    actingUser: SafeUser,
    actionType: string,
    entityName: string,
    branchId: string
  ): void {
    this.log({
      actingUser,
      action: 'AI_ACTION_PROPOSED',
      targetIdentifier: actionType,
      branchContext: branchId,
      details: `اقتراح إجراء إداري (${actionType}) على الكيان: "${entityName}" بانتظار التأكيد الصريح`,
      result: 'SUCCESS',
    });
  }

  public logActionExecuted(
    actingUser: SafeUser,
    actionType: string,
    entityName: string,
    branchId: string,
    details: string
  ): void {
    this.log({
      actingUser,
      action: 'AI_ACTION_EXECUTED',
      targetIdentifier: actionType,
      branchContext: branchId,
      details: `تم تأكيد وتنفيذ الإجراء الإداري (${actionType}) على "${entityName}": ${details}`,
      result: 'SUCCESS',
    });
  }
}

export const aiAuditService = AIAuditService.getInstance();
