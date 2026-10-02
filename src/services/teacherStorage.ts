import {
  Teacher,
  TeacherDetail,
  TeacherStatus,
  EmploymentType,
  TeacherClassRole,
  TeacherQualification,
  TeacherSubject,
  TeacherClass,
  CreateTeacherDTO,
  UpdateTeacherDTO,
  TeacherFilterParams,
  TeacherStats,
} from '../types/teacher';
import { SafeUser } from '../types/auth';
import { authStorage } from './authStorage';
import { academicStorage } from './academicStorage';
import { branchStorage } from './branchStorage';

const TEACHERS_STORAGE_KEY = 'sms_teachers_v5';
const TEACHER_QUALIFICATIONS_STORAGE_KEY = 'sms_teacher_qualifications_v5';
const TEACHER_SUBJECTS_STORAGE_KEY = 'sms_teacher_subjects_v5';
const TEACHER_CLASSES_STORAGE_KEY = 'sms_teacher_classes_v5';

// Realistic multi-branch seed teachers
const SEEDED_TEACHERS: Teacher[] = [
  // Riyadh Campus
  {
    id: 'tch-r-001',
    branchId: 'branch-riyadh',
    teacherNumber: 'TCH-2026-001',
    firstNameAr: 'فهد',
    middleNameAr: 'عبدالعزيز',
    lastNameAr: 'المنصور',
    firstNameEn: 'Fahad',
    middleNameEn: 'Abdulaziz',
    lastNameEn: 'Al-Mansoor',
    fullNameAr: 'فهد عبدالعزيز المنصور',
    fullNameEn: 'Fahad Abdulaziz Al-Mansoor',
    gender: 'male',
    dateOfBirth: '1984-04-12',
    nationality: 'سعودي',
    nationalId: '1087654321',
    passportNumber: 'K1298456',
    phoneNumber: '+966501234567',
    alternatePhoneNumber: '+966509876543',
    email: 'fahad.mansoor@schoolms.edu',
    address: 'الرياض - حي النرجس',
    hireDate: '2020-08-15',
    employmentStatus: 'ACTIVE',
    employmentType: 'FULL_TIME',
    specialization: 'الرياضيات المتقدمة',
    perLessonRate: 0,
    notes: 'معلم متميز ورئيس قسم الرياضيات بمجمع الرياض',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
    createdBy: 'user-super-admin',
  },
  {
    id: 'tch-r-002',
    branchId: 'branch-riyadh',
    teacherNumber: 'TCH-2026-002',
    firstNameAr: 'سارة',
    middleNameAr: 'خالد',
    lastNameAr: 'العتيبي',
    firstNameEn: 'Sarah',
    middleNameEn: 'Khaled',
    lastNameEn: 'Al-Otaibi',
    fullNameAr: 'سارة خالد العتيبي',
    fullNameEn: 'Sarah Khaled Al-Otaibi',
    gender: 'female',
    dateOfBirth: '1989-11-23',
    nationality: 'سعودية',
    nationalId: '1098765432',
    passportNumber: 'K4498123',
    phoneNumber: '+966551239876',
    email: 'sarah.otaibi@schoolms.edu',
    address: 'الرياض - حي الياسمين',
    hireDate: '2021-08-20',
    employmentStatus: 'ACTIVE',
    employmentType: 'FULL_TIME',
    specialization: 'اللغة العربية والتربية الإسلامية',
    notes: 'مشرفة الإذاعة المدرسية ورائدة نشاط متميزة',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
    createdBy: 'user-super-admin',
  },
  {
    id: 'tch-r-003',
    branchId: 'branch-riyadh',
    teacherNumber: 'TCH-2026-003',
    firstNameAr: 'طارق',
    middleNameAr: 'يوسف',
    lastNameAr: 'القحطاني',
    firstNameEn: 'Tariq',
    middleNameEn: 'Yousef',
    lastNameEn: 'Al-Qahtani',
    fullNameAr: 'طارق يوسف القحطاني',
    fullNameEn: 'Tariq Yousef Al-Qahtani',
    gender: 'male',
    dateOfBirth: '1981-06-18',
    nationality: 'سعودي',
    nationalId: '1076543219',
    phoneNumber: '+966541287654',
    email: 'tariq.qahtani@schoolms.edu',
    address: 'الرياض - حي الملقا',
    hireDate: '2019-09-01',
    employmentStatus: 'ACTIVE',
    employmentType: 'FULL_TIME',
    specialization: 'العلوم والفيزياء',
    notes: 'مشرف المختبرات العلمية',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
    createdBy: 'user-super-admin',
  },
  {
    id: 'tch-r-004',
    branchId: 'branch-riyadh',
    teacherNumber: 'TCH-2026-004',
    firstNameAr: 'مها',
    middleNameAr: 'عبدالله',
    lastNameAr: 'الدوسري',
    firstNameEn: 'Maha',
    middleNameEn: 'Abdullah',
    lastNameEn: 'Al-Dossary',
    fullNameAr: 'مها عبدالله الدوسري',
    fullNameEn: 'Maha Abdullah Al-Dossary',
    gender: 'female',
    dateOfBirth: '1992-02-14',
    nationality: 'سعودية',
    nationalId: '1065432198',
    phoneNumber: '+966567891234',
    email: 'maha.dossary@schoolms.edu',
    address: 'الرياض - حي العقيق',
    hireDate: '2022-01-10',
    employmentStatus: 'ON_LEAVE',
    employmentType: 'PART_TIME',
    specialization: 'اللغة الإنجليزية',
    notes: 'في إجازة تدريبية خارجية معتمدة',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
    createdBy: 'user-super-admin',
  },

  // Jeddah Campus
  {
    id: 'tch-j-001',
    branchId: 'branch-jeddah',
    teacherNumber: 'TCH-2026-005',
    firstNameAr: 'خالد',
    middleNameAr: 'نايف',
    lastNameAr: 'الشريف',
    firstNameEn: 'Khaled',
    middleNameEn: 'Nayef',
    lastNameEn: 'Al-Shareef',
    fullNameAr: 'خالد نايف الشريف',
    fullNameEn: 'Khaled Nayef Al-Shareef',
    gender: 'male',
    dateOfBirth: '1986-09-05',
    nationality: 'سعودي',
    nationalId: '1054321987',
    passportNumber: 'J9823412',
    phoneNumber: '+966533344455',
    email: 'teacher@schoolms.edu',
    address: 'جدة - حي الحمراء',
    hireDate: '2021-08-15',
    employmentStatus: 'ACTIVE',
    employmentType: 'FULL_TIME',
    specialization: 'العلوم الطبيعية',
    userId: 'user-teacher', // Linked application user account
    notes: 'مرتبط بحساب تسجيل دخول النظام',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
    createdBy: 'user-super-admin',
  },
  {
    id: 'tch-j-002',
    branchId: 'branch-jeddah',
    teacherNumber: 'TCH-2026-006',
    firstNameAr: 'فاطمة',
    middleNameAr: 'عمر',
    lastNameAr: 'السلمي',
    firstNameEn: 'Fatima',
    middleNameEn: 'Omar',
    lastNameEn: 'Al-Sulami',
    fullNameAr: 'فاطمة عمر السلمي',
    fullNameEn: 'Fatima Omar Al-Sulami',
    gender: 'female',
    dateOfBirth: '1990-03-30',
    nationality: 'سعودية',
    nationalId: '1043219876',
    phoneNumber: '+966555566677',
    email: 'fatima.sulami@schoolms.edu',
    address: 'جدة - حي الروضة',
    hireDate: '2022-08-25',
    employmentStatus: 'ACTIVE',
    employmentType: 'FULL_TIME',
    specialization: 'الرياضيات والجبر',
    notes: 'معلمة موهبة والابتكار العلمي',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
    createdBy: 'user-super-admin',
  },
  {
    id: 'tch-j-003',
    branchId: 'branch-jeddah',
    teacherNumber: 'TCH-2026-007',
    firstNameAr: 'زياد',
    middleNameAr: 'سامي',
    lastNameAr: 'الغامدي',
    firstNameEn: 'Ziyad',
    middleNameEn: 'Sami',
    lastNameEn: 'Al-Ghamdi',
    fullNameAr: 'زياد سامي الغامدي',
    fullNameEn: 'Ziyad Sami Al-Ghamdi',
    gender: 'male',
    dateOfBirth: '1993-07-21',
    nationality: 'سعودي',
    nationalId: '1032198765',
    phoneNumber: '+966512349988',
    email: 'ziyad.ghamdi@schoolms.edu',
    address: 'جدة - حي الشاطئ',
    hireDate: '2023-09-01',
    employmentStatus: 'ACTIVE',
    employmentType: 'TEMPORARY',
    specialization: 'الحاسب الآلي والبرمجة',
    perLessonRate: 150.0,
    notes: 'معلم مؤقت بنظام الحصص الإضافية',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
    createdBy: 'user-super-admin',
  },

  // Dammam Campus
  {
    id: 'tch-d-001',
    branchId: 'branch-dammam',
    teacherNumber: 'TCH-2026-008',
    firstNameAr: 'ريم',
    middleNameAr: 'أحمد',
    lastNameAr: 'البوعينين',
    firstNameEn: 'Reem',
    middleNameEn: 'Ahmed',
    lastNameEn: 'Al-Buainain',
    fullNameAr: 'ريم أحمد البوعينين',
    fullNameEn: 'Reem Ahmed Al-Buainain',
    gender: 'female',
    dateOfBirth: '1987-12-05',
    nationality: 'سعودية',
    nationalId: '1021987654',
    phoneNumber: '+966598761234',
    email: 'reem.buainain@schoolms.edu',
    address: 'الدمام - حي الشاطئ الشرقي',
    hireDate: '2021-01-15',
    employmentStatus: 'ACTIVE',
    employmentType: 'FULL_TIME',
    specialization: 'العلوم الحيوية والكيمياء',
    notes: 'منسقة الجودة والاعتماد الأكاديمي الدولي',
    createdAt: '2026-01-14T08:00:00.000Z',
    updatedAt: '2026-01-14T08:00:00.000Z',
    createdBy: 'user-super-admin',
  },
  {
    id: 'tch-d-002',
    branchId: 'branch-dammam',
    teacherNumber: 'TCH-2026-009',
    firstNameAr: 'عمر',
    middleNameAr: 'إبراهيم',
    lastNameAr: 'الخالدي',
    firstNameEn: 'Omar',
    middleNameEn: 'Ibrahim',
    lastNameEn: 'Al-Khaldi',
    fullNameAr: 'عمر إبراهيم الخالدي',
    fullNameEn: 'Omar Ibrahim Al-Khaldi',
    gender: 'male',
    dateOfBirth: '1983-05-19',
    nationality: 'سعودي',
    nationalId: '1019876543',
    phoneNumber: '+966577889900',
    email: 'omar.khaldi@schoolms.edu',
    address: 'الدمام - حي الفاخرية',
    hireDate: '2020-09-01',
    employmentStatus: 'ACTIVE',
    employmentType: 'CONTRACT',
    specialization: 'التربية الإسلامية والدراسات القرآنية',
    notes: 'إمام وخطيب معتمد ومعلم تربية إسلامية',
    createdAt: '2026-01-14T08:00:00.000Z',
    updatedAt: '2026-01-14T08:00:00.000Z',
    createdBy: 'user-super-admin',
  },
  {
    id: 'tch-r-archived',
    branchId: 'branch-riyadh',
    teacherNumber: 'TCH-2025-099',
    firstNameAr: 'عبدالمحسن',
    middleNameAr: 'سليمان',
    lastNameAr: 'التميمي',
    firstNameEn: 'Abdulmohsen',
    middleNameEn: 'Sulaiman',
    lastNameEn: 'Al-Tamimi',
    fullNameAr: 'عبدالمحسن سليمان التميمي',
    fullNameEn: 'Abdulmohsen Sulaiman Al-Tamimi',
    gender: 'male',
    dateOfBirth: '1975-01-10',
    nationality: 'سعودي',
    nationalId: '1008765432',
    phoneNumber: '+966500011223',
    email: 'mohsen.tamimi@legacy.edu',
    hireDate: '2015-09-01',
    employmentStatus: 'ARCHIVED',
    employmentType: 'FULL_TIME',
    specialization: 'التاريخ والجغرافيا',
    archiveReason: 'التقاعد النظامي المبكر مع حفظ كامل السجل التاريخي',
    archivedAt: '2025-12-30T10:00:00.000Z',
    notes: 'معلم سابق متقاعد',
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2025-12-30T10:00:00.000Z',
    createdBy: 'user-super-admin',
  },
];

