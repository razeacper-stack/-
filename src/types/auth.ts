/**
 * Authentication, User Management, Roles & Permissions Types (Phase 2)
 */

export type StandardPermissionKey =
  | 'dashboard.view'
  | 'branches.view'
  | 'branches.create'
  | 'branches.edit'
  | 'branches.delete'
  | 'academic_years.view'
  | 'academic_years.create'
  | 'academic_years.edit'
  | 'academic_years.delete'
  | 'academic_stages.view'
  | 'academic_stages.create'
  | 'academic_stages.edit'
  | 'academic_stages.delete'
  | 'grades.view'
  | 'grades.create'
  | 'grades.edit'
  | 'grades.delete'
  | 'classes.view'
  | 'classes.create'
  | 'classes.edit'
  | 'classes.delete'
  | 'subjects.view'
  | 'subjects.create'
  | 'subjects.edit'
  | 'subjects.delete'
  | 'grade_subjects.view'
  | 'grade_subjects.create'
  | 'grade_subjects.edit'
  | 'grade_subjects.delete'
  | 'students.view'
  | 'students.create'
  | 'students.edit'
  | 'students.delete'
  | 'teachers.view'
  | 'teachers.create'
  | 'teachers.edit'
  | 'teachers.delete'
  | 'teachers.archive'
  | 'teachers.restore'
  | 'teachers.manage_subjects'
  | 'teachers.manage_classes'
  | 'teachers.view_sensitive_data'
  | 'teachers.export'
  | 'timetable.view'
  | 'timetable.create'
  | 'timetable.edit'
  | 'timetable.delete'
  | 'timetable.publish'
  | 'timetable.manage_periods'
  | 'timetable.manage_rooms'
  | 'timetable.export'
  | 'attendance.view'
  | 'attendance.create'
  | 'attendance.edit'
  | 'attendance.delete'
  | 'attendance.submit'
  | 'attendance.lock'
  | 'attendance.unlock'
  | 'attendance.correct'
  | 'attendance.view_reports'
  | 'attendance.export'
  | 'lessons.view'
  | 'lessons.create'
  | 'lessons.edit'
  | 'lessons.delete'
  | 'fees.view'
  | 'fees.create'
  | 'fees.edit'
  | 'fees.delete'
  | 'reports.view'
  | 'reports.export'
  | 'reports.print'
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'settings.view'
  | 'settings.edit'
  | 'ai_assistant.use';

