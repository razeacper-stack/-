import React from 'react';
import {
  UserPlus,
  ClipboardCheck,
  CreditCard,
  CalendarDays,
  GraduationCap,
  ArrowUpRight,
  UserCheck,
  Bot,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../common/Card';
import { StandardPermissionKey } from '../../types/auth';

export interface QuickActionsProps {
  onActionClick: (actionId: string) => void;
}

interface ActionConfig {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  requiredPermission?: StandardPermissionKey;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const allActions: ActionConfig[] = [
    {
      id: 'students',
      label: 'تسجيل وقيد الطلاب',
      desc: 'إضافة طالب جديد وتعديل بيانات التسجيل',
      icon: UserPlus,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      requiredPermission: 'students.view',
    },
    {
      id: 'attendance',
      label: 'رصد الحضور والغياب',
      desc: 'تسجيل الحضور اليومي أو حصص الفصول',
      icon: ClipboardCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      requiredPermission: 'attendance.view',
    },
    {
      id: 'timetable',
      label: 'جداول الحصص الدراسية',
      desc: 'استعراض الحصص وإدارة القاعات',
      icon: CalendarDays,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/60',
      requiredPermission: 'timetable.view',
    },
    {
      id: 'fees',
      label: 'سندات الرسوم والمدفوعات',
      desc: 'إصدار الفواتير وتحصيل الرسوم النقدية',
      icon: CreditCard,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      requiredPermission: 'fees.view',
    },
    {
      id: 'teachers',
      label: 'إدارة الكادر التعليمي',
      desc: 'شؤون المعلمين الدائمين والمكلفين بالحصة',
      icon: UserCheck,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      requiredPermission: 'teachers.view',
    },
    {
      id: 'academic',
      label: 'الهيكل الأكاديمي والمراحل',
      desc: 'الصفوف والفصول والمواد المعتمدة',
      icon: GraduationCap,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/60',
      requiredPermission: 'academic_stages.view',
    },
    {
      id: 'ai_assistant',
      label: 'المساعد الذكي AI',
      desc: 'استشارات واستعلامات فورية بالذكاء الاصطناعي',
      icon: Bot,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/60',
    },
  ];

  // Filter actions by user permissions
  const authorizedActions = allActions.filter((act) => {
    if (!act.requiredPermission) return true;
    return hasPermission(act.requiredPermission);
  });

  return (
    <Card
      title={
        <div className="flex items-center justify-between w-full">
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {t('dashboard.quick_actions.title')}
          </span>
          <span className="text-[11px] font-normal text-slate-400">
            {authorizedActions.length} عمليات مصرحة
          </span>
        </div>
      }
      subtitle="إجراءات سريعة فورية للوصول إلى العمليات الأكثر استخداماً"
      className="h-full"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
        {authorizedActions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={() => onActionClick(act.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-start cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${act.bg} ${act.color} shadow-2xs`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {act.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {act.desc}
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
            </button>
          );
        })}
      </div>
    </Card>
  );
};