// Seeded qualifications
const SEEDED_QUALIFICATIONS: TeacherQualification[] = [
  {
    id: 'tq-001',
    teacherId: 'tch-r-001',
    degree: 'ماجستير',
    fieldOfStudy: 'مناهج وطرق تدريس الرياضيات',
    institution: 'جامعة الملك سعود',
    graduationYear: 2012,
    isHighestDegree: true,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'tq-002',
    teacherId: 'tch-r-001',
    degree: 'بكالوريوس',
    fieldOfStudy: 'الرياضيات البحتة والتطبيقية',
    institution: 'جامعة الملك فهد للبترول والمعادن',
    graduationYear: 2007,
    isHighestDegree: false,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'tq-003',
    teacherId: 'tch-r-002',
    degree: 'بكالوريوس',
    fieldOfStudy: 'اللغة العربية وآدابها',
    institution: 'جامعة الإمام محمد بن سعود الإسلامية',
    graduationYear: 2011,
    isHighestDegree: true,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'tq-004',
    teacherId: 'tch-r-003',
    degree: 'دكتوراه',
    fieldOfStudy: 'الفيزياء التجريبية المتقدمة',
    institution: 'جامعة مانشستر - المملكة المتحدة',
    graduationYear: 2015,
    isHighestDegree: true,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'tq-005',
    teacherId: 'tch-j-001',
    degree: 'بكالوريوس',
    fieldOfStudy: 'الأحياء والعلوم العامة مع دبلوم تربوي',
    institution: 'جامعة الملك عبدالعزيز',
    graduationYear: 2009,
    isHighestDegree: true,
    createdAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'tq-006',
    teacherId: 'tch-j-002',
    degree: 'بكالوريوس',
    fieldOfStudy: 'الرياضيات والإحصاء',
    institution: 'جامعة أم القرى',
    graduationYear: 2013,
    isHighestDegree: true,
    createdAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'tq-007',
    teacherId: 'tch-d-001',
    degree: 'ماجستير',
    fieldOfStudy: 'الكيمياء الحيوية التطبيقية',
    institution: 'جامعة الإمام عبدالرحمن بن فيصل',
    graduationYear: 2016,
    isHighestDegree: true,
    createdAt: '2026-01-14T08:00:00.000Z',
  },
];

