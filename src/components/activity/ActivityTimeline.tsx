import React from 'react';
import {
  History,
  ShieldAlert,
  Clock,
  User,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  CreditCard,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ActivityEvent } from '../../types/activity';
import { useTranslation } from '../../context/LanguageContext';
import { Badge } from '../common/Badge';

export interface ActivityTimelineProps {
  events: ActivityEvent[];
  onSelectEvent: (event: ActivityEvent) => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  events,
  onSelectEvent,
}) => {
  const { language } = useTranslation();

  const getEventIcon = (event: ActivityEvent) => {
    if (event.isSecuritySensitive || event.result === 'DENIED') {
      return <ShieldAlert className="w-4 h-4 text-rose-500" />;
    }
    if (event.category === 'AI') {
      return <Sparkles className="w-4 h-4 text-purple-500" />;
    }
    if (event.isFinancial) {
      return <CreditCard className="w-4 h-4 text-emerald-500" />;
    }
    if (event.result === 'SUCCESS') {
      return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
    }
    return <History className="w-4 h-4 text-slate-500" />;
  };

  const getResultBadge = (event: ActivityEvent) => {
    switch (event.result) {
      case 'SUCCESS':
        return <Badge variant="success" size="sm">ناجح</Badge>;
      case 'DENIED':
        return <Badge variant="danger" size="sm">محجوب</Badge>;
      case 'FAILED':
        return <Badge variant="danger" size="sm">فشل</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{event.result}</Badge>;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'SECURITY':
      case 'ERROR':
        return 'danger';
      case 'WARNING':
        return 'warning';
      case 'SUCCESS':
        return 'success';
      default:
        return 'primary';
    }
  };

  if (events.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6">
        <History className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {language === 'ar' ? 'لا توجد نشاطات أو عمليات مطابقة للفلتر' : 'No activity records match your criteria'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          {language === 'ar'
            ? 'جرب تغيير شروط التصفية أو اختيار فترة زمنية أوسع للاطلاع على السجلات.'
            : 'Try broadening your filters or selecting a different time preset.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const isDenied = event.result === 'DENIED' || event.isSecuritySensitive;
        return (
          <div
            key={event.id}
            onClick={() => onSelectEvent(event)}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer group ${
              isDenied
                ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40 hover:border-rose-400'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-2xs hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {/* Event Icon */}
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
                    isDenied
                      ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-200 dark:border-rose-800'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  {getEventIcon(event)}
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {event.action}
                    </span>
                    {getResultBadge(event)}
                    <Badge variant={getSeverityBadgeVariant(event.severity)} size="sm">
                      {event.severity}
                    </Badge>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono font-medium">
                      {event.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {event.details}
                  </p>

                  {/* Footnote Metadata */}
                  <div className="flex items-center gap-3 mt-2.5 text-[11px] text-slate-400 flex-wrap">
                    <div className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{event.actorName}</span>
                      <span className="font-normal text-slate-400">({event.actorRole})</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400" />
                      <span>{event.branchNameAr}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{event.timeAgo}</span>
                      <span className="hidden sm:inline">
                        •{' '}
                        {new Date(event.timestamp).toLocaleTimeString(
                          language === 'ar' ? 'ar-SA' : 'en-US',
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </span>
                    </div>

                    {event.targetIdentifier && (
                      <span className="font-mono text-[10px] bg-slate-50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50">
                        {event.targetIdentifier}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details arrow */}
              <div className="shrink-0 text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
