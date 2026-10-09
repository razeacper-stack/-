import { AuditRecord } from './auth';

export type AuditCategory =
  | 'AUTHENTICATION'
  | 'USER_MANAGEMENT'
  | 'PERMISSIONS'
  | 'BRANCH'
  | 'ACADEMIC'
  | 'STUDENTS'
  | 'GUARDIANS'
  | 'TEACHERS'
  | 'TIMETABLE'
  | 'ATTENDANCE'
  | 'FINANCE'
  | 'DASHBOARD'
  | 'SEARCH'
  | 'REPORTS'
  | 'EXPORT'
  | 'AI'
  | 'SECURITY'
  | 'SYSTEM';

export type AuditSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SECURITY';

export interface ActivityEvent extends AuditRecord {
  category: AuditCategory;
  severity: AuditSeverity;
  branchNameAr: string;
  branchNameEn: string;
  timeAgo: string;
  isSecuritySensitive: boolean;
  isFinancial: boolean;
}

export type ActivityDatePreset = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'all' | 'custom';

export interface ActivityFilterParams {
  branchId?: string;
  category?: AuditCategory | 'ALL';
  severity?: AuditSeverity | 'ALL';
  result?: 'SUCCESS' | 'DENIED' | 'FAILED' | 'ALL';
  userId?: string;
  role?: string;
  entityType?: string;
  action?: string;
  search?: string;
  datePreset?: ActivityDatePreset;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ActivityStats {
  totalEvents: number;
  securityEventsCount: number;
  aiEventsCount: number;
  financialEventsCount: number;
  failedOrDeniedCount: number;
  uniqueUsersCount: number;
  todayCount: number;
}

export interface ActivityQueryResult {
  events: ActivityEvent[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  stats: ActivityStats;
}
