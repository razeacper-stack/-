import React, { useState } from 'react';
import { AIMessage as AIMessageType } from '../../types/ai';
import { AIDataCard } from './AIDataCard';
import { AIActionConfirmation } from './AIActionConfirmation';
import { AIErrorState } from './AIErrorState';
import { useTranslation } from '../../context/LanguageContext';
import { Sparkles, User, Copy, Check, ShieldCheck, Database, MapPin } from 'lucide-react';

export interface AIMessageProps {
  message: AIMessageType;
  onActionComplete?: () => void;
}

export const AIMessage: React.FC<AIMessageProps> = ({ message, onActionComplete }) => {
  const { language } = useTranslation();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isAr = language === 'ar';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString(
    isAr ? 'ar-SA' : 'en-US',
    { hour: '2-digit', minute: '2-digit' }
  );

  if (isUser) {
    return (
      <div className="flex justify-end my-3.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
        <div className="flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%]">
          <div className="flex flex-col items-end">
            <div className="px-4 py-3 rounded-2xl rounded-ee-sm bg-blue-600 text-white shadow-sm shadow-blue-500/20 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {formattedTime}
            </span>
          </div>
          <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 mb-4">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start my-3.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-start gap-3 max-w-[95%] sm:max-w-[88%] min-w-0">
        {/* Assistant Avatar */}
        <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>

        {/* Message Bubble */}
        <div className="flex-1 min-w-0">
          <div
            className={`p-4 rounded-2xl rounded-es-sm border transition-colors shadow-2xs ${
              message.error
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/60'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            }`}
          >
            {/* Header: Status tags & copy button */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80 text-[11px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <span>{isAr ? 'المساعد الإداري الذكي' : 'Smart School Assistant'}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </span>

                {message.scope?.branchName && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{message.scope.branchName}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                <button
                  onClick={handleCopy}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={isAr ? 'نسخ الإجابة' : 'Copy answer'}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <span className="text-[10px]">{formattedTime}</span>
              </div>
            </div>

            {/* Error or Content */}
            {message.error ? (
              <AIErrorState error={message.content} type="security" />
            ) : (
              <div className="mt-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                {message.content}
              </div>
            )}

            {/* Attached Data Card */}
            {message.dataCard && <AIDataCard card={message.dataCard} />}

            {/* Attached Action Confirmation */}
            {message.proposedAction && (
              <AIActionConfirmation
                action={message.proposedAction}
                messageId={message.id}
                onActionComplete={onActionComplete}
              />
            )}

            {/* Footer Source Note */}
            {message.source && (
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{message.source}</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span>{isAr ? 'بيانات حقيقية معتمدة' : 'Verified Real Data'}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
