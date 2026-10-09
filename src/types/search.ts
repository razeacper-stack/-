export type SearchDomain =
  | 'all'
  | 'students'
  | 'teachers'
  | 'classes'
  | 'subjects'
  | 'timetable'
  | 'invoices'
  | 'payments'
  | 'branches';

export interface SearchResultBadge {
  text: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
}

export interface SearchResultItem {
  id: string;
  domain: SearchDomain;
  title: string;
  subtitle: string;
  meta?: string;
  badge?: SearchResultBadge;
  branchId: string;
  branchName?: string;
  targetTab: string;
  targetId?: string;
}

export interface SearchFilters {
  domain: SearchDomain;
  branchId?: string;
  academicYearId?: string;
  status?: string;
}

export interface SearchResponse {
  query: string;
  domain: SearchDomain;
  totalCount: number;
  results: SearchResultItem[];
  countsByDomain: Record<SearchDomain, number>;
  executionTimeMs: number;
}
