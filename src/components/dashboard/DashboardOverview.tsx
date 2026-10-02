import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  ClipboardCheck,
  CreditCard,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useBranch } from '../../context/BranchContext';
import { StatCard } from './StatCard';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { StatCardSkeleton, TableRowSkeleton, Skeleton } from '../common/Skeleton';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface DashboardOverviewProps {
  onOpenTestModal: () => void;
  isSkeletonLoading: boolean;
  onToggleSkeleton: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onOpenTestModal,
  isSkeletonLoading,
  onToggleSkeleton,
  onNavigateTab,
}) => {
  const { language, direction, t } = useTranslation();
  const { activeBranch, isAllBranches, branches } = useBranch();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  // Calculate dynamic stats based on selected branch
  const totalStudents = isAllBranches
    ? branches.reduce((acc, b) => acc + (b.studentCount || 0), 0)
    : activeBranch?.studentCount || 0;

  const totalTeachers = isAllBranches
    ? branches.reduce((acc, b) => acc + (b.teacherCount || 0), 0)
    : activeBranch?.teacherCount || 0;

  const activeBranchesCount = isAllBranches ? branches.length : 1;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Phase 1 Foundation Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-900/90 dark:to-indigo-950/90 text-white p-6 sm:p-8 shadow-sm">
        {/* Subtle decorative background pattern */}
        <div className="absolute -end-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute start-1/2 -top-12 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('phase1.badge')}</span>
              </span>
              <span className="text-xs text-blue-100 font-medium">
                {isAllBranches
                  ? t('branch.all')
                  : language === 'ar'
                  ? activeBranch?.nameAr
                  : activeBranch?.nameEn}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('dashboard.title')}
            </h2>

            <p className="text-sm text-blue-100/90 leading-relaxed">
              {t('phase1.status_desc')}
            </p>
          </div>

          {/* Quick Action Buttons on Hero */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenTestModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t('phase1.test_button')}</span>
            </button>

            <button
              onClick={onToggleSkeleton}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer border ${
                isSkeletonLoading
                  ? 'bg-amber-500 text-white border-amber-400'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{isSkeletonLoading ? 'إلغاء Skeleton' : t('phase1.skeleton_toggle')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI / Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isSkeletonLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title={t('dashboard.stats.total_students')}
              value={totalStudents.toLocaleString()}
              trend={t('dashboard.stats.trend_up')}
              trendType="positive"
              icon={Users}
              iconBg="bg-blue-50 dark:bg-blue-950/60"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <StatCard
              title={t('dashboard.stats.total_teachers')}
              value={totalTeachers.toLocaleString()}
              subtitle="دائمون ومؤقتون"
              trend="+12 هذا الفصل"
              trendType="positive"
              icon={GraduationCap}
              iconBg="bg-indigo-50 dark:bg-indigo-950/60"
              iconColor="text-indigo-600 dark:text-indigo-400"
            />
            <StatCard
              title={t('dashboard.stats.active_branches')}
              value={activeBranchesCount}
              subtitle={isAllBranches ? '5 فروع مجهزة' : activeBranch?.city}
              trend="جاهزية تشغيلية 100%"
              trendType="positive"
              icon={Building2}
              iconBg="bg-emerald-50 dark:bg-emerald-950/60"
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              title={t('dashboard.stats.today_attendance')}
              value="96.4%"
              trend={t('dashboard.stats.trend_attendance')}
              trendType="positive"
              icon={ClipboardCheck}
              iconBg="bg-amber-50 dark:bg-amber-950/60"
              iconColor="text-amber-600 dark:text-amber-400"
            />
          </>
        )}
      </div>

      {/* Main Grid: Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Recent Activities Table */}
        <div className="lg:col-span-2">
          {isSkeletonLoading ? (
            <Card title="جارٍ تحميل سجل النشاطات...">
              <div className="space-y-3">
                <Skeleton variant="text" width="90%" height={20} />
                <Skeleton variant="text" width="70%" height={20} />
                <Skeleton variant="text" width="85%" height={20} />
                <Skeleton variant="text" width="60%" height={20} />
              </div>
            </Card>
          ) : (
            <RecentActivity onViewAll={onOpenTestModal} />
          )}
        </div>

        {/* Right 1 col: Quick Actions */}
        <div className="lg:col-span-1">
          {isSkeletonLoading ? (
            <Card title="جارٍ تحميل الروابط السريعة...">
              <div className="space-y-3">
                <Skeleton variant="rectangular" height={50} />
                <Skeleton variant="rectangular" height={50} />
                <Skeleton variant="rectangular" height={50} />
              </div>
            </Card>
          ) : (
            <QuickActions onActionClick={(actionId) => onNavigateTab(actionId)} />
          )}
        </div>
      </div>

      {/* Project Implementation Roadmap Progress */}
      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              خارطة مراحل التطوير المتتابعة (15 مرحلة)
            </span>
            <Badge variant="primary" size="sm">
              PHASE 8 ACTIVE
            </Badge>
          </div>
        }
        subtitle="نظام بناء مرحلي صارم مع فحص واختبار كامل لكل مرحلة قبل بدء المرحلة التالية"
      >
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                المرحلة 8 (إدارة الحضور والغياب اليومي وحصص الجدول - Attendance & Absence)
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Phase 8 Active
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(8 / 15) * 100}%` }}
              />
            </div>
          </div>

          {/* Phase cards carousel/grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-2">
            {[
              { num: 1, title: 'Foundation & UI', status: 'completed', desc: 'البنية والتصميم' },
              { num: 2, title: 'Auth & RBAC', status: 'completed', desc: 'المستخدمون والصلاحيات' },
              { num: 3, title: 'Multi-Branch', status: 'completed', desc: 'إدارة الفروع' },
              { num: 4, title: 'Academic', status: 'completed', desc: 'الهيكل والمراحل' },
              { num: 5, title: 'Students', status: 'completed', desc: 'إدارة الطلاب' },
              { num: 6, title: 'Teachers', status: 'completed', desc: 'المعلمون الدائم/المؤقت' },
              { num: 7, title: 'Timetable', status: 'completed', desc: 'الحصص والجداول' },
              { num: 8, title: 'Attendance', status: 'next', desc: 'الحضور والغياب' },
              { num: 9, title: 'Fees', status: 'pending', desc: 'الرسوم والمستحقات' },
              { num: 10, title: 'Dashboard', status: 'pending', desc: 'الإحصائيات والتحليلات' },
              { num: 11, title: 'Reports', status: 'pending', desc: 'التقارير والطباعة' },
              { num: 12, title: 'AI Assistant', status: 'pending', desc: 'المساعد الذكي' },
              { num: 13, title: 'Audit Logs', status: 'pending', desc: 'سجل العمليات' },
              { num: 14, title: 'Security', status: 'pending', desc: 'الأمان والأداء' },
              { num: 15, title: 'Production', status: 'pending', desc: 'الإنتاج والجاهزية' },
            ].map((p) => (
              <div
                key={p.num}
                className={`p-3 rounded-xl border text-start transition-all ${
                  p.status === 'completed'
                    ? 'border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : p.status === 'next'
                    ? 'border-blue-400 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                    : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    P{p.num}
                  </span>
                  {p.status === 'completed' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {p.status === 'next' && (
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                      التالية
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {p.desc}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {p.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
