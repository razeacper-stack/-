import React from 'react';
import { UserCheck, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { TeacherDashboardOverview } from '../../types/dashboard';

export interface TeacherOverviewProps {
  data: TeacherDashboardOverview;
  onNavigateTab: (tabId: string) => void;
}

export const TeacherOverview: React.FC<TeacherOverviewProps> = ({
  data,
  onNavigateTab,
}) => {
  return (
    <Card
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-slate-900 dark:text-slate-100">
              ملخص الكادر التعليمي والنصاب التدريسي
            </span>
          </div>
          <Badge variant="success" size="sm">
            {data.active} معلم نشط
          </Badge>
        </div>
      }
      subtitle="حالة المعلمين، أنواع التعاقد، التخصصات الدراسية، وتوزيع الحصص الأسبوعية"
    >
      <div className="space-y-5">
        {/* Status Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
              معلمون رسميون (دائم)
            </span>
            <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {data.byType.fullTime}
            </div>
            <span className="text-[10px] text-slate-400">كادر تعليمي معتمد</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
              معلمو حصة (متعاون/مؤقت)
            </span>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {data.byType.partTime}
            </div>
            <span className="text-[10px] text-slate-400">ساعات جزئية</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
              إجازات رسمية
            </span>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {data.onLeave}
            </div>
            <span className="text-[10px] text-slate-400">مرضي / اضطراري</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
              حسابات معطلة / معلقة
            </span>
            <div className="text-xl font-bold font-mono text-slate-600 dark:text-slate-400">
              {data.inactive + data.suspended}
            </div>
            <span className="text-[10px] text-slate-400">خارج الخدمة</span>
          </div>
        </div>

        {/* Subjects & Workload Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* By Specialization Subject */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              توزيع المعلمين بحسب المواد والتخصصات:
            </span>

            {data.bySubject.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                لا توجد تخصصات مسجلة
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {data.bySubject.map((sub) => (
                  <div
                    key={sub.subjectId}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 text-xs border border-slate-200/40 dark:border-slate-700/40"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                      {sub.nameAr}
                    </span>
                    <Badge variant="primary" size="sm">
                      {sub.count} معلم
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teacher Weekly Period Workload */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              نصاب المعلمين في جدول الحصص الأسبوعي:
            </span>

            {data.workloadSummary.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                لا توجد حصص مجدولة للمعلمين حالياً
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {data.workloadSummary.map((item) => (
                  <div
                    key={item.teacherId}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 text-xs border border-slate-200/40 dark:border-slate-700/40"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                      {item.nameAr}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {item.weeklyPeriods} حصة
                      </span>
                      {item.isOverloaded ? (
                        <Badge variant="danger" size="sm">
                          <AlertTriangle className="w-3 h-3 ml-0.5 inline" />
                          تجاوز النصاب
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          منتظم
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
