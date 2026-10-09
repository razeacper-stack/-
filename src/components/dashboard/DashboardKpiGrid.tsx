import React from 'react';
import {
  Users,
  UserCheck,
  School,
  ClipboardCheck,
  CalendarDays,
  CreditCard,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { DashboardKpis } from '../../types/dashboard';
import { KpiCard } from './KpiCard';
import { formatCurrency } from '../../utils/currency';

export interface DashboardKpiGridProps {
  kpis: DashboardKpis;
  canViewFinance: boolean;
  onNavigateTab: (tabId: string) => void;
}

export const DashboardKpiGrid: React.FC<DashboardKpiGridProps> = ({
  kpis,
  canViewFinance,
  onNavigateTab,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Students */}
      <KpiCard
        title="إجمالي الطلاب المسجلين"
        value={kpis.totalStudents}
        subtitle={`${kpis.activeStudents} طالب منتظم وفعال`}
        icon={Users}
        iconColor="text-blue-600 dark:text-blue-400"
        iconBg="bg-blue-50 dark:bg-blue-950/60"
        badge={{
          text: `${Math.round((kpis.activeStudents / (kpis.totalStudents || 1)) * 100)}% انتظام`,
          variant: 'primary',
        }}
        onClick={() => onNavigateTab('students')}
      />

      {/* 2. Teachers */}
      <KpiCard
        title="الكادر التعليمي والمعلمون"
        value={kpis.totalTeachers}
        subtitle={`${kpis.activeTeachers} معلم بحالة نشطة`}
        icon={UserCheck}
        iconColor="text-indigo-600 dark:text-indigo-400"
        iconBg="bg-indigo-50 dark:bg-indigo-950/60"
        badge={{
          text: `${kpis.activeTeachers} على رأس العمل`,
          variant: 'success',
        }}
        onClick={() => onNavigateTab('teachers')}
      />

      {/* 3. Today's Attendance Rate */}
      <KpiCard
        title="نسبة حضور اليوم"
        value={kpis.attendanceRate !== null ? `${kpis.attendanceRate}%` : 'لا بيانات'}
        subtitle={
          kpis.attendanceRate !== null
            ? `حضور: ${kpis.todayPresentCount} | غياب: ${kpis.todayAbsentCount} | تأخر: ${kpis.todayLateCount}`
            : 'لم يتم رصد حضور لهذا التاريخ'
        }
        icon={ClipboardCheck}
        iconColor="text-emerald-600 dark:text-emerald-400"
        iconBg="bg-emerald-50 dark:bg-emerald-950/60"
        badge={{
          text:
            kpis.attendanceRate !== null
              ? kpis.attendanceRate >= 90
                ? 'ممتاز'
                : kpis.attendanceRate >= 75
                ? 'جيد'
                : 'منخفض'
              : 'معلق',
          variant:
            kpis.attendanceRate !== null
              ? kpis.attendanceRate >= 90
                ? 'success'
                : kpis.attendanceRate >= 75
                ? 'info'
                : 'danger'
              : 'neutral',
        }}
        onClick={() => onNavigateTab('attendance')}
      />

      {/* 4. Today's Lessons / Classes */}
      <KpiCard
        title="حصص اليوم المجدولة"
        value={kpis.todayLessonsCount}
        subtitle={`${kpis.totalClasses} فصلاً دراسياً نشطاً`}
        icon={CalendarDays}
        iconColor="text-purple-600 dark:text-purple-400"
        iconBg="bg-purple-50 dark:bg-purple-950/60"
        badge={{
          text: `${kpis.totalClasses} فصل`,
          variant: 'info',
        }}
        onClick={() => onNavigateTab('timetable')}
      />

      {/* Optional Financial KPIs (Only if permitted) */}
      {canViewFinance && kpis.outstandingFeesMinor !== null && (
        <>
          {/* 5. Outstanding Fees */}
          <KpiCard
            title="إجمالي الرسوم المتبقية (المستحقات)"
            value={formatCurrency(kpis.outstandingFeesMinor)}
            subtitle="الرصيد المتبقي على الفواتير الصادرة"
            icon={AlertCircle}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-50 dark:bg-amber-950/60"
            badge={{
              text: 'ذمم مدينة',
              variant: 'warning',
            }}
            onClick={() => onNavigateTab('fees')}
          />

          {/* 6. Today's Collections */}
          <KpiCard
            title="مقبوضات وتحصيلات اليوم"
            value={formatCurrency(kpis.todayCollectionsMinor || 0)}
            subtitle={`إجمالي التحصيل التراكمي: ${formatCurrency(kpis.totalCollectedMinor || 0)}`}
            icon={CreditCard}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-50 dark:bg-emerald-950/60"
            badge={{
              text: 'سندات قبض',
              variant: 'success',
            }}
            onClick={() => onNavigateTab('fees')}
          />
        </>
      )}
    </div>
  );
};
