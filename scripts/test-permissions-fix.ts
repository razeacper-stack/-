/**
 * Security and Regression Test Suite for Super Admin Academic Permissions Fix
 */

// 1. Setup in-memory LocalStorage polyfill for Node.js test environment
const storageStore: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storageStore[key] ?? null,
  setItem: (key: string, value: string) => { storageStore[key] = String(value); },
  removeItem: (key: string) => { delete storageStore[key]; },
  clear: () => { Object.keys(storageStore).forEach((k) => delete storageStore[k]); },
};

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING REGRESSION & SECURITY VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  // Dynamic imports after localStorage polyfill
  const { authStorage, hasUserPermission } = await import('../src/services/authStorage');
  const { academicStorage } = await import('../src/services/academicStorage');
  const { studentStorage } = await import('../src/services/studentStorage');
  const { DEFAULT_ROLES } = await import('../src/config/roles');
  const { ALL_PERMISSIONS } = await import('../src/config/permissions');

  // Initialize storage
  await authStorage.initialize();
  academicStorage.initialize();
  studentStorage.initialize();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}${detail ? ` (${detail})` : ''}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // --- SECTION 1: SUPER_ADMIN AUTHORIZATION & MANAGEMENT ---
  console.log('--- TEST 1: SUPER_ADMIN Academic Operations Across Branches ---');
  const superAdmin = authStorage.toSafeUser({
    id: 'user-super-admin',
    fullName: 'د. عبدالرحمن العتيبي (Super Admin)',
    username: 'superadmin',
    email: 'superadmin@schoolms.edu',
    roleId: 'role-super-admin',
    roleCode: 'SUPER_ADMIN',
    status: 'active',
    isProtectedSuperAdmin: true,
    hasAllBranchesAccess: true,
    branchIds: [],
    passwordHash: 'dummy',
    salt: 'dummy',
    createdAt: new Date().toISOString(),
  });

  // Verify Super Admin permissions array
  assert(
    superAdmin.permissions.includes('academic_years.create'),
    'Super Admin permissions list contains academic_years.create'
  );
  assert(
    hasUserPermission(superAdmin, 'academic_years.create'),
    'hasUserPermission returns true for Super Admin'
  );
  assert(
    authStorage.hasPermission(superAdmin, 'academic_years.create'),
    'authStorage.hasPermission returns true for Super Admin'
  );

  // Super Admin creates an academic year in Riyadh
  let createdYearRiyadh: any;
  try {
    createdYearRiyadh = academicStorage.createAcademicYear(superAdmin, {
      branchId: 'branch-riyadh',
      nameAr: `عام الرياض التجريبي ${Date.now()}`,
      nameEn: `Riyadh Test Year ${Date.now()}`,
      startDate: '2028-09-01',
      endDate: '2029-06-30',
    });
    assert(!!createdYearRiyadh.id, 'Super Admin successfully created Academic Year in branch-riyadh');
  } catch (e: any) {
    assert(false, 'Super Admin create Academic Year in branch-riyadh', e.message);
  }

  // Super Admin creates an academic year in Jeddah (multi-branch access)
  let createdYearJeddah: any;
  try {
    createdYearJeddah = academicStorage.createAcademicYear(superAdmin, {
      branchId: 'branch-jeddah',
      nameAr: `عام جدة التجريبي ${Date.now()}`,
      nameEn: `Jeddah Test Year ${Date.now()}`,
      startDate: '2028-09-01',
      endDate: '2029-06-30',
    });
    assert(!!createdYearJeddah.id, 'Super Admin successfully created Academic Year in branch-jeddah');
  } catch (e: any) {
    assert(false, 'Super Admin create Academic Year in branch-jeddah', e.message);
  }

  // Super Admin updates and deletes the created year
  try {
    const updated = academicStorage.updateAcademicYear(superAdmin, createdYearRiyadh.id, {
      nameAr: 'العام المحدث',
    });
    assert(updated.nameAr === 'العام المحدث', 'Super Admin successfully updated Academic Year');

    academicStorage.deleteAcademicYear(superAdmin, createdYearRiyadh.id);
    academicStorage.deleteAcademicYear(superAdmin, createdYearJeddah.id);
    assert(true, 'Super Admin successfully deleted/archived Academic Years');
  } catch (e: any) {
    assert(false, 'Super Admin update/delete Academic Year', e.message);
  }

  // --- SECTION 2: ADMIN & MANAGER ROLE CONFIGURATION & BRANCH ISOLATION ---
  console.log('\n--- TEST 2: ADMIN & MANAGER Configured Permissions & Branch Access ---');
  const adminUser = authStorage.toSafeUser({
    id: 'user-admin',
    fullName: 'أ. فهد الشمري (Admin)',
    username: 'admin',
    email: 'admin@schoolms.edu',
    roleId: 'role-admin',
    roleCode: 'ADMIN',
    status: 'active',
    hasAllBranchesAccess: false,
    branchIds: ['branch-riyadh', 'branch-jeddah'],
    passwordHash: 'dummy',
    salt: 'dummy',
    createdAt: new Date().toISOString(),
  });

  const managerUser = authStorage.toSafeUser({
    id: 'user-manager',
    fullName: 'أ. منى الغامدي (Manager)',
    username: 'manager',
    email: 'manager@schoolms.edu',
    roleId: 'role-manager',
    roleCode: 'MANAGER',
    status: 'active',
    hasAllBranchesAccess: false,
    branchIds: ['branch-riyadh'],
    passwordHash: 'dummy',
    salt: 'dummy',
    createdAt: new Date().toISOString(),
  });

  // ADMIN checks
  assert(authStorage.hasPermission(adminUser, 'academic_years.create'), 'ADMIN has academic_years.create');
  assert(authStorage.hasPermission(adminUser, 'academic_years.delete'), 'ADMIN has academic_years.delete');

  // ADMIN branch access: Can create in Riyadh
  let adminYear: any;
  try {
    adminYear = academicStorage.createAcademicYear(adminUser, {
      branchId: 'branch-riyadh',
      nameAr: `عام الأدمن ${Date.now()}`,
      nameEn: `Admin Year ${Date.now()}`,
      startDate: '2028-09-01',
      endDate: '2029-06-30',
    });
    assert(true, 'ADMIN can create Academic Year in assigned branch (branch-riyadh)');
    academicStorage.deleteAcademicYear(adminUser, adminYear.id);
  } catch (e: any) {
    assert(false, 'ADMIN create Academic Year in branch-riyadh', e.message);
  }

  // ADMIN branch access: Blocked from Dammam (not in branchIds)
  try {
    academicStorage.createAcademicYear(adminUser, {
      branchId: 'branch-dammam',
      nameAr: 'عام غير مصرح',
      nameEn: 'Unauthorized Year',
      startDate: '2028-09-01',
      endDate: '2029-06-30',
    });
    assert(false, 'ADMIN unauthorized branch access to Dammam was NOT blocked');
  } catch (e: any) {
    assert(e.message.includes('غير مصرح لك'), 'ADMIN correctly blocked from unauthorized branch (branch-dammam)');
  }

  // MANAGER checks
  assert(authStorage.hasPermission(managerUser, 'academic_years.create'), 'MANAGER has academic_years.create');
  assert(!authStorage.hasPermission(managerUser, 'academic_years.delete'), 'MANAGER DOES NOT have academic_years.delete');

  // MANAGER attempt to delete an academic year must fail with permission error
  const existingYears = academicStorage.listAcademicYears(superAdmin, 'branch-riyadh');
  const targetYear = existingYears.find((y) => !y.isCurrent);
  if (targetYear) {
    try {
      academicStorage.deleteAcademicYear(managerUser, targetYear.id);
      assert(false, 'MANAGER was able to delete Academic Year without permission');
    } catch (e: any) {
      assert(e.message.includes('academic_years.delete'), 'MANAGER correctly denied deletion of Academic Year (academic_years.delete)');
    }
  }

  // --- SECTION 3: VIEWER READ-ONLY RESTRICTIONS ---
  console.log('\n--- TEST 3: VIEWER Cannot Create or Modify Academic Records ---');
  const viewerUser = authStorage.toSafeUser({
    id: 'user-viewer',
    fullName: 'عبدالله الزهراني (Viewer)',
    username: 'viewer',
    email: 'viewer@schoolms.edu',
    roleId: 'role-viewer',
    roleCode: 'VIEWER',
    status: 'active',
    hasAllBranchesAccess: false,
    branchIds: ['branch-riyadh'],
    passwordHash: 'dummy',
    salt: 'dummy',
    createdAt: new Date().toISOString(),
  });

  assert(authStorage.hasPermission(viewerUser, 'academic_years.view'), 'VIEWER has academic_years.view');
  assert(!authStorage.hasPermission(viewerUser, 'academic_years.create'), 'VIEWER DOES NOT have academic_years.create');
  assert(!authStorage.hasPermission(viewerUser, 'academic_years.edit'), 'VIEWER DOES NOT have academic_years.edit');
  assert(!authStorage.hasPermission(viewerUser, 'academic_years.delete'), 'VIEWER DOES NOT have academic_years.delete');

  // VIEWER can view
  try {
    const list = academicStorage.listAcademicYears(viewerUser, 'branch-riyadh');
    assert(Array.isArray(list) && list.length > 0, 'VIEWER can view academic years in authorized branch');
  } catch (e: any) {
    assert(false, 'VIEWER view academic years failed', e.message);
  }

  // VIEWER create must throw
  try {
    academicStorage.createAcademicYear(viewerUser, {
      branchId: 'branch-riyadh',
      nameAr: 'عام المشاهد',
      nameEn: 'Viewer Year',
      startDate: '2028-09-01',
      endDate: '2029-06-30',
    });
    assert(false, 'VIEWER was able to create academic year');
  } catch (e: any) {
    assert(e.message.includes('academic_years.create'), 'VIEWER creation blocked by academic_years.create check');
  }

  // --- SECTION 4: BRANCH MANIPULATION & CROSS-BRANCH SHIELD ---
  console.log('\n--- TEST 4: Branch Tampering and Cross-Branch Injection Defense ---');
  // Manager assigned to Riyadh attempts to access Jeddah
  try {
    academicStorage.listAcademicYears(managerUser, 'branch-jeddah');
    assert(false, 'Branch isolation failed: Manager accessed branch-jeddah');
  } catch (e: any) {
    assert(e.message.includes('غير مصرح لك'), 'Direct branch isolation blocked manager from branch-jeddah');
  }

  // Cross-branch grade-stage link test: Grade in Riyadh linked to Stage in Jeddah
  const jeddahStage = academicStorage.createStage(superAdmin, {
    branchId: 'branch-jeddah',
    nameAr: `مرحلة جدة ${Date.now()}`,
    nameEn: `Jeddah Stage ${Date.now()}`,
  });

  try {
    academicStorage.createGrade(superAdmin, {
      branchId: 'branch-riyadh', // RIYADH
      stageId: jeddahStage.id,   // JEDDAH STAGE
      nameAr: 'صف متعدي الفروع',
      nameEn: 'Cross Branch Grade',
      gradeCode: `CRS-${Date.now().toString().slice(-4)}`,
    });
    assert(false, 'Cross-branch grade-stage binding was NOT blocked');
  } catch (e: any) {
    assert(e.message.includes('تنتمي لفرع آخر'), 'Cross-branch stage-grade linkage blocked by security shield');
  } finally {
    academicStorage.deleteStage(superAdmin, jeddahStage.id);
  }

  // --- SECTION 5: UI & DIRECT SERVICE LAYER CONSISTENCY ---
  console.log('\n--- TEST 5: Permission Consistency Across UI & Direct Service Calls ---');
  const testKeys = [
    'academic_years.view',
    'academic_years.create',
    'academic_years.edit',
    'academic_years.delete',
    'academic_stages.view',
    'academic_stages.create',
    'academic_stages.edit',
    'academic_stages.delete',
    'grades.view',
    'grades.create',
    'grades.edit',
    'grades.delete',
    'classes.view',
    'classes.create',
    'classes.edit',
    'classes.delete',
    'subjects.view',
    'subjects.create',
    'subjects.edit',
    'subjects.delete',
    'grade_subjects.view',
    'grade_subjects.create',
    'grade_subjects.edit',
    'grade_subjects.delete',
  ];

  const allDefined = testKeys.every((k) => ALL_PERMISSIONS.some((p) => p.key === k));
  assert(allDefined, 'All 24 academic permission keys match exact definitions in ALL_PERMISSIONS');

  // Verify Super Admin passes all 24 keys in authStorage.hasPermission
  const superAdminAllPass = testKeys.every((k: any) => authStorage.hasPermission(superAdmin, k));
  assert(superAdminAllPass, 'Super Admin passes authStorage.hasPermission on all 24 academic keys');

  // Direct service call test with stripped permissions user
  const strippedUser = {
    ...viewerUser,
    id: 'stripped-user',
    roleCode: 'VIEWER',
    permissions: [],
  };

  try {
    academicStorage.listAcademicYears(strippedUser as any, 'branch-riyadh');
    assert(false, 'Direct service call without permissions was NOT blocked');
  } catch (e: any) {
    assert(e.message.includes('academic_years.view'), 'Direct service call correctly blocked for stripped permissions user');
  }

  // --- SECTION 6: STUDENT MANAGEMENT & SESSION REFRESH ---
  console.log('\n--- TEST 6: Student Management & Session Refresh ---');
  // Student roster listing
  try {
    const students = studentStorage.listStudents(superAdmin, { branchId: 'all' });
    assert(students.totalCount > 0, `Super Admin can list students (${students.totalCount} found)`);

    const riyadhStudents = studentStorage.listStudents(managerUser, { branchId: 'branch-riyadh' });
    assert(
      riyadhStudents.students.every((s) => s.branchId === 'branch-riyadh'),
      'Manager student listing strictly isolated to branch-riyadh'
    );
  } catch (e: any) {
    assert(false, 'Student listing failed', e.message);
  }

  // Stale session refresh simulation:
  // Store a session that has empty permissions (e.g. from an old version)
  const staleSession = {
    ...superAdmin,
    permissions: [], // STALE EMPTY PERMISSIONS
  };
  authStorage.setStoredSession(staleSession);
  assert(
    authStorage.getStoredSession()?.permissions.length === 0,
    'Stale session with empty permissions initialized in storage'
  );

  // Calling refreshSession should re-hydrate the user with full permissions
  const refreshedUser = authStorage.refreshSession();
  assert(
    refreshedUser !== null && refreshedUser.permissions.length > 50,
    `refreshSession successfully restored full permissions (${refreshedUser?.permissions.length} perms)`
  );
  assert(
    authStorage.getStoredSession()?.permissions.includes('academic_years.create') === true,
    'Stored session in storage now has academic_years.create'
  );

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
