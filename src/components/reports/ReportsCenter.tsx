import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { useTranslation } from '../../context/LanguageContext';
import { ReportDefinition, ReportFilterParams, ReportResult } from '../../types/reports';
import { reportStorage } from '../../services/reportStorage';
import { ReportCatalog } from './ReportCatalog';
import { ReportViewer } from './ReportViewer';
import { ReportFilters } from './ReportFilters';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { AlertCircle } from 'lucide-react';

export interface ReportsCenterProps {
  initialReportId?: string;
}

export const ReportsCenter: React.FC<ReportsCenterProps> = ({ initialReportId }) => {
  const { currentUser } = useAuth();
  const { activeBranchId } = useBranch();
  const { language } = useTranslation();

  const allDefinitions = useMemo(() => reportStorage.getReportDefinitions(), []);

  const [selectedReportDef, setSelectedReportDef] = useState<ReportDefinition | null>(() => {
    if (initialReportId) {
      return allDefinitions.find((d) => d.id === initialReportId) || null;
    }
    return null;
  });

  const [filters, setFilters] = useState<ReportFilterParams>({
    branchId: activeBranchId || 'all',
  });

  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync branch filter when activeBranchId changes
  useEffect(() => {
    if (activeBranchId) {
      setFilters((prev) => ({ ...prev, branchId: activeBranchId }));
    }
  }, [activeBranchId]);

  const loadReport = useCallback(() => {
    if (!currentUser || !selectedReportDef) return;
    setError(null);
    try {
      const result = reportStorage.generateReport(currentUser, selectedReportDef.id, filters);
      setReportResult(result);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء التقرير');
      setReportResult(null);
    }
  }, [currentUser, selectedReportDef, filters]);

  useEffect(() => {
    if (selectedReportDef) {
      loadReport();
    } else {
      setReportResult(null);
    }
  }, [selectedReportDef, loadReport]);

  const handleSelectReport = (def: ReportDefinition) => {
    setSelectedReportDef(def);
    setFilters({ branchId: activeBranchId || 'all' });
  };

  const handleBackToCatalog = () => {
    setSelectedReportDef(null);
    setReportResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* If No Report Selected: Show Catalog */}
      {!selectedReportDef ? (
        <ReportCatalog onSelectReport={handleSelectReport} />
      ) : (
        <div className="space-y-5">
          {/* Contextual Filters Bar */}
          <ReportFilters
            definition={selectedReportDef}
            filters={filters}
            onChangeFilters={setFilters}
            onReset={() => setFilters({ branchId: activeBranchId || 'all' })}
          />

          {/* Error Message if Any */}
          {error && (
            <Card className="p-6 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">
                    {language === 'ar' ? 'تعذر إنشاء التقرير' : 'Unable to Generate Report'}
                  </h4>
                  <p className="text-xs">{error}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBackToCatalog}>
                  {language === 'ar' ? 'العودة للكتالوج' : 'Back to Catalog'}
                </Button>
                <Button variant="primary" size="sm" onClick={loadReport}>
                  {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </Button>
              </div>
            </Card>
          )}

          {/* Report Viewer Document */}
          {reportResult && !error && (
            <ReportViewer
              report={reportResult}
              onBack={handleBackToCatalog}
              onRefresh={loadReport}
            />
          )}
        </div>
      )}
    </div>
  );
};
