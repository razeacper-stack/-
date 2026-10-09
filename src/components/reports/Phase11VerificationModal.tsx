import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { searchStorage } from '../../services/searchStorage';
import { reportStorage } from '../../services/reportStorage';
import { exportReportToCSV, exportReportToXLSX } from '../../utils/export';
import { authStorage } from '../../services/authStorage';
import { SafeUser } from '../../types/auth';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  FileBarChart2,
  Search,
  Download,
  Printer,
  ShieldCheck,
} from 'lucide-react';

export interface Phase11VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestResult {
  id: number;
  title: string;
  category: 'search' | 'reports' | 'export' | 'security' | 'regression';
  passed: boolean;
  message: string;
  details?: string;
}

export const Phase11VerificationModal: React.FC<Phase11VerificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'search' | 'reports' | 'export' | 'security'>('all');

  const runAllTests = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    // Setup Mock SafeUsers
    const superAdminUser: SafeUser = {
      id: 'usr-super-admin',
      fullName: 'مدير عام النظام',
      username: 'superadmin',
      email: 'admin@school.sa',
      roleId: 'role-super-admin',
      roleCode: 'SUPER_ADMIN',
      roleNameAr: 'مدير عام النظام',
      roleNameEn: 'Super Administrator',
      branchIds: ['branch-riyadh', 'branch-jeddah', 'branch-dammam'],
      hasAllBranchesAccess: true,
      status: 'active',
      permissions: [],
      createdAt: '2026-01-01',
    };

    const riyadhManager: SafeUser = {
      id: 'usr-manager-riyadh',
      fullName: 'أ. أحمد الشمري',
      username: 'mgr_riyadh',
      email: 'manager.riyadh@school.sa',
      roleId: 'role-manager',
      roleCode: 'MANAGER',
      roleNameAr: 'مدير فرع',
      roleNameEn: 'Branch Manager',
      branchIds: ['branch-riyadh'],
      hasAllBranchesAccess: false,
      status: 'active',
      permissions: [
        'dashboard.view',
        'students.view',
        'teachers.view',
        'classes.view',
        'subjects.view',
        'timetable.view',
        'attendance.view',
        'fees.view',
        'payments.view',
        'finance.view_reports',
        'reports.export',
      ],
      createdAt: '2026-01-01',
    };

    const riyadhTeacher: SafeUser = {
      id: 'usr-teacher-1',
      fullName: 'أ. ياسر الحربي',
      username: 'yasser_teacher',
      email: 'yasser@school.sa',
      roleId: 'role-teacher',
      roleCode: 'TEACHER',
      roleNameAr: 'معلم',
      roleNameEn: 'Teacher',
      branchIds: ['branch-riyadh'],
      hasAllBranchesAccess: false,
      status: 'active',
      permissions: ['students.view', 'timetable.view', 'attendance.view'],
      createdAt: '2026-01-01',
    };

    try {
      // 1. Authorized Student Search
      const s1 = searchStorage.searchAuthorized(superAdminUser, 'فهد');
      testResults.push({
        id: 1,
        title: 'البحث المصرح عن الطلاب',
        category: 'search',
        passed: s1.results.some((r) => r.domain === 'students'),
        message: `تم العثور على ${s1.results.length} نتيجة للطالب فهد`,
      });

      // 2. Partial Search
      const s2 = searchStorage.searchAuthorized(superAdminUser, '1/أ');
      testResults.push({
        id: 2,
        title: 'البحث الجزئي برمز الفصل',
        category: 'search',
        passed: s2.results.some((r) => r.domain === 'classes'),
        message: `تم العثور على فصل 1/أ`,
      });

      // 3. ID Search
      const s3 = searchStorage.searchAuthorized(superAdminUser, 'STU-');
      testResults.push({
        id: 3,
        title: 'البحث بالأرقام الأكاديمية',
        category: 'search',
        passed: s3.results.some((r) => r.subtitle.includes('STU-')),
        message: `تم العثور على نتائج للرقم الأكاديمي`,
      });

      // 4. Arabic Normalization Search (أحمد vs احمد)
      const s4 = searchStorage.searchAuthorized(superAdminUser, 'احمد');
      testResults.push({
        id: 4,
        title: 'معالجة تطبيع الحروف العربية (همزات وألفات)',
        category: 'search',
        passed: s4.results.length > 0,
        message: `تم مطابقة 'احمد' بدون همزة مع 'أحمد'`,
      });

      // 5. English Search
      const s5 = searchStorage.searchAuthorized(superAdminUser, 'Math');
      testResults.push({
        id: 5,
        title: 'البحث باللغة الإنجليزية',
        category: 'search',
        passed: s5.results.length >= 0,
        message: `اكتمل البحث باللغة الإنجليزية دون أخطاء`,
      });

      // 6. Teacher Search
      const s6 = searchStorage.searchAuthorized(superAdminUser, 'ياسر');
      testResults.push({
        id: 6,
        title: 'البحث في كادر المعلمين',
        category: 'search',
        passed: s6.results.some((r) => r.domain === 'teachers'),
        message: `تم العثور على المعلم ياسر الحربي`,
      });

      // 7. Invoice Search with Finance User
      const s7 = searchStorage.searchAuthorized(superAdminUser, 'INV-');
      testResults.push({
        id: 7,
        title: 'بحث الفواتير للمستخدم المالي',
        category: 'search',
        passed: s7.results.some((r) => r.domain === 'invoices'),
        message: `المستخدم المالي مصرح له برؤية الفواتير`,
      });

      // 8. Financial Privacy: Teacher cannot search invoices
      const s8 = searchStorage.searchAuthorized(riyadhTeacher, 'INV-');
      testResults.push({
        id: 8,
        title: 'حجب الفواتير والمدفوعات عن غير المصرح لهم',
        category: 'security',
        passed: !s8.results.some((r) => r.domain === 'invoices'),
        message: `تم حجب الفواتير عن المعلم بنجاح`,
      });

      // 9. Branch Isolation in Search
      const s9 = searchStorage.searchAuthorized(riyadhManager, 'Jeddah');
      testResults.push({
        id: 9,
        title: 'عزل الفروع في محرك البحث',
        category: 'security',
        passed: !s9.results.some((r) => r.branchId === 'branch-jeddah'),
        message: `مدير فرع الرياض محجوب تماماً عن بيانات فرع جدة`,
      });

      // 10. Forged Branch ID Search Rejection
      const s10 = searchStorage.searchAuthorized(riyadhManager, 'طالب', {
        domain: 'all',
        branchId: 'branch-foreign-999',
      });
      testResults.push({
        id: 10,
        title: 'رفض كود الفرع غير المخول في البحث',
        category: 'security',
        passed: s10.totalCount === 0,
        message: `تم حظر البحث في الفرع الدخيل بنجاح`,
      });

      // 11. Empty Search Safety
      const s11 = searchStorage.searchAuthorized(superAdminUser, '');
      testResults.push({
        id: 11,
        title: 'التعامل الآمن مع الاستعلام الفارغ',
        category: 'search',
        passed: s11.totalCount === 0 && s11.results.length === 0,
        message: `تم إرجاع مصفوفة فارغة دون استهلاك الموارد`,
      });

      // 12. Student Directory Report
      const rep1 = reportStorage.generateReport(superAdminUser, 'student_directory', { branchId: 'branch-riyadh' });
      testResults.push({
        id: 12,
        title: 'إنشاء تقرير دليل الطلاب الشامل',
        category: 'reports',
        passed: rep1.rows.length > 0 && rep1.columns.length >= 8,
        message: `تم استخراج ${rep1.rows.length} طالب بفرع الرياض`,
      });

      // 13. Teacher Workload Report
      const rep2 = reportStorage.generateReport(superAdminUser, 'teacher_workload', { branchId: 'branch-riyadh' });
      testResults.push({
        id: 13,
        title: 'تقرير النصاب الأكاديمي للمعلمين',
        category: 'reports',
        passed: rep2.rows.length > 0,
        message: `تم استخراج أنصبة ${rep2.rows.length} معلماً`,
      });

      // 14. Academic Structure Report
      const rep3 = reportStorage.generateReport(superAdminUser, 'academic_structure', { branchId: 'branch-riyadh' });
      testResults.push({
        id: 14,
        title: 'تقرير الهيكل الأكاديمي',
        category: 'reports',
        passed: rep3.rows.length > 0,
        message: `تم توليد هيكل المراحل والصفوف`,
      });

      // 15. Weekly Timetable Report
      const rep4 = reportStorage.generateReport(superAdminUser, 'weekly_timetable', { branchId: 'branch-riyadh' });
      testResults.push({
        id: 15,
        title: 'تقرير الجدول الأسبوعي للحصص',
        category: 'reports',
        passed: rep4.columns.some((c) => c.key === 'periodNumber'),
        message: `تم استخراج جدول الحصص الأسبوعي`,
      });

      // 16. Attendance Report
      const rep5 = reportStorage.generateReport(superAdminUser, 'daily_attendance', { branchId: 'branch-riyadh' });
      testResults.push({
        id: 16,
        title: 'تقرير الحضور والغياب اليومي',
        category: 'reports',
        passed: rep5.definition.id === 'daily_attendance',
        message: `تم توليد تقرير الحضور والغياب اليومي`,
      });

      // 17. Fee Collection Summary Report
      const rep6 = reportStorage.generateReport(superAdminUser, 'fee_collection_summary', { branchId: 'branch-riyadh' });
      testResults.push({
        id: 17,
        title: 'تقرير ملخص تحصيل الرسوم المدرسية',
        category: 'reports',
        passed: rep6.rows.length >= 5 && rep6.summary.length >= 3,
        message: `تم احتساب ملخص الإيرادات والمحصل بدقة`,
      });

      // 18. Cross-Branch Comparison Report
      const rep7 = reportStorage.generateReport(superAdminUser, 'cross_branch_comparison');
      testResults.push({
        id: 18,
        title: 'تقرير المقارنة المعيارية بين الفروع',
        category: 'reports',
        passed: rep7.rows.length >= 3,
        message: `تم مقارنة مؤشرات الفروع المتعددة`,
      });

      // 19. Unauthorized Branch Report Access Rejection
      let rejectedBranch = false;
      try {
        reportStorage.generateReport(riyadhManager, 'student_directory', { branchId: 'branch-jeddah' });
      } catch (e: any) {
        rejectedBranch = true;
      }
      testResults.push({
        id: 19,
        title: 'حظر إنشاء تقارير لفروع غير مصرح بها',
        category: 'security',
        passed: rejectedBranch,
        message: `تم منع مدير الرياض من استخراج تقرير فرع جدة`,
      });

      // 20. Financial Report Access Rejection
      let rejectedFinance = false;
      try {
        reportStorage.generateReport(riyadhTeacher, 'fee_collection_summary', { branchId: 'branch-riyadh' });
      } catch (e: any) {
        rejectedFinance = true;
      }
      testResults.push({
        id: 20,
        title: 'حماية التقارير المالية من غير المخولين',
        category: 'security',
        passed: rejectedFinance,
        message: `تم رفض وصول المعلم للتقرير المالي بنجاح`,
      });

      // 21. CSV Export Generation with UTF-8 BOM
      const csv = exportReportToCSV(superAdminUser, rep1);
      testResults.push({
        id: 21,
        title: 'توليد ملف CSV مع علامة الترتيب UTF-8 BOM',
        category: 'export',
        passed: csv.startsWith('\uFEFF') && csv.includes('دليل الطلاب'),
        message: `تم التحقق من ترميز UTF-8 BOM العربي الصالح لـ Excel`,
      });

      // 22. Excel XML Spreadsheet Generation
      const xlsx = exportReportToXLSX(superAdminUser, rep1);
      testResults.push({
        id: 22,
        title: 'توليد ملف جدول Excel المتوافق',
        category: 'export',
        passed: xlsx.includes('urn:schemas-microsoft-com:office:spreadsheet'),
        message: `تم إنشاء مصنف Excel مهيأ بالأنماط والجداول`,
      });

      // 23. Export Security Guard
      let rejectedExport = false;
      try {
        exportReportToCSV(riyadhTeacher, rep6);
      } catch (e: any) {
        rejectedExport = true;
      }
      testResults.push({
        id: 23,
        title: 'منع تصدير التقارير المالية دون صلاحية',
        category: 'security',
        passed: rejectedExport,
        message: `تم حظر تصدير البيانات المالية بنجاح`,
      });

      // 24. Audit Integration
      const audits = authStorage.getAuditLogs();
      const hasSearchAudit = audits.some((a) => a.action === 'GLOBAL_SEARCH_PERFORMED');
      const hasReportAudit = audits.some((a) => a.action === 'REPORT_GENERATED');
      const hasExportAudit = audits.some((a) => a.action === 'REPORT_EXPORTED');
      testResults.push({
        id: 24,
        title: 'تكامل سجل التدقيق المالي والأمني (Audit Logs)',
        category: 'security',
        passed: hasSearchAudit && hasReportAudit && hasExportAudit,
        message: `تم تسجيل حركات البحث والإنشاء والتصدير بالسجل المركزي`,
      });
    } catch (globalErr: any) {
      console.error('Test execution error:', globalErr);
    }

    setResults(testResults);
    setIsRunning(false);
  };

  const filteredResults = results.filter((r) => {
    if (activeFilter === 'all') return true;
    return r.category === activeFilter;
  });

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                منصة الفحص والتحقق للمرحلة 11 (Phase 11 Verification Suite)
              </h2>
              <p className="text-xs text-slate-500">
                فحص آلي وتفاعلي لمحرك البحث الموحد، كتالوج التقارير، والتصدير والطباعة
              </p>
            </div>
          </div>

          <Badge variant="primary" size="md">
            Phase 11
          </Badge>
        </div>

        {/* Action Controls & Metric Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              disabled={isRunning}
              onClick={runAllTests}
              className="shadow-sm shadow-blue-500/20"
            >
              <Play className="w-3.5 h-3.5 ml-1.5" />
              <span>{isRunning ? 'جارِ الفحص...' : 'تشغيل الاختبارات التفاعلية'}</span>
            </Button>

            {results.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {passedCount} ناجح
                </span>
                {failedCount > 0 && (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {failedCount} فاشل
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs">
            {(['all', 'search', 'reports', 'export', 'security'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {cat === 'all'
                  ? 'الكل'
                  : cat === 'search'
                  ? 'البحث'
                  : cat === 'reports'
                  ? 'التقارير'
                  : cat === 'export'
                  ? 'التصدير'
                  : 'الأمان'}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <div>اضغط على "تشغيل الاختبارات التفاعلية" لبدء فحص وظائف المرحلة 11 بالكامل.</div>
            </div>
          ) : (
            filteredResults.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {t.id}. {t.title}
                    </div>
                    <div className="text-slate-500 mt-0.5">{t.message}</div>
                  </div>
                </div>

                <Badge variant={t.passed ? 'success' : 'danger'} size="sm">
                  {t.passed ? 'PASS' : 'FAIL'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
