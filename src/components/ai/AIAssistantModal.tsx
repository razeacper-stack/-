import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { AIChatWindow } from './AIChatWindow';
import { AIInput } from './AIInput';
import { AIQuickActions } from './AIQuickActions';
import { AIMessage, AIProviderType } from '../../types/ai';
import { aiAssistantService } from '../../services/ai/aiAssistantService';
import { aiContextService } from '../../services/ai/aiContextService';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { useTranslation } from '../../context/LanguageContext';
import { Sparkles, Trash2, Building2 } from 'lucide-react';

export interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  initialPrompt,
}) => {
  const { currentUser } = useAuth();
  const { activeBranch, isAllBranches } = useBranch();
  const { language } = useTranslation();

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isAr = language === 'ar';
  const branchName = isAllBranches
    ? isAr
      ? 'كافة الفروع'
      : 'All Branches'
    : isAr
    ? activeBranch?.nameAr || 'الفرع الحالي'
    : activeBranch?.nameEn || 'Current Branch';

  const branchId = isAllBranches ? 'all' : (activeBranch?.id || 'all');

  useEffect(() => {
    if (currentUser && isOpen) {
      setMessages(aiContextService.getHistory(currentUser.id));
      if (initialPrompt) {
        handleSendMessage(initialPrompt);
      }
    }
  }, [currentUser, isOpen, initialPrompt]);

  const handleSendMessage = async (queryText: string) => {
    if (!currentUser || !queryText.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await aiAssistantService.processQuery({
        query: queryText,
        actingUser: currentUser,
        branchId,
        branchName,
        language: language as 'ar' | 'en',
      });

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isAr ? 'المساعد الذكي لإدارة المدرسة' : 'School AI Assistant'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>{branchName}</span>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-[65vh] min-h-[460px] -mx-4 -my-4 sm:-mx-6 sm:-my-6">
        {/* Messages */}
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

        {/* Input Bar */}
        <div className="p-3 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800 space-y-2 shrink-0">
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
    </Modal>
  );
};
