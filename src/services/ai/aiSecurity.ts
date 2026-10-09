import { SafeUser } from '../../types/auth';
import { authStorage } from '../authStorage';

export interface SecurityCheckResult {
  isBlocked: boolean;
  reasonAr?: string;
  reasonEn?: string;
  threatType?: string;
}

export class AISecurityGuard {
  private static instance: AISecurityGuard;

  public static getInstance(): AISecurityGuard {
    if (!AISecurityGuard.instance) {
      AISecurityGuard.instance = new AISecurityGuard();
    }
    return AISecurityGuard.instance;
  }

  // Known injection patterns in Arabic and English
  private injectionPatterns: Array<{
    type: string;
    regex: RegExp;
    reasonAr: string;
    reasonEn: string;
  }> = [
    {
      type: 'PROMPT_OVERRIDE',
      regex: /(ignore|forget|disregard|override)\s+(all\s+)?(previous|prior|above|system)\s+(instructions|rules|prompts|directions)/i,
      reasonAr: 'تم رصد محاولة لتجاوز تعليمات وأمان النظام، ولا يمكن تنفيذ هذا الطلب.',
      reasonEn: 'System prompt override attempt detected and blocked.',
    },
    {
      type: 'PROMPT_OVERRIDE_AR',
      regex: /(تجاهل|انس|تخطى|الغ|إلغاء)\s+(كل\s+)?(التعليمات|القواعد|الأوامر|التوجيهات)\s+(السابقة|الأصلية)/i,
      reasonAr: 'تم رصد محاولة لتجاوز تعليمات وأمان النظام، ولا يمكن تنفيذ هذا الطلب.',
      reasonEn: 'System prompt override attempt detected and blocked.',
    },
    {
      type: 'SYSTEM_PROMPT_EXTRACTION',
      regex: /(reveal|show|print|display|tell|expose)\s+(me\s+)?(your\s+)?(all\s+)?(internal\s+|developer\s+|hidden\s+|secret\s+)?(system\s+prompts?|prompts?|instructions?|rules?|secret\s+keys?|developer\s+instructions?)/i,
      reasonAr: 'لا يمكن الكشف عن التعليمات والبرمجيات الداخلية للنظام لأسباب أمنية.',
      reasonEn: 'Internal system prompts and instructions cannot be revealed.',
    },
    {
      type: 'SYSTEM_PROMPT_EXTRACTION_AR',
      regex: /(اكشف|اعرض|اطبع|ما\s+هو|ماهو|أظهر)\s+(البرومبت|التعليمات\s+الداخلية|الأوامر\s+المخفية|المفتاح\s+السري)/i,
      reasonAr: 'لا يمكن الكشف عن التعليمات والبرمجيات الداخلية للنظام لأسباب أمنية.',
      reasonEn: 'Internal system prompts and instructions cannot be revealed.',
    },
    {
      type: 'SECURITY_BYPASS',
      regex: /(disable|bypass|deactivate|turn\s+off)\s+(permissions?|security|auth|branch\s+isolation|checks)/i,
      reasonAr: 'غير مسموح بمحاولة تعطيل صلاحيات أو آليات الأمان للنظام.',
      reasonEn: 'Security and permission bypass attempts are strictly prohibited.',
    },
    {
      type: 'SECURITY_BYPASS_AR',
      regex: /(تعطيل|تجاوز|إيقاف|الغاء)\s+(الصلاحيات|الأمان|الحماية|عزل\s+الفروع)/i,
      reasonAr: 'غير مسموح بمحاولة تعطيل صلاحيات أو آليات الأمان للنظام.',
      reasonEn: 'Security and permission bypass attempts are strictly prohibited.',
    },
    {
      type: 'SQL_INJECTION',
      regex: /(union\s+select|drop\s+table|delete\s+from|insert\s+into|update\s+\w+\s+set|exec\s*\(|;\s*--)/i,
      reasonAr: 'الاستعلامات المباشرة غير مسموح بها. يتم التعامل مع البيانات عبر خدمات آمنة فقط.',
      reasonEn: 'Direct database queries are not permitted.',
    },
    {
      type: 'CREDENTIAL_HARVESTING',
      regex: /(password\s*hash|password\s*hashes|dump\s*passwords|show\s*all\s*passwords|salt|user\s*credentials)/i,
      reasonAr: 'لا يمكن الوصول إلى بيانات الاعتماد وكلمات المرور المشفرة.',
      reasonEn: 'Access to encrypted credentials and security hashes is strictly forbidden.',
    },
    {
      type: 'CREDENTIAL_HARVESTING_AR',
      regex: /(كلمات\s+المرور|بيانات\s+الدخول|تشفير\s+كلمات\s+السر|هاش\s+المرور)/i,
      reasonAr: 'لا يمكن الوصول إلى بيانات الاعتماد وكلمات المرور المشفرة.',
      reasonEn: 'Access to encrypted credentials and security hashes is strictly forbidden.',
    },
  ];

  /**
   * Validate and sanitize incoming user query against prompt injection and security attacks.
   */
  public inspectQuery(actingUser: SafeUser, query: string, branchId: string): SecurityCheckResult {
    const trimmed = (query || '').trim();

    for (const pattern of this.injectionPatterns) {
      if (pattern.regex.test(trimmed)) {
        // Log security audit event in centralized audit storage
        authStorage.logAudit({
          actorId: actingUser.id,
          actorName: actingUser.fullName,
          actorRole: actingUser.roleCode,
          action: 'AI_PROMPT_INJECTION_BLOCKED',
          targetType: 'AI',
          branchContext: branchId,
          result: 'DENIED',
          details: `تم حجب محاولة حقن أوامر (${pattern.type}): "${trimmed.slice(0, 80)}"`,
        });

        return {
          isBlocked: true,
          reasonAr: pattern.reasonAr,
          reasonEn: pattern.reasonEn,
          threatType: pattern.type,
        };
      }
    }

    return { isBlocked: false };
  }
}

export const aiSecurityGuard = AISecurityGuard.getInstance();
