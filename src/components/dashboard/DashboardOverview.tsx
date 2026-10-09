import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  ClipboardCheck,
  CalendarDays,
  CreditCard,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RotateCw,
  Printer,
  ShieldCheck,
  Activity,
  DollarSign,
  TrendingUp,
  School,
  BookOpen,
  Plus,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { dashboardStorage } from '../../services/dashboardStorage';
import { academicStorage } from '../../services/academicStorage';
import { DashboardOverviewData } from '../../types/dashboard';
import { DashboardFilters } from './DashboardFilters';
import { DashboardAlerts } from './DashboardAlerts';
import { DashboardKpiGrid } from './DashboardKpiGrid';
import { StudentOverview } from './StudentOverview';
import { TeacherOverview } from './TeacherOverview';
import { AttendanceOverview } from './AttendanceOverview';
import { TimetableOverview } from './TimetableOverview';
import { FinanceOverview } from './FinanceOverview';
import { BranchOverview } from './BranchOverview';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import { Phase10VerificationModal } from './Phase10VerificationModal';
import { StatCardSkeleton, Skeleton } from '../common/Skeleton';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface DashboardOverviewProps {
  onOpenTestModal?: () => void;
  isSkeletonLoading?: boolean;
  onToggleSkeleton?: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigateTab,
}) => {
  const { language, direction, t } = useTranslation();
  const { activeBranchId, setActiveBranchId, branches, isAllBranches } = useBranch();
  const { currentUser, isSuperAdmin, hasPermission } = useAuth();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  // Modals & States
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSectionTab, setActiveSectionTab] = useState<
    'overview' | 'students' | 'teachers' | 'attendance' | 'timetable' | 'finance' | 'branches'
  >('overview');

  // Academic Years for filter
  const academicYears = useMemo(() => {
    try {
      return academicStorage.getRawYears();
    } catch {
      return [];
    }
  }, []);

  const defaultYearId = useMemo(() => {
    const active = academicYears.find((y) => y.isCurrent) || academicYears[0];
    return active?.id || '';
  }, [academicYears]);

  // Filter States
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    if (isAllBranches) return 'all';
    return activeBranchId || 'all';
  });
  const [selectedYearId, setSelectedYearId] = useState<string>(defaultYearId);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Sync with global branch context changes
  useEffect(() => {
    if (isAllBranches) {
      setSelectedBranchId('all');
    } else if (activeBranchId) {
      setSelectedBranchId(activeBranchId);
    }
  }, [activeBranchId, isAllBranches]);

  // Update selected year if default becomes available
  useEffect(() => {
    if (!selectedYearId && defaultYearId) {
      setSelectedYearId(defaultYearId);
    }
  }, [defaultYearId, selectedYearId]);

  // Can view cross branch
  const canViewCrossBranch = useMemo(() => {
    if (!currentUser) return false;
    return isSuperAdmin || currentUser.hasAllBranchesAccess === true || hasPermission('dashboard.view_cross_branch');
  }, [currentUser, isSuperAdmin, hasPermission]);

  // Load Dashboard Data from Real Services
  const [dashboardData, setDashboardData] = useState<DashboardOverviewData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(() => {
    if (!currentUser) return;
    try {
      setLoadError(null);
      const data = dashboardStorage.getDashboardOverview(currentUser, {
        branchId: selectedBranchId,
        academicYearId: selectedYearId,
        date: selectedDate,
      });
      setDashboardData(data);
    } catch (err: any) {
      setLoadError(err.message || 'حدث خطأ أثناء تحميل بيانات لوحة التحكم');
    }
  }, [currentUser, selectedBranchId, selectedYearId, selectedDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handleBranchFilterChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId);
    if (newBranchId !== 'all') {
      setActiveBranchId(newBranchId);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!dashboardData && !loadError) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-red-900 dark:text-red-200">
          تعذر تحميل بيانات لوحة التحكم
        </h3>
        <p className="text-xs text-red-700 dark:text-red-300 max-w-md mx-auto">
          {loadError}
        </p>
        <Button variant="outline" size="sm" onClick={fetchDashboardData}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const data = dashboardData!;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Top Welcome & Operational Command Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 dark:from-blue-950 dark:via-indigo-950 dark:to-slate-900 text-white p-6 sm:p-7 shadow-sm border border-blue-600/30">
        {/* Subtle decorative glow */}
        <div className="absolute -end-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute start-1/3 -top-12 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>لوحة التحكم الشاملة (Phase 10)</span>
              </span>
              <span className="text-xs text-blue-100 font-medium px-2 py-0.5 rounded-md bg-blue-900/50 border border-blue-400/30">
                {data.branchNameAr}
              </span>
              <span className="text-xs text-blue-100 font-medium px-2 py-0.5 rounded-md bg-indigo-900/50 border border-indigo-400/30">
                {data.academicYearNameAr}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              مركز العمليات والمؤشرات التشغيلية للمدرسة
            </h2>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              استعراض فوري وشامل لبيانات الطلاب، الكادر التعليمي، نسب الحضور، جداول الحصص، والمؤشرات المالية الحية بدون بيانات تجريبية.
            </p>
          </div>

          {/* Quick Action Buttons on Hero */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>فحص واختبار المرحلة 10</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
              title="تحديث البيانات"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>
      </div>

      {/* Zero Branches Onboarding Alert */}
      {branches.length === 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'أهلاً بك! لا توجد مدارس مسجلة في النظام بعد' : 'Welcome! No schools registered yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'النظام مهيأ وجاهز لتسجيل بياناتك من الصفر. ابدأ الآن بتسجيل مدرستك الأولى لإدخال الكوادر والجداول والطلاب.'
                  : 'Start now by registering your first school to add staff, timetables, and students.'}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => onNavigateTab('branches')}
            className="shrink-0"
          >
            {language === 'ar' ? 'تسجيل مدرسة جديدة الآن' : 'Register New School Now'}
          </Button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="print:hidden">
        <DashboardFilters
          branches={branches}
          academicYears={academicYears}
          selectedBranchId={selectedBranchId}
          onBranchChange={handleBranchFilterChange}
          selectedYearId={selectedYearId}
          onYearChange={setSelectedYearId}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          canViewCrossBranch={canViewCrossBranch}
          onRefresh={handleRefresh}
          onPrint={handlePrint}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* Operational Alerts & Indicators */}
      {data.alerts && data.alerts.length > 0 && (
        <DashboardAlerts
          alerts={data.alerts}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* Top Real KPI Cards Grid */}
      <DashboardKpiGrid
        kpis={data.kpis}
        canViewFinance={data.canViewFinance}
        onNavigateTab={onNavigateTab}
      />

      {/* Section Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 print:hidden">
        {[
          { id: 'overview', label: 'نظرة عامة شاملة', icon: School },
          { id: 'students', label: 'شؤون الطلاب', icon: Users },
          { id: 'teachers', label: 'الكادر التعليمي', icon: GraduationCap },
          { id: 'attendance', label: 'سجلات الحضور', icon: ClipboardCheck },
          { id: 'timetable', label: 'جدول اليوم', icon: CalendarDays },
          ...(data.canViewFinance ? [{ id: 'finance', label: 'الإدارة المالية', icon: CreditCard }] : []),
          ...(data.canViewCrossBranch ? [{ id: 'branches', label: 'مقارنة الفروع', icon: Building2 }] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSectionTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSectionTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Views */}
      {activeSectionTab === 'overview' && (
        <div className="space-y-6">
          {/* Row 1: Students & Attendance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StudentOverview data={data.students} onNavigateTab={onNavigateTab} />
            <AttendanceOverview data={data.attendance} onNavigateTab={onNavigateTab} />
          </div>

          {/* Row 2: Today's Timetable & Teacher Faculty */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TimetableOverview data={data.timetable} onNavigateTab={onNavigateTab} />
            <TeacherOverview data={data.teachers} onNavigateTab={onNavigateTab} />
          </div>

          {/* Row 3: Financial Overview (If Authorized) */}
          {data.canViewFinance && data.finance && (
            <FinanceOverview data={data.finance} onNavigateTab={onNavigateTab} />
          )}

          {/* Row 4: Multi-Branch Comparison (If Cross Branch View) */}
          {data.canViewCrossBranch && data.branches && data.branches.length > 1 && (
            <BranchOverview
              branches={data.branches}
              selectedBranchId={selectedBranchId}
              onSelectBranch={handleBranchFilterChange}
              canViewFinance={data.canViewFinance}
            />
          )}

          {/* Row 5: Recent Audit Activities & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentActivity
                activities={data.recentActivity || []}
                onViewAll={() => setIsTestModalOpen(true)}
              />
            </div>
            <div className="lg:col-span-1">
              <QuickActions onActionClick={(tabId) => onNavigateTab(tabId)} />
            </div>
          </div>
        </div>
      )}

      {activeSectionTab === 'students' && (
        <StudentOverview data={data.students} onNavigateTab={onNavigateTab} />
      )}

      {activeSectionTab === 'teachers' && (
        <TeacherOverview data={data.teachers} onNavigateTab={onNavigateTab} />
      )}

      {activeSectionTab === 'attendance' && (
        <AttendanceOverview data={data.attendance} onNavigateTab={onNavigateTab} />
      )}

      {activeSectionTab === 'timetable' && (
        <TimetableOverview data={data.timetable} onNavigateTab={onNavigateTab} />
      )}

      {activeSectionTab === 'finance' && data.canViewFinance && (
        <FinanceOverview data={data.finance} onNavigateTab={onNavigateTab} />
      )}

      {activeSectionTab === 'branches' && data.canViewCrossBranch && (
        <BranchOverview
          branches={data.branches}
          selectedBranchId={selectedBranchId}
          onSelectBranch={handleBranchFilterChange}
          canViewFinance={data.canViewFinance}
        />
      )}

      {/* Phase 10 Verification Modal */}
      <Phase10VerificationModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
};
