import React from 'react';
import { Card } from '../common/Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  iconBg?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendType = 'positive',
  icon: Icon,
  iconBg = 'bg-blue-50 dark:bg-blue-950/60',
  iconColor = 'text-blue-600 dark:text-blue-400',
}) => {
  const trendColor = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-slate-500 dark:text-slate-400',
  };

  return (
    <Card className="hover:shadow-xs transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-tight">
            {title}
          </p>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
            {value}
          </div>
        </div>

        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          {trend && (
            <span className={`font-medium ${trendColor[trendType]}`}>
              {trend}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-400 dark:text-slate-500 text-[11px]">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
