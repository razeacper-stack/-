import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
  };
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  onClick?: () => void;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600 dark:text-blue-400',
  iconBg = 'bg-blue-50 dark:bg-blue-950/60',
  badge,
  trend,
  onClick,
  className = '',
}) => {
  return (
    <Card
      onClick={onClick}
      className={`transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={`p-2.5 rounded-2xl ${iconBg} ${iconColor} shadow-xs`}>
            <Icon className="w-5 h-5" />
          </div>
          {badge && (
            <Badge variant={badge.variant} size="sm">
              {badge.text}
            </Badge>
          )}
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          {trend.direction === 'up' && (
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
          {trend.direction === 'down' && (
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          )}
          <span>{trend.label}</span>
        </div>
      )}
    </Card>
  );
};
