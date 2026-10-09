// Polyfill localStorage if running in Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] || null,
  };
}

import { authStorage } from '../src/services/authStorage';
import { settingsStorage } from '../src/services/settingsStorage';
import { financeStorage } from '../src/services/financeStorage';
import { SafeUser } from '../src/types/auth';

function assert(condition: boolean, testNum: number, message: string) {
  if (!condition) {
    console.error(`❌ FAIL Test ${testNum}: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS Test ${testNum}: ${message}`);
  }
}

async function runSettingsNavigationTests() {
  console.log('====================================================');
  console.log('🧪 TESTING SETTINGS NAVIGATION & AUTHORIZATION KERNEL');
  console.log('====================================================\n');

  await authStorage.initialize();
  settingsStorage.initialize();
  financeStorage.initialize();

  // Real Initialized Test Users from AuthStorage Kernel
  const superAdmin = authStorage.getUserById('user-super-admin')!;
  const roles = authStorage.getStoredRoles();
  const schoolAdmin: SafeUser = authStorage.getUserById('user-admin') || {
    id: 'user-admin',
    fullName: 'أ. فهد الشمري (Admin)',
    username: 'admin',
    email: 'admin@schoolms.edu',
    roleId: 'role-admin',
    roleCode: 'ADMIN',
    roleNameAr: 'مدير فرع',
    roleNameEn: 'Branch Admin',
    status: 'active',
    hasAllBranchesAccess: false,
    branchIds: [],
    createdAt: new Date().toISOString(),
    permissions: roles.find((r) => r.code === 'ADMIN')?.permissions || [],
  };
  const mathTeacher: SafeUser = authStorage.getUserById('user-teacher') || {
    id: 'user-teacher',
    fullName: 'أ. خالد الشريف (Teacher)',
    username: 'teacher',
    email: 'teacher@schoolms.edu',
    roleId: 'role-teacher',
    roleCode: 'TEACHER',
    roleNameAr: 'معلم',
    roleNameEn: 'Teacher',
    status: 'active',
    hasAllBranchesAccess: false,
    branchIds: [],
    createdAt: new Date().toISOString(),
    permissions: roles.find((r) => r.code === 'TEACHER')?.permissions || [],
  };
  const receptionist: SafeUser = authStorage.getUserById('user-staff') || {
    id: 'user-staff',
    fullName: 'سارة القحطاني (Staff)',
    username: 'staff',
    email: 'staff@schoolms.edu',
    roleId: 'role-staff',
    roleCode: 'STAFF',
    roleNameAr: 'موظف',
    roleNameEn: 'Staff',
    status: 'active',
    hasAllBranchesAccess: false,
    branchIds: [],
    createdAt: new Date().toISOString(),
    permissions: roles.find((r) => r.code === 'STAFF')?.permissions || [],
  };

  assert(Boolean(superAdmin), 0, 'Seed Super Admin user loaded');

  // 1. Super Admin Authorization
  assert(authStorage.isSuperAdmin(superAdmin), 1, 'Super Admin identity recognized by auth kernel');
  assert(authStorage.hasPermission(superAdmin, 'settings.view'), 2, 'Super Admin has settings.view permission');
  assert(authStorage.hasPermission(superAdmin, 'settings.edit'), 3, 'Super Admin has settings.edit permission');

  // 2. School Admin (ADMIN role) Authorization
  assert(!authStorage.isSuperAdmin(schoolAdmin), 4, 'School Admin is not Super Admin');
  assert(authStorage.hasPermission(schoolAdmin, 'settings.view'), 5, 'Admin role has settings.view permission');

  // 3. Teacher & Staff (Unauthorized) Authorization
  assert(!authStorage.isSuperAdmin(mathTeacher), 6, 'Teacher is not Super Admin');
  assert(!authStorage.hasPermission(mathTeacher, 'settings.view'), 7, 'Teacher DOES NOT have settings.view permission');
  assert(!authStorage.hasPermission(mathTeacher, 'settings.edit'), 8, 'Teacher DOES NOT have settings.edit permission');

  assert(!authStorage.isSuperAdmin(receptionist), 9, 'Staff is not Super Admin');
  assert(!authStorage.hasPermission(receptionist, 'settings.view'), 10, 'Staff DOES NOT have settings.view permission');
  assert(!authStorage.hasPermission(receptionist, 'settings.edit'), 11, 'Staff DOES NOT have settings.edit permission');

  // 4. Default Settings Retrieval
  const defaultSettings = settingsStorage.getSettings();
  assert(Boolean(defaultSettings.schoolNameAr), 12, 'Default schoolNameAr is loaded correctly');
  assert(defaultSettings.activeAcademicYearId === 'ay-riyadh-2026', 13, 'Default academic year is configured');
  assert(defaultSettings.currency === 'SAR', 14, 'Default currency is SAR');

  // 5. Unauthorized Settings Mutation Blocked
  let teacherBlocked = false;
  try {
    settingsStorage.updateSettings(mathTeacher, { schoolNameAr: 'محاولة تعديل غير مصرح بها' });
  } catch {
    teacherBlocked = true;
  }
  assert(teacherBlocked, 15, 'Teacher cannot update settings — exception thrown');

  let staffBlocked = false;
  try {
    settingsStorage.updateSettings(receptionist, { currency: 'USD' });
  } catch {
    staffBlocked = true;
  }
  assert(staffBlocked, 16, 'Staff cannot update settings — exception thrown');

  // 6. Super Admin Settings Mutation Allowed
  const updated = settingsStorage.updateSettings(superAdmin, {
    officialPhone: '+966 11 999 8877',
    periodsPerDay: 8,
  });
  assert(updated.officialPhone === '+966 11 999 8877', 17, 'Super Admin successfully updated phone number');
  assert(updated.periodsPerDay === 8, 18, 'Super Admin successfully updated periods per day');

  // 7. Verify Audit Log was generated
  const auditLogs = authStorage.getAuditLogs();
  const settingsAudit = auditLogs.find((l) => l.action === 'SYSTEM_SETTINGS_CHANGED');
  assert(Boolean(settingsAudit), 19, 'SYSTEM_SETTINGS_CHANGED audit log recorded in trail');
  assert(settingsAudit?.result === 'SUCCESS', 20, 'Audit record reflects SUCCESS for Super Admin');

  // 8. Finance synchronization
  settingsStorage.updateSettings(superAdmin, {
    taxRegistrationNumber: '300999999900003',
  });
  const financeSettings = financeStorage.getFinanceSettings();
  assert(financeSettings.taxRegistrationNumber === '300999999900003', 21, 'Financial settings synchronized with financeStorage');

  // 9. Reset to Defaults Authorization
  let teacherResetBlocked = false;
  try {
    settingsStorage.resetToDefaults(mathTeacher);
  } catch {
    teacherResetBlocked = true;
  }
  assert(teacherResetBlocked, 22, 'Teacher cannot reset settings to defaults');

  const restored = settingsStorage.resetToDefaults(superAdmin);
  assert(restored.periodsPerDay === 7, 23, 'Super Admin reset restored original default periods (7)');

  console.log('\n====================================================');
  console.log('🎉 ALL 23 SETTINGS NAVIGATION & SECURITY TESTS PASSED!');
  console.log('====================================================');
}

runSettingsNavigationTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
