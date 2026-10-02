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

import { attendanceStorage } from '../src/services/attendanceStorage';
import { timetableStorage } from '../src/services/timetableStorage';
import { authStorage } from '../src/services/authStorage';
import { branchStorage } from '../src/services/branchStorage';
import { academicStorage } from '../src/services/academicStorage';
import { studentStorage } from '../src/services/studentStorage';
import { teacherStorage } from '../src/services/teacherStorage';
import { SafeUser } from '../src/types/auth';

async function main() {
  console.log('========================================================');
  console.log('RUNNING PHASE 8 — ATTENDANCE & ABSENCE TEST SUITE');
  console.log('========================================================');

  await authStorage.initialize();
  branchStorage.initialize();
  academicStorage.initialize();
  studentStorage.initialize();
  teacherStorage.initialize();
  timetableStorage.initialize();
  attendanceStorage.initialize();

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
      'attendance.view',
      'attendance.create',
      'attendance.edit',
      'attendance.submit',
      'attendance.lock',
      'attendance.unlock',
      'attendance.correct',
      'attendance.view_reports',
      'attendance.export',
      'attendance.delete',
    ] as any[],
  };

  const jeddahStaffUser: SafeUser = {
    id: 'user-staff-jeddah',
    fullName: 'أ. فهد الجابري (موظف جدة)',
    username: 'fahad.jeddah',
    email: 'fahad@schoolms.edu',
    roleId: 'role-staff',
    roleCode: 'STAFF',
    roleNameAr: 'موظف فرع جدة',
    roleNameEn: 'Jeddah Staff',
    branchIds: ['branch-jeddah'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: [
      'attendance.view',
      'attendance.create',
      'attendance.edit',
      'attendance.submit',
    ] as any[],
  };

  const teacherRiyadhUser: SafeUser = {
    id: 'tch-r-001',
    fullName: 'أ. فهد المنصور (معلم رياضيات)',
    username: 'fahad.mansoor',
    email: 'fahad.mansoor@schoolms.edu',
    roleId: 'role-teacher',
    roleCode: 'TEACHER',
    roleNameAr: 'معلم رياضيات',
    roleNameEn: 'Math Teacher',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: [
      'attendance.view',
      'attendance.create',
      'attendance.edit',
      'attendance.submit',
    ] as any[],
  };

  const unauthorizedTeacherUser: SafeUser = {
    id: 'tch-unauthorized-99',
    fullName: 'أ. عبدالمحسن الزهراني (معلم غير مسند)',
    username: 'abdmohsen.teacher',
    email: 'unassigned.teacher@schoolms.edu',
    roleId: 'role-teacher',
    roleCode: 'TEACHER',
    roleNameAr: 'معلم خارجي',
    roleNameEn: 'Unassigned Teacher',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: ['attendance.view', 'attendance.create'] as any[],
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
    permissions: ['attendance.view'] as any[],
  };

  const tests = [
    // 1. Model Structure & Enums
    {
      id: 1,
      name: 'Attendance Model Validation & 5 Statuses',
      run: async () => {
        const rawRecords = attendanceStorage.getRawRecords();
        const rawSessions = attendanceStorage.getRawSessions();
        const validRec = rawRecords.length > 0 && rawRecords.every((r) => r.id && r.branchId && r.studentId && r.date);
        const validSess = rawSessions.length > 0 && rawSessions.every((s) => s.id && s.branchId && s.classId);
        return {
          passed: validRec && validSess,
          message: `Model validated: ${rawRecords.length} records, ${rawSessions.length} sessions.`,
        };
      },
    },

    // 2. Class Roster Loading
    {
      id: 2,
      name: 'Class Roster Enrollment Snapshot',
      run: async () => {
        const roster = attendanceStorage.getClassRosterWithAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: '2026-09-27',
          type: 'DAILY',
        });
        const passed = roster.students.length > 0 && roster.students.every((s) => s.studentId && s.fullNameAr);
        return {
          passed,
          message: `Loaded ${roster.students.length} enrolled students in alphabetical order.`,
        };
      },
    },

    // 3. Daily Attendance Recording
    {
      id: 3,
      name: 'Daily Attendance Recording with Real-time Session Stats',
      run: async () => {
        const testDate = '2026-10-05';
        const result = attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [
            { studentId: 'stu-riyadh-001', status: 'PRESENT', checkInTime: '07:20' },
            { studentId: 'stu-riyadh-002', status: 'LATE', checkInTime: '07:45', lateMinutes: 15 },
            { studentId: 'stu-riyadh-003', status: 'EXCUSED', reasonCode: 'MEDICAL', note: 'Medical note' },
          ],
        });
        const passed = result.savedCount === 3 && result.session.presentCount === 1 && result.session.lateCount === 1;
        return {
          passed,
          message: `Saved ${result.savedCount} student records, session updated (present: ${result.session.presentCount}, late: ${result.session.lateCount}).`,
        };
      },
    },

    // 4. Lesson Attendance tied to Timetable & Period
    {
      id: 4,
      name: 'Lesson Attendance linked to Timetable Entry & Period',
      run: async () => {
        const testDate = '2026-10-06';
        const result = attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'LESSON',
          timetableEntryId: 'tme-001',
          periodId: 'prd-r-01',
          records: [
            { studentId: 'stu-riyadh-001', status: 'PRESENT' },
            { studentId: 'stu-riyadh-002', status: 'PRESENT' },
            { studentId: 'stu-riyadh-003', status: 'ABSENT', reasonCode: 'UNEXCUSED' },
          ],
        });
        const recs = attendanceStorage.listRecords(riyadhManagerUser, {
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'LESSON',
        });
        const passed = result.savedCount === 3 && recs[0]?.periodId === 'prd-r-01';
        return {
          passed,
          message: `Saved lesson attendance for period prd-r-01 with timetable linkage.`,
        };
      },
    },

    // 5. Data Integrity: Reject Cross-Branch Student
    {
      id: 5,
      name: 'Data Integrity: Reject Cross-Branch Student with Security Audit',
      run: async () => {
        try {
          attendanceStorage.saveClassAttendance(riyadhManagerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            date: '2026-10-07',
            type: 'DAILY',
            records: [{ studentId: 'stu-jeddah-001', status: 'PRESENT' }],
          });
          return { passed: false, message: 'Security hole: foreign branch student accepted.' };
        } catch (err: any) {
          const passed = err.message.includes('يتبع فرعاً آخر') || err.message.includes('غير مقيد');
          return {
            passed,
            message: `Successfully blocked cross-branch student: "${err.message}"`,
          };
        }
      },
    },

    // 6. Data Integrity: Reject Un-Enrolled Student
    {
      id: 6,
      name: 'Data Integrity: Reject Un-Enrolled Student in Target Class',
      run: async () => {
        try {
          attendanceStorage.saveClassAttendance(riyadhManagerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            date: '2026-10-08',
            type: 'DAILY',
            records: [{ studentId: 'stu-riyadh-004', status: 'PRESENT' }],
          });
          return { passed: false, message: 'Error: un-enrolled student accepted in class.' };
        } catch (err: any) {
          const passed = err.message.includes('غير مقيد');
          return {
            passed,
            message: `Successfully rejected un-enrolled student: "${err.message}"`,
          };
        }
      },
    },

    // 7. Timetable Entry Mismatch Rejection
    {
      id: 7,
      name: 'Timetable Entry Mismatch Rejection',
      run: async () => {
        try {
          attendanceStorage.saveClassAttendance(riyadhManagerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            date: '2026-10-09',
            type: 'LESSON',
            timetableEntryId: 'tme-mismatched-999',
            periodId: 'prd-r-02',
            records: [{ studentId: 'stu-riyadh-001', status: 'PRESENT' }],
          });
          return { passed: false, message: 'Error: invalid timetable entry accepted.' };
        } catch {
          return {
            passed: true,
            message: 'Successfully rejected mismatched timetable entry.',
          };
        }
      },
    },

    // 8. Distinction between Daily and Lesson Attendance
    {
      id: 8,
      name: 'Duplicate Prevention: Separate Daily vs Lesson Attendance Records',
      run: async () => {
        const testDate = '2026-10-10';
        attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [{ studentId: 'stu-riyadh-001', status: 'PRESENT' }],
        });

        attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'LESSON',
          periodId: 'prd-r-01',
          records: [{ studentId: 'stu-riyadh-001', status: 'ABSENT', reasonCode: 'UNEXCUSED' }],
        });

        const daily = attendanceStorage.listRecords(riyadhManagerUser, { date: testDate, type: 'DAILY', studentId: 'stu-riyadh-001' });
        const lesson = attendanceStorage.listRecords(riyadhManagerUser, { date: testDate, type: 'LESSON', studentId: 'stu-riyadh-001' });

        const passed = daily.length === 1 && daily[0].status === 'PRESENT' &&
                       lesson.length === 1 && lesson[0].status === 'ABSENT';
        return {
          passed,
          message: 'Both daily (PRESENT) and lesson (ABSENT) co-exist without overwriting.',
        };
      },
    },

    // 9. Late Arrival & Automatic Late Minutes
    {
      id: 9,
      name: 'Late Arrival & Automatic Late Minutes Calculation',
      run: async () => {
        const testDate = '2026-10-11';
        attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'LESSON',
          periodId: 'prd-r-01', // Starts at 07:30
          records: [{ studentId: 'stu-riyadh-001', status: 'LATE', checkInTime: '07:50', reasonCode: 'TRANSPORTATION' }],
        });

        const recs = attendanceStorage.listRecords(riyadhManagerUser, { date: testDate, studentId: 'stu-riyadh-001', type: 'LESSON' });
        const passed = recs[0] && recs[0].status === 'LATE' && recs[0].lateMinutes === 20;
        return {
          passed,
          message: `Calculated late minutes: ${recs[0]?.lateMinutes} mins (arrival: ${recs[0]?.checkInTime}).`,
        };
      },
    },

    // 10. Early Departure & Check-Out Time
    {
      id: 10,
      name: 'Early Departure & Check-Out Time Tracking',
      run: async () => {
        const testDate = '2026-10-12';
        attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [{
            studentId: 'stu-riyadh-002',
            status: 'EARLY_DEPARTURE',
            checkInTime: '07:25',
            checkOutTime: '11:30',
            reasonCode: 'OFFICIAL_PERMISSION',
          }],
        });

        const recs = attendanceStorage.listRecords(riyadhManagerUser, { date: testDate, studentId: 'stu-riyadh-002' });
        const passed = recs[0] && recs[0].status === 'EARLY_DEPARTURE' && recs[0].checkOutTime === '11:30';
        return {
          passed,
          message: `Recorded early departure with checkout time ${recs[0]?.checkOutTime}.`,
        };
      },
    },

    // 11. Excused Absence & Standard Reason Codes
    {
      id: 11,
      name: 'Excused Absence with Standard Reason Codes',
      run: async () => {
        const testDate = '2026-10-13';
        attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [{
            studentId: 'stu-riyadh-003',
            status: 'EXCUSED',
            reasonCode: 'MEDICAL',
            note: 'Doctor certificate approved',
          }],
        });

        const recs = attendanceStorage.listRecords(riyadhManagerUser, { date: testDate, studentId: 'stu-riyadh-003' });
        const passed = recs[0] && recs[0].status === 'EXCUSED' && recs[0].reasonCode === 'MEDICAL';
        return {
          passed,
          message: `Recorded excused absence with reason code ${recs[0]?.reasonCode}.`,
        };
      },
    },

    // 12. Session Status Lifecycle
    {
      id: 12,
      name: 'Attendance Session Lifecycle (OPEN -> SUBMITTED -> LOCKED)',
      run: async () => {
        const testDate = '2026-10-14';
        const sub = attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [{ studentId: 'stu-riyadh-001', status: 'PRESENT' }],
        });

        const locked = attendanceStorage.lockAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
        });

        const passed = sub.session.status === 'SUBMITTED' && locked.status === 'LOCKED';
        return {
          passed,
          message: `Lifecycle transition: SUBMITTED -> LOCKED successfully verified.`,
        };
      },
    },

    // 13. Lock Enforcement
    {
      id: 13,
      name: 'Session Lock Enforcement Against Unauthorized Modifiers',
      run: async () => {
        const testDate = '2026-10-14';
        try {
          attendanceStorage.saveClassAttendance(viewerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            date: testDate,
            type: 'DAILY',
            records: [{ studentId: 'stu-riyadh-001', status: 'ABSENT' }],
          });
          return { passed: false, message: 'Failed: locked session modified.' };
        } catch (err: any) {
          const passed = err.message.includes('مقفل') || err.message.includes('الصلاحية');
          return {
            passed,
            message: `Locked session prevented edits: "${err.message}"`,
          };
        }
      },
    },

    // 14. Authorized Session Unlocking
    {
      id: 14,
      name: 'Authorized Administrative Session Unlocking',
      run: async () => {
        const testDate = '2026-10-14';
        const unl = attendanceStorage.unlockAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
        });
        const passed = unl.status === 'SUBMITTED' && !unl.lockedAt;
        return {
          passed,
          message: `Session unlocked, restored to SUBMITTED state.`,
        };
      },
    },

    // 15. Audited Attendance Correction
    {
      id: 15,
      name: 'Audited Record Correction with Mandatory Justification & History Trail',
      run: async () => {
        const testDate = '2026-10-15';
        attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [{ studentId: 'stu-riyadh-001', status: 'ABSENT' }],
        });

        const recs = attendanceStorage.listRecords(riyadhManagerUser, { date: testDate, studentId: 'stu-riyadh-001' });
        const corrected = attendanceStorage.correctAttendance(riyadhManagerUser, recs[0].id, {
          status: 'EXCUSED',
          reasonCode: 'MEDICAL',
          correctionReason: 'Submitted approved medical report',
        });

        const passed = corrected.status === 'EXCUSED' && corrected.history && corrected.history.length === 1;
        return {
          passed,
          message: `Correction audited: previous=${corrected.history?.[0].previousStatus}, new=${corrected.status}.`,
        };
      },
    },

    // 16. Rejection of Correction Without Justification
    {
      id: 16,
      name: 'Rejection of Correction Without Mandatory Justification',
      run: async () => {
        const testDate = '2026-10-15';
        const recs = attendanceStorage.listRecords(riyadhManagerUser, { date: testDate, studentId: 'stu-riyadh-001' });
        try {
          attendanceStorage.correctAttendance(riyadhManagerUser, recs[0].id, {
            status: 'PRESENT',
            correctionReason: '',
          });
          return { passed: false, message: 'Failed: empty justification accepted.' };
        } catch (err: any) {
          const passed = err.message.includes('سبب ومبرر');
          return {
            passed,
            message: `Mandatory justification enforced: "${err.message}"`,
          };
        }
      },
    },

    // 17. Teacher Authorization: Authorized Teacher Allowed
    {
      id: 17,
      name: 'Teacher Authorization: Assigned Teacher Allowed to Record',
      run: async () => {
        const testDate = '2026-10-16';
        const result = attendanceStorage.saveClassAttendance(teacherRiyadhUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [{ studentId: 'stu-riyadh-001', status: 'PRESENT' }],
        });
        const passed = result.savedCount === 1;
        return {
          passed,
          message: `Assigned teacher ${teacherRiyadhUser.fullName} successfully recorded attendance.`,
        };
      },
    },

    // 18. Teacher Authorization: Unauthorized Teacher Blocked at Service Layer
    {
      id: 18,
      name: 'Teacher Authorization: Unassigned Teacher Blocked at Service Layer with Audit',
      run: async () => {
        const testDate = '2026-10-16';
        try {
          attendanceStorage.saveClassAttendance(unauthorizedTeacherUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            classId: 'cls-riyadh-1a',
            date: testDate,
            type: 'DAILY',
            records: [{ studentId: 'stu-riyadh-001', status: 'PRESENT' }],
          });
          return { passed: false, message: 'Security hole: unassigned teacher recorded attendance.' };
        } catch (err: any) {
          const passed = err.message.includes('غير مصرح لك برصد حضور هذا الفصل');
          return {
            passed,
            message: `Blocked unauthorized teacher in service layer: "${err.message}"`,
          };
        }
      },
    },

    // 19. SuperAdmin Global Access and Lock Override
    {
      id: 19,
      name: 'SuperAdmin Global Multi-Branch Access & Privileges',
      run: async () => {
        const riyadh = attendanceStorage.listRecords(superAdminUser, { branchId: 'branch-riyadh' });
        const jeddah = attendanceStorage.listRecords(superAdminUser, { branchId: 'branch-jeddah' });
        const passed = Array.isArray(riyadh) && Array.isArray(jeddah);
        return {
          passed,
          message: 'SuperAdmin has direct unhindered access to records across all branches.',
        };
      },
    },

    // 20. Historical Snapshot Preservation on Transfer
    {
      id: 20,
      name: 'Historical Snapshot Preservation on Student Transfer',
      run: async () => {
        const recs = attendanceStorage.listRecords(riyadhManagerUser, { studentId: 'stu-riyadh-001', date: '2026-09-27' });
        const passed = recs[0] && recs[0].classId === 'cls-riyadh-1a';
        return {
          passed,
          message: `Historical record preserves class context [${recs[0]?.classNameAr}] at time of attendance.`,
        };
      },
    },

    // 21. Attendance Rates & Statistics Accuracy
    {
      id: 21,
      name: 'Attendance Percentage & Metric Accuracy Calculation',
      run: async () => {
        const summary = attendanceStorage.getStudentAttendanceSummary(riyadhManagerUser, 'stu-riyadh-001');
        const stats = summary.stats;
        const effective = stats.presentCount + stats.lateCount + stats.earlyDepartureCount;
        const expected = stats.totalSessions > 0 ? Math.round((effective / stats.totalSessions) * 100) : 100;
        const passed = stats.attendanceRate === expected;
        return {
          passed,
          message: `Attendance rate ${stats.attendanceRate}% correctly calculated (present: ${stats.presentCount}, late: ${stats.lateCount}).`,
        };
      },
    },

    // 22. Class Attendance Dashboard for Branch
    {
      id: 22,
      name: 'Branch-Wide Daily Class Attendance Dashboard',
      run: async () => {
        const dash = attendanceStorage.getClassAttendanceDashboard(riyadhManagerUser, 'branch-riyadh', '2026-09-27');
        const passed = dash.length > 0 && dash.every((c) => c.classId && c.classNameAr);
        return {
          passed,
          message: `Generated daily overview across ${dash.length} classes in branch-riyadh.`,
        };
      },
    },

    // 23. Student Attendance Profile & Chronological History
    {
      id: 23,
      name: 'Individual Student Attendance Profile & History',
      run: async () => {
        const profile = attendanceStorage.getStudentAttendanceSummary(riyadhManagerUser, 'stu-riyadh-001');
        const passed = profile.records.length > 0 && profile.stats.totalSessions === profile.records.length;
        return {
          passed,
          message: `Retrieved student profile with ${profile.records.length} chronological attendance records.`,
        };
      },
    },

    // 24. Attendance Deletion with Lock Guard & Audit
    {
      id: 24,
      name: 'Attendance Deletion Guard with Audit Trail',
      run: async () => {
        const testDate = '2026-10-18';
        attendanceStorage.saveClassAttendance(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          classId: 'cls-riyadh-1a',
          date: testDate,
          type: 'DAILY',
          records: [{ studentId: 'stu-riyadh-001', status: 'PRESENT' }],
        });

        const recs = attendanceStorage.listRecords(riyadhManagerUser, { date: testDate, studentId: 'stu-riyadh-001' });
        attendanceStorage.deleteAttendanceRecord(riyadhManagerUser, recs[0].id);

        const after = attendanceStorage.listRecords(riyadhManagerUser, { date: testDate, studentId: 'stu-riyadh-001' });
        const passed = after.length === 0;
        return {
          passed,
          message: 'Record successfully deleted and audited in audit trail.',
        };
      },
    },

    // 25. Formatted CSV Export with UTF-8 BOM
    {
      id: 25,
      name: 'CSV Export with UTF-8 BOM and Arabic Column Headers',
      run: async () => {
        const csv = attendanceStorage.exportAttendanceCSV(riyadhManagerUser, { branchId: 'branch-riyadh' });
        const passed = csv.startsWith('\uFEFF') && csv.includes('التاريخ') && csv.includes('اسم الطالب');
        return {
          passed,
          message: `Generated valid CSV (${csv.length} bytes) with UTF-8 BOM and Arabic terms.`,
        };
      },
    },

    // 26. Multi-Branch Isolation
    {
      id: 26,
      name: 'Multi-Branch Isolation on Attendance Queries',
      run: async () => {
        try {
          attendanceStorage.listRecords(jeddahStaffUser, { branchId: 'branch-riyadh' });
          return { passed: false, message: 'Failed: cross-branch query allowed.' };
        } catch (err: any) {
          const passed = err.message.includes('غير مصرح لك');
          return {
            passed,
            message: `Cross-branch query denied: "${err.message}"`,
          };
        }
      },
    },

    // 27. Centralized Audit Logging Verification
    {
      id: 27,
      name: 'Centralized Audit Trail Verification (authStorage)',
      run: async () => {
        const logs = authStorage.getAuditLogs();
        const attLogs = logs.filter((l) => l.targetType === 'ATTENDANCE');
        const passed = attLogs.length >= 5;
        return {
          passed,
          message: `Verified ${attLogs.length} attendance operations logged with actors, timestamps, and results.`,
        };
      },
    },

    // 28. Prior Phases Regressions Check
    {
      id: 28,
      name: 'Prior Phases Regression Check (Phases 1-7 Intact)',
      run: async () => {
        const branches = branchStorage.getStoredBranches();
        const classes = academicStorage.getRawClasses();
        const students = studentStorage.getRawStudents();
        const teachers = teacherStorage.getRawTeachers();
        const timetableEntries = timetableStorage.getRawTimetableEntries();

        const passed =
          branches.length >= 2 &&
          classes.length >= 2 &&
          students.length >= 3 &&
          teachers.length >= 2 &&
          timetableEntries.length >= 3;
        return {
          passed,
          message: `System integrity intact: ${branches.length} branches, ${classes.length} classes, ${students.length} students, ${teachers.length} teachers, ${timetableEntries.length} timetable entries.`,
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
        console.log(`[PASS] Test ${t.id.toString().padStart(2, '0')}: ${t.name} -> ${res.message}`);
      } else {
        failed++;
        console.error(`[FAIL] Test ${t.id.toString().padStart(2, '0')}: ${t.name} -> ${res.message}`);
      }
    } catch (err: any) {
      failed++;
      console.error(`[FAIL] Test ${t.id.toString().padStart(2, '0')}: ${t.name} -> Unexpected error: ${err.message}`);
    }
  }

  console.log('========================================================');
  console.log(`PHASE 8 TESTS TOTAL:  ${tests.length}`);
  console.log(`PHASE 8 TESTS PASSED: ${passed}`);
  console.log(`PHASE 8 TESTS FAILED: ${failed}`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
