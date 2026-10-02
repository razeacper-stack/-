/**
 * Academic Structure Types (Phase 4)
 * Multi-Branch Academic Hierarchy: Branch -> Academic Year -> Academic Stage -> Grade -> Class/Section -> Subjects & GradeSubjects
 */

export type AcademicYearStatus = 'PLANNED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export interface AcademicYear {
  id: string;
  nameAr: string;
  nameEn: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  branchId: string;
  status: AcademicYearStatus;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicStage {
  id: string;
  branchId: string;
  academicYearId?: string;
  nameAr: string;
  nameEn: string;
  description: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  branchId: string;
  stageId: string;
  nameAr: string;
  nameEn: string;
  gradeCode: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ClassSection {
  id: string;
  branchId: string;
  academicYearId: string;
  stageId: string;
  gradeId: string;
  nameAr: string;
  nameEn: string;
  classCode: string;
  capacity: number;
  roomNumber?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  branchId: string;
  nameAr: string;
  nameEn: string;
  subjectCode: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface GradeSubject {
  id: string;
  branchId: string;
  gradeId: string;
  subjectId: string;
  academicYearId?: string;
  weeklyPeriods: number; // Number of periods per week
  creditHours?: number;
  createdAt: string;
}

export interface AcademicBranchStats {
  branchId: string;
  branchName: string;
  yearsCount: number;
  activeYearName?: string;
  stagesCount: number;
  gradesCount: number;
  classesCount: number;
  totalCapacity: number;
  subjectsCount: number;
  gradeSubjectLinksCount: number;
}
