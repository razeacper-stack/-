import React from 'react';
import { Building2, Users, UserCheck, School, ClipboardCheck, CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { BranchDashboardCard } from '../../types/dashboard';
import { formatCurrency } from '../../utils/currency';
import { useTranslation } from '../../context/LanguageContext';

export interface BranchOverviewProps {
  branches: BranchDashboardCard[];
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  canViewFinance: boolean;
}

export const BranchOverview: React.FC<BranchOverviewProps> = ({
  branches,
  selectedBranchId,
  onSelectBranch,
  canViewFinance,
}) => {
  const { direction } = useTranslation();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  if (branches.length === 0) {
    return null;
  }

  return (
    <Card
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-slate-900 dark:text-slate-100">
              نظرة عامة على الفروع المدرسية والمجمعات التعليمية
            </span>
          </div>
          <Badge variant="primary" size="sm">
            {branches.length} فروع تشغيلية
          </Badge>
        </div>
      }
      subtitle="مقارنة تشغيلية فورية للطلاب، المعلمين، الفصول، الحضور، والمؤشرات المالية عبر الفروع"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {branches.map((b) => {
          const isSelected = selectedBranchId === b.branchId;
          return (
            <div
              key={b.branchId}
              onClick={() => onSelectBranch(b.branchId)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                isSelected
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/70 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs'
              }`}
            >
              {/* Branch Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {b.branchNameAr}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    <span className="font-mono">{b.code}</span>
                    <span>&bull;</span>
                    <span>{b.city}</span>
                  </div>
                </div>

                <Badge variant={b.status === 'active' ? 'success' : 'neutral'} size="sm">
                  {b.status === 'active' ? 'نشط' : 'معطل'}
                </Badge>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 mb-0.5">
                    <Users className="w-3 h-3 text-blue-500" />
                    <span>طلاب</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                    {b.studentsCount}
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 mb-0.5">
                    <UserCheck className="w-3 h-3 text-indigo-500" />
                    <span>معلمون</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                    {b.teachersCount}
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 mb-0.5">
                    <School className="w-3 h-3 text-purple-500" />
                    <span>فصول</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                    {b.classesCount}
                  </span>
                </div>
              </div>

              {/* Attendance & Finance Summary */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px]">
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" />
                    نسبة حضور اليوم:
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {b.attendanceRate !== null ? `${b.attendanceRate}%` : 'لا بيانات'}
                  </span>
                </div>

                {canViewFinance && b.financeSummary && (
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                      التحصيل:
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(b.financeSummary.collectedMinor)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Prompt */}
              <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400 pt-1">
                <span>{isSelected ? 'الفرع المحدد حالياً' : 'تحديد والتركيز على الفرع'}</span>
                <ArrowIcon className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
