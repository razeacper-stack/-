import React from 'react';
import { Search, Filter, RotateCcw, Calendar, Building, Shield } from 'lucide-react';
import { ActivityFilterParams, ActivityDatePreset, AuditCategory, AuditSeverity } from '../../types/activity';
import { useBranch } from '../../context/BranchContext';
import { useTranslation } from '../../context/LanguageContext';
import { Button } from '../common/Button';

export interface ActivityFiltersProps {
  filters: ActivityFilterParams;
  onChangeFilters: (updated: Partial<ActivityFilterParams>) => void;
  onResetFilters: () => void;
}

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  filters,
  onChangeFilters,
  onResetFilters,
}) => {
  const { accessibleBranches, canAccessAllBranches } = useBranch();
  const { language } = useTranslation();

  const datePresets: { id: ActivityDatePreset; labelAr: string; labelEn: string }[] = [
    { id: 'all', labelAr: 'كافة الفترات', labelEn: 'All Time' },
    { id: 'today', labelAr: 'اليوم', labelEn: 'Today' },
    { id: 'yesterday', labelAr: 'أمس', labelEn: 'Yesterday' },
    { id: 'this_week', labelAr: 'هذا الأسبوع', labelEn: 'This Week' },
    { id: 'this_month', labelAr: 'هذا الشهر', labelEn: 'This Month' },
  ];

  const categories: { id: AuditCategory | 'ALL'; labelAr: string; labelEn: string }[] = [
    { id: 'ALL', labelAr: 'كافة التصنيفات', labelEn: 'All Categories' },
    { id: 'SECURITY', labelAr: 'الأمان والحجب', labelEn: 'Security & Denials' },
    { id: 'AI', labelAr: 'المساعد الذكي', labelEn: 'AI Operations' },
    { id: 'FINANCE', labelAr: 'المالية والفواتير', labelEn: 'Finance & Invoices' },
    { id: 'ATTENDANCE', labelAr: 'الحضور والغياب', labelEn: 'Attendance' },
    { id: 'TIMETABLE', labelAr: 'الجداول المدرسية', labelEn: 'Timetable' },
    { id: 'STUDENTS', labelAr: 'شؤون الطلاب', labelEn: 'Students' },
    { id: 'TEACHERS', labelAr: 'الهيئة التعليمية', labelEn: 'Teachers' },
    { id: 'ACADEMIC', labelAr: 'الهيكل الأكاديمي', labelEn: 'Academic Structure' },
    { id: 'USER_MANAGEMENT', labelAr: 'إدارة المستخدمين', labelEn: 'User Management' },
    { id: 'PERMISSIONS', labelAr: 'الصلاحيات والأدوار', labelEn: 'Roles & Permissions' },
    { id: 'EXPORT', labelAr: 'التصدير والطباعة', labelEn: 'Exports & Printing' },
    { id: 'REPORTS', labelAr: 'التقارير المعتمدة', labelEn: 'Official Reports' },
  ];

  return (
    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-2xs">
      {/* Search and Quick Presets */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onChangeFilters({ search: e.target.value, page: 1 })}
            placeholder={
              language === 'ar'
                ? 'البحث باسم المستخدم، الإجراء، الكيان أو التفاصيل...'
                : 'Search by user, action, target entity or details...'
            }
            className="w-full h-9 ps-9 pe-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date presets */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs shrink-0">
          {datePresets.map((p) => (
            <button
              key={p.id}
              onClick={() => onChangeFilters({ datePreset: p.id, page: 1 })}
              className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                (filters.datePreset || 'all') === p.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {language === 'ar' ? p.labelAr : p.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Select Filter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
        {/* Category */}
        <select
          value={filters.category || 'ALL'}
          onChange={(e) => onChangeFilters({ category: e.target.value as any, page: 1 })}
          className="h-8.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 cursor-pointer"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {language === 'ar' ? c.labelAr : c.labelEn}
            </option>
          ))}
        </select>

        {/* Severity */}
        <select
          value={filters.severity || 'ALL'}
          onChange={(e) => onChangeFilters({ severity: e.target.value as any, page: 1 })}
          className="h-8.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 cursor-pointer"
        >
          <option value="ALL">{language === 'ar' ? 'كافة مستويات الأهمية' : 'All Severities'}</option>
          <option value="SECURITY">أمني / SECURITY</option>
          <option value="WARNING">تحذير / WARNING</option>
          <option value="ERROR">خطأ / ERROR</option>
          <option value="SUCCESS">ناجح / SUCCESS</option>
          <option value="INFO">معلوماتي / INFO</option>
        </select>

        {/* Result */}
        <select
          value={filters.result || 'ALL'}
          onChange={(e) => onChangeFilters({ result: e.target.value as any, page: 1 })}
          className="h-8.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 cursor-pointer"
        >
          <option value="ALL">{language === 'ar' ? 'كافة النتائج' : 'All Results'}</option>
          <option value="SUCCESS">ناجح / SUCCESS</option>
          <option value="DENIED">محجوب / DENIED</option>
          <option value="FAILED">فشل / FAILED</option>
        </select>

        {/* Branch Context */}
        <select
          value={filters.branchId || 'all'}
          onChange={(e) => onChangeFilters({ branchId: e.target.value, page: 1 })}
          className="h-8.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 cursor-pointer"
        >
          {canAccessAllBranches && (
            <option value="all">{language === 'ar' ? 'كافة الفروع المتاحة' : 'All Branches'}</option>
          )}
          {accessibleBranches.map((b) => (
            <option key={b.id} value={b.id}>
              {language === 'ar' ? b.nameAr : b.nameEn}
            </option>
          ))}
        </select>

        {/* Reset Button */}
        <button
          onClick={onResetFilters}
          className="h-8.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'إعادة ضبط' : 'Reset'}</span>
        </button>
      </div>
    </div>
  );
};
