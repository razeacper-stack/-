import {
  AcademicYear,
  AcademicYearStatus,
  AcademicStage,
  Grade,
  ClassSection,
  Subject,
  GradeSubject,
  AcademicBranchStats,
} from '../types/academic';
import { SafeUser } from '../types/auth';
import { authStorage } from './authStorage';

const ACADEMIC_YEARS_STORAGE_KEY = 'sms_academic_years_v4';
const ACADEMIC_STAGES_STORAGE_KEY = 'sms_academic_stages_v4';
const GRADES_STORAGE_KEY = 'sms_academic_grades_v4';
const CLASSES_STORAGE_KEY = 'sms_academic_classes_v4';
const SUBJECTS_STORAGE_KEY = 'sms_academic_subjects_v4';
const GRADE_SUBJECTS_STORAGE_KEY = 'sms_academic_grade_subjects_v4';

// Seed initial realistic multi-branch academic structure
const SEEDED_YEARS: AcademicYear[] = [
  // Riyadh Main Campus
  {
    id: 'ay-riyadh-2026',
    branchId: 'branch-riyadh',
    nameAr: 'العام الدراسي 2026–2027',
    nameEn: 'Academic Year 2026–2027',
    startDate: '2026-08-30',
    endDate: '2027-06-25',
    status: 'ACTIVE',
    isCurrent: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'ay-riyadh-2025',
    branchId: 'branch-riyadh',
    nameAr: 'العام الدراسي 2025–2026',
    nameEn: 'Academic Year 2025–2026',
    startDate: '2025-08-28',
    endDate: '2026-06-20',
    status: 'CLOSED',
    isCurrent: false,
    createdAt: '2025-01-15T08:00:00.000Z',
    updatedAt: '2026-06-21T10:00:00.000Z',
  },
  {
    id: 'ay-riyadh-2027',
    branchId: 'branch-riyadh',
    nameAr: 'العام الدراسي 2027–2028',
    nameEn: 'Academic Year 2027–2028',
    startDate: '2027-08-29',
    endDate: '2028-06-22',
    status: 'PLANNED',
    isCurrent: false,
    createdAt: '2026-02-01T09:00:00.000Z',
    updatedAt: '2026-02-01T09:00:00.000Z',
  },
  // Jeddah Model Campus
  {
    id: 'ay-jeddah-2026',
    branchId: 'branch-jeddah',
    nameAr: 'العام الدراسي 2026–2027',
    nameEn: 'Academic Year 2026–2027',
    startDate: '2026-08-30',
    endDate: '2027-06-25',
    status: 'ACTIVE',
    isCurrent: true,
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  // Dammam International Campus
  {
    id: 'ay-dammam-2026',
    branchId: 'branch-dammam',
    nameAr: 'العام الدراسي الدولي 2026–2027',
    nameEn: 'International Year 2026–2027',
    startDate: '2026-09-01',
    endDate: '2027-06-30',
    status: 'ACTIVE',
    isCurrent: true,
    createdAt: '2026-01-14T08:00:00.000Z',
    updatedAt: '2026-01-14T08:00:00.000Z',
  },
];

const SEEDED_STAGES: AcademicStage[] = [
  // Riyadh
  {
    id: 'stg-riyadh-pri',
    branchId: 'branch-riyadh',
    nameAr: 'المرحلة الابتدائية',
    nameEn: 'Primary Stage',
    description: 'الصفوف من الأول إلى السادس الابتدائي - تعليم تأسيسي متكامل',
    displayOrder: 1,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'stg-riyadh-mid',
    branchId: 'branch-riyadh',
    nameAr: 'المرحلة المتوسطة',
    nameEn: 'Middle Stage',
    description: 'الصفوف من الأول إلى الثالث متوسط - مناهج مطورة وأنشطة استكشافية',
    displayOrder: 2,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'stg-riyadh-sec',
    branchId: 'branch-riyadh',
    nameAr: 'المرحلة الثانوية',
    nameEn: 'High School Stage',
    description: 'مسارات تعليمية متخصصة وإعداد أكاديمي للجامعة والمسار المهني',
    displayOrder: 3,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  // Jeddah
  {
    id: 'stg-jeddah-pri',
    branchId: 'branch-jeddah',
    nameAr: 'المرحلة الابتدائية',
    nameEn: 'Primary Stage',
    description: 'التعليم الأساسي والنموذجي',
    displayOrder: 1,
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'stg-jeddah-sec',
    branchId: 'branch-jeddah',
    nameAr: 'المرحلة الثانوية العامة',
    nameEn: 'Secondary Stage',
    description: 'مسار العلوم والتكنولوجيا',
    displayOrder: 2,
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
];

const SEEDED_GRADES: Grade[] = [
  // Riyadh - Primary
  {
    id: 'grd-riyadh-p1',
    branchId: 'branch-riyadh',
    stageId: 'stg-riyadh-pri',
    nameAr: 'الصف الأول الابتدائي',
    nameEn: 'Grade 1 (Primary)',
    gradeCode: 'PRI-G01',
    displayOrder: 1,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'grd-riyadh-p2',
    branchId: 'branch-riyadh',
    stageId: 'stg-riyadh-pri',
    nameAr: 'الصف الثاني الابتدائي',
    nameEn: 'Grade 2 (Primary)',
    gradeCode: 'PRI-G02',
    displayOrder: 2,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'grd-riyadh-p3',
    branchId: 'branch-riyadh',
    stageId: 'stg-riyadh-pri',
    nameAr: 'الصف الثالث الابتدائي',
    nameEn: 'Grade 3 (Primary)',
    gradeCode: 'PRI-G03',
    displayOrder: 3,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  // Riyadh - Middle
  {
    id: 'grd-riyadh-m1',
    branchId: 'branch-riyadh',
    stageId: 'stg-riyadh-mid',
    nameAr: 'الصف الأول المتوسط',
    nameEn: 'Grade 7 (Middle 1)',
    gradeCode: 'MID-G01',
    displayOrder: 1,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  // Riyadh - Secondary
  {
    id: 'grd-riyadh-s1',
    branchId: 'branch-riyadh',
    stageId: 'stg-riyadh-sec',
    nameAr: 'الصف الأول الثانوي',
    nameEn: 'Grade 10 (High 1)',
    gradeCode: 'SEC-G01',
    displayOrder: 1,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  // Jeddah
  {
    id: 'grd-jeddah-p1',
    branchId: 'branch-jeddah',
    stageId: 'stg-jeddah-pri',
    nameAr: 'الصف الأول الابتدائي',
    nameEn: 'Grade 1 (Primary)',
    gradeCode: 'JED-PRI-01',
    displayOrder: 1,
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
];

const SEEDED_CLASSES: ClassSection[] = [
  // Riyadh
  {
    id: 'cls-riyadh-1a',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    stageId: 'stg-riyadh-pri',
    gradeId: 'grd-riyadh-p1',
    nameAr: 'فصل 1/أ (النخبة)',
    nameEn: 'Section 1-A (Elite)',
    classCode: 'RUH-1A',
    capacity: 26,
    roomNumber: 'Q-101',
    status: 'active',
    notes: 'قاعة ذكية مجهزة بشاشات تفاعلية',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'cls-riyadh-1b',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    stageId: 'stg-riyadh-pri',
    gradeId: 'grd-riyadh-p1',
    nameAr: 'فصل 1/ب (المتفوقين)',
    nameEn: 'Section 1-B (Advanced)',
    classCode: 'RUH-1B',
    capacity: 25,
    roomNumber: 'Q-102',
    status: 'active',
    notes: 'مجهزة لمعامل STEM المبكرة',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'cls-riyadh-2a',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    stageId: 'stg-riyadh-pri',
    gradeId: 'grd-riyadh-p2',
    nameAr: 'فصل 2/أ',
    nameEn: 'Section 2-A',
    classCode: 'RUH-2A',
    capacity: 28,
    roomNumber: 'Q-201',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'cls-riyadh-m1a',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    stageId: 'stg-riyadh-mid',
    gradeId: 'grd-riyadh-m1',
    nameAr: 'فصل 1 متوسط/أ',
    nameEn: 'Section 7-A (Middle)',
    classCode: 'RUH-7A',
    capacity: 30,
    roomNumber: 'M-101',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'cls-riyadh-s1a',
    branchId: 'branch-riyadh',
    academicYearId: 'ay-riyadh-2026',
    stageId: 'stg-riyadh-sec',
    gradeId: 'grd-riyadh-s1',
    nameAr: 'فصل 1 ثانوي/مسار علمي',
    nameEn: 'Section 10-Science',
    classCode: 'RUH-10S',
    capacity: 32,
    roomNumber: 'S-301',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  // Jeddah
  {
    id: 'cls-jeddah-1a',
    branchId: 'branch-jeddah',
    academicYearId: 'ay-jeddah-2026',
    stageId: 'stg-jeddah-pri',
    gradeId: 'grd-jeddah-p1',
    nameAr: 'فصل 1/أ (الروضة)',
    nameEn: 'Section 1-A (Jeddah)',
    classCode: 'JED-1A',
    capacity: 24,
    roomNumber: 'J-101',
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
];

const SEEDED_SUBJECTS: Subject[] = [
  // Riyadh
  {
    id: 'sbj-riyadh-islamic',
    branchId: 'branch-riyadh',
    nameAr: 'الدراسات الإسلامية والقرآن الكريم',
    nameEn: 'Islamic Studies & Holy Quran',
    subjectCode: 'ISLAM-101',
    description: 'تلاوة، تفسير، توحيد، وفقه السلوك والأخلاق',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'sbj-riyadh-arabic',
    branchId: 'branch-riyadh',
    nameAr: 'لغتي الجميلة (اللغة العربية)',
    nameEn: 'Arabic Language (Lughati)',
    subjectCode: 'ARAB-101',
    description: 'القراءة، الإملاء، التعبير، والقواعد النحوية',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'sbj-riyadh-math',
    branchId: 'branch-riyadh',
    nameAr: 'الرياضيات التطبيقية',
    nameEn: 'Mathematics',
    subjectCode: 'MATH-101',
    description: 'العمليات الحسابية، الجبر، والهندسة التفاعلية',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'sbj-riyadh-science',
    branchId: 'branch-riyadh',
    nameAr: 'العلوم العامة',
    nameEn: 'General Science',
    subjectCode: 'SCI-101',
    description: 'الاستكشاف العلمي، الكائنات الحية، والظواهر الطبيعية',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'sbj-riyadh-english',
    branchId: 'branch-riyadh',
    nameAr: 'اللغة الإنجليزية التفاعلية',
    nameEn: 'English Language',
    subjectCode: 'ENG-101',
    description: 'محادثة، قراءة، استماع وفق معايير كامبريدج',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'sbj-riyadh-comp',
    branchId: 'branch-riyadh',
    nameAr: 'المهارات الرقمية والحاسب',
    nameEn: 'Digital Skills & Computing',
    subjectCode: 'COMP-101',
    description: 'أساسيات البرمجة، التفكير المنطقي، والأمن السيبراني للأطفال',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  // Jeddah
  {
    id: 'sbj-jeddah-math',
    branchId: 'branch-jeddah',
    nameAr: 'الرياضيات',
    nameEn: 'Mathematics',
    subjectCode: 'JED-MATH-01',
    description: 'منهج الرياضيات المطور',
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'sbj-jeddah-science',
    branchId: 'branch-jeddah',
    nameAr: 'العلوم والفيزياء',
    nameEn: 'Science & Physics',
    subjectCode: 'JED-SCI-01',
    description: 'تجارب معملية حديثة',
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
];

const SEEDED_GRADE_SUBJECTS: GradeSubject[] = [
  // Grade 1 Primary (Riyadh)
  {
    id: 'gs-r-p1-islamic',
    branchId: 'branch-riyadh',
    gradeId: 'grd-riyadh-p1',
    subjectId: 'sbj-riyadh-islamic',
    academicYearId: 'ay-riyadh-2026',
    weeklyPeriods: 5,
    creditHours: 3.0,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'gs-r-p1-arabic',
    branchId: 'branch-riyadh',
    gradeId: 'grd-riyadh-p1',
    subjectId: 'sbj-riyadh-arabic',
    academicYearId: 'ay-riyadh-2026',
    weeklyPeriods: 6,
    creditHours: 4.0,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'gs-r-p1-math',
    branchId: 'branch-riyadh',
    gradeId: 'grd-riyadh-p1',
    subjectId: 'sbj-riyadh-math',
    academicYearId: 'ay-riyadh-2026',
    weeklyPeriods: 5,
    creditHours: 3.5,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'gs-r-p1-science',
    branchId: 'branch-riyadh',
    gradeId: 'grd-riyadh-p1',
    subjectId: 'sbj-riyadh-science',
    academicYearId: 'ay-riyadh-2026',
    weeklyPeriods: 4,
    creditHours: 2.5,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'gs-r-p1-english',
    branchId: 'branch-riyadh',
    gradeId: 'grd-riyadh-p1',
    subjectId: 'sbj-riyadh-english',
    academicYearId: 'ay-riyadh-2026',
    weeklyPeriods: 4,
    creditHours: 3.0,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'gs-r-p1-comp',
    branchId: 'branch-riyadh',
    gradeId: 'grd-riyadh-p1',
    subjectId: 'sbj-riyadh-comp',
    academicYearId: 'ay-riyadh-2026',
    weeklyPeriods: 2,
    creditHours: 1.5,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  // Grade 2 Primary (Riyadh)
  {
    id: 'gs-r-p2-math',
    branchId: 'branch-riyadh',
    gradeId: 'grd-riyadh-p2',
    subjectId: 'sbj-riyadh-math',
    academicYearId: 'ay-riyadh-2026',
    weeklyPeriods: 5,
    creditHours: 3.5,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  // Grade 1 Primary (Jeddah)
  {
    id: 'gs-j-p1-math',
    branchId: 'branch-jeddah',
    gradeId: 'grd-jeddah-p1',
    subjectId: 'sbj-jeddah-math',
    academicYearId: 'ay-jeddah-2026',
    weeklyPeriods: 5,
    creditHours: 3.5,
    createdAt: '2026-01-12T08:00:00.000Z',
  },
];

export class AcademicStorageService {
  private static instance: AcademicStorageService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): AcademicStorageService {
    if (!AcademicStorageService.instance) {
      AcademicStorageService.instance = new AcademicStorageService();
    }
    return AcademicStorageService.instance;
  }

  public initialize(): void {
    if (this.initialized) return;

    if (!localStorage.getItem(ACADEMIC_YEARS_STORAGE_KEY)) {
      localStorage.setItem(ACADEMIC_YEARS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(ACADEMIC_STAGES_STORAGE_KEY)) {
      localStorage.setItem(ACADEMIC_STAGES_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(GRADES_STORAGE_KEY)) {
      localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(CLASSES_STORAGE_KEY)) {
      localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(SUBJECTS_STORAGE_KEY)) {
      localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(GRADE_SUBJECTS_STORAGE_KEY)) {
      localStorage.setItem(GRADE_SUBJECTS_STORAGE_KEY, JSON.stringify([]));
    }

    this.initialized = true;
  }

  // --- ACCESS HELPERS ---
  private isSuperAdmin(actingUser: SafeUser): boolean {
    return authStorage.isSuperAdmin(actingUser);
  }

  private checkBranchAccess(actingUser: SafeUser, targetBranchId: string): void {
    if (this.isSuperAdmin(actingUser) || actingUser.hasAllBranchesAccess) return;

    if (!actingUser.branchIds || !actingUser.branchIds.includes(targetBranchId)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_BRANCH_ACCESS',
        targetType: 'ACADEMIC',
        result: 'DENIED',
        details: `Security block: User "${actingUser.username}" denied access to branch "${targetBranchId}"`,
      });
      throw new Error(`غير مصرح لك بالوصول أو إدارة البيانات الأكاديمية للفرع المحدد (${targetBranchId}).`);
    }
  }

  private checkPermission(actingUser: SafeUser, requiredPermission: any): void {
    if (!authStorage.hasPermission(actingUser, requiredPermission)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        targetType: 'ACADEMIC',
        result: 'DENIED',
        details: `Security violation: Missing permission "${requiredPermission}"`,
      });
      throw new Error(`ليس لديك الصلاحية الكافية لإتمام هذه العملية (${requiredPermission}).`);
    }
  }

  // ==========================================
  // 1. ACADEMIC YEARS
  // ==========================================

  public getRawYears(): AcademicYear[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(ACADEMIC_YEARS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_YEARS;
    } catch {
      return SEEDED_YEARS;
    }
  }

  private saveYears(years: AcademicYear[]): void {
    localStorage.setItem(ACADEMIC_YEARS_STORAGE_KEY, JSON.stringify(years));
  }

  public listAcademicYears(actingUser: SafeUser, branchId?: string): AcademicYear[] {
    this.checkPermission(actingUser, 'academic_years.view');
    const all = this.getRawYears();

    if (branchId && branchId !== 'all') {
      this.checkBranchAccess(actingUser, branchId);
      return all.filter((y) => y.branchId === branchId);
    }

    // If 'all', filter by accessible branches
    if (actingUser.roleCode === 'SUPER_ADMIN' || actingUser.isProtectedSuperAdmin || actingUser.hasAllBranchesAccess) {
      return all;
    }
    return all.filter((y) => actingUser.branchIds.includes(y.branchId));
  }

  public createAcademicYear(
    actingUser: SafeUser,
    data: {
      branchId: string;
      nameAr: string;
      nameEn: string;
      startDate: string;
      endDate: string;
      status?: AcademicYearStatus;
      isCurrent?: boolean;
    }
  ): AcademicYear {
    this.checkPermission(actingUser, 'academic_years.create');
    this.checkBranchAccess(actingUser, data.branchId);

    if (!data.nameAr?.trim() || !data.nameEn?.trim()) {
      throw new Error('اسم السنة الدراسية مطلوب بالعربية والإنجليزية.');
    }

    if (!data.startDate || !data.endDate) {
      throw new Error('تاريخ بداية ونهاية السنة الدراسية مطلوب.');
    }

    // Rule 1: startDate must be before endDate
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      throw new Error('تاريخ بداية السنة الدراسية يجب أن يكون قبل تاريخ نهايتها.');
    }

    const years = this.getRawYears();

    // Check duplicate name within the same branch
    const duplicate = years.find(
      (y) =>
        y.branchId === data.branchId &&
        (y.nameAr.toLowerCase() === data.nameAr.trim().toLowerCase() ||
          y.nameEn.toLowerCase() === data.nameEn.trim().toLowerCase())
    );
    if (duplicate) {
      throw new Error('توجد سنة دراسية مسجلة مسبقاً بهذا الاسم لنفس الفرع.');
    }

    const isCurrent = Boolean(data.isCurrent);
    const status: AcademicYearStatus = data.status || (isCurrent ? 'ACTIVE' : 'PLANNED');

    // Rule 3: Cannot set CLOSED or ARCHIVED year as current
    if (isCurrent && (status === 'CLOSED' || status === 'ARCHIVED')) {
      throw new Error('لا يمكن تعيين سنة دراسية مغلقة أو مؤرشفة كسنة حالية نشطة.');
    }

    // Rule 2: Atomic single current year per branch
    if (isCurrent) {
      years.forEach((y) => {
        if (y.branchId === data.branchId) {
          y.isCurrent = false;
        }
      });
    }

    const newYear: AcademicYear = {
      id: `ay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      branchId: data.branchId,
      nameAr: data.nameAr.trim(),
      nameEn: data.nameEn.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
      status,
      isCurrent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    years.unshift(newYear);
    this.saveYears(years);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ACADEMIC_YEAR_CREATED',
      targetType: 'ACADEMIC',
      targetId: newYear.id,
      targetIdentifier: newYear.nameAr,
      branchContext: newYear.branchId,
      result: 'SUCCESS',
      details: `Created academic year "${newYear.nameAr}" (${newYear.startDate} to ${newYear.endDate})`,
    });

    return newYear;
  }

  public updateAcademicYear(
    actingUser: SafeUser,
    yearId: string,
    updates: {
      nameAr?: string;
      nameEn?: string;
      startDate?: string;
      endDate?: string;
      status?: AcademicYearStatus;
      isCurrent?: boolean;
    }
  ): AcademicYear {
    this.checkPermission(actingUser, 'academic_years.edit');
    const years = this.getRawYears();
    const target = years.find((y) => y.id === yearId);
    if (!target) throw new Error('السنة الدراسية المطلوبة غير موجودة.');

    this.checkBranchAccess(actingUser, target.branchId);

    const nextStartDate = updates.startDate ?? target.startDate;
    const nextEndDate = updates.endDate ?? target.endDate;

    if (new Date(nextStartDate) >= new Date(nextEndDate)) {
      throw new Error('تاريخ بداية السنة الدراسية يجب أن يكون قبل تاريخ نهايتها.');
    }

    const nextStatus = updates.status ?? target.status;
    const nextIsCurrent = updates.isCurrent !== undefined ? updates.isCurrent : target.isCurrent;

    // Rule 3: Cannot set closed/archived as current
    if (nextIsCurrent && (nextStatus === 'CLOSED' || nextStatus === 'ARCHIVED')) {
      throw new Error('لا يمكن تعيين سنة مغلقة أو مؤرشفة كسنة دراسية حالية.');
    }

    // Rule 4: Cannot archive current year without unsetting or replacing it
    if (target.isCurrent && nextStatus === 'ARCHIVED' && nextIsCurrent) {
      throw new Error('لا يمكن أرشفة السنة الدراسية الحالية دون تعيين سنة بديلة أولاً.');
    }

    // Atomic update for isCurrent
    if (nextIsCurrent) {
      years.forEach((y) => {
        if (y.branchId === target.branchId && y.id !== target.id) {
          y.isCurrent = false;
        }
      });
    }

    if (updates.nameAr) target.nameAr = updates.nameAr.trim();
    if (updates.nameEn) target.nameEn = updates.nameEn.trim();
    target.startDate = nextStartDate;
    target.endDate = nextEndDate;
    target.status = nextStatus;
    target.isCurrent = nextIsCurrent;
    target.updatedAt = new Date().toISOString();

    this.saveYears(years);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ACADEMIC_YEAR_UPDATED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Updated academic year "${target.nameAr}" [Status: ${target.status}, IsCurrent: ${target.isCurrent}]`,
    });

    return target;
  }

  public setCurrentAcademicYear(actingUser: SafeUser, yearId: string): AcademicYear {
    this.checkPermission(actingUser, 'academic_years.edit');
    const years = this.getRawYears();
    const target = years.find((y) => y.id === yearId);
    if (!target) throw new Error('السنة الدراسية المطلوبة غير موجودة.');

    this.checkBranchAccess(actingUser, target.branchId);

    if (target.status === 'CLOSED' || target.status === 'ARCHIVED') {
      throw new Error('لا يمكن تعيين سنة دراسية مغلقة أو مؤرشفة كسنة حالية نشطة.');
    }

    // Atomic switch: All others in same branch set to false
    years.forEach((y) => {
      if (y.branchId === target.branchId) {
        y.isCurrent = y.id === target.id;
      }
    });

    target.status = 'ACTIVE';
    target.updatedAt = new Date().toISOString();
    this.saveYears(years);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ACADEMIC_YEAR_ACTIVATED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Activated academic year "${target.nameAr}" as primary current year for campus`,
    });

    return target;
  }

  public deleteAcademicYear(actingUser: SafeUser, yearId: string): void {
    this.checkPermission(actingUser, 'academic_years.delete');
    const years = this.getRawYears();
    const target = years.find((y) => y.id === yearId);
    if (!target) throw new Error('السنة الدراسية المطلوبة غير موجودة.');

    this.checkBranchAccess(actingUser, target.branchId);

    if (target.isCurrent) {
      throw new Error('لا يمكن حذف السنة الدراسية المعينة كسنة حالية نشطة.');
    }

    // Check referential integrity: classes linked to this year
    const classes = this.getRawClasses();
    const linkedClasses = classes.filter((c) => c.academicYearId === yearId);
    if (linkedClasses.length > 0) {
      throw new Error(`لا يمكن حذف السنة الدراسية لأنها مرتبطة بـ (${linkedClasses.length}) فصول دراسية.`);
    }

    const filtered = years.filter((y) => y.id !== yearId);
    this.saveYears(filtered);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ACADEMIC_YEAR_ARCHIVED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Purged academic year "${target.nameAr}"`,
    });
  }

  // ==========================================
  // 2. ACADEMIC STAGES
  // ==========================================

  public getRawStages(): AcademicStage[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(ACADEMIC_STAGES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_STAGES;
    } catch {
      return SEEDED_STAGES;
    }
  }

  private saveStages(stages: AcademicStage[]): void {
    localStorage.setItem(ACADEMIC_STAGES_STORAGE_KEY, JSON.stringify(stages));
  }

  public listStages(actingUser: SafeUser, branchId?: string): AcademicStage[] {
    this.checkPermission(actingUser, 'academic_stages.view');
    const all = this.getRawStages().sort((a, b) => a.displayOrder - b.displayOrder);

    if (branchId && branchId !== 'all') {
      this.checkBranchAccess(actingUser, branchId);
      return all.filter((s) => s.branchId === branchId);
    }

    if (actingUser.roleCode === 'SUPER_ADMIN' || actingUser.isProtectedSuperAdmin || actingUser.hasAllBranchesAccess) {
      return all;
    }
    return all.filter((s) => actingUser.branchIds.includes(s.branchId));
  }

  public createStage(
    actingUser: SafeUser,
    data: {
      branchId: string;
      nameAr: string;
      nameEn: string;
      description?: string;
      displayOrder?: number;
      academicYearId?: string;
    }
  ): AcademicStage {
    this.checkPermission(actingUser, 'academic_stages.create');
    this.checkBranchAccess(actingUser, data.branchId);

    if (!data.nameAr?.trim() || !data.nameEn?.trim()) {
      throw new Error('اسم المرحلة الدراسية مطلوب بالعربية والإنجليزية.');
    }

    const stages = this.getRawStages();

    // Check duplicate name within the same branch
    const duplicate = stages.find(
      (s) =>
        s.branchId === data.branchId &&
        (s.nameAr.toLowerCase() === data.nameAr.trim().toLowerCase() ||
          s.nameEn.toLowerCase() === data.nameEn.trim().toLowerCase())
    );
    if (duplicate) {
      throw new Error('توجد مرحلة دراسية أخرى مسجلة بنفس الاسم في هذا الفرع.');
    }

    const branchStages = stages.filter((s) => s.branchId === data.branchId);
    const nextOrder = data.displayOrder ?? branchStages.length + 1;

    const newStage: AcademicStage = {
      id: `stg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      branchId: data.branchId,
      academicYearId: data.academicYearId,
      nameAr: data.nameAr.trim(),
      nameEn: data.nameEn.trim(),
      description: data.description?.trim() || '',
      displayOrder: nextOrder,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    stages.push(newStage);
    this.saveStages(stages);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ACADEMIC_STAGE_CREATED',
      targetType: 'ACADEMIC',
      targetId: newStage.id,
      targetIdentifier: newStage.nameAr,
      branchContext: newStage.branchId,
      result: 'SUCCESS',
      details: `Created academic stage "${newStage.nameAr}" in branch "${newStage.branchId}"`,
    });

    return newStage;
  }

  public updateStage(
    actingUser: SafeUser,
    stageId: string,
    updates: {
      nameAr?: string;
      nameEn?: string;
      description?: string;
      displayOrder?: number;
      status?: 'active' | 'inactive';
    }
  ): AcademicStage {
    this.checkPermission(actingUser, 'academic_stages.edit');
    const stages = this.getRawStages();
    const target = stages.find((s) => s.id === stageId);
    if (!target) throw new Error('المرحلة الدراسية غير موجودة.');

    this.checkBranchAccess(actingUser, target.branchId);

    if (updates.nameAr) target.nameAr = updates.nameAr.trim();
    if (updates.nameEn) target.nameEn = updates.nameEn.trim();
    if (updates.description !== undefined) target.description = updates.description.trim();
    if (updates.displayOrder !== undefined) target.displayOrder = updates.displayOrder;
    if (updates.status) target.status = updates.status;
    target.updatedAt = new Date().toISOString();

    this.saveStages(stages);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ACADEMIC_STAGE_UPDATED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Updated stage "${target.nameAr}" [Status: ${target.status}]`,
    });

    return target;
  }

  public toggleStageStatus(actingUser: SafeUser, stageId: string): AcademicStage {
    this.checkPermission(actingUser, 'academic_stages.delete');
    const stages = this.getRawStages();
    const target = stages.find((s) => s.id === stageId);
    if (!target) throw new Error('المرحلة الدراسية غير موجودة.');

    this.checkBranchAccess(actingUser, target.branchId);

    const nextStatus = target.status === 'active' ? 'inactive' : 'active';
    target.status = nextStatus;
    target.updatedAt = new Date().toISOString();

    this.saveStages(stages);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: nextStatus === 'inactive' ? 'ACADEMIC_STAGE_DISABLED' : 'ACADEMIC_STAGE_ENABLED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Toggled stage "${target.nameAr}" to "${nextStatus}"`,
    });

    return target;
  }

  public deleteStage(actingUser: SafeUser, stageId: string): void {
    this.checkPermission(actingUser, 'academic_stages.delete');
    const stages = this.getRawStages();
    const target = stages.find((s) => s.id === stageId);
    if (!target) throw new Error('المرحلة الدراسية غير موجودة.');

    this.checkBranchAccess(actingUser, target.branchId);

    // Safeguard child grades
    const grades = this.getRawGrades();
    const childGrades = grades.filter((g) => g.stageId === stageId);
    if (childGrades.length > 0) {
      throw new Error(`لا يمكن حذف المرحلة الدراسية لوجود (${childGrades.length}) صفوف مرتبطة بها. قم بحذف أو نقل الصفوف أولاً.`);
    }

    const filtered = stages.filter((s) => s.id !== stageId);
    this.saveStages(filtered);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ACADEMIC_STAGE_DISABLED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Deleted empty stage "${target.nameAr}"`,
    });
  }

  // ==========================================
  // 3. GRADES
  // ==========================================

  public getRawGrades(): Grade[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(GRADES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_GRADES;
    } catch {
      return SEEDED_GRADES;
    }
  }

  private saveGrades(grades: Grade[]): void {
    localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(grades));
  }

  public listGrades(actingUser: SafeUser, branchId?: string, stageId?: string): Grade[] {
    this.checkPermission(actingUser, 'grades.view');
    let all = this.getRawGrades().sort((a, b) => a.displayOrder - b.displayOrder);

    if (branchId && branchId !== 'all') {
      this.checkBranchAccess(actingUser, branchId);
      all = all.filter((g) => g.branchId === branchId);
    } else if (
      actingUser.roleCode !== 'SUPER_ADMIN' &&
      !actingUser.isProtectedSuperAdmin &&
      !actingUser.hasAllBranchesAccess
    ) {
      all = all.filter((g) => actingUser.branchIds.includes(g.branchId));
    }

    if (stageId && stageId !== 'all') {
      all = all.filter((g) => g.stageId === stageId);
    }

    return all;
  }

  public createGrade(
    actingUser: SafeUser,
    data: {
      branchId: string;
      stageId: string;
      nameAr: string;
      nameEn: string;
      gradeCode: string;
      displayOrder?: number;
    }
  ): Grade {
    this.checkPermission(actingUser, 'grades.create');
    this.checkBranchAccess(actingUser, data.branchId);

    if (!data.nameAr?.trim() || !data.nameEn?.trim() || !data.gradeCode?.trim()) {
      throw new Error('اسم الصف باللغتين وكود الصف حقول إلزامية.');
    }

    // Verify Stage exists AND belongs to the SAME branch (strict cross-branch protection!)
    const stages = this.getRawStages();
    const stage = stages.find((s) => s.id === data.stageId);
    if (!stage) {
      throw new Error('المرحلة الدراسية المحددة غير موجودة.');
    }
    if (stage.branchId !== data.branchId) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_BRANCH_ACCESS',
        targetType: 'ACADEMIC',
        result: 'DENIED',
        details: `Cross-branch violation: Attempted to link grade in branch "${data.branchId}" with stage in branch "${stage.branchId}"`,
      });
      throw new Error('أمان النظام: لا يمكن ربط صف دراسي بمرحلة تنتمي لفرع آخر.');
    }

    const grades = this.getRawGrades();
    // Unique gradeCode per branch
    const duplicateCode = grades.find(
      (g) => g.branchId === data.branchId && g.gradeCode.toLowerCase() === data.gradeCode.trim().toLowerCase()
    );
    if (duplicateCode) {
      throw new Error(`كود الصف (${data.gradeCode}) مستخدم مسبقاً في هذا الفرع.`);
    }

    const stageGrades = grades.filter((g) => g.stageId === data.stageId);
    const nextOrder = data.displayOrder ?? stageGrades.length + 1;

    const newGrade: Grade = {
      id: `grd-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      branchId: data.branchId,
      stageId: data.stageId,
      nameAr: data.nameAr.trim(),
      nameEn: data.nameEn.trim(),
      gradeCode: data.gradeCode.trim().toUpperCase(),
      displayOrder: nextOrder,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    grades.push(newGrade);
    this.saveGrades(grades);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'GRADE_CREATED',
      targetType: 'ACADEMIC',
      targetId: newGrade.id,
      targetIdentifier: newGrade.nameAr,
      branchContext: newGrade.branchId,
      result: 'SUCCESS',
      details: `Created grade "${newGrade.nameAr}" [Code: ${newGrade.gradeCode}] under stage "${stage.nameAr}"`,
    });

    return newGrade;
  }

  public updateGrade(
    actingUser: SafeUser,
    gradeId: string,
    updates: {
      nameAr?: string;
      nameEn?: string;
      gradeCode?: string;
      stageId?: string;
      displayOrder?: number;
      status?: 'active' | 'inactive';
    }
  ): Grade {
    this.checkPermission(actingUser, 'grades.edit');
    const grades = this.getRawGrades();
    const target = grades.find((g) => g.id === gradeId);
    if (!target) throw new Error('الصف الدراسي غير موجود.');

    this.checkBranchAccess(actingUser, target.branchId);

    if (updates.stageId && updates.stageId !== target.stageId) {
      const stages = this.getRawStages();
      const newStage = stages.find((s) => s.id === updates.stageId);
      if (!newStage || newStage.branchId !== target.branchId) {
        throw new Error('لا يمكن نقل الصف إلى مرحلة من فرع آخر.');
      }
      target.stageId = updates.stageId;
    }

    if (updates.gradeCode && updates.gradeCode !== target.gradeCode) {
      const duplicateCode = grades.find(
        (g) =>
          g.branchId === target.branchId &&
          g.id !== target.id &&
          g.gradeCode.toLowerCase() === updates.gradeCode!.trim().toLowerCase()
      );
      if (duplicateCode) {
        throw new Error(`كود الصف (${updates.gradeCode}) مستخدم مسبقاً.`);
      }
      target.gradeCode = updates.gradeCode.trim().toUpperCase();
    }

    if (updates.nameAr) target.nameAr = updates.nameAr.trim();
    if (updates.nameEn) target.nameEn = updates.nameEn.trim();
    if (updates.displayOrder !== undefined) target.displayOrder = updates.displayOrder;
    if (updates.status) target.status = updates.status;
    target.updatedAt = new Date().toISOString();

    this.saveGrades(grades);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'GRADE_UPDATED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Updated grade "${target.nameAr}" [Status: ${target.status}]`,
    });

    return target;
  }

  public toggleGradeStatus(actingUser: SafeUser, gradeId: string): Grade {
    this.checkPermission(actingUser, 'grades.delete');
    const grades = this.getRawGrades();
    const target = grades.find((g) => g.id === gradeId);
    if (!target) throw new Error('الصف الدراسي غير موجود.');

    this.checkBranchAccess(actingUser, target.branchId);

    const nextStatus = target.status === 'active' ? 'inactive' : 'active';
    target.status = nextStatus;
    target.updatedAt = new Date().toISOString();

    this.saveGrades(grades);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: nextStatus === 'inactive' ? 'GRADE_DISABLED' : 'GRADE_ENABLED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Toggled grade "${target.nameAr}" to "${nextStatus}"`,
    });

    return target;
  }

  public deleteGrade(actingUser: SafeUser, gradeId: string): void {
    this.checkPermission(actingUser, 'grades.delete');
    const grades = this.getRawGrades();
    const target = grades.find((g) => g.id === gradeId);
    if (!target) throw new Error('الصف الدراسي غير موجود.');

    this.checkBranchAccess(actingUser, target.branchId);

    // Safeguard child classes
    const classes = this.getRawClasses();
    const childClasses = classes.filter((c) => c.gradeId === gradeId);
    if (childClasses.length > 0) {
      throw new Error(`لا يمكن حذف الصف الدراسي لوجود (${childClasses.length}) فصول دراسية مرتبطة به.`);
    }

    const filtered = grades.filter((g) => g.id !== gradeId);
    this.saveGrades(filtered);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'GRADE_DISABLED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Deleted grade level "${target.nameAr}"`,
    });
  }

  // ==========================================
  // 4. CLASSES & SECTIONS
  // ==========================================

  public getRawClasses(): ClassSection[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(CLASSES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_CLASSES;
    } catch {
      return SEEDED_CLASSES;
    }
  }

  private saveClasses(classes: ClassSection[]): void {
    localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(classes));
  }

  public listClasses(
    actingUser: SafeUser,
    filters?: {
      branchId?: string;
      academicYearId?: string;
      stageId?: string;
      gradeId?: string;
    }
  ): ClassSection[] {
    this.checkPermission(actingUser, 'classes.view');
    let all = this.getRawClasses();

    if (filters?.branchId && filters.branchId !== 'all') {
      this.checkBranchAccess(actingUser, filters.branchId);
      all = all.filter((c) => c.branchId === filters.branchId);
    } else if (
      actingUser.roleCode !== 'SUPER_ADMIN' &&
      !actingUser.isProtectedSuperAdmin &&
      !actingUser.hasAllBranchesAccess
    ) {
      all = all.filter((c) => actingUser.branchIds.includes(c.branchId));
    }

    if (filters?.academicYearId && filters.academicYearId !== 'all') {
      all = all.filter((c) => c.academicYearId === filters.academicYearId);
    }

    if (filters?.stageId && filters.stageId !== 'all') {
      all = all.filter((c) => c.stageId === filters.stageId);
    }

    if (filters?.gradeId && filters.gradeId !== 'all') {
      all = all.filter((c) => c.gradeId === filters.gradeId);
    }

    return all;
  }

  public createClass(
    actingUser: SafeUser,
    data: {
      branchId: string;
      academicYearId: string;
      stageId: string;
      gradeId: string;
      nameAr: string;
      nameEn: string;
      classCode: string;
      capacity: number;
      roomNumber?: string;
      notes?: string;
    }
  ): ClassSection {
    this.checkPermission(actingUser, 'classes.create');
    this.checkBranchAccess(actingUser, data.branchId);

    if (!data.nameAr?.trim() || !data.nameEn?.trim() || !data.classCode?.trim()) {
      throw new Error('اسم الفصل باللغتين وكود الفصل حقول إلزامية.');
    }

    if (!data.capacity || data.capacity <= 0 || !Number.isInteger(Number(data.capacity))) {
      throw new Error('السعة الاستيعابية للفصل يجب أن تكون رقماً صحيحاً موجباً أكبر من الصفر.');
    }

    // Verify consistency: Academic Year belongs to this branch
    const years = this.getRawYears();
    const year = years.find((y) => y.id === data.academicYearId);
    if (!year || year.branchId !== data.branchId) {
      throw new Error('السنة الدراسية المحددة غير متوافقة مع الفرع.');
    }

    // Verify Stage belongs to this branch
    const stages = this.getRawStages();
    const stage = stages.find((s) => s.id === data.stageId);
    if (!stage || stage.branchId !== data.branchId) {
      throw new Error('المرحلة الدراسية غير متوافقة مع الفرع.');
    }

    // Verify Grade belongs to this stage and branch
    const grades = this.getRawGrades();
    const grade = grades.find((g) => g.id === data.gradeId);
    if (!grade || grade.stageId !== data.stageId || grade.branchId !== data.branchId) {
      throw new Error('الصف الدراسي غير متوافق مع المرحلة أو الفرع المحدد.');
    }

    // Unique class code within same branch and academic year
    const classes = this.getRawClasses();
    const duplicateCode = classes.find(
      (c) =>
        c.branchId === data.branchId &&
        c.academicYearId === data.academicYearId &&
        c.classCode.toLowerCase() === data.classCode.trim().toLowerCase()
    );
    if (duplicateCode) {
      throw new Error(`كود الفصل (${data.classCode}) مستخدم مسبقاً في هذا العام الدراسي.`);
    }

    const newClass: ClassSection = {
      id: `cls-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      branchId: data.branchId,
      academicYearId: data.academicYearId,
      stageId: data.stageId,
      gradeId: data.gradeId,
      nameAr: data.nameAr.trim(),
      nameEn: data.nameEn.trim(),
      classCode: data.classCode.trim().toUpperCase(),
      capacity: Number(data.capacity),
      roomNumber: data.roomNumber?.trim() || '',
      status: 'active',
      notes: data.notes?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    classes.push(newClass);
    this.saveClasses(classes);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'CLASS_CREATED',
      targetType: 'ACADEMIC',
      targetId: newClass.id,
      targetIdentifier: newClass.nameAr,
      branchContext: newClass.branchId,
      result: 'SUCCESS',
      details: `Created class section "${newClass.nameAr}" [Code: ${newClass.classCode}, Capacity: ${newClass.capacity}] under grade "${grade.nameAr}"`,
    });

    return newClass;
  }

  public updateClass(
    actingUser: SafeUser,
    classId: string,
    updates: {
      nameAr?: string;
      nameEn?: string;
      classCode?: string;
      capacity?: number;
      roomNumber?: string;
      status?: 'active' | 'inactive';
      notes?: string;
    }
  ): ClassSection {
    this.checkPermission(actingUser, 'classes.edit');
    const classes = this.getRawClasses();
    const target = classes.find((c) => c.id === classId);
    if (!target) throw new Error('الفصل الدراسي غير موجود.');

    this.checkBranchAccess(actingUser, target.branchId);

    if (updates.capacity !== undefined) {
      if (updates.capacity <= 0 || !Number.isInteger(Number(updates.capacity))) {
        throw new Error('السعة الاستيعابية يجب أن تكون رقماً صحيحاً أكبر من الصفر.');
      }
      target.capacity = Number(updates.capacity);
    }

    if (updates.classCode && updates.classCode !== target.classCode) {
      const duplicateCode = classes.find(
        (c) =>
          c.branchId === target.branchId &&
          c.academicYearId === target.academicYearId &&
          c.id !== target.id &&
          c.classCode.toLowerCase() === updates.classCode!.trim().toLowerCase()
      );
      if (duplicateCode) {
        throw new Error(`كود الفصل (${updates.classCode}) مستخدم مسبقاً.`);
      }
      target.classCode = updates.classCode.trim().toUpperCase();
    }

    if (updates.nameAr) target.nameAr = updates.nameAr.trim();
    if (updates.nameEn) target.nameEn = updates.nameEn.trim();
    if (updates.roomNumber !== undefined) target.roomNumber = updates.roomNumber.trim();
    if (updates.status) target.status = updates.status;
    if (updates.notes !== undefined) target.notes = updates.notes.trim();
    target.updatedAt = new Date().toISOString();

    this.saveClasses(classes);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'CLASS_UPDATED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Updated class section "${target.nameAr}" [Status: ${target.status}, Cap: ${target.capacity}]`,
    });

    return target;
  }

  public toggleClassStatus(actingUser: SafeUser, classId: string): ClassSection {
    this.checkPermission(actingUser, 'classes.delete');
    const classes = this.getRawClasses();
    const target = classes.find((c) => c.id === classId);
    if (!target) throw new Error('الفصل الدراسي غير موجود.');

    this.checkBranchAccess(actingUser, target.branchId);

    const nextStatus = target.status === 'active' ? 'inactive' : 'active';
    target.status = nextStatus;
    target.updatedAt = new Date().toISOString();

    this.saveClasses(classes);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: nextStatus === 'inactive' ? 'CLASS_DISABLED' : 'CLASS_ENABLED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Toggled class section "${target.nameAr}" to "${nextStatus}"`,
    });

    return target;
  }

  public deleteClass(actingUser: SafeUser, classId: string): void {
    this.checkPermission(actingUser, 'classes.delete');
    const classes = this.getRawClasses();
    const target = classes.find((c) => c.id === classId);
    if (!target) throw new Error('الفصل الدراسي غير موجود.');

    this.checkBranchAccess(actingUser, target.branchId);

    const filtered = classes.filter((c) => c.id !== classId);
    this.saveClasses(filtered);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'CLASS_DISABLED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Deleted class section "${target.nameAr}"`,
    });
  }

  // ==========================================
  // 5. SUBJECTS
  // ==========================================

  public getRawSubjects(): Subject[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(SUBJECTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_SUBJECTS;
    } catch {
      return SEEDED_SUBJECTS;
    }
  }

  private saveSubjects(subjects: Subject[]): void {
    localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(subjects));
  }

  public listSubjects(actingUser: SafeUser, branchId?: string): Subject[] {
    this.checkPermission(actingUser, 'subjects.view');
    const all = this.getRawSubjects();

    if (branchId && branchId !== 'all') {
      this.checkBranchAccess(actingUser, branchId);
      return all.filter((s) => s.branchId === branchId);
    }

    if (actingUser.roleCode === 'SUPER_ADMIN' || actingUser.isProtectedSuperAdmin || actingUser.hasAllBranchesAccess) {
      return all;
    }
    return all.filter((s) => actingUser.branchIds.includes(s.branchId));
  }

  public createSubject(
    actingUser: SafeUser,
    data: {
      branchId: string;
      nameAr: string;
      nameEn: string;
      subjectCode: string;
      description?: string;
    }
  ): Subject {
    this.checkPermission(actingUser, 'subjects.create');
    this.checkBranchAccess(actingUser, data.branchId);

    if (!data.nameAr?.trim() || !data.nameEn?.trim() || !data.subjectCode?.trim()) {
      throw new Error('اسم المادة باللغتين وكود المادة حقول إلزامية.');
    }

    const subjects = this.getRawSubjects();
    const duplicateCode = subjects.find(
      (s) =>
        s.branchId === data.branchId &&
        s.subjectCode.toLowerCase() === data.subjectCode.trim().toLowerCase()
    );
    if (duplicateCode) {
      throw new Error(`كود المادة (${data.subjectCode}) مستخدم مسبقاً في هذا الفرع.`);
    }

    const newSubject: Subject = {
      id: `sbj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      branchId: data.branchId,
      nameAr: data.nameAr.trim(),
      nameEn: data.nameEn.trim(),
      subjectCode: data.subjectCode.trim().toUpperCase(),
      description: data.description?.trim() || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    subjects.push(newSubject);
    this.saveSubjects(subjects);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'SUBJECT_CREATED',
      targetType: 'ACADEMIC',
      targetId: newSubject.id,
      targetIdentifier: newSubject.nameAr,
      branchContext: newSubject.branchId,
      result: 'SUCCESS',
      details: `Created subject "${newSubject.nameAr}" [Code: ${newSubject.subjectCode}] for branch "${newSubject.branchId}"`,
    });

    return newSubject;
  }

  public updateSubject(
    actingUser: SafeUser,
    subjectId: string,
    updates: {
      nameAr?: string;
      nameEn?: string;
      subjectCode?: string;
      description?: string;
      status?: 'active' | 'inactive';
    }
  ): Subject {
    this.checkPermission(actingUser, 'subjects.edit');
    const subjects = this.getRawSubjects();
    const target = subjects.find((s) => s.id === subjectId);
    if (!target) throw new Error('المادة الدراسية غير موجودة.');

    this.checkBranchAccess(actingUser, target.branchId);

    if (updates.subjectCode && updates.subjectCode !== target.subjectCode) {
      const duplicateCode = subjects.find(
        (s) =>
          s.branchId === target.branchId &&
          s.id !== target.id &&
          s.subjectCode.toLowerCase() === updates.subjectCode!.trim().toLowerCase()
      );
      if (duplicateCode) {
        throw new Error(`كود المادة (${updates.subjectCode}) مستخدم مسبقاً.`);
      }
      target.subjectCode = updates.subjectCode.trim().toUpperCase();
    }

    if (updates.nameAr) target.nameAr = updates.nameAr.trim();
    if (updates.nameEn) target.nameEn = updates.nameEn.trim();
    if (updates.description !== undefined) target.description = updates.description.trim();
    if (updates.status) target.status = updates.status;
    target.updatedAt = new Date().toISOString();

    this.saveSubjects(subjects);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'SUBJECT_UPDATED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Updated subject "${target.nameAr}" [Status: ${target.status}]`,
    });

    return target;
  }

  public toggleSubjectStatus(actingUser: SafeUser, subjectId: string): Subject {
    this.checkPermission(actingUser, 'subjects.delete');
    const subjects = this.getRawSubjects();
    const target = subjects.find((s) => s.id === subjectId);
    if (!target) throw new Error('المادة الدراسية غير موجودة.');

    this.checkBranchAccess(actingUser, target.branchId);

    const nextStatus = target.status === 'active' ? 'inactive' : 'active';
    target.status = nextStatus;
    target.updatedAt = new Date().toISOString();

    this.saveSubjects(subjects);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: nextStatus === 'inactive' ? 'SUBJECT_DISABLED' : 'SUBJECT_ENABLED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Toggled subject "${target.nameAr}" to "${nextStatus}"`,
    });

    return target;
  }

  public deleteSubject(actingUser: SafeUser, subjectId: string): void {
    this.checkPermission(actingUser, 'subjects.delete');
    const subjects = this.getRawSubjects();
    const target = subjects.find((s) => s.id === subjectId);
    if (!target) throw new Error('المادة الدراسية غير موجودة.');

    this.checkBranchAccess(actingUser, target.branchId);

    // Safeguard attached grade-subject links
    const gradeSubjects = this.getRawGradeSubjects();
    const links = gradeSubjects.filter((gs) => gs.subjectId === subjectId);
    if (links.length > 0) {
      throw new Error(`لا يمكن حذف المادة لوجود (${links.length}) خطط مقررات دراسية مرتبطة بها بالصفوف.`);
    }

    const filtered = subjects.filter((s) => s.id !== subjectId);
    this.saveSubjects(filtered);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'SUBJECT_DISABLED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      targetIdentifier: target.nameAr,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Deleted subject "${target.nameAr}"`,
    });
  }

  // ==========================================
  // 6. GRADE-SUBJECT RELATIONSHIPS (CURRICULUM)
  // ==========================================

  public getRawGradeSubjects(): GradeSubject[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(GRADE_SUBJECTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_GRADE_SUBJECTS;
    } catch {
      return SEEDED_GRADE_SUBJECTS;
    }
  }

  private saveGradeSubjects(links: GradeSubject[]): void {
    localStorage.setItem(GRADE_SUBJECTS_STORAGE_KEY, JSON.stringify(links));
  }

  public listGradeSubjects(actingUser: SafeUser, branchId?: string, gradeId?: string): GradeSubject[] {
    this.checkPermission(actingUser, 'grade_subjects.view');
    let all = this.getRawGradeSubjects();

    if (branchId && branchId !== 'all') {
      this.checkBranchAccess(actingUser, branchId);
      all = all.filter((l) => l.branchId === branchId);
    } else if (
      actingUser.roleCode !== 'SUPER_ADMIN' &&
      !actingUser.isProtectedSuperAdmin &&
      !actingUser.hasAllBranchesAccess
    ) {
      all = all.filter((l) => actingUser.branchIds.includes(l.branchId));
    }

    if (gradeId && gradeId !== 'all') {
      all = all.filter((l) => l.gradeId === gradeId);
    }

    return all;
  }

  public assignSubjectToGrade(
    actingUser: SafeUser,
    data: {
      branchId: string;
      gradeId: string;
      subjectId: string;
      academicYearId?: string;
      weeklyPeriods: number;
      creditHours?: number;
    }
  ): GradeSubject {
    this.checkPermission(actingUser, 'grade_subjects.create');
    this.checkBranchAccess(actingUser, data.branchId);

    if (!data.weeklyPeriods || data.weeklyPeriods <= 0) {
      throw new Error('نصاب الحصص الأسبوعية يجب أن يكون رقماً موجباً أكبر من الصفر.');
    }

    // Verify Grade exists in this branch
    const grades = this.getRawGrades();
    const grade = grades.find((g) => g.id === data.gradeId);
    if (!grade) {
      throw new Error('الصف الدراسي المحدد غير موجود.');
    }
    if (grade.branchId !== data.branchId) {
      throw new Error('الصف الدراسي ينتمي إلى فرع آخر.');
    }

    // Verify Subject exists in this branch (Strict cross-branch prevention!)
    const subjects = this.getRawSubjects();
    const subject = subjects.find((s) => s.id === data.subjectId);
    if (!subject) {
      throw new Error('المادة الدراسية المحددة غير موجودة.');
    }
    if (subject.branchId !== data.branchId) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_BRANCH_ACCESS',
        targetType: 'ACADEMIC',
        result: 'DENIED',
        details: `Cross-branch curriculum violation: Tried to assign subject from branch "${subject.branchId}" to grade in branch "${grade.branchId}"`,
      });
      throw new Error('أمان النظام: غير مسموح بربط مادة من فرع بصف دراسي تابع لفرع آخر.');
    }

    const links = this.getRawGradeSubjects();

    // Check duplicate assignment
    const duplicate = links.find(
      (l) =>
        l.branchId === data.branchId &&
        l.gradeId === data.gradeId &&
        l.subjectId === data.subjectId &&
        (!data.academicYearId || !l.academicYearId || l.academicYearId === data.academicYearId)
    );
    if (duplicate) {
      throw new Error(`المادة (${subject.nameAr}) مقررة ومسندة مسبقاً لهذا الصف.`);
    }

    const newLink: GradeSubject = {
      id: `gs-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      branchId: data.branchId,
      gradeId: data.gradeId,
      subjectId: data.subjectId,
      academicYearId: data.academicYearId,
      weeklyPeriods: Number(data.weeklyPeriods),
      creditHours: data.creditHours ? Number(data.creditHours) : undefined,
      createdAt: new Date().toISOString(),
    };

    links.push(newLink);
    this.saveGradeSubjects(links);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'GRADE_SUBJECT_ASSIGNED',
      targetType: 'ACADEMIC',
      targetId: newLink.id,
      targetIdentifier: `${grade.nameAr} - ${subject.nameAr}`,
      branchContext: newLink.branchId,
      result: 'SUCCESS',
      details: `Assigned subject "${subject.nameAr}" to grade "${grade.nameAr}" (${newLink.weeklyPeriods} periods/week)`,
    });

    return newLink;
  }

  public updateGradeSubject(
    actingUser: SafeUser,
    linkId: string,
    updates: { weeklyPeriods?: number; creditHours?: number }
  ): GradeSubject {
    this.checkPermission(actingUser, 'grade_subjects.edit');
    const links = this.getRawGradeSubjects();
    const target = links.find((l) => l.id === linkId);
    if (!target) throw new Error('ارتباط المقرر بالصف غير موجود.');

    this.checkBranchAccess(actingUser, target.branchId);

    if (updates.weeklyPeriods !== undefined) {
      if (updates.weeklyPeriods <= 0) {
        throw new Error('نصاب الحصص الأسبوعية يجب أن يكون أكبر من الصفر.');
      }
      target.weeklyPeriods = Number(updates.weeklyPeriods);
    }

    if (updates.creditHours !== undefined) {
      target.creditHours = Number(updates.creditHours);
    }

    this.saveGradeSubjects(links);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'GRADE_SUBJECT_ASSIGNED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Updated periods allocation for grade-subject link (${target.weeklyPeriods} periods)`,
    });

    return target;
  }

  public removeGradeSubject(actingUser: SafeUser, linkId: string): void {
    this.checkPermission(actingUser, 'grade_subjects.delete');
    const links = this.getRawGradeSubjects();
    const target = links.find((l) => l.id === linkId);
    if (!target) throw new Error('ارتباط المقرر بالصف غير موجود.');

    this.checkBranchAccess(actingUser, target.branchId);

    const filtered = links.filter((l) => l.id !== linkId);
    this.saveGradeSubjects(filtered);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'GRADE_SUBJECT_REMOVED',
      targetType: 'ACADEMIC',
      targetId: target.id,
      branchContext: target.branchId,
      result: 'SUCCESS',
      details: `Unlinked subject from grade (link ID: ${target.id})`,
    });
  }

  // ==========================================
  // 7. REAL OVERVIEW STATS (Strict Branch Scope)
  // ==========================================

  public getAcademicOverviewStats(actingUser: SafeUser, branchId: string): AcademicBranchStats {
    this.checkPermission(actingUser, 'academic_years.view');

    const years = this.getRawYears();
    const stages = this.getRawStages();
    const grades = this.getRawGrades();
    const classes = this.getRawClasses();
    const subjects = this.getRawSubjects();
    const gradeSubjects = this.getRawGradeSubjects();

    if (branchId !== 'all') {
      this.checkBranchAccess(actingUser, branchId);
      const bYears = years.filter((y) => y.branchId === branchId);
      const activeYear = bYears.find((y) => y.isCurrent);
      const bStages = stages.filter((s) => s.branchId === branchId && s.status === 'active');
      const bGrades = grades.filter((g) => g.branchId === branchId && g.status === 'active');
      const bClasses = classes.filter((c) => c.branchId === branchId && c.status === 'active');
      const bSubjects = subjects.filter((s) => s.branchId === branchId && s.status === 'active');
      const bLinks = gradeSubjects.filter((l) => l.branchId === branchId);

      const totalCap = bClasses.reduce((sum, c) => sum + (c.capacity || 0), 0);

      return {
        branchId,
        branchName: branchId,
        yearsCount: bYears.length,
        activeYearName: activeYear?.nameAr,
        stagesCount: bStages.length,
        gradesCount: bGrades.length,
        classesCount: bClasses.length,
        totalCapacity: totalCap,
        subjectsCount: bSubjects.length,
        gradeSubjectLinksCount: bLinks.length,
      };
    }

    // 'all' aggregates
    const accessibleBranchIds =
      authStorage.isSuperAdmin(actingUser) ||
      actingUser.hasAllBranchesAccess
        ? null
        : actingUser.branchIds;

    const filterByAccess = <T extends { branchId: string }>(items: T[]) => {
      if (!accessibleBranchIds) return items;
      return items.filter((i) => accessibleBranchIds.includes(i.branchId));
    };

    const allowedYears = filterByAccess(years);
    const allowedStages = filterByAccess(stages).filter((s) => s.status === 'active');
    const allowedGrades = filterByAccess(grades).filter((g) => g.status === 'active');
    const allowedClasses = filterByAccess(classes).filter((c) => c.status === 'active');
    const allowedSubjects = filterByAccess(subjects).filter((s) => s.status === 'active');
    const allowedLinks = filterByAccess(gradeSubjects);

    const totalCap = allowedClasses.reduce((sum, c) => sum + (c.capacity || 0), 0);

    return {
      branchId: 'all',
      branchName: 'جميع الفروع',
      yearsCount: allowedYears.length,
      activeYearName: 'متعدد الفروع',
      stagesCount: allowedStages.length,
      gradesCount: allowedGrades.length,
      classesCount: allowedClasses.length,
      totalCapacity: totalCap,
      subjectsCount: allowedSubjects.length,
      gradeSubjectLinksCount: allowedLinks.length,
    };
  }
}

export const academicStorage = AcademicStorageService.getInstance();
