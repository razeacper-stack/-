import { SafeUser } from '../types/auth';
import { authStorage } from './authStorage';
import { SEEDED_BRANCHES } from './branchStorage';

export const ALL_DATA_STORAGE_KEYS = [
  'sms_branches_v3',
  'sms_academic_years_v4',
  'sms_academic_stages_v4',
  'sms_academic_grades_v4',
  'sms_academic_classes_v4',
  'sms_academic_subjects_v4',
  'sms_academic_grade_subjects_v4',
  'sms_teachers_v3',
  'sms_teacher_qualifications_v3',
  'sms_teacher_subjects_v3',
  'sms_teacher_classes_v3',
  'sms_students_v5',
  'sms_guardians_v5',
  'sms_student_guardians_v5',
  'sms_enrollments_v5',
  'sms_students_v3',
  'sms_guardians_v3',
  'sms_student_guardians_v3',
  'sms_student_enrollments_v3',
  'sms_timetable_entries_v1',
  'sms_timetable_periods_v1',
  'sms_timetable_rooms_v1',
  'sms_timetable_entries_v3',
  'sms_timetable_periods_v3',
  'sms_timetable_rooms_v3',
  'sms_attendance_records_v1',
  'sms_attendance_sessions_v1',
  'sms_attendance_records_v3',
  'sms_attendance_sessions_v3',
  'school_fee_structures',
  'school_fee_assignments',
  'school_invoices',
  'school_payments',
  'school_refunds',
  'sms_notifications_v2',
  'sms_notifications_v3',
  'sms_notification_reads_v2',
  'sms_notification_prefs_v2',
  'sms_notification_dismissed_v2',
  'sms_activities_v3',
  'sms_active_branch_v3',
];

export class StorageResetService {
  private static instance: StorageResetService;

  private constructor() {}

  public static getInstance(): StorageResetService {
    if (!StorageResetService.instance) {
      StorageResetService.instance = new StorageResetService();
    }
    return StorageResetService.instance;
  }

  /**
   * Initializes the browser environment in clean mode on fresh startup.
   * If the app is launched in browser without clean state established,
   * purges all seeded demo records so user starts completely from scratch with zero data.
   */
  public ensureCleanModeOnFirstRun(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const mode = localStorage.getItem('sms_clean_mode_v5');
      if (mode !== 'true') {
        this.wipeToCleanState();
        localStorage.setItem('sms_clean_mode_v5', 'true');
      }
    } catch (e) {
      console.warn('Error verifying clean storage mode', e);
    }
  }

  /**
   * Directly sets all storage tables to empty arrays.
   * Preserves only the Super Admin account so the user can authenticate.
   */
  public wipeToCleanState(): void {
    if (typeof localStorage === 'undefined') return;

    // Reset all domain collections to empty JSON array
    ALL_DATA_STORAGE_KEYS.forEach((key) => {
      try {
        if (key === 'sms_active_branch_v3') {
          localStorage.setItem(key, 'all');
        } else {
          localStorage.setItem(key, JSON.stringify([]));
        }
      } catch {}
    });

    // Mark system as strictly clean (zero mock data)
    localStorage.setItem('sms_clean_mode', 'true');
    localStorage.setItem('sms_clean_mode_v5', 'true');
    localStorage.setItem('sms_active_branch_v3', 'all');

    // Clean users collection: keep only superadmin root account
    try {
      const rawUsers = localStorage.getItem('sms_users_v3');
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        const rootAdmin = users.find((u: any) => u.username === 'superadmin' || u.roleCode === 'SUPER_ADMIN');
        if (rootAdmin) {
          localStorage.setItem('sms_users_v3', JSON.stringify([rootAdmin]));
        }
      }
    } catch {}
  }

  /**
   * Authorized Purge Action: Callable by Super Admin in the UI.
   */
  public purgeAllData(actingUser: SafeUser): void {
    if (!authStorage.isSuperAdmin(actingUser)) {
      throw new Error('فقط مدير عام النظام (Super Admin) يملك صلاحية تفريغ كافة البيانات للبدء من الصفر.');
    }

    this.wipeToCleanState();

    // Log the irreversible clean slate event in audit log
    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'SYSTEM_SETTINGS_CHANGED',
      targetType: 'SYSTEM',
      result: 'SUCCESS',
      details: `قام المشرف العام (${actingUser.fullName}) بتفريغ ومسح كافة البيانات التجريبية للبدء من الصفر بقاعدة بيانات نظيفة 100%.`,
    });
  }

  /**
   * Check if current storage is completely empty of schools/branches.
   */
  public isDatabaseEmpty(): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      const branchesRaw = localStorage.getItem('sms_branches_v3');
      if (!branchesRaw) return true;
      const branches = JSON.parse(branchesRaw);
      return Array.isArray(branches) && branches.length === 0;
    } catch {
      return true;
    }
  }
}

export const storageResetService = StorageResetService.getInstance();
