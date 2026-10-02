// Polyfill localStorage if running in Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

import { teacherStorage } from '../src/services/teacherStorage';
import { authStorage } from '../src/services/authStorage';
import { SafeUser } from '../src/types/auth';

async function main() {
  console.log('====================================================');
  console.log('RUNNING PHASE 6 VERIFICATION SUITE');
  console.log('====================================================');

  await authStorage.initialize();
  teacherStorage.initialize();

  const superAdminUser: SafeUser = {
    id: 'user-super-admin',
    fullName: 'المدير العام للنظام (Super Admin)',
    username: 'superadmin',
    email: 'admin@schoolms.edu',
    roleId: 'role-super-admin',
    roleCode: 'SUPER_ADMIN',
    roleNameAr: 'مدير النظام العام',
    roleNameEn: 'Super Administrator',
    branchIds: [],
    hasAllBranchesAccess: true,
    isProtectedSuperAdmin: true,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: [] as any[],
  };

  const riyadhManagerUser: SafeUser = {
    id: 'user-manager-riyadh',
    fullName: 'أ. صالح المنصور (مدير الرياض)',
    username: 'salih.riyadh',
    email: 'salih@schoolms.edu',
    roleId: 'role-manager',
    roleCode: 'MANAGER',
    roleNameAr: 'مدير فرع الرياض',
    roleNameEn: 'Branch Manager',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: [
      'teachers.view',
      'teachers.create',
      'teachers.edit',
      'teachers.manage_subjects',
      'teachers.manage_classes',
      'subjects.view',
      'classes.view',
    ] as any[],
  };

  const viewerUser: SafeUser = {
    id: 'user-viewer',
    fullName: 'عبدالله الزهراني (Viewer)',
    username: 'viewer',
    email: 'viewer@schoolms.edu',
    roleId: 'role-viewer',
    roleCode: 'VIEWER',
    roleNameAr: 'مشاهد مدقق',
    roleNameEn: 'Viewer',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: ['teachers.view'] as any[],
  };

  const tests = [
    // 1. Model & Data Dictionary
    {
      id: 1,
      name: 'Model & Identity Structure',
      run: async () => {
        const teachers = teacherStorage.getRawTeachers();
        if (teachers.length === 0) return { passed: false, message: 'Empty teachers' };
        const sample = teachers[0];
        const valid =
          Boolean(sample.id) &&
          Boolean(sample.teacherNumber) &&
          Boolean(sample.branchId) &&
          Boolean(sample.firstNameAr) &&
          Boolean(sample.lastNameAr) &&
          Boolean(sample.firstNameEn) &&
          Boolean(sample.lastNameEn) &&
          Boolean(sample.phoneNumber) &&
          Boolean(sample.specialization) &&
          Boolean(sample.employmentStatus) &&
          Boolean(sample.employmentType);
        return { passed: valid, message: `Sample verified: ${sample.fullNameAr} [${sample.teacherNumber}]` };
      },
    },
    // 2. Unique Teacher Number Generation
    {
      id: 2,
      name: 'Unique Teacher Number Generator (TCH-YYYY-XXX)',
      run: async () => {
        const currentYear = new Date().getFullYear();
        const nextNum = teacherStorage.generateNextTeacherNumber('branch-riyadh');
        const pattern = new RegExp(`^TCH-${currentYear}-\\d{3}$`);
        const isValid = pattern.test(nextNum);
        return { passed: isValid, message: `Generated format valid: ${nextNum}` };
      },
    },
    // 3. Concurrent Creation Collision Prevention
    {
      id: 3,
      name: 'Sequential Uniqueness & Collision Prevention',
      run: async () => {
        const t1 = teacherStorage.createTeacher(superAdminUser, {
          branchId: 'branch-riyadh',
          firstNameAr: 'معلم_تجربة_أ',
          lastNameAr: 'الاختبار',
          firstNameEn: 'TestTeacherA',
          lastNameEn: 'Audit',
          gender: 'male',
          phoneNumber: '+966500000001',
          specialization: 'اختبارات البرمجيات',
          employmentType: 'FULL_TIME',
        });
        const t2 = teacherStorage.createTeacher(superAdminUser, {
          branchId: 'branch-riyadh',
          firstNameAr: 'معلم_تجربة_ب',
          lastNameAr: 'الاختبار',
          firstNameEn: 'TestTeacherB',
          lastNameEn: 'Audit',
          gender: 'female',
          phoneNumber: '+966500000002',
          specialization: 'أمن المعلومات',
          employmentType: 'PART_TIME',
        });
        const distinct = t1.teacherNumber !== t2.teacherNumber;
        return { passed: distinct, message: `Distinct numbers: ${t1.teacherNumber} vs ${t2.teacherNumber}` };
      },
    },
    // 4. Centralized Authorization Layer
    {
      id: 4,
      name: 'Centralized Authorization (authStorage.hasPermission)',
      run: async () => {
        const isSuperAdminAllowed = authStorage.hasPermission(superAdminUser, 'teachers.create');
        const isManagerAllowed = authStorage.hasPermission(riyadhManagerUser, 'teachers.create');
        const isViewerAllowed = authStorage.hasPermission(viewerUser, 'teachers.create');
        const passed = isSuperAdminAllowed && isManagerAllowed && !isViewerAllowed;
        return { passed, message: 'Centralized auth layer correctly distinguishes permissions' };
      },
    },
    // 5. Enforcement of Unauthorized Operations
    {
      id: 5,
      name: 'Unauthorized Viewer Denial',
      run: async () => {
        let blocked = false;
        try {
          teacherStorage.createTeacher(viewerUser, {
            branchId: 'branch-riyadh',
            firstNameAr: 'محاولة_غير_مصرحة',
            lastNameAr: 'اختراق',
            firstNameEn: 'Unauthorized',
            lastNameEn: 'Attempt',
            gender: 'male',
            phoneNumber: '+966599999999',
            specialization: 'محاولة',
            employmentType: 'CONTRACT',
          });
        } catch {
          blocked = true;
        }
        return { passed: blocked, message: 'Viewer create attempt rejected and blocked' };
      },
    },
    // 6. Multi-Branch Isolation
    {
      id: 6,
      name: 'Branch Isolation for Managers',
      run: async () => {
        let crossBranchBlocked = false;
        try {
          teacherStorage.createTeacher(riyadhManagerUser, {
            branchId: 'branch-jeddah',
            firstNameAr: 'معلم_جدة_محظور',
            lastNameAr: 'الاختبار',
            firstNameEn: 'JeddahTeacher',
            lastNameEn: 'Blocked',
            gender: 'male',
            phoneNumber: '+966588888888',
            specialization: 'اختبار العزل',
            employmentType: 'FULL_TIME',
          });
        } catch {
          crossBranchBlocked = true;
        }
        return { passed: crossBranchBlocked, message: 'Cross-branch creation by manager blocked' };
      },
    },
    // 7. Cross-Branch Subject Rejection
    {
      id: 7,
      name: 'Cross-Branch Subject Assignment Guard',
      run: async () => {
        let blocked = false;
        try {
          teacherStorage.assignSubjectToTeacher(superAdminUser, 'tch-j-001', 'sbj-riyadh-math');
        } catch (err: any) {
          blocked = err.message.includes('فرع آخر') || err.message.includes('branch');
        }
        return { passed: blocked, message: 'Cross-branch subject assignment blocked' };
      },
    },
    // 8. Cross-Branch Class Rejection
    {
      id: 8,
      name: 'Cross-Branch Class Assignment Guard',
      run: async () => {
        let blocked = false;
        try {
          teacherStorage.assignClassToTeacher(superAdminUser, 'tch-j-001', 'cls-riyadh-1a', 'ay-riyadh-2026');
        } catch (err: any) {
          blocked = err.message.includes('فرع آخر') || err.message.includes('branch');
        }
        return { passed: blocked, message: 'Cross-branch class assignment blocked' };
      },
    },
    // 9. Sensitive Identity Protection
    {
      id: 9,
      name: 'Sensitive Identity Masking',
      run: async () => {
        const unprivileged = teacherStorage.getTeacherById(viewerUser, 'tch-r-001');
        const admin = teacherStorage.getTeacherById(superAdminUser, 'tch-r-001');
        const isMaskedForViewer = unprivileged.nationalId?.includes('•') || !unprivileged.nationalId;
        const isUnmaskedForAdmin = Boolean(admin.nationalId && !admin.nationalId.includes('•'));
        return { passed: isMaskedForViewer && isUnmaskedForAdmin, message: 'Masking verified' };
      },
    },
    // 10. Status Lifecycle & Archival Preservation
    {
      id: 10,
      name: 'Status Lifecycle & Archival Integrity',
      run: async () => {
        const testTch = teacherStorage.createTeacher(superAdminUser, {
          branchId: 'branch-riyadh',
          firstNameAr: 'معلم_دورة_الحياة',
          lastNameAr: 'التجريبي',
          firstNameEn: 'Lifecycle',
          lastNameEn: 'Teacher',
          gender: 'male',
          phoneNumber: '+966511112222',
          specialization: 'تاريخ',
          employmentType: 'FULL_TIME',
          subjectIds: ['sbj-riyadh-arabic'],
        });
        const onLeave = teacherStorage.changeTeacherStatus(superAdminUser, testTch.id, 'ON_LEAVE', 'إجازة دراسية');
        const archived = teacherStorage.archiveTeacher(superAdminUser, testTch.id, 'نهاية التعاقد الإداري');
        const detailArchived = teacherStorage.getTeacherById(superAdminUser, testTch.id);
        const subjectsPreserved = detailArchived.subjects.length > 0;
        const restored = teacherStorage.restoreTeacher(superAdminUser, testTch.id, 'عودة للخدمة');
        const passed =
          onLeave.employmentStatus === 'ON_LEAVE' &&
          archived.employmentStatus === 'ARCHIVED' &&
          subjectsPreserved &&
          restored.employmentStatus === 'ACTIVE';
        return { passed, message: 'Lifecycle & Archival integrity verified' };
      },
    },
    // 11. Teacher Record & Login Account Separation
    {
      id: 11,
      name: 'Teacher Record & User Account Separation',
      run: async () => {
        const teachers = teacherStorage.getRawTeachers();
        const users = authStorage.listUsers(superAdminUser);
        const sampleTeacher = teachers[0];
        const hasNoPassword = !('passwordHash' in sampleTeacher) && !('password' in sampleTeacher);
        const passed = hasNoPassword && teachers.length !== users.length;
        return { passed, message: 'Separation verified' };
      },
    },
    // 12. Qualifications Management
    {
      id: 12,
      name: 'Qualifications Management & Ordering',
      run: async () => {
        const tch = teacherStorage.getRawTeachers()[0];
        const addedQual = teacherStorage.addQualification(superAdminUser, tch.id, {
          degree: 'ماجستير مناهج وطرق تدريس',
          fieldOfStudy: 'تربية رياضية',
          institution: 'جامعة الإمام محمد بن سعود',
          graduationYear: 2024,
          isHighestDegree: true,
        });
        const detail = teacherStorage.getTeacherById(superAdminUser, tch.id);
        const isHighestFirst = detail.qualifications[0]?.id === addedQual.id;
        teacherStorage.removeQualification(superAdminUser, addedQual.id);
        return { passed: isHighestFirst, message: 'Highest qualification ordering verified' };
      },
    },
    // 13. Audit Trail Verification
    {
      id: 13,
      name: 'Audit Trail Recording',
      run: async () => {
        const logs = authStorage.getAuditLogs();
        const teacherLogs = logs.filter((l) => l.targetType === 'TEACHER');
        return { passed: teacherLogs.length > 0, message: `Found ${teacherLogs.length} audit logs` };
      },
    },
    // 14. Search, Filter, and Pagination Engine
    {
      id: 14,
      name: 'Search & Multi-Criteria Filtering',
      run: async () => {
        const searchAr = teacherStorage.listTeachers(superAdminUser, { search: 'فهد' });
        const searchEn = teacherStorage.listTeachers(superAdminUser, { search: 'Fahad' });
        const filterBranch = teacherStorage.listTeachers(superAdminUser, { branchId: 'branch-jeddah' });
        const passed =
          searchAr.totalCount >= 1 &&
          searchEn.totalCount >= 1 &&
          filterBranch.teachers.every((t) => t.branchId === 'branch-jeddah');
        return { passed, message: 'Search and filtering verified' };
      },
    },
    // 15. CSV Export Engine & Permission Guard
    {
      id: 15,
      name: 'CSV Export & Permission Guard',
      run: async () => {
        const csvData = teacherStorage.exportTeachersCSV(superAdminUser, { branchId: 'branch-riyadh' });
        const hasHeaders = csvData.includes('الرقم الوظيفي') && csvData.includes('الاسم الكامل');
        let viewerBlocked = false;
        try {
          teacherStorage.exportTeachersCSV(viewerUser, {});
        } catch {
          viewerBlocked = true;
        }
        return { passed: hasHeaders && viewerBlocked, message: 'CSV export & guard verified' };
      },
    },
  ];

  let passedCount = 0;
  let failedCount = 0;

  for (const test of tests) {
    try {
      const res = await test.run();
      if (res.passed) {
        passedCount++;
        console.log(`[PASS] Test ${test.id}: ${test.name} - ${res.message}`);
      } else {
        failedCount++;
        console.log(`[FAIL] Test ${test.id}: ${test.name} - ${res.message}`);
      }
    } catch (err: any) {
      failedCount++;
      console.log(`[FAIL] Test ${test.id}: ${test.name} - Exception: ${err.message}`);
    }
  }

  console.log('====================================================');
  console.log(`TOTAL: ${tests.length}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
