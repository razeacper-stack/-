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

import { timetableStorage } from '../src/services/timetableStorage';
import { authStorage } from '../src/services/authStorage';
import { branchStorage } from '../src/services/branchStorage';
import { academicStorage } from '../src/services/academicStorage';
import { teacherStorage } from '../src/services/teacherStorage';
import { SafeUser } from '../src/types/auth';

async function main() {
  console.log('====================================================');
  console.log('RUNNING PHASE 7 — TIMETABLE & SCHEDULING TEST SUITE');
  console.log('====================================================');

  await authStorage.initialize();
  branchStorage.initialize();
  academicStorage.initialize();
  teacherStorage.initialize();
  timetableStorage.initialize();

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
      'timetable.view',
      'timetable.create',
      'timetable.edit',
      'timetable.delete',
      'timetable.publish',
      'timetable.manage_periods',
      'timetable.manage_rooms',
      'timetable.export',
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
    permissions: ['timetable.view'] as any[],
  };

  const tests = [
    // 1. Timetable Model Validation
    {
      id: 1,
      name: 'Timetable Entry Model & Schema Integrity',
      run: async () => {
        const entries = timetableStorage.getRawTimetableEntries();
        if (entries.length === 0) return { passed: false, message: 'قاعدة بيانات الجداول فارغة.' };
        const sample = entries[0];
        const valid =
          Boolean(sample.id) &&
          Boolean(sample.branchId) &&
          Boolean(sample.academicYearId) &&
          Boolean(sample.classId) &&
          Boolean(sample.subjectId) &&
          Boolean(sample.teacherId) &&
          sample.dayOfWeek !== undefined &&
          Boolean(sample.periodId) &&
          Boolean(sample.status);
        return {
          passed: valid,
          message: valid ? `تم التحقق من النموذج القياسي للحصة: [${sample.id}]` : 'حقول إلزامية مفقودة في النموذج.',
        };
      },
    },

    // 2. Period Creation
    {
      id: 2,
      name: 'Period Creation & Automatic Duration Calculation',
      run: async () => {
        const newPrd = timetableStorage.createPeriod(superAdminUser, {
          branchId: 'branch-riyadh',
          nameAr: 'حصة اختبارية',
          nameEn: 'Test Period',
          periodNumber: 99,
          startTime: '14:00',
          endTime: '14:45',
          isBreak: false,
        });
        const passed = newPrd.durationMinutes === 45 && newPrd.periodNumber === 99;
        return {
          passed,
          message: passed ? `تم إنشاء الفترة وحساب المدة (45 دقيقة): ${newPrd.nameAr}` : 'فشل في إنشاء الفترة أو حساب المدة.',
        };
      },
    },

    // 3. Period Time Validation (startTime < endTime)
    {
      id: 3,
      name: 'Period Time Validation (startTime < endTime)',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createPeriod(superAdminUser, {
            branchId: 'branch-riyadh',
            nameAr: 'فترة غير صالحة',
            nameEn: 'Invalid Period',
            periodNumber: 100,
            startTime: '10:00',
            endTime: '09:00', // Invalid
          });
        } catch (err: any) {
          blocked = err.message.includes('أسبق');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم رفض الفترة غير الصالحة زمنياً بنجاح.' : 'فشل: تم السماح بوقت بدء متأخر عن وقت الانتهاء.',
        };
      },
    },

    // 4. Period Overlap Prevention
    {
      id: 4,
      name: 'Period Overlap Prevention in Branch',
      run: async () => {
        let blocked = false;
        try {
          // Attempt overlap with Period 1 (07:30 - 08:15)
          timetableStorage.createPeriod(superAdminUser, {
            branchId: 'branch-riyadh',
            nameAr: 'حصة متداخلة',
            nameEn: 'Overlapping Period',
            periodNumber: 101,
            startTime: '07:45',
            endTime: '08:30',
          });
        } catch (err: any) {
          blocked = err.message.includes('يتعارض') || err.message.includes('تداخل');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع تداخل أوقات الحصص النشطة بالفرع بنجاح.' : 'فشل: تم السماح بتداخل فترات دراسية.',
        };
      },
    },

    // 5. Timetable Creation
    {
      id: 5,
      name: 'Timetable Entry Placement & Resolution',
      run: async () => {
        const entry = timetableStorage.createTimetableEntry(superAdminUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          subjectId: 'sbj-riyadh-math',
          teacherId: 'tch-r-001',
          dayOfWeek: 2, // Tuesday
          periodId: 'prd-r-04',
          status: 'DRAFT',
        });
        const passed = Boolean(entry.id && entry.classCode);
        return {
          passed,
          message: passed ? `تم تسكين الحصة بنجاح: ${entry.subjectNameAr} مع ${entry.teacherNameAr}` : 'فشل تسكين الحصة.',
        };
      },
    },

    // 6. Teacher Conflict Rejection
    {
      id: 6,
      name: 'Teacher Conflict Rejection (Same Teacher at Same Time)',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1b',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-r-001', // Already busy at Sunday prd-r-01
            dayOfWeek: 0,
            periodId: 'prd-r-01',
          });
        } catch (err: any) {
          blocked = err.message.includes('تعارض في جدول المعلم') || err.message.includes('مشغول');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم كشف ومنع تعارض المعلم بنجاح.' : 'ثغرة: سُمح بتسكين المعلم في فصلين بنفس الوقت.',
        };
      },
    },

    // 7. Class Conflict Rejection
    {
      id: 7,
      name: 'Class Conflict Rejection (Two Lessons for Same Class)',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a', // Already has Math at Sunday prd-r-01
            subjectId: 'sbj-riyadh-arabic',
            teacherId: 'tch-r-002',
            dayOfWeek: 0,
            periodId: 'prd-r-01',
          });
        } catch (err: any) {
          blocked = err.message.includes('تعارض في جدول الفصل') || err.message.includes('مجدولة');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع تعارض الفصل الدراسي بنجاح.' : 'ثغرة: سُمح بجدولة حصتين لنفس الفصل بنفس الوقت.',
        };
      },
    },

    // 8. Room Conflict Rejection
    {
      id: 8,
      name: 'Room Conflict Rejection (Double Booking Room)',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1b',
            subjectId: 'sbj-riyadh-science',
            teacherId: 'tch-r-003',
            roomId: 'rm-r-101', // Occupied on Sunday prd-r-01
            dayOfWeek: 0,
            periodId: 'prd-r-01',
          });
        } catch (err: any) {
          blocked = err.message.includes('تعارض قاعة') || err.message.includes('مشغولة');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع تعارض القاعة الدراسية بنجاح.' : 'ثغرة: سُمح بإشغال قاعة مشغولة.',
        };
      },
    },

    // 9. Duplicate Lesson Rejection
    {
      id: 9,
      name: 'Duplicate Lesson Rejection Guard',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-r-001',
            dayOfWeek: 0,
            periodId: 'prd-r-01',
          });
        } catch (err: any) {
          blocked = err.message.includes('تكرار غير مسموح') || err.message.includes('مسبقاً');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم رفض الحصة المكررة بنجاح.' : 'فشل: تم السماح بإدخال حصة مكررة.',
        };
      },
    },

    // 10. Cross-Branch Rejection
    {
      id: 10,
      name: 'Cross-Branch Rejection (Riyadh Class + Jeddah Teacher)',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-j-001', // Jeddah teacher
            dayOfWeek: 3,
            periodId: 'prd-r-01',
          });
        } catch (err: any) {
          blocked = err.message.includes('فرع آخر') || err.message.includes('CROSS_BRANCH');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم حجب التعيين عبر الفروع بنجاح.' : 'ثغرة أمنية: تم السماح بجدولة معلم من فرع آخر.',
        };
      },
    },

    // 11. Academic-Year Mismatch Rejection
    {
      id: 11,
      name: 'Academic Year Mismatch Rejection',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2025', // Class is 2026
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-r-001',
            dayOfWeek: 3,
            periodId: 'prd-r-01',
          });
        } catch (err: any) {
          blocked = err.message.includes('عام دراسي مختلف') || err.message.includes('ACADEMIC_YEAR_MISMATCH');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع عدم توافق العام الدراسي بنجاح.' : 'فشل: سُمح بخلط الأعوام الدراسية.',
        };
      },
    },

    // 12. Invalid Teacher-Subject Rejection
    {
      id: 12,
      name: 'Teacher-Subject Eligibility Validation',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-science', // Science
            teacherId: 'tch-r-001', // Math teacher (not assigned to Science)
            dayOfWeek: 3,
            periodId: 'prd-r-05',
          });
        } catch (err: any) {
          blocked = err.message.includes('غير مسند لتدريس') || err.message.includes('أهلية');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم تطبيق شرط أهلية تخصص المعلم بنجاح.' : 'فشل: سُمح بتسكين معلم لمادة غير مسندة له.',
        };
      },
    },

    // 13. Inactive/On-Leave Teacher Rejection
    {
      id: 13,
      name: 'Inactive/On-Leave Teacher Guard',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-english',
            teacherId: 'tch-r-004', // ON_LEAVE
            dayOfWeek: 3,
            periodId: 'prd-r-01',
          });
        } catch (err: any) {
          blocked = err.message.includes('حالته الحالية') || err.message.includes('ON_LEAVE');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع تسكين حصة لمعلم غير نشط بنجاح.' : 'فشل: سُمح بتسكين حصة لمعلم مجاز.',
        };
      },
    },

    // 14. Break Period Rejection
    {
      id: 14,
      name: 'Break Period Guard (Recess & Prayer)',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-r-001',
            dayOfWeek: 3,
            periodId: 'prd-r-brk1', // Break period
          });
        } catch (err: any) {
          blocked = err.message.includes('الفسحة') || err.message.includes('استراحة');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع الجدولة في أوقات الفسحة بنجاح.' : 'فشل: سُمح بجدولة حصة أثناء الفسحة.',
        };
      },
    },

    // 15. Weekly Subject Load Validation
    {
      id: 15,
      name: 'Weekly Subject Load Calculation & Verification',
      run: async () => {
        const loads = timetableStorage.getWeeklySubjectLoad('cls-riyadh-1a', 'ay-riyadh-2026');
        const hasLoads = loads.length > 0;
        const sample = loads[0];
        const valid = hasLoads && sample.requiredPeriods > 0;
        return {
          passed: valid,
          message: valid
            ? `تم حساب النصاب لمادة ${sample.subjectNameAr}: (المجدول ${sample.scheduledPeriods} / المعتمد ${sample.requiredPeriods})`
            : 'فشل في استرجاع النصاب الأسبوعي.',
        };
      },
    },

    // 16. Timetable Move Validation
    {
      id: 16,
      name: 'Timetable Move Operation with Destination Conflict Pre-Check',
      run: async () => {
        const entry = timetableStorage.createTimetableEntry(superAdminUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          subjectId: 'sbj-riyadh-arabic',
          teacherId: 'tch-r-002',
          dayOfWeek: 4, // Thursday
          periodId: 'prd-r-01',
        });
        const moved = timetableStorage.moveTimetableEntry(superAdminUser, entry.id, {
          dayOfWeek: 4,
          periodId: 'prd-r-02',
        });
        const passed = moved.dayOfWeek === 4 && moved.periodId === 'prd-r-02';
        return {
          passed,
          message: passed ? 'تم نقل الحصة بنجاح بعد التحقق من خلو الوجهة من التعارضات.' : 'فشل نقل الحصة.',
        };
      },
    },

    // 17. Publish Validation (Empty Schedule Rejection)
    {
      id: 17,
      name: 'Publish Validation: Empty Schedule Rejection',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.publishClassTimetable(superAdminUser, 'branch-riyadh', 'ay-riyadh-2026', 'cls-riyadh-s1a');
        } catch (err: any) {
          blocked = err.message.includes('فارغ');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع اعتماد جدول فارغ بنجاح.' : 'فشل: سُمح بنشر جدول بدون حصص.',
        };
      },
    },

    // 18. Successful Publish & Unpublish Lifecycle
    {
      id: 18,
      name: 'Publish & Unpublish Lifecycle (DRAFT <-> PUBLISHED)',
      run: async () => {
        const res = timetableStorage.publishClassTimetable(
          superAdminUser,
          'branch-riyadh',
          'ay-riyadh-2026',
          'cls-riyadh-1a'
        );
        const entries = timetableStorage.getRawTimetableEntries().filter((e) => e.classId === 'cls-riyadh-1a');
        const allPublished = entries.every((e) => e.status === 'PUBLISHED');

        const unpub = timetableStorage.unpublishClassTimetable(
          superAdminUser,
          'branch-riyadh',
          'ay-riyadh-2026',
          'cls-riyadh-1a'
        );
        const entriesAfter = timetableStorage.getRawTimetableEntries().filter((e) => e.classId === 'cls-riyadh-1a');
        const allDraft = entriesAfter.every((e) => e.status === 'DRAFT');

        const passed = allPublished && allDraft && res.publishedCount > 0;
        return {
          passed,
          message: passed
            ? `دورة نشر (${res.publishedCount} حصة) وإلغاء نشر (${unpub.unpublishedCount} حصة) تمت بنجاح.`
            : 'فشل في دورة اعتماد وإلغاء نشر الجدول.',
        };
      },
    },

    // 19. Copy Class Timetable Validation
    {
      id: 19,
      name: 'Copy Class Timetable (Full Batch Replication & Safety)',
      run: async () => {
        // Create dedicated test classes
        const srcCls = academicStorage.createClass(superAdminUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          stageId: 'stg-riyadh-pri',
          gradeId: 'grd-riyadh-p1',
          nameAr: 'فصل مصدر النسخ',
          nameEn: 'Copy Source Class',
          classCode: 'CPY-SRC-01',
          capacity: 25,
        });

        const tgtCls = academicStorage.createClass(superAdminUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          stageId: 'stg-riyadh-pri',
          gradeId: 'grd-riyadh-p1',
          nameAr: 'فصل هدف النسخ',
          nameEn: 'Copy Target Class',
          classCode: 'CPY-TGT-01',
          capacity: 25,
        });

        // Assign tch-r-002 to Math as secondary subject so Riyadh has 2 eligible math teachers
        try {
          teacherStorage.assignSubjectToTeacher(
            superAdminUser,
            'tch-r-002',
            'sbj-riyadh-math',
            false
          );
        } catch {}

        // Add 1 lesson in srcCls
        timetableStorage.createTimetableEntry(superAdminUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: srcCls.id,
          subjectId: 'sbj-riyadh-math',
          teacherId: 'tch-r-001',
          dayOfWeek: 4, // Thursday
          periodId: 'prd-r-05',
        });

        // Copy from srcCls to tgtCls with overwrite
        const res = timetableStorage.copyClassTimetable(superAdminUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          sourceClassId: srcCls.id,
          targetClassId: tgtCls.id,
          overwriteExisting: true,
        });

        const copied = timetableStorage.getRawTimetableEntries().filter((e) => e.classId === tgtCls.id);
        const passed = res.copiedCount > 0 && copied.length === res.copiedCount;
        return {
          passed,
          message: passed
            ? `تم استنساخ ${res.copiedCount} حصة للفصل الجديد بنجاح مع الفحص الذري.`
            : 'فشل في نسخ جدول الحصص.',
        };
      },
    },

    // 20. Copy Class Timetable: Conflict Detection Rejection
    {
      id: 20,
      name: 'Copy Class Timetable: Overwrite Protection Rejection',
      run: async () => {
        let blocked = false;
        try {
          const classes = academicStorage.getRawClasses();
          const srcCls = classes.find((c) => c.classCode === 'CPY-SRC-01')!;
          const tgtCls = classes.find((c) => c.classCode === 'CPY-TGT-01')!;

          // Attempt copy to target without overwrite flag when target already has lessons
          timetableStorage.copyClassTimetable(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            sourceClassId: srcCls.id,
            targetClassId: tgtCls.id,
            overwriteExisting: false,
          });
        } catch (err: any) {
          blocked = err.message.includes('بالفعل على') || err.message.includes('الاستبدال');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم منع الكتابة فوق جدول موجود بدون موافقة صريحة.' : 'فشل: تم مسح الجدول بدون تفويض.',
        };
      },
    },

    // 21. Branch Isolation for Campus Managers
    {
      id: 21,
      name: 'Campus Isolation: Branch Manager Cannot Touch Other Branches',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(riyadhManagerUser, {
            branchId: 'branch-jeddah', // Cross-branch intrusion
            academicYearId: 'ay-jeddah-2026',
            classId: 'cls-j-p1-a',
            subjectId: 'sbj-jeddah-math',
            teacherId: 'tch-j-001',
            dayOfWeek: 0,
            periodId: 'prd-j-01',
          });
        } catch (err: any) {
          blocked = err.message.includes('غير مصرح') || err.message.includes('الفرع المحدد');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم رفض التدخل عبر الفروع لمدير الفرع وتوثيق الواقعة.' : 'ثغرة: تم اختراق عزل الفروع.',
        };
      },
    },

    // 22. Role Permissions: Viewer Denial
    {
      id: 22,
      name: 'Role Security: Viewer Denial of Timetable Mutation',
      run: async () => {
        let blocked = false;
        try {
          timetableStorage.createTimetableEntry(viewerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-r-001',
            dayOfWeek: 1,
            periodId: 'prd-r-03',
          });
        } catch (err: any) {
          blocked = err.message.includes('الصلاحية الكافية') || err.message.includes('timetable.create');
        }
        return {
          passed: blocked,
          message: blocked ? 'تم حجب محاولة الإنشاء للمشاهد بنجاح.' : 'ثغرة: سُمح لمشاهد بإنشاء حصة.',
        };
      },
    },

    // 23. Direct Service-Layer Authorization Guard
    {
      id: 23,
      name: 'Centralized Authorization Matrix Verification',
      run: async () => {
        const canSuperAdmin = authStorage.hasPermission(superAdminUser, 'timetable.create');
        const canManager = authStorage.hasPermission(riyadhManagerUser, 'timetable.create');
        const canViewer = authStorage.hasPermission(viewerUser, 'timetable.create');
        const passed = canSuperAdmin && canManager && !canViewer;
        return {
          passed,
          message: passed ? 'طبقة الصلاحيات المركزية تفصل بدقة بين الأدوار.' : 'فشل في مصفوفة الصلاحيات.',
        };
      },
    },

    // 24. Audit Trail Ledger Verification
    {
      id: 24,
      name: 'Audit Trail Ledger Verification for Timetable Actions',
      run: async () => {
        const logs = authStorage.getAuditLogs();
        const timetableLogs = logs.filter((l) => l.targetType === 'TIMETABLE');
        const passed = timetableLogs.length > 0;
        return {
          passed,
          message: passed
            ? `تم العثور على ${timetableLogs.length} سجل تدقيق أمني خاص بجدولة الحصص.`
            : 'فشل: لم يتم توثيق العمليات في سجل التدقيق.',
        };
      },
    },

    // 25. Concurrent Double Booking Protection
    {
      id: 25,
      name: 'Concurrent Double Booking Protection Simulation',
      run: async () => {
        let success1 = false;
        let blocked2 = false;
        try {
          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-r-001',
            dayOfWeek: 3,
            periodId: 'prd-r-07',
          });
          success1 = true;

          timetableStorage.createTimetableEntry(superAdminUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1b',
            subjectId: 'sbj-riyadh-math',
            teacherId: 'tch-r-001', // Same teacher in slot!
            dayOfWeek: 3,
            periodId: 'prd-r-07',
          });
        } catch {
          blocked2 = true;
        }
        const passed = success1 && blocked2;
        return {
          passed,
          message: passed
            ? 'نجاح التسكين الأول وحجب الحجز المزدوج المتزامن بنجاح.'
            : 'فشل في منع الحجز المزدوج المتزامن.',
        };
      },
    },

    // 26. Regression & Integrity Check for PHASES 1–6
    {
      id: 26,
      name: 'Regression & Integrity Test for PHASES 1–6',
      run: async () => {
        const branches = branchStorage.getStoredBranches();
        const years = academicStorage.getRawYears();
        const stages = academicStorage.getRawStages();
        const classes = academicStorage.getRawClasses();
        const teachers = teacherStorage.getRawTeachers();

        const passed =
          branches.length >= 3 &&
          years.length >= 1 &&
          stages.length >= 1 &&
          classes.length >= 1 &&
          teachers.length >= 1;

        return {
          passed,
          message: passed
            ? `تأكيد سلامة الأنظمة السابقة: ${branches.length} فروع، ${classes.length} فصول، ${teachers.length} معلماً.`
            : 'فشل: تلف أو فقدان بيانات المراحل السابقة.',
        };
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      const res = await t.run();
      if (res.passed) {
        passed++;
        console.log(`[PASS] Test ${t.id}: ${t.name} -> ${res.message}`);
      } else {
        failed++;
        console.error(`[FAIL] Test ${t.id}: ${t.name} -> ${res.message}`);
      }
    } catch (err: any) {
      failed++;
      console.error(`[FAIL] Test ${t.id}: ${t.name} -> Unexpected error: ${err.message}`);
    }
  }

  console.log('====================================================');
  console.log(`TOTAL:  ${tests.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
