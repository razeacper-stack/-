import React from 'react';
import { ShieldAlert, Lock, AlertOctagon, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export interface AIErrorStateProps {
  error: string;
  type?: 'permission' | 'security' | 'branch' | 'generic';
  onRetry?: () => void;
}

export const AIErrorState: React.FC<AIErrorStateProps> = ({ error, type = 'generic', onRetry }) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const getIcon = () => {
    switch (type) {
      case 'permission':
        return <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'security':
        return <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'branch':
        return <AlertOctagon className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'permission':
        return 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200';
      case 'security':
        return 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200';
      case 'branch':
        return 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-purple-200';
      default:
        return 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200';
    }
  };

  return (
    <div className={`mt-3 p-4 rounded-2xl border ${getColors()} shadow-xs flex items-start gap-3.5`}>
      <div className="shrink-0 p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-2xs">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold leading-tight">
          {type === 'security'
            ? isAr
              ? 'تنبيه أمني: تم حجب الطلب'
              : 'Security Alert: Request Blocked'
            : type === 'permission'
            ? isAr
              ? 'صلاحيات غير كافية'
              : 'Insufficient Permissions'
            : isAr
            ? 'تنبيه النظام'
            : 'System Notice'}
        </h4>
        <p className="mt-1 text-xs opacity-90 leading-relaxed font-medium">
          {error}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 text-xs font-semibold hover:bg-white dark:hover:bg-slate-900 shadow-2xs cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
