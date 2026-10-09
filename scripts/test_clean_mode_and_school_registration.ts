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
import { branchStorage } from '../src/services/branchStorage';
import { academicStorage } from '../src/services/academicStorage';
import { teacherStorage } from '../src/services/teacherStorage';
import { studentStorage } from '../src/services/studentStorage';
import { timetableStorage } from '../src/services/timetableStorage';
import { financeStorage } from '../src/services/financeStorage';
import { storageResetService } from '../src/services/storageResetService';

function assert(condition: boolean, testNum: number, message: string) {
  if (!condition) {
    console.error(`❌ FAIL Test ${testNum}: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS Test ${testNum}: ${message}`);
  }
}

async function runCleanModeTests() {
  console.log('========================================================');
  console.log('🧪 TESTING ZERO-DATA CLEAN MODE & NEW SCHOOL REGISTRATION');
  console.log('========================================================\n');

  await authStorage.initialize();

  const superAdmin = authStorage.getUserById('user-super-admin')!;
  assert(Boolean(superAdmin), 1, 'Super Admin root user is available');

  // 1. Wipe all data to establish clean slate
  storageResetService.purgeAllData(superAdmin);
  assert(storageResetService.isDatabaseEmpty(), 2, 'Database is confirmed completely empty of branches');

  // 2. Verify all collections are empty (0 records)
  const branches = branchStorage.getStoredBranches();
  assert(branches.length === 0, 3, 'Branches collection has 0 records (Clean state)');

  const years = academicStorage.getRawYears();
  assert(years.length === 0, 4, 'Academic years collection has 0 records (Clean state)');

  const stages = academicStorage.getRawStages();
  assert(stages.length === 0, 5, 'Stages collection has 0 records (Clean state)');

  const classes = academicStorage.getRawClasses();
  assert(classes.length === 0, 6, 'Classes collection has 0 records (Clean state)');

  const teachers = teacherStorage.getRawTeachers();
  assert(teachers.length === 0, 7, 'Teachers collection has 0 records (Clean state)');

  const students = studentStorage.getRawStudents();
  assert(students.length === 0, 8, 'Students collection has 0 records (Clean state)');

  const timetableEntries = timetableStorage.getRawTimetableEntries();
  assert(timetableEntries.length === 0, 9, 'Timetable entries has 0 records (Clean state)');

  const invoices = financeStorage.getRawInvoices();
  assert(invoices.length === 0, 10, 'Invoices collection has 0 records (Clean state)');

  // 3. User registers their first school from scratch ("تسجيل مدرسة جديدة")
  const newSchool = branchStorage.createBranch(superAdmin, {
    code: 'SCH-01',
    nameAr: 'مدرسة رواد المستقبل الأهلية',
    nameEn: 'Future Pioneers Model School',
    managerName: 'أ. خالد الشمري',
    phone: '+966 11 555 4433',
    email: 'info@future-pioneers.edu.sa',
    addressAr: 'الرياض، حي الصحافة',
    addressEn: 'Riyadh, Al-Sahafa District',
    status: 'active',
  });

  assert(Boolean(newSchool.id), 11, 'First school successfully registered with generated unique ID');
  assert(newSchool.code === 'SCH-01', 12, 'School code verified as SCH-01');
  assert(newSchool.nameAr === 'مدرسة رواد المستقبل الأهلية', 13, 'Arabic school name verified');

  const afterRegistrationBranches = branchStorage.getStoredBranches();
  assert(afterRegistrationBranches.length === 1, 14, 'Branches collection now contains exactly 1 user-created school');
  assert(afterRegistrationBranches[0].id === newSchool.id, 15, 'Registered school matches stored school');

  // 4. User registers an academic year for their new school
  const newYear = academicStorage.createAcademicYear(superAdmin, {
    branchId: newSchool.id,
    nameAr: 'العام الدراسي 2026–2027',
    nameEn: 'Academic Year 2026–2027',
    startDate: '2026-09-01',
    endDate: '2027-06-30',
    status: 'ACTIVE',
    isCurrent: true,
  });

  assert(Boolean(newYear.id), 16, 'Academic year successfully created for the user-registered school');
  assert(newYear.branchId === newSchool.id, 17, 'Academic year is attached to the new school branch');

  // 5. User registers a second school
  const secondSchool = branchStorage.createBranch(superAdmin, {
    code: 'SCH-02',
    nameAr: 'مدرسة رواد المستقبل - فرع جدة',
    nameEn: 'Future Pioneers - Jeddah Campus',
    managerName: 'أ. سامي الغامدي',
    phone: '+966 12 666 7788',
    email: 'jeddah@future-pioneers.edu.sa',
    addressAr: 'جدة، حي الشاطئ',
    addressEn: 'Jeddah, Al-Shati District',
    status: 'active',
  });

  assert(branchStorage.getStoredBranches().length === 2, 18, 'Second school registered; total 2 user-created schools');

  // 6. Duplicate school code is rejected
  let duplicateRejected = false;
  try {
    branchStorage.createBranch(superAdmin, {
      code: 'SCH-01', // Already exists!
      nameAr: 'مدرسة مكررة',
      nameEn: 'Duplicate School',
      phone: '0500000000',
      email: 'dup@test.com',
      addressAr: 'الرياض',
      addressEn: 'Riyadh',
      status: 'active',
    });
  } catch {
    duplicateRejected = true;
  }
  assert(duplicateRejected, 19, 'Duplicate school code registration strictly rejected');

  console.log('\n========================================================');
  console.log('🎉 ALL 19 ZERO-DATA & SCHOOL REGISTRATION TESTS PASSED!');
  console.log('========================================================');
}

runCleanModeTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
