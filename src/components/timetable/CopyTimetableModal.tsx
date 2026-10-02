import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useTimetable } from '../../context/TimetableContext';
import { useAcademic } from '../../context/AcademicContext';
import { Copy, AlertCircle, CheckCircle2, School, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

interface CopyTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  academicYearId: string;
  sourceClassId: string;
  onSuccess?: () => void;
}

export const CopyTimetableModal: React.FC<CopyTimetableModalProps> = ({
  isOpen,
  onClose,
  branchId,
  academicYearId,
  sourceClassId,
  onSuccess,
}) => {
  const { direction } = useTranslation();
  const { entries, copyClassTimetable } = useTimetable();
  const { classes } = useAcademic();

  const [targetClassId, setTargetClassId] = useState<string>('');
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  const sourceClass = classes.find((c) => c.id === sourceClassId);
  const sourceLessonsCount = entries.filter(
    (e) => e.branchId === branchId && e.academicYearId === academicYearId && e.classId === sourceClassId
  ).length;

  // Filter available target classes: same branch, same academic year, not the source class
  const availableTargetClasses = classes.filter(
    (c) =>
      c.branchId === branchId &&
      c.academicYearId === academicYearId &&
      c.id !== sourceClassId &&
      c.status === 'active'
  );

  const targetClassLessonsCount = targetClassId
    ? entries.filter(
        (e) => e.branchId === branchId && e.academicYearId === academicYearId && e.classId === targetClassId
      ).length
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!targetClassId) {
      setErrorMessage('يرجى تحديد الفصل الدراسي المستهدف.');
      return;
    }

    try {
      setIsSubmitting(true);
      await copyClassTimetable({
        branchId,
        academicYearId,
        sourceClassId,
        targetClassId,
        overwriteExisting,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في نسخ الجدول الدراسي.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Copy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              نسخ جدول الحصص الأسبوعي (Copy Timetable)
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              استنساخ توزيع الحصص والمواد والمعلمين من فصل إلى فصل آخر مع التحقق الذاتي
            </div>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Source Class Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            الفصل الدراسي المصدر:
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <School className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                  {sourceClass?.nameAr || 'الفصل المحدد'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {sourceClass?.classCode}
                </span>
              </div>
            </div>
            <Badge variant="primary" size="sm">
              {sourceLessonsCount} حصة مسكنة
            </Badge>
          </div>
        </div>

        {/* Target Class Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            الفصل الدراسي المستهدف (الوجهة) <span className="text-rose-500">*</span>
          </label>
          <select
            value={targetClassId}
            onChange={(e) => setTargetClassId(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          >
            <option value="">-- اختر الفصل المستهدف --</option>
            {availableTargetClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.nameAr} ({cls.classCode})
              </option>
            ))}
          </select>
          {availableTargetClasses.length === 0 && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">
              لا توجد فصول دراسية أخرى نشطة في نفس الفرع والعام الدراسي.
            </span>
          )}
        </div>

        {/* Existing Lessons Warning in Target */}
        {targetClassId && targetClassLessonsCount > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>تنبيه: الفصل المستهدف يحتوي على {targetClassLessonsCount} حصة مسكنة مسبقاً!</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
              إذا تابعت بدون خيار الاستبدال، سيتم رفض النسخ لمنع التضارب، أو يمكنك استبدال الحصص السابقة بالجدول الجديد.
            </p>
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={overwriteExisting}
                onChange={(e) => setOverwriteExisting(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
              />
              <span className="font-semibold text-xs text-amber-900 dark:text-amber-100">
                أوافق على استبدال وحذف الحصص الحالية للفصل المستهدف واستبدالها بهذا الجدول
              </span>
            </label>
          </div>
        )}

        {/* Informational Guidance */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <div className="font-semibold text-slate-700 dark:text-slate-300">
            ملاحظات الأمان والتحقق التلقائي:
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
            <li>يتم التحقق الفوري من عدم تعارض المعلمين والقاعات في المواعيد المنسوخة.</li>
            <li>الحصص المنسوخة تسجل تلقائياً بحالة مسودة (DRAFT) للمراجعة والاعتماد.</li>
            <li>يتم توثيق عملية النسخ كاملة في سجل التدقيق الأمني للفرع.</li>
          </ul>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || !targetClassId || sourceLessonsCount === 0}
            leftIcon={<Copy className="w-3.5 h-3.5" />}
          >
            {isSubmitting ? 'جارٍ النسخ والتحقق...' : 'بدء نسخ الجدول'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
