import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { FeeStructure, FeeFrequency } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';
import { useBranch } from '../../context/BranchContext';
import { useAcademic } from '../../context/AcademicContext';
import { toMajorUnits, toMinorUnits } from '../../utils/currency';
import { Layers, AlertCircle } from 'lucide-react';

export interface FeeStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  structure: FeeStructure | null;
  onSuccess: () => void;
}

export const FeeStructureModal: React.FC<FeeStructureModalProps> = ({
  isOpen,
  onClose,
  structure,
  onSuccess,
}) => {
  const { createFeeStructure, updateFeeStructure } = useFinance();
  const { activeBranchId } = useBranch();
  const { years, stages, grades, classes } = useAcademic();

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [stageId, setStageId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [classId, setClassId] = useState('');
  const [amountMajor, setAmountMajor] = useState('');
  const [frequency, setFrequency] = useState<FeeFrequency>('ANNUAL');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeBranchYears = React.useMemo(() => {
    return years.filter((y) => y.branchId === activeBranchId);
  }, [years, activeBranchId]);

  useEffect(() => {
    if (structure) {
      setNameAr(structure.nameAr);
      setNameEn(structure.nameEn);
      setAcademicYearId(structure.academicYearId);
      setStageId(structure.stageId || '');
      setGradeId(structure.gradeId || '');
      setClassId(structure.classId || '');
      setAmountMajor(toMajorUnits(structure.amountMinor).toFixed(2));
      setFrequency(structure.frequency);
      setEffectiveFrom(structure.effectiveFrom);
      setEffectiveTo(structure.effectiveTo);
      setDescriptionAr(structure.descriptionAr || '');
      setDescriptionEn(structure.descriptionEn || '');
      setErrorMsg(null);
    } else {
      setNameAr('');
      setNameEn('');
      const curYear = activeBranchYears.find((y) => y.isCurrent) || activeBranchYears[0];
      setAcademicYearId(curYear?.id || '');
      setStageId('');
      setGradeId('');
      setClassId('');
      setAmountMajor('');
      setFrequency('ANNUAL');
      setEffectiveFrom(new Date().toISOString().split('T')[0]);
      setEffectiveTo(new Date(Date.now() + 300 * 24 * 3600 * 1000).toISOString().split('T')[0]);
      setDescriptionAr('');
      setDescriptionEn('');
      setErrorMsg(null);
    }
  }, [structure, isOpen, activeBranchYears]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nameAr.trim()) {
      setErrorMsg('اسم هيكل الرسوم بالعربية مطلوب.');
      return;
    }
    const minor = toMinorUnits(amountMajor);
    if (minor <= 0) {
      setErrorMsg('يرجى تحديد مبلغ رسوم صالح أكبر من الصفر.');
      return;
    }
    if (!academicYearId) {
      setErrorMsg('يرجى اختيار العام الدراسي.');
      return;
    }
    if (!activeBranchId) {
      setErrorMsg('يرجى تحديد الفرع المدرسي.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (structure) {
        await updateFeeStructure(structure.id, {
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || nameAr.trim(),
          descriptionAr: descriptionAr.trim(),
          descriptionEn: descriptionEn.trim(),
          stageId: stageId || undefined,
          gradeId: gradeId || undefined,
          classId: classId || undefined,
          amountMinor: minor,
          frequency,
          effectiveFrom,
          effectiveTo,
        });
      } else {
        await createFeeStructure({
          branchId: activeBranchId,
          academicYearId,
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || nameAr.trim(),
          descriptionAr: descriptionAr.trim(),
          descriptionEn: descriptionEn.trim(),
          stageId: stageId || undefined,
          gradeId: gradeId || undefined,
          classId: classId || undefined,
          amountMinor: minor,
          frequency,
          effectiveFrom,
          effectiveTo,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ هيكل الرسوم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>{structure ? 'تعديل هيكل الرسوم الدراسية' : 'إضافة هيكل رسوم دراسية جديد'}</span>
        </div>
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              اسم البند بالعربية <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="مثال: الرسوم الدراسية السنوية"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              اسم البند بالإنجليزية
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Annual Tuition Fee"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              العام الأكاديمي <span className="text-red-500">*</span>
            </label>
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              disabled={!!structure}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              required
            >
              {activeBranchYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.nameAr} {y.isCurrent ? '(الحالي)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              دورية الرسوم <span className="text-red-500">*</span>
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as FeeFrequency)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ANNUAL">سنوية (Annual)</option>
              <option value="SEMESTER">فصل دراسي (Semester)</option>
              <option value="TERM">فترة / ثلث دراسي (Term)</option>
              <option value="MONTHLY">شهرية (Monthly)</option>
              <option value="ONE_TIME">مرة واحدة (One-Time)</option>
              <option value="CUSTOM">مخصصة (Custom)</option>
            </select>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            مبلغ الرسم (SAR) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amountMajor}
              onChange={(e) => setAmountMajor(e.target.value)}
              className="w-full text-sm font-mono font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              required
            />
            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">ر.س</span>
          </div>
        </div>

        {/* Scope (Stage/Grade/Class) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              المرحلة (اختياري)
            </label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">كافة المراحل</option>
              {stages.filter((s) => s.branchId === activeBranchId).map((s) => (
                <option key={s.id} value={s.id}>{s.nameAr}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              الصف (اختياري)
            </label>
            <select
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">كافة الصفوف</option>
              {grades.filter((g) => g.branchId === activeBranchId).map((g) => (
                <option key={g.id} value={g.id}>{g.nameAr}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              الفصل (اختياري)
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">كافة الفصول</option>
              {classes.filter((c) => c.branchId === activeBranchId).map((c) => (
                <option key={c.id} value={c.id}>{c.nameAr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Effective Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              تاريخ السريان من
            </label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              تاريخ الانتهاء إلى
            </label>
            <input
              type="date"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            وصف وتفاصيل الرسم
          </label>
          <textarea
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            rows={2}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="تفاصيل ما يشمله هذا الرسم الدراسي..."
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'جارٍ الحفظ...' : structure ? 'تحديث الهيكل' : 'إضافة الهيكل'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
