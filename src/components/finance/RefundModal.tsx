import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PopulatedPayment, PaymentMethod } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, toMajorUnits, toMinorUnits } from '../../utils/currency';
import { RotateCcw, AlertCircle, ShieldAlert } from 'lucide-react';

export interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PopulatedPayment | null;
  onRefundSuccess: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  onClose,
  payment,
  onRefundSuccess,
}) => {
  const { processRefund, refunds } = useFinance();

  const [amountMajor, setAmountMajor] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculate previously refunded amount on this payment
  const previouslyRefundedMinor = React.useMemo(() => {
    if (!payment) return 0;
    const paymentRefunds = refunds.filter(
      (r) => r.paymentId === payment.id && r.status === 'PROCESSED'
    );
    return paymentRefunds.reduce((acc, curr) => acc + curr.amountMinor, 0);
  }, [payment, refunds]);

  const maxRefundableMinor = payment ? Math.max(0, payment.amountMinor - previouslyRefundedMinor) : 0;

  React.useEffect(() => {
    if (payment) {
      setAmountMajor(toMajorUnits(maxRefundableMinor).toFixed(2));
      setReason('');
      setMethod(payment.method);
      setErrorMsg(null);
    }
  }, [payment, maxRefundableMinor, isOpen]);

  if (!payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const minor = toMinorUnits(amountMajor);
    if (minor <= 0) {
      setErrorMsg('يرجى إدخال مبلغ استرداد صالح أكبر من الصفر.');
      return;
    }

    if (minor > maxRefundableMinor) {
      setErrorMsg(
        `المبلغ المطلوب (${formatCurrency(minor)}) يتجاوز الحد الأقصى القابل للاسترداد لهذا السند (${formatCurrency(maxRefundableMinor)}).`
      );
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('يرجى كتابة سبب ومبرر الاسترداد المالي بصورة واضحة.');
      return;
    }

    try {
      setIsSubmitting(true);
      await processRefund({
        branchId: payment.branchId,
        paymentId: payment.id,
        amountMinor: minor,
        reason: reason.trim(),
        method,
      });

      onRefundSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء معالجة الاسترداد.');
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
          <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>إصدار سند استرداد وصرف مالي (Process Refund)</span>
        </div>
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payment Details Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">سند القبض الأصلي:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{payment.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">الطالب:</span>
            <span className="font-semibold">{payment.studentNameAr} ({payment.studentNumber})</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700 text-center">
            <div>
              <div className="text-[11px] text-slate-500">مبلغ السند</div>
              <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(payment.amountMinor)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">مسترد سابقاً</div>
              <div className="font-mono font-semibold text-red-600">
                {formatCurrency(previouslyRefundedMinor)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">الحد القابل للصرف</div>
              <div className="font-mono font-bold text-emerald-600">
                {formatCurrency(maxRefundableMinor)}
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>تنبيه أمان: عملية الاسترداد لا تحذف سند القبض الأصلي وتوثق كامل المسار في سجل التدقيق المالي.</span>
        </div>

        {/* Refund Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            مبلغ الاسترداد (SAR) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={toMajorUnits(maxRefundableMinor)}
              value={amountMajor}
              onChange={(e) => setAmountMajor(e.target.value)}
              className="w-full text-sm font-mono font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="0.00"
              required
            />
            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">ر.س</span>
          </div>
        </div>

        {/* Refund Method */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            وسيلة صرف الاسترداد <span className="text-red-500">*</span>
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="BANK_TRANSFER">تحويل مصرفي عكسي (Bank Transfer)</option>
            <option value="CARD">إرجاع على البطاقة (Card Reversal)</option>
            <option value="CASH">نقداً من الخزينة (Cash)</option>
            <option value="CHEQUE">شيك مصرفي (Cheque)</option>
          </select>
        </div>

        {/* Reason (Mandatory) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            سبب ومبرر الاسترداد المالي <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="يرجى ذكر سبب الصرف مثل: انسحاب طالب، تخفيض رسوم، سداد زائد عن الخطأ..."
            required
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || maxRefundableMinor <= 0}>
            {isSubmitting ? 'جارٍ المعالجة...' : 'معالجة الاسترداد وصرف السند'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
