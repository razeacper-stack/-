import React from 'react';
import {
  CalendarDays,
  Clock,
  School,
  BookOpen,
  User,
  MapPin,
  CheckCircle2,
  PlayCircle,
  Clock3,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { TimetableDashboardOverview, DashboardLessonItem } from '../../types/dashboard';

export interface TimetableOverviewProps {
  data: TimetableDashboardOverview;
  onNavigateTab: (tabId: string) => void;
}

export const TimetableOverview: React.FC<TimetableOverviewProps> = ({
  data,
  onNavigateTab,
}) => {
  const getStatusBadge = (status: DashboardLessonItem['status']) => {
    switch (status) {
      case 'CURRENT':
        return (
          <Badge variant="primary" size="sm" className="animate-pulse">
            <PlayCircle className="w-3 h-3 ml-1 inline" />
            جارية الآن
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="neutral" size="sm">
            <CheckCircle2 className="w-3 h-3 ml-1 text-emerald-500 inline" />
            انتهت
          </Badge>
        );
      case 'UPCOMING':
      default:
        return (
          <Badge variant="info" size="sm">
            <Clock3 className="w-3 h-3 ml-1 inline" />
            قادمة
          </Badge>
        );
    }
  };

  return (
    <Card
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="font-bold text-slate-900 dark:text-slate-100">
              جدول حصص اليوم ({data.dayNameAr} - {data.date})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              {data.totalLessons} حصص مجدولة
            </Badge>
          </div>
        </div>
      }
      subtitle="استعراض زمني مباشر لحصص اليوم، القاعات الدراسية، والمعلمين المكلفين"
      action={
        <button
          onClick={() => onNavigateTab('timetable')}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          عرض الجدول الأسبوعي الكامل &larr;
        </button>
      }
    >
      <div className="space-y-3">
        {data.lessons.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-2">
            <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              لا توجد حصص مجدولة لهذا اليوم
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {data.dayOfWeek === 5 || data.dayOfWeek === 6
                ? 'اليوم يوافق عطلة نهاية الأسبوع الرسمية (الجمعة / السبت).'
                : 'لم يتم إدراج حصص مجدولة في هذا التاريخ أو لم يتم نشر جدول الفصل بعد.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {data.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className={`p-3 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                  lesson.status === 'CURRENT'
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-xs'
                    : 'bg-white dark:bg-slate-800/70 border-slate-200/60 dark:border-slate-700/70 hover:border-slate-300'
                }`}
              >
                {/* Period & Time */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold font-mono text-sm flex items-center justify-center shrink-0">
                    {lesson.periodNumber}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>{lesson.periodNameAr}</span>
                      <span className="font-mono text-slate-500 font-normal">
                        ({lesson.startTime} - {lesson.endTime})
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <School className="w-3.5 h-3.5 text-blue-500" />
                      <span>{lesson.classNameAr}</span>
                    </div>
                  </div>
                </div>

                {/* Subject & Teacher */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{lesson.subjectNameAr}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lesson.teacherNameAr}</span>
                  </div>
                  {lesson.roomNameAr && (
                    <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{lesson.roomNameAr}</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="shrink-0">{getStatusBadge(lesson.status)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Timetable publishing status */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500">
          <span>
            الفصول المنشورة: {data.publishedClassesCount} | غير المنشورة: {data.unpublishedClassesCount}
          </span>
          <span>
            مكتمل: {data.completedCount} | متبقي: {data.upcomingCount}
          </span>
        </div>
      </div>
    </Card>
  );
};
