import {
  AttendanceRecord,
  PopulatedAttendanceRecord,
  AttendanceSession,
  AttendanceStats,
  ClassAttendanceSummary,
  StudentAttendanceRow,
  AttendanceStatus,
  AttendanceType,
  AttendanceSessionStatus,
  AbsenceReasonCode,
  RecordStudentAttendanceDTO,
  SaveClassAttendanceDTO,
  CorrectAttendanceDTO,
  LockAttendanceDTO,
  AttendanceFilterParams,
} from '../types/attendance';
import { SafeUser } from '../types/auth';
import { authStorage } from './authStorage';
import { branchStorage } from './branchStorage';
import { academicStorage } from './academicStorage';
import { studentStorage } from './studentStorage';
import { teacherStorage } from './teacherStorage';
import { timetableStorage } from './timetableStorage';

const ATTENDANCE_RECORDS_STORAGE_KEY = 'sms_attendance_records_v1';
const ATTENDANCE_SESSIONS_STORAGE_KEY = 'sms_attendance_sessions_v1';

// Seeded realistic starter attendance records
const SEEDED_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  // Class 1A Riyadh - Sunday 2026-09-27 Daily & Lesson
  {
    id: 'att-rec-001',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    classId: 'cls-riyadh-1a',
    studentId: 'stu-riyadh-001',
    date: '2026-09-27',
    type: 'DAILY',
    status: 'PRESENT',
    checkInTime: '07:25',
    recordedBy: 'user-super-admin',
    recordedByName: 'المدير العام للنظام',
    createdAt: '2026-09-27T07:30:00.000Z',
    updatedAt: '2026-09-27T07:30:00.000Z',
    lockedAt: '2026-09-27T14:00:00.000Z',
    lockedBy: 'user-super-admin',
    lockedByName: 'المدير العام للنظام',
  },
  {
    id: 'att-rec-002',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    classId: 'cls-riyadh-1a',
    studentId: 'stu-riyadh-002',
    date: '2026-09-27',
    type: 'DAILY',
    status: 'LATE',
    checkInTime: '07:50',
    lateMinutes: 20,
    reasonCode: 'TRANSPORTATION',
    note: 'عطل مفاجئ في الحافلة المدرسية',
    recordedBy: 'user-super-admin',
    recordedByName: 'المدير العام للنظام',
    createdAt: '2026-09-27T07:55:00.000Z',
    updatedAt: '2026-09-27T07:55:00.000Z',
    lockedAt: '2026-09-27T14:00:00.000Z',
    lockedBy: 'user-super-admin',
    lockedByName: 'المدير العام للنظام',
  },
  {
    id: 'att-rec-003',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    classId: 'cls-riyadh-1a',
    studentId: 'stu-riyadh-003',
    date: '2026-09-27',
    type: 'DAILY',
    status: 'EXCUSED',
    reasonCode: 'MEDICAL',
    note: 'مراجعة موعد مستشفى مع إشعار طبي مسبق',
    recordedBy: 'user-super-admin',
    recordedByName: 'المدير العام للنظام',
    createdAt: '2026-09-27T08:00:00.000Z',
    updatedAt: '2026-09-27T08:00:00.000Z',
    lockedAt: '2026-09-27T14:00:00.000Z',
    lockedBy: 'user-super-admin',
    lockedByName: 'المدير العام للنظام',
  },
  // Class 1A Riyadh - Lesson Attendance Period 1 (Math)
  {
    id: 'att-rec-004',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    classId: 'cls-riyadh-1a',
    studentId: 'stu-riyadh-001',
    date: '2026-09-27',
    type: 'LESSON',
    timetableEntryId: 'tme-001',
    periodId: 'prd-r-01',
    status: 'PRESENT',
    checkInTime: '07:30',
    recordedBy: 'user-super-admin',
    recordedByName: 'المدير العام للنظام',
    createdAt: '2026-09-27T07:35:00.000Z',
    updatedAt: '2026-09-27T07:35:00.000Z',
  },
  {
    id: 'att-rec-005',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    classId: 'cls-riyadh-1a',
    studentId: 'stu-riyadh-002',
    date: '2026-09-27',
    type: 'LESSON',
    timetableEntryId: 'tme-001',
    periodId: 'prd-r-01',
    status: 'LATE',
    checkInTime: '07:45',
    lateMinutes: 15,
    reasonCode: 'TRANSPORTATION',
    recordedBy: 'user-super-admin',
    recordedByName: 'المدير العام للنظام',
    createdAt: '2026-09-27T07:46:00.000Z',
    updatedAt: '2026-09-27T07:46:00.000Z',
  },
];

