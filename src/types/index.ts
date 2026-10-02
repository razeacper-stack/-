/**
 * Core Domain Entities for School Management System
 * Normalized & extensible across all phases (Multi-Branch, RBAC, Academic, Students, Teachers, Timetables, Attendance, Fees, AI)
 */

export type RoleType = 
  | 'super_admin'
  | 'branch_manager'
  | 'school_manager'
  | 'teacher'
  | 'attendance_staff'
  | 'accountant'
  | 'reception'
  | 'viewer';

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: 'students' | 'teachers' | 'attendance' | 'classes' | 'fees' | 'reports' | 'users' | 'branches' | 'settings' | 'ai_assistant';
}

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  description: string;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  nameAr?: string;
  email: string;
  phone?: string;
  roleId: string;
  role: RoleType;
  branchIds: string[]; // multi-branch support
  active: boolean;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Branch {
  id: string;
  code: string;
  name?: string;
  nameAr: string;
  nameEn: string;
  city?: string;
  address?: string;
  addressAr: string;
  addressEn: string;
  phone: string;
  email: string;
  managerId?: string;
  managerName?: string;
  studentCount?: number;
  teacherCount?: number;
  classCount?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface AcademicStage {
  id: string;
  branchId: string;
  nameAr: string;
  nameEn: string;
  order: number;
}

export interface Grade {
  id: string;
  stageId: string;
  nameAr: string;
  nameEn: string;
  level: number;
}

export interface SchoolClass {
  id: string;
  gradeId: string;
  branchId: string;
  nameAr: string;
  nameEn: string;
  roomNumber?: string;
  capacity: number;
  currentStudents: number;
}

export interface Subject {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  stageId?: string;
  credits?: number;
}

export type FeeStatus = 'paid' | 'partially_paid' | 'unpaid';

export interface Student {
  id: string;
  studentIdNumber: string;
  fullNameAr: string;
  fullNameEn: string;
  birthDate: string;
  gender: 'male' | 'female';
  nationality: string;
  phone?: string;
  parentName: string;
  parentPhone: string;
  parentRelationship: string;
  address: string;
  branchId: string;
  stageId: string;
  gradeId: string;
  classId: string;
  registrationDate: string;
  status: 'active' | 'suspended' | 'graduated' | 'transferred';
  photoUrl?: string;
  notes?: string;
  totalFees: number;
  paidFees: number;
  remainingFees: number;
  feeStatus: FeeStatus;
  attendanceRate?: number;
}

export type TeacherType = 'permanent' | 'temporary';

export interface Teacher {
  id: string;
  teacherCode: string;
  nameAr: string;
  nameEn: string;
  phone: string;
  email: string;
  specialization: string;
  subjects: string[];
  type: TeacherType;
  branchId: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'on_leave';
  // Per-class / temporary fields
  perLessonRate?: number;
  completedLessons?: number;
  totalDue?: number;
  photoUrl?: string;
}

export interface TimetableSlot {
  id: string;
  branchId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  roomNumber?: string;
}

export interface FeePayment {
  id: string;
  receiptNumber: string;
  studentId: string;
  branchId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  collectedBy: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'export';
  module: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

// Re-export Student domain types (Phase 5)
export * from './student';

// Re-export Teacher domain types (Phase 6)
export * from './teacher';

// Re-export Timetable domain types (Phase 7)
export * from './timetable';

// Re-export Attendance domain types (Phase 8)
export * from './attendance';


