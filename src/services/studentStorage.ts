import {
  Student,
  StudentDetail,
  StudentStatus,
  Guardian,
  StudentGuardianRelation,
  StudentEnrollment,
  CreateStudentDTO,
  UpdateStudentDTO,
  StudentFilterParams,
  StudentStats,
  EnrollmentStatus,
} from '../types/student';
import { SafeUser } from '../types/auth';
import { authStorage } from './authStorage';
import { academicStorage } from './academicStorage';
import { branchStorage } from './branchStorage';

const STUDENTS_STORAGE_KEY = 'sms_students_v5';
const GUARDIANS_STORAGE_KEY = 'sms_guardians_v5';
const STUDENT_GUARDIANS_STORAGE_KEY = 'sms_student_guardians_v5';
const ENROLLMENTS_STORAGE_KEY = 'sms_enrollments_v5';

// Seeded Initial Guardians
const SEEDED_GUARDIANS: Guardian[] = [
  {
    id: 'grd-001',
    branchId: 'branch-riyadh',
    fullName: 'سعد بن إبراهيم القحطاني',
    relationship: 'father',
    phoneNumber: '0501122334',
    email: 'saad.qahtani@example.com',
    nationalId: '1012345678',
    address: 'الرياض - حي النرجس',
    isPrimaryContact: true,
    isEmergencyContact: true,
    notes: 'يفضل التواصل عبر واتساب بعد الساعة 2 ظهراً',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'grd-002',
    branchId: 'branch-riyadh',
    fullName: 'فاطمة بنت ناصر السبيعي',
    relationship: 'mother',
    phoneNumber: '0502233445',
    email: 'fatimah.subaie@example.com',
    nationalId: '1023456789',
    address: 'الرياض - حي النرجس',
    isPrimaryContact: false,
    isEmergencyContact: true,
    notes: 'جهة اتصال طوارئ ثانية',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'grd-003',
    branchId: 'branch-riyadh',
    fullName: 'محمد بن عبدالله الشمري',
    relationship: 'father',
    phoneNumber: '0503344556',
    email: 'm.shammary@example.com',
    nationalId: '1034567890',
    address: 'الرياض - حي الياسمين',
    isPrimaryContact: true,
    isEmergencyContact: true,
    createdAt: '2026-01-16T09:00:00.000Z',
    updatedAt: '2026-01-16T09:00:00.000Z',
  },
  {
    id: 'grd-004',
    branchId: 'branch-jeddah',
    fullName: 'أحمد بن حسن الزهراني',
    relationship: 'father',
    phoneNumber: '0504455667',
    email: 'ahmed.zahrani@example.com',
    nationalId: '1045678901',
    address: 'جدة - حي الحمراء',
    isPrimaryContact: true,
    isEmergencyContact: true,
    createdAt: '2026-01-18T10:00:00.000Z',
    updatedAt: '2026-01-18T10:00:00.000Z',
  },
  {
    id: 'grd-005',
    branchId: 'branch-dammam',
    fullName: 'خالد بن عبدالعزيز الدوسري',
    relationship: 'father',
    phoneNumber: '0505566778',
    email: 'k.dossary@example.com',
    nationalId: '1056789012',
    address: 'الدمام - حي الشاطئ',
    isPrimaryContact: true,
    isEmergencyContact: true,
    createdAt: '2026-01-20T11:00:00.000Z',
    updatedAt: '2026-01-20T11:00:00.000Z',
  },
];

