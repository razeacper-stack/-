import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { PopulatedInvoice, PaymentMethod, ReceiptData } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, toMajorUnits, toMinorUnits } from '../../utils/currency';
import { CreditCard, AlertCircle, CheckCircle, Calendar, Hash, Tag, FileText } from 'lucide-react';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: PopulatedInvoice | null;
  onPaymentSuccess: (receipt: ReceiptData) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}) => {
  const { recordPayment } = useFinance();

  const [amountMajor, setAmountMajor] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When modal opens or invoice changes, default to full remaining balance
  React.useEffect(() => {
    if (invoice) {
      setAmountMajor(toMajorUnits(invoice.balanceDueMinor).toFixed(2));
      setMethod('BANK_TRANSFER');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setReference('');
      setNotes('');
      setErrorMsg(null);
    }
  }, [invoice, isOpen]);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const minor = toMinorUnits(amountMajor);
    if (minor <= 0) {
      setErrorMsg('يرجى إدخال مبلغ سداد أكبر من الصفر.');
      return;
    }

    if (minor > invoice.balanceDueMinor) {
      setErrorMsg(
        `المبلغ المدخل (${formatCurrency(minor)}) يتجاوز الرصيد المستحق المتبقي (${formatCurrency(invoice.balanceDueMinor)}).`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await recordPayment({
        branchId: invoice.branchId,
        academicYearId: invoice.academicYearId,
        studentId: invoice.studentId,
        invoiceId: invoice.id,
        amountMinor: minor,
        paymentDate,
        method,
        reference: reference.trim(),
        notes: notes.trim(),
      });

      onPaymentSuccess(res.receipt);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تسجيل الدفعة المالية.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setFullAmount = () => {
    setAmountMajor(toMajorUnits(invoice.balanceDueMinor).toFixed(2));
  };

  const setHalfAmount = () => {
    const half = Math.round(invoice.balanceDueMinor / 2);
    setAmountMajor(toMajorUnits(half).toFixed(2));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>تسجيل دفعة سداد جديدة (Record Payment)</span>
        </div>
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invoice Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">الفاتورة:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">الطالب:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{invoice.studentNameAr} ({invoice.studentNumber})</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700 text-center">
            <div>
              <div className="text-[11px] text-slate-500">إجمالي الفاتورة</div>
              <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(invoice.netTotalMinor)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">المسدد</div>
              <div className="font-mono font-semibold text-emerald-600">
                {formatCurrency(invoice.paidTotalMinor)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">المتبقي المطلوب</div>
              <div className="font-mono font-bold text-amber-600">
                {formatCurrency(invoice.balanceDueMinor)}
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

        {/* Payment Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              مبلغ السداد (SAR) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={setFullAmount}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                كامل المتبقي
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={setHalfAmount}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                نصف المتبقي
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amountMajor}
              onChange={(e) => setAmountMajor(e.target.value)}
              className="w-full text-sm font-mono font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0.00"
              required
            />
            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">ر.س</span>
          </div>
        </div>

        {/* Method & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              وسيلة الدفع <span className="text-red-500">*</span>
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="BANK_TRANSFER">تحويل مصرفي (Bank Transfer)</option>
              <option value="CARD">بطاقة بنكية / مدى (POS Card)</option>
              <option value="CASH">نقداً (Cash)</option>
              <option value="CHEQUE">شيك مصرفي (Cheque)</option>
              <option value="ONLINE">دفع إلكتروني (Online)</option>
              <option value="OTHER">أخرى (Other)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              تاريخ السداد <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* Reference Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            الرقم المرجعي للعملية (اختياري)
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            placeholder="مثال: رقم الحوالة، رقم إيصال نقاط البيع، رقم الشيك"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            ملاحظات وتفاصيل الدفعة
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="أي تفاصيل أو ملاحظات إضافية على عملية القبض..."
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'جارٍ تسجيل الدفعة...' : 'تأكيد السداد وإصدار السند'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
