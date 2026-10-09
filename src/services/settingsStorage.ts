import { SafeUser } from '../types/auth';
import { authStorage } from './authStorage';
import { financeStorage } from './financeStorage';

export interface GeneralSystemSettings {
  // 1. School Information & Branding
  schoolNameAr: string;
  schoolNameEn: string;
  ministryLicenseNo: string;
  establishedYear: number;
  officialEmail: string;
  officialPhone: string;
  website: string;
  address: string;
  taxRegistrationNumber: string;

  // 2. Academic & Operational Defaults
  activeAcademicYearId: string;
  defaultLanguage: 'ar' | 'en';
  workingDays: string[];
  periodsPerDay: number;

  // 3. Financial Policies
  currency: string;
  taxPercentage: number;
  invoicePrefix: string;
  receiptPrefix: string;
  defaultPaymentDueDays: number;
  allowPartialPayments: boolean;

  // 4. Security & Sessions (RBAC Kernel)
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  enforceStrongPasswords: boolean;
  mfaEnabled: boolean;
  auditRetentionDays: number;

  // 5. System Status & Version
  version: string;
  buildTarget: string;
  lastUpdated: string;
}

const SETTINGS_STORAGE_KEY = 'sms_general_system_settings_v1';

export const DEFAULT_SYSTEM_SETTINGS: GeneralSystemSettings = {
  schoolNameAr: 'مدارس التميز الأهلية النموذجية',
  schoolNameEn: 'Excellence Model Schools',
  ministryLicenseNo: 'MOE-LIC-2024-KSA-9942',
  establishedYear: 2012,
  officialEmail: 'info@excellence-schools.edu.sa',
  officialPhone: '+966 11 456 7890',
  website: 'https://excellence-schools.edu.sa',
  address: 'المملكة العربية السعودية، الرياض، حي النخيل',
  taxRegistrationNumber: '300987654300003',

  activeAcademicYearId: 'ay-riyadh-2026',
  defaultLanguage: 'ar',
  workingDays: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
  periodsPerDay: 7,

  currency: 'SAR',
  taxPercentage: 15,
  invoicePrefix: 'INV',
  receiptPrefix: 'RCP',
  defaultPaymentDueDays: 30,
  allowPartialPayments: true,

  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  enforceStrongPasswords: true,
  mfaEnabled: false,
  auditRetentionDays: 365,

  version: '1.0.0 (Phase 15 Production Release)',
  buildTarget: 'Desktop & Web (Windows / Tauri Ready)',
  lastUpdated: '2026-10-08T00:00:00.000Z',
};

export class SettingsStorageService {
  private static instance: SettingsStorageService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): SettingsStorageService {
    if (!SettingsStorageService.instance) {
      SettingsStorageService.instance = new SettingsStorageService();
    }
    return SettingsStorageService.instance;
  }

  public initialize(): void {
    if (this.initialized) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (!localStorage.getItem(SETTINGS_STORAGE_KEY)) {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SYSTEM_SETTINGS));
        }
      }
    } catch (e) {
      console.warn('Unable to access localStorage for settings', e);
    }
    this.initialized = true;
  }

  public getSettings(): GeneralSystemSettings {
    this.initialize();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return { ...DEFAULT_SYSTEM_SETTINGS, ...parsed };
        }
      }
    } catch {}
    return { ...DEFAULT_SYSTEM_SETTINGS };
  }

  public updateSettings(
    actingUser: SafeUser,
    updates: Partial<GeneralSystemSettings>
  ): GeneralSystemSettings {
    this.initialize();

    // Centralized Authorization check
    if (!authStorage.isSuperAdmin(actingUser) && !authStorage.hasPermission(actingUser, 'settings.edit')) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'SYSTEM_SETTINGS_CHANGED',
        targetType: 'SYSTEM',
        result: 'DENIED',
        details: `محاولة غير مصرح بها لتعديل إعدادات النظام من قبل (${actingUser.fullName})`,
      });
      throw new Error('ليس لديك الصلاحية لتعديل إعدادات النظام العامة (settings.edit).');
    }

    const current = this.getSettings();
    const updated: GeneralSystemSettings = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }

    // Sync financial defaults with financeStorage
    try {
      if (updates.currency || updates.taxRegistrationNumber || updates.defaultPaymentDueDays !== undefined) {
        financeStorage.updateFinanceSettings(actingUser, {
          currency: (updated.currency as any) || undefined,
          taxRegistrationNumber: updated.taxRegistrationNumber,
          defaultPaymentDueDays: updated.defaultPaymentDueDays,
          receiptHeaderAr: updated.schoolNameAr,
          receiptHeaderEn: updated.schoolNameEn,
        });
      }
    } catch {
      // Finance sync optional fallback
    }

    // Immutable Audit Trail
    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'SYSTEM_SETTINGS_CHANGED',
      targetType: 'SYSTEM',
      result: 'SUCCESS',
      details: `تم تحديث إعدادات النظام العامة بنجاح بواسطة ${actingUser.fullName}`,
    });

    return updated;
  }

  public resetToDefaults(actingUser: SafeUser): GeneralSystemSettings {
    if (!authStorage.isSuperAdmin(actingUser)) {
      throw new Error('فقط المشرف العام يحق له استعادة الإعدادات الافتراضية للنظام.');
    }

    const resetSettings: GeneralSystemSettings = {
      ...DEFAULT_SYSTEM_SETTINGS,
      lastUpdated: new Date().toISOString(),
    };

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(resetSettings));
      }
    } catch {}

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'SYSTEM_SETTINGS_CHANGED',
      targetType: 'SYSTEM',
      result: 'SUCCESS',
      details: `تمت استعادة الإعدادات الافتراضية للنظام بواسطة ${actingUser.fullName}`,
    });

    return resetSettings;
  }
}

export const settingsStorage = SettingsStorageService.getInstance();