const SEEDED_ATTENDANCE_SESSIONS: AttendanceSession[] = [
  {
    id: 'att-ses-cls-riyadh-1a-2026-09-27-DAILY-daily',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    classId: 'cls-riyadh-1a',
    date: '2026-09-27',
    type: 'DAILY',
    status: 'LOCKED',
    submittedAt: '2026-09-27T08:30:00.000Z',
    submittedBy: 'user-super-admin',
    submittedByName: 'المدير العام للنظام',
    lockedAt: '2026-09-27T14:00:00.000Z',
    lockedBy: 'user-super-admin',
    lockedByName: 'المدير العام للنظام',
    totalStudents: 3,
    presentCount: 1,
    absentCount: 0,
    lateCount: 1,
    excusedCount: 1,
    earlyDepartureCount: 0,
    unrecordedCount: 0,
    createdAt: '2026-09-27T07:30:00.000Z',
    updatedAt: '2026-09-27T14:00:00.000Z',
  },
  {
    id: 'att-ses-cls-riyadh-1a-2026-09-27-LESSON-prd-r-01',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    classId: 'cls-riyadh-1a',
    date: '2026-09-27',
    type: 'LESSON',
    timetableEntryId: 'tme-001',
    periodId: 'prd-r-01',
    status: 'SUBMITTED',
    submittedAt: '2026-09-27T08:15:00.000Z',
    submittedBy: 'user-super-admin',
    submittedByName: 'المدير العام للنظام',
    totalStudents: 3,
    presentCount: 1,
    absentCount: 0,
    lateCount: 1,
    excusedCount: 0,
    earlyDepartureCount: 0,
    unrecordedCount: 1,
    createdAt: '2026-09-27T07:35:00.000Z',
    updatedAt: '2026-09-27T08:15:00.000Z',
  },
];

