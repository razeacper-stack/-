/**
 * Student Management Types (Phase 5)
 * Multi-Branch Student Roster, Guardians, Academic Enrollments & Lifecycle
 */

export type StudentGender = 'male' | 'female';
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type GuardianRelationship =
  | 'father'
  | 'mother'
  | 'brother'
  | 'sister'
  | 'uncle'
  | 'aunt'
  | 'grandfather'
  | 'grandmother'
  | 'guardian'
  | 'other';

export type EnrollmentStatus =
  | 'ENROLLED'
  | 'PROMOTED'
  | 'TRANSFERRED'
  | 'SUSPENDED'
  | 'WITHDRAWN'
  | 'GRADUATED';

export interface Guardian {
  id: string;
  branchId: string;
  fullName: string;
  relationship: GuardianRelationship | string;
  phoneNumber: string;
  email?: string;
  nationalId?: string;
  address?: string;
  isPrimaryContact: boolean;
  isEmergencyContact: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentGuardianRelation {
  id: string;
  studentId: string;
  guardianId: string;
  relationship: GuardianRelationship | string;
  isPrimaryContact: boolean;
  isEmergencyContact: boolean;
  createdAt: string;
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  branchId: string;
  academicYearId: string;
  stageId: string;
  gradeId: string;
  classId: string;
  enrollmentDate: string; // YYYY-MM-DD
  status: EnrollmentStatus;
  previousClassId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  branchId: string;
  studentNumber: string; // Unique student identifier (e.g. STU-2026-001)
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  lastNameEn: string;
  fullNameAr: string;
  fullNameEn: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: StudentGender;
  nationality: string;
  nationalId?: string;
  passportNumber?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  notes?: string;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface StudentDetail extends Student {
  branchNameAr?: string;
  branchNameEn?: string;
  activeEnrollment?: StudentEnrollment;
  currentYearNameAr?: string;
  currentYearNameEn?: string;
  currentStageNameAr?: string;
  currentStageNameEn?: string;
  currentGradeNameAr?: string;
  currentGradeNameEn?: string;
  currentClassNameAr?: string;
  currentClassNameEn?: string;
  currentClassCode?: string;
  guardians: Array<Guardian & { isPrimaryContact: boolean; isEmergencyContact: boolean; relationId?: string }>;
  primaryGuardian?: Guardian;
  enrollmentHistory?: StudentEnrollment[];
}

export interface StudentFilterParams {
  search?: string;
  branchId?: string;
  academicYearId?: string;
  stageId?: string;
  gradeId?: string;
  classId?: string;
  status?: StudentStatus | 'all';
  gender?: StudentGender | 'all';
  sortBy?: 'name' | 'studentNumber' | 'dateOfBirth' | 'createdAt' | 'status';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface StudentStats {
  branchId?: string;
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  archivedStudents: number;
  maleStudents: number;
  femaleStudents: number;
  enrolledCurrentYear: number;
}

export interface CreateStudentDTO {
  branchId: string;
  studentNumber?: string; // Optional: auto-generated if omitted
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  lastNameEn: string;
  dateOfBirth: string;
  gender: StudentGender;
  nationality: string;
  nationalId?: string;
  passportNumber?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  notes?: string;

  // Initial Enrollment
  academicYearId: string;
  stageId: string;
  gradeId: string;
  classId: string;
  enrollmentDate?: string;

  // Primary Guardian
  guardian: {
    fullName: string;
    relationship: GuardianRelationship | string;
    phoneNumber: string;
    email?: string;
    address?: string;
    isPrimaryContact?: boolean;
    isEmergencyContact?: boolean;
  };

  // Optional Second Guardian
  secondaryGuardian?: {
    fullName: string;
    relationship: GuardianRelationship | string;
    phoneNumber: string;
    email?: string;
    address?: string;
    isEmergencyContact?: boolean;
  };
}

export interface UpdateStudentDTO {
  firstNameAr?: string;
  lastNameAr?: string;
  firstNameEn?: string;
  lastNameEn?: string;
  dateOfBirth?: string;
  gender?: StudentGender;
  nationality?: string;
  nationalId?: string;
  passportNumber?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  notes?: string;
  status?: StudentStatus;
}
