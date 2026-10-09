import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  FileSpreadsheet,
  Building2,
  Calendar,
  User,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { ReportResult } from '../../types/reports';
import { exportReportToCSV, exportReportToXLSX, downloadFile } from '../../utils/export';
import { triggerReportPrint } from '../../utils/print';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface ReportViewerProps {
  report: ReportResult;
  onBack: () => void;
  onRefresh: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  onBack,
  onRefresh,
}) => {
  const { currentUser, isSuperAdmin, hasPermission } = useAuth();
  const { language, direction } = useTranslation();
  const ArrowIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  // Feedback state for export
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(report.rows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return report.rows.slice(start, start + rowsPerPage);
  }, [report.rows, currentPage, rowsPerPage]);

  const canExport =
    isSuperAdmin ||
    hasPermission('reports.export') ||
    hasPermission('finance.export') ||
    hasPermission('teachers.export') ||
    hasPermission('attendance.export') ||
    hasPermission('timetable.export') ||
    hasPermission('payments.export');

  const canPrint =
    isSuperAdmin ||
    hasPermission('reports.print') ||
    hasPermission('reports.view');

  const handleExportCSV = () => {
    if (!currentUser) return;
    try {
      const csv = exportReportToCSV(currentUser, report);
      const filename = `${report.definition.id}_${report.branchNameAr}_${report.generatedAt.slice(0, 10)}.csv`
        .replace(/\s+/g, '_')
        .toLowerCase();
      downloadFile(csv, filename, 'text/csv;charset=utf-8;');
      setExportFeedback(language === 'ar' ? 'تم تصدير ملف CSV بنجاح' : 'CSV exported successfully');
      setTimeout(() => setExportFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل التصدير');
    }
  };

  const handleExportXLSX = () => {
    if (!currentUser) return;
    try {
      const xml = exportReportToXLSX(currentUser, report);
      const filename = `${report.definition.id}_${report.branchNameAr}_${report.generatedAt.slice(0, 10)}.xls`
        .replace(/\s+/g, '_')
        .toLowerCase();
      downloadFile(xml, filename, 'application/vnd.ms-excel;charset=utf-8;');
      setExportFeedback(language === 'ar' ? 'تم تصدير ملف Excel بنجاح' : 'Excel exported successfully');
      setTimeout(() => setExportFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل التصدير');
    }
  };

  const handlePrint = () => {
    triggerReportPrint(currentUser?.fullName, report.definition.titleAr);
  };

  return (
    <div className="space-y-5">
      {/* Top Action Toolbar (Hidden during Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs no-print">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowIcon className="w-4 h-4 ml-1" />
            <span>{language === 'ar' ? 'كتالوج التقارير' : 'Back to Catalog'}</span>
          </Button>

          <Button variant="outline" size="sm" onClick={onRefresh} title="تحديث البيانات">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          {exportFeedback && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{exportFeedback}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canExport && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600"
              >
                <Download className="w-3.5 h-3.5 ml-1.5 text-blue-600" />
                <span>{language === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportXLSX}
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 ml-1.5 text-emerald-600" />
                <span>{language === 'ar' ? 'تصدير Excel' : 'Export Excel'}</span>
              </Button>
            </>
          )}

          {canPrint && (
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="text-xs font-semibold shadow-sm shadow-blue-500/20"
            >
              <Printer className="w-3.5 h-3.5 ml-1.5" />
              <span>{language === 'ar' ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Printable Document Sheet */}
      <div className="printable-report p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        {/* Official Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>نظام إدارة المدارس المتكامل — فرع: {report.branchNameAr}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {language === 'ar' ? report.definition.titleAr : report.definition.titleEn}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              {language === 'ar' ? report.definition.descriptionAr : report.definition.descriptionEn}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1 sm:text-end shrink-0">
            <div className="text-slate-600 dark:text-slate-300 font-medium">
              تاريخ التقرير: <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{report.generatedAt.slice(0, 10)}</span>
            </div>
            <div className="text-slate-500 text-[11px]">
              المعتمد: <span className="font-semibold text-slate-700 dark:text-slate-300">{report.generatedBy}</span>
            </div>
            {report.academicYearNameAr && (
              <div className="text-slate-500 text-[11px]">
                العام الدراسي: <span className="font-semibold text-slate-700 dark:text-slate-300">{report.academicYearNameAr}</span>
              </div>
            )}
          </div>
        </div>

        {/* Applied Filter Tags */}
        {report.filterSummary.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">معايير التصفية:</span>
            {report.filterSummary.map((f, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
              >
                <span className="text-slate-400 ml-1">{f.labelAr}:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{f.value}</span>
              </span>
            ))}
          </div>
        )}

        {/* Summary KPI Cards */}
        {report.summary && report.summary.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {report.summary.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1"
              >
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  {language === 'ar' ? item.labelAr : item.labelEn}
                </span>
                <div
                  className={`text-lg sm:text-xl font-bold font-mono ${
                    item.color === 'emerald'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : item.color === 'rose'
                      ? 'text-rose-600 dark:text-rose-400'
                      : item.color === 'amber'
                      ? 'text-amber-600 dark:text-amber-400'
                      : item.color === 'purple'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report Data Table */}
        <div className="overflow-x-auto">
          {report.rows.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              لا توجد سجلات مطابقة لمعايير هذا التقرير في الفرع أو الفترة المحددة
            </div>
          ) : (
            <table className="w-full text-xs text-start border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="py-3 px-3 text-start w-12 text-slate-400 font-mono">#</th>
                  {report.columns.map((col) => (
                    <th
                      key={col.key}
                      className={`py-3 px-3 ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'end'
                          ? 'text-end'
                          : 'text-start'
                      }`}
                    >
                      {language === 'ar' ? col.labelAr : col.labelEn}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedRows.map((row, rIdx) => {
                  const absoluteIndex = (currentPage - 1) * rowsPerPage + rIdx + 1;

                  return (
                    <tr
                      key={rIdx}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{absoluteIndex}</td>
                      {report.columns.map((col) => {
                        const cellVal = row[col.key];

                        return (
                          <td
                            key={col.key}
                            className={`py-2.5 px-3 ${
                              col.align === 'center'
                                ? 'text-center'
                                : col.align === 'end'
                                ? 'text-end'
                                : 'text-start'
                            } ${col.isMono ? 'font-mono' : ''}`}
                          >
                            {col.isBadge ? (
                              <Badge
                                variant={
                                  cellVal === 'نشط' || cellVal === 'مقيد' || cellVal === 'معتمد' || cellVal === 'حاضر' || cellVal === 'مسددة'
                                    ? 'success'
                                    : cellVal === 'متأخرة' || cellVal === 'غائب'
                                    ? 'danger'
                                    : cellVal === 'سداد جزئي' || cellVal === 'مسودة'
                                    ? 'warning'
                                    : 'neutral'
                                }
                                size="sm"
                              >
                                {cellVal}
                              </Badge>
                            ) : (
                              <span className="text-slate-800 dark:text-slate-200">
                                {cellVal ?? '-'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination & Total Count Footer (Hidden during print) */}
        {report.rows.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 no-print">
            <div>
              <span>
                عرض {Math.min(report.rows.length, (currentPage - 1) * rowsPerPage + 1)} إلى{' '}
                {Math.min(report.rows.length, currentPage * rowsPerPage)} من إجمالي {report.rows.length} سجل
              </span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 self-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1"
                >
                  <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Button>

                <span className="font-mono px-2 text-xs">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 py-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Official Confidentiality Notice */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {language === 'ar'
                ? 'مستند إداري رسمي سري — مخصص للاستخدام المدرسي المعتمد فقط'
                : 'Confidential Official School Document — Authorized School Personnel Only'}
            </span>
          </div>
          <div>{report.branchNameAr}</div>
        </div>
      </div>
    </div>
  );
};
