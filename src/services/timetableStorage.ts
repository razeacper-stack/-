import {
  TimetablePeriod,
  SchoolRoom,
  TimetableEntry,
  PopulatedTimetableEntry,
  TimetableConflict,
  WeeklySubjectLoad,
  DayOfWeek,
  CreateTimetableEntryDTO,
  UpdateTimetableEntryDTO,
  MoveTimetableEntryDTO,
  CopyClassTimetableDTO,
  CreatePeriodDTO,
  UpdatePeriodDTO,
  CreateRoomDTO,
  UpdateRoomDTO,
  TimetableFilterParams,
  BranchSchoolDaysConfig,
  TimetableStatus,
} from '../types/timetable';
import { SafeUser } from '../types/auth';
import { authStorage } from './authStorage';
import { branchStorage } from './branchStorage';
import { academicStorage } from './academicStorage';
import { teacherStorage } from './teacherStorage';

const TIMETABLE_ENTRIES_STORAGE_KEY = 'sms_timetable_entries_v1';
const TIMETABLE_PERIODS_STORAGE_KEY = 'sms_timetable_periods_v1';
const TIMETABLE_ROOMS_STORAGE_KEY = 'sms_timetable_rooms_v1';
const TIMETABLE_DAYS_CONFIG_STORAGE_KEY = 'sms_timetable_days_config_v1';

// ====================================================
// SEEDED PERIODS (Per-branch realistic bell schedules)
// ====================================================
const SEEDED_PERIODS: TimetablePeriod[] = [
  // Riyadh Campus Bell Schedule
  {
    id: 'prd-r-01',
    branchId: 'branch-riyadh',
    nameAr: 'الحصة الأولى',
    nameEn: 'Period 1',
    periodNumber: 1,
    startTime: '07:30',
    endTime: '08:15',
    durationMinutes: 45,
    isBreak: false,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'prd-r-02',
    branchId: 'branch-riyadh',
    nameAr: 'الحصة الثانية',
    nameEn: 'Period 2',
    periodNumber: 2,
    startTime: '08:15',
    endTime: '09:00',
    durationMinutes: 45,
    isBreak: false,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'prd-r-brk1',
    branchId: 'branch-riyadh',
    nameAr: 'الفسحة الصباحية الأولى',
    nameEn: 'Morning Recess',
    periodNumber: 3,
    startTime: '09:00',
    endTime: '09:30',
    durationMinutes: 30,
    isBreak: true, // Recess Break - Lessons prohibited
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'prd-r-03',
    branchId: 'branch-riyadh',
    nameAr: 'الحصة الثالثة',
    nameEn: 'Period 3',
    periodNumber: 4,
    startTime: '09:30',
    endTime: '10:15',
    durationMinutes: 45,
    isBreak: false,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'prd-r-04',
    branchId: 'branch-riyadh',
    nameAr: 'الحصة الرابعة',
    nameEn: 'Period 4',
    periodNumber: 5,
    startTime: '10:15',
    endTime: '11:00',
    durationMinutes: 45,
    isBreak: false,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'prd-r-brk2',
    branchId: 'branch-riyadh',
    nameAr: 'استراحة وصلاة الظهر',
    nameEn: 'Dhuhr Prayer & Lunch Break',
    periodNumber: 6,
    startTime: '11:00',
    endTime: '11:30',
    durationMinutes: 30,
    isBreak: true, // Prayer Break - Lessons prohibited
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'prd-r-05',
    branchId: 'branch-riyadh',
    nameAr: 'الحصة الخامسة',
    nameEn: 'Period 5',
    periodNumber: 7,
    startTime: '11:30',
    endTime: '12:15',
    durationMinutes: 45,
    isBreak: false,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'prd-r-06',
    branchId: 'branch-riyadh',
    nameAr: 'الحصة السادسة',
    nameEn: 'Period 6',
    periodNumber: 8,
    startTime: '12:15',
    endTime: '13:00',
    durationMinutes: 45,
    isBreak: false,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'prd-r-07',
    branchId: 'branch-riyadh',
    nameAr: 'الحصة السابعة',
    nameEn: 'Period 7',
    periodNumber: 9,
    startTime: '13:00',
    endTime: '13:45',
    durationMinutes: 45,
    isBreak: false,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },

  // Jeddah Campus Bell Schedule
  {
    id: 'prd-j-01',
    branchId: 'branch-jeddah',
    nameAr: 'الحصة الأولى',
    nameEn: 'Period 1',
    periodNumber: 1,
    startTime: '07:45',
    endTime: '08:30',
    durationMinutes: 45,
    isBreak: false,
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'prd-j-02',
    branchId: 'branch-jeddah',
    nameAr: 'الحصة الثانية',
    nameEn: 'Period 2',
    periodNumber: 2,
    startTime: '08:30',
    endTime: '09:15',
    durationMinutes: 45,
    isBreak: false,
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'prd-j-brk1',
    branchId: 'branch-jeddah',
    nameAr: 'الفسحة الصباحية',
    nameEn: 'Morning Recess',
    periodNumber: 3,
    startTime: '09:15',
    endTime: '09:45',
    durationMinutes: 30,
    isBreak: true,
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'prd-j-03',
    branchId: 'branch-jeddah',
    nameAr: 'الحصة الثالثة',
    nameEn: 'Period 3',
    periodNumber: 4,
    startTime: '09:45',
    endTime: '10:30',
    durationMinutes: 45,
    isBreak: false,
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'prd-j-04',
    branchId: 'branch-jeddah',
    nameAr: 'الحصة الرابعة',
    nameEn: 'Period 4',
    periodNumber: 5,
    startTime: '10:30',
    endTime: '11:15',
    durationMinutes: 45,
    isBreak: false,
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'prd-j-05',
    branchId: 'branch-jeddah',
    nameAr: 'الحصة الخامسة',
    nameEn: 'Period 5',
    periodNumber: 6,
    startTime: '11:15',
    endTime: '12:00',
    durationMinutes: 45,
    isBreak: false,
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },

  // Dammam Campus Bell Schedule
  {
    id: 'prd-d-01',
    branchId: 'branch-dammam',
    nameAr: 'الحصة الأولى',
    nameEn: 'Period 1',
    periodNumber: 1,
    startTime: '07:30',
    endTime: '08:15',
    durationMinutes: 45,
    isBreak: false,
    status: 'active',
    createdAt: '2026-01-14T08:00:00.000Z',
    updatedAt: '2026-01-14T08:00:00.000Z',
  },
  {
    id: 'prd-d-02',
    branchId: 'branch-dammam',
    nameAr: 'الحصة الثانية',
    nameEn: 'Period 2',
    periodNumber: 2,
    startTime: '08:15',
    endTime: '09:00',
    durationMinutes: 45,
    isBreak: false,
    status: 'active',
    createdAt: '2026-01-14T08:00:00.000Z',
    updatedAt: '2026-01-14T08:00:00.000Z',
  },
];

