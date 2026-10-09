import React from 'react';
import {
  Building2,
  Calendar,
  RotateCw,
  Printer,
  Download,
  Filter,
} from 'lucide-react';
import { Branch } from '../../types';
import { AcademicYear } from '../../types/academic';
import { Button } from '../common/Button';

export interface DashboardFiltersProps {
  branches: Branch[];
  academicYears: AcademicYear[];
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  selectedYearId: string;
  onYearChange: (yearId: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  canViewCrossBranch: boolean;
  onRefresh: () => void;
  onPrint?: () => void;
  onExportCSV?: () => void;
  isRefreshing?: boolean;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  branches,
  academicYears,
  selectedBranchId,
  onBranchChange,
  selectedYearId,
  onYearChange,
  selectedDate,
  onDateChange,
  canViewCrossBranch,
  onRefresh,
  onPrint,
  onExportCSV,
  isRefreshing = false,
}) => {
  const setToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Filters Group */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
        {/* Branch Filter (if allowed) */}
        {canViewCrossBranch && (
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <select
              value={selectedBranchId}
              onChange={(e) => onBranchChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">كافة الفروع المدرسية (شامل)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameAr}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Academic Year Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <select
            value={selectedYearId}
            onChange={(e) => onYearChange(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.nameAr} {y.isCurrent ? '(الحالي)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">التاريخ:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          />
        </div>

        {/* Quick Date Shortcuts */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={setToday}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
              selectedDate === new Date().toISOString().split('T')[0]
                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            اليوم
          </button>
          <button
            type="button"
            onClick={setYesterday}
            className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            الأمس
          </button>
        </div>
      </div>

      {/* Action Buttons: Refresh, Print, Export */}
      <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="text-xs"
        >
          <RotateCw className={`w-3.5 h-3.5 ml-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          تحديث
        </Button>

        {onPrint && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="text-xs"
          >
            <Printer className="w-3.5 h-3.5 ml-1" />
            طباعة الملخص
          </Button>
        )}

        {onExportCSV && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 ml-1" />
            تصدير CSV
          </Button>
        )}
      </div>
    </div>
  );
};
