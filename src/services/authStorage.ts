import { RoleModel, UserModel, SafeUser, AuditRecord, StandardPermissionKey } from '../types/auth';
import { DEFAULT_ROLES } from '../config/roles';
import { ALL_PERMISSIONS } from '../config/permissions';
import { hashPassword, verifyPassword, generateSalt } from './crypto';

const USERS_STORAGE_KEY = 'sms_auth_users_v2';
const ROLES_STORAGE_KEY = 'sms_auth_roles_v2';
const AUDIT_STORAGE_KEY = 'sms_audit_logs_v2';
const SESSION_STORAGE_KEY = 'sms_auth_session_v2';

export function isSuperAdminUser(user: SafeUser | UserModel | null | undefined): boolean {
  if (!user) return false;
  return user.roleCode === 'SUPER_ADMIN' || (Boolean(user.isProtectedSuperAdmin) && user.roleCode === 'SUPER_ADMIN');
}

export function hasUserPermission(
  user: SafeUser | UserModel | null | undefined,
  permission: StandardPermissionKey
): boolean {
  if (!user) return false;
  if (isSuperAdminUser(user)) {
    return true;
  }
  const perms = 'permissions' in user && Array.isArray(user.permissions)
    ? user.permissions
    : [];
  return perms.includes(permission);
}