// ====================================================
// SEEDED ROOMS (Classrooms, Labs & Facilities per branch)
// ====================================================
const SEEDED_ROOMS: SchoolRoom[] = [
  // Riyadh Campus Rooms
  {
    id: 'rm-r-101',
    branchId: 'branch-riyadh',
    roomCode: 'R-101',
    nameAr: 'قاعة 101 (الصف الأول - أ)',
    nameEn: 'Classroom 101',
    capacity: 30,
    roomType: 'CLASSROOM',
    building: 'مبنى المرحلة الابتدائية',
    floor: 'الدور الأرضي',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'rm-r-102',
    branchId: 'branch-riyadh',
    roomCode: 'R-102',
    nameAr: 'قاعة 102 (الصف الأول - ب)',
    nameEn: 'Classroom 102',
    capacity: 30,
    roomType: 'CLASSROOM',
    building: 'مبنى المرحلة الابتدائية',
    floor: 'الدور الأرضي',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'rm-r-lab-sci',
    branchId: 'branch-riyadh',
    roomCode: 'LAB-SCI-01',
    nameAr: 'معمل العلوم والفيزياء المتكامل',
    nameEn: 'Science & Physics Laboratory',
    capacity: 28,
    roomType: 'SCIENCE_LAB',
    building: 'المبنى العلمي والتقني',
    floor: 'الدور الأول',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'rm-r-lab-comp',
    branchId: 'branch-riyadh',
    roomCode: 'LAB-COMP-01',
    nameAr: 'معمل الحاسب الآلي والبرمجة',
    nameEn: 'Computer & Coding Lab',
    capacity: 26,
    roomType: 'COMPUTER_LAB',
    building: 'المبنى العلمي والتقني',
    floor: 'الدور الأول',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'rm-r-art',
    branchId: 'branch-riyadh',
    roomCode: 'ART-01',
    nameAr: 'مرسم الفنون التشكيلية والابتكار',
    nameEn: 'Fine Arts Studio',
    capacity: 24,
    roomType: 'ART_ROOM',
    building: 'مبنى الأنشطة الثقافية',
    floor: 'الدور الثاني',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },

  // Jeddah Campus Rooms
  {
    id: 'rm-j-101',
    branchId: 'branch-jeddah',
    roomCode: 'J-101',
    nameAr: 'قاعة 101 - فرع جدة',
    nameEn: 'Jeddah Classroom 101',
    capacity: 30,
    roomType: 'CLASSROOM',
    building: 'المبنى الإداري والأكاديمي',
    floor: 'الدور الأول',
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'rm-j-lab-sci',
    branchId: 'branch-jeddah',
    roomCode: 'J-LAB-SCI',
    nameAr: 'معمل العلوم العامة - جدة',
    nameEn: 'Jeddah Science Lab',
    capacity: 26,
    roomType: 'SCIENCE_LAB',
    building: 'مبنى المعامل',
    floor: 'الدور الأرضي',
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
];

// ====================================================
// SEEDED TIMETABLE ENTRIES (Clean, conflict-free starter schedule)
// ====================================================
const SEEDED_TIMETABLE_ENTRIES: TimetableEntry[] = [
  // Class 1A Riyadh (cls-riyadh-1a), Academic Year (ay-riyadh-2026)
  // Sunday
  {
    id: 'tme-001',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    classId: 'cls-riyadh-1a',
    subjectId: 'sbj-riyadh-math',
    teacherId: 'tch-r-001', // Fahad Al-Mansoor (eligible for math)
    roomId: 'rm-r-101',
    dayOfWeek: 0, // Sunday
    periodId: 'prd-r-01',
    status: 'PUBLISHED',
    notes: 'حصة الرياضيات التمهيدية',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
    createdBy: 'user-super-admin',
  },
  {
    id: 'tme-002',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    classId: 'cls-riyadh-1a',
    subjectId: 'sbj-riyadh-arabic',
    teacherId: 'tch-r-002', // Sara Al-Otaibi (eligible for arabic)
    roomId: 'rm-r-101',
    dayOfWeek: 0, // Sunday
    periodId: 'prd-r-02',
    status: 'PUBLISHED',
    notes: 'القراءة والكتابة',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
    createdBy: 'user-super-admin',
  },
  {
    id: 'tme-003',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    classId: 'cls-riyadh-1a',
    subjectId: 'sbj-riyadh-science',
    teacherId: 'tch-r-003', // Tariq Al-Qahtani (eligible for science)
    roomId: 'rm-r-lab-sci',
    dayOfWeek: 0, // Sunday
    periodId: 'prd-r-03',
    status: 'PUBLISHED',
    notes: 'تطبيق مخبري',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
    createdBy: 'user-super-admin',
  },

  // Monday
  {
    id: 'tme-004',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    classId: 'cls-riyadh-1a',
    subjectId: 'sbj-riyadh-arabic',
    teacherId: 'tch-r-002',
    roomId: 'rm-r-101',
    dayOfWeek: 1, // Monday
    periodId: 'prd-r-01',
    status: 'PUBLISHED',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
    createdBy: 'user-super-admin',
  },
  {
    id: 'tme-005',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    classId: 'cls-riyadh-1a',
    subjectId: 'sbj-riyadh-math',
    teacherId: 'tch-r-001',
    roomId: 'rm-r-101',
    dayOfWeek: 1, // Monday
    periodId: 'prd-r-02',
    status: 'PUBLISHED',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
    createdBy: 'user-super-admin',
  },
];

// Default branch active school days (Sunday to Thursday)
const DEFAULT_BRANCH_DAYS_CONFIG: BranchSchoolDaysConfig[] = [
  {
    branchId: 'branch-riyadh',
    activeDays: [0, 1, 2, 3, 4], // Sun, Mon, Tue, Wed, Thu
  },
  {
    branchId: 'branch-jeddah',
    activeDays: [0, 1, 2, 3, 4],
  },
  {
    branchId: 'branch-dammam',
    activeDays: [0, 1, 2, 3, 4],
  },
];

export class TimetableStorageService {
  private static instance: TimetableStorageService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): TimetableStorageService {
    if (!TimetableStorageService.instance) {
      TimetableStorageService.instance = new TimetableStorageService();
    }
    return TimetableStorageService.instance;
  }

  public initialize(): void {
    if (this.initialized) return;

    // Ensure dependent domain services are initialized
    branchStorage.initialize();
    academicStorage.initialize();
    teacherStorage.initialize();

    if (!localStorage.getItem(TIMETABLE_PERIODS_STORAGE_KEY)) {
      localStorage.setItem(TIMETABLE_PERIODS_STORAGE_KEY, JSON.stringify(SEEDED_PERIODS));
    }
    if (!localStorage.getItem(TIMETABLE_ROOMS_STORAGE_KEY)) {
      localStorage.setItem(TIMETABLE_ROOMS_STORAGE_KEY, JSON.stringify(SEEDED_ROOMS));
    }
    if (!localStorage.getItem(TIMETABLE_ENTRIES_STORAGE_KEY)) {
      localStorage.setItem(TIMETABLE_ENTRIES_STORAGE_KEY, JSON.stringify(SEEDED_TIMETABLE_ENTRIES));
    }
    if (!localStorage.getItem(TIMETABLE_DAYS_CONFIG_STORAGE_KEY)) {
      localStorage.setItem(TIMETABLE_DAYS_CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_BRANCH_DAYS_CONFIG));
    }

    this.initialized = true;
  }

  // --- ACCESS & PERMISSION HELPERS ---
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
        targetType: 'TIMETABLE',
        result: 'DENIED',
        details: `Security violation: User "${actingUser.username}" denied access to timetable in branch "${targetBranchId}"`,
      });
      throw new Error(`غير مصرح لك بالوصول أو إدارة الجداول المدرسية في الفرع المحدد (${targetBranchId}).`);
    }
  }

  public checkPermission(actingUser: SafeUser, requiredPermission: any): void {
    if (!authStorage.hasPermission(actingUser, requiredPermission)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        targetType: 'TIMETABLE',
        result: 'DENIED',
        details: `Security violation: Missing permission "${requiredPermission}" for timetable operation`,
      });
      throw new Error(`ليس لديك الصلاحية الكافية لإتمام هذه العملية (${requiredPermission}).`);
    }
  }

  // --- RAW STORAGE ACCESSORS ---
  public getRawTimetableEntries(): TimetableEntry[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(TIMETABLE_ENTRIES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_TIMETABLE_ENTRIES;
    } catch {
      return SEEDED_TIMETABLE_ENTRIES;
    }
  }

  private saveTimetableEntries(entries: TimetableEntry[]): void {
    localStorage.setItem(TIMETABLE_ENTRIES_STORAGE_KEY, JSON.stringify(entries));
  }

  public getRawPeriods(): TimetablePeriod[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(TIMETABLE_PERIODS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_PERIODS;
    } catch {
      return SEEDED_PERIODS;
    }
  }

  private savePeriods(periods: TimetablePeriod[]): void {
    localStorage.setItem(TIMETABLE_PERIODS_STORAGE_KEY, JSON.stringify(periods));
  }

  public getRawRooms(): SchoolRoom[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(TIMETABLE_ROOMS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_ROOMS;
    } catch {
      return SEEDED_ROOMS;
    }
  }

  private saveRooms(rooms: SchoolRoom[]): void {
    localStorage.setItem(TIMETABLE_ROOMS_STORAGE_KEY, JSON.stringify(rooms));
  }

  public getRawDaysConfig(): BranchSchoolDaysConfig[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(TIMETABLE_DAYS_CONFIG_STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_BRANCH_DAYS_CONFIG;
    } catch {
      return DEFAULT_BRANCH_DAYS_CONFIG;
    }
  }

  public getActiveDaysForBranch(branchId: string): DayOfWeek[] {
    const configs = this.getRawDaysConfig();
    const config = configs.find((c) => c.branchId === branchId);
    return config ? config.activeDays : [0, 1, 2, 3, 4];
  }

  // ====================================================
  // COMPREHENSIVE CONFLICT DETECTION (SERVICE LAYER)
  // ====================================================

  /**
   * Validates a candidate timetable entry against all domain rules and scheduling conflicts.
   * Returns a conflict object if invalid, or null if valid.
   */
  public detectConflict(
    candidate: {
      branchId: string;
      academicYearId: string;
      classId: string;
      subjectId: string;
      teacherId: string;
      roomId?: string;
      dayOfWeek: DayOfWeek;
      periodId: string;
    },
    excludeEntryId?: string
  ): TimetableConflict | null {
    this.initialize();

    // 1. Validate Period Exists & Active
    const periods = this.getRawPeriods();
    const period = periods.find((p) => p.id === candidate.periodId);
    if (!period) {
      return {
        type: 'PERIOD_INACTIVE',
        messageAr: 'الحصة/الفترة الزمنية المحددة غير موجودة في النظام.',
        messageEn: 'Specified timetable period does not exist.',
      };
    }
    if (period.branchId !== candidate.branchId) {
      return {
        type: 'CROSS_BRANCH',
        messageAr: 'أمان النظام: الفترة الزمنية تابعة لفرع آخر.',
        messageEn: 'Cross-branch error: Period belongs to a different campus.',
      };
    }
    if (period.status !== 'active') {
      return {
        type: 'PERIOD_INACTIVE',
        messageAr: 'الفترة الزمنية المحددة معطلة حالياً.',
        messageEn: 'Specified timetable period is inactive.',
      };
    }
    if (period.isBreak) {
      return {
        type: 'BREAK_PERIOD',
        messageAr: `لا يمكن تسكين حصص دراسية خلال فترة الفسحة أو الاستراحة (${period.nameAr}).`,
        messageEn: `Cannot schedule lessons during a break period (${period.nameEn}).`,
      };
    }

    // 2. Validate Class Exists & Active & Branch-Compatible
    const classes = academicStorage.getRawClasses();
    const cls = classes.find((c) => c.id === candidate.classId);
    if (!cls) {
      return {
        type: 'CLASS_INACTIVE',
        messageAr: 'الفصل الدراسي المحدد غير موجود.',
        messageEn: 'Specified class section does not exist.',
      };
    }
    if (cls.branchId !== candidate.branchId) {
      return {
        type: 'CROSS_BRANCH',
        messageAr: `أمان النظام: الفصل (${cls.nameAr}) تابع لفرع آخر ولا يمكن جدولته في هذا الفرع.`,
        messageEn: 'Cross-branch error: Class belongs to another branch.',
      };
    }
    if (cls.academicYearId !== candidate.academicYearId) {
      return {
        type: 'ACADEMIC_YEAR_MISMATCH',
        messageAr: `تعارض العام الدراسي: الفصل (${cls.nameAr}) مسجل في عام دراسي مختلف عن جدول الحصص.`,
        messageEn: 'Academic year mismatch: Class is registered under a different academic year.',
      };
    }
    if (cls.status !== 'active') {
      return {
        type: 'CLASS_INACTIVE',
        messageAr: `الفصل الدراسي (${cls.nameAr}) معطل ولا يمكن تسكين حصص له.`,
        messageEn: 'Class is inactive and cannot receive lessons.',
      };
    }

    // 3. Validate Subject Exists & Branch-Compatible
    const subjects = academicStorage.getRawSubjects();
    const subject = subjects.find((s) => s.id === candidate.subjectId);
    if (!subject) {
      return {
        type: 'CROSS_BRANCH',
        messageAr: 'المادة الدراسية المحددة غير موجودة.',
        messageEn: 'Specified subject does not exist.',
      };
    }
    if (subject.branchId !== candidate.branchId) {
      return {
        type: 'CROSS_BRANCH',
        messageAr: `أمان النظام: المادة الدراسية (${subject.nameAr}) تابعة لفرع آخر.`,
        messageEn: 'Cross-branch error: Subject belongs to another branch.',
      };
    }
    if (subject.status !== 'active') {
      return {
        type: 'CROSS_BRANCH',
        messageAr: `المادة الدراسية (${subject.nameAr}) معطلة حالياً.`,
        messageEn: 'Subject is inactive.',
      };
    }

    // 4. Validate Teacher Exists, Active, Branch-Compatible & Subject-Eligible
    const teachers = teacherStorage.getRawTeachers();
    const teacher = teachers.find((t) => t.id === candidate.teacherId);
    if (!teacher) {
      return {
        type: 'TEACHER_INACTIVE',
        messageAr: 'سجل المعلم المحدد غير موجود بالنظام.',
        messageEn: 'Specified teacher does not exist.',
      };
    }
    if (teacher.branchId !== candidate.branchId) {
      return {
        type: 'CROSS_BRANCH',
        messageAr: `أمان النظام [CROSS_BRANCH]: المعلم (${teacher.fullNameAr}) يتبع فرع آخر ولا يمكن جدولته في هذا الفرع.`,
        messageEn: 'Cross-branch error: Teacher belongs to a different branch.',
      };
    }
    if (
      teacher.employmentStatus === 'ARCHIVED' ||
      teacher.employmentStatus === 'INACTIVE' ||
      teacher.employmentStatus === 'SUSPENDED' ||
      teacher.employmentStatus === 'ON_LEAVE'
    ) {
      return {
        type: 'TEACHER_INACTIVE',
        messageAr: `المعلم (${teacher.fullNameAr}) حالته الحالية (${teacher.employmentStatus}) ولا يمكن تسكين حصص له.`,
        messageEn: `Teacher status is ${teacher.employmentStatus}, scheduling disallowed.`,
      };
    }

    // Teacher Subject Eligibility (PHASE 6 Relationship check)
    const teacherSubjects = teacherStorage.getRawTeacherSubjects();
    const isEligible = teacherSubjects.some(
      (ts) => ts.teacherId === candidate.teacherId && ts.subjectId === candidate.subjectId
    );
    if (!isEligible) {
      return {
        type: 'TEACHER_INELIGIBLE',
        messageAr: `أمان الأهلية: المعلم (${teacher.fullNameAr}) غير مسند لتدريس مادة (${subject.nameAr}) في سجلات هيئة التدريس.`,
        messageEn: `Teacher (${teacher.fullNameEn}) is not assigned to teach subject (${subject.nameEn}).`,
      };
    }

    // 5. Validate Room if provided
    if (candidate.roomId) {
      const rooms = this.getRawRooms();
      const room = rooms.find((r) => r.id === candidate.roomId);
      if (!room) {
        return {
          type: 'ROOM_CONFLICT',
          messageAr: 'القاعة الدراسية المحددة غير موجودة.',
          messageEn: 'Specified room does not exist.',
        };
      }
      if (room.branchId !== candidate.branchId) {
        return {
          type: 'CROSS_BRANCH',
          messageAr: `أمان النظام: القاعة (${room.roomCode}) تابعة لفرع آخر.`,
          messageEn: 'Cross-branch error: Room belongs to a different branch.',
        };
      }
      if (room.status !== 'active') {
        return {
          type: 'ROOM_CONFLICT',
          messageAr: `القاعة الدراسية (${room.roomCode}) معطلة أو قيد الصيانة.`,
          messageEn: 'Room is inactive.',
        };
      }
    }

    // 6. Overlap and Concurrency Conflict Checks
    const allEntries = this.getRawTimetableEntries();
    const concurrentEntries = allEntries.filter(
      (e) =>
        e.id !== excludeEntryId &&
        e.academicYearId === candidate.academicYearId &&
        e.dayOfWeek === candidate.dayOfWeek &&
        e.periodId === candidate.periodId
    );

    // Conflict D: Duplicate Lesson (Same class, subject, teacher, day, period)
    const duplicate = concurrentEntries.find(
      (e) =>
        e.classId === candidate.classId &&
        e.subjectId === candidate.subjectId &&
        e.teacherId === candidate.teacherId
    );
    if (duplicate) {
      return {
        type: 'DUPLICATE_LESSON',
        messageAr: 'تكرار غير مسموح: توجد حصة مسجلة مسبقاً بنفس المعلم والمادة والفصل في هذا الموعد.',
        messageEn: 'Duplicate lesson already exists for the same class, subject and teacher in this slot.',
        conflictingEntryId: duplicate.id,
      };
    }

    // Conflict A: Teacher Double Booking
    const teacherConflict = concurrentEntries.find((e) => e.teacherId === candidate.teacherId);
    if (teacherConflict) {
      const conflictClass = classes.find((c) => c.id === teacherConflict.classId);
      return {
        type: 'TEACHER_CONFLICT',
        messageAr: `تعارض في جدول المعلم: المعلم (${teacher.fullNameAr}) لديه حصة أخرى في نفس الموعد مع فصل (${conflictClass?.nameAr || teacherConflict.classId}).`,
        messageEn: `Teacher conflict: ${teacher.fullNameEn} is already teaching class (${conflictClass?.nameEn || teacherConflict.classId}) at this time.`,
        conflictingEntryId: teacherConflict.id,
      };
    }

    // Conflict B: Class Double Booking
    const classConflict = concurrentEntries.find((e) => e.classId === candidate.classId);
    if (classConflict) {
      const conflictSubject = subjects.find((s) => s.id === classConflict.subjectId);
      return {
        type: 'CLASS_CONFLICT',
        messageAr: `تعارض في جدول الفصل: فصل (${cls.nameAr}) لديه حصة مادة (${conflictSubject?.nameAr || classConflict.subjectId}) مجدولة بالفعل في نفس الفترة.`,
        messageEn: `Class conflict: Section (${cls.nameEn}) already has subject (${conflictSubject?.nameEn || classConflict.subjectId}) scheduled in this slot.`,
        conflictingEntryId: classConflict.id,
      };
    }

    // Conflict C: Room Double Booking
    if (candidate.roomId) {
      const roomConflict = concurrentEntries.find((e) => e.roomId === candidate.roomId);
      if (roomConflict) {
        const conflictClass = classes.find((c) => c.id === roomConflict.classId);
        const rooms = this.getRawRooms();
        const room = rooms.find((r) => r.id === candidate.roomId);
        return {
          type: 'ROOM_CONFLICT',
          messageAr: `تعارض قاعة دراسية: القاعة (${room?.roomCode || candidate.roomId}) مشغولة في نفس الوقت بواسطة فصل (${conflictClass?.nameAr || roomConflict.classId}).`,
          messageEn: `Room conflict: Room (${room?.roomCode || candidate.roomId}) is already occupied by class (${conflictClass?.nameEn || roomConflict.classId}).`,
          conflictingEntryId: roomConflict.id,
        };
      }
    }

    return null; // All checks passed cleanly
  }

  // ====================================================
  // POPULATION HELPER
  // ====================================================
  private populateEntry(entry: TimetableEntry): PopulatedTimetableEntry {
    const classes = academicStorage.getRawClasses();
    const subjects = academicStorage.getRawSubjects();
    const teachers = teacherStorage.getRawTeachers();
    const periods = this.getRawPeriods();
    const rooms = this.getRawRooms();
    const branches = branchStorage.getStoredBranches();
    const years = academicStorage.getRawYears();

    const cls = classes.find((c) => c.id === entry.classId);
    const sbj = subjects.find((s) => s.id === entry.subjectId);
    const tch = teachers.find((t) => t.id === entry.teacherId);
    const prd = periods.find((p) => p.id === entry.periodId);
    const rm = entry.roomId ? rooms.find((r) => r.id === entry.roomId) : undefined;
    const br = branches.find((b) => b.id === entry.branchId);
    const yr = years.find((y) => y.id === entry.academicYearId);

    return {
      ...entry,
      classNameAr: cls?.nameAr || 'فصل غير محدد',
      classNameEn: cls?.nameEn || 'Unknown Class',
      classCode: cls?.classCode || '',
      subjectNameAr: sbj?.nameAr || 'مادة غير محددة',
      subjectNameEn: sbj?.nameEn || 'Unknown Subject',
      subjectCode: sbj?.subjectCode || '',
      teacherNameAr: tch?.fullNameAr || 'معلم غير محدد',
      teacherNameEn: tch?.fullNameEn || 'Unknown Teacher',
      teacherNumber: tch?.teacherNumber || '',
      roomCode: rm?.roomCode,
      roomNameAr: rm?.nameAr,
      roomNameEn: rm?.nameEn,
      periodNameAr: prd?.nameAr || 'فترة غير محددة',
      periodNameEn: prd?.nameEn || 'Unknown Period',
      periodNumber: prd?.periodNumber || 0,
      startTime: prd?.startTime || '00:00',
      endTime: prd?.endTime || '00:00',
      isBreak: prd?.isBreak || false,
      branchNameAr: br?.nameAr,
      branchNameEn: br?.nameEn,
      academicYearNameAr: yr?.nameAr,
    };
  }

  // ====================================================
  // QUERY & DIRECTORY METHODS
  // ====================================================

  public listTimetableEntries(
    actingUser: SafeUser,
    params: TimetableFilterParams
  ): PopulatedTimetableEntry[] {
    this.checkPermission(actingUser, 'timetable.view');

    let all = this.getRawTimetableEntries();

    if (params.branchId && params.branchId !== 'all') {
      this.checkBranchAccess(actingUser, params.branchId);
      all = all.filter((e) => e.branchId === params.branchId);
    } else {
      if (!authStorage.isSuperAdmin(actingUser) && !actingUser.hasAllBranchesAccess) {
        all = all.filter((e) => actingUser.branchIds.includes(e.branchId));
      }
    }

    if (params.academicYearId) {
      all = all.filter((e) => e.academicYearId === params.academicYearId);
    }
    if (params.classId) {
      all = all.filter((e) => e.classId === params.classId);
    }
    if (params.teacherId) {
      all = all.filter((e) => e.teacherId === params.teacherId);
    }
    if (params.roomId) {
      all = all.filter((e) => e.roomId === params.roomId);
    }
    if (params.dayOfWeek !== undefined) {
      all = all.filter((e) => e.dayOfWeek === params.dayOfWeek);
    }
    if (params.status && params.status !== 'all') {
      all = all.filter((e) => e.status === params.status);
    }

    return all.map((e) => this.populateEntry(e));
  }

  public getWeeklySubjectLoad(classId: string, academicYearId: string): WeeklySubjectLoad[] {
    this.initialize();
    const classes = academicStorage.getRawClasses();
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return [];

    const gradeSubjects = academicStorage.getRawGradeSubjects().filter((gs) => gs.gradeId === cls.gradeId);
    const subjects = academicStorage.getRawSubjects();
    const entries = this.getRawTimetableEntries().filter(
      (e) => e.classId === classId && e.academicYearId === academicYearId
    );

    return gradeSubjects.map((gs) => {
      const sbj = subjects.find((s) => s.id === gs.subjectId);
      const scheduledCount = entries.filter((e) => e.subjectId === gs.subjectId).length;
      const required = gs.weeklyPeriods || 0;
      const remaining = required - scheduledCount;
      const status: 'NORMAL' | 'COMPLETE' | 'EXCESS' =
        scheduledCount === required ? 'COMPLETE' : scheduledCount > required ? 'EXCESS' : 'NORMAL';

      return {
        subjectId: gs.subjectId,
        subjectNameAr: sbj?.nameAr || 'مادة غير محددة',
        subjectNameEn: sbj?.nameEn || 'Unknown Subject',
        subjectCode: sbj?.subjectCode || '',
        requiredPeriods: required,
        scheduledPeriods: scheduledCount,
        remainingPeriods: remaining,
        status,
      };
    });
  }

  // ====================================================
  // ATOMIC SCHEDULING OPERATIONS (MUTATIONS)
  // ====================================================

  public createTimetableEntry(actingUser: SafeUser, dto: CreateTimetableEntryDTO): PopulatedTimetableEntry {
    this.checkPermission(actingUser, 'timetable.create');
    this.checkBranchAccess(actingUser, dto.branchId);

    // 1. Service Layer Conflict Detection
    const conflict = this.detectConflict(dto);
    if (conflict) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'TIMETABLE_CONFLICT_REJECTED',
        targetType: 'TIMETABLE',
        result: 'DENIED',
        details: `Conflict blocked: [${conflict.type}] ${conflict.messageAr}`,
      });
      throw new Error(`تعذر حفظ الحصة: ${conflict.messageAr}`);
    }

    const now = new Date().toISOString();
    const newEntry: TimetableEntry = {
      id: `tme-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      branchId: dto.branchId,
      academicYearId: dto.academicYearId,
      classId: dto.classId,
      subjectId: dto.subjectId,
      teacherId: dto.teacherId,
      roomId: dto.roomId || undefined,
      dayOfWeek: dto.dayOfWeek,
      periodId: dto.periodId,
      status: dto.status || 'DRAFT',
      notes: dto.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      createdBy: actingUser.id,
      updatedBy: actingUser.id,
    };

    const entries = this.getRawTimetableEntries();
    entries.push(newEntry);
    this.saveTimetableEntries(entries);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TIMETABLE_CREATED',
      targetType: 'TIMETABLE',
      targetId: newEntry.id,
      branchContext: newEntry.branchId,
      result: 'SUCCESS',
      details: `Scheduled lesson for class [${newEntry.classId}] on day ${newEntry.dayOfWeek} period [${newEntry.periodId}]`,
    });

    return this.populateEntry(newEntry);
  }

  public updateTimetableEntry(
    actingUser: SafeUser,
    entryId: string,
    dto: UpdateTimetableEntryDTO
  ): PopulatedTimetableEntry {
    this.checkPermission(actingUser, 'timetable.edit');

    const entries = this.getRawTimetableEntries();
    const target = entries.find((e) => e.id === entryId);
    if (!target) throw new Error('الحصة المحددة غير موجودة.');

    this.checkBranchAccess(actingUser, target.branchId);

    // Merge candidate
    const candidate = {
      branchId: target.branchId,
      academicYearId: target.academicYearId,
      classId: dto.classId || target.classId,
      subjectId: dto.subjectId || target.subjectId,
      teacherId: dto.teacherId || target.teacherId,
      roomId: dto.roomId !== undefined ? dto.roomId : target.roomId,
      dayOfWeek: dto.dayOfWeek !== undefined ? dto.dayOfWeek : target.dayOfWeek,
      periodId: dto.periodId || target.periodId,
    };

    // Detect conflicts excluding current entry
    const conflict = this.detectConflict(candidate, entryId);
    if (conflict) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'TIMETABLE_CONFLICT_REJECTED',
        targetType: 'TIMETABLE',
        targetId: entryId,
        result: 'DENIED',
        details: `Update rejected due to conflict: ${conflict.messageAr}`,
      });
      throw new Error(`تعذر تعديل الحصة: ${conflict.messageAr}`);
    }

    if (dto.classId) target.classId = dto.classId;
    if (dto.subjectId) target.subjectId = dto.subjectId;
    if (dto.teacherId) target.teacherId = dto.teacherId;
    if (dto.roomId !== undefined) target.roomId = dto.roomId || undefined;
    if (dto.dayOfWeek !== undefined) target.dayOfWeek = dto.dayOfWeek;
    if (dto.periodId) target.periodId = dto.periodId;
    if (dto.status) target.status = dto.status;
    if (dto.notes !== undefined) target.notes = dto.notes.trim() || undefined;

    target.updatedAt = new Date().toISOString();
    target.updatedBy = actingUser.id;

    this.saveTimetableEntries(entries);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TIMETABLE_UPDATED',
      targetType: 'TIMETABLE',
      targetId: target.id,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Updated timetable lesson [${target.id}]`,
    });

    return this.populateEntry(target);
  }

  public moveTimetableEntry(
    actingUser: SafeUser,
    entryId: string,
    moveDto: MoveTimetableEntryDTO
  ): PopulatedTimetableEntry {
    this.checkPermission(actingUser, 'timetable.edit');

    const entries = this.getRawTimetableEntries();
    const target = entries.find((e) => e.id === entryId);
    if (!target) throw new Error('الحصة المحددة غير موجودة.');

    this.checkBranchAccess(actingUser, target.branchId);

    const candidate = {
      branchId: target.branchId,
      academicYearId: target.academicYearId,
      classId: target.classId,
      subjectId: target.subjectId,
      teacherId: target.teacherId,
      roomId: moveDto.roomId !== undefined ? moveDto.roomId : target.roomId,
      dayOfWeek: moveDto.dayOfWeek,
      periodId: moveDto.periodId,
    };

    const conflict = this.detectConflict(candidate, entryId);
    if (conflict) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'TIMETABLE_CONFLICT_REJECTED',
        targetType: 'TIMETABLE',
        targetId: entryId,
        result: 'DENIED',
        details: `Move rejected: [${conflict.type}] ${conflict.messageAr}`,
      });
      throw new Error(`تعذر نقل الحصة: ${conflict.messageAr}`);
    }

    target.dayOfWeek = moveDto.dayOfWeek;
    target.periodId = moveDto.periodId;
    if (moveDto.roomId !== undefined) target.roomId = moveDto.roomId || undefined;
    target.updatedAt = new Date().toISOString();
    target.updatedBy = actingUser.id;

    this.saveTimetableEntries(entries);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TIMETABLE_MOVED',
      targetType: 'TIMETABLE',
      targetId: target.id,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Moved lesson to Day ${target.dayOfWeek}, Period [${target.periodId}]`,
    });

    return this.populateEntry(target);
  }

  public deleteTimetableEntry(actingUser: SafeUser, entryId: string): void {
    this.checkPermission(actingUser, 'timetable.delete');

    const entries = this.getRawTimetableEntries();
    const index = entries.findIndex((e) => e.id === entryId);
    if (index === -1) throw new Error('الحصة المحددة غير موجودة.');

    const target = entries[index];
    this.checkBranchAccess(actingUser, target.branchId);

    entries.splice(index, 1);
    this.saveTimetableEntries(entries);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TIMETABLE_DELETED',
      targetType: 'TIMETABLE',
      targetId: target.id,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Deleted scheduled lesson [${target.id}]`,
    });
  }

  // ====================================================
  // PUBLISH / UNPUBLISH WORKFLOW
  // ====================================================

  public publishClassTimetable(
    actingUser: SafeUser,
    branchId: string,
    academicYearId: string,
    classId: string
  ): { publishedCount: number } {
    this.checkPermission(actingUser, 'timetable.publish');
    this.checkBranchAccess(actingUser, branchId);

    const entries = this.getRawTimetableEntries();
    const classEntries = entries.filter(
      (e) => e.branchId === branchId && e.academicYearId === academicYearId && e.classId === classId
    );

    if (classEntries.length === 0) {
      throw new Error('لا يمكن نشر جدول دراسي فارغ. يرجى تسكين الحصص الدراسية أولاً.');
    }

    // Comprehensive validation of all entries before publish
    for (const entry of classEntries) {
      const conflict = this.detectConflict(entry, entry.id);
      if (conflict) {
        throw new Error(`لا يمكن اعتماد ونشر الجدول لوجود تعارض في إحدى الحصص: ${conflict.messageAr}`);
      }
    }

    classEntries.forEach((e) => {
      e.status = 'PUBLISHED';
      e.updatedAt = new Date().toISOString();
      e.updatedBy = actingUser.id;
    });

    this.saveTimetableEntries(entries);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TIMETABLE_PUBLISHED',
      targetType: 'TIMETABLE',
      targetIdentifier: classId,
      branchContext: branchId,
      result: 'SUCCESS',
      details: `Published timetable for class [${classId}] with ${classEntries.length} valid lessons`,
    });

    return { publishedCount: classEntries.length };
  }

  public unpublishClassTimetable(
    actingUser: SafeUser,
    branchId: string,
    academicYearId: string,
    classId: string
  ): { unpublishedCount: number } {
    this.checkPermission(actingUser, 'timetable.publish');
    this.checkBranchAccess(actingUser, branchId);

    const entries = this.getRawTimetableEntries();
    const classEntries = entries.filter(
      (e) => e.branchId === branchId && e.academicYearId === academicYearId && e.classId === classId
    );

    classEntries.forEach((e) => {
      e.status = 'DRAFT';
      e.updatedAt = new Date().toISOString();
      e.updatedBy = actingUser.id;
    });

    this.saveTimetableEntries(entries);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TIMETABLE_UNPUBLISHED',
      targetType: 'TIMETABLE',
      targetIdentifier: classId,
      branchContext: branchId,
      result: 'SUCCESS',
      details: `Reverted timetable to DRAFT for class [${classId}]`,
    });

    return { unpublishedCount: classEntries.length };
  }

  public copyClassTimetable(
    actingUser: SafeUser,
    dto: CopyClassTimetableDTO
  ): { copiedCount: number } {
    this.checkPermission(actingUser, 'timetable.create');
    this.checkBranchAccess(actingUser, dto.branchId);

    if (dto.sourceClassId === dto.targetClassId) {
      throw new Error('لا يمكن نسخ الجدول إلى نفس الفصل المصدر.');
    }

    // Verify classes exist and belong to branch
    const allClasses = academicStorage.getRawClasses();
    const sourceClass = allClasses.find((c) => c.id === dto.sourceClassId);
    const targetClass = allClasses.find((c) => c.id === dto.targetClassId);

    if (!sourceClass || sourceClass.branchId !== dto.branchId) {
      throw new Error('الفصل الدراسي المصدر غير موجود أو لا ينتمي لهذا الفرع.');
    }
    if (!targetClass || targetClass.branchId !== dto.branchId) {
      throw new Error('الفصل الدراسي المستهدف غير موجود أو لا ينتمي لهذا الفرع.');
    }
    if (sourceClass.academicYearId !== dto.academicYearId || targetClass.academicYearId !== dto.academicYearId) {
      throw new Error('يجب أن ينتمي كلا الفصلين إلى نفس العام الدراسي المحدد.');
    }

    let entries = this.getRawTimetableEntries();
    const sourceEntries = entries.filter(
      (e) => e.branchId === dto.branchId && e.academicYearId === dto.academicYearId && e.classId === dto.sourceClassId
    );

    if (sourceEntries.length === 0) {
      throw new Error('الجدول الدراسي للفصل المصدر فارغ ولا يحتوي على حصص لنسخها.');
    }

    const existingTargetEntries = entries.filter(
      (e) => e.branchId === dto.branchId && e.academicYearId === dto.academicYearId && e.classId === dto.targetClassId
    );

    if (existingTargetEntries.length > 0 && !dto.overwriteExisting) {
      throw new Error(
        `الفصل المستهدف يحتوي بالفعل على ${existingTargetEntries.length} حصة مسكنة. يرجى تفعيل خيار الاستبدال للمتابعة.`
      );
    }

    // If overwrite is selected, filter out old target entries
    if (dto.overwriteExisting && existingTargetEntries.length > 0) {
      entries = entries.filter(
        (e) => !(e.branchId === dto.branchId && e.academicYearId === dto.academicYearId && e.classId === dto.targetClassId)
      );
    }

    // Generate new entries and pre-check conflicts
    const now = new Date().toISOString();
    const newEntries: TimetableEntry[] = [];
    const allTeachers = teacherStorage.getRawTeachers();
    const allTeacherSubjects = teacherStorage.getRawTeacherSubjects();

    for (const src of sourceEntries) {
      let candidate: TimetableEntry = {
        id: `tme-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        branchId: dto.branchId,
        academicYearId: dto.academicYearId,
        classId: dto.targetClassId,
        subjectId: src.subjectId,
        teacherId: src.teacherId,
        roomId: src.roomId,
        dayOfWeek: src.dayOfWeek,
        periodId: src.periodId,
        status: 'DRAFT',
        notes: src.notes ? `منسوخ من ${sourceClass.nameAr}: ${src.notes}` : `منسوخ من جدول ${sourceClass.nameAr}`,
        createdAt: now,
        updatedAt: now,
        createdBy: actingUser.id,
      };

      // Check conflict against current database + newly generated batch
      let conflict = this.detectConflict(candidate);

      // If teacher is conflicting (already scheduled elsewhere at that time), find an available eligible teacher in branch
      if (conflict && conflict.type === 'TEACHER_CONFLICT') {
        const eligibleTeachers = allTeachers.filter(
          (t) =>
            t.branchId === dto.branchId &&
            t.employmentStatus === 'ACTIVE' &&
            allTeacherSubjects.some((ts) => ts.teacherId === t.id && ts.subjectId === src.subjectId)
        );

        for (const altTeacher of eligibleTeachers) {
          const altCandidate = { ...candidate, teacherId: altTeacher.id };
          const altConflict = this.detectConflict(altCandidate);
          if (!altConflict) {
            candidate = altCandidate;
            conflict = null;
            break;
          }
        }
      }

      // If room is conflicting, fallback to no custom room
      if (conflict && conflict.type === 'ROOM_CONFLICT') {
        const altCandidate = { ...candidate, roomId: undefined };
        const altConflict = this.detectConflict(altCandidate);
        if (!altConflict) {
          candidate = altCandidate;
          conflict = null;
        }
      }

      if (conflict) {
        throw new Error(
          `تعذر نسخ الجدول لوجود تعارض في موعد الحصة (يوم ${candidate.dayOfWeek}): ${conflict.messageAr}`
        );
      }

      newEntries.push(candidate);
    }

    entries.push(...newEntries);
    this.saveTimetableEntries(entries);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TIMETABLE_COPIED',
      targetType: 'TIMETABLE',
      targetIdentifier: dto.targetClassId,
      branchContext: dto.branchId,
      result: 'SUCCESS',
      details: `Copied ${newEntries.length} lessons from class [${sourceClass.nameAr}] to [${targetClass.nameAr}]`,
    });

    return { copiedCount: newEntries.length };
  }

  // ====================================================
  // PERIODS MANAGEMENT
  // ====================================================

  public listPeriods(actingUser: SafeUser, branchId: string): TimetablePeriod[] {
    this.checkPermission(actingUser, 'timetable.view');
    this.checkBranchAccess(actingUser, branchId);

    return this.getRawPeriods()
      .filter((p) => p.branchId === branchId)
      .sort((a, b) => a.periodNumber - b.periodNumber);
  }

  public createPeriod(actingUser: SafeUser, dto: CreatePeriodDTO): TimetablePeriod {
    this.checkPermission(actingUser, 'timetable.manage_periods');
    this.checkBranchAccess(actingUser, dto.branchId);

    // Validate times
    if (dto.startTime >= dto.endTime) {
      throw new Error('وقت بدء الحصة يجب أن يكون أسبق من وقت الانتهاء.');
    }

    const periods = this.getRawPeriods();
    const branchPeriods = periods.filter((p) => p.branchId === dto.branchId && p.status === 'active');

    // Prevent overlapping active periods in the same branch
    const hasOverlap = branchPeriods.some((p) => {
      return (
        (dto.startTime >= p.startTime && dto.startTime < p.endTime) ||
        (dto.endTime > p.startTime && dto.endTime <= p.endTime) ||
        (dto.startTime <= p.startTime && dto.endTime >= p.endTime)
      );
    });

    if (hasOverlap) {
      throw new Error('توقيت الفترة يتعارض ويتداخل مع فترة دراسية أخرى معتمدة في هذا الفرع.');
    }

    // Calculate duration in minutes
    const [startH, startM] = dto.startTime.split(':').map(Number);
    const [endH, endM] = dto.endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    const now = new Date().toISOString();
    const newPeriod: TimetablePeriod = {
      id: `prd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      branchId: dto.branchId,
      nameAr: dto.nameAr.trim(),
      nameEn: dto.nameEn.trim(),
      periodNumber: dto.periodNumber,
      startTime: dto.startTime,
      endTime: dto.endTime,
      durationMinutes,
      isBreak: Boolean(dto.isBreak),
      status: dto.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    periods.push(newPeriod);
    this.savePeriods(periods);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'PERIOD_CREATED',
      targetType: 'PERIOD',
      targetId: newPeriod.id,
      branchContext: newPeriod.branchId,
      result: 'SUCCESS',
      details: `Created timetable period "${newPeriod.nameAr}" [${newPeriod.startTime}-${newPeriod.endTime}]`,
    });

    return newPeriod;
  }

  public updatePeriod(actingUser: SafeUser, periodId: string, dto: UpdatePeriodDTO): TimetablePeriod {
    this.checkPermission(actingUser, 'timetable.manage_periods');

    const periods = this.getRawPeriods();
    const target = periods.find((p) => p.id === periodId);
    if (!target) throw new Error('الفترة الزمنية غير موجودة.');

    this.checkBranchAccess(actingUser, target.branchId);

    const newStart = dto.startTime || target.startTime;
    const newEnd = dto.endTime || target.endTime;

    if (newStart >= newEnd) {
      throw new Error('وقت بدء الحصة يجب أن يكون أسبق من وقت الانتهاء.');
    }

    const branchPeriods = periods.filter(
      (p) => p.branchId === target.branchId && p.id !== periodId && p.status === 'active'
    );
    const hasOverlap = branchPeriods.some((p) => {
      return (
        (newStart >= p.startTime && newStart < p.endTime) ||
        (newEnd > p.startTime && newEnd <= p.endTime) ||
        (newStart <= p.startTime && newEnd >= p.endTime)
      );
    });

    if (hasOverlap) {
      throw new Error('التوقيت المعدل يتعارض ويتداخل مع فترة أخرى معتمدة بالفرع.');
    }

    const [startH, startM] = newStart.split(':').map(Number);
    const [endH, endM] = newEnd.split(':').map(Number);
    target.durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    if (dto.nameAr) target.nameAr = dto.nameAr.trim();
    if (dto.nameEn) target.nameEn = dto.nameEn.trim();
    if (dto.periodNumber) target.periodNumber = dto.periodNumber;
    target.startTime = newStart;
    target.endTime = newEnd;
    if (dto.isBreak !== undefined) target.isBreak = dto.isBreak;
    if (dto.status) target.status = dto.status;
    target.updatedAt = new Date().toISOString();

    this.savePeriods(periods);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'PERIOD_UPDATED',
      targetType: 'PERIOD',
      targetId: target.id,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Updated period "${target.nameAr}"`,
    });

    return target;
  }

  // ====================================================
  // ROOMS MANAGEMENT
  // ====================================================

  public listRooms(actingUser: SafeUser, branchId: string): SchoolRoom[] {
    this.checkPermission(actingUser, 'timetable.view');
    this.checkBranchAccess(actingUser, branchId);

    return this.getRawRooms()
      .filter((r) => r.branchId === branchId)
      .sort((a, b) => a.roomCode.localeCompare(b.roomCode));
  }

  public createRoom(actingUser: SafeUser, dto: CreateRoomDTO): SchoolRoom {
    this.checkPermission(actingUser, 'timetable.manage_rooms');
    this.checkBranchAccess(actingUser, dto.branchId);

    const cleanCode = dto.roomCode.trim().toUpperCase();
    if (!cleanCode) throw new Error('رمز القاعة الدراسية إلزامي.');

    const rooms = this.getRawRooms();
    const exists = rooms.find(
      (r) => r.branchId === dto.branchId && r.roomCode.toUpperCase() === cleanCode
    );
    if (exists) {
      throw new Error(`رمز القاعة (${cleanCode}) مسجل بالفعل في هذا الفرع.`);
    }

    const now = new Date().toISOString();
    const newRoom: SchoolRoom = {
      id: `rm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      branchId: dto.branchId,
      roomCode: cleanCode,
      nameAr: dto.nameAr.trim(),
      nameEn: dto.nameEn.trim(),
      capacity: dto.capacity || 30,
      roomType: dto.roomType,
      building: dto.building?.trim() || undefined,
      floor: dto.floor?.trim() || undefined,
      status: dto.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    rooms.push(newRoom);
    this.saveRooms(rooms);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ROOM_CREATED',
      targetType: 'ROOM',
      targetId: newRoom.id,
      targetIdentifier: newRoom.roomCode,
      branchContext: newRoom.branchId,
      result: 'SUCCESS',
      details: `Created room "${newRoom.nameAr}" [${newRoom.roomCode}]`,
    });

    return newRoom;
  }

  public updateRoom(actingUser: SafeUser, roomId: string, dto: UpdateRoomDTO): SchoolRoom {
    this.checkPermission(actingUser, 'timetable.manage_rooms');

    const rooms = this.getRawRooms();
    const target = rooms.find((r) => r.id === roomId);
    if (!target) throw new Error('القاعة الدراسية غير موجودة.');

    this.checkBranchAccess(actingUser, target.branchId);

    if (dto.roomCode) {
      const cleanCode = dto.roomCode.trim().toUpperCase();
      if (cleanCode !== target.roomCode) {
        const exists = rooms.find(
          (r) => r.branchId === target.branchId && r.id !== roomId && r.roomCode.toUpperCase() === cleanCode
        );
        if (exists) {
          throw new Error(`رمز القاعة (${cleanCode}) مسجل بالفعل لقاعة أخرى بالفرع.`);
        }
        target.roomCode = cleanCode;
      }
    }

    if (dto.nameAr) target.nameAr = dto.nameAr.trim();
    if (dto.nameEn) target.nameEn = dto.nameEn.trim();
    if (dto.capacity) target.capacity = dto.capacity;
    if (dto.roomType) target.roomType = dto.roomType;
    if (dto.building !== undefined) target.building = dto.building.trim() || undefined;
    if (dto.floor !== undefined) target.floor = dto.floor.trim() || undefined;
    if (dto.status) target.status = dto.status;
    target.updatedAt = new Date().toISOString();

    this.saveRooms(rooms);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ROOM_UPDATED',
      targetType: 'ROOM',
      targetId: target.id,
      targetIdentifier: target.roomCode,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Updated room [${target.roomCode}]`,
    });

    return target;
  }

  // ====================================================
  // CSV EXPORT
  // ====================================================

  public exportTimetableCSV(actingUser: SafeUser, params: TimetableFilterParams): string {
    this.checkPermission(actingUser, 'timetable.export');
    const entries = this.listTimetableEntries(actingUser, params);

    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const headers = [
      'الفرع',
      'العام الدراسي',
      'الفصل',
      'اليوم',
      'الفترة',
      'وقت البدء',
      'وقت الانتهاء',
      'المادة',
      'كود المادة',
      'المعلم',
      'الرقم الوظيفي',
      'القاعة',
      'الحالة',
    ];

    const rows = entries.map((e) => [
      e.branchNameAr || e.branchId,
      e.academicYearNameAr || e.academicYearId,
      e.classNameAr,
      dayNames[e.dayOfWeek] || e.dayOfWeek,
      e.periodNameAr,
      e.startTime,
      e.endTime,
      e.subjectNameAr,
      e.subjectCode,
      e.teacherNameAr,
      e.teacherNumber,
      e.roomCode || 'غير محددة',
      e.status === 'PUBLISHED' ? 'معتمد' : 'مسودة',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    return csvContent;
  }
}

export const timetableStorage = TimetableStorageService.getInstance();
