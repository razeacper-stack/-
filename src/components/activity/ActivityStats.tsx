import React from 'react';
import { History, ShieldAlert, Sparkles, CreditCard, AlertTriangle, Users, Calendar } from 'lucide-react';
import { ActivityStats as ActivityStatsType } from '../../types/activity';
import { useTranslation } from '../../context/LanguageContext';

export interface ActivityStatsProps {
  stats: ActivityStatsType;
}

export const ActivityStats: React.FC<ActivityStatsProps> = ({ stats }) => {
  const { language } = useTranslation();

  const cards = [
    {
      titleAr: 'إجمالي العمليات',
      titleEn: 'Total Logged Events',
      value: stats.totalEvents,
      icon: History,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-100 dark:border-blue-900/60',
    },
    {
      titleAr: 'عمليات اليوم',
      titleEn: 'Today Events',
      value: stats.todayCount,
      icon: Calendar,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-100 dark:border-indigo-900/60',
    },
    {
      titleAr: 'سجلات الأمان والحجب',
      titleEn: 'Security Incidents',
      value: stats.securityEventsCount,
      icon: ShieldAlert,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-100 dark:border-rose-900/60',
    },
    {
      titleAr: 'نشاط المساعد الذكي',
      titleEn: 'AI Operations',
      value: stats.aiEventsCount,
      icon: Sparkles,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      border: 'border-purple-100 dark:border-purple-900/60',
    },
    {
      titleAr: 'العمليات المالية',
      titleEn: 'Financial Activity',
      value: stats.financialEventsCount,
      icon: CreditCard,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-100 dark:border-emerald-900/60',
    },
    {
      titleAr: 'محاولات مرفوضة / فشل',
      titleEn: 'Failed / Denied',
      value: stats.failedOrDeniedCount,
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-100 dark:border-amber-900/60',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-3 rounded-2xl border ${c.border} ${c.bg} backdrop-blur-xs transition-all`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                {language === 'ar' ? c.titleAr : c.titleEn}
              </span>
              <Icon className={`w-4 h-4 ${c.color} shrink-0`} />
            </div>
            <div className={`text-xl font-black mt-1.5 ${c.color}`}>
              {c.value.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
            </div>
          </div>
        );
      })}
    </div>
  );
};
