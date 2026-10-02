/**
 * Attendance & Absence Domain Types (Phase 8)
 * Daily Attendance, Lesson/Period Roll Calls, Corrections, Locking & Analytics
 */

export type AttendanceStatus =
  | 'PRESENT'          // حاضر
  | 'ABSENT'           // غائب
  | 'LATE'             // متأخر
  | 'EXCUSED'          // غياب بعذر مقبول
  | 'EARLY_DEPARTURE'; // خروج مبكر بإذن

export type AttendanceType = 'DAILY' | 'LESSON';

export type AttendanceSessionStatus = 'OPEN' | 'SUBMITTED' | 'LOCKED';

export type AbsenceReasonCode =
  | 'MEDICAL'              // عذر مرضي / تقرير طبي
  | 'FAMILY_EMERGENCY'     // ظرف أسري طارئ
  | 'OFFICIAL_PERMISSION'  // استئذان رسمي مسبق
  | 'WEATHER_CONDITION'    // تقلبات جوية / تعليق
  | 'TRANSPORTATION'       // عطل وسيلة النقل
  | 'UNEXCUSED'            // غياب بدون عذر
  | 'OTHER';               // أسباب أخرى

export interface AttendanceCorrectionHistoryItem {
  timestamp: string;
  previousStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  previousNote?: string;
  newNote?: string;
  previousReasonCode?: AbsenceReasonCode;
  newReasonCode?: AbsenceReasonCode;
  changedBy: string;
  changedByName: string;
  reason: string;
}

export interface AttendanceRecord {
  id: string;
  branchId: string;
  academicYearId: string;
  classId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  type: AttendanceType;
  timetableEntryId?: string; // for lesson attendance
  periodId?: string;         // for lesson attendance
  status: AttendanceStatus;
  checkInTime?: string;      // HH:mm
  checkOutTime?: string;     // HH:mm
  lateMinutes?: number;
  reasonCode?: AbsenceReasonCode;
  note?: string;
  recordedBy: string;
  recordedByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
  lockedAt?: string;
  lockedBy?: string;
  lockedByName?: string;
  history?: AttendanceCorrectionHistoryItem[];
}

export interface PopulatedAttendanceRecord extends AttendanceRecord {
  studentNameAr: string;
  studentNameEn: string;
  studentIdNumber: string;
  classNameAr: string;
  classNameEn: string;
  classCode: string;
  subjectNameAr?: string;
  subjectNameEn?: string;
  periodNameAr?: string;
  periodNumber?: number;
  startTime?: string;
  endTime?: string;
}

export interface AttendanceSession {
  id: string; // e.g. "att-ses-{classId}-{date}-{type}-{periodId || 'daily'}"
  branchId: string;
  academicYearId: string;
  classId: string;
  date: string;
  type: AttendanceType;
  timetableEntryId?: string;
  periodId?: string;
  status: AttendanceSessionStatus;
  submittedAt?: string;
  submittedBy?: string;
  submittedByName?: string;
  lockedAt?: string;
  lockedBy?: string;
  lockedByName?: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  earlyDepartureCount: number;
  unrecordedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalSessions: number;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  earlyDepartureCount: number;
  unrecordedCount: number;
  attendanceRate: number; // 0 - 100 %
  absenceRate: number;    // 0 - 100 %
  lateRate: number;       // 0 - 100 %
}

export interface ClassAttendanceSummary {
  classId: string;
  classNameAr: string;
  classCode: string;
  stageNameAr: string;
  gradeNameAr: string;
  totalStudents: number;
  recordedCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  earlyDepartureCount: number;
  unrecordedCount: number;
  sessionStatus: AttendanceSessionStatus;
  isCompleted: boolean;
}

export interface StudentAttendanceRow {
  studentId: string;
  studentIdNumber: string;
  fullNameAr: string;
  fullNameEn: string;
  currentClassId: string;
  attendanceRecord?: PopulatedAttendanceRecord;
  status: AttendanceStatus | 'NOT_RECORDED';
  checkInTime?: string;
  checkOutTime?: string;
  lateMinutes?: number;
  reasonCode?: AbsenceReasonCode;
  note?: string;
}

export interface RecordStudentAttendanceDTO {
  studentId: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  lateMinutes?: number;
  reasonCode?: AbsenceReasonCode;
  note?: string;
}

export interface SaveClassAttendanceDTO {
  branchId: string;
  academicYearId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  type: AttendanceType;
  timetableEntryId?: string;
  periodId?: string;
  records: RecordStudentAttendanceDTO[];
  submitAndLock?: boolean;
}

export interface CorrectAttendanceDTO {
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  lateMinutes?: number;
  reasonCode?: AbsenceReasonCode;
  note?: string;
  correctionReason: string;
}

export interface LockAttendanceDTO {
  branchId: string;
  classId: string;
  date: string;
  type: AttendanceType;
  periodId?: string;
  reason?: string;
}

export interface AttendanceFilterParams {
  branchId?: string;
  academicYearId?: string;
  classId?: string;
  studentId?: string;
  teacherId?: string;
  subjectId?: string;
  periodId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus | 'all';
  type?: AttendanceType | 'all';
}
