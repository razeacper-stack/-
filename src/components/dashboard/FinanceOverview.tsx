import React from 'react';
import { CreditCard, DollarSign, TrendingUp, AlertTriangle, RotateCcw, FileText } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { FinanceDashboardOverview } from '../../types/dashboard';
import { formatCurrency } from '../../utils/currency';

export interface FinanceOverviewProps {
  data: FinanceDashboardOverview | null;
  onNavigateTab: (tabId: string) => void;
}

export const FinanceOverview: React.FC<FinanceOverviewProps> = ({
  data,
  onNavigateTab,
}) => {
  if (!data) {
    return null;
  }

  return (
    <Card
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="font-bold text-slate-900 dark:text-slate-100">
              المؤشرات المالية والتحصيل المالي
            </span>
          </div>
          <Badge variant="primary" size="sm">
            نسبة التحصيل: {data.collectionRate}%
          </Badge>
        </div>
      }
      subtitle="ملخص الفواتير، المقبوضات المودعة، المبالغ المستحقة، والمتأخرات النقدية"
      action={
        <button
          onClick={() => onNavigateTab('fees')}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          سجل الفواتير والمدفوعات &larr;
        </button>
      }
    >
      <div className="space-y-5">
        {/* Collection Rate Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              نسبة تحصيل الرسوم المفوترة:
            </span>
            <span className="font-mono font-bold text-base text-amber-600 dark:text-amber-400">
              {data.collectionRate}%
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${data.collectionRate}%` }}
              title={`محصل: ${data.collectionRate}%`}
            />
            <div
              className="h-full bg-amber-400 transition-all duration-500"
              style={{ width: `${Math.max(0, 100 - data.collectionRate)}%` }}
              title={`متبقي: ${100 - data.collectionRate}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>0%</span>
            <span>الهدف (85% فأعلى)</span>
            <span>100%</span>
          </div>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Invoiced */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
              إجمالي الرسوم المفوترة
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {formatCurrency(data.totalInvoicedMinor)}
            </div>
            <span className="text-[10px] text-slate-400">
              {data.invoicesCount} فاتورة صادرة
            </span>
          </div>

          {/* Total Collected */}
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block mb-0.5">
              المبالغ المحصلة فعلياً
            </span>
            <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {formatCurrency(data.totalCollectedMinor)}
            </div>
            <span className="text-[10px] text-emerald-600/80">
              {data.paymentsCount} سند قبض مدفوع
            </span>
          </div>

          {/* Outstanding */}
          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50">
            <span className="text-[11px] text-amber-700 dark:text-amber-300 block mb-0.5">
              المستحقات المتبقية
            </span>
            <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">
              {formatCurrency(data.outstandingMinor)}
            </div>
            <span className="text-[10px] text-amber-600/80">ذمم قيد السداد</span>
          </div>

          {/* Overdue */}
          <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] text-rose-700 dark:text-rose-300">
                المتأخرات المتجاوزة للموعد
              </span>
              {data.overdueInvoicesCount > 0 && (
                <Badge variant="danger" size="sm" className="text-[9px] py-0 px-1">
                  {data.overdueInvoicesCount}
                </Badge>
              )}
            </div>
            <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">
              {formatCurrency(data.overdueMinor)}
            </div>
            <span className="text-[10px] text-rose-600/80">تجاوزت تاريخ الاستحقاق</span>
          </div>
        </div>

        {/* Refunds Note if any */}
        {data.refundsMinor > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-400 border border-slate-200/50">
            <span className="flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              إجمالي المبالغ المستردة المعتمدة:
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {formatCurrency(data.refundsMinor)}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