export class AttendanceStorageService {
  private static instance: AttendanceStorageService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): AttendanceStorageService {
    if (!AttendanceStorageService.instance) {
      AttendanceStorageService.instance = new AttendanceStorageService();
    }
    return AttendanceStorageService.instance;
  }

  public initialize(): void {
    if (this.initialized) return;

    if (!localStorage.getItem(ATTENDANCE_RECORDS_STORAGE_KEY)) {
      localStorage.setItem(ATTENDANCE_RECORDS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(ATTENDANCE_SESSIONS_STORAGE_KEY)) {
      localStorage.setItem(ATTENDANCE_SESSIONS_STORAGE_KEY, JSON.stringify([]));
    }

    this.initialized = true;
  }

  // --- ACCESS & AUTHORIZATION HELPERS ---
  public checkBranchAccess(actingUser: SafeUser, targetBranchId: string): void {
    if (authStorage.isSuperAdmin(actingUser) || actingUser.hasAllBranchesAccess) {
      return;
    }
    if (!actingUser.branchIds || !actingUser.branchIds.includes(targetBranchId)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_BRANCH_ACCESS',
        targetType: 'ATTENDANCE',
        result: 'DENIED',
        details: `Security violation: User "${actingUser.username}" denied cross-branch attendance access to branch "${targetBranchId}"`,
      });
      throw new Error(`غير مصرح لك بالوصول أو تسجيل الحضور في الفرع المحدد (${targetBranchId}).`);
    }
  }

  public checkPermission(actingUser: SafeUser, requiredPermission: any): void {
    if (!authStorage.hasPermission(actingUser, requiredPermission)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'ATTENDANCE_UNAUTHORIZED_ATTEMPT',
        targetType: 'ATTENDANCE',
        result: 'DENIED',
        details: `Security violation: Missing permission "${requiredPermission}" for attendance operation`,
      });
      throw new Error(`ليس لديك الصلاحية الكافية لإتمام هذه العملية (${requiredPermission}).`);
    }
  }

  /**
   * Validates if a Teacher is authorized to record attendance for a class or lesson.
   * If user is SuperAdmin, Admin, Manager, or Staff, branch-level access suffices.
   * If user is a Teacher, they must be assigned to the class or scheduled for the timetable lesson.
   */
  public checkTeacherAttendanceAuthorization(
    actingUser: SafeUser,
    classId: string,
    type: AttendanceType,
    timetableEntryId?: string
  ): void {
    if (authStorage.isSuperAdmin(actingUser)) return;
    if (actingUser.roleCode === 'ADMIN' || actingUser.roleCode === 'MANAGER' || actingUser.roleCode === 'STAFF') {
      return;
    }

    if (actingUser.roleCode === 'TEACHER') {
      // Find teacher profile matching this user
      const teachers = teacherStorage.getRawTeachers();
      const currentTeacher = teachers.find(
        (t) => (t.email && t.email.toLowerCase() === actingUser.email.toLowerCase()) || t.id === actingUser.id
      );

      const teacherClasses = teacherStorage.getRawTeacherClasses();

      if (type === 'LESSON' && timetableEntryId) {
        const timetableEntries = timetableStorage.getRawTimetableEntries();
        const entry = timetableEntries.find((e) => e.id === timetableEntryId);

        if (entry) {
          if (currentTeacher && entry.teacherId === currentTeacher.id) {
            return; // Scheduled teacher
          }
          if (currentTeacher && teacherClasses.some((tc) => tc.teacherId === currentTeacher.id && tc.classId === classId)) {
            return; // Assigned teacher to this class
          }
        }
      } else {
        // Daily attendance: Must be assigned to this class
        if (currentTeacher && teacherClasses.some((tc) => tc.teacherId === currentTeacher.id && tc.classId === classId)) {
          return;
        }
      }

      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'ATTENDANCE_UNAUTHORIZED_ATTEMPT',
        targetType: 'ATTENDANCE',
        targetIdentifier: classId,
        result: 'DENIED',
        details: `Teacher [${actingUser.fullName}] attempted unauthorized attendance recording for class [${classId}]`,
      });
      throw new Error('غير مصرح لك برصد حضور هذا الفصل أو الحصة. يمكنك فقط رصد الحضور للفصول والحصص المسندة إليك.');
    }
  }

  // --- RAW STORAGE ACCESS ---
  public getRawRecords(): AttendanceRecord[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(ATTENDANCE_RECORDS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_ATTENDANCE_RECORDS;
    } catch {
      return SEEDED_ATTENDANCE_RECORDS;
    }
  }

  private saveRecords(records: AttendanceRecord[]): void {
    localStorage.setItem(ATTENDANCE_RECORDS_STORAGE_KEY, JSON.stringify(records));
  }

  public getRawSessions(): AttendanceSession[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(ATTENDANCE_SESSIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_ATTENDANCE_SESSIONS;
    } catch {
      return SEEDED_ATTENDANCE_SESSIONS;
    }
  }

  private saveSessions(sessions: AttendanceSession[]): void {
    localStorage.setItem(ATTENDANCE_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  }

  // Helper to build canonical session ID
  public getSessionId(
    classId: string,
    date: string,
    type: AttendanceType,
    periodId?: string
  ): string {
    const slotKey = type === 'LESSON' && periodId ? periodId : 'daily';
    return `att-ses-${classId}-${date}-${type}-${slotKey}`;
  }

  // Helper to populate record with student and class metadata
  private populateRecord(rec: AttendanceRecord): PopulatedAttendanceRecord {
    const allStudents = studentStorage.getRawStudents();
    const student = allStudents.find((s) => s.id === rec.studentId);

    const allClasses = academicStorage.getRawClasses();
    const cls = allClasses.find((c) => c.id === rec.classId);

    let subjectNameAr: string | undefined;
    let subjectNameEn: string | undefined;
    let periodNameAr: string | undefined;
    let periodNumber: number | undefined;
    let startTime: string | undefined;
    let endTime: string | undefined;

    if (rec.timetableEntryId) {
      const allTimetables = timetableStorage.getRawTimetableEntries();
      const tEntry = allTimetables.find((t) => t.id === rec.timetableEntryId);
      if (tEntry) {
        const allSubjects = academicStorage.getRawSubjects();
        const sbj = allSubjects.find((s) => s.id === tEntry.subjectId);
        subjectNameAr = sbj?.nameAr;
        subjectNameEn = sbj?.nameEn;
      }
    }

    if (rec.periodId) {
      const allPeriods = timetableStorage.getRawPeriods();
      const prd = allPeriods.find((p) => p.id === rec.periodId);
      if (prd) {
        periodNameAr = prd.nameAr;
        periodNumber = prd.periodNumber;
        startTime = prd.startTime;
        endTime = prd.endTime;
      }
    }

    return {
      ...rec,
      studentNameAr: student ? `${student.firstNameAr} ${student.lastNameAr}` : 'طالب غير محدد',
      studentNameEn: student ? `${student.firstNameEn} ${student.lastNameEn}` : 'Unknown Student',
      studentIdNumber: student?.studentNumber || '',
      classNameAr: cls?.nameAr || '',
      classNameEn: cls?.nameEn || '',
      classCode: cls?.classCode || '',
      subjectNameAr,
      subjectNameEn,
      periodNameAr,
      periodNumber,
      startTime,
      endTime,
    };
  }

  // --- BUSINESS OPERATIONS ---

  /**
   * Retrieves class roster with current attendance values for the given date & session.
   * Respects student enrollment at the time/academic year context.
   */
  public getClassRosterWithAttendance(
    actingUser: SafeUser,
    params: {
      branchId: string;
      academicYearId: string;
      classId: string;
      date: string;
      type: AttendanceType;
      timetableEntryId?: string;
      periodId?: string;
    }
  ): {
    students: StudentAttendanceRow[];
    session: AttendanceSession | null;
  } {
    this.checkPermission(actingUser, 'attendance.view');
    this.checkBranchAccess(actingUser, params.branchId);

    // Verify class exists & belongs to branch
    const allClasses = academicStorage.getRawClasses();
    const targetClass = allClasses.find((c) => c.id === params.classId);
    if (!targetClass || targetClass.branchId !== params.branchId) {
      throw new Error('الفصل الدراسي المحدد غير موجود أو لا ينتمي لهذا الفرع.');
    }

    // Verify timetable if lesson
    if (params.type === 'LESSON' && params.timetableEntryId) {
      const allEntries = timetableStorage.getRawTimetableEntries();
      const tEntry = allEntries.find((e) => e.id === params.timetableEntryId);
      if (!tEntry || tEntry.branchId !== params.branchId || tEntry.classId !== params.classId) {
        throw new Error('حصة الجدول المحددة غير متطابقة مع الفصل أو الفرع.');
      }
    }

    // Find enrolled students for this class and academic year
    const allEnrollments = studentStorage.getRawEnrollments();
    const classEnrollments = allEnrollments.filter(
      (e) =>
        e.classId === params.classId &&
        e.academicYearId === params.academicYearId &&
        (e.status === 'ENROLLED' || e.status === 'PROMOTED')
    );

    const allStudents = studentStorage.getRawStudents().filter((s) => s.branchId === params.branchId);

    // Get current attendance records for this session
    const records = this.getRawRecords().filter(
      (r) =>
        r.branchId === params.branchId &&
        r.academicYearId === params.academicYearId &&
        r.classId === params.classId &&
        r.date === params.date &&
        r.type === params.type &&
        (params.type === 'LESSON' ? r.periodId === params.periodId : true)
    );

    const sessionId = this.getSessionId(params.classId, params.date, params.type, params.periodId);
    const session = this.getRawSessions().find((s) => s.id === sessionId) || null;

    const rows: StudentAttendanceRow[] = [];

    for (const enr of classEnrollments) {
      const student = allStudents.find((s) => s.id === enr.studentId);
      if (!student) continue;

      const record = records.find((r) => r.studentId === student.id);
      const populated = record ? this.populateRecord(record) : undefined;

      rows.push({
        studentId: student.id,
        studentIdNumber: student.studentNumber,
        fullNameAr: `${student.firstNameAr} ${student.lastNameAr}`,
        fullNameEn: `${student.firstNameEn} ${student.lastNameEn}`,
        currentClassId: params.classId,
        attendanceRecord: populated,
        status: record ? record.status : 'NOT_RECORDED',
        checkInTime: record?.checkInTime,
        checkOutTime: record?.checkOutTime,
        lateMinutes: record?.lateMinutes,
        reasonCode: record?.reasonCode,
        note: record?.note,
      });
    }

    // Sort alphabetically by Arabic name
    rows.sort((a, b) => a.fullNameAr.localeCompare(b.fullNameAr, 'ar'));

    return { students: rows, session };
  }

  /**
   * Saves class attendance records atomically with duplicate prevention and session tracking.
   */
  public saveClassAttendance(
    actingUser: SafeUser,
    dto: SaveClassAttendanceDTO
  ): { savedCount: number; session: AttendanceSession } {
    this.checkPermission(actingUser, 'attendance.create');
    this.checkBranchAccess(actingUser, dto.branchId);
    this.checkTeacherAttendanceAuthorization(actingUser, dto.classId, dto.type, dto.timetableEntryId);

    // Verify class
    const allClasses = academicStorage.getRawClasses();
    const targetClass = allClasses.find((c) => c.id === dto.classId);
    if (!targetClass || targetClass.branchId !== dto.branchId) {
      throw new Error('الفصل الدراسي غير موجود أو لا ينتمي للفرع المحدد.');
    }
    if (targetClass.academicYearId !== dto.academicYearId) {
      throw new Error('العام الدراسي المحدد غير متوافق مع العام الدراسي للفصل.');
    }

    // Verify timetable if lesson
    if (dto.type === 'LESSON' && dto.timetableEntryId) {
      const allEntries = timetableStorage.getRawTimetableEntries();
      const tEntry = allEntries.find((e) => e.id === dto.timetableEntryId);
      if (!tEntry || tEntry.branchId !== dto.branchId || tEntry.classId !== dto.classId) {
        throw new Error('حصة الجدول المحددة غير متطابقة مع الفصل أو الفرع.');
      }
    }

    // Check existing session lock status
    const sessionId = this.getSessionId(dto.classId, dto.date, dto.type, dto.periodId);
    const sessions = this.getRawSessions();
    const existingSession = sessions.find((s) => s.id === sessionId);

    if (existingSession && existingSession.status === 'LOCKED') {
      const canUnlock = authStorage.hasPermission(actingUser, 'attendance.unlock') || authStorage.isSuperAdmin(actingUser);
      if (!canUnlock) {
        throw new Error('سجل الحضور مقفل رسمياً ولا يمكن تعديله. يرجى مراجعة إدارة المدرسة.');
      }
    }

    // Validate enrollments of all students being recorded
    const allEnrollments = studentStorage.getRawEnrollments();
    const allStudents = studentStorage.getRawStudents();

    for (const item of dto.records) {
      const student = allStudents.find((s) => s.id === item.studentId);
      if (!student) {
        throw new Error(`سجل الطالب [${item.studentId}] غير موجود بالنظام.`);
      }
      if (student.branchId !== dto.branchId) {
        authStorage.logAudit({
          actorId: actingUser.id,
          actorName: actingUser.fullName,
          actorRole: actingUser.roleCode,
          action: 'ATTENDANCE_CONFLICT_REJECTED',
          targetType: 'ATTENDANCE',
          result: 'DENIED',
          details: `Cross-branch error: Student [${student.studentNumber}] from branch [${student.branchId}] cannot be recorded in branch [${dto.branchId}]`,
        });
        throw new Error(`أمان النظام: الطالب (${student.firstNameAr}) يتبع فرعاً آخر ولا يمكن رصد حضوره في هذا الفرع.`);
      }

      const isEnrolled = allEnrollments.some(
        (e) =>
          e.studentId === item.studentId &&
          e.classId === dto.classId &&
          e.academicYearId === dto.academicYearId
      );
      if (!isEnrolled) {
        throw new Error(`الطالب (${student.firstNameAr}) غير مقيد في هذا الفصل خلال العام الدراسي المحدد.`);
      }
    }

    let records = this.getRawRecords();
    const now = new Date().toISOString();
    let savedCount = 0;

    for (const item of dto.records) {
      // Find existing record by unique criteria (Student + Date + Class + Type + Period)
      const existingIndex = records.findIndex(
        (r) =>
          r.branchId === dto.branchId &&
          r.academicYearId === dto.academicYearId &&
          r.classId === dto.classId &&
          r.studentId === item.studentId &&
          r.date === dto.date &&
          r.type === dto.type &&
          (dto.type === 'LESSON' ? r.periodId === dto.periodId : true)
      );

      // Automatic late minutes calculation if period start time is known
      let calculatedLateMinutes = item.lateMinutes;
      if (item.status === 'LATE' && dto.periodId && item.checkInTime && !calculatedLateMinutes) {
        const prd = timetableStorage.getRawPeriods().find((p) => p.id === dto.periodId);
        if (prd && prd.startTime) {
          const [startH, startM] = prd.startTime.split(':').map(Number);
          const [inH, inM] = item.checkInTime.split(':').map(Number);
          const diff = inH * 60 + inM - (startH * 60 + startM);
          if (diff > 0) calculatedLateMinutes = diff;
        }
      }

      if (existingIndex !== -1) {
        // Update existing record
        const oldRec = records[existingIndex];
        records[existingIndex] = {
          ...oldRec,
          status: item.status,
          checkInTime: item.checkInTime || oldRec.checkInTime,
          checkOutTime: item.checkOutTime || oldRec.checkOutTime,
          lateMinutes: calculatedLateMinutes !== undefined ? calculatedLateMinutes : oldRec.lateMinutes,
          reasonCode: item.reasonCode || oldRec.reasonCode,
          note: item.note !== undefined ? item.note : oldRec.note,
          updatedBy: actingUser.id,
          updatedByName: actingUser.fullName,
          updatedAt: now,
        };
        savedCount++;
      } else {
        // Create new record
        const newRecord: AttendanceRecord = {
          id: `att-rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          branchId: dto.branchId,
          academicYearId: dto.academicYearId,
          classId: dto.classId,
          studentId: item.studentId,
          date: dto.date,
          type: dto.type,
          timetableEntryId: dto.timetableEntryId,
          periodId: dto.periodId,
          status: item.status,
          checkInTime: item.checkInTime,
          checkOutTime: item.checkOutTime,
          lateMinutes: calculatedLateMinutes,
          reasonCode: item.reasonCode,
          note: item.note?.trim() || undefined,
          recordedBy: actingUser.id,
          recordedByName: actingUser.fullName,
          createdAt: now,
          updatedAt: now,
        };
        records.push(newRecord);
        savedCount++;
      }
    }

    this.saveRecords(records);

    // Update Session
    const allClassEnrollments = allEnrollments.filter(
      (e) =>
        e.classId === dto.classId &&
        e.academicYearId === dto.academicYearId &&
        (e.status === 'ENROLLED' || e.status === 'PROMOTED')
    );

    const sessionRecords = records.filter(
      (r) =>
        r.branchId === dto.branchId &&
        r.academicYearId === dto.academicYearId &&
        r.classId === dto.classId &&
        r.date === dto.date &&
        r.type === dto.type &&
        (dto.type === 'LESSON' ? r.periodId === dto.periodId : true)
    );

    const presentCount = sessionRecords.filter((r) => r.status === 'PRESENT').length;
    const absentCount = sessionRecords.filter((r) => r.status === 'ABSENT').length;
    const lateCount = sessionRecords.filter((r) => r.status === 'LATE').length;
    const excusedCount = sessionRecords.filter((r) => r.status === 'EXCUSED').length;
    const earlyDepartureCount = sessionRecords.filter((r) => r.status === 'EARLY_DEPARTURE').length;
    const unrecordedCount = Math.max(0, allClassEnrollments.length - sessionRecords.length);

    const sessionStatus: AttendanceSessionStatus = dto.submitAndLock
      ? 'LOCKED'
      : existingSession?.status === 'LOCKED'
      ? 'LOCKED'
      : 'SUBMITTED';

    const sessionObj: AttendanceSession = {
      id: sessionId,
      branchId: dto.branchId,
      academicYearId: dto.academicYearId,
      classId: dto.classId,
      date: dto.date,
      type: dto.type,
      timetableEntryId: dto.timetableEntryId,
      periodId: dto.periodId,
      status: sessionStatus,
      submittedAt: now,
      submittedBy: actingUser.id,
      submittedByName: actingUser.fullName,
      lockedAt: dto.submitAndLock ? now : existingSession?.lockedAt,
      lockedBy: dto.submitAndLock ? actingUser.id : existingSession?.lockedBy,
      lockedByName: dto.submitAndLock ? actingUser.fullName : existingSession?.lockedByName,
      totalStudents: allClassEnrollments.length,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      earlyDepartureCount,
      unrecordedCount,
      createdAt: existingSession ? existingSession.createdAt : now,
      updatedAt: now,
    };

    const sIndex = sessions.findIndex((s) => s.id === sessionId);
    if (sIndex !== -1) {
      sessions[sIndex] = sessionObj;
    } else {
      sessions.push(sessionObj);
    }
    this.saveSessions(sessions);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: dto.submitAndLock ? 'ATTENDANCE_LOCKED' : 'ATTENDANCE_SUBMITTED',
      targetType: 'ATTENDANCE',
      targetIdentifier: sessionId,
      branchContext: dto.branchId,
      result: 'SUCCESS',
      details: `Saved attendance for class [${targetClass.nameAr}] on [${dto.date}] (${savedCount} records)`,
    });

    return { savedCount, session: sessionObj };
  }

  /**
   * Corrects a specific attendance record with mandatory audit history.
   */
  public correctAttendance(
    actingUser: SafeUser,
    recordId: string,
    dto: CorrectAttendanceDTO
  ): PopulatedAttendanceRecord {
    this.checkPermission(actingUser, 'attendance.correct');

    const records = this.getRawRecords();
    const index = records.findIndex((r) => r.id === recordId);
    if (index === -1) {
      throw new Error('سجل الحضور المطلوب تصحيحه غير موجود.');
    }

    const current = records[index];
    this.checkBranchAccess(actingUser, current.branchId);

    if (!dto.correctionReason || !dto.correctionReason.trim()) {
      throw new Error('يرجى ذكر سبب ومبرر تصحيح سجل الحضور.');
    }

    const now = new Date().toISOString();
    const historyItem = {
      timestamp: now,
      previousStatus: current.status,
      newStatus: dto.status,
      previousNote: current.note,
      newNote: dto.note,
      previousReasonCode: current.reasonCode,
      newReasonCode: dto.reasonCode,
      changedBy: actingUser.id,
      changedByName: actingUser.fullName,
      reason: dto.correctionReason.trim(),
    };

    const updated: AttendanceRecord = {
      ...current,
      status: dto.status,
      checkInTime: dto.checkInTime !== undefined ? dto.checkInTime : current.checkInTime,
      checkOutTime: dto.checkOutTime !== undefined ? dto.checkOutTime : current.checkOutTime,
      lateMinutes: dto.lateMinutes !== undefined ? dto.lateMinutes : current.lateMinutes,
      reasonCode: dto.reasonCode !== undefined ? dto.reasonCode : current.reasonCode,
      note: dto.note !== undefined ? dto.note : current.note,
      updatedBy: actingUser.id,
      updatedByName: actingUser.fullName,
      updatedAt: now,
      history: [...(current.history || []), historyItem],
    };

    records[index] = updated;
    this.saveRecords(records);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ATTENDANCE_CORRECTED',
      targetType: 'ATTENDANCE',
      targetIdentifier: current.id,
      branchContext: current.branchId,
      result: 'SUCCESS',
      details: `Corrected attendance for student [${current.studentId}] from [${current.status}] to [${dto.status}]. Reason: ${dto.correctionReason}`,
    });

    return this.populateRecord(updated);
  }

  /**
   * Locks attendance session against unauthorized modifications.
   */
  public lockAttendance(actingUser: SafeUser, dto: LockAttendanceDTO): AttendanceSession {
    this.checkPermission(actingUser, 'attendance.lock');
    this.checkBranchAccess(actingUser, dto.branchId);

    const sessionId = this.getSessionId(dto.classId, dto.date, dto.type, dto.periodId);
    const sessions = this.getRawSessions();
    const index = sessions.findIndex((s) => s.id === sessionId);

    const now = new Date().toISOString();
    let session: AttendanceSession;

    if (index !== -1) {
      sessions[index].status = 'LOCKED';
      sessions[index].lockedAt = now;
      sessions[index].lockedBy = actingUser.id;
      sessions[index].lockedByName = actingUser.fullName;
      sessions[index].updatedAt = now;
      session = sessions[index];
    } else {
      session = {
        id: sessionId,
        branchId: dto.branchId,
        academicYearId: 'ay-riyadh-2026',
        classId: dto.classId,
        date: dto.date,
        type: dto.type,
        periodId: dto.periodId,
        status: 'LOCKED',
        lockedAt: now,
        lockedBy: actingUser.id,
        lockedByName: actingUser.fullName,
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        earlyDepartureCount: 0,
        unrecordedCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      sessions.push(session);
    }

    this.saveSessions(sessions);

    // Lock records inside this session
    const records = this.getRawRecords();
    records.forEach((r) => {
      if (
        r.branchId === dto.branchId &&
        r.classId === dto.classId &&
        r.date === dto.date &&
        r.type === dto.type &&
        (dto.type === 'LESSON' ? r.periodId === dto.periodId : true)
      ) {
        r.lockedAt = now;
        r.lockedBy = actingUser.id;
        r.lockedByName = actingUser.fullName;
      }
    });
    this.saveRecords(records);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ATTENDANCE_LOCKED',
      targetType: 'ATTENDANCE',
      targetIdentifier: sessionId,
      branchContext: dto.branchId,
      result: 'SUCCESS',
      details: `Locked attendance session for class [${dto.classId}] on [${dto.date}]`,
    });

    return session;
  }

  /**
   * Unlocks attendance session for administrative adjustments.
   */
  public unlockAttendance(actingUser: SafeUser, dto: LockAttendanceDTO): AttendanceSession {
    this.checkPermission(actingUser, 'attendance.unlock');
    this.checkBranchAccess(actingUser, dto.branchId);

    const sessionId = this.getSessionId(dto.classId, dto.date, dto.type, dto.periodId);
    const sessions = this.getRawSessions();
    const index = sessions.findIndex((s) => s.id === sessionId);

    if (index === -1) {
      throw new Error('جلسة الحضور المحددة غير موجودة.');
    }

    const now = new Date().toISOString();
    sessions[index].status = 'SUBMITTED';
    sessions[index].lockedAt = undefined;
    sessions[index].lockedBy = undefined;
    sessions[index].lockedByName = undefined;
    sessions[index].updatedAt = now;

    this.saveSessions(sessions);

    // Unlock records
    const records = this.getRawRecords();
    records.forEach((r) => {
      if (
        r.branchId === dto.branchId &&
        r.classId === dto.classId &&
        r.date === dto.date &&
        r.type === dto.type &&
        (dto.type === 'LESSON' ? r.periodId === dto.periodId : true)
      ) {
        r.lockedAt = undefined;
        r.lockedBy = undefined;
        r.lockedByName = undefined;
      }
    });
    this.saveRecords(records);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ATTENDANCE_UNLOCKED',
      targetType: 'ATTENDANCE',
      targetIdentifier: sessionId,
      branchContext: dto.branchId,
      result: 'SUCCESS',
      details: `Unlocked attendance session for class [${dto.classId}] on [${dto.date}]`,
    });

    return sessions[index];
  }

  /**
   * Deletes a specific attendance entry.
   */
  public deleteAttendanceRecord(actingUser: SafeUser, recordId: string): void {
    this.checkPermission(actingUser, 'attendance.delete');

    let records = this.getRawRecords();
    const rec = records.find((r) => r.id === recordId);
    if (!rec) {
      throw new Error('سجل الحضور المراد حذفه غير موجود.');
    }

    this.checkBranchAccess(actingUser, rec.branchId);

    if (rec.lockedAt && !authStorage.isSuperAdmin(actingUser)) {
      throw new Error('لا يمكن حذف سجل حضور مقفل.');
    }

    records = records.filter((r) => r.id !== recordId);
    this.saveRecords(records);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ATTENDANCE_DELETED',
      targetType: 'ATTENDANCE',
      targetIdentifier: recordId,
      branchContext: rec.branchId,
      result: 'SUCCESS',
      details: `Deleted attendance record [${recordId}] for student [${rec.studentId}]`,
    });
  }

  /**
   * Lists attendance records based on filters.
   */
  public listRecords(
    actingUser: SafeUser,
    filters: AttendanceFilterParams
  ): PopulatedAttendanceRecord[] {
    this.checkPermission(actingUser, 'attendance.view');

    let records = this.getRawRecords();

    // 1. Branch Access Filter
    if (filters.branchId && filters.branchId !== 'all') {
      this.checkBranchAccess(actingUser, filters.branchId);
      records = records.filter((r) => r.branchId === filters.branchId);
    } else if (!authStorage.isSuperAdmin(actingUser) && !actingUser.hasAllBranchesAccess) {
      const allowed = actingUser.branchIds || [];
      records = records.filter((r) => allowed.includes(r.branchId));
    }

    if (filters.academicYearId) {
      records = records.filter((r) => r.academicYearId === filters.academicYearId);
    }
    if (filters.classId) {
      records = records.filter((r) => r.classId === filters.classId);
    }
    if (filters.studentId) {
      records = records.filter((r) => r.studentId === filters.studentId);
    }
    if (filters.status && filters.status !== 'all') {
      records = records.filter((r) => r.status === filters.status);
    }
    if (filters.type && filters.type !== 'all') {
      records = records.filter((r) => r.type === filters.type);
    }
    if (filters.date) {
      records = records.filter((r) => r.date === filters.date);
    }
    if (filters.startDate) {
      records = records.filter((r) => r.date >= filters.startDate!);
    }
    if (filters.endDate) {
      records = records.filter((r) => r.date <= filters.endDate!);
    }

    return records.map((r) => this.populateRecord(r));
  }

  /**
   * Computes accurate attendance profile statistics for a student.
   */
  public getStudentAttendanceSummary(
    actingUser: SafeUser,
    studentId: string,
    academicYearId?: string
  ): {
    stats: AttendanceStats;
    records: PopulatedAttendanceRecord[];
  } {
    this.checkPermission(actingUser, 'attendance.view');

    const allStudents = studentStorage.getRawStudents();
    const student = allStudents.find((s) => s.id === studentId);
    if (!student) {
      throw new Error('سجل الطالب غير موجود.');
    }

    this.checkBranchAccess(actingUser, student.branchId);

    let records = this.getRawRecords().filter((r) => r.studentId === studentId);
    if (academicYearId) {
      records = records.filter((r) => r.academicYearId === academicYearId);
    }

    const totalSessions = records.length;
    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const absentCount = records.filter((r) => r.status === 'ABSENT').length;
    const lateCount = records.filter((r) => r.status === 'LATE').length;
    const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;
    const earlyDepartureCount = records.filter((r) => r.status === 'EARLY_DEPARTURE').length;

    // Rate calculations
    const effectiveAttended = presentCount + lateCount + earlyDepartureCount;
    const attendanceRate = totalSessions > 0 ? Math.round((effectiveAttended / totalSessions) * 100) : 100;
    const absenceRate = totalSessions > 0 ? Math.round((absentCount / totalSessions) * 100) : 0;
    const lateRate = totalSessions > 0 ? Math.round((lateCount / totalSessions) * 100) : 0;

    const stats: AttendanceStats = {
      totalSessions,
      totalStudents: 1,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      earlyDepartureCount,
      unrecordedCount: 0,
      attendanceRate,
      absenceRate,
      lateRate,
    };

    const populated = records.map((r) => this.populateRecord(r));
    populated.sort((a, b) => b.date.localeCompare(a.date));

    return { stats, records: populated };
  }

  /**
   * Generates summary metrics across all classes in branch for a given date.
   */
  public getClassAttendanceDashboard(
    actingUser: SafeUser,
    branchId: string,
    date: string
  ): ClassAttendanceSummary[] {
    this.checkPermission(actingUser, 'attendance.view');
    this.checkBranchAccess(actingUser, branchId);

    const allClasses = academicStorage.getRawClasses().filter((c) => c.branchId === branchId && c.status === 'active');
    const allStages = academicStorage.getRawStages();
    const allGrades = academicStorage.getRawGrades();
    const allEnrollments = studentStorage.getRawEnrollments();
    const allRecords = this.getRawRecords().filter((r) => r.branchId === branchId && r.date === date && r.type === 'DAILY');
    const allSessions = this.getRawSessions();

    const result: ClassAttendanceSummary[] = [];

    for (const cls of allClasses) {
      const stage = allStages.find((s) => s.id === cls.stageId);
      const grade = allGrades.find((g) => g.id === cls.gradeId);

      const enrolled = allEnrollments.filter(
        (e) => e.classId === cls.id && (e.status === 'ENROLLED' || e.status === 'PROMOTED')
      );

      const classRecs = allRecords.filter((r) => r.classId === cls.id);
      const sessionId = this.getSessionId(cls.id, date, 'DAILY');
      const session = allSessions.find((s) => s.id === sessionId);

      const presentCount = classRecs.filter((r) => r.status === 'PRESENT').length;
      const absentCount = classRecs.filter((r) => r.status === 'ABSENT').length;
      const lateCount = classRecs.filter((r) => r.status === 'LATE').length;
      const excusedCount = classRecs.filter((r) => r.status === 'EXCUSED').length;
      const earlyDepartureCount = classRecs.filter((r) => r.status === 'EARLY_DEPARTURE').length;
      const unrecordedCount = Math.max(0, enrolled.length - classRecs.length);

      result.push({
        classId: cls.id,
        classNameAr: cls.nameAr,
        classCode: cls.classCode,
        stageNameAr: stage?.nameAr || '',
        gradeNameAr: grade?.nameAr || '',
        totalStudents: enrolled.length,
        recordedCount: classRecs.length,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        earlyDepartureCount,
        unrecordedCount,
        sessionStatus: session?.status || 'OPEN',
        isCompleted: enrolled.length > 0 && classRecs.length >= enrolled.length,
      });
    }

    return result;
  }

  /**
   * Exports attendance data to formatted CSV.
   */
  public exportAttendanceCSV(
    actingUser: SafeUser,
    filters: AttendanceFilterParams
  ): string {
    this.checkPermission(actingUser, 'attendance.export');

    const records = this.listRecords(actingUser, filters);

    const headers = [
      'التاريخ',
      'نوع الحضور',
      'اسم الطالب',
      'الرقم الأكاديمي',
      'الفصل',
      'الحالة',
      'وقت الحضور',
      'دقائق التأخر',
      'سبب العذر',
      'الملاحظات',
      'اسم الراصد',
      'حالة القفل',
    ];

    const STATUS_MAP: Record<AttendanceStatus, string> = {
      PRESENT: 'حاضر',
      ABSENT: 'غائب',
      LATE: 'متأخر',
      EXCUSED: 'غياب بعذر',
      EARLY_DEPARTURE: 'خروج مبكر',
    };

    const REASON_MAP: Record<AbsenceReasonCode, string> = {
      MEDICAL: 'تقرير طبي / مرض',
      FAMILY_EMERGENCY: 'ظرف عائلي طارئ',
      OFFICIAL_PERMISSION: 'إذن رسمي مسبق',
      WEATHER_CONDITION: 'تقلبات جوية',
      TRANSPORTATION: 'عطل مواصلات',
      UNEXCUSED: 'غير مبرر',
      OTHER: 'أخرى',
    };

    const rows = records.map((r) => [
      r.date,
      r.type === 'DAILY' ? 'يومي' : `حصة (${r.periodNameAr || r.periodId || ''})`,
      r.studentNameAr,
      r.studentIdNumber,
      r.classNameAr,
      STATUS_MAP[r.status] || r.status,
      r.checkInTime || '-',
      r.lateMinutes ? `${r.lateMinutes} دقيقة` : '-',
      r.reasonCode ? REASON_MAP[r.reasonCode] || r.reasonCode : '-',
      (r.note || '').replace(/"/g, '""'),
      r.recordedByName || r.recordedBy,
      r.lockedAt ? 'مقفل' : 'مفتوح',
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ATTENDANCE_EXPORTED',
      targetType: 'ATTENDANCE',
      branchContext: filters.branchId,
      result: 'SUCCESS',
      details: `Exported ${records.length} attendance records to CSV`,
    });

    return csvContent;
  }
}

export const attendanceStorage = AttendanceStorageService.getInstance();
