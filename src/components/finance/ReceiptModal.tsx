import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { ReceiptData } from '../../types/finance';
import { formatCurrency } from '../../utils/currency';
import { Printer, ShieldCheck, Download, CheckCircle2, Calendar, User, FileText, CreditCard } from 'lucide-react';

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receipt }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const getMethodLabelAr = (method: string) => {
    switch (method) {
      case 'CASH': return 'نقداً (Cash)';
      case 'CARD': return 'بطاقة بنكية / مدى (POS Card)';
      case 'BANK_TRANSFER': return 'تحويل مصرفي (Bank Transfer)';
      case 'CHEQUE': return 'شيك مصرفي (Cheque)';
      case 'ONLINE': return 'دفع إلكتروني (Online)';
      default: return method;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>سند قبض مالي رسمي (Official Receipt)</span>
        </div>
      }
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={handlePrint}>
              <Printer className="w-4 h-4 ml-1.5" />
              طباعة السند
            </Button>
          </div>
        </div>
      }
    >
      {/* Printable Receipt Container */}
      <div id="printable-receipt" className="space-y-6 p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-slate-800 dark:text-slate-100">
        {/* Receipt Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {receipt.branchNameAr || 'مدارس التميز الأهلية'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {receipt.branchNameEn || 'Excellence Model Schools'}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                الرقم الضريبي: 300987654300003
              </div>
            </div>

            <div className="text-start sm:text-end">
              <Badge variant="success" size="md">
                <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                سند قبض معتمد (PAID)
              </Badge>
              <div className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 mt-1.5">
                {receipt.receiptNumber}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                تاريخ السند: {receipt.paymentDate}
              </div>
            </div>
          </div>
        </div>

        {/* Amount Big Display */}
        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">المبلغ المقبوض:</span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
              {formatCurrency(receipt.amountMinor, receipt.currency, 'ar')}
            </div>
          </div>
          <div className="text-end text-xs text-emerald-800 dark:text-emerald-400 font-mono">
            {formatCurrency(receipt.amountMinor, receipt.currency, 'en')}
          </div>
        </div>

        {/* Student & Invoice Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>بيانات الطالب المسدد</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">اسم الطالب:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{receipt.studentNameAr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">الرقم الأكاديمي:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{receipt.studentNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">العام الدراسي:</span>
              <span>{receipt.academicYearNameAr}</span>
            </div>
          </div>

          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>تفاصيل الدفعة المالية</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">رقم الفاتورة:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{receipt.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">وسيلة السداد:</span>
              <span className="font-semibold">{getMethodLabelAr(receipt.method)}</span>
            </div>
            {receipt.reference && (
              <div className="flex justify-between">
                <span className="text-slate-500">الرقم المرجعي:</span>
                <span className="font-mono">{receipt.reference}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">المستلم المعتمد:</span>
              <span>{receipt.receivedByName}</span>
            </div>
          </div>
        </div>

        {/* Invoice Statement Summary */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/60 text-xs space-y-2">
          <div className="font-semibold text-slate-700 dark:text-slate-300">موقف الفاتورة بعد هذه الدفعة:</div>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
              <div className="text-[11px] text-slate-500">إجمالي الفاتورة</div>
              <div className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {formatCurrency(receipt.invoiceNetTotalMinor, receipt.currency, 'ar')}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900">
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300">المسدد حتى الآن</div>
              <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {formatCurrency(receipt.invoicePaidTotalMinor, receipt.currency, 'ar')}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900">
              <div className="text-[11px] text-amber-800 dark:text-amber-300">المتبقي المطلوب</div>
              <div className="font-mono font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                {formatCurrency(receipt.invoiceRemainingBalanceMinor, receipt.currency, 'ar')}
              </div>
            </div>
          </div>
        </div>

        {/* Signature & Watermark Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>سند مالي إلكتروني معتمد رسمياً من الإدارة المالية</span>
          </div>
          <div>ختم الصندوق والمحاسبة</div>
        </div>
      </div>
    </Modal>
  );
};