// Seeded Teacher-Subject links
const SEEDED_TEACHER_SUBJECTS: TeacherSubject[] = [
  // Fahad Mansoor (Riyadh) -> Math & Computer
  {
    id: 'ts-001',
    teacherId: 'tch-r-001',
    subjectId: 'sbj-riyadh-math',
    branchId: 'branch-riyadh',
    isPrimarySubject: true,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'ts-002',
    teacherId: 'tch-r-001',
    subjectId: 'sbj-riyadh-comp',
    branchId: 'branch-riyadh',
    isPrimarySubject: false,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  // Sarah Al-Otaibi (Riyadh) -> Arabic & Islamic
  {
    id: 'ts-003',
    teacherId: 'tch-r-002',
    subjectId: 'sbj-riyadh-arabic',
    branchId: 'branch-riyadh',
    isPrimarySubject: true,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'ts-004',
    teacherId: 'tch-r-002',
    subjectId: 'sbj-riyadh-islamic',
    branchId: 'branch-riyadh',
    isPrimarySubject: false,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  // Tariq Al-Qahtani (Riyadh) -> Science
  {
    id: 'ts-005',
    teacherId: 'tch-r-003',
    subjectId: 'sbj-riyadh-science',
    branchId: 'branch-riyadh',
    isPrimarySubject: true,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  // Maha Al-Dossary (Riyadh) -> English
  {
    id: 'ts-006',
    teacherId: 'tch-r-004',
    subjectId: 'sbj-riyadh-english',
    branchId: 'branch-riyadh',
    isPrimarySubject: true,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  // Khaled Al-Shareef (Jeddah) -> Science
  {
    id: 'ts-007',
    teacherId: 'tch-j-001',
    subjectId: 'sbj-jeddah-science',
    branchId: 'branch-jeddah',
    isPrimarySubject: true,
    createdAt: '2026-01-12T08:00:00.000Z',
  },
  // Fatima Al-Sulami (Jeddah) -> Math
  {
    id: 'ts-008',
    teacherId: 'tch-j-002',
    subjectId: 'sbj-jeddah-math',
    branchId: 'branch-jeddah',
    isPrimarySubject: true,
    createdAt: '2026-01-12T08:00:00.000Z',
  },
];

// Seeded Teacher-Class links
const SEEDED_TEACHER_CLASSES: TeacherClass[] = [
  {
    id: 'tc-001',
    teacherId: 'tch-r-001',
    classId: 'cls-riyadh-1a',
    academicYearId: 'ay-riyadh-2026',
    branchId: 'branch-riyadh',
    role: 'PRIMARY_TEACHER',
    isCurrent: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'tc-002',
    teacherId: 'tch-r-002',
    classId: 'cls-riyadh-1a',
    academicYearId: 'ay-riyadh-2026',
    branchId: 'branch-riyadh',
    role: 'HOMEROOM_TEACHER',
    isCurrent: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'tc-003',
    teacherId: 'tch-r-003',
    classId: 'cls-r-p2-a',
    academicYearId: 'ay-riyadh-2026',
    branchId: 'branch-riyadh',
    role: 'SUBJECT_TEACHER',
    isCurrent: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'tc-004',
    teacherId: 'tch-j-001',
    classId: 'cls-j-p1-a',
    academicYearId: 'ay-jeddah-2026',
    branchId: 'branch-jeddah',
    role: 'PRIMARY_TEACHER',
    isCurrent: true,
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
];

export class TeacherStorageService {
  private static instance: TeacherStorageService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): TeacherStorageService {
    if (!TeacherStorageService.instance) {
      TeacherStorageService.instance = new TeacherStorageService();
    }
    return TeacherStorageService.instance;
  }

  public initialize(): void {
    if (this.initialized) return;

    if (!localStorage.getItem(TEACHERS_STORAGE_KEY)) {
      localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(SEEDED_TEACHERS));
    }
    if (!localStorage.getItem(TEACHER_QUALIFICATIONS_STORAGE_KEY)) {
      localStorage.setItem(TEACHER_QUALIFICATIONS_STORAGE_KEY, JSON.stringify(SEEDED_QUALIFICATIONS));
    }
    if (!localStorage.getItem(TEACHER_SUBJECTS_STORAGE_KEY)) {
      localStorage.setItem(TEACHER_SUBJECTS_STORAGE_KEY, JSON.stringify(SEEDED_TEACHER_SUBJECTS));
    }
    if (!localStorage.getItem(TEACHER_CLASSES_STORAGE_KEY)) {
      localStorage.setItem(TEACHER_CLASSES_STORAGE_KEY, JSON.stringify(SEEDED_TEACHER_CLASSES));
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
        targetType: 'TEACHER',
        result: 'DENIED',
        details: `Security violation: User "${actingUser.username}" denied access to teachers in branch "${targetBranchId}"`,
      });
      throw new Error(`غير مصرح لك بالوصول أو إدارة بيانات هيئة التدريس في الفرع المحدد (${targetBranchId}).`);
    }
  }

  public checkPermission(actingUser: SafeUser, requiredPermission: any): void {
    if (!authStorage.hasPermission(actingUser, requiredPermission)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        targetType: 'TEACHER',
        result: 'DENIED',
        details: `Security violation: Missing permission "${requiredPermission}" for teacher operation`,
      });
      throw new Error(`ليس لديك الصلاحية الكافية لإتمام هذه العملية (${requiredPermission}).`);
    }
  }

  // --- RAW STORAGE ACCESSORS ---
  public getRawTeachers(): Teacher[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(TEACHERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_TEACHERS;
    } catch {
      return SEEDED_TEACHERS;
    }
  }

  private saveTeachers(teachers: Teacher[]): void {
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(teachers));
  }

  public getRawQualifications(): TeacherQualification[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(TEACHER_QUALIFICATIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_QUALIFICATIONS;
    } catch {
      return SEEDED_QUALIFICATIONS;
    }
  }

  private saveQualifications(quals: TeacherQualification[]): void {
    localStorage.setItem(TEACHER_QUALIFICATIONS_STORAGE_KEY, JSON.stringify(quals));
  }

  public getRawTeacherSubjects(): TeacherSubject[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(TEACHER_SUBJECTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_TEACHER_SUBJECTS;
    } catch {
      return SEEDED_TEACHER_SUBJECTS;
    }
  }

  private saveTeacherSubjects(ts: TeacherSubject[]): void {
    localStorage.setItem(TEACHER_SUBJECTS_STORAGE_KEY, JSON.stringify(ts));
  }

  public getRawTeacherClasses(): TeacherClass[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(TEACHER_CLASSES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_TEACHER_CLASSES;
    } catch {
      return SEEDED_TEACHER_CLASSES;
    }
  }

  private saveTeacherClasses(tc: TeacherClass[]): void {
    localStorage.setItem(TEACHER_CLASSES_STORAGE_KEY, JSON.stringify(tc));
  }

  // --- UNIQUE TEACHER IDENTIFIER GENERATOR ---
  public generateNextTeacherNumber(branchId: string, customYear?: number): string {
    const year = customYear || new Date().getFullYear();
    const teachers = this.getRawTeachers();
    const prefix = `TCH-${year}-`;

    const existingNumbers = teachers
      .map((t) => t.teacherNumber)
      .filter((num) => num.startsWith(prefix))
      .map((num) => parseInt(num.replace(prefix, ''), 10))
      .filter((n) => !isNaN(n));

    const nextSeq = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    return `${prefix}${nextSeq.toString().padStart(3, '0')}`;
  }

  // Helper to mask sensitive identity data unless permitted
  private maskSensitiveTeacherData(teacher: Teacher, canViewSensitive: boolean): Teacher {
    if (canViewSensitive) return { ...teacher };
    return {
      ...teacher,
      nationalId: teacher.nationalId ? `${teacher.nationalId.slice(0, 3)}••••••${teacher.nationalId.slice(-1)}` : undefined,
      passportNumber: teacher.passportNumber ? `${teacher.passportNumber.slice(0, 2)}••••••` : undefined,
    };
  }

  // Helper to construct fully populated TeacherDetail composite
  private populateTeacherDetail(teacher: Teacher, canViewSensitive: boolean): TeacherDetail {
    const branches = branchStorage.getStoredBranches();
    const branch = branches.find((b) => b.id === teacher.branchId);

    const qualifications = this.getRawQualifications()
      .filter((q) => q.teacherId === teacher.id)
      .sort((a, b) => (b.isHighestDegree ? 1 : 0) - (a.isHighestDegree ? 1 : 0) || b.graduationYear - a.graduationYear);

    const teacherSubjects = this.getRawTeacherSubjects().filter((ts) => ts.teacherId === teacher.id);
    const subjects = academicStorage.getRawSubjects();
    const populatedSubjects = teacherSubjects.map((ts) => {
      const sbj = subjects.find((s) => s.id === ts.subjectId);
      return {
        id: ts.id,
        subjectId: ts.subjectId,
        nameAr: sbj?.nameAr || 'مادة غير محددة',
        nameEn: sbj?.nameEn || 'Unknown Subject',
        subjectCode: sbj?.subjectCode || 'N/A',
        isPrimarySubject: ts.isPrimarySubject,
      };
    });

    const teacherClasses = this.getRawTeacherClasses().filter((tc) => tc.teacherId === teacher.id);
    const classes = academicStorage.getRawClasses();
    const grades = academicStorage.getRawGrades();
    const years = academicStorage.getRawYears();

    const populatedClasses = teacherClasses.map((tc) => {
      const cls = classes.find((c) => c.id === tc.classId);
      const grd = cls ? grades.find((g) => g.id === cls.gradeId) : undefined;
      const yr = years.find((y) => y.id === tc.academicYearId);
      return {
        id: tc.id,
        classId: tc.classId,
        classNameAr: cls?.nameAr || 'فصل غير محدد',
        classNameEn: cls?.nameEn || 'Unknown Section',
        gradeNameAr: grd?.nameAr || '',
        gradeNameEn: grd?.nameEn || '',
        academicYearNameAr: yr?.nameAr,
        role: tc.role,
        isCurrent: tc.isCurrent,
      };
    });

    const masked = this.maskSensitiveTeacherData(teacher, canViewSensitive);

    return {
      ...masked,
      branchNameAr: branch?.nameAr,
      branchNameEn: branch?.nameEn,
      qualifications,
      subjects: populatedSubjects,
      classes: populatedClasses,
    };
  }

  // ====================================================
  // QUERY & DIRECTORY METHODS
  // ====================================================

  public listTeachers(
    actingUser: SafeUser,
    params: TeacherFilterParams
  ): {
    teachers: TeacherDetail[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    this.checkPermission(actingUser, 'teachers.view');

    let all = this.getRawTeachers();

    // 1. Branch Isolation filter
    if (params.branchId && params.branchId !== 'all') {
      this.checkBranchAccess(actingUser, params.branchId);
      all = all.filter((t) => t.branchId === params.branchId);
    } else {
      if (!authStorage.isSuperAdmin(actingUser) && !actingUser.hasAllBranchesAccess) {
        all = all.filter((t) => actingUser.branchIds.includes(t.branchId));
      }
    }

    // 2. Status filter
    if (params.status && params.status !== 'all') {
      all = all.filter((t) => t.employmentStatus === params.status);
    }

    // 3. Employment Type filter
    if (params.employmentType && params.employmentType !== 'all') {
      all = all.filter((t) => t.employmentType === params.employmentType);
    }

    // 4. Gender filter
    if (params.gender && params.gender !== 'all') {
      all = all.filter((t) => t.gender === params.gender);
    }

    // 5. Subject filter
    if (params.subjectId && params.subjectId !== 'all') {
      const tsLinks = this.getRawTeacherSubjects().filter((ts) => ts.subjectId === params.subjectId);
      const teacherIdsWithSubject = new Set(tsLinks.map((ts) => ts.teacherId));
      all = all.filter((t) => teacherIdsWithSubject.has(t.id));
    }

    // 6. Search query
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      all = all.filter(
        (t) =>
          t.fullNameAr.toLowerCase().includes(q) ||
          t.fullNameEn.toLowerCase().includes(q) ||
          t.teacherNumber.toLowerCase().includes(q) ||
          t.phoneNumber.includes(q) ||
          (t.email && t.email.toLowerCase().includes(q)) ||
          t.specialization.toLowerCase().includes(q)
      );
    }

    // 7. Sorting
    const sortBy = params.sortBy || 'createdAt';
    const sortDir = params.sortDirection || 'desc';

    all.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'fullNameAr') {
        comparison = a.fullNameAr.localeCompare(b.fullNameAr, 'ar');
      } else if (sortBy === 'teacherNumber') {
        comparison = a.teacherNumber.localeCompare(b.teacherNumber);
      } else if (sortBy === 'hireDate') {
        comparison = (a.hireDate || '').localeCompare(b.hireDate || '');
      } else if (sortBy === 'specialization') {
        comparison = a.specialization.localeCompare(b.specialization, 'ar');
      } else {
        comparison = a.createdAt.localeCompare(b.createdAt);
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    const totalCount = all.length;
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, params.pageSize || 15);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const startIndex = (page - 1) * pageSize;
    const paginated = all.slice(startIndex, startIndex + pageSize);

    const canViewSensitive = authStorage.hasPermission(actingUser, 'teachers.view_sensitive_data');
    const detailedList = paginated.map((t) => this.populateTeacherDetail(t, canViewSensitive));

    return {
      teachers: detailedList,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  }

  public getTeacherById(actingUser: SafeUser, teacherId: string): TeacherDetail {
    this.checkPermission(actingUser, 'teachers.view');

    const teachers = this.getRawTeachers();
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) {
      throw new Error('سجل المعلم غير موجود في النظام.');
    }

    this.checkBranchAccess(actingUser, teacher.branchId);

    const canViewSensitive = authStorage.hasPermission(actingUser, 'teachers.view_sensitive_data');
    return this.populateTeacherDetail(teacher, canViewSensitive);
  }

  // ====================================================
  // CREATE / REGISTRATION OPERATION (With Atomic Guarantees)
  // ====================================================

  public createTeacher(actingUser: SafeUser, dto: CreateTeacherDTO): TeacherDetail {
    this.checkPermission(actingUser, 'teachers.create');
    this.checkBranchAccess(actingUser, dto.branchId);

    // 1. Validation
    if (!dto.firstNameAr?.trim() || !dto.lastNameAr?.trim()) {
      throw new Error('الاسم الأول واسم العائلة باللغة العربية حقول إلزامية.');
    }
    if (!dto.firstNameEn?.trim() || !dto.lastNameEn?.trim()) {
      throw new Error('الاسم الأول واسم العائلة باللغة الإنجليزية حقول إلزامية.');
    }
    if (!dto.phoneNumber?.trim()) {
      throw new Error('رقم الهاتف المحمول الأساسي إلزامي.');
    }
    if (!dto.specialization?.trim()) {
      throw new Error('التخصص الأكاديمي الرئيسي مطلوب.');
    }

    // Email format validation
    if (dto.email && dto.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dto.email.trim())) {
        throw new Error('البريد الإلكتروني المدخل غير صالح.');
      }
    }

    // Verify branch exists
    const branches = branchStorage.getStoredBranches();
    const branch = branches.find((b) => b.id === dto.branchId);
    if (!branch) {
      throw new Error('الفرع التعليمي المحدد غير موجود.');
    }

    const teachers = this.getRawTeachers();

    // 2. Teacher Number Resolution & Database Uniqueness Enforcement
    let teacherNumber = dto.teacherNumber?.trim();
    if (!teacherNumber) {
      teacherNumber = this.generateNextTeacherNumber(dto.branchId);
    } else {
      const exists = teachers.find((t) => t.teacherNumber.toLowerCase() === teacherNumber!.toLowerCase());
      if (exists) {
        throw new Error(`الرقم التعريفي للمعلم (${teacherNumber}) مستخدم بالفعل في النظام.`);
      }
    }

    // Check duplicate phone or nationalId if provided
    if (dto.nationalId && dto.nationalId.trim()) {
      const duplicateNatId = teachers.find((t) => t.nationalId === dto.nationalId?.trim());
      if (duplicateNatId) {
        throw new Error('رقم الهوية الوطنية أو الإقامة مسجل بالفعل لمعلم آخر.');
      }
    }

    const now = new Date().toISOString();
    const teacherId = `tch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const fullNameAr = [dto.firstNameAr.trim(), dto.middleNameAr?.trim(), dto.lastNameAr.trim()]
      .filter(Boolean)
      .join(' ');
    const fullNameEn = [dto.firstNameEn.trim(), dto.middleNameEn?.trim(), dto.lastNameEn.trim()]
      .filter(Boolean)
      .join(' ');

    const newTeacher: Teacher = {
      id: teacherId,
      branchId: dto.branchId,
      teacherNumber,
      firstNameAr: dto.firstNameAr.trim(),
      middleNameAr: dto.middleNameAr?.trim(),
      lastNameAr: dto.lastNameAr.trim(),
      firstNameEn: dto.firstNameEn.trim(),
      middleNameEn: dto.middleNameEn?.trim(),
      lastNameEn: dto.lastNameEn.trim(),
      fullNameAr,
      fullNameEn,
      gender: dto.gender,
      dateOfBirth: dto.dateOfBirth,
      nationality: dto.nationality?.trim(),
      nationalId: dto.nationalId?.trim(),
      passportNumber: dto.passportNumber?.trim(),
      phoneNumber: dto.phoneNumber.trim(),
      alternatePhoneNumber: dto.alternatePhoneNumber?.trim(),
      email: dto.email?.trim().toLowerCase(),
      address: dto.address?.trim(),
      photoUrl: dto.photoUrl,
      hireDate: dto.hireDate || now.split('T')[0],
      employmentStatus: dto.employmentStatus || 'ACTIVE',
      employmentType: dto.employmentType,
      specialization: dto.specialization.trim(),
      perLessonRate: dto.perLessonRate,
      notes: dto.notes?.trim(),
      userId: dto.userId,
      createdAt: now,
      updatedAt: now,
      createdBy: actingUser.id,
      updatedBy: actingUser.id,
    };

    // 3. Process Qualifications
    const quals = this.getRawQualifications();
    if (dto.qualifications && dto.qualifications.length > 0) {
      for (const q of dto.qualifications) {
        if (q.degree && q.degree.trim()) {
          quals.push({
            id: `tq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            teacherId,
            degree: q.degree.trim(),
            fieldOfStudy: q.fieldOfStudy?.trim() || dto.specialization.trim(),
            institution: q.institution?.trim() || '',
            graduationYear: q.graduationYear || new Date().getFullYear(),
            isHighestDegree: q.isHighestDegree || false,
            createdAt: now,
          });
        }
      }
    }

    // 4. Process Teaching Subjects (Verify all subjects belong to the teacher's branch)
    const teacherSubjects = this.getRawTeacherSubjects();
    if (dto.subjectIds && dto.subjectIds.length > 0) {
      const allSubjects = academicStorage.getRawSubjects();
      for (let i = 0; i < dto.subjectIds.length; i++) {
        const sId = dto.subjectIds[i];
        const subject = allSubjects.find((s) => s.id === sId);
        if (!subject) {
          throw new Error(`المادة الدراسية المحددة (${sId}) غير موجودة.`);
        }
        if (subject.branchId !== dto.branchId) {
          throw new Error(`أمان النظام: المادة (${subject.nameAr}) تابعة لفرع آخر ولا يمكن إسنادها لمعلم بفرع مختلف.`);
        }
        teacherSubjects.push({
          id: `ts-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          teacherId,
          subjectId: sId,
          branchId: dto.branchId,
          isPrimarySubject: i === 0, // First subject marked as primary
          createdAt: now,
        });
      }
    }

    // 5. Process Class Section Assignments
    const teacherClasses = this.getRawTeacherClasses();
    if (dto.classAssignments && dto.classAssignments.length > 0) {
      const allClasses = academicStorage.getRawClasses();
      for (const ca of dto.classAssignments) {
        const cls = allClasses.find((c) => c.id === ca.classId);
        if (!cls) {
          throw new Error('الفصل الدراسي المحدد غير موجود.');
        }
        if (cls.branchId !== dto.branchId) {
          throw new Error(`أمان النظام: الفصل (${cls.nameAr}) تابع لفرع آخر ولا يمكن إسناده لمعلم بهذا الفرع.`);
        }
        teacherClasses.push({
          id: `tc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          teacherId,
          classId: ca.classId,
          academicYearId: ca.academicYearId || cls.academicYearId,
          branchId: dto.branchId,
          role: ca.role || 'PRIMARY_TEACHER',
          isCurrent: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // 6. Atomic Persistence
    teachers.unshift(newTeacher);
    this.saveTeachers(teachers);
    this.saveQualifications(quals);
    this.saveTeacherSubjects(teacherSubjects);
    this.saveTeacherClasses(teacherClasses);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TEACHER_REGISTERED',
      targetType: 'TEACHER',
      targetId: newTeacher.id,
      targetIdentifier: `${newTeacher.fullNameAr} (${newTeacher.teacherNumber})`,
      branchContext: newTeacher.branchId,
      result: 'SUCCESS',
      details: `Registered teacher "${newTeacher.fullNameAr}" [${newTeacher.teacherNumber}] in branch "${branch.nameAr}" with status "${newTeacher.employmentStatus}"`,
    });

    const canViewSensitive = authStorage.hasPermission(actingUser, 'teachers.view_sensitive_data');
    return this.populateTeacherDetail(newTeacher, canViewSensitive);
  }

  // ====================================================
  // UPDATE OPERATION
  // ====================================================

  public updateTeacher(
    actingUser: SafeUser,
    teacherId: string,
    dto: UpdateTeacherDTO
  ): TeacherDetail {
    this.checkPermission(actingUser, 'teachers.edit');

    const teachers = this.getRawTeachers();
    const target = teachers.find((t) => t.id === teacherId);
    if (!target) {
      throw new Error('سجل المعلم غير موجود في النظام.');
    }

    this.checkBranchAccess(actingUser, target.branchId);

    // Email format validation
    if (dto.email && dto.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dto.email.trim())) {
        throw new Error('البريد الإلكتروني المدخل غير صالح.');
      }
    }

    if (dto.firstNameAr) target.firstNameAr = dto.firstNameAr.trim();
    if (dto.middleNameAr !== undefined) target.middleNameAr = dto.middleNameAr?.trim();
    if (dto.lastNameAr) target.lastNameAr = dto.lastNameAr.trim();
    if (dto.firstNameEn) target.firstNameEn = dto.firstNameEn.trim();
    if (dto.middleNameEn !== undefined) target.middleNameEn = dto.middleNameEn?.trim();
    if (dto.lastNameEn) target.lastNameEn = dto.lastNameEn.trim();

    target.fullNameAr = [target.firstNameAr, target.middleNameAr, target.lastNameAr].filter(Boolean).join(' ');
    target.fullNameEn = [target.firstNameEn, target.middleNameEn, target.lastNameEn].filter(Boolean).join(' ');

    if (dto.gender) target.gender = dto.gender;
    if (dto.dateOfBirth !== undefined) target.dateOfBirth = dto.dateOfBirth;
    if (dto.nationality !== undefined) target.nationality = dto.nationality?.trim();
    if (dto.nationalId !== undefined) target.nationalId = dto.nationalId?.trim();
    if (dto.passportNumber !== undefined) target.passportNumber = dto.passportNumber?.trim();
    if (dto.phoneNumber) target.phoneNumber = dto.phoneNumber.trim();
    if (dto.alternatePhoneNumber !== undefined) target.alternatePhoneNumber = dto.alternatePhoneNumber?.trim();
    if (dto.email !== undefined) target.email = dto.email?.trim().toLowerCase();
    if (dto.address !== undefined) target.address = dto.address?.trim();
    if (dto.photoUrl !== undefined) target.photoUrl = dto.photoUrl;
    if (dto.hireDate !== undefined) target.hireDate = dto.hireDate;
    if (dto.employmentStatus) target.employmentStatus = dto.employmentStatus;
    if (dto.employmentType) target.employmentType = dto.employmentType;
    if (dto.specialization) target.specialization = dto.specialization.trim();
    if (dto.perLessonRate !== undefined) target.perLessonRate = dto.perLessonRate;
    if (dto.notes !== undefined) target.notes = dto.notes?.trim();
    if (dto.userId !== undefined) target.userId = dto.userId;

    target.updatedAt = new Date().toISOString();
    target.updatedBy = actingUser.id;

    this.saveTeachers(teachers);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TEACHER_UPDATED',
      targetType: 'TEACHER',
      targetId: target.id,
      targetIdentifier: `${target.fullNameAr} (${target.teacherNumber})`,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Updated profile attributes for teacher "${target.fullNameAr}"`,
    });

    const canViewSensitive = authStorage.hasPermission(actingUser, 'teachers.view_sensitive_data');
    return this.populateTeacherDetail(target, canViewSensitive);
  }

  // ====================================================
  // LIFECYCLE & STATUS OPERATIONS
  // ====================================================

  public changeTeacherStatus(
    actingUser: SafeUser,
    teacherId: string,
    status: TeacherStatus,
    reason?: string
  ): TeacherDetail {
    this.checkPermission(actingUser, 'teachers.edit');

    const teachers = this.getRawTeachers();
    const target = teachers.find((t) => t.id === teacherId);
    if (!target) throw new Error('سجل المعلم غير موجود.');

    this.checkBranchAccess(actingUser, target.branchId);

    const prevStatus = target.employmentStatus;
    target.employmentStatus = status;
    target.updatedAt = new Date().toISOString();
    target.updatedBy = actingUser.id;

    if (status === 'ARCHIVED') {
      target.archivedAt = new Date().toISOString();
      target.archiveReason = reason || 'أرشفة إدارية';
    } else {
      target.archivedAt = undefined;
      target.archiveReason = undefined;
    }

    this.saveTeachers(teachers);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TEACHER_STATUS_CHANGED',
      targetType: 'TEACHER',
      targetId: target.id,
      targetIdentifier: `${target.fullNameAr} (${target.teacherNumber})`,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Transitioned teacher status from "${prevStatus}" to "${status}"${reason ? ` - السبب: ${reason}` : ''}`,
    });

    const canViewSensitive = authStorage.hasPermission(actingUser, 'teachers.view_sensitive_data');
    return this.populateTeacherDetail(target, canViewSensitive);
  }

  public archiveTeacher(actingUser: SafeUser, teacherId: string, reason: string): TeacherDetail {
    this.checkPermission(actingUser, 'teachers.archive');
    if (!reason || !reason.trim()) {
      throw new Error('سبب أرشفة المعلم حقل إلزامي لضمان التوثيق الإداري.');
    }

    const teachers = this.getRawTeachers();
    const target = teachers.find((t) => t.id === teacherId);
    if (!target) throw new Error('سجل المعلم غير موجود.');

    this.checkBranchAccess(actingUser, target.branchId);

    target.employmentStatus = 'ARCHIVED';
    target.archiveReason = reason.trim();
    target.archivedAt = new Date().toISOString();
    target.updatedAt = new Date().toISOString();
    target.updatedBy = actingUser.id;

    this.saveTeachers(teachers);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TEACHER_ARCHIVED',
      targetType: 'TEACHER',
      targetId: target.id,
      targetIdentifier: `${target.fullNameAr} (${target.teacherNumber})`,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Archived teacher profile with preservation of historical academic links. Reason: "${reason.trim()}"`,
    });

    const canViewSensitive = authStorage.hasPermission(actingUser, 'teachers.view_sensitive_data');
    return this.populateTeacherDetail(target, canViewSensitive);
  }

  public restoreTeacher(actingUser: SafeUser, teacherId: string, reason?: string): TeacherDetail {
    this.checkPermission(actingUser, 'teachers.restore');

    const teachers = this.getRawTeachers();
    const target = teachers.find((t) => t.id === teacherId);
    if (!target) throw new Error('سجل المعلم غير موجود.');

    this.checkBranchAccess(actingUser, target.branchId);

    target.employmentStatus = 'ACTIVE';
    target.archiveReason = undefined;
    target.archivedAt = undefined;
    target.updatedAt = new Date().toISOString();
    target.updatedBy = actingUser.id;

    this.saveTeachers(teachers);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TEACHER_RESTORED',
      targetType: 'TEACHER',
      targetId: target.id,
      targetIdentifier: `${target.fullNameAr} (${target.teacherNumber})`,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Restored teacher profile back to ACTIVE status${reason ? `. Reason: "${reason}"` : ''}`,
    });

    const canViewSensitive = authStorage.hasPermission(actingUser, 'teachers.view_sensitive_data');
    return this.populateTeacherDetail(target, canViewSensitive);
  }

  // ====================================================
  // SUBJECT ASSIGNMENT OPERATIONS
  // ====================================================

  public assignSubjectToTeacher(
    actingUser: SafeUser,
    teacherId: string,
    subjectId: string,
    isPrimary = false
  ): TeacherSubject {
    this.checkPermission(actingUser, 'teachers.manage_subjects');

    const teachers = this.getRawTeachers();
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) throw new Error('المعلم المطلوب غير موجود.');

    this.checkBranchAccess(actingUser, teacher.branchId);

    // Verify subject exists and belongs to the SAME branch
    const subjects = academicStorage.getRawSubjects();
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) throw new Error('المادة الدراسية غير موجودة.');

    if (subject.branchId !== teacher.branchId) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_BRANCH_ACCESS',
        targetType: 'TEACHER',
        result: 'DENIED',
        details: `Cross-branch subject injection blocked: Teacher in "${teacher.branchId}" cannot teach subject in "${subject.branchId}"`,
      });
      throw new Error('أمان النظام: لا يمكن إسناد مادة دراسية تابعة لفرع آخر إلى معلم بفرع مختلف.');
    }

    const teacherSubjects = this.getRawTeacherSubjects();
    const duplicate = teacherSubjects.find(
      (ts) => ts.teacherId === teacherId && ts.subjectId === subjectId
    );
    if (duplicate) {
      throw new Error('المادة الدراسية مسندة بالفعل لهذا المعلم.');
    }

    const newLink: TeacherSubject = {
      id: `ts-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      teacherId,
      subjectId,
      branchId: teacher.branchId,
      isPrimarySubject: isPrimary,
      createdAt: new Date().toISOString(),
    };

    teacherSubjects.push(newLink);
    this.saveTeacherSubjects(teacherSubjects);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TEACHER_SUBJECT_ASSIGNED',
      targetType: 'TEACHER',
      targetId: teacher.id,
      targetIdentifier: `${teacher.fullNameAr} -> ${subject.nameAr}`,
      branchContext: teacher.branchId,
      result: 'SUCCESS',
      details: `Assigned subject "${subject.nameAr}" [${subject.subjectCode}] to teacher "${teacher.fullNameAr}"`,
    });

    return newLink;
  }

  public removeSubjectFromTeacher(
    actingUser: SafeUser,
    teacherId: string,
    subjectId: string
  ): void {
    this.checkPermission(actingUser, 'teachers.manage_subjects');

    const teachers = this.getRawTeachers();
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) throw new Error('المعلم المطلوب غير موجود.');

    this.checkBranchAccess(actingUser, teacher.branchId);

    const teacherSubjects = this.getRawTeacherSubjects();
    const index = teacherSubjects.findIndex(
      (ts) => ts.teacherId === teacherId && ts.subjectId === subjectId
    );
    if (index === -1) {
      throw new Error('ارتباط المادة بالمعلم غير موجود.');
    }

    teacherSubjects.splice(index, 1);
    this.saveTeacherSubjects(teacherSubjects);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TEACHER_SUBJECT_REMOVED',
      targetType: 'TEACHER',
      targetId: teacher.id,
      targetIdentifier: `${teacher.fullNameAr}`,
      branchContext: teacher.branchId,
      result: 'SUCCESS',
      details: `Unlinked subject from teacher "${teacher.fullNameAr}"`,
    });
  }

  // ====================================================
  // CLASS SECTION ASSIGNMENT OPERATIONS
  // ====================================================

  public assignClassToTeacher(
    actingUser: SafeUser,
    teacherId: string,
    classId: string,
    academicYearId: string,
    role: TeacherClassRole = 'PRIMARY_TEACHER'
  ): TeacherClass {
    this.checkPermission(actingUser, 'teachers.manage_classes');

    const teachers = this.getRawTeachers();
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) throw new Error('المعلم المطلوب غير موجود.');

    this.checkBranchAccess(actingUser, teacher.branchId);

    // Verify class exists and belongs to the SAME branch
    const classes = academicStorage.getRawClasses();
    const cls = classes.find((c) => c.id === classId);
    if (!cls) throw new Error('الفصل الدراسي غير موجود.');

    if (cls.branchId !== teacher.branchId) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_BRANCH_ACCESS',
        targetType: 'TEACHER',
        result: 'DENIED',
        details: `Cross-branch class injection blocked: Teacher in "${teacher.branchId}" cannot be assigned to class in "${cls.branchId}"`,
      });
      throw new Error('أمان النظام: لا يمكن إسناد فصل دراسي تابع لفرع آخر إلى معلم بفرع مختلف.');
    }

    // Verify academic year belongs to the same branch
    const years = academicStorage.getRawYears();
    const year = years.find((y) => y.id === academicYearId);
    if (!year || year.branchId !== teacher.branchId) {
      throw new Error('السنة الدراسية المحددة غير متوافقة مع فرع المعلم.');
    }

    const teacherClasses = this.getRawTeacherClasses();
    const duplicate = teacherClasses.find(
      (tc) =>
        tc.teacherId === teacherId &&
        tc.classId === classId &&
        tc.academicYearId === academicYearId &&
        tc.role === role &&
        tc.isCurrent
    );
    if (duplicate) {
      throw new Error('المعلم مسند بالفعل لنفس الفصل بنفس الدور خلال العام الدراسي الحالي.');
    }

    const newLink: TeacherClass = {
      id: `tc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      teacherId,
      classId,
      academicYearId,
      branchId: teacher.branchId,
      role,
      isCurrent: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    teacherClasses.push(newLink);
    this.saveTeacherClasses(teacherClasses);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TEACHER_CLASS_ASSIGNED',
      targetType: 'TEACHER',
      targetId: teacher.id,
      targetIdentifier: `${teacher.fullNameAr} -> ${cls.nameAr}`,
      branchContext: teacher.branchId,
      result: 'SUCCESS',
      details: `Assigned teacher "${teacher.fullNameAr}" to class "${cls.nameAr}" with role "${role}"`,
    });

    return newLink;
  }

  public removeClassFromTeacher(actingUser: SafeUser, teacherClassId: string): void {
    this.checkPermission(actingUser, 'teachers.manage_classes');

    const teacherClasses = this.getRawTeacherClasses();
    const tc = teacherClasses.find((t) => t.id === teacherClassId);
    if (!tc) throw new Error('ارتباط الفصل بالمعلم غير موجود.');

    const teachers = this.getRawTeachers();
    const teacher = teachers.find((t) => t.id === tc.teacherId);
    if (teacher) {
      this.checkBranchAccess(actingUser, teacher.branchId);
    }

    const updated = teacherClasses.filter((t) => t.id !== teacherClassId);
    this.saveTeacherClasses(updated);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TEACHER_CLASS_REMOVED',
      targetType: 'TEACHER',
      targetId: tc.teacherId,
      branchContext: tc.branchId,
      result: 'SUCCESS',
      details: `Removed class assignment for teacher`,
    });
  }

  // ====================================================
  // QUALIFICATIONS OPERATIONS
  // ====================================================

  public addQualification(
    actingUser: SafeUser,
    teacherId: string,
    data: {
      degree: string;
      fieldOfStudy: string;
      institution: string;
      graduationYear: number;
      isHighestDegree?: boolean;
    }
  ): TeacherQualification {
    this.checkPermission(actingUser, 'teachers.edit');

    const teachers = this.getRawTeachers();
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) throw new Error('سجل المعلم غير موجود.');

    this.checkBranchAccess(actingUser, teacher.branchId);

    if (!data.degree?.trim()) {
      throw new Error('المؤهل الدراسي أو الدرجة العلمية حقل إلزامي.');
    }

    const quals = this.getRawQualifications();

    // If marked as highest degree, reset previous flags for this teacher
    if (data.isHighestDegree) {
      quals.forEach((q) => {
        if (q.teacherId === teacherId) q.isHighestDegree = false;
      });
    }

    const newQual: TeacherQualification = {
      id: `tq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      teacherId,
      degree: data.degree.trim(),
      fieldOfStudy: data.fieldOfStudy?.trim() || teacher.specialization,
      institution: data.institution?.trim() || '',
      graduationYear: data.graduationYear || new Date().getFullYear(),
      isHighestDegree: data.isHighestDegree || false,
      createdAt: new Date().toISOString(),
    };

    quals.push(newQual);
    this.saveQualifications(quals);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TEACHER_QUALIFICATION_ADDED',
      targetType: 'TEACHER',
      targetId: teacher.id,
      targetIdentifier: `${teacher.fullNameAr} -> ${newQual.degree}`,
      branchContext: teacher.branchId,
      result: 'SUCCESS',
      details: `Added qualification "${newQual.degree}" for teacher "${teacher.fullNameAr}"`,
    });

    return newQual;
  }

  public removeQualification(actingUser: SafeUser, qualificationId: string): void {
    this.checkPermission(actingUser, 'teachers.edit');

    const quals = this.getRawQualifications();
    const qual = quals.find((q) => q.id === qualificationId);
    if (!qual) throw new Error('المؤهل المطلوب غير موجود.');

    const teachers = this.getRawTeachers();
    const teacher = teachers.find((t) => t.id === qual.teacherId);
    if (teacher) {
      this.checkBranchAccess(actingUser, teacher.branchId);
    }

    const updated = quals.filter((q) => q.id !== qualificationId);
    this.saveQualifications(updated);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TEACHER_QUALIFICATION_REMOVED',
      targetType: 'TEACHER',
      targetId: qual.teacherId,
      result: 'SUCCESS',
      details: `Removed qualification "${qual.degree}"`,
    });
  }

  // ====================================================
  // STATISTICS & AGGREGATIONS
  // ====================================================

  public getTeacherStats(actingUser: SafeUser, branchId?: string): TeacherStats {
    this.checkPermission(actingUser, 'teachers.view');

    let teachers = this.getRawTeachers();

    if (branchId && branchId !== 'all') {
      this.checkBranchAccess(actingUser, branchId);
      teachers = teachers.filter((t) => t.branchId === branchId);
    } else {
      if (!authStorage.isSuperAdmin(actingUser) && !actingUser.hasAllBranchesAccess) {
        teachers = teachers.filter((t) => actingUser.branchIds.includes(t.branchId));
      }
    }

    return {
      totalTeachers: teachers.length,
      activeTeachers: teachers.filter((t) => t.employmentStatus === 'ACTIVE').length,
      inactiveTeachers: teachers.filter((t) => t.employmentStatus === 'INACTIVE').length,
      onLeaveTeachers: teachers.filter((t) => t.employmentStatus === 'ON_LEAVE').length,
      suspendedTeachers: teachers.filter((t) => t.employmentStatus === 'SUSPENDED').length,
      archivedTeachers: teachers.filter((t) => t.employmentStatus === 'ARCHIVED').length,
      fullTimeTeachers: teachers.filter((t) => t.employmentType === 'FULL_TIME').length,
      partTimeTeachers: teachers.filter((t) => t.employmentType === 'PART_TIME').length,
      contractTeachers: teachers.filter((t) => t.employmentType === 'CONTRACT').length,
      temporaryTeachers: teachers.filter((t) => t.employmentType === 'TEMPORARY').length,
    };
  }

  // ====================================================
  // EXPORT OPERATION (With Permission Guard)
  // ====================================================

  public exportTeachersCSV(actingUser: SafeUser, params: TeacherFilterParams): string {
    this.checkPermission(actingUser, 'teachers.export');

    const result = this.listTeachers(actingUser, {
      ...params,
      page: 1,
      pageSize: 10000, // Export all matching
    });

    const canViewSensitive = authStorage.hasPermission(actingUser, 'teachers.view_sensitive_data');

    const headers = [
      'الرقم الوظيفي',
      'الاسم الكامل (عربي)',
      'الاسم الكامل (إنجليزي)',
      'الفرع',
      'الجنس',
      'التخصص الأكاديمي',
      'نوع التعاقد',
      'الحالة الوظيفية',
      'رقم الجوال',
      'البريد الإلكتروني',
      'تاريخ التعيين',
      'الهوية الوطنية / الإقامة',
      'أعلى مؤهل',
      'المواد المسندة',
    ];

    const rows = result.teachers.map((t) => [
      `"${t.teacherNumber}"`,
      `"${t.fullNameAr}"`,
      `"${t.fullNameEn}"`,
      `"${t.branchNameAr || t.branchId}"`,
      `"${t.gender === 'male' ? 'ذكر' : 'أنثى'}"`,
      `"${t.specialization}"`,
      `"${t.employmentType}"`,
      `"${t.employmentStatus}"`,
      `"${t.phoneNumber}"`,
      `"${t.email || ''}"`,
      `"${t.hireDate || ''}"`,
      `"${canViewSensitive ? t.nationalId || '' : '••••••••••'}"`,
      `"${t.qualifications[0]?.degree || ''}"`,
      `"${t.subjects.map((s) => s.nameAr).join(' - ')}"`,
    ]);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'TEACHER_REGISTERED',
      targetType: 'TEACHER',
      branchContext: params.branchId,
      result: 'SUCCESS',
      details: `Exported teachers roster (${result.totalCount} records) to CSV`,
    });

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const teacherStorage = TeacherStorageService.getInstance();
