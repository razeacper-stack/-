import { Branch } from '../types';
import { SafeUser } from '../types/auth';
import { authStorage } from './authStorage';

const BRANCHES_STORAGE_KEY = 'sms_branches_v3';

export const SEEDED_BRANCHES: Branch[] = [
  {
    id: 'branch-riyadh',
    code: 'BR001',
    nameAr: 'فرع الرياض الرئيسي',
    nameEn: 'Riyadh Main Campus',
    addressAr: 'حي النخيل، طريق الإمام سعود، الرياض',
    addressEn: 'Al Nakheel District, Imam Saud Road, Riyadh',
    phone: '+966 11 456 7890',
    email: 'riyadh@schoolms.edu',
    managerName: 'أ. صالح المنصور',
    studentCount: 1420,
    teacherCount: 88,
    classCount: 42,
    status: 'active',
    createdAt: '2023-01-15T08:00:00.000Z',
    updatedAt: '2026-01-10T12:00:00.000Z',
  },
  {
    id: 'branch-jeddah',
    code: 'BR002',
    nameAr: 'فرع جدة النموذجي',
    nameEn: 'Jeddah Model Campus',
    addressAr: 'حي الروضة، شارع الأمير سلطان، جدة',
    addressEn: 'Al Rawdah District, Prince Sultan St, Jeddah',
    phone: '+966 12 654 3210',
    email: 'jeddah@schoolms.edu',
    managerName: 'أ. منى الغامدي',
    studentCount: 980,
    teacherCount: 64,
    classCount: 30,
    status: 'active',
    createdAt: '2023-03-20T08:00:00.000Z',
    updatedAt: '2026-01-12T10:30:00.000Z',
  },
  {
    id: 'branch-dammam',
    code: 'BR003',
    nameAr: 'فرع الدمام الدولي',
    nameEn: 'Dammam International Campus',
    addressAr: 'حي الشاطئ، طريق الخليج، الدمام',
    addressEn: 'Al Shati District, Gulf Road, Dammam',
    phone: '+966 13 890 1234',
    email: 'dammam@schoolms.edu',
    managerName: 'د. خالد الزهراني',
    studentCount: 850,
    teacherCount: 52,
    classCount: 26,
    status: 'active',
    createdAt: '2023-08-10T09:00:00.000Z',
    updatedAt: '2026-01-15T14:20:00.000Z',
  },
  {
    id: 'branch-makkah',
    code: 'BR004',
    nameAr: 'فرع مكة المكرمة',
    nameEn: 'Makkah Campus',
    addressAr: 'حي العوالي، الشارع العام، مكة المكرمة',
    addressEn: 'Al Awali District, Main Street, Makkah',
    phone: '+966 12 555 4321',
    email: 'makkah@schoolms.edu',
    managerName: 'أ. فهد القرشي',
    studentCount: 620,
    teacherCount: 41,
    classCount: 20,
    status: 'active',
    createdAt: '2024-01-05T08:00:00.000Z',
    updatedAt: '2026-01-20T11:15:00.000Z',
  },
  {
    id: 'branch-madinah',
    code: 'BR005',
    nameAr: 'فرع المدينة المنورة',
    nameEn: 'Madinah Campus',
    addressAr: 'حي الهجرة، طريق سلطانة، المدينة المنورة',
    addressEn: 'Al Hijrah District, Sultana Road, Madinah',
    phone: '+966 14 848 1122',
    email: 'madinah@schoolms.edu',
    managerName: 'أ. يوسف الحربي',
    studentCount: 540,
    teacherCount: 36,
    classCount: 18,
    status: 'active',
    createdAt: '2024-04-12T08:00:00.000Z',
    updatedAt: '2026-02-01T09:45:00.000Z',
  },
];

