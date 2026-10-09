import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldAlert,
  Sparkles,
  CreditCard,
  Building,
  Users,
  Download,
  Printer,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  FileText,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { useTranslation } from '../../context/LanguageContext';
import { activityStorage } from '../../services/activityStorage';
import {
  ActivityEvent,
  ActivityFilterParams,
  ActivityQueryResult,
  AuditCategory,
} from '../../types/activity';
import { ActivityStats } from './ActivityStats';
import { ActivityFilters } from './ActivityFilters';
import { ActivityTimeline } from './ActivityTimeline';
import { ActivityDetailsModal } from './ActivityDetailsModal';
import { Phase13VerificationModal } from './Phase13VerificationModal';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export type ActivityTab =
  | 'ALL'
  | 'SECURITY'
  | 'AI'
  | 'USERS'
  | 'BRANCHES'
  | 'FINANCE'
  | 'SYSTEM';

export const ActivityCenter: React.FC = () => {
  const { currentUser: user } = useAuth();
  const { activeBranchId } = useBranch();
  const { language } = useTranslation();

  const [activeTab, setActiveTab] = useState<ActivityTab>('ALL');
  const [filters, setFilters] = useState<ActivityFilterParams>({
    branchId: activeBranchId === 'all' ? undefined : activeBranchId,
    page: 1,
    pageSize: 30,
    datePreset: 'all',
  });

  const [queryResult, setQueryResult] = useState<ActivityQueryResult | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync active branch if changed externally
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      branchId: activeBranchId === 'all' ? undefined : activeBranchId,
      page: 1,
    }));
  }, [activeBranchId]);

  const loadData = () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Apply tab overrides
      const effectiveFilters: ActivityFilterParams = { ...filters };
      if (activeTab === 'SECURITY') {
        effectiveFilters.category = 'SECURITY';
      } else if (activeTab === 'AI') {
        effectiveFilters.category = 'AI';
      } else if (activeTab === 'FINANCE') {
        effectiveFilters.category = 'FINANCE';
      } else if (activeTab === 'SYSTEM') {
        effectiveFilters.category = 'SYSTEM';
      } else if (activeTab === 'USERS') {
        effectiveFilters.category = 'USER_MANAGEMENT';
      } else if (activeTab === 'BRANCHES') {
        effectiveFilters.category = 'BRANCH';
      } else {
        effectiveFilters.category = filters.category;
      }

      const res = activityStorage.queryActivity(user, effectiveFilters);
      setQueryResult(res);
    } catch (e) {
      console.error('Failed to load activity data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, activeTab, filters]);

  const handleExportCsv = () => {
    if (!user) return;
    try {
      const csv = activityStorage.exportToCsv(user, filters);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity_audit_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'تعذر التصدير');
    }
  };

  const handleResetFilters = () => {
    setFilters({
      branchId: activeBranchId === 'all' ? undefined : activeBranchId,
      page: 1,
      pageSize: 30,
      datePreset: 'all',
      search: '',
      category: 'ALL',
      severity: 'ALL',
      result: 'ALL',
    });
  };

  const tabs = [
    { id: 'ALL', labelAr: 'كافة النشاطات', labelEn: 'All Activity', icon: History },
    { id: 'SECURITY', labelAr: 'الأمان والمحاولات المحجوبة', labelEn: 'Security Events', icon: ShieldAlert },
    { id: 'AI', labelAr: 'نشاط المساعد الذكي', labelEn: 'AI Operations', icon: Sparkles },
    { id: 'USERS', labelAr: 'نشاط المستخدمين', labelEn: 'User Activity', icon: Users },
    { id: 'BRANCHES', labelAr: 'نشاط الفروع', labelEn: 'Branch Activity', icon: Building },
    { id: 'FINANCE', labelAr: 'النشاط المالي', labelEn: 'Financial Activity', icon: CreditCard },
    { id: 'SYSTEM', labelAr: 'نشاط النظام', labelEn: 'System Activity', icon: SlidersHorizontal },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {language === 'ar' ? 'مركز النشاط وسجل العمليات (Audit & Activity Center)' : 'Audit & Activity Center'}
            </h1>
            <Badge variant="primary" size="sm">
              Phase 13 Immutable
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {language === 'ar'
              ? 'سجل مركزي غير قابل للتعديل يوثق كافة العمليات التشغيلية، ومحاولات الأمان، ونشاط الذكاء الاصطناعي مع عزل الفروع.'
              : 'Tamper-evident centralized audit trail tracking operations, security enforcement, AI events and multi-branch activity.'}
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVerificationModalOpen(true)}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
          >
            {language === 'ar' ? 'فحص المرحلة 13' : 'Phase 13 Tests'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            {language === 'ar' ? 'تحديث السجل' : 'Refresh'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            {language === 'ar' ? 'طباعة' : 'Print'}
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      {queryResult && <ActivityStats stats={queryResult.stats} />}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as ActivityTab);
                setFilters((prev) => ({ ...prev, page: 1 }));
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl font-bold transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                isSelected
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{language === 'ar' ? t.labelAr : t.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <ActivityFilters
        filters={filters}
        onChangeFilters={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
        onResetFilters={handleResetFilters}
      />

      {/* Activity Timeline List */}
      <div className="space-y-4">
        {queryResult && (
          <ActivityTimeline
            events={queryResult.events}
            onSelectEvent={(ev) => {
              setSelectedEvent(ev);
              setIsDetailsOpen(true);
            }}
          />
        )}

        {/* Pagination Bar */}
        {queryResult && queryResult.totalCount > queryResult.pageSize && (
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              عرض {(queryResult.page - 1) * queryResult.pageSize + 1} إلى{' '}
              {Math.min(queryResult.page * queryResult.pageSize, queryResult.totalCount)} من أصل{' '}
              {queryResult.totalCount} عملية مسجلة
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={queryResult.page <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
              >
                {language === 'ar' ? 'السابق' : 'Previous'}
              </Button>
              <span className="font-bold text-slate-700 dark:text-slate-200 px-2">
                صفحة {queryResult.page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!queryResult.hasMore}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
              >
                {language === 'ar' ? 'التالي' : 'Next'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Details Deep-dive Modal */}
      <ActivityDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        event={selectedEvent}
      />

      {/* Verification Automated Runner Modal */}
      <Phase13VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />
    </div>
  );
};
