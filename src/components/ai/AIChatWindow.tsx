import React, { useRef, useEffect } from 'react';
import { AIMessage as AIMessageType } from '../../types/ai';
import { AIMessage } from './AIMessage';
import { AILoadingState } from './AILoadingState';
import { useTranslation } from '../../context/LanguageContext';
import { Sparkles, Shield, Database, Users, Calendar, CreditCard, School } from 'lucide-react';

export interface AIChatWindowProps {
  messages: AIMessageType[];
  isLoading: boolean;
  onSelectPrompt?: (prompt: string) => void;
  onActionComplete?: () => void;
  branchName?: string;
}

export const AIChatWindow: React.FC<AIChatWindowProps> = ({
  messages,
  isLoading,
  onSelectPrompt,
  onActionComplete,
  branchName,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 mb-4">
          <Sparkles className="w-8 h-8" />
        </div>

        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {isAr ? 'المساعد الإداري الذكي للمدرسة' : 'School Smart Administrative Assistant'}
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
          {isAr
            ? `مساعد مدعوم بقواعد البيانات الحقيقية لمدرستك (${branchName || 'كافة الفروع'}). يتيح لك الاستعلام الفوري عن الطلاب، الجداول، الحضور، والمتأخرات المالية وفق صلاحياتك المعتمدة.`
            : `AI assistant grounded in verified real-time records for ${branchName || 'all campuses'}.`}
        </p>

        {/* Security Pillars Badges */}
        <div className="flex items-center gap-2 mt-4 flex-wrap justify-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-300">
            <Shield className="w-3.5 h-3.5" />
            <span>{isAr ? 'عزل الفروع التام' : 'Branch Isolated'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
            <Database className="w-3.5 h-3.5" />
            <span>{isAr ? 'بيانات حقيقية 100%' : '100% Real Storage'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800 text-purple-700 dark:text-purple-300">
            <School className="w-3.5 h-3.5" />
            <span>{isAr ? 'حماية من حقن الأوامر' : 'Injection Protected'}</span>
          </span>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl text-start">
          <div
            onClick={() => onSelectPrompt && onSelectPrompt('كم عدد الطلاب في المدرسة؟')}
            className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {isAr ? 'شؤون الطلاب والصفوف' : 'Students & Grades'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {isAr ? 'استعلام أعداد الطلاب، التوزيع على الصفوف، والبحث بالأرقام الأكاديمية.' : 'Query student body counts and grade enrollment.'}
            </p>
          </div>

          <div
            onClick={() => onSelectPrompt && onSelectPrompt('ما نسبة الحضور اليوم؟')}
            className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {isAr ? 'الحضور والغياب اليومي' : 'Daily Attendance'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {isAr ? 'نسبة الحضور لليوم، رصد المتأخرين، وقائمة أكثر الطلاب غياباً.' : 'Daily presence percentage and top absence lists.'}
            </p>
          </div>

          <div
            onClick={() => onSelectPrompt && onSelectPrompt('هل يوجد تعارض في جدول المعلم أحمد؟')}
            className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {isAr ? 'الجداول وفحص التعارض' : 'Timetable & Conflicts'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {isAr ? 'جدول الحصص اليومي، وفحص ذكي لتعارضات المعلمين والقاعات.' : 'Check daily periods and automated teacher schedule conflicts.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 space-y-1">
      {messages.map((msg) => (
        <AIMessage
          key={msg.id}
          message={msg}
          onActionComplete={onActionComplete}
        />
      ))}

      {isLoading && <AILoadingState />}

      <div ref={bottomRef} />
    </div>
  );
};
