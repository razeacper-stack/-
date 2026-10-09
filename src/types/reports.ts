import { StandardPermissionKey } from './auth';

export type ReportCategory =
  | 'students'
  | 'teachers'
  | 'academic'
  | 'timetable'
  | 'attendance'
  | 'finance'
  | 'branches';

export type ReportId =
  // A. Student Reports
  | 'student_directory'
  | 'students_by_branch'
  | 'students_by_stage'
  | 'students_by_grade'
  | 'students_by_class'
  | 'enrollment_report'
  | 'student_guardian_directory'
  // B. Teacher Reports
  | 'teacher_directory'
  | 'teachers_by_branch'
  | 'teachers_by_subject'
  | 'teacher_workload'
  // C. Academic Reports
  | 'academic_structure'
  | 'classes_report'
  | 'subjects_report'
  // D. Timetable Reports
  | 'weekly_timetable'
  | 'class_timetable'
  | 'teacher_timetable'
  | 'room_timetable'
  // E. Attendance Reports
  | 'daily_attendance'
  | 'attendance_by_class'
  | 'attendance_by_student'
  | 'attendance_summary'
  | 'absence_late_report'
  // F. Finance Reports
  | 'fee_collection_summary'
  | 'outstanding_fees'
  | 'overdue_fees'
  | 'payments_register'
  | 'refunds_report'
  | 'student_financial_statement'
  | 'invoices_register'
  // G. Branch Reports
  | 'branch_overview'
  | 'cross_branch_comparison';

export type DatePreset = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'custom';

export interface ReportFilterParams {
  branchId?: string;
  academicYearId?: string;
  stageId?: string;
  gradeId?: string;
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  studentId?: string;
  status?: string;
  paymentStatus?: string;
  datePreset?: DatePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  searchTerm?: string;
}

export interface ReportColumn {
  key: string;
  labelAr: string;
  labelEn: string;
  align?: 'start' | 'center' | 'end';
  isMono?: boolean;
  isBadge?: boolean;
  isCurrency?: boolean;
}

export interface ReportSummaryItem {
  key: string;
  labelAr: string;
  labelEn: string;
  value: string | number;
  color?: 'default' | 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
  isCurrency?: boolean;
}

export interface ReportDefinition {
  id: ReportId;
  category: ReportCategory;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  requiredPermission: StandardPermissionKey;
  supportedFilters: (keyof ReportFilterParams)[];
  supportsExport: boolean;
  supportsPrint: boolean;
  columns: ReportColumn[];
}

export interface ReportResult {
  definition: ReportDefinition;
  generatedAt: string;
  generatedBy: string;
  branchNameAr: string;
  branchNameEn: string;
  academicYearNameAr?: string;
  academicYearNameEn?: string;
  filterSummary: { labelAr: string; labelEn: string; value: string }[];
  columns: ReportColumn[];
  rows: Record<string, any>[];
  summary: ReportSummaryItem[];
  totalRows: number;
}
