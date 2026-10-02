/**
 * Teacher Management Types (Phase 6)
 * Multi-Branch Faculty Directory, Qualifications, Subject Assignments & Class Links
 */

export type TeacherGender = 'male' | 'female';
export type TeacherStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'ARCHIVED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY';
export type TeacherClassRole = 'PRIMARY_TEACHER' | 'HOMEROOM_TEACHER' | 'SUBJECT_TEACHER' | 'ASSISTANT_TEACHER';

export interface TeacherQualification {
  id: string;
  teacherId: string;
  degree: string; // e.g. بكالوريوس / ماجستير / دكتوراه / دبلوم
  fieldOfStudy: string; // Specialization / Major
  institution: string; // University / College
  graduationYear: number;
  isHighestDegree: boolean;
  createdAt: string;
}

export interface TeacherSubject {
  id: string;
  teacherId: string;
  subjectId: string;
  branchId: string;
  isPrimarySubject: boolean;
  createdAt: string;
}

export interface TeacherClass {
  id: string;
  teacherId: string;
  classId: string;
  academicYearId: string;
  branchId: string;
  role: TeacherClassRole;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  branchId: string;
  teacherNumber: string; // Unique identifier: TCH-YYYY-XXX
  firstNameAr: string;
  middleNameAr?: string;
  lastNameAr: string;
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  fullNameAr: string;
  fullNameEn: string;
  gender: TeacherGender;
  dateOfBirth?: string; // YYYY-MM-DD
  nationality?: string;
  nationalId?: string; // Protected sensitive identity
  passportNumber?: string; // Protected sensitive identity
  phoneNumber: string;
  alternatePhoneNumber?: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  hireDate?: string; // YYYY-MM-DD
  employmentStatus: TeacherStatus;
  employmentType: EmploymentType;
  specialization: string; // Primary academic domain
  perLessonRate?: number; // Hourly wage if temporary or per-lesson contract
  notes?: string;
  userId?: string; // Optional reference to application login user account (never auto-created)
  archiveReason?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PopulatedTeacherSubject {
  id: string;
  subjectId: string;
  nameAr: string;
  nameEn: string;
  subjectCode: string;
  isPrimarySubject: boolean;
}

export interface PopulatedTeacherClass {
  id: string;
  classId: string;
  classNameAr: string;
  classNameEn: string;
  gradeNameAr: string;
  gradeNameEn: string;
  academicYearNameAr?: string;
  role: TeacherClassRole;
  isCurrent: boolean;
}

export interface TeacherDetail extends Teacher {
  branchNameAr?: string;
  branchNameEn?: string;
  qualifications: TeacherQualification[];
  subjects: PopulatedTeacherSubject[];
  classes: PopulatedTeacherClass[];
}

export interface CreateTeacherDTO {
  branchId: string;
  teacherNumber?: string; // Optional custom; auto-generated if omitted
  firstNameAr: string;
  middleNameAr?: string;
  lastNameAr: string;
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  gender: TeacherGender;
  dateOfBirth?: string;
  nationality?: string;
  nationalId?: string;
  passportNumber?: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  hireDate?: string;
  employmentStatus?: TeacherStatus;
  employmentType: EmploymentType;
  specialization: string;
  perLessonRate?: number;
  notes?: string;
  userId?: string;
  qualifications?: Array<{
    degree: string;
    fieldOfStudy: string;
    institution: string;
    graduationYear: number;
    isHighestDegree?: boolean;
  }>;
  subjectIds?: string[];
  classAssignments?: Array<{
    classId: string;
    academicYearId: string;
    role: TeacherClassRole;
  }>;
}

export interface UpdateTeacherDTO {
  firstNameAr?: string;
  middleNameAr?: string;
  lastNameAr?: string;
  firstNameEn?: string;
  middleNameEn?: string;
  lastNameEn?: string;
  gender?: TeacherGender;
  dateOfBirth?: string;
  nationality?: string;
  nationalId?: string;
  passportNumber?: string;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  hireDate?: string;
  employmentStatus?: TeacherStatus;
  employmentType?: EmploymentType;
  specialization?: string;
  perLessonRate?: number;
  notes?: string;
  userId?: string;
}

export interface TeacherFilterParams {
  search?: string;
  branchId?: string;
  status?: string; // 'all' | TeacherStatus
  employmentType?: string; // 'all' | EmploymentType
  subjectId?: string; // 'all' | specific subject ID
  gender?: string; // 'all' | TeacherGender
  sortBy?: 'fullNameAr' | 'teacherNumber' | 'hireDate' | 'createdAt' | 'specialization';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface TeacherStats {
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
  onLeaveTeachers: number;
  suspendedTeachers: number;
  archivedTeachers: number;
  fullTimeTeachers: number;
  partTimeTeachers: number;
  contractTeachers: number;
  temporaryTeachers: number;
}