// Seeded Initial Students
const SEEDED_STUDENTS: Student[] = [
  {
    id: 'stu-riyadh-001',
    branchId: 'branch-riyadh',
    studentNumber: 'STU-2026-001',
    firstNameAr: 'ريان',
    lastNameAr: 'القحطاني',
    firstNameEn: 'Rayan',
    lastNameEn: 'Al-Qahtani',
    fullNameAr: 'ريان سعد إبراهيم القحطاني',
    fullNameEn: 'Rayan Saad Al-Qahtani',
    dateOfBirth: '2019-04-12',
    gender: 'male',
    nationality: 'سعودي',
    nationalId: '1102938475',
    phoneNumber: '0501122334',
    email: 'rayan.student@schoolms.edu',
    address: 'الرياض - حي النرجس - شارع رقم 14',
    status: 'ACTIVE',
    notes: 'طالب متفوق - يعاني من حساسية خفيفة تجاه الفول السوداني',
    createdAt: '2026-01-15T08:30:00.000Z',
    updatedAt: '2026-01-15T08:30:00.000Z',
    createdBy: 'user-super-admin',
  },
  {
    id: 'stu-riyadh-002',
    branchId: 'branch-riyadh',
    studentNumber: 'STU-2026-002',
    firstNameAr: 'نورة',
    lastNameAr: 'الشمري',
    firstNameEn: 'Noura',
    lastNameEn: 'Al-Shammary',
    fullNameAr: 'نورة محمد عبدالله الشمري',
    fullNameEn: 'Noura Mohammed Al-Shammary',
    dateOfBirth: '2019-08-25',
    gender: 'female',
    nationality: 'سعودية',
    nationalId: '1103948576',
    phoneNumber: '0503344556',
    email: 'noura.student@schoolms.edu',
    address: 'الرياض - حي الياسمين - فيلا 22',
    status: 'ACTIVE',
    notes: 'موهبة في الرسم والرياضيات',
    createdAt: '2026-01-16T09:30:00.000Z',
    updatedAt: '2026-01-16T09:30:00.000Z',
    createdBy: 'user-super-admin',
  },
  {
    id: 'stu-riyadh-003',
    branchId: 'branch-riyadh',
    studentNumber: 'STU-2026-003',
    firstNameAr: 'عمر',
    lastNameAr: 'العتيبي',
    firstNameEn: 'Omar',
    lastNameEn: 'Al-Otaibi',
    fullNameAr: 'عمر فهد العتيبي',
    fullNameEn: 'Omar Fahad Al-Otaibi',
    dateOfBirth: '2018-02-14',
    gender: 'male',
    nationality: 'سعودي',
    nationalId: '1104859601',
    address: 'الرياض - حي الصحافة',
    status: 'ACTIVE',
    createdAt: '2026-01-17T11:00:00.000Z',
    updatedAt: '2026-01-17T11:00:00.000Z',
    createdBy: 'user-super-admin',
  },
  {
    id: 'stu-riyadh-004',
    branchId: 'branch-riyadh',
    studentNumber: 'STU-2026-004',
    firstNameAr: 'سارة',
    lastNameAr: 'القحطاني',
    firstNameEn: 'Sara',
    lastNameEn: 'Al-Qahtani',
    fullNameAr: 'سارة سعد إبراهيم القحطاني',
    fullNameEn: 'Sara Saad Al-Qahtani',
    dateOfBirth: '2018-11-05',
    gender: 'female',
    nationality: 'سعودية',
    nationalId: '1105960712',
    address: 'الرياض - حي النرجس',
    status: 'ACTIVE',
    createdAt: '2026-01-17T12:00:00.000Z',
    updatedAt: '2026-01-17T12:00:00.000Z',
    createdBy: 'user-super-admin',
  },
  {
    id: 'stu-jeddah-001',
    branchId: 'branch-jeddah',
    studentNumber: 'STU-2026-005',
    firstNameAr: 'فيصل',
    lastNameAr: 'الزهراني',
    firstNameEn: 'Faisal',
    lastNameEn: 'Al-Zahrani',
    fullNameAr: 'فيصل أحمد حسن الزهراني',
    fullNameEn: 'Faisal Ahmed Al-Zahrani',
    dateOfBirth: '2019-06-18',
    gender: 'male',
    nationality: 'سعودي',
    nationalId: '1106071823',
    phoneNumber: '0504455667',
    address: 'جدة - حي الحمراء',
    status: 'ACTIVE',
    createdAt: '2026-01-18T10:30:00.000Z',
    updatedAt: '2026-01-18T10:30:00.000Z',
    createdBy: 'user-admin',
  },
  {
    id: 'stu-dammam-001',
    branchId: 'branch-dammam',
    studentNumber: 'STU-2026-006',
    firstNameAr: 'عبدالمحسن',
    lastNameAr: 'الدوسري',
    firstNameEn: 'Abdulmohsen',
    lastNameEn: 'Al-Dossary',
    fullNameAr: 'عبدالمحسن خالد عبدالعزيز الدوسري',
    fullNameEn: 'Abdulmohsen Khalid Al-Dossary',
    dateOfBirth: '2019-03-22',
    gender: 'male',
    nationality: 'سعودي',
    nationalId: '1107182934',
    phoneNumber: '0505566778',
    address: 'الدمام - حي الشاطئ',
    status: 'ACTIVE',
    createdAt: '2026-01-20T11:30:00.000Z',
    updatedAt: '2026-01-20T11:30:00.000Z',
    createdBy: 'user-staff',
  },
  {
    id: 'stu-riyadh-005-inactive',
    branchId: 'branch-riyadh',
    studentNumber: 'STU-2026-007',
    firstNameAr: 'تركي',
    lastNameAr: 'المطيري',
    firstNameEn: 'Turki',
    lastNameEn: 'Al-Mutairi',
    fullNameAr: 'تركي فهد المطيري',
    fullNameEn: 'Turki Fahad Al-Mutairi',
    dateOfBirth: '2017-09-10',
    gender: 'male',
    nationality: 'سعودي',
    status: 'INACTIVE',
    notes: 'إيقاف قيد مؤقت لظروف سفر الأسرة',
    createdAt: '2026-01-22T08:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
    createdBy: 'user-manager',
  },
  {
    id: 'stu-riyadh-006-archived',
    branchId: 'branch-riyadh',
    studentNumber: 'STU-2026-008',
    firstNameAr: 'يوسف',
    lastNameAr: 'الغامدي',
    firstNameEn: 'Yousef',
    lastNameEn: 'Al-Ghamdi',
    fullNameAr: 'يوسف سلطان الغامدي',
    fullNameEn: 'Yousef Sultan Al-Ghamdi',
    dateOfBirth: '2016-05-15',
    gender: 'male',
    nationality: 'سعودي',
    status: 'ARCHIVED',
    notes: 'تمت الأرشفة إثر الانتقال إلى مدرسة خارج المملكة',
    createdAt: '2025-09-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
    createdBy: 'user-super-admin',
  },
];

// Seeded Relations between Student and Guardians
const SEEDED_STUDENT_GUARDIANS: StudentGuardianRelation[] = [
  // Rayan has 2 guardians: Father (primary) + Mother (emergency)
  {
    id: 'sg-001',
    studentId: 'stu-riyadh-001',
    guardianId: 'grd-001',
    relationship: 'father',
    isPrimaryContact: true,
    isEmergencyContact: true,
    createdAt: '2026-01-15T08:30:00.000Z',
  },
  {
    id: 'sg-002',
    studentId: 'stu-riyadh-001',
    guardianId: 'grd-002',
    relationship: 'mother',
    isPrimaryContact: false,
    isEmergencyContact: true,
    createdAt: '2026-01-15T08:30:00.000Z',
  },
  // Sara (sister of Rayan) shares same parents
  {
    id: 'sg-003',
    studentId: 'stu-riyadh-004',
    guardianId: 'grd-001',
    relationship: 'father',
    isPrimaryContact: true,
    isEmergencyContact: true,
    createdAt: '2026-01-17T12:00:00.000Z',
  },
  {
    id: 'sg-004',
    studentId: 'stu-riyadh-004',
    guardianId: 'grd-002',
    relationship: 'mother',
    isPrimaryContact: false,
    isEmergencyContact: true,
    createdAt: '2026-01-17T12:00:00.000Z',
  },
  // Noura Al-Shammary
  {
    id: 'sg-005',
    studentId: 'stu-riyadh-002',
    guardianId: 'grd-003',
    relationship: 'father',
    isPrimaryContact: true,
    isEmergencyContact: true,
    createdAt: '2026-01-16T09:30:00.000Z',
  },
  // Faisal Al-Zahrani
  {
    id: 'sg-006',
    studentId: 'stu-jeddah-001',
    guardianId: 'grd-004',
    relationship: 'father',
    isPrimaryContact: true,
    isEmergencyContact: true,
    createdAt: '2026-01-18T10:30:00.000Z',
  },
  // Abdulmohsen Al-Dossary
  {
    id: 'sg-007',
    studentId: 'stu-dammam-001',
    guardianId: 'grd-005',
    relationship: 'father',
    isPrimaryContact: true,
    isEmergencyContact: true,
    createdAt: '2026-01-20T11:30:00.000Z',
  },
];

