import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useFinance } from '../../context/FinanceContext';
import { useBranch } from '../../context/BranchContext';
import { useAcademic } from '../../context/AcademicContext';
import { useStudents } from '../../context/StudentContext';
import { formatCurrency, toMajorUnits, toMinorUnits } from '../../utils/currency';
import { UserCheck, AlertCircle } from 'lucide-react';

export interface FeeAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FeeAssignmentModal: React.FC<FeeAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { assignFeeToStudent, feeStructures } = useFinance();
  const { activeBranchId } = useBranch();
  const { years } = useAcademic();
  const { students } = useStudents();

  const [studentId, setStudentId] = useState('');
  const [feeStructureId, setFeeStructureId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [discountMajor, setDiscountMajor] = useState('');
  const [scholarshipMajor, setScholarshipMajor] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const branchStudents = React.useMemo(() => {
    return students.filter((s) => s.branchId === activeBranchId && s.status === 'ACTIVE');
  }, [students, activeBranchId]);

  const branchStructures = React.useMemo(() => {
    return feeStructures.filter((s) => s.branchId === activeBranchId && s.active);
  }, [feeStructures, activeBranchId]);

  const branchYears = React.useMemo(() => {
    return years.filter((y) => y.branchId === activeBranchId);
  }, [years, activeBranchId]);

  React.useEffect(() => {
    if (isOpen) {
      if (branchStudents.length > 0 && !studentId) setStudentId(branchStudents[0].id);
      if (branchStructures.length > 0 && !feeStructureId) setFeeStructureId(branchStructures[0].id);
      const curYear = branchYears.find((y) => y.isCurrent) || branchYears[0];
      if (curYear && !academicYearId) setAcademicYearId(curYear.id);
      setDiscountMajor('');
      setScholarshipMajor('');
      setNotes('');
      setErrorMsg(null);
    }
  }, [isOpen, branchStudents, branchStructures, branchYears]);

  const selectedStructure = branchStructures.find((s) => s.id === feeStructureId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!studentId) {
      setErrorMsg('يرجى اختيار الطالب.');
      return;
    }
    if (!feeStructureId) {
      setErrorMsg('يرجى اختيار هيكل الرسوم.');
      return;
    }
    if (!academicYearId) {
      setErrorMsg('يرجى اختيار العام الدراسي.');
      return;
    }

    try {
      setIsSubmitting(true);
      await assignFeeToStudent({
        branchId: activeBranchId,
        academicYearId,
        studentId,
        feeStructureId,
        dueDate,
        discountAmountMinor: discountMajor ? toMinorUnits(discountMajor) : 0,
        scholarshipAmountMinor: scholarshipMajor ? toMinorUnits(scholarshipMajor) : 0,
        notes: notes.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إسناد الرسوم.');
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
          <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>إسناد رسوم دراسية لطالب (Assign Fee to Student)</span>
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

        {/* Student Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            الطالب المستهدف <span className="text-red-500">*</span>
          </label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          >
            {branchStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstNameAr} {s.lastNameAr} ({s.studentNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Fee Structure Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            هيكل الرسم الدراسي <span className="text-red-500">*</span>
          </label>
          <select
            value={feeStructureId}
            onChange={(e) => setFeeStructureId(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          >
            {branchStructures.map((fs) => (
              <option key={fs.id} value={fs.id}>
                {fs.nameAr} - {formatCurrency(fs.amountMinor)}
              </option>
            ))}
          </select>
          {selectedStructure && (
            <div className="mt-1 text-[11px] text-slate-500">
              القيمة الأساسية: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(selectedStructure.amountMinor)}</span> ({selectedStructure.frequency})
            </div>
          )}
        </div>

        {/* Academic Year & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              العام الدراسي <span className="text-red-500">*</span>
            </label>
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {branchYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.nameAr} {y.isCurrent ? '(الحالي)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              تاريخ الاستحقاق <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* Deductions: Discount & Scholarship */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              مبلغ خصم خاص (SAR)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={discountMajor}
              onChange={(e) => setDiscountMajor(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              منحة أو إعفاء دراسي (SAR)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={scholarshipMajor}
              onChange={(e) => setScholarshipMajor(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            ملاحظات الإسناد
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="ملاحظات أو مبررات الخصم إن وجدت..."
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'جارٍ الإسناد...' : 'تأكيد إسناد الرسوم'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
