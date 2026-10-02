import React from 'react';
import {
  UserPlus,
  CreditCard,
  ClipboardCheck,
  Clock,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export interface RecentActivityProps {
  onViewAll?: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ onViewAll }) => {
  const { direction, t } = useTranslation();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  const activities = [
    {
      id: 'act-1',
      title: t('dashboard.recent.student_registered'),
      module: 'students',
      time: '09:20 AM',
      date: 'اليوم / Today',
      icon: UserPlus,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950/60',
      badge: 'تسجيل جديد',
      badgeVariant: 'primary' as const,
    },
    {
      id: 'act-2',
      title: t('dashboard.recent.fee_collected'),
      module: 'fees',
      time: '08:45 AM',
      date: 'اليوم / Today',
      icon: CreditCard,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      badge: 'سند قبض',
      badgeVariant: 'success' as const,
    },
    {
      id: 'act-3',
      title: t('dashboard.recent.attendance_completed'),
      module: 'attendance',
      time: '08:15 AM',
      date: 'اليوم / Today',
      icon: ClipboardCheck,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60',
      badge: 'حضور يومي',
      badgeVariant: 'warning' as const,
    },
    {
      id: 'act-4',
      title: t('dashboard.recent.temporary_teacher_logged'),
      module: 'teachers',
      time: 'أمس 01:30 PM',
      date: 'الأمس / Yesterday',
      icon: Clock,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-50 dark:bg-purple-950/60',
      badge: 'معلم حصة',
      badgeVariant: 'info' as const,
    },
  ];

  return (
    <Card
      title={t('dashboard.recent.title')}
      subtitle="سجل فوري للعمليات التعليمية والمالية والإدارية"
      action={
        <button
          onClick={onViewAll}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{t('dashboard.recent.view_all_audit')}</span>
          <ArrowIcon className="w-3.5 h-3.5" />
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm text-start">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
              <th className="pb-3 text-start">{t('common.actions')}</th>
              <th className="pb-3 text-start">{t('common.status')}</th>
              <th className="pb-3 text-end">{t('common.date')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {activities.map((act) => {
              const Icon = act.icon;
              return (
                <tr
                  key={act.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3.5 pe-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${act.iconBg} ${act.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {act.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pe-4">
                    <Badge variant={act.badgeVariant} size="sm">
                      {act.badge}
                    </Badge>
                  </td>
                  <td className="py-3.5 text-end text-slate-400 dark:text-slate-500 font-mono text-xs tabular-nums whitespace-nowrap">
                    {act.time}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
