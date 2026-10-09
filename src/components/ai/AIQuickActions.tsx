import React from 'react';
import { AIQuickAction } from '../../types/ai';
import { useTranslation } from '../../context/LanguageContext';
import {
  Users,
  ClipboardCheck,
  UserX,
  Calendar,
  CreditCard,
  AlertCircle,
  FileBarChart2,
  CalendarDays,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export interface AIQuickActionsProps {
  actions: AIQuickAction[];
  onSelectAction: (prompt: string) => void;
  disabled?: boolean;
}

export const AIQuickActions: React.FC<AIQuickActionsProps> = ({
  actions,
  onSelectAction,
  disabled = false,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users':
        return <Users className="w-3.5 h-3.5" />;
      case 'ClipboardCheck':
        return <ClipboardCheck className="w-3.5 h-3.5" />;
      case 'UserX':
        return <UserX className="w-3.5 h-3.5" />;
      case 'CalendarAlert':
      case 'CalendarDays':
        return <CalendarDays className="w-3.5 h-3.5" />;
      case 'Calendar':
        return <Calendar className="w-3.5 h-3.5" />;
      case 'UserCheck':
        return <UserCheck className="w-3.5 h-3.5" />;
      case 'CreditCard':
        return <CreditCard className="w-3.5 h-3.5" />;
      case 'AlertCircle':
        return <AlertCircle className="w-3.5 h-3.5" />;
      case 'FileBarChart2':
        return <FileBarChart2 className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  if (actions.length === 0) return null;

  return (
    <div className="py-2.5">
      <div className="flex items-center gap-1.5 px-1 pb-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
        <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
        <span>{isAr ? 'أسئلة سريعة مقترحة (وفق صلاحياتك المعتمدة):' : 'Suggested Quick Inquiries:'}</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {actions.map((act) => {
          const label = isAr ? act.labelAr : act.labelEn;
          const prompt = isAr ? act.promptAr : act.promptEn;

          return (
            <button
              key={act.id}
              onClick={() => onSelectAction(prompt)}
              disabled={disabled}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700/60 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-150 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {getIcon(act.icon)}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
