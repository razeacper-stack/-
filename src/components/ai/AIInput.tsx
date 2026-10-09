import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft, Sparkles, XCircle } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export interface AIInputProps {
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export const AIInput: React.FC<AIInputProps> = ({
  onSendMessage,
  isLoading,
  placeholder,
}) => {
  const [text, setText] = useState('');
  const { language } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isAr = language === 'ar';

  const defaultPlaceholder = isAr
    ? 'اسأل المساعد الذكي عن الطلاب، الجداول، الحضور، أو الفواتير...'
    : 'Ask about students, timetable, attendance, or finance...';

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-lg backdrop-blur-md transition-all focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20">
      <form onSubmit={handleSubmit} className="flex flex-col p-2.5">
        <div className="flex items-start gap-2.5">
          <div className="pt-2 ps-1.5 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>

          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={placeholder || defaultPlaceholder}
            className="flex-1 bg-transparent border-0 text-slate-800 dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-hidden resize-none py-1.5 max-h-28 leading-relaxed font-medium"
          />

          {text && (
            <button
              type="button"
              onClick={() => {
                setText('');
                if (inputRef.current) inputRef.current.style.height = 'auto';
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-1 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="self-end p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title={isAr ? 'إرسال (Enter)' : 'Send (Enter)'}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 select-none">
          <span className="flex items-center gap-1">
            <span>{isAr ? 'اضغط' : 'Press'}</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[9px] text-slate-500">
              Enter ↵
            </kbd>
            <span>{isAr ? 'للإرسال، و' : 'to send,'}</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[9px] text-slate-500">
              Shift + Enter
            </kbd>
            <span>{isAr ? 'لسطر جديد' : 'for new line'}</span>
          </span>

          <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400 font-medium">
            {isAr ? 'بيانات حقيقية معزولة بالفروع' : 'Branch-isolated verified data'}
          </span>
        </div>
      </form>
    </div>
  );
};
