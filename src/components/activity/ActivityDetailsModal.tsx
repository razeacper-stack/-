import React from 'react';
import {
  History,
  ShieldAlert,
  Clock,
  User,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Code,
  FileText,
  Printer,
} from 'lucide-react';
import { ActivityEvent } from '../../types/activity';
import { useTranslation } from '../../context/LanguageContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface ActivityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ActivityEvent | null;
}

export const ActivityDetailsModal: React.FC<ActivityDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const { language } = useTranslation();

  if (!event) return null;

  const getResultBadge = () => {
    switch (event.result) {
      case 'SUCCESS':
        return <Badge variant="success" size="sm">ناجح / SUCCESS</Badge>;
      case 'DENIED':
        return <Badge variant="danger" size="sm">محجوب / DENIED</Badge>;
      case 'FAILED':
        return <Badge variant="danger" size="sm">فشل / FAILED</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{event.result}</Badge>;
    }
  };

  const getSeverityBadge = () => {
    switch (event.severity) {
      case 'SECURITY':
      case 'ERROR':
        return <Badge variant="danger" size="sm">{event.severity}</Badge>;
      case 'WARNING':
        return <Badge variant="warning" size="sm">{event.severity}</Badge>;
      case 'SUCCESS':
        return <Badge variant="success" size="sm">{event.severity}</Badge>;
      default:
        return <Badge variant="primary" size="sm">{event.severity}</Badge>;
    }
  };

  const hasDiff = event.previousState !== undefined || event.newState !== undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>تفاصيل السجل: {event.action}</span>
              {getSeverityBadge()}
            </div>
            <span className="text-xs text-slate-400 font-mono">ID: {event.id}</span>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            {language === 'ar' ? 'طباعة السجل' : 'Print Entry'}
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Core Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">الوقت والتاريخ:</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {new Date(event.timestamp).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium">المنفذ (Actor):</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{event.actorName}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">({event.actorRole})</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium">الفرع (Branch Context):</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{event.branchNameAr}</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium">التصنيف (Category):</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {event.category}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium">الكيان المستهدف (Target):</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {event.targetType} {event.targetIdentifier ? `• ${event.targetIdentifier}` : ''}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium">النتيجة (Result):</span>
            <div className="mt-0.5">{getResultBadge()}</div>
          </div>
        </div>

        {/* Details & Explanation */}
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>نص البيان والتفاصيل المسجلة:</span>
          </div>
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {event.details}
          </p>
          {event.reason && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500">
              <span className="font-bold">السبب / المبرر: </span>
              <span>{event.reason}</span>
            </div>
          )}
        </div>

        {/* State Diff Comparison (Previous vs New) */}
        {hasDiff && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 mb-2">
              مقارنة التغييرات (State Transition Diff):
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <span className="text-rose-600 font-bold block mb-1">الحالة السابقة (Previous):</span>
                <pre className="whitespace-pre-wrap break-all text-slate-700 dark:text-slate-300">
                  {typeof event.previousState === 'object'
                    ? JSON.stringify(event.previousState, null, 2)
                    : String(event.previousState ?? 'None')}
                </pre>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-emerald-600 font-bold block mb-1">الحالة الجديدة (New State):</span>
                <pre className="whitespace-pre-wrap break-all text-slate-700 dark:text-slate-300">
                  {typeof event.newState === 'object'
                    ? JSON.stringify(event.newState, null, 2)
                    : String(event.newState ?? 'None')}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Additional Metadata */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
              <Code className="w-3.5 h-3.5" />
              <span>البيانات الإضافية (Metadata Payload):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              {Object.entries(event.metadata).map(([k, v]) => (
                <div key={k} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80">
                  <span className="text-slate-400">{k}: </span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
