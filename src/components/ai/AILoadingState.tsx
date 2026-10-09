import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export interface AILoadingStateProps {
  statusText?: string;
}

export const AILoadingState: React.FC<AILoadingStateProps> = ({ statusText }) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  return (
    <div className="flex items-start gap-3 my-4 animate-in fade-in duration-200">
      {/* Bot Icon */}
      <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
        <Sparkles className="w-4 h-4 animate-pulse" />
      </div>

      {/* Bubble with pulsing dots */}
      <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-lg">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {statusText ||
              (isAr
                ? 'جارٍ تحليل السؤال والتحقق من الصلاحيات وسجلات النظام...'
                : 'Analyzing query, verifying permissions, and consulting records...')}
          </span>
        </div>
      </div>
    </div>
  );
};
