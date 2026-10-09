import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Users,
  UserCheck,
  School,
  BookOpen,
  CalendarDays,
  CreditCard,
  Building2,
  X,
  Clock,
  ArrowRight,
  ArrowLeft,
  Filter,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { useTranslation } from '../../context/LanguageContext';
import { searchStorage } from '../../services/searchStorage';
import { SearchDomain, SearchResultItem } from '../../types/search';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export interface SearchCenterProps {
  onNavigateTab: (tabId: string) => void;
  initialQuery?: string;
  initialDomain?: SearchDomain;
}

export const SearchCenter: React.FC<SearchCenterProps> = ({
  onNavigateTab,
  initialQuery = '',
  initialDomain = 'all',
}) => {
  const { currentUser, isSuperAdmin, hasPermission } = useAuth();
  const { activeBranchId, branches, isAllBranches } = useBranch();
  const { t, language, direction } = useTranslation();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  const [query, setQuery] = useState(initialQuery);
  const [selectedDomain, setSelectedDomain] = useState<SearchDomain>(initialDomain);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranchId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Keep branch in sync if activeBranchId changes
  useEffect(() => {
    if (activeBranchId) {
      setSelectedBranchId(activeBranchId);
    }
  }, [activeBranchId]);

  // Execute Search via searchStorage
  const searchResponse = useMemo(() => {
    if (!currentUser) {
      return {
        query: '',
        domain: selectedDomain,
        totalCount: 0,
        results: [],
        countsByDomain: {
          all: 0,
          students: 0,
          teachers: 0,
          classes: 0,
          subjects: 0,
          timetable: 0,
          invoices: 0,
          payments: 0,
          branches: 0,
        },
        executionTimeMs: 0,
      };
    }

    return searchStorage.searchAuthorized(currentUser, query, {
      domain: selectedDomain,
      branchId: selectedBranchId,
      status: statusFilter || undefined,
    });
  }, [currentUser, query, selectedDomain, selectedBranchId, statusFilter]);

  // Domain Config with Icons
  const domainTabs: { id: SearchDomain; labelAr: string; labelEn: string; icon: any; permission?: string }[] = [
    { id: 'all', labelAr: 'كافة الأقسام', labelEn: 'All Domains', icon: Layers },
    { id: 'students', labelAr: 'الطلاب', labelEn: 'Students', icon: Users, permission: 'students.view' },
    { id: 'teachers', labelAr: 'المعلمون', labelEn: 'Teachers', icon: UserCheck, permission: 'teachers.view' },
    { id: 'classes', labelAr: 'الفصول', labelEn: 'Classes', icon: School, permission: 'classes.view' },
    { id: 'subjects', labelAr: 'المواد', labelEn: 'Subjects', icon: BookOpen, permission: 'subjects.view' },
    { id: 'timetable', labelAr: 'الجدول', labelEn: 'Timetable', icon: CalendarDays, permission: 'timetable.view' },
    { id: 'invoices', labelAr: 'الفواتير', labelEn: 'Invoices', icon: CreditCard, permission: 'fees.view' },
    { id: 'payments', labelAr: 'سندات القبض', labelEn: 'Receipts', icon: CreditCard, permission: 'payments.view' },
    { id: 'branches', labelAr: 'الفروع', labelEn: 'Branches', icon: Building2, permission: 'branches.view' },
  ];

  // Filter tabs by user permissions
  const authorizedDomains = domainTabs.filter((tab) => {
    if (tab.id === 'all') return true;
    if (tab.permission && !hasPermission(tab.permission as any) && !isSuperAdmin) {
      return false;
    }
    return true;
  });

  const getDomainIcon = (d: SearchDomain) => {
    switch (d) {
      case 'students': return Users;
      case 'teachers': return UserCheck;
      case 'classes': return School;
      case 'subjects': return BookOpen;
      case 'timetable': return CalendarDays;
      case 'invoices': return CreditCard;
      case 'payments': return CreditCard;
      case 'branches': return Building2;
      default: return Sparkles;
    }
  };

  const quickSuggestions = ['أحمد', 'نورة', 'فصل 1/أ', 'رياضيات', 'INV-2026', 'RCP-2026'];

  return (
    <div className="space-y-6">
      {/* Search Header Hero */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-blue-600 to-indigo-700 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {language === 'ar' ? 'مركز البحث الشامل والموحد' : 'Unified Global Search Center'}
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              {language === 'ar'
                ? 'ابحث فورياً في سجلات الطلاب، الكوادر التعليمية، الفصول، الجداول المدرسية، والفواتير المالية.'
                : 'Instant real-time search across student rosters, faculty, curriculum, timetables, and billing.'}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="primary" size="sm" className="bg-white/20 text-white border-white/30 backdrop-blur-xs">
              <Clock className="w-3 h-3 ml-1" />
              {searchResponse.executionTimeMs} ms
            </Badge>
          </div>
        </div>

        {/* Big Search Bar Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute start-4 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              language === 'ar'
                ? 'اكتب اسم طالب، رقم أكاديمي، معلم، فصل دراسي، مادة، أو رقم فاتورة...'
                : 'Search by student name, ID, teacher, class, subject, or invoice number...'
            }
            className="w-full h-12 ps-12 pe-12 bg-white text-slate-900 rounded-2xl shadow-inner text-sm sm:text-base font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-4 focus:ring-blue-300 transition-all"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute end-3.5 top-3 p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1 text-blue-100">
          <span className="font-semibold">{language === 'ar' ? 'عمليات بحث مقترحة:' : 'Quick Searches:'}</span>
          {quickSuggestions.map((sug) => (
            <button
              key={sug}
              onClick={() => setQuery(sug)}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Domain Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {authorizedDomains.map((d) => {
            const Icon = d.icon;
            const isSelected = selectedDomain === d.id;
            const count = searchResponse.countsByDomain[d.id] || 0;

            return (
              <button
                key={d.id}
                onClick={() => setSelectedDomain(d.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'ar' ? d.labelAr : d.labelEn}</span>
                {query.trim().length > 0 && count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Branch Context Dropdown (Only if user has access to multiple branches) */}
        {(isSuperAdmin || (currentUser?.branchIds && currentUser.branchIds.length > 1) || isAllBranches) && (
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="all">{t('branch.all')}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {language === 'ar' ? b.nameAr : b.nameEn}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Results View */}
      {query.trim().length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {language === 'ar' ? 'ابدأ البحث بكتابة استفسارك أعلاه' : 'Start searching by typing a query above'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'البحث الشامل آمن ومحمي بالصلاحيات وعزل الفروع. لن تظهر أية بيانات غير مصرح بها لحسابك.'
                : 'Global search enforces branch isolation and role permissions. Unauthorized domain records remain hidden.'}
            </p>
          </div>
        </Card>
      ) : searchResponse.results.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <X className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {language === 'ar' ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching records found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'ar'
                ? `لم يتم العثور على أي نتائج لكلمة "${query}" في نطاق الفرع أو الصلاحيات المصرح بها.`
                : `No records matched "${query}" in the authorized campus scope.`}
            </p>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                {language === 'ar' ? 'مسح البحث' : 'Clear Search'}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              {language === 'ar'
                ? `تم العثور على ${searchResponse.totalCount} نتيجة لـ "${query}"`
                : `Found ${searchResponse.totalCount} results for "${query}"`}
            </span>
            <span className="font-mono text-[11px]">{searchResponse.executionTimeMs} ms</span>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchResponse.results.map((item: SearchResultItem) => {
              const ItemIcon = getDomainIcon(item.domain);

              return (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab(item.targetTab)}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm transition-all cursor-pointer flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center shrink-0 transition-colors">
                      <ItemIcon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h4>
                        {item.badge && (
                          <Badge variant={item.badge.variant || 'neutral'} size="sm">
                            {item.badge.text}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {item.subtitle}
                      </p>

                      {item.meta && (
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{item.meta}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors">
                    <ArrowIcon className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
