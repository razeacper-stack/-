import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useFinance } from '../../context/FinanceContext';
import { useBranch } from '../../context/BranchContext';
import { useAcademic } from '../../context/AcademicContext';
import { useStudents } from '../../context/StudentContext';
import { FinancialCalculationEngine } from '../../services/financialCalculationEngine';
import { formatCurrency, toMajorUnits, toMinorUnits, addMinor } from '../../utils/currency';
import { DiscountType, ScholarshipType } from '../../types/finance';
import { FilePlus, Plus, Trash2, AlertCircle, Percent, DollarSign, Calculator } from 'lucide-react';

export interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TempLine {
  id: string;
  feeStructureId?: string;
  descriptionAr: string;
  descriptionEn: string;
  quantity: number;
  unitAmountMajor: string;
}

interface TempDiscount {
  id: string;
  type: DiscountType;
  value: number;
  reason: string;
}

interface TempScholarship {
  id: string;
  type: ScholarshipType;
  value: number;
  reason: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createInvoice, feeStructures } = useFinance();
  const { activeBranchId } = useBranch();
  const { years } = useAcademic();
  const { students } = useStudents();

  const [studentId, setStudentId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<TempLine[]>([
    {
      id: 'tl-1',
      descriptionAr: 'الرسوم الدراسية السنوية',
      descriptionEn: 'Annual Tuition Fees',
      quantity: 1,
      unitAmountMajor: '25000.00',
    },
  ]);
  const [discounts, setDiscounts] = useState<TempDiscount[]>([]);
  const [scholarships, setScholarships] = useState<TempScholarship[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const branchStudents = React.useMemo(() => {
    return students.filter((s) => s.branchId === activeBranchId && s.status === 'ACTIVE');
  }, [students, activeBranchId]);

  const branchYears = React.useMemo(() => {
    return years.filter((y) => y.branchId === activeBranchId);
  }, [years, activeBranchId]);

  const branchStructures = React.useMemo(() => {
    return feeStructures.filter((s) => s.branchId === activeBranchId && s.active);
  }, [feeStructures, activeBranchId]);

  React.useEffect(() => {
    if (isOpen) {
      if (branchStudents.length > 0 && !studentId) setStudentId(branchStudents[0].id);
      const curYear = branchYears.find((y) => y.isCurrent) || branchYears[0];
      if (curYear && !academicYearId) setAcademicYearId(curYear.id);
      setIssueDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]);
      setNotes('');
      setLines([
        {
          id: 'tl-1',
          descriptionAr: 'الرسوم الدراسية السنوية',
          descriptionEn: 'Annual Tuition Fees',
          quantity: 1,
          unitAmountMajor: '25000.00',
        },
      ]);
      setDiscounts([]);
      setScholarships([]);
      setErrorMsg(null);
    }
  }, [isOpen, branchStudents, branchYears]);

  // Real-time exact money calculation
  const computedTotals = React.useMemo(() => {
    const computedLines = lines.map((l) => {
      const unitMinor = toMinorUnits(l.unitAmountMajor || 0);
      const grossMinor = FinancialCalculationEngine.calculateLineGross(l.quantity, unitMinor);
      return { grossAmountMinor: grossMinor };
    });

    const subtotalMinor = FinancialCalculationEngine.calculateSubtotal(computedLines);

    // Discounts
    let discountTotalMinor = 0;
    discounts.forEach((d) => {
      const calc = FinancialCalculationEngine.calculateDiscount(
        subtotalMinor,
        d.type,
        d.type === 'PERCENTAGE' ? d.value : toMinorUnits(d.value)
      );
      const applicable = Math.min(subtotalMinor - discountTotalMinor, calc);
      discountTotalMinor = addMinor(discountTotalMinor, applicable);
    });

    // Scholarships
    let scholarshipTotalMinor = 0;
    const afterDiscounts = Math.max(0, subtotalMinor - discountTotalMinor);
    scholarships.forEach((s) => {
      const calc = FinancialCalculationEngine.calculateScholarship(
        afterDiscounts,
        s.type,
        s.type === 'PERCENTAGE' ? s.value : toMinorUnits(s.value)
      );
      const applicable = Math.min(afterDiscounts - scholarshipTotalMinor, calc);
      scholarshipTotalMinor = addMinor(scholarshipTotalMinor, applicable);
    });

    const netTotalMinor = FinancialCalculationEngine.calculateNetTotal(
      subtotalMinor,
      discountTotalMinor,
      scholarshipTotalMinor
    );

    return {
      subtotalMinor,
      discountTotalMinor,
      scholarshipTotalMinor,
      netTotalMinor,
    };
  }, [lines, discounts, scholarships]);

  // Line Handlers
  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: `tl-${Date.now()}`,
        descriptionAr: '',
        descriptionEn: '',
        quantity: 1,
        unitAmountMajor: '',
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, updates: Partial<TempLine>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const handleStructureSelect = (lineId: string, structureId: string) => {
    const fs = branchStructures.find((s) => s.id === structureId);
    if (!fs) return;
    updateLine(lineId, {
      feeStructureId: fs.id,
      descriptionAr: fs.nameAr,
      descriptionEn: fs.nameEn,
      unitAmountMajor: toMajorUnits(fs.amountMinor).toFixed(2),
    });
  };

  // Discount Handlers
  const addDiscount = () => {
    setDiscounts((prev) => [
      ...prev,
      { id: `td-${Date.now()}`, type: 'PERCENTAGE', value: 10, reason: 'خصم السداد المبكر' },
    ]);
  };

  const removeDiscount = (id: string) => {
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
  };

  // Scholarship Handlers
  const addScholarship = () => {
    setScholarships((prev) => [
      ...prev,
      { id: `ts-${Date.now()}`, type: 'PERCENTAGE', value: 20, reason: 'منحة التفوق العلمي' },
    ]);
  };

  const removeScholarship = (id: string) => {
    setScholarships((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSave = async (asIssued: boolean) => {
    setErrorMsg(null);

    if (!studentId) {
      setErrorMsg('يرجى اختيار الطالب.');
      return;
    }
    if (!academicYearId) {
      setErrorMsg('يرجى اختيار العام الدراسي.');
      return;
    }
    if (lines.length === 0 || lines.some((l) => !l.descriptionAr.trim() || toMinorUnits(l.unitAmountMajor) <= 0)) {
      setErrorMsg('يرجى التأكد من ملء جميع بنود الفاتورة ووصفها ومبالغها الصحيحة.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createInvoice(
        {
          branchId: activeBranchId,
          academicYearId,
          studentId,
          issueDate,
          dueDate,
          notes: notes.trim(),
          lines: lines.map((l) => ({
            feeStructureId: l.feeStructureId,
            descriptionAr: l.descriptionAr.trim(),
            descriptionEn: l.descriptionEn?.trim() || l.descriptionAr.trim(),
            quantity: l.quantity,
            unitAmountMinor: toMinorUnits(l.unitAmountMajor),
          })),
          discounts: discounts.map((d) => ({
            type: d.type,
            value: d.type === 'PERCENTAGE' ? d.value : toMinorUnits(d.value),
            reason: d.reason,
          })),
          scholarships: scholarships.map((s) => ({
            type: s.type,
            value: s.type === 'PERCENTAGE' ? s.value : toMinorUnits(s.value),
            reason: s.reason,
          })),
        },
        asIssued
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ الفاتورة.');
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
          <FilePlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>إصدار فاتورة رسوم ومطالبة مالية (Create Student Invoice)</span>
        </div>
      }
      maxWidth="xl"
    >
      <div className="space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Student & Term Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              الطالب المستهدف <span className="text-red-500">*</span>
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {branchStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstNameAr} {s.lastNameAr} ({s.studentNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              العام الدراسي <span className="text-red-500">*</span>
            </label>
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              بنود الفاتورة والرسوم ({lines.length})
            </span>
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus className="w-3.5 h-3.5 ml-1" />
              إضافة بند رسم
            </Button>
          </div>

          <div className="space-y-2.5">
            {lines.map((l, index) => {
              const lineGrossMinor = FinancialCalculationEngine.calculateLineGross(
                l.quantity,
                toMinorUnits(l.unitAmountMajor || 0)
              );

              return (
                <div
                  key={l.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/60 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      بند #{index + 1}
                    </span>
                    {branchStructures.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">تعبئة سريعة من الهياكل:</span>
                        <select
                          className="text-[11px] py-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          onChange={(e) => handleStructureSelect(l.id, e.target.value)}
                          defaultValue=""
                        >
                          <option value="" disabled>اختر هيكل رسوم...</option>
                          {branchStructures.map((s) => (
                            <option key={s.id} value={s.id}>{s.nameAr}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(l.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="حذف البند"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        value={l.descriptionAr}
                        onChange={(e) => updateLine(l.id, { descriptionAr: e.target.value })}
                        placeholder="بيان ووصف البند بالعربية *"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={l.quantity}
                        onChange={(e) => updateLine(l.id, { quantity: parseInt(e.target.value) || 1 })}
                        placeholder="الكمية"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-center"
                        title="الكمية"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={l.unitAmountMajor}
                        onChange={(e) => updateLine(l.id, { unitAmountMajor: e.target.value })}
                        placeholder="سعر الوحدة"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-end font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(lineGrossMinor)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deductions: Discounts & Scholarships */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Discounts */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">الخصومات والتخفيضات</span>
              <button
                type="button"
                onClick={addDiscount}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                إضافة خصم
              </button>
            </div>
            {discounts.length === 0 ? (
              <div className="text-[11px] text-slate-400 py-1">لا توجد خصومات مطبقة</div>
            ) : (
              <div className="space-y-2">
                {discounts.map((d) => (
                  <div key={d.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <select
                          value={d.type}
                          onChange={(e) =>
                            setDiscounts((prev) =>
                              prev.map((x) => (x.id === d.id ? { ...x, type: e.target.value as DiscountType } : x))
                            )
                          }
                          className="text-[11px] py-0.5 px-1.5 rounded border border-slate-300 dark:border-slate-700"
                        >
                          <option value="PERCENTAGE">نسبة مئوية (%)</option>
                          <option value="FIXED">مبلغ ثابت (SAR)</option>
                        </select>
                        <input
                          type="number"
                          step={d.type === 'PERCENTAGE' ? '1' : '0.01'}
                          value={d.value}
                          onChange={(e) =>
                            setDiscounts((prev) =>
                              prev.map((x) => (x.id === d.id ? { ...x, value: parseFloat(e.target.value) || 0 } : x))
                            )
                          }
                          className="w-20 text-[11px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDiscount(d.id)}
                        className="text-red-500 hover:text-red-700 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={d.reason}
                      onChange={(e) =>
                        setDiscounts((prev) =>
                          prev.map((x) => (x.id === d.id ? { ...x, reason: e.target.value } : x))
                        )
                      }
                      placeholder="سبب الخصم ومبرره"
                      className="w-full text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scholarships */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">المنح والإعفاءات الدراسية</span>
              <button
                type="button"
                onClick={addScholarship}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                إضافة منحة
              </button>
            </div>
            {scholarships.length === 0 ? (
              <div className="text-[11px] text-slate-400 py-1">لا توجد منح مطبقة</div>
            ) : (
              <div className="space-y-2">
                {scholarships.map((s) => (
                  <div key={s.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <select
                          value={s.type}
                          onChange={(e) =>
                            setScholarships((prev) =>
                              prev.map((x) => (x.id === s.id ? { ...x, type: e.target.value as ScholarshipType } : x))
                            )
                          }
                          className="text-[11px] py-0.5 px-1.5 rounded border border-slate-300 dark:border-slate-700"
                        >
                          <option value="PERCENTAGE">نسبة مئوية (%)</option>
                          <option value="FIXED">مبلغ ثابت (SAR)</option>
                        </select>
                        <input
                          type="number"
                          step={s.type === 'PERCENTAGE' ? '1' : '0.01'}
                          value={s.value}
                          onChange={(e) =>
                            setScholarships((prev) =>
                              prev.map((x) => (x.id === s.id ? { ...x, value: parseFloat(e.target.value) || 0 } : x))
                            )
                          }
                          className="w-20 text-[11px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeScholarship(s.id)}
                        className="text-red-500 hover:text-red-700 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={s.reason}
                      onChange={(e) =>
                        setScholarships((prev) =>
                          prev.map((x) => (x.id === s.id ? { ...x, reason: e.target.value } : x))
                        )
                      }
                      placeholder="مبرر المنحة ونوعها"
                      className="w-full text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calculation Summary Bar */}
        <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-[11px] text-slate-500">الإجمالي الأولي</div>
              <div className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {formatCurrency(computedTotals.subtotalMinor)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">إجمالي الخصومات</div>
              <div className="font-mono font-bold text-red-600 mt-0.5">
                -{formatCurrency(computedTotals.discountTotalMinor)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">إجمالي المنح</div>
              <div className="font-mono font-bold text-indigo-600 mt-0.5">
                -{formatCurrency(computedTotals.scholarshipTotalMinor)}
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800">
              <div className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">صافي المطالبة النهائية</div>
              <div className="font-mono font-black text-sm text-blue-700 dark:text-blue-400 mt-0.5">
                {formatCurrency(computedTotals.netTotalMinor)}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            ملاحظات وشروط الفاتورة
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ملاحظات تظهر للطالب أو ولي الأمر في الفاتورة..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ كمسودة (Draft)'}
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جارٍ الإصدار...' : 'اعتماد وإصدار الفاتورة (Issue)'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