export class BranchStorageService {
  private static instance: BranchStorageService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): BranchStorageService {
    if (!BranchStorageService.instance) {
      BranchStorageService.instance = new BranchStorageService();
    }
    return BranchStorageService.instance;
  }

  public initialize(): void {
    if (this.initialized) return;

    try {
      const stored = localStorage.getItem(BRANCHES_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(SEEDED_BRANCHES));
      }
    } catch (e) {
      console.error('Error initializing branches storage', e);
    }
    this.initialized = true;
  }

  // Generate the next available branch code (e.g. BR006, BR007)
  public generateNextBranchCode(): string {
    const branches = this.getStoredBranches();
    let maxNum = 0;
    branches.forEach((b) => {
      const match = b.code.match(/BR(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum > 0 ? maxNum + 1 : branches.length + 1;
    return `BR${String(nextNum).padStart(3, '0')}`;
  }

  // Check if a code is available for use
  public isCodeAvailable(code: string, excludeBranchId?: string): boolean {
    const clean = code.trim().toUpperCase();
    if (!clean) return false;
    const branches = this.getStoredBranches();
    return !branches.some((b) => b.code.toUpperCase() === clean && b.id !== excludeBranchId);
  }

  // Calculate aggregated campus statistics
  public getBranchStats(user: SafeUser) {
    const list = this.listBranches(user, true);
    const activeList = list.filter((b) => b.status === 'active');
    const inactiveList = list.filter((b) => b.status === 'inactive');

    const totalStudents = list.reduce((sum, b) => sum + (b.studentCount || 0), 0);
    const totalTeachers = list.reduce((sum, b) => sum + (b.teacherCount || 0), 0);
    const totalClasses = list.reduce((sum, b) => sum + (b.classCount || 0), 0);

    return {
      totalBranches: list.length,
      activeBranches: activeList.length,
      inactiveBranches: inactiveList.length,
      totalStudents,
      totalTeachers,
      totalClasses,
    };
  }

  // Reset to default seed branches (Super Admin only for verification/demo)
  public resetToDefaults(actingUser: SafeUser): void {
    if (actingUser.roleCode !== 'SUPER_ADMIN' && !actingUser.isProtectedSuperAdmin) {
      throw new Error('فقط المشرف العام يحق له إعادة تعيين الفروع الافتراضية.');
    }
    this.saveBranches(SEEDED_BRANCHES);
    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'SYSTEM_SETTINGS_CHANGED',
      targetType: 'SYSTEM',
      result: 'SUCCESS',
      details: 'Super Admin reset branches to default seeded campuses.',
    });
  }

  public getStoredBranches(): Branch[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(BRANCHES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEEDED_BRANCHES;
    } catch {
      return SEEDED_BRANCHES;
    }
  }

  private saveBranches(branches: Branch[]): void {
    try {
      localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(branches));
    } catch (e) {
      console.error('Error saving branches to storage', e);
    }
  }

  // Check if a user has access to a specific branch
  public canUserAccessBranch(user: SafeUser, branchId: string): boolean {
    if (user.roleCode === 'SUPER_ADMIN' || user.isProtectedSuperAdmin || user.hasAllBranchesAccess) {
      return true;
    }
    if (!user.branchIds || user.branchIds.length === 0) {
      return false;
    }
    return user.branchIds.includes(branchId);
  }

  // Get list of branches accessible to this user
  public getUserAccessibleBranches(user: SafeUser, includeInactive = false): Branch[] {
    const all = this.getStoredBranches();
    const isSuperAdmin = user.roleCode === 'SUPER_ADMIN' || user.isProtectedSuperAdmin || user.hasAllBranchesAccess;

    return all.filter((b) => {
      // Inactive branches: visible only to users with branches.edit or Super Admin
      if (b.status === 'inactive' && !includeInactive && !isSuperAdmin) {
        return false;
      }
      if (isSuperAdmin) return true;
      return user.branchIds && user.branchIds.includes(b.id);
    });
  }

  // List branches with authorization check and data isolation
  public listBranches(actingUser: SafeUser, includeInactive = true): Branch[] {
    if (!authStorage.hasPermission(actingUser, 'branches.view')) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_BRANCH_ACCESS',
        targetType: 'BRANCH',
        result: 'DENIED',
        details: 'Attempted to list branches without branches.view permission',
      });
      throw new Error('غير مصرح لك باستعراض الفروع المدرسية.');
    }

    const all = this.getStoredBranches();
    const isSuperAdmin = actingUser.roleCode === 'SUPER_ADMIN' || actingUser.isProtectedSuperAdmin || actingUser.hasAllBranchesAccess;

    if (isSuperAdmin) {
      return includeInactive ? all : all.filter((b) => b.status === 'active');
    }

    // Normal staff: filter strictly by assigned branches
    return all.filter((b) => {
      const isAssigned = actingUser.branchIds && actingUser.branchIds.includes(b.id);
      if (!isAssigned) return false;
      if (!includeInactive && b.status === 'inactive') return false;
      return true;
    });
  }

  // Get specific branch with strict branch isolation check
  public getBranchById(actingUser: SafeUser, branchId: string): Branch {
    const branches = this.getStoredBranches();
    const branch = branches.find((b) => b.id === branchId);

    if (!branch) {
      throw new Error('الفرع المطلوب غير موجود في النظام.');
    }

    // Enforce branch data isolation
    if (!this.canUserAccessBranch(actingUser, branchId)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_BRANCH_ACCESS',
        targetType: 'BRANCH',
        targetId: branch.id,
        targetIdentifier: branch.code,
        branchContext: branch.nameAr,
        result: 'DENIED',
        details: `Access denied: User "${actingUser.username}" attempted to query unauthorized branch "${branch.code}"`,
      });
      throw new Error(`غير مصرح لك بالوصول إلى بيانات الفرع (${branch.nameAr}). تم توثيق المحاولة.`);
    }

    return branch;
  }

  // Create a new branch (Super Admin only or with branches.create)
  public createBranch(
    actingUser: SafeUser,
    data: {
      code: string;
      nameAr: string;
      nameEn: string;
      addressAr: string;
      addressEn: string;
      phone: string;
      email: string;
      managerName?: string;
      status: 'active' | 'inactive';
    }
  ): Branch {
    // 1. Permission Guard
    if (!authStorage.hasPermission(actingUser, 'branches.create')) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_BRANCH_ACCESS',
        targetType: 'BRANCH',
        result: 'DENIED',
        details: 'Attempted to create a branch without branches.create permission',
      });
      throw new Error('ليس لديك صلاحية إنشاء فروع جديدة.');
    }

    const branches = this.getStoredBranches();
    const cleanCode = data.code.trim().toUpperCase();

    // 2. Code validation & uniqueness
    if (!cleanCode) {
      throw new Error('رمز الفرع (Branch Code) مطلوب ولا يمكن تركه فارغاً.');
    }

    if (branches.some((b) => b.code.toUpperCase() === cleanCode)) {
      throw new Error(`رمز الفرع (${cleanCode}) مسجل مسبقاً، يرجى اختيار رمز فريد.`);
    }

    if (!data.nameAr.trim() || !data.nameEn.trim()) {
      throw new Error('اسم الفرع بالعربية والإنجليزية مطلوب.');
    }

    const now = new Date().toISOString();
    const newBranch: Branch = {
      id: `branch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: cleanCode,
      nameAr: data.nameAr.trim(),
      nameEn: data.nameEn.trim(),
      addressAr: data.addressAr.trim(),
      addressEn: data.addressEn.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      managerName: data.managerName?.trim() || '',
      status: data.status,
      studentCount: 0,
      teacherCount: 0,
      classCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    branches.push(newBranch);
    this.saveBranches(branches);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'BRANCH_CREATED',
      targetType: 'BRANCH',
      targetId: newBranch.id,
      targetIdentifier: newBranch.code,
      branchContext: newBranch.nameAr,
      result: 'SUCCESS',
      details: `Created new branch "${newBranch.nameAr}" with code [${newBranch.code}]`,
    });

    return newBranch;
  }

  // Update existing branch
  public updateBranch(
    actingUser: SafeUser,
    branchId: string,
    updates: {
      code?: string;
      nameAr?: string;
      nameEn?: string;
      addressAr?: string;
      addressEn?: string;
      phone?: string;
      email?: string;
      managerName?: string;
      status?: 'active' | 'inactive';
    }
  ): Branch {
    if (!authStorage.hasPermission(actingUser, 'branches.edit')) {
      throw new Error('ليس لديك صلاحية تعديل بيانات الفروع.');
    }

    if (!this.canUserAccessBranch(actingUser, branchId)) {
      throw new Error('غير مصرح لك بتعديل بيانات هذا الفرع.');
    }

    const branches = this.getStoredBranches();
    const target = branches.find((b) => b.id === branchId);
    if (!target) {
      throw new Error('الفرع المطلوب تعديله غير موجود.');
    }

    // Code uniqueness check if updating code
    if (updates.code) {
      const cleanCode = updates.code.trim().toUpperCase();
      if (cleanCode !== target.code && branches.some((b) => b.id !== branchId && b.code.toUpperCase() === cleanCode)) {
        throw new Error(`رمز الفرع (${cleanCode}) مسجل بالفعل لفرع آخر.`);
      }
      target.code = cleanCode;
    }

    if (updates.nameAr) target.nameAr = updates.nameAr.trim();
    if (updates.nameEn) target.nameEn = updates.nameEn.trim();
    if (updates.addressAr !== undefined) target.addressAr = updates.addressAr.trim();
    if (updates.addressEn !== undefined) target.addressEn = updates.addressEn.trim();
    if (updates.phone !== undefined) target.phone = updates.phone.trim();
    if (updates.email !== undefined) target.email = updates.email.trim();
    if (updates.managerName !== undefined) target.managerName = updates.managerName.trim();
    if (updates.status) target.status = updates.status;

    target.updatedAt = new Date().toISOString();
    this.saveBranches(branches);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'BRANCH_UPDATED',
      targetType: 'BRANCH',
      targetId: target.id,
      targetIdentifier: target.code,
      branchContext: target.nameAr,
      result: 'SUCCESS',
      details: `Updated attributes for branch "${target.nameAr}" [${target.code}]`,
    });

    return target;
  }

  // Toggle active/inactive status (Soft delete / deactivate)
  public toggleBranchStatus(actingUser: SafeUser, branchId: string): Branch {
    if (!authStorage.hasPermission(actingUser, 'branches.delete') && !authStorage.hasPermission(actingUser, 'branches.edit')) {
      throw new Error('ليس لديك صلاحية تغيير حالة الفرع.');
    }

    const branches = this.getStoredBranches();
    const target = branches.find((b) => b.id === branchId);
    if (!target) throw new Error('الفرع غير موجود.');

    const nextStatus = target.status === 'active' ? 'inactive' : 'active';
    target.status = nextStatus;
    target.updatedAt = new Date().toISOString();
    this.saveBranches(branches);

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: nextStatus === 'inactive' ? 'BRANCH_DISABLED' : 'BRANCH_ENABLED',
      targetType: 'BRANCH',
      targetId: target.id,
      targetIdentifier: target.code,
      branchContext: target.nameAr,
      result: 'SUCCESS',
      details: `Changed branch status of "${target.nameAr}" to "${nextStatus.toUpperCase()}"`,
    });

    return target;
  }
}

export const branchStorage = BranchStorageService.getInstance();
