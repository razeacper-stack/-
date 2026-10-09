import React, { useState, useEffect } from 'react';
import { AIChatWindow } from './AIChatWindow';
import { AIInput } from './AIInput';
import { AIQuickActions } from './AIQuickActions';
import { AIMessage, AIProviderType } from '../../types/ai';
import { aiAssistantService } from '../../services/ai/aiAssistantService';
import { aiContextService } from '../../services/ai/aiContextService';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { useTranslation } from '../../context/LanguageContext';
import {
  Sparkles,
  Trash2,
  Cpu,
  ShieldCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';

export interface AIAssistantProps {
  onNavigateTab?: (tabId: string) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onNavigateTab }) => {
  const { currentUser } = useAuth();
  const { activeBranch, isAllBranches } = useBranch();
  const { language } = useTranslation();

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>('builtin');

  const isAr = language === 'ar';
  const branchName = isAllBranches
    ? isAr
      ? 'كافة الفروع'
      : 'All Branches'
    : isAr
    ? activeBranch?.nameAr || 'الفرع الحالي'
    : activeBranch?.nameEn || 'Current Branch';

  const branchId = isAllBranches ? 'all' : (activeBranch?.id || 'all');

  // Load chat history on mount or when active user changes
  useEffect(() => {
    if (currentUser) {
      const history = aiContextService.getHistory(currentUser.id);
      setMessages(history);
    }
  }, [currentUser]);

  // Handle message sending
  const handleSendMessage = async (queryText: string) => {
    if (!currentUser || !queryText.trim() || isLoading) return;

    setIsLoading(true);
    try {
      aiAssistantService.setProvider(selectedProvider);

      const res = await aiAssistantService.processQuery({
        query: queryText,
        actingUser: currentUser,
        branchId,
        branchName,
        language: language as 'ar' | 'en',
      });

      // Update state with newly added messages
      setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);
    } catch (err: any) {
      const errorMsg: AIMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: err.message || (isAr ? 'حدث خطأ أثناء معالجة الطلب.' : 'An error occurred.'),
        timestamp: new Date().toISOString(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (!currentUser) return;
    aiContextService.clearHistory(currentUser.id);
    setMessages([]);
  };

  const quickActions = currentUser ? aiAssistantService.getQuickActions(currentUser) : [];

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] min-h-[550px] max-w-5xl mx-auto rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl overflow-hidden transition-colors">
      {/* Top Header Controls Bar */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
        {/* Left branding & scope */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {isAr ? 'المساعد الذكي لإدارة المدرسة' : 'School AI Smart Assistant'}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>Phase 12</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 font-medium">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>{branchName}</span>
              </span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>{isAr ? 'متصل بقاعدة البيانات' : 'Connected to Storage'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right controls: Provider switcher + Clear chat */}
        <div className="flex items-center gap-2">
          {/* Provider Selector */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setSelectedProvider('builtin')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                selectedProvider === 'builtin'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{isAr ? 'المحرك المباشر' : 'Direct Engine'}</span>
            </button>
            <button
              onClick={() => setSelectedProvider('gemini')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                selectedProvider === 'gemini'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini Flash</span>
            </button>
          </div>

          {/* Clear history button */}
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              title={isAr ? 'مسح المحادثة' : 'Clear conversation'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Body */}
      <AIChatWindow
        messages={messages}
        isLoading={isLoading}
        onSelectPrompt={handleSendMessage}
        onActionComplete={() => {
          if (currentUser) {
            setMessages(aiContextService.getHistory(currentUser.id));
          }
        }}
        branchName={branchName}
      />

      {/* Bottom Area: Quick Actions & Input Bar */}
      <div className="p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800 backdrop-blur-md shrink-0 space-y-2">
        <AIQuickActions
          actions={quickActions}
          onSelectAction={handleSendMessage}
          disabled={isLoading}
        />

        <AIInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
