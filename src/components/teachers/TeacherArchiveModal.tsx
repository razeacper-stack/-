import React, { useState } from 'react';
import { TeacherDetail } from '../../types/teacher';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTeachers } from '../../context/TeacherContext';
import {
  Archive,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface TeacherArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherDetail | null;
  onSuccess?: () => void;
}

export const TeacherArchiveModal: React.FC<TeacherArchiveModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onSuccess,
}) => {
  const { archiveTeacher, restoreTeacher } = useTeachers();

  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !teacher) return null;

  const isArchived = teacher.employmentStatus === 'ARCHIVED';

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isArchived && !reason.trim()) {
      setErrorMessage('سبب أرشفة المعلم حقل إلزامي لضمان التوثيق الإداري.');
      return;
    }

    try {
      setIsProcessing(true);
      if (isArchived) {
        await restoreTeacher(teacher.id, reason.trim() || undefined);
      } else {
        await archiveTeacher(teacher.id, reason.trim());
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشلت العملية.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              isArchived
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
            }`}
          >
            {isArchived ? <RotateCcw className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {isArchived ? 'استعادة المعلم من الأرشيف' : 'أرشفة سجل المعلم'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {teacher.fullNameAr} ({teacher.teacherNumber})
            </div>
          </div>
        </div>
      }
    >
      <form onSubmit={handleAction} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!isArchived ? (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs space-y-2 text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>تنبيه الحفظ التاريخي والأرشفة الآمنة</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              أرشفة ملف المعلم لن تحذف بياناته التاريخية، المؤهلات العلمية، المواد المسندة، أو سجلات الفصول السابقة، وإنما تنقل حسابه إلى الأرشيف الإداري وتوقف جدولته النشطة في الفرع.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs space-y-1.5 text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>إعادة تفعيل السجل الأكاديمي والوظيفي</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              سيتم إعادة المعلم إلى حالة «على رأس العمل (نشط)» واستئناف إسناد الحصص والجداول له بالفرع.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {isArchived ? 'ملاحظة أو مسوغ إعادة التفعيل (اختياري)' : 'سبب الأرشفة وإنهاء الخدمة *'}
          </label>
          <textarea
            rows={3}
            required={!isArchived}
            placeholder={
              isArchived
                ? 'اكتب مسوغ العودة للخدمة إن وجد...'
                : 'مثال: انتقال إلى جهة عمل أخرى، استقالة رسمية، انتهاء العقد السنوي...'
            }
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isProcessing}>
            إلغاء
          </Button>
          <Button
            variant={isArchived ? 'primary' : 'danger'}
            size="sm"
            type="submit"
            disabled={isProcessing}
            leftIcon={isArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          >
            {isProcessing ? 'جارٍ التنفيذ...' : isArchived ? 'استعادة وتفعيل المعلم' : 'تأكيد أرشفة المعلم'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
