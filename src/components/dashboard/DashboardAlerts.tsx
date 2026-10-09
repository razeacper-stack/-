import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { DashboardAlert } from '../../types/dashboard';
import { useTranslation } from '../../context/LanguageContext';

export interface DashboardAlertsProps {
  alerts: DashboardAlert[];
  onNavigateTab: (tabId: string) => void;
}

export const DashboardAlerts: React.FC<DashboardAlertsProps> = ({
  alerts,
  onNavigateTab,
}) => {
  const { direction } = useTranslation();
  const ArrowIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  if (alerts.length === 0) {
    return (
      <Card
        title={
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-slate-900 dark:text-slate-100">
              حالة التنبيهات والمؤشرات التشغيلية
            </span>
          </div>
        }
        subtitle="متابعة دورية لحالات التأخير، الجداول غير المكتملة، وتجاوزات النصاب"
      >
        <div className="text-center py-6 text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            كافة العمليات التشغيلية منتظمة ولا توجد تنبيهات عاجلة
          </p>
          <p className="text-[11px] text-slate-400">
            تم استيفاء الحضور والجداول والتحصيلات بدون تعارضات مسجلة
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="font-bold text-slate-900 dark:text-slate-100">
              التنبيهات والمؤشرات التشغيلية العاجلة
            </span>
          </div>
          <Badge variant="warning" size="sm">
            {alerts.length} تنبيهات تتطلب المتابعة
          </Badge>
        </div>
      }
      subtitle="تنبيهات فورية مبنية على البيانات الفعلية للمدرسة تتطلب إجراءات تصحيحية"
    >
      <div className="space-y-2.5">
        {alerts.map((alert) => {
          const isDanger = alert.type === 'danger';
          const isWarning = alert.type === 'warning';

          return (
            <div
              key={alert.id}
              onClick={() => alert.actionTab && onNavigateTab(alert.actionTab)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                isDanger
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-100/70'
                  : isWarning
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/60 hover:bg-amber-100/70'
                  : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100/70'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    isDanger
                      ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300'
                      : isWarning
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300'
                      : 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300'
                  }`}
                >
                  {isDanger ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {alert.titleAr}
                    </h5>
                    {alert.count !== undefined && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-800 font-bold border border-slate-200 dark:border-slate-700">
                        {alert.count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {alert.messageAr}
                  </p>
                </div>
              </div>

              {alert.actionTab && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 shrink-0 self-center">
                  <span>متابعة</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
