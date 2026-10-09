import React from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  LogOut,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { AttendanceDashboardOverview } from '../../types/dashboard';

export interface AttendanceOverviewProps {
  data: AttendanceDashboardOverview;
  onNavigateTab: (tabId: string) => void;
}

export const AttendanceOverview: React.FC<AttendanceOverviewProps> = ({
  data,
  onNavigateTab,
}) => {
  return (
    <Card
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-slate-900 dark:text-slate-100">
              مؤشرات الحضور والغياب اليومي ({data.date})
            </span>
          </div>
          {data.hasRecords ? (
            <Badge
              variant={data.rate >= 90 ? 'success' : data.rate >= 75 ? 'info' : 'danger'}
              size="sm"
            >
              نسبة الحضور: {data.rate}%
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm">
              لم يُرصد بعد
            </Badge>
          )}
        </div>
      }
      subtitle="إحصائيات تفصيلية لرصد الحضور الصباحي وحالات الغياب والتأخر والأعذار المعتمدة"
    >
      <div className="space-y-5">
        {/* Attendance Percentage Visual Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              معدل الانضباط الإجمالي:
            </span>
            <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
              {data.rate}%
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${data.hasRecords ? data.rate : 0}%` }}
              title={`حضور: ${data.rate}%`}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{
                width: `${data.hasRecords ? Math.max(0, 100 - data.rate) : 0}%`,
              }}
              title={`غياب وتأخر: ${100 - data.rate}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>0%</span>
            <span>الهدف المعتمد (95% فأعلى)</span>
            <span>100%</span>
          </div>
        </div>

        {/* 5 Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* Present */}
          <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>حاضر (PRESENT)</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {data.present}
            </div>
          </div>

          {/* Late */}
          <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>متأخر (LATE)</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">
              {data.late}
            </div>
          </div>

          {/* Absent */}
          <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-rose-700 dark:text-rose-300 mb-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>غائب (ABSENT)</span>
            </div>
            <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">
              {data.absent}
            </div>
          </div>

          {/* Excused */}
          <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span>بعذر (EXCUSED)</span>
            </div>
            <div className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300">
              {data.excused}
            </div>
          </div>

          {/* Early Departure */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج مبكر</span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-700 dark:text-slate-300">
              {data.earlyDeparture}
            </div>
          </div>
        </div>

        {/* Sessions & Incomplete Alert Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400">
              حالات الجلسات: {data.sessionsTotal} جلسة
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <Lock className="w-3 h-3" />
              {data.sessionsLocked} مقفلة
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {data.sessionsSubmitted} معتمدة
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {data.sessionsOpen} قيد الرصد
            </span>
          </div>

          {data.unrecordedCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>يوجد {data.unrecordedCount} طالب لم يُرصدوا بعد</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
