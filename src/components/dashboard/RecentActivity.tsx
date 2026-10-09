import React from 'react';
import {
  UserPlus,
  CreditCard,
  ClipboardCheck,
  CalendarDays,
  Clock,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Activity,
  Layers,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { DashboardActivityItem } from '../../types/dashboard';
import { useTranslation } from '../../context/LanguageContext';

export interface RecentActivityProps {
  activities: DashboardActivityItem[];
  onViewAll?: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  onViewAll,
}) => {
  const { direction, t } = useTranslation();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  const getActivityIcon = (type: DashboardActivityItem['type']) => {
    switch (type) {
      case 'student':
        return {
          icon: UserPlus,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/60',
        };
      case 'teacher':
        return {
          icon: Clock,
          color: 'text-purple-600 dark:text-purple-400',
          bg: 'bg-purple-50 dark:bg-purple-950/60',
        };
      case 'attendance':
        return {
          icon: ClipboardCheck,
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        };
      case 'finance':
        return {
          icon: CreditCard,
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/60',
        };
      case 'timetable':
        return {
          icon: CalendarDays,
          color: 'text-indigo-600 dark:text-indigo-400',
          bg: 'bg-indigo-50 dark:bg-indigo-950/60',
        };
      case 'academic':
        return {
          icon: Layers,
          color: 'text-sky-600 dark:text-sky-400',
          bg: 'bg-sky-50 dark:bg-sky-950/60',
        };
      case 'system':
      default:
        return {
          icon: ShieldAlert,
          color: 'text-slate-600 dark:text-slate-400',
          bg: 'bg-slate-50 dark:bg-slate-800',
        };
    }
  };

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-bold text-slate-900 dark:text-slate-100">
            سجل العمليات والنشاطات الأخيرة
          </span>
        </div>
      }
      subtitle="سجل فوري وموثق لكافة العمليات التعليمية والإدارية والمالية المنفذة"
      action={
        onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>عرض السجل الكامل</span>
            <ArrowIcon className="w-3.5 h-3.5" />
          </button>
        )
      }
    >
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            لا توجد نشاطات مسجلة في سجل النظام حتى الآن
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {activities.map((item) => {
              const { icon: Icon, color, bg } = getActivityIcon(item.type);
              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-2 rounded-xl shrink-0 ${bg} ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {item.actorName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ({item.action})
                        </span>
                        {item.targetIdentifier && (
                          <Badge variant="neutral" size="sm" className="text-[10px] py-0 px-1 font-mono">
                            {item.targetIdentifier}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                        {item.details}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                        <span>{item.branchNameAr}</span>
                        <span>&bull;</span>
                        <span>{item.timeAgo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 self-start">
                    <Badge
                      variant={
                        item.result === 'SUCCESS'
                          ? 'success'
                          : item.result === 'DENIED'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {item.result === 'SUCCESS' ? 'ناجح' : item.result === 'DENIED' ? 'مرفوض' : 'معلق'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};
