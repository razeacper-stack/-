import React from 'react';
import { Users, GraduationCap, School, Layers, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { StudentDashboardOverview } from '../../types/dashboard';

export interface StudentOverviewProps {
  data: StudentDashboardOverview;
  onNavigateTab: (tabId: string) => void;
}

export const StudentOverview: React.FC<StudentOverviewProps> = ({
  data,
  onNavigateTab,
}) => {
  const malePercentage = data.total > 0 ? Math.round((data.byGender.male / data.total) * 100) : 0;
  const femalePercentage = data.total > 0 ? Math.round((data.byGender.female / data.total) * 100) : 0;

  return (
    <Card
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-slate-900 dark:text-slate-100">
              ملخص شؤون الطلاب والتوزيع الدراسي
            </span>
          </div>
          <Badge variant="primary" size="sm">
            {data.total} طالب مسجل
          </Badge>
        </div>
      }
      subtitle="توزيع الطلاب بحسب المراحل الدراسية، الصفوف، والفصول مع نسب الانتظام"
    >
      <div className="space-y-5">
        {/* Status & Gender Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
              الطلاب النشطون
            </span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {data.active}
            </div>
            <span className="text-[10px] text-slate-400">
              {data.total > 0 ? Math.round((data.active / data.total) * 100) : 0}% من الإجمالي
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
              غير نشط / منسحب
            </span>
            <div className="text-xl font-bold font-mono text-slate-600 dark:text-slate-400">
              {data.inactive}
            </div>
            <span className="text-[10px] text-slate-400">ملفات مجمدة أو مؤرشفة</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
              الطلاب (بنين)
            </span>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {data.byGender.male}
            </div>
            <span className="text-[10px] text-slate-400">{malePercentage}% من الطلاب</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
              الطالبات (بنات)
            </span>
            <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {data.byGender.female}
            </div>
            <span className="text-[10px] text-slate-400">{femalePercentage}% من الطلاب</span>
          </div>
        </div>

        {/* Distribution by Stage */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              توزيع الطلاب بحسب المرحلة الدراسية:
            </span>
          </div>

          {data.byStage.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              لا توجد مراحل مسجلة أو مقيد بها طلاب حالياً
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {data.byStage.map((st) => {
                const pct = data.total > 0 ? Math.round((st.count / data.total) * 100) : 0;
                return (
                  <div
                    key={st.stageId}
                    className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {st.nameAr}
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {st.count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block text-end">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Distribution by Grade & Top Classes */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <School className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            توزيع الفصول الدراسية والسعة الاستيعابية:
          </span>

          {data.byClass.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              لا توجد فصول دراسية مقيدة
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {data.byClass.map((c) => {
                const cap = c.capacity || 30;
                const occPct = Math.min(100, Math.round((c.count / cap) * 100));
                return (
                  <div
                    key={c.classId}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-2xs hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                  >
                    <div className="flex items-center justify-between gap-1.5 text-xs mb-1.5">
                      <span
                        className="font-bold text-slate-900 dark:text-white truncate"
                        title={c.nameAr}
                      >
                        {c.nameAr}
                      </span>
                      <span className="shrink-0 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700">
                        {c.count}/{cap}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          occPct >= 90
                            ? 'bg-rose-500'
                            : occPct >= 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500 dark:text-slate-300">
                      <span>نسبة الإشغال</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                        {occPct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
