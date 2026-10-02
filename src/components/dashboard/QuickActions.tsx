import React from 'react';
import {
  UserPlus,
  ClipboardCheck,
  CreditCard,
  CalendarDays,
  Bot,
  ArrowUpRight,
  GraduationCap,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { Card } from '../common/Card';

export interface QuickActionsProps {
  onActionClick: (actionId: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  const { t } = useTranslation();

  const actions = [
    {
      id: 'academic',
      label: 'الهيكل الأكاديمي والسنوات',
      icon: GraduationCap,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      phase: 4,
    },
    {
      id: 'students',
      label: 'شؤون الطلاب وقيد الفصول',
      icon: UserPlus,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      phase: 5,
    },
    {
      id: 'attendance',
      label: t('dashboard.action.record_attendance'),
      icon: ClipboardCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      phase: 8,
    },
    {
      id: 'add_payment',
      label: t('dashboard.action.add_payment'),
      icon: CreditCard,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      phase: 9,
    },
    {
      id: 'timetable',
      label: t('dashboard.action.manage_timetable'),
      icon: CalendarDays,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/60',
      phase: 7,
    },
    {
      id: 'ai_consult',
      label: t('dashboard.action.ai_consult'),
      icon: Bot,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      phase: 12,
    },
  ];

  return (
    <Card
      title={t('dashboard.quick_actions.title')}
      subtitle={t('app.tagline')}
      className="h-full"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={() => onActionClick(act.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-start cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${act.bg} ${act.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {act.label}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    Phase {act.phase}
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          );
        })}
      </div>
    </Card>
  );
};