// Seeded Student Enrollments
const SEEDED_ENROLLMENTS: StudentEnrollment[] = [
  // Rayan: Riyadh -> Primary -> Grade 1 -> Class 1-A
  {
    id: 'enr-001',
    studentId: 'stu-riyadh-001',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    stageId: 'stg-riyadh-pri',
    gradeId: 'grd-riyadh-p1',
    classId: 'cls-riyadh-1a',
    enrollmentDate: '2026-08-30',
    status: 'ENROLLED',
    notes: 'تسجيل مستجد للعام 2026–2027',
    createdAt: '2026-01-15T08:30:00.000Z',
    updatedAt: '2026-01-15T08:30:00.000Z',
  },
  // Noura: Riyadh -> Primary -> Grade 1 -> Class 1-A
  {
    id: 'enr-002',
    studentId: 'stu-riyadh-002',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    stageId: 'stg-riyadh-pri',
    gradeId: 'grd-riyadh-p1',
    classId: 'cls-riyadh-1a',
    enrollmentDate: '2026-08-30',
    status: 'ENROLLED',
    notes: 'تسجيل مستجد للفصل 1/أ',
    createdAt: '2026-01-16T09:30:00.000Z',
    updatedAt: '2026-01-16T09:30:00.000Z',
  },
  // Omar: Riyadh -> Primary -> Grade 1 -> Class 1-A
  {
    id: 'enr-003',
    studentId: 'stu-riyadh-003',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    stageId: 'stg-riyadh-pri',
    gradeId: 'grd-riyadh-p1',
    classId: 'cls-riyadh-1a',
    enrollmentDate: '2026-08-30',
    status: 'ENROLLED',
    notes: 'مترقى بنجاح للفصل 1/أ',
    createdAt: '2026-01-17T11:00:00.000Z',
    updatedAt: '2026-01-17T11:00:00.000Z',
  },
  // Sara: Riyadh -> Primary -> Grade 2 -> Class 2-A
  {
    id: 'enr-004',
    studentId: 'stu-riyadh-004',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    stageId: 'stg-riyadh-pri',
    gradeId: 'grd-riyadh-p2',
    classId: 'cls-riyadh-2a',
    enrollmentDate: '2026-08-30',
    status: 'ENROLLED',
    createdAt: '2026-01-17T12:00:00.000Z',
    updatedAt: '2026-01-17T12:00:00.000Z',
  },
  // Faisal: Jeddah -> Primary -> Grade 1 -> Class 1-A
  {
    id: 'enr-005',
    studentId: 'stu-jeddah-001',
    branchId: 'branch-jeddah',
    academicYearId: 'ay-jeddah-2026',
    stageId: 'stg-jeddah-pri',
    gradeId: 'grd-jeddah-p1',
    classId: 'cls-jeddah-1a',
    enrollmentDate: '2026-08-30',
    status: 'ENROLLED',
    createdAt: '2026-01-18T10:30:00.000Z',
    updatedAt: '2026-01-18T10:30:00.000Z',
  },
  // Abdulmohsen: Dammam -> Primary -> Grade 1 -> Class 1-A
  {
    id: 'enr-006',
    studentId: 'stu-dammam-001',
    branchId: 'branch-dammam',
    academicYearId: 'ay-dammam-2026',
    stageId: 'stg-dammam-pri',
    gradeId: 'grd-dammam-p1',
    classId: 'cls-dammam-p1-a',
    enrollmentDate: '2026-09-01',
    status: 'ENROLLED',
    createdAt: '2026-01-20T11:30:00.000Z',
    updatedAt: '2026-01-20T11:30:00.000Z',
  },
  // Turki (Inactive): Riyadh -> Primary -> Grade 2 -> Class 2-A
  {
    id: 'enr-007',
    studentId: 'stu-riyadh-005-inactive',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    stageId: 'stg-riyadh-pri',
    gradeId: 'grd-riyadh-p2',
    classId: 'cls-riyadh-p2-a',
    enrollmentDate: '2026-08-30',
    status: 'SUSPENDED',
    notes: 'إيقاف مؤقت للقيد الدراسي',
    createdAt: '2026-01-22T08:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
  },
  // Yousef (Archived): previous enrollment in 2025
  {
    id: 'enr-008',
    studentId: 'stu-riyadh-006-archived',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2025',
    stageId: 'stg-riyadh-pri',
    gradeId: 'grd-riyadh-p1',
    classId: 'cls-riyadh-p1-a',
    enrollmentDate: '2025-08-28',
    status: 'WITHDRAWN',
    notes: 'سحب الملف الدراسي والأرشفة',
    createdAt: '2025-09-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
];

export class StudentStorageService {
  private static instance: StudentStorageService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): StudentStorageService {
    if (!StudentStorageService.instance) {
      StudentStorageService.instance = new StudentStorageService();
    }
    return StudentStorageService.instance;
  }

  public initialize(): void {
    if (this.initialized) return;

    if (!localStorage.getItem(STUDENTS_STORAGE_KEY)) {
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(GUARDIANS_STORAGE_KEY)) {
      localStorage.setItem(GUARDIANS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(STUDENT_GUARDIANS_STORAGE_KEY)) {
      localStorage.setItem(STUDENT_GUARDIANS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(ENROLLMENTS_STORAGE_KEY)) {
      localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify([]));
    }

    this.initialized = true;
  }

  // --- ACCESS HELPERS ---
  public checkBranchAccess(actingUser: SafeUser, targetBranchId: string): void {
    if (authStorage.isSuperAdmin(actingUser) || actingUser.hasAllBranchesAccess) return;

    if (!actingUser.branchIds || !actingUser.branchIds.includes(targetBranchId)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_BRANCH_ACCESS',
        targetType: 'STUDENT',
        result: 'DENIED',
        details: `Security block: User "${actingUser.username}" denied access to students in branch "${targetBranchId}"`,
      });
      throw new Error(`غير مصرح لك بالوصول أو إدارة بيانات طلاب الفرع المحدد (${targetBranchId}).`);
    }
  }

  public checkPermission(actingUser: SafeUser, requiredPermission: any): void {
    if (!authStorage.hasPermission(actingUser, requiredPermission)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        targetType: 'STUDENT',
        result: 'DENIED',
        details: `Security violation: Missing permission "${requiredPermission}" for student operation`,
      });
      throw new Error(`ليس لديك الصلاحية الكافية لإتمام هذه العملية (${requiredPermission}).`);
    }
  }

  // --- RAW STORAGE ACCESSORS ---
  public getRawStudents(): Student[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_STUDENTS;
    } catch {
      return SEEDED_STUDENTS;
    }
  }

  private saveStudents(students: Student[]): void {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
  }

  public getRawGuardians(): Guardian[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(GUARDIANS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_GUARDIANS;
    } catch {
      return SEEDED_GUARDIANS;
    }
  }

  private saveGuardians(guardians: Guardian[]): void {
    localStorage.setItem(GUARDIANS_STORAGE_KEY, JSON.stringify(guardians));
  }

  public getRawStudentGuardians(): StudentGuardianRelation[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(STUDENT_GUARDIANS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_STUDENT_GUARDIANS;
    } catch {
      return SEEDED_STUDENT_GUARDIANS;
    }
  }

  private saveStudentGuardians(relations: StudentGuardianRelation[]): void {
    localStorage.setItem(STUDENT_GUARDIANS_STORAGE_KEY, JSON.stringify(relations));
  }

  public getRawEnrollments(): StudentEnrollment[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(ENROLLMENTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_ENROLLMENTS;
    } catch {
      return SEEDED_ENROLLMENTS;
    }
  }

  private saveEnrollments(enrollments: StudentEnrollment[]): void {
    localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(enrollments));
  }

  // --- NUMBER GENERATION ---
  public generateNextStudentNumber(branchId: string): string {
    const students = this.getRawStudents();
    const currentYear = new Date().getFullYear();
    const prefix = `STU-${currentYear}-`;

    let maxNum = 0;
    for (const s of students) {
      if (s.studentNumber && s.studentNumber.startsWith(prefix)) {
        const numPart = parseInt(s.studentNumber.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }

    const nextSeq = (maxNum + 1).toString().padStart(3, '0');
    return `${prefix}${nextSeq}`;
  }

  // --- COMPOSITE STUDENT BUILDER ---
  private buildStudentDetail(
    student: Student,
    allGuardians: Guardian[],
    allRelations: StudentGuardianRelation[],
    allEnrollments: StudentEnrollment[]
  ): StudentDetail {
    const branches = branchStorage.getStoredBranches();
    const branch = branches.find((b) => b.id === student.branchId);

    // Get active enrollment
    const studentEnrollments = allEnrollments.filter((e) => e.studentId === student.id);
    const activeEnrollment = studentEnrollments.find(
      (e) => e.status === 'ENROLLED' || e.status === 'PROMOTED'
    ) || studentEnrollments[studentEnrollments.length - 1];

    let currentYearNameAr: string | undefined;
    let currentYearNameEn: string | undefined;
    let currentStageNameAr: string | undefined;
    let currentStageNameEn: string | undefined;
    let currentGradeNameAr: string | undefined;
    let currentGradeNameEn: string | undefined;
    let currentClassNameAr: string | undefined;
    let currentClassNameEn: string | undefined;
    let currentClassCode: string | undefined;

    if (activeEnrollment) {
      const years = academicStorage.getRawYears();
      const stages = academicStorage.getRawStages();
      const grades = academicStorage.getRawGrades();
      const classes = academicStorage.getRawClasses();

      const year = years.find((y) => y.id === activeEnrollment.academicYearId);
      const stage = stages.find((s) => s.id === activeEnrollment.stageId);
      const grade = grades.find((g) => g.id === activeEnrollment.gradeId);
      const cls = classes.find((c) => c.id === activeEnrollment.classId);

      currentYearNameAr = year?.nameAr;
      currentYearNameEn = year?.nameEn;
      currentStageNameAr = stage?.nameAr;
      currentStageNameEn = stage?.nameEn;
      currentGradeNameAr = grade?.nameAr;
      currentGradeNameEn = grade?.nameEn;
      currentClassNameAr = cls?.nameAr;
      currentClassNameEn = cls?.nameEn;
      currentClassCode = cls?.classCode;
    }

    // Get guardians
    const relations = allRelations.filter((r) => r.studentId === student.id);
    const guardiansList: Array<Guardian & { isPrimaryContact: boolean; isEmergencyContact: boolean; relationId?: string }> = [];

    for (const rel of relations) {
      const g = allGuardians.find((item) => item.id === rel.guardianId);
      if (g) {
        guardiansList.push({
          ...g,
          relationship: rel.relationship || g.relationship,
          isPrimaryContact: rel.isPrimaryContact,
          isEmergencyContact: rel.isEmergencyContact,
          relationId: rel.id,
        });
      }
    }

    const primaryGuardian = guardiansList.find((g) => g.isPrimaryContact) || guardiansList[0];

    return {
      ...student,
      branchNameAr: branch?.nameAr,
      branchNameEn: branch?.nameEn,
      activeEnrollment,
      currentYearNameAr,
      currentYearNameEn,
      currentStageNameAr,
      currentStageNameEn,
      currentGradeNameAr,
      currentGradeNameEn,
      currentClassNameAr,
      currentClassNameEn,
      currentClassCode,
      guardians: guardiansList,
      primaryGuardian,
      enrollmentHistory: studentEnrollments,
    };
  }

  // ==========================================
  // 1. LIST & QUERY STUDENTS
  // ==========================================
  public listStudents(
    actingUser: SafeUser,
    params: StudentFilterParams = {}
  ): {
    students: StudentDetail[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    this.checkPermission(actingUser, 'students.view');

    let allStudents = this.getRawStudents();
    const allGuardians = this.getRawGuardians();
    const allRelations = this.getRawStudentGuardians();
    const allEnrollments = this.getRawEnrollments();

    // 1. Enforce Multi-Branch Security
    const isSuperAdmin =
      actingUser.roleCode === 'SUPER_ADMIN' ||
      actingUser.isProtectedSuperAdmin ||
      actingUser.hasAllBranchesAccess;

    if (!isSuperAdmin) {
      const allowedBranchIds = actingUser.branchIds || [];
      allStudents = allStudents.filter((s) => allowedBranchIds.includes(s.branchId));
    }

    // 2. Filter by specified branch
    if (params.branchId && params.branchId !== 'all') {
      this.checkBranchAccess(actingUser, params.branchId);
      allStudents = allStudents.filter((s) => s.branchId === params.branchId);
    }

    // 3. Filter by Status
    if (params.status && params.status !== 'all') {
      allStudents = allStudents.filter((s) => s.status === params.status);
    }

    // 4. Filter by Gender
    if (params.gender && params.gender !== 'all') {
      allStudents = allStudents.filter((s) => s.gender === params.gender);
    }

    // 5. Academic Enrollment Filters
    if (
      (params.academicYearId && params.academicYearId !== 'all') ||
      (params.stageId && params.stageId !== 'all') ||
      (params.gradeId && params.gradeId !== 'all') ||
      (params.classId && params.classId !== 'all')
    ) {
      const matchingStudentIds = new Set<string>();
      for (const enr of allEnrollments) {
        if (enr.status === 'ENROLLED' || enr.status === 'PROMOTED') {
          let match = true;
          if (params.academicYearId && params.academicYearId !== 'all' && enr.academicYearId !== params.academicYearId) {
            match = false;
          }
          if (params.stageId && params.stageId !== 'all' && enr.stageId !== params.stageId) {
            match = false;
          }
          if (params.gradeId && params.gradeId !== 'all' && enr.gradeId !== params.gradeId) {
            match = false;
          }
          if (params.classId && params.classId !== 'all' && enr.classId !== params.classId) {
            match = false;
          }
          if (match) {
            matchingStudentIds.add(enr.studentId);
          }
        }
      }
      allStudents = allStudents.filter((s) => matchingStudentIds.has(s.id));
    }

    // 6. Search Term (Multi-field)
    if (params.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      allStudents = allStudents.filter((s) => {
        const nameAr = (s.fullNameAr || `${s.firstNameAr} ${s.lastNameAr}`).toLowerCase();
        const nameEn = (s.fullNameEn || `${s.firstNameEn} ${s.lastNameEn}`).toLowerCase();
        const num = (s.studentNumber || '').toLowerCase();
        const natId = (s.nationalId || '').toLowerCase();
        const pass = (s.passportNumber || '').toLowerCase();
        const phone = (s.phoneNumber || '').toLowerCase();

        // Also check guardian names/phones for this student
        const rels = allRelations.filter((r) => r.studentId === s.id);
        const guardianMatch = rels.some((r) => {
          const g = allGuardians.find((item) => item.id === r.guardianId);
          if (!g) return false;
          return g.fullName.toLowerCase().includes(term) || g.phoneNumber.includes(term);
        });

        return (
          nameAr.includes(term) ||
          nameEn.includes(term) ||
          num.includes(term) ||
          natId.includes(term) ||
          pass.includes(term) ||
          phone.includes(term) ||
          guardianMatch
        );
      });
    }

    // 7. Sort
    const sortBy = params.sortBy || 'createdAt';
    const sortDir = params.sortDirection || 'desc';

    allStudents.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.fullNameAr || a.firstNameAr).localeCompare(b.fullNameAr || b.firstNameAr, 'ar');
      } else if (sortBy === 'studentNumber') {
        comparison = a.studentNumber.localeCompare(b.studentNumber);
      } else if (sortBy === 'dateOfBirth') {
        comparison = a.dateOfBirth.localeCompare(b.dateOfBirth);
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else {
        comparison = a.createdAt.localeCompare(b.createdAt);
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    const totalCount = allStudents.length;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 15;
    const page = params.page && params.page > 0 ? params.page : 1;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const startIndex = (page - 1) * pageSize;
    const paginated = allStudents.slice(startIndex, startIndex + pageSize);

    const detailedStudents = paginated.map((s) =>
      this.buildStudentDetail(s, allGuardians, allRelations, allEnrollments)
    );

    return {
      students: detailedStudents,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  }

  // ==========================================
  // 2. GET SINGLE STUDENT
  // ==========================================
  public getStudentById(actingUser: SafeUser, studentId: string): StudentDetail {
    this.checkPermission(actingUser, 'students.view');
    const students = this.getRawStudents();
    const student = students.find((s) => s.id === studentId);

    if (!student) {
      throw new Error(`الطالب ذو المعرف (${studentId}) غير موجود.`);
    }

    this.checkBranchAccess(actingUser, student.branchId);

    return this.buildStudentDetail(
      student,
      this.getRawGuardians(),
      this.getRawStudentGuardians(),
      this.getRawEnrollments()
    );
  }

  // ==========================================
  // 3. REGISTER STUDENT & ENROLLMENT (ATOMIC)
  // ==========================================
  public createStudentWithEnrollment(
    actingUser: SafeUser,
    dto: CreateStudentDTO
  ): StudentDetail {
    this.checkPermission(actingUser, 'students.create');
    this.checkBranchAccess(actingUser, dto.branchId);

    // Validation 1: Student Number uniqueness
    const allStudents = this.getRawStudents();
    const studentNumber = dto.studentNumber?.trim() || this.generateNextStudentNumber(dto.branchId);

    const existingNum = allStudents.find(
      (s) => s.studentNumber.toLowerCase() === studentNumber.toLowerCase()
    );
    if (existingNum) {
      throw new Error(`الرقم التعريفي للطالب (${studentNumber}) مستخدم بالفعل مسبقاً.`);
    }

    // Validation 2: Names validation
    if (!dto.firstNameAr?.trim() || !dto.lastNameAr?.trim()) {
      throw new Error('الاسم الأول واسم العائلة باللغة العربية مطلوبان.');
    }
    if (!dto.firstNameEn?.trim() || !dto.lastNameEn?.trim()) {
      throw new Error('First name and Last name in English are required.');
    }
    if (!dto.dateOfBirth) {
      throw new Error('تاريخ ميلاد الطالب مطلوب.');
    }

    // Validation 3: Academic Hierarchy Consistency Check
    const academicYears = academicStorage.getRawYears();
    const academicStages = academicStorage.getRawStages();
    const grades = academicStorage.getRawGrades();
    const classes = academicStorage.getRawClasses();

    const year = academicYears.find((y) => y.id === dto.academicYearId);
    if (!year || year.branchId !== dto.branchId) {
      throw new Error('العام الدراسي المحدد غير صالح أو لا ينتمي لنفس الفرع.');
    }

    const stage = academicStages.find((s) => s.id === dto.stageId);
    if (!stage || stage.branchId !== dto.branchId) {
      throw new Error('المرحلة الدراسية المحددة غير صالحة لهذا الفرع.');
    }

    const grade = grades.find((g) => g.id === dto.gradeId);
    if (!grade || grade.stageId !== dto.stageId || grade.branchId !== dto.branchId) {
      throw new Error('الصف الدراسي المحدد لا ينتمي للمرحلة الدراسية أو الفرع المختار.');
    }

    const targetClass = classes.find((c) => c.id === dto.classId);
    if (!targetClass || targetClass.gradeId !== dto.gradeId || targetClass.branchId !== dto.branchId) {
      throw new Error('الفصل / الشعبة المحددة لا تنتمي للصف الدراسي أو الفرع المختار.');
    }

    // Validation 4: Class Capacity Check
    const allEnrollments = this.getRawEnrollments();
    const currentClassEnrollments = allEnrollments.filter(
      (e) => e.classId === targetClass.id && (e.status === 'ENROLLED' || e.status === 'PROMOTED')
    );

    if (currentClassEnrollments.length >= targetClass.capacity) {
      throw new Error(
        `الفصل الدراسي "${targetClass.nameAr}" مكتمل بالسعة القصوى (${targetClass.capacity} طالب). لا يمكن تسجيل المزيد.`
      );
    }

    // Validation 5: Guardian validation
    if (!dto.guardian || !dto.guardian.fullName?.trim() || !dto.guardian.phoneNumber?.trim()) {
      throw new Error('بيانات ولي الأمر الأساسي (الاسم الكامل ورقم الهاتف) مطلوبة.');
    }

    const now = new Date().toISOString();
    const studentId = `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Create Student Entity
    const newStudent: Student = {
      id: studentId,
      branchId: dto.branchId,
      studentNumber,
      firstNameAr: dto.firstNameAr.trim(),
      lastNameAr: dto.lastNameAr.trim(),
      firstNameEn: dto.firstNameEn.trim(),
      lastNameEn: dto.lastNameEn.trim(),
      fullNameAr: `${dto.firstNameAr.trim()} ${dto.lastNameAr.trim()}`,
      fullNameEn: `${dto.firstNameEn.trim()} ${dto.lastNameEn.trim()}`,
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender,
      nationality: dto.nationality || 'سعودي',
      nationalId: dto.nationalId?.trim() || undefined,
      passportNumber: dto.passportNumber?.trim() || undefined,
      phoneNumber: dto.phoneNumber?.trim() || undefined,
      email: dto.email?.trim() || undefined,
      address: dto.address?.trim() || undefined,
      photoUrl: dto.photoUrl,
      notes: dto.notes?.trim() || undefined,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      createdBy: actingUser.id,
      updatedBy: actingUser.id,
    };

    // Create Guardian 1
    const allGuardians = this.getRawGuardians();
    const allRelations = this.getRawStudentGuardians();

    const guardian1Id = `grd-${Date.now()}-1`;
    const newGuardian1: Guardian = {
      id: guardian1Id,
      branchId: dto.branchId,
      fullName: dto.guardian.fullName.trim(),
      relationship: dto.guardian.relationship || 'father',
      phoneNumber: dto.guardian.phoneNumber.trim(),
      email: dto.guardian.email?.trim() || undefined,
      address: dto.guardian.address?.trim() || undefined,
      isPrimaryContact: true,
      isEmergencyContact: dto.guardian.isEmergencyContact ?? true,
      createdAt: now,
      updatedAt: now,
    };
    allGuardians.push(newGuardian1);

    allRelations.push({
      id: `rel-${Date.now()}-1`,
      studentId,
      guardianId: guardian1Id,
      relationship: dto.guardian.relationship || 'father',
      isPrimaryContact: true,
      isEmergencyContact: dto.guardian.isEmergencyContact ?? true,
      createdAt: now,
    });

    // Optional Secondary Guardian
    if (dto.secondaryGuardian && dto.secondaryGuardian.fullName?.trim() && dto.secondaryGuardian.phoneNumber?.trim()) {
      const guardian2Id = `grd-${Date.now()}-2`;
      const newGuardian2: Guardian = {
        id: guardian2Id,
        branchId: dto.branchId,
        fullName: dto.secondaryGuardian.fullName.trim(),
        relationship: dto.secondaryGuardian.relationship || 'mother',
        phoneNumber: dto.secondaryGuardian.phoneNumber.trim(),
        email: dto.secondaryGuardian.email?.trim() || undefined,
        address: dto.secondaryGuardian.address?.trim() || undefined,
        isPrimaryContact: false,
        isEmergencyContact: dto.secondaryGuardian.isEmergencyContact ?? true,
        createdAt: now,
        updatedAt: now,
      };
      allGuardians.push(newGuardian2);

      allRelations.push({
        id: `rel-${Date.now()}-2`,
        studentId,
        guardianId: guardian2Id,
        relationship: dto.secondaryGuardian.relationship || 'mother',
        isPrimaryContact: false,
        isEmergencyContact: dto.secondaryGuardian.isEmergencyContact ?? true,
        createdAt: now,
      });
    }

    // Create Enrollment Record
    const enrollmentId = `enr-${Date.now()}`;
    const newEnrollment: StudentEnrollment = {
      id: enrollmentId,
      studentId,
      branchId: dto.branchId,
      academicYearId: dto.academicYearId,
      stageId: dto.stageId,
      gradeId: dto.gradeId,
      classId: dto.classId,
      enrollmentDate: dto.enrollmentDate || now.split('T')[0],
      status: 'ENROLLED',
      notes: 'تسجيل جديد',
      createdAt: now,
      updatedAt: now,
    };
    allEnrollments.push(newEnrollment);

    // Save All Data
    allStudents.push(newStudent);
    this.saveStudents(allStudents);
    this.saveGuardians(allGuardians);
    this.saveStudentGuardians(allRelations);
    this.saveEnrollments(allEnrollments);

    // Audit Logging
    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'STUDENT_REGISTERED',
      targetType: 'STUDENT',
      targetId: studentId,
      targetIdentifier: studentNumber,
      branchContext: dto.branchId,
      result: 'SUCCESS',
      details: `Student "${newStudent.fullNameAr}" registered with student # ${studentNumber} and enrolled in class "${targetClass.nameAr}".`,
    });

    return this.buildStudentDetail(newStudent, allGuardians, allRelations, allEnrollments);
  }

  // ==========================================
  // 4. UPDATE STUDENT BIOGRAPHICAL DETAILS
  // ==========================================
  public updateStudent(
    actingUser: SafeUser,
    studentId: string,
    updates: UpdateStudentDTO
  ): StudentDetail {
    this.checkPermission(actingUser, 'students.edit');

    const students = this.getRawStudents();
    const index = students.findIndex((s) => s.id === studentId);
    if (index === -1) {
      throw new Error(`الطالب ذو المعرف (${studentId}) غير موجود.`);
    }

    const current = students[index];
    this.checkBranchAccess(actingUser, current.branchId);

    const now = new Date().toISOString();
    const updatedStudent: Student = {
      ...current,
      firstNameAr: updates.firstNameAr?.trim() || current.firstNameAr,
      lastNameAr: updates.lastNameAr?.trim() || current.lastNameAr,
      firstNameEn: updates.firstNameEn?.trim() || current.firstNameEn,
      lastNameEn: updates.lastNameEn?.trim() || current.lastNameEn,
      fullNameAr: `${updates.firstNameAr?.trim() || current.firstNameAr} ${updates.lastNameAr?.trim() || current.lastNameAr}`,
      fullNameEn: `${updates.firstNameEn?.trim() || current.firstNameEn} ${updates.lastNameEn?.trim() || current.lastNameEn}`,
      dateOfBirth: updates.dateOfBirth || current.dateOfBirth,
      gender: updates.gender || current.gender,
      nationality: updates.nationality || current.nationality,
      nationalId: updates.nationalId !== undefined ? updates.nationalId.trim() : current.nationalId,
      passportNumber: updates.passportNumber !== undefined ? updates.passportNumber.trim() : current.passportNumber,
      phoneNumber: updates.phoneNumber !== undefined ? updates.phoneNumber.trim() : current.phoneNumber,
      email: updates.email !== undefined ? updates.email.trim() : current.email,
      address: updates.address !== undefined ? updates.address.trim() : current.address,
      photoUrl: updates.photoUrl !== undefined ? updates.photoUrl : current.photoUrl,
      notes: updates.notes !== undefined ? updates.notes.trim() : current.notes,
      status: updates.status || current.status,
      updatedAt: now,
      updatedBy: actingUser.id,
    };

    students[index] = updatedStudent;
    this.saveStudents(students);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'STUDENT_UPDATED',
      targetType: 'STUDENT',
      targetId: studentId,
      targetIdentifier: current.studentNumber,
      branchContext: current.branchId,
      result: 'SUCCESS',
      details: `Profile updated for student "${updatedStudent.fullNameAr}" (#${current.studentNumber}).`,
    });

    return this.buildStudentDetail(
      updatedStudent,
      this.getRawGuardians(),
      this.getRawStudentGuardians(),
      this.getRawEnrollments()
    );
  }

  // ==========================================
  // 5. UPDATE STUDENT STATUS (LIFECYCLE)
  // ==========================================
  public changeStudentStatus(
    actingUser: SafeUser,
    studentId: string,
    newStatus: StudentStatus,
    reason?: string
  ): StudentDetail {
    this.checkPermission(actingUser, 'students.edit');

    const students = this.getRawStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      throw new Error(`الطالب ذو المعرف (${studentId}) غير موجود.`);
    }

    this.checkBranchAccess(actingUser, student.branchId);

    const oldStatus = student.status;
    if (oldStatus === newStatus) return this.getStudentById(actingUser, studentId);

    student.status = newStatus;
    student.updatedAt = new Date().toISOString();
    student.updatedBy = actingUser.id;

    // If changing to INACTIVE or ARCHIVED, adjust active enrollment status
    const allEnrollments = this.getRawEnrollments();
    const activeEnrIndex = allEnrollments.findIndex(
      (e) => e.studentId === studentId && (e.status === 'ENROLLED' || e.status === 'PROMOTED')
    );

    if (activeEnrIndex !== -1) {
      if (newStatus === 'INACTIVE') {
        allEnrollments[activeEnrIndex].status = 'SUSPENDED';
        allEnrollments[activeEnrIndex].notes = reason || 'إيقاف قيد مؤقت';
        allEnrollments[activeEnrIndex].updatedAt = new Date().toISOString();
      } else if (newStatus === 'ARCHIVED') {
        allEnrollments[activeEnrIndex].status = 'WITHDRAWN';
        allEnrollments[activeEnrIndex].notes = reason || 'أرشفة القيد وسحب الملف';
        allEnrollments[activeEnrIndex].updatedAt = new Date().toISOString();
      }
      this.saveEnrollments(allEnrollments);
    } else if (newStatus === 'ACTIVE') {
      // Re-activating: check if suspended enrollment exists and restore to ENROLLED
      const suspendedIndex = allEnrollments.findIndex(
        (e) => e.studentId === studentId && e.status === 'SUSPENDED'
      );
      if (suspendedIndex !== -1) {
        allEnrollments[suspendedIndex].status = 'ENROLLED';
        allEnrollments[suspendedIndex].notes = 'إعادة تفعيل القيد';
        allEnrollments[suspendedIndex].updatedAt = new Date().toISOString();
        this.saveEnrollments(allEnrollments);
      }
    }

    this.saveStudents(students);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'STUDENT_STATUS_CHANGED',
      targetType: 'STUDENT',
      targetId: studentId,
      targetIdentifier: student.studentNumber,
      branchContext: student.branchId,
      result: 'SUCCESS',
      details: `Student status changed from ${oldStatus} to ${newStatus}. Reason: ${reason || 'N/A'}`,
    });

    return this.buildStudentDetail(
      student,
      this.getRawGuardians(),
      this.getRawStudentGuardians(),
      allEnrollments
    );
  }

  // ==========================================
  // 6. ARCHIVE STUDENT (AUTHORIZED DELETION)
  // ==========================================
  public archiveStudent(
    actingUser: SafeUser,
    studentId: string,
    reason: string
  ): StudentDetail {
    this.checkPermission(actingUser, 'students.delete');

    const students = this.getRawStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      throw new Error(`الطالب ذو المعرف (${studentId}) غير موجود.`);
    }

    this.checkBranchAccess(actingUser, student.branchId);

    student.status = 'ARCHIVED';
    student.notes = (student.notes ? `${student.notes}\n` : '') + `[تمت الأرشفة]: ${reason}`;
    student.updatedAt = new Date().toISOString();
    student.updatedBy = actingUser.id;

    // Update active enrollments to WITHDRAWN
    const enrollments = this.getRawEnrollments();
    enrollments.forEach((e) => {
      if (e.studentId === studentId && (e.status === 'ENROLLED' || e.status === 'PROMOTED')) {
        e.status = 'WITHDRAWN';
        e.notes = `أرشفة: ${reason}`;
        e.updatedAt = new Date().toISOString();
      }
    });

    this.saveStudents(students);
    this.saveEnrollments(enrollments);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'STUDENT_ARCHIVED',
      targetType: 'STUDENT',
      targetId: studentId,
      targetIdentifier: student.studentNumber,
      branchContext: student.branchId,
      result: 'SUCCESS',
      details: `Student "${student.fullNameAr}" (#${student.studentNumber}) was archived. Reason: ${reason}`,
    });

    return this.buildStudentDetail(
      student,
      this.getRawGuardians(),
      this.getRawStudentGuardians(),
      enrollments
    );
  }

  // ==========================================
  // 7. TRANSFER STUDENT CLASS / SECTION
  // ==========================================
  public transferStudentClass(
    actingUser: SafeUser,
    studentId: string,
    newClassId: string,
    reason: string
  ): StudentDetail {
    this.checkPermission(actingUser, 'students.edit');

    const students = this.getRawStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      throw new Error(`الطالب ذو المعرف (${studentId}) غير موجود.`);
    }

    this.checkBranchAccess(actingUser, student.branchId);

    const classes = academicStorage.getRawClasses();
    const targetClass = classes.find((c) => c.id === newClassId);
    if (!targetClass) {
      throw new Error(`الفصل الدراسي الهدف غير موجود.`);
    }
    if (targetClass.branchId !== student.branchId) {
      throw new Error(`لا يمكن نقل الطالب إلى فصل في فرع مختلف عبر هذه الشاشة. استخدم النقل بين الفروع.`);
    }

    // Check capacity of target class
    const allEnrollments = this.getRawEnrollments();
    const currentOccupancy = allEnrollments.filter(
      (e) => e.classId === targetClass.id && (e.status === 'ENROLLED' || e.status === 'PROMOTED')
    ).length;

    if (currentOccupancy >= targetClass.capacity) {
      throw new Error(`الفصل الهدف "${targetClass.nameAr}" مكتمل بالسعة القصوى (${targetClass.capacity} طالب).`);
    }

    // Find active enrollment
    const activeEnr = allEnrollments.find(
      (e) => e.studentId === studentId && (e.status === 'ENROLLED' || e.status === 'PROMOTED')
    );

    if (activeEnr && activeEnr.classId === newClassId) {
      throw new Error('الطالب مقيد بالفعل في نفس هذا الفصل حالياً.');
    }

    const now = new Date().toISOString();

    if (activeEnr) {
      activeEnr.status = 'TRANSFERRED';
      activeEnr.notes = `تم النقل إلى الفصل ${targetClass.nameAr}. السبب: ${reason}`;
      activeEnr.updatedAt = now;
    }

    // Create new enrollment
    const newEnrollment: StudentEnrollment = {
      id: `enr-${Date.now()}`,
      studentId,
      branchId: student.branchId,
      academicYearId: targetClass.academicYearId,
      stageId: targetClass.stageId,
      gradeId: targetClass.gradeId,
      classId: targetClass.id,
      enrollmentDate: now.split('T')[0],
      status: 'ENROLLED',
      previousClassId: activeEnr ? activeEnr.classId : undefined,
      notes: `نقل فصل: ${reason}`,
      createdAt: now,
      updatedAt: now,
    };
    allEnrollments.push(newEnrollment);

    this.saveEnrollments(allEnrollments);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'STUDENT_TRANSFERRED',
      targetType: 'STUDENT',
      targetId: studentId,
      targetIdentifier: student.studentNumber,
      branchContext: student.branchId,
      result: 'SUCCESS',
      details: `Student "${student.fullNameAr}" transferred to class "${targetClass.nameAr}". Reason: ${reason}`,
    });

    return this.buildStudentDetail(
      student,
      this.getRawGuardians(),
      this.getRawStudentGuardians(),
      allEnrollments
    );
  }

  // ==========================================
  // 8. GUARDIAN MANAGEMENT
  // ==========================================
  public addGuardianToStudent(
    actingUser: SafeUser,
    studentId: string,
    guardianData: {
      fullName: string;
      relationship: string;
      phoneNumber: string;
      email?: string;
      address?: string;
      isPrimaryContact: boolean;
      isEmergencyContact: boolean;
      notes?: string;
    }
  ): StudentDetail {
    this.checkPermission(actingUser, 'students.edit');

    const students = this.getRawStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      throw new Error(`الطالب ذو المعرف (${studentId}) غير موجود.`);
    }

    this.checkBranchAccess(actingUser, student.branchId);

    if (!guardianData.fullName?.trim() || !guardianData.phoneNumber?.trim()) {
      throw new Error('اسم ولي الأمر ورقم الهاتف مطلوبان.');
    }

    const allGuardians = this.getRawGuardians();
    const allRelations = this.getRawStudentGuardians();
    const now = new Date().toISOString();

    // If this new guardian is primary contact, remove primary flag from existing relations
    if (guardianData.isPrimaryContact) {
      allRelations.forEach((r) => {
        if (r.studentId === studentId) {
          r.isPrimaryContact = false;
        }
      });
    }

    const guardianId = `grd-${Date.now()}`;
    const newGuardian: Guardian = {
      id: guardianId,
      branchId: student.branchId,
      fullName: guardianData.fullName.trim(),
      relationship: guardianData.relationship,
      phoneNumber: guardianData.phoneNumber.trim(),
      email: guardianData.email?.trim() || undefined,
      address: guardianData.address?.trim() || undefined,
      isPrimaryContact: guardianData.isPrimaryContact,
      isEmergencyContact: guardianData.isEmergencyContact,
      notes: guardianData.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    allGuardians.push(newGuardian);

    allRelations.push({
      id: `rel-${Date.now()}`,
      studentId,
      guardianId,
      relationship: guardianData.relationship,
      isPrimaryContact: guardianData.isPrimaryContact,
      isEmergencyContact: guardianData.isEmergencyContact,
      createdAt: now,
    });

    this.saveGuardians(allGuardians);
    this.saveStudentGuardians(allRelations);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'GUARDIAN_ADDED',
      targetType: 'GUARDIAN',
      targetId: guardianId,
      branchContext: student.branchId,
      result: 'SUCCESS',
      details: `Added guardian "${newGuardian.fullName}" (${newGuardian.relationship}) for student "${student.fullNameAr}".`,
    });

    return this.buildStudentDetail(
      student,
      allGuardians,
      allRelations,
      this.getRawEnrollments()
    );
  }

  public updateGuardian(
    actingUser: SafeUser,
    guardianId: string,
    updates: Partial<Guardian>
  ): Guardian {
    this.checkPermission(actingUser, 'students.edit');

    const guardians = this.getRawGuardians();
    const guardian = guardians.find((g) => g.id === guardianId);
    if (!guardian) {
      throw new Error(`ولي الأمر غير موجود.`);
    }

    this.checkBranchAccess(actingUser, guardian.branchId);

    const now = new Date().toISOString();
    Object.assign(guardian, {
      fullName: updates.fullName?.trim() || guardian.fullName,
      relationship: updates.relationship || guardian.relationship,
      phoneNumber: updates.phoneNumber?.trim() || guardian.phoneNumber,
      email: updates.email !== undefined ? updates.email.trim() : guardian.email,
      address: updates.address !== undefined ? updates.address.trim() : guardian.address,
      notes: updates.notes !== undefined ? updates.notes.trim() : guardian.notes,
      updatedAt: now,
    });

    this.saveGuardians(guardians);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'GUARDIAN_UPDATED',
      targetType: 'GUARDIAN',
      targetId: guardianId,
      branchContext: guardian.branchId,
      result: 'SUCCESS',
      details: `Guardian "${guardian.fullName}" details updated.`,
    });

    return guardian;
  }

  // ==========================================
  // 9. AGGREGATED STUDENT STATISTICS
  // ==========================================
  public getStudentStats(actingUser: SafeUser, branchId?: string): StudentStats {
    this.checkPermission(actingUser, 'students.view');

    let students = this.getRawStudents();
    const isSuperAdmin =
      actingUser.roleCode === 'SUPER_ADMIN' ||
      actingUser.isProtectedSuperAdmin ||
      actingUser.hasAllBranchesAccess;

    if (!isSuperAdmin) {
      const allowed = actingUser.branchIds || [];
      students = students.filter((s) => allowed.includes(s.branchId));
    }

    if (branchId && branchId !== 'all') {
      this.checkBranchAccess(actingUser, branchId);
      students = students.filter((s) => s.branchId === branchId);
    }

    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === 'ACTIVE').length;
    const inactiveStudents = students.filter((s) => s.status === 'INACTIVE').length;
    const archivedStudents = students.filter((s) => s.status === 'ARCHIVED').length;
    const maleStudents = students.filter((s) => s.gender === 'male').length;
    const femaleStudents = students.filter((s) => s.gender === 'female').length;

    // Enrolled in active academic year
    const enrollments = this.getRawEnrollments();
    const enrolledCurrentYear = enrollments.filter(
      (e) => (e.status === 'ENROLLED' || e.status === 'PROMOTED') && students.some((s) => s.id === e.studentId)
    ).length;

    return {
      branchId,
      totalStudents,
      activeStudents,
      inactiveStudents,
      archivedStudents,
      maleStudents,
      femaleStudents,
      enrolledCurrentYear,
    };
  }
}

export const studentStorage = StudentStorageService.getInstance();
