import React, { useState } from 'react';
import { AIProposedAction } from '../../types/ai';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { aiAssistantService } from '../../services/ai/aiAssistantService';
import { AlertTriangle, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

export interface AIActionConfirmationProps {
  action: AIProposedAction;
  messageId: string;
  onActionComplete?: () => void;
}

export const AIActionConfirmation: React.FC<AIActionConfirmationProps> = ({
  action,
  messageId,
  onActionComplete,
}) => {
  const { currentUser } = useAuth();
  const { language } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const isAr = language === 'ar';

  const handleConfirm = () => {
    if (!currentUser) return;
    setIsProcessing(true);
    try {
      const res = aiAssistantService.executeProposedAction(currentUser, action, messageId);
      setFeedback({ success: res.success, message: res.message });
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'حدث خطأ أثناء التنفيذ' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (!currentUser) return;
    setIsProcessing(true);
    try {
      aiAssistantService.cancelProposedAction(currentUser, action, messageId);
      setFeedback({
        success: true,
        message: isAr ? 'تم إلغاء الإجراء بنجاح ولم يطرأ أي تغيير على السجلات.' : 'Action cancelled successfully.',
      });
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'حدث خطأ أثناء الإلغاء' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-3.5 p-4 rounded-2xl border border-amber-200/90 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/70 to-amber-100/30 dark:from-amber-950/30 dark:to-slate-900/50 shadow-sm backdrop-blur-md">
      {/* Top Header Warning */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-amber-200/60 dark:border-amber-900/40">
        <div className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
            {action.title || (isAr ? 'تأكيد إجراء إداري حساس' : 'Administrative Action Confirmation')}
          </h4>
          <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
            {isAr
              ? 'يتطلب النظام موافقتك الصريحة قبل تعديل قاعدة البيانات الحقيقية'
              : 'Explicit confirmation required before mutating system records'}
          </span>
        </div>
      </div>

      {/* Target Entity Details */}
      <div className="mt-3 bg-white/80 dark:bg-slate-900/80 rounded-xl p-3 border border-amber-100 dark:border-slate-800 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {isAr ? 'الكيان المستهدف:' : 'Target Entity:'}
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {action.entityName} ({action.entityId})
          </span>
        </div>

        {/* Changes diff */}
        {action.changes.map((c, i) => (
          <div key={i} className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">{c.label}:</span>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {String(c.from)}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold">
                {String(c.to)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback banner if executed or cancelled */}
      {feedback && (
        <div
          className={`mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium ${
            feedback.success
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60'
          }`}
        >
          {feedback.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Action Buttons (Only when pending) */}
      {action.status === 'pending' && !feedback && (
        <div className="mt-3.5 flex items-center justify-end gap-2">
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isAr ? 'جارٍ التحقق والتنفيذ...' : 'Executing...'}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'تأكيد التنفيذ' : 'Confirm Action'}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Already executed / cancelled badge */}
      {action.status !== 'pending' && !feedback && (
        <div className="mt-2.5 text-end">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              action.status === 'executed'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {action.status === 'executed'
              ? isAr
                ? 'تم التنفيذ بنجاح'
                : 'Executed'
              : isAr
              ? 'تم الإلغاء'
              : 'Cancelled'}
          </span>
        </div>
      )}
    </div>
  );
};