// In-memory / storage initialization
export class AuthStorageService {
  private static instance: AuthStorageService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): AuthStorageService {
    if (!AuthStorageService.instance) {
      AuthStorageService.instance = new AuthStorageService();
    }
    return AuthStorageService.instance;
  }

  public isSuperAdmin(user: SafeUser | UserModel | null | undefined): boolean {
    return isSuperAdminUser(user);
  }

  public hasPermission(
    user: SafeUser | UserModel | null | undefined,
    permission: StandardPermissionKey
  ): boolean {
    return hasUserPermission(user, permission);
  }

  // Initialize and seed default roles and users if not present
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize Roles
    const storedRoles = localStorage.getItem(ROLES_STORAGE_KEY);
    if (!storedRoles) {
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(DEFAULT_ROLES));
    } else {
      // Sync system roles with updated DEFAULT_ROLES permissions to prevent stale cached permissions
      try {
        const parsed: RoleModel[] = JSON.parse(storedRoles);
        let changed = false;
        const allKeys: StandardPermissionKey[] = ALL_PERMISSIONS.map((p) => p.key);

        DEFAULT_ROLES.forEach((defaultRole) => {
          const existing = parsed.find((r) => r.id === defaultRole.id || r.code === defaultRole.code);
          if (!existing) {
            parsed.push(defaultRole);
            changed = true;
          } else if (existing.isSystem) {
            if (existing.code === 'SUPER_ADMIN') {
              if (existing.permissions.length !== allKeys.length || !allKeys.every((k) => existing.permissions.includes(k))) {
                existing.permissions = [...allKeys];
                changed = true;
              }
            } else {
              const missingKeys = defaultRole.permissions.filter((p) => !existing.permissions.includes(p));
              if (missingKeys.length > 0) {
                existing.permissions = Array.from(new Set([...existing.permissions, ...missingKeys]));
                changed = true;
              }
            }
          }
        });

        if (changed) {
          localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (e) {
        console.error('Roles sync error', e);
      }
    }

    // Initialize Users
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (!storedUsers) {
      await this.seedDefaultUsers();
    } else {
      // Migration upgrade: Ensure all existing users have branchIds and hasAllBranchesAccess
      try {
        const parsed: UserModel[] = JSON.parse(storedUsers);
        let changed = false;
        parsed.forEach((u) => {
          if (!u.branchIds) {
            changed = true;
            if (u.roleCode === 'SUPER_ADMIN' || u.isProtectedSuperAdmin) {
              u.hasAllBranchesAccess = true;
              u.branchIds = [];
            } else if (u.roleCode === 'ADMIN') {
              u.branchIds = ['branch-riyadh', 'branch-jeddah'];
            } else if (u.roleCode === 'MANAGER') {
              u.branchIds = ['branch-riyadh'];
            } else if (u.roleCode === 'TEACHER') {
              u.branchIds = ['branch-jeddah'];
            } else {
              u.branchIds = ['branch-riyadh'];
            }
          }
        });
        if (changed) {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (e) {
        console.error('Migration error', e);
      }
    }

    // Initialize Audit Logs
    const storedAudit = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!storedAudit) {
      const initialLog: AuditRecord = {
        id: 'audit-init-001',
        timestamp: new Date().toISOString(),
        actorId: 'system',
        actorName: 'System Kernel',
        actorRole: 'SYSTEM',
        action: 'USER_CREATED',
        targetType: 'SYSTEM',
        result: 'SUCCESS',
        details: 'System initialized with default RBAC and Multi-Branch hierarchy',
      };
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([initialLog]));
    }

    this.initialized = true;
  }

  // Seed default demo accounts with cryptographically salted hashes
  // Standard test password for all test accounts: Admin@123456
  private async seedDefaultUsers(): Promise<void> {
    const testPassword = 'Admin@123456';

    const usersToSeed = [
      {
        id: 'user-super-admin',
        fullName: 'المدير العام للنظام (Super Admin)',
        username: 'superadmin',
        email: 'superadmin@schoolms.edu',
        roleId: 'role-super-admin',
        roleCode: 'SUPER_ADMIN',
        status: 'active' as const,
        isProtectedSuperAdmin: true,
        hasAllBranchesAccess: true,
        branchIds: [],
      },
    ];

    const seededUsers: UserModel[] = [];
    const now = new Date().toISOString();

    for (const u of usersToSeed) {
      const salt = generateSalt();
      const passwordHash = await hashPassword(testPassword, salt);

      seededUsers.push({
        ...u,
        salt,
        passwordHash,
        createdAt: now,
      });
    }

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(seededUsers));
  }

  // Get raw users from storage
  private getStoredUsers(): UserModel[] {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: UserModel[]): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  // Get raw roles from storage
  public getStoredRoles(): RoleModel[] {
    try {
      const raw = localStorage.getItem(ROLES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_ROLES;
    } catch {
      return DEFAULT_ROLES;
    }
  }

  public saveRoles(roles: RoleModel[]): void {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  }

  // Audit Log writing
  public logAudit(entry: Omit<AuditRecord, 'id' | 'timestamp'>): void {
    try {
      const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
      const logs: AuditRecord[] = stored ? JSON.parse(stored) : [];

      const newLog: AuditRecord = {
        ...entry,
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
      };

      // Keep latest 1000 logs
      logs.unshift(newLog);
      if (logs.length > 1000) logs.pop();

      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Audit logging failed', e);
    }
  }

  public getAuditLogs(): AuditRecord[] {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // Map internal user to SafeUser (never exposing password hash or salt)
  public toSafeUser(user: UserModel): SafeUser {
    const roles = this.getStoredRoles();
    const role = roles.find((r) => r.id === user.roleId || r.code === user.roleCode);
    const isSuperAdmin = this.isSuperAdmin(user);
    const allPermissionKeys: StandardPermissionKey[] = ALL_PERMISSIONS.map((p) => p.key);

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      roleCode: user.roleCode,
      branchIds: user.branchIds || [],
      hasAllBranchesAccess: user.hasAllBranchesAccess ?? (isSuperAdmin || false),
      status: user.status,
      isProtectedSuperAdmin: user.isProtectedSuperAdmin,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      permissions: isSuperAdmin ? allPermissionKeys : (role ? role.permissions : []),
      roleNameAr: role?.nameAr || user.roleCode,
      roleNameEn: role?.nameEn || user.roleCode,
    };
  }

  // Authenticate user with generic secure errors
  public async authenticate(
    identifier: string, // username or email
    passwordAttempt: string
  ): Promise<{ user?: SafeUser; error?: string; errorCode?: 'INVALID_CREDENTIALS' | 'ACCOUNT_DISABLED' }> {
    await this.initialize();
    const cleanId = identifier.trim().toLowerCase();

    const users = this.getStoredUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    // If user not found, perform dummy hash computation to prevent timing attacks
    if (!user) {
      await hashPassword('dummy', 'dummy-salt');
      this.logAudit({
        actorId: 'anonymous',
        actorName: identifier,
        actorRole: 'UNKNOWN',
        action: 'LOGIN',
        targetType: 'SESSION',
        result: 'DENIED',
        details: `Login rejected: Invalid credentials for identifier "${identifier}"`,
      });
      return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة', errorCode: 'INVALID_CREDENTIALS' };
    }

    // Verify password hash
    const isMatch = await verifyPassword(passwordAttempt, user.salt, user.passwordHash);
    if (!isMatch) {
      this.logAudit({
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.roleCode,
        action: 'LOGIN',
        targetType: 'SESSION',
        result: 'DENIED',
        details: `Login rejected: Password mismatch for user "${user.username}"`,
      });
      return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة', errorCode: 'INVALID_CREDENTIALS' };
    }

    // Check account status
    if (user.status === 'disabled') {
      this.logAudit({
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.roleCode,
        action: 'LOGIN',
        targetType: 'SESSION',
        result: 'DENIED',
        details: `Login rejected: Account is disabled for "${user.username}"`,
      });
      return {
        error: 'تم تعطيل هذا الحساب من قِبل إدارة النظام. يرجى التواصل مع المشرف.',
        errorCode: 'ACCOUNT_DISABLED',
      };
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    this.saveUsers(users);

    const safeUser = this.toSafeUser(user);

    this.logAudit({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.roleCode,
      action: 'LOGIN',
      targetType: 'SESSION',
      result: 'SUCCESS',
      details: `User "${user.username}" logged in successfully`,
    });

    return { user: safeUser };
  }

  // Get current active session
  public getStoredSession(): SafeUser | null {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public setStoredSession(user: SafeUser | null): void {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  public getUserById(userId: string): SafeUser | null {
    const users = this.getStoredUsers();
    const user = users.find((u) => u.id === userId);
    return user ? this.toSafeUser(user) : null;
  }

  public refreshSession(): SafeUser | null {
    const session = this.getStoredSession();
    if (!session) return null;

    const freshUser = this.getUserById(session.id);
    if (freshUser && freshUser.status === 'active') {
      this.setStoredSession(freshUser);
      return freshUser;
    } else {
      this.setStoredSession(null);
      return null;
    }
  }

  // USERS MANAGEMENT OPERATIONS (With Business Logic Authorization Enforcement)

  public listUsers(actingUser: SafeUser): SafeUser[] {
    if (!this.hasPermission(actingUser, 'users.view')) {
      this.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        targetType: 'USER',
        result: 'DENIED',
        details: 'Attempted to list users without users.view permission',
      });
      throw new Error('غير مصرح لك باستعراض قائمة المستخدمين.');
    }

    const users = this.getStoredUsers();
    return users.map((u) => this.toSafeUser(u));
  }

  public async createUser(
    actingUser: SafeUser,
    data: {
      fullName: string;
      username: string;
      email: string;
      password: string;
      roleId: string;
      status: 'active' | 'disabled';
      branchIds?: string[];
      hasAllBranchesAccess?: boolean;
    }
  ): Promise<SafeUser> {
    // 1. Authorization guard
    if (!this.hasPermission(actingUser, 'users.create')) {
      this.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        targetType: 'USER',
        result: 'DENIED',
        details: 'Unauthorized attempt to create user',
      });
      throw new Error('ليس لديك صلاحية إنشاء مستخدمين جدد.');
    }

    // 2. Branch Privilege Escalation Guard
    const isSuperAdmin = actingUser.roleCode === 'SUPER_ADMIN' || actingUser.isProtectedSuperAdmin || actingUser.hasAllBranchesAccess;
    if (!isSuperAdmin) {
      if (data.hasAllBranchesAccess) {
        throw new Error('غير مصرح لك بمنح صلاحية الوصول لجميع الفروع.');
      }
      if (data.branchIds && data.branchIds.length > 0) {
        for (const bId of data.branchIds) {
          if (!actingUser.branchIds.includes(bId)) {
            this.logAudit({
              actorId: actingUser.id,
              actorName: actingUser.fullName,
              actorRole: actingUser.roleCode,
              action: 'UNAUTHORIZED_BRANCH_ACCESS',
              targetType: 'USER',
              result: 'DENIED',
              details: `Privilege escalation prevented: User tried to assign branch "${bId}" which they cannot access`,
            });
            throw new Error('لا يمكنك منح صلاحية وصول لفرع لا تملك حق الوصول إليه بنفسك.');
          }
        }
      }
    }

    const users = this.getStoredUsers();
    const cleanUsername = data.username.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();

    // 3. Validation
    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل.');
    }
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      throw new Error('اسم المستخدم هذا مستخدم بالفعل، يرجى اختيار اسم آخر.');
    }
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('البريد الإلكتروني هذا مسجل مسبقاً.');
    }
    if (!data.password || data.password.length < 6) {
      throw new Error('كلمة المرور يجب ألا تقل عن 6 خانات.');
    }

    const roles = this.getStoredRoles();
    const targetRole = roles.find((r) => r.id === data.roleId);
    if (!targetRole) {
      throw new Error('الدور المختار غير صالح.');
    }

    // 4. Hash password securely
    const salt = generateSalt();
    const passwordHash = await hashPassword(data.password, salt);

    const newUser: UserModel = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fullName: data.fullName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      salt,
      passwordHash,
      roleId: targetRole.id,
      roleCode: targetRole.code,
      status: data.status,
      branchIds: data.branchIds || [],
      hasAllBranchesAccess: targetRole.code === 'SUPER_ADMIN' ? true : data.hasAllBranchesAccess || false,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);

    this.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'USER_CREATED',
      targetType: 'USER',
      targetId: newUser.id,
      targetIdentifier: newUser.username,
      result: 'SUCCESS',
      details: `Created user "${newUser.username}" with role "${targetRole.nameAr}" and ${newUser.branchIds.length} assigned branch(es)`,
    });

    return this.toSafeUser(newUser);
  }

  public updateUser(
    actingUser: SafeUser,
    userId: string,
    updates: {
      fullName?: string;
      email?: string;
      roleId?: string;
      status?: 'active' | 'disabled';
      branchIds?: string[];
      hasAllBranchesAccess?: boolean;
    }
  ): SafeUser {
    if (!this.hasPermission(actingUser, 'users.edit')) {
      throw new Error('ليس لديك صلاحية تعديل بيانات المستخدمين.');
    }

    const users = this.getStoredUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) {
      throw new Error('المستخدم المطلوب غير موجود.');
    }

    // Super Admin protection guard
    if (target.isProtectedSuperAdmin) {
      if (updates.status === 'disabled') {
        throw new Error('لا يمكن تعطيل حساب مدير عام النظام الأساسي (Super Admin).');
      }
      if (updates.roleId && updates.roleId !== target.roleId) {
        throw new Error('لا يمكن تغيير رتبة مدير عام النظام الأساسي (Super Admin).');
      }
    }

    // Branch privilege escalation guard for updater
    const isSuperAdmin = actingUser.roleCode === 'SUPER_ADMIN' || actingUser.isProtectedSuperAdmin || actingUser.hasAllBranchesAccess;
    if (!isSuperAdmin && updates.branchIds) {
      for (const bId of updates.branchIds) {
        if (!actingUser.branchIds.includes(bId)) {
          this.logAudit({
            actorId: actingUser.id,
            actorName: actingUser.fullName,
            actorRole: actingUser.roleCode,
            action: 'UNAUTHORIZED_BRANCH_ACCESS',
            targetType: 'USER',
            result: 'DENIED',
            details: `Privilege escalation prevented: User tried to modify branches with unauthorized branch "${bId}"`,
          });
          throw new Error('لا يمكنك منح صلاحية فرع لا تملك حق الوصول إليه بنفسك.');
        }
      }
    }

    if (updates.fullName) target.fullName = updates.fullName.trim();
    if (updates.email) target.email = updates.email.trim().toLowerCase();

    if (updates.roleId) {
      const roles = this.getStoredRoles();
      const newRole = roles.find((r) => r.id === updates.roleId);
      if (newRole) {
        target.roleId = newRole.id;
        target.roleCode = newRole.code;
      }
    }

    if (updates.status) {
      target.status = updates.status;
    }

    if (updates.branchIds && !target.isProtectedSuperAdmin) {
      target.branchIds = updates.branchIds;
    }

    if (updates.hasAllBranchesAccess !== undefined && !target.isProtectedSuperAdmin && isSuperAdmin) {
      target.hasAllBranchesAccess = updates.hasAllBranchesAccess;
    }

    this.saveUsers(users);

    this.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'USER_UPDATED',
      targetType: 'USER',
      targetId: target.id,
      targetIdentifier: target.username,
      result: 'SUCCESS',
      details: `Updated attributes and branch bindings for user "${target.username}"`,
    });

    return this.toSafeUser(target);
  }

  public toggleUserStatus(actingUser: SafeUser, userId: string): SafeUser {
    if (!this.hasPermission(actingUser, 'users.edit')) {
      throw new Error('ليس لديك صلاحية تغيير حالة المستخدمين.');
    }

    const users = this.getStoredUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) throw new Error('المستخدم غير موجود.');

    // Super Admin Protection: Prevent disabling
    if (target.isProtectedSuperAdmin && target.status === 'active') {
      throw new Error('أمان النظام: غير مسموح بتعطيل حساب Super Admin الأساسي لحماية النظام من فقدان الوصول.');
    }

    const nextStatus = target.status === 'active' ? 'disabled' : 'active';
    target.status = nextStatus;
    this.saveUsers(users);

    this.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: nextStatus === 'disabled' ? 'USER_DISABLED' : 'USER_ENABLED',
      targetType: 'USER',
      targetId: target.id,
      targetIdentifier: target.username,
      result: 'SUCCESS',
      details: `Changed status of "${target.username}" to "${nextStatus}"`,
    });

    return this.toSafeUser(target);
  }

  public async resetUserPassword(
    actingUser: SafeUser,
    userId: string,
    newPasswordAttempt: string
  ): Promise<void> {
    if (!this.hasPermission(actingUser, 'users.edit')) {
      throw new Error('ليس لديك صلاحية إعادة تعيين كلمات المرور.');
    }

    if (!newPasswordAttempt || newPasswordAttempt.length < 6) {
      throw new Error('كلمة المرور الجديدة يجب أن تكون 6 خانات على الأقل.');
    }

    const users = this.getStoredUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) throw new Error('المستخدم غير موجود.');

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPasswordAttempt, newSalt);

    target.salt = newSalt;
    target.passwordHash = newHash;
    this.saveUsers(users);

    this.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'PASSWORD_RESET',
      targetType: 'USER',
      targetId: target.id,
      targetIdentifier: target.username,
      result: 'SUCCESS',
      details: `Administrative password reset for "${target.username}"`,
    });
  }

  public async changeOwnPassword(
    userId: string,
    currentPasswordAttempt: string,
    newPasswordAttempt: string
  ): Promise<void> {
    if (!newPasswordAttempt || newPasswordAttempt.length < 6) {
      throw new Error('كلمة المرور الجديدة يجب أن تكون 6 خانات على الأقل.');
    }

    const users = this.getStoredUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) throw new Error('المستخدم غير مسجل.');

    const isCurrentMatch = await verifyPassword(currentPasswordAttempt, target.salt, target.passwordHash);
    if (!isCurrentMatch) {
      throw new Error('كلمة المرور الحالية غير صحيحة.');
    }

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPasswordAttempt, newSalt);

    target.salt = newSalt;
    target.passwordHash = newHash;
    this.saveUsers(users);

    this.logAudit({
      actorId: target.id,
      actorName: target.fullName,
      actorRole: target.roleCode,
      action: 'PASSWORD_CHANGED',
      targetType: 'USER',
      targetId: target.id,
      targetIdentifier: target.username,
      result: 'SUCCESS',
      details: `User "${target.username}" changed their account password`,
    });
  }

  // ROLES & PERMISSIONS OPERATIONS

  public updateRolePermissions(
    actingUser: SafeUser,
    roleId: string,
    newPermissions: StandardPermissionKey[]
  ): RoleModel {
    if (!this.hasPermission(actingUser, 'users.edit') && !this.hasPermission(actingUser, 'settings.edit')) {
      throw new Error('غير مصرح لك بتعديل مصفوفة الصلاحيات للأدوار.');
    }

    const roles = this.getStoredRoles();
    const role = roles.find((r) => r.id === roleId);
    if (!role) throw new Error('الدور المطلوب غير موجود.');

    // Super Admin Protection: Cannot strip Super Admin rights
    if (role.code === 'SUPER_ADMIN') {
      throw new Error('صلاحيات Super Admin كاملة ومحمية لا يمكن تقليصها.');
    }

    role.permissions = newPermissions;
    this.saveRoles(roles);

    this.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'ROLE_MODIFIED',
      targetType: 'ROLE',
      targetId: role.id,
      targetIdentifier: role.code,
      result: 'SUCCESS',
      details: `Updated permissions matrix for role "${role.nameAr}" (${newPermissions.length} permissions assigned)`,
    });

    return role;
  }
}

export const authStorage = AuthStorageService.getInstance();
