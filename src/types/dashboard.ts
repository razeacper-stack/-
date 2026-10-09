/**
 * Phase 10: School Management Dashboard & School Overview Types
 * 
 * Central operational domain models, aggregations and KPI schemas.
 */

import { DayOfWeek } from './timetable';
import { CurrencyConfig } from '../utils/currency';

export interface DashboardFilterParams {
  branchId?: string; // 'all' or specific branchId
  academicYearId?: string;
  stageId?: string;
  gradeId?: string;
  classId?: string;
  date?: string; // YYYY-MM-DD
}

export interface DashboardKpis {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  attendanceRate: number | null; // percentage 0-100 or null if no records
  todayPresentCount: number;
  todayAbsentCount: number;
  todayLateCount: number;
  todayExcusedCount: number;
  todayEarlyDepartureCount: number;
  todayLessonsCount: number;
  // Finance KPIs (null if user lacks finance viewing permissions)
  outstandingFeesMinor: number | null;
  todayCollectionsMinor: number | null;
  totalInvoicedMinor: number | null;
  totalCollectedMinor: number | null;
}

export interface StageStudentCount {
  stageId: string;
  nameAr: string;
  nameEn: string;
  count: number;
}

export interface GradeStudentCount {
  gradeId: string;
  nameAr: string;
  nameEn: string;
  stageNameAr: string;
  count: number;
}

export interface ClassStudentCount {
  classId: string;
  nameAr: string;
  nameEn: string;
  gradeNameAr: string;
  count: number;
  capacity?: number;
}

export interface StudentDashboardOverview {
  total: number;
  active: number;
  inactive: number;
  byGender: {
    male: number;
    female: number;
  };
  byStage: StageStudentCount[];
  byGrade: GradeStudentCount[];
  byClass: ClassStudentCount[];
  newEnrollmentsCount: number;
}

export interface TeacherSubjectCount {
  subjectId: string;
  nameAr: string;
  count: number;
}

export interface TeacherWorkloadItem {
  teacherId: string;
  nameAr: string;
  weeklyPeriods: number;
  isOverloaded?: boolean;
}

export interface TeacherDashboardOverview {
  total: number;
  active: number;
  inactive: number;
  onLeave: number;
  suspended: number;
  byType: {
    fullTime: number;
    partTime: number;
  };
  bySubject: TeacherSubjectCount[];
  workloadSummary: TeacherWorkloadItem[];
}

export interface AttendanceDashboardOverview {
  date: string;
  rate: number; // percentage 0-100
  present: number;
  absent: number;
  late: number;
  excused: number;
  earlyDeparture: number;
  unrecordedCount: number;
  hasRecords: boolean;
  sessionsTotal: number;
  sessionsLocked: number;
  sessionsSubmitted: number;
  sessionsOpen: number;
}

export type LessonTimeStatus = 'UPCOMING' | 'CURRENT' | 'COMPLETED';

export interface DashboardLessonItem {
  id: string;
  periodId: string;
  periodNumber: number;
  periodNameAr: string;
  periodNameEn: string;
  startTime: string;
  endTime: string;
  classId: string;
  classNameAr: string;
  subjectId: string;
  subjectNameAr: string;
  subjectCode: string;
  teacherId: string;
  teacherNameAr: string;
  roomId?: string;
  roomNameAr?: string;
  status: LessonTimeStatus;
}

export interface TimetableDashboardOverview {
  date: string;
  dayOfWeek: DayOfWeek;
  dayNameAr: string;
  dayNameEn: string;
  totalLessons: number;
  completedCount: number;
  upcomingCount: number;
  lessons: DashboardLessonItem[];
  publishedClassesCount: number;
  unpublishedClassesCount: number;
}

export interface FinanceDashboardOverview {
  currency: CurrencyConfig;
  totalInvoicedMinor: number;
  totalCollectedMinor: number;
  outstandingMinor: number;
  overdueMinor: number;
  refundsMinor: number;
  collectionRate: number; // percentage 0-100
  invoicesCount: number;
  paymentsCount: number;
  overdueInvoicesCount: number;
}

export interface BranchDashboardCard {
  branchId: string;
  branchNameAr: string;
  branchNameEn: string;
  code: string;
  city: string;
  status: string;
  studentsCount: number;
  teachersCount: number;
  classesCount: number;
  attendanceRate: number | null;
  financeSummary?: {
    invoicedMinor: number;
    collectedMinor: number;
    outstandingMinor: number;
  };
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  category: 'attendance' | 'finance' | 'timetable' | 'academic' | 'teacher';
  severity: 'high' | 'medium' | 'low';
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  count?: number;
  actionTab?: string;
}

export interface DashboardActivityItem {
  id: string;
  action: string;
  actorName: string;
  targetIdentifier: string;
  branchNameAr: string;
  timestamp: string;
  timeAgo: string;
  type: 'student' | 'teacher' | 'attendance' | 'finance' | 'timetable' | 'academic' | 'system';
  result: 'SUCCESS' | 'DENIED' | 'FAILED';
  details: string;
}

export interface DashboardOverviewData {
  branchId: string;
  branchNameAr: string;
  branchNameEn: string;
  academicYearId: string;
  academicYearNameAr: string;
  academicYearNameEn: string;
  date: string;
  isSuperAdmin: boolean;
  canViewFinance: boolean;
  canViewCrossBranch: boolean;
  kpis: DashboardKpis;
  students: StudentDashboardOverview;
  teachers: TeacherDashboardOverview;
  attendance: AttendanceDashboardOverview;
  timetable: TimetableDashboardOverview;
  finance: FinanceDashboardOverview | null;
  branches: BranchDashboardCard[];
  alerts: DashboardAlert[];
  recentActivity: DashboardActivityItem[];
}
