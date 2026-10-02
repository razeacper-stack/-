/**
 * Timetable & Scheduling Domain Types (Phase 7)
 * Multi-Branch School Scheduling, Periods, Rooms, Weekly Subject Allocations & Conflict Detection
 */

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday

export type TimetableStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type RoomType =
  | 'CLASSROOM'
  | 'SCIENCE_LAB'
  | 'COMPUTER_LAB'
  | 'ART_ROOM'
  | 'LIBRARY'
  | 'GYM'
  | 'AUDITORIUM'
  | 'PRAYER_HALL'
  | 'OTHER';

export interface TimetablePeriod {
  id: string;
  branchId: string;
  nameAr: string;
  nameEn: string;
  periodNumber: number; // 1, 2, 3...
  startTime: string;    // HH:mm format (e.g. "08:00")
  endTime: string;      // HH:mm format (e.g. "08:45")
  durationMinutes: number;
  isBreak: boolean;     // If true, represents assembly, recess, lunch, or prayer (cannot schedule academic lessons)
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface SchoolRoom {
  id: string;
  branchId: string;
  roomCode: string;     // Unique per branch, e.g. "R-101", "LAB-01"
  nameAr: string;
  nameEn: string;
  capacity: number;
  roomType: RoomType;
  building?: string;
  floor?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface TimetableEntry {
  id: string;
  branchId: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  roomId?: string;
  dayOfWeek: DayOfWeek;
  periodId: string;
  status: TimetableStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface PopulatedTimetableEntry extends TimetableEntry {
  classNameAr: string;
  classNameEn: string;
  classCode: string;
  subjectNameAr: string;
  subjectNameEn: string;
  subjectCode: string;
  teacherNameAr: string;
  teacherNameEn: string;
  teacherNumber: string;
  roomCode?: string;
  roomNameAr?: string;
  roomNameEn?: string;
  periodNameAr: string;
  periodNameEn: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  branchNameAr?: string;
  branchNameEn?: string;
  academicYearNameAr?: string;
}

export type TimetableConflictType =
  | 'TEACHER_CONFLICT'
  | 'CLASS_CONFLICT'
  | 'ROOM_CONFLICT'
  | 'DUPLICATE_LESSON'
  | 'CROSS_BRANCH'
  | 'ACADEMIC_YEAR_MISMATCH'
  | 'TEACHER_INACTIVE'
  | 'CLASS_INACTIVE'
  | 'TEACHER_INELIGIBLE'
  | 'BREAK_PERIOD'
  | 'PERIOD_INACTIVE'
  | 'SUBJECT_LOAD_EXCEEDED';

export interface TimetableConflict {
  type: TimetableConflictType;
  messageAr: string;
  messageEn: string;
  conflictingEntryId?: string;
  details?: Record<string, any>;
}

export interface WeeklySubjectLoad {
  subjectId: string;
  subjectNameAr: string;
  subjectNameEn: string;
  subjectCode: string;
  requiredPeriods: number;  // Configured in GradeSubject.weeklyPeriods
  scheduledPeriods: number; // Actually placed in timetable
  remainingPeriods: number; // required - scheduled
  status: 'NORMAL' | 'COMPLETE' | 'EXCESS';
}

export interface BranchSchoolDaysConfig {
  branchId: string;
  activeDays: DayOfWeek[];
}

export interface CreateTimetableEntryDTO {
  branchId: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  roomId?: string;
  dayOfWeek: DayOfWeek;
  periodId: string;
  status?: TimetableStatus;
  notes?: string;
}

export interface UpdateTimetableEntryDTO {
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  roomId?: string;
  dayOfWeek?: DayOfWeek;
  periodId?: string;
  status?: TimetableStatus;
  notes?: string;
}

export interface MoveTimetableEntryDTO {
  dayOfWeek: DayOfWeek;
  periodId: string;
  roomId?: string;
}

export interface CopyClassTimetableDTO {
  branchId: string;
  academicYearId: string;
  sourceClassId: string;
  targetClassId: string;
  overwriteExisting?: boolean;
}

export interface CreatePeriodDTO {
  branchId: string;
  nameAr: string;
  nameEn: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
  status?: 'active' | 'inactive';
}

export interface UpdatePeriodDTO {
  nameAr?: string;
  nameEn?: string;
  periodNumber?: number;
  startTime?: string;
  endTime?: string;
  isBreak?: boolean;
  status?: 'active' | 'inactive';
}

export interface CreateRoomDTO {
  branchId: string;
  roomCode: string;
  nameAr: string;
  nameEn: string;
  capacity: number;
  roomType: RoomType;
  building?: string;
  floor?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateRoomDTO {
  roomCode?: string;
  nameAr?: string;
  nameEn?: string;
  capacity?: number;
  roomType?: RoomType;
  building?: string;
  floor?: string;
  status?: 'active' | 'inactive';
}

export interface TimetableFilterParams {
  branchId?: string;
  academicYearId?: string;
  classId?: string;
  teacherId?: string;
  roomId?: string;
  dayOfWeek?: DayOfWeek;
  status?: TimetableStatus | 'all';
}