export interface PermissionDefinition {
  key: StandardPermissionKey;
  module: 'dashboard' | 'branches' | 'academic' | 'students' | 'teachers' | 'timetable' | 'attendance' | 'lessons' | 'fees' | 'reports' | 'users' | 'settings' | 'ai';
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

export interface RoleModel {
  id: string;
  code: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'TEACHER' | 'STAFF' | 'VIEWER' | string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  permissions: StandardPermissionKey[];
  isSystem: boolean; // cannot be deleted if system
  createdAt: string;
}

export interface UserModel {
  id: string;
  fullName: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  roleId: string;
  roleCode: string;
  branchIds: string[]; // multi-branch binding
  hasAllBranchesAccess?: boolean; // true for super admin or unrestricted regional manager
  status: 'active' | 'disabled';
  isProtectedSuperAdmin?: boolean; // Cannot be deleted or demoted
  createdAt: string;
  lastLoginAt?: string;
}

export type SafeUser = Omit<UserModel, 'passwordHash' | 'salt'> & {
  permissions: StandardPermissionKey[];
  roleNameAr: string;
  roleNameEn: string;
};

export interface SessionState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  token?: string;
  expiresAt?: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'USER_CREATED'
    | 'USER_UPDATED'
    | 'USER_DISABLED'
    | 'USER_ENABLED'
    | 'PASSWORD_CHANGED'
    | 'PASSWORD_RESET'
    | 'ROLE_MODIFIED'
    | 'ROLE_CREATED'
    | 'UNAUTHORIZED_ACCESS_ATTEMPT'
    | 'BRANCH_CREATED'
    | 'BRANCH_UPDATED'
    | 'BRANCH_DISABLED'
    | 'BRANCH_ENABLED'
    | 'USER_BRANCH_ASSIGNED'
    | 'USER_BRANCH_REMOVED'
    | 'BRANCH_SWITCHED'
    | 'UNAUTHORIZED_BRANCH_ACCESS'
    | 'SYSTEM_SETTINGS_CHANGED'
    | 'ACADEMIC_YEAR_CREATED'
    | 'ACADEMIC_YEAR_UPDATED'
    | 'ACADEMIC_YEAR_ACTIVATED'
    | 'ACADEMIC_YEAR_CLOSED'
    | 'ACADEMIC_YEAR_ARCHIVED'
    | 'ACADEMIC_STAGE_CREATED'
    | 'ACADEMIC_STAGE_UPDATED'
    | 'ACADEMIC_STAGE_DISABLED'
    | 'ACADEMIC_STAGE_ENABLED'
    | 'GRADE_CREATED'
    | 'GRADE_UPDATED'
    | 'GRADE_DISABLED'
    | 'GRADE_ENABLED'
    | 'CLASS_CREATED'
    | 'CLASS_UPDATED'
    | 'CLASS_DISABLED'
    | 'CLASS_ENABLED'
    | 'SUBJECT_CREATED'
    | 'SUBJECT_UPDATED'
    | 'SUBJECT_DISABLED'
    | 'SUBJECT_ENABLED'
    | 'GRADE_SUBJECT_ASSIGNED'
    | 'GRADE_SUBJECT_REMOVED'
    | 'STUDENT_REGISTERED'
    | 'STUDENT_UPDATED'
    | 'STUDENT_ARCHIVED'
    | 'STUDENT_STATUS_CHANGED'
    | 'STUDENT_ENROLLED'
    | 'STUDENT_TRANSFERRED'
    | 'GUARDIAN_ADDED'
    | 'GUARDIAN_UPDATED'
    | 'GUARDIAN_REMOVED'
    | 'UNAUTHORIZED_STUDENT_ACCESS'
    | 'TEACHER_REGISTERED'
    | 'TEACHER_UPDATED'
    | 'TEACHER_ARCHIVED'
    | 'TEACHER_RESTORED'
    | 'TEACHER_STATUS_CHANGED'
    | 'TEACHER_SUBJECT_ASSIGNED'
    | 'TEACHER_SUBJECT_REMOVED'
    | 'TEACHER_CLASS_ASSIGNED'
    | 'TEACHER_CLASS_REMOVED'
    | 'TEACHER_QUALIFICATION_ADDED'
    | 'TEACHER_QUALIFICATION_UPDATED'
    | 'TEACHER_QUALIFICATION_REMOVED'
    | 'UNAUTHORIZED_TEACHER_ACCESS'
    | 'TIMETABLE_CREATED'
    | 'TIMETABLE_UPDATED'
    | 'TIMETABLE_MOVED'
    | 'TIMETABLE_DELETED'
    | 'TIMETABLE_PUBLISHED'
    | 'TIMETABLE_UNPUBLISHED'
    | 'TIMETABLE_COPIED'
    | 'TIMETABLE_CONFLICT_REJECTED'
    | 'PERIOD_CREATED'
    | 'PERIOD_UPDATED'
    | 'ROOM_CREATED'
    | 'ROOM_UPDATED'
    | 'ATTENDANCE_CREATED'
    | 'ATTENDANCE_UPDATED'
    | 'ATTENDANCE_CORRECTED'
    | 'ATTENDANCE_DELETED'
    | 'ATTENDANCE_SUBMITTED'
    | 'ATTENDANCE_LOCKED'
    | 'ATTENDANCE_UNLOCKED'
    | 'ATTENDANCE_EXPORTED'
    | 'ATTENDANCE_CONFLICT_REJECTED'
    | 'ATTENDANCE_UNAUTHORIZED_ATTEMPT';
  targetType: 'USER' | 'ROLE' | 'SESSION' | 'SYSTEM' | 'BRANCH' | 'ACADEMIC' | 'STUDENT' | 'ENROLLMENT' | 'GUARDIAN' | 'TEACHER' | 'TIMETABLE' | 'PERIOD' | 'ROOM' | 'ATTENDANCE';
  targetId?: string;
  targetIdentifier?: string;
  branchContext?: string;
  result: 'SUCCESS' | 'DENIED' | 'FAILED';
  details: string;
  ipAddress?: string;
}
