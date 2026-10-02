import React from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items = [] }) => {
  const { direction, t } = useTranslation();
  const Separator = direction === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 py-1 overflow-x-auto whitespace-nowrap">
      <div className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
        <Home className="w-3.5 h-3.5" />
        <span>{t('nav.dashboard')}</span>
      </div>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <Separator className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {item.current ? (
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {item.label}
            </span>
          ) : (
            <span className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
