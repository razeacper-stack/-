import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useBranch } from '../../context/BranchContext';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { formatCurrency, toMajorUnits } from '../../utils/currency';
import {
  PopulatedInvoice,
  PopulatedPayment,
  FeeStructure,
  InvoiceStatus,
  PaymentMethod,
  ReceiptData,
} from '../../types/finance';
import { InvoiceModal } from './InvoiceModal';
import { PaymentModal } from './PaymentModal';
import { RefundModal } from './RefundModal';
import { FeeStructureModal } from './FeeStructureModal';
import { FeeAssignmentModal } from './FeeAssignmentModal';
import { ReceiptModal } from './ReceiptModal';
import { Phase9VerificationModal } from './Phase9VerificationModal';
import {
  DollarSign,
  Plus,
  Layers,
  UserCheck,
  CreditCard,
  RotateCcw,
  FileText,
  BarChart3,
  Search,
  Filter,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  XCircle,
  Eye,
  TrendingUp,
  Receipt,
  User,
  Calendar,
  Building,
} from 'lucide-react';

export const FeesManagement: React.FC = () => {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const { activeBranchId, branches } = useBranch();
  const { years, stages, grades, classes } = useAcademic();
  const { students } = useStudents();

  const {
    feeStructures,
    invoices,
    payments,
    refunds,
    assignments,
    dashboardMetrics,
    isLoading,
    refreshFinance,
    voidInvoice,
    issueDraftInvoice,
    toggleFeeStructure,
    generateReport,
    exportReportToCSV,
    generateReceiptData,
  } = useFinance();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'invoices' | 'payments' | 'structures' | 'assignments' | 'refunds' | 'reports' | 'statement'
  >('overview');

  // Modal States
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Selected entities for modals
  const [selectedInvoice, setSelectedInvoice] = useState<PopulatedInvoice | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PopulatedPayment | null>(null);
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [statementStudentId, setStatementStudentId] = useState<string>('');

  // Reports Sub-tab State
  const [reportKey, setReportKey] = useState<
    | 'outstanding_fees'
    | 'paid_fees'
    | 'daily_collection'
    | 'payment_method'
    | 'overdue_fees'
    | 'discounts'
    | 'scholarships'
    | 'refunds'
    | 'invoice_register'
    | 'student_statement'
  >('outstanding_fees');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  const currentBranch = branches.find((b) => b.id === activeBranchId);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
      if (selectedYearId && inv.academicYearId !== selectedYearId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
        const matchName =
          inv.studentNameAr.toLowerCase().includes(q) || inv.studentNameEn.toLowerCase().includes(q);
        const matchStdNum = inv.studentNumber.toLowerCase().includes(q);
        if (!matchNum && !matchName && !matchStdNum) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, selectedYearId, searchQuery]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (methodFilter !== 'ALL' && p.method !== methodFilter) return false;
      if (selectedYearId && p.academicYearId !== selectedYearId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = p.receiptNumber.toLowerCase().includes(q);
        const matchName =
          p.studentNameAr.toLowerCase().includes(q) || p.studentNameEn.toLowerCase().includes(q);
        const matchStdNum = p.studentNumber.toLowerCase().includes(q);
        const matchInv = p.invoiceNumber.toLowerCase().includes(q);
        if (!matchNum && !matchName && !matchStdNum && !matchInv) return false;
      }
      return true;
    });
  }, [payments, methodFilter, selectedYearId, searchQuery]);

  // Handle Pay from Invoice Table
  const handleOpenPayment = (inv: PopulatedInvoice) => {
    setSelectedInvoice(inv);
    setIsPaymentModalOpen(true);
  };

  // Handle Refund from Payment Table
  const handleOpenRefund = (pay: PopulatedPayment) => {
    setSelectedPayment(pay);
    setIsRefundModalOpen(true);
  };

  // Handle View Receipt
  const handleViewReceipt = (pay: PopulatedPayment) => {
    const inv = invoices.find((i) => i.id === pay.invoiceId);
    const receipt = generateReceiptData(pay, inv);
    setActiveReceipt(receipt);
    setIsReceiptModalOpen(true);
  };

  // Handle Payment Success
  const handlePaymentSuccess = (receipt: ReceiptData) => {
    setActiveReceipt(receipt);
    setIsReceiptModalOpen(true);
  };

  // Void Invoice
  const handleVoidInvoice = async (inv: PopulatedInvoice) => {
    const reason = window.prompt('يرجى كتابة سبب ومبرر إبطال الفاتورة (Void Reason):');
    if (!reason || !reason.trim()) return;
    try {
      await voidInvoice(inv.id, reason.trim());
    } catch (err: any) {
      alert(err.message || 'فشل إبطال الفاتورة');
    }
  };

  // Issue Draft Invoice
  const handleIssueDraft = async (inv: PopulatedInvoice) => {
    if (!window.confirm(`هل أنت متأكد من اعتماد وإصدار الفاتورة (${inv.invoiceNumber}) رسمياً؟`)) return;
    try {
      await issueDraftInvoice(inv.id);
    } catch (err: any) {
      alert(err.message || 'فشل إصدار الفاتورة');
    }
  };

  // Toggle Structure
  const handleToggleStructure = async (s: FeeStructure) => {
    try {
      await toggleFeeStructure(s.id);
    } catch (err: any) {
      alert(err.message || 'فشل تغيير حالة الهيكل');
    }
  };

  // Status Badge Helper
  const getInvoiceStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success" size="sm">مسددة بالكامل</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="warning" size="sm">مسددة جزئياً</Badge>;
      case 'ISSUED':
        return <Badge variant="info" size="sm">صادرة مستحقة</Badge>;
      case 'OVERDUE':
        return <Badge variant="danger" size="sm">متأخرة السداد</Badge>;
      case 'DRAFT':
        return <Badge variant="neutral" size="sm">مسودة</Badge>;
      case 'VOID':
        return <Badge variant="neutral" size="sm">ملغاة (Void)</Badge>;
      case 'REFUNDED':
        return <Badge variant="info" size="sm">مستردة</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  // Export Report to CSV
  const handleExportCSV = () => {
    try {
      const csv = exportReportToCSV(reportKey, {
        branchId: activeBranchId,
        academicYearId: selectedYearId || undefined,
        startDate: reportStartDate || undefined,
        endDate: reportEndDate || undefined,
        studentId: statementStudentId || undefined,
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportKey}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'فشل تصدير التقرير');
    }
  };

  // Active Report Data
  const activeReportData = useMemo(() => {
    if (activeTab !== 'reports') return null;
    try {
      return generateReport(reportKey, {
        branchId: activeBranchId,
        academicYearId: selectedYearId || undefined,
        startDate: reportStartDate || undefined,
        endDate: reportEndDate || undefined,
        studentId: statementStudentId || undefined,
      });
    } catch (e) {
      return null;
    }
  }, [activeTab, reportKey, activeBranchId, selectedYearId, reportStartDate, reportEndDate, statementStudentId, generateReport]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/60 shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  إدارة الرسوم والمستحقات المالية (Fees & Financial Management)
                </h1>
                <Badge variant="primary" size="sm">Phase 9 Active</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                الفرع الحالي: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentBranch?.nameAr || 'كافة الفروع'}</span> — حسابات دقيقة بالوحدات الصغرى، سندات قبض واسترداد معتمدة.
              </p>
            </div>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTestModalOpen(true)}
            className="border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <ShieldCheck className="w-4 h-4 ml-1.5 text-emerald-600" />
            حزمة اختبارات المرحلة 9 (38)
          </Button>

          {hasPermission('fees.create') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsInvoiceModalOpen(true)}
            >
              <Plus className="w-4 h-4 ml-1.5" />
              إصدار فاتورة جديدة
            </Button>
          )}

          {hasPermission('fees.manage_structures') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStructure(null);
                setIsStructureModalOpen(true);
              }}
            >
              <Layers className="w-4 h-4 ml-1.5 text-blue-600" />
              إضافة هيكل رسوم
            </Button>
          )}

          {hasPermission('fees.assign') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAssignmentModalOpen(true)}
            >
              <UserCheck className="w-4 h-4 ml-1.5 text-emerald-600" />
              إسناد رسوم لطالب
            </Button>
          )}
        </div>
      </div>

      {/* Main Module Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'overview', label: 'لوحة المؤشرات المالية', icon: BarChart3 },
          { id: 'invoices', label: `سجل الفواتير (${invoices.length})`, icon: FileText },
          { id: 'payments', label: `سندات القبض (${payments.length})`, icon: CreditCard },
          { id: 'structures', label: `هياكل الرسوم (${feeStructures.length})`, icon: Layers },
          { id: 'assignments', label: `إسناد الرسوم (${assignments.length})`, icon: UserCheck },
          { id: 'refunds', label: `سندات الاسترداد (${refunds.length})`, icon: RotateCcw },
          { id: 'reports', label: 'التقارير المالية (10)', icon: FileCheck },
          { id: 'statement', label: 'كشف حساب الطالب', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap font-medium ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FINANCIAL OVERVIEW / DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>إجمالي المطالبات الصافية</span>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-2">
                {formatCurrency(dashboardMetrics?.totalInvoicedMinor || 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                خصومات: {formatCurrency(dashboardMetrics?.totalDiscountsMinor || 0)}
              </div>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                <span className="font-semibold">إجمالي المحصل الفعلي</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                {formatCurrency(dashboardMetrics?.netCollectionMinor || 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                استرداد: {formatCurrency(dashboardMetrics?.totalRefundsMinor || 0)}
              </div>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
                <span className="font-semibold">الرصيد المستحق القائم</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
                {formatCurrency(dashboardMetrics?.outstandingBalanceMinor || 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                نسبة التحصيل: <span className="font-bold text-blue-600">{dashboardMetrics?.collectionRatePercentage || 0}%</span>
              </div>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-red-600 dark:text-red-400">
                <span className="font-semibold">المتأخرات المتجاوزة للموعد</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold font-mono text-red-600 dark:text-red-400 mt-2">
                {formatCurrency(dashboardMetrics?.overdueAmountMinor || 0)}
              </div>
              <div className="text-[11px] text-red-500/80 mt-1">
                تحتاج متابعة وتواصل مع أولياء الأمور
              </div>
            </Card>
          </div>

          {/* Collection Progress & Methods Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>مؤشر التحصيل المالي للفصل الحالي</span>
                </div>
                <Badge variant="primary" size="sm">
                  {dashboardMetrics?.collectionRatePercentage || 0}% إنجاز
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${dashboardMetrics?.collectionRatePercentage || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>المحصل: {formatCurrency(dashboardMetrics?.netCollectionMinor || 0)}</span>
                  <span>الهدف الكلي: {formatCurrency(dashboardMetrics?.totalInvoicedMinor || 0)}</span>
                </div>
              </div>

              {/* Status Breakdown Chips */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  توزيع الفواتير حسب حالة السداد:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                    <div className="text-[11px] text-emerald-700">مسددة بالكامل</div>
                    <div className="font-bold font-mono text-emerald-800 dark:text-emerald-300 mt-0.5">
                      {dashboardMetrics?.invoicesCountByStatus.PAID || 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                    <div className="text-[11px] text-amber-700">سداد جزئي</div>
                    <div className="font-bold font-mono text-amber-800 dark:text-amber-300 mt-0.5">
                      {dashboardMetrics?.invoicesCountByStatus.PARTIALLY_PAID || 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                    <div className="text-[11px] text-blue-700">صادرة قائمة</div>
                    <div className="font-bold font-mono text-blue-800 dark:text-blue-300 mt-0.5">
                      {dashboardMetrics?.invoicesCountByStatus.ISSUED || 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                    <div className="text-[11px] text-red-700">متأخرة</div>
                    <div className="font-bold font-mono text-red-800 dark:text-red-300 mt-0.5">
                      {dashboardMetrics?.invoicesCountByStatus.OVERDUE || 0}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Methods */}
            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>التحصيل حسب وسيلة الدفع</span>
              </div>

              <div className="space-y-2 text-xs">
                {dashboardMetrics?.paymentsCountByMethod &&
                  Object.entries(dashboardMetrics.paymentsCountByMethod).map(([method, data]) => {
                    if (data.count === 0) return null;
                    return (
                      <div
                        key={method}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {method}
                          </span>
                          <span className="text-[11px] text-slate-400">({data.count} عمليات)</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-600">
                          {formatCurrency(data.totalMinor)}
                        </span>
                      </div>
                    );
                  })}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">سندات القبض المسجلة:</span>
                <span className="font-bold font-mono">{payments.length}</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INVOICES LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'invoices' && (
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث برقم الفاتورة، الطالب..."
                  className="w-full pl-3 pr-8 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="ALL">كافة الحالات</option>
                <option value="PAID">مسددة بالكامل (Paid)</option>
                <option value="PARTIALLY_PAID">مسددة جزئياً (Partially Paid)</option>
                <option value="ISSUED">صادرة قائمة (Issued)</option>
                <option value="OVERDUE">متأخرة (Overdue)</option>
                <option value="DRAFT">مسودة (Draft)</option>
                <option value="VOID">ملغاة (Void)</option>
              </select>

              <select
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="">كافة الأعوام الدراسية</option>
                {years.filter((y) => y.branchId === activeBranchId).map((y) => (
                  <option key={y.id} value={y.id}>{y.nameAr}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsInvoiceModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 ml-1" />
                فاتورة جديدة
              </Button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-800">
                  <th className="py-2.5 px-3">رقم الفاتورة</th>
                  <th className="py-2.5 px-3">الطالب</th>
                  <th className="py-2.5 px-3">تاريخ الإصدار / الاستحقاق</th>
                  <th className="py-2.5 px-3">الإجمالي الأولي</th>
                  <th className="py-2.5 px-3">الخصومات والمنح</th>
                  <th className="py-2.5 px-3">صافي المطالبة</th>
                  <th className="py-2.5 px-3">المسدد</th>
                  <th className="py-2.5 px-3">المتبقي المطلوب</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      لا توجد فواتير مطابقة لمعايير البحث الحالية
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{inv.studentNameAr}</div>
                        <div className="text-[11px] font-mono text-slate-400">{inv.studentNumber}</div>
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        <div>إصدار: {inv.issueDate}</div>
                        <div className="text-slate-500">استحقاق: {inv.dueDate}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{formatCurrency(inv.subtotalMinor)}</td>
                      <td className="py-2.5 px-3 font-mono text-red-600">
                        {inv.discountTotalMinor + inv.scholarshipTotalMinor > 0
                          ? `-${formatCurrency(inv.discountTotalMinor + inv.scholarshipTotalMinor)}`
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">{formatCurrency(inv.netTotalMinor)}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600 font-semibold">{formatCurrency(inv.paidTotalMinor)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-600">
                        {inv.balanceDueMinor > 0 ? formatCurrency(inv.balanceDueMinor) : '0.00 ر.س'}
                      </td>
                      <td className="py-2.5 px-3">{getInvoiceStatusBadge(inv.status)}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {inv.status === 'DRAFT' && hasPermission('fees.issue') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleIssueDraft(inv)}
                              className="text-[11px] py-1 px-2"
                            >
                              اعتماد وإصدار
                            </Button>
                          )}

                          {inv.status !== 'PAID' && inv.status !== 'VOID' && inv.status !== 'DRAFT' && hasPermission('payments.create') && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenPayment(inv)}
                              className="text-[11px] py-1 px-2"
                            >
                              <CreditCard className="w-3 h-3 ml-1" />
                              سداد دفعة
                            </Button>
                          )}

                          {inv.status !== 'PAID' && inv.status !== 'VOID' && hasPermission('fees.void') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVoidInvoice(inv)}
                              className="text-[11px] py-1 px-2 text-red-600 hover:bg-red-50"
                            >
                              إبطال
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAYMENTS & RECEIPTS LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث برقم السند، الطالب، الفاتورة..."
                  className="w-full pl-3 pr-8 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="ALL">كافة وسائل الدفع</option>
                <option value="BANK_TRANSFER">تحويل مصرفي (Bank Transfer)</option>
                <option value="CARD">بطاقة بنكية / مدى (POS Card)</option>
                <option value="CASH">نقداً (Cash)</option>
                <option value="CHEQUE">شيك مصرفي (Cheque)</option>
                <option value="ONLINE">دفع إلكتروني (Online)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-800">
                  <th className="py-2.5 px-3">رقم سند القبض</th>
                  <th className="py-2.5 px-3">الطالب</th>
                  <th className="py-2.5 px-3">رقم الفاتورة</th>
                  <th className="py-2.5 px-3">تاريخ السداد</th>
                  <th className="py-2.5 px-3">المبلغ المقبوض</th>
                  <th className="py-2.5 px-3">وسيلة الدفع</th>
                  <th className="py-2.5 px-3">الرقم المرجعي</th>
                  <th className="py-2.5 px-3">المستلم المعتمد</th>
                  <th className="py-2.5 px-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      لا توجد سندات قبض مسجلة مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {pay.receiptNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{pay.studentNameAr}</div>
                        <div className="text-[11px] font-mono text-slate-400">{pay.studentNumber}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-blue-600">{pay.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">{pay.paymentDate}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(pay.amountMinor)}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="neutral" size="sm">{pay.method}</Badge>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{pay.reference || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{pay.receivedByName}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReceipt(pay)}
                            className="text-[11px] py-1 px-2"
                          >
                            <Receipt className="w-3 h-3 ml-1" />
                            عرض السند
                          </Button>

                          {hasPermission('payments.refund') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRefund(pay)}
                              className="text-[11px] py-1 px-2 text-amber-600 hover:bg-amber-50"
                            >
                              <RotateCcw className="w-3 h-3 ml-1" />
                              استرداد
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FEE STRUCTURES */}
      {/* ========================================================================= */}
      {activeTab === 'structures' && (
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                هياكل وبنود الرسوم المعتمدة ({feeStructures.length})
              </h2>
              <p className="text-xs text-slate-500">
                تعريف أسعار الخدمات التعليمية والأنشطة المدرسية والنقل والكتب
              </p>
            </div>
            {hasPermission('fees.manage_structures') && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedStructure(null);
                  setIsStructureModalOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5 ml-1" />
                إضافة هيكل جديد
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-800">
                  <th className="py-2.5 px-3">اسم البند / الهيكل</th>
                  <th className="py-2.5 px-3">النطاق المطبق</th>
                  <th className="py-2.5 px-3">القيمة المعتمدة</th>
                  <th className="py-2.5 px-3">الدورية</th>
                  <th className="py-2.5 px-3">فترة السريان</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {feeStructures.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      لا توجد هياكل رسوم مضافة حتى الآن
                    </td>
                  </tr>
                ) : (
                  feeStructures.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{s.nameAr}</div>
                        <div className="text-[11px] text-slate-400">{s.nameEn}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {s.stageId ? 'مرحلة محددة' : s.gradeId ? 'صف محدد' : 'عام لكافة المراحل'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(s.amountMinor)}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="neutral" size="sm">{s.frequency}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">
                        {s.effectiveFrom} إلى {s.effectiveTo}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={s.active ? 'success' : 'neutral'} size="sm">
                          {s.active ? 'نشط' : 'معطل'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {hasPermission('fees.manage_structures') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedStructure(s);
                                  setIsStructureModalOpen(true);
                                }}
                                className="text-[11px] py-1 px-2"
                              >
                                تعديل
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStructure(s)}
                                className={`text-[11px] py-1 px-2 ${s.active ? 'text-amber-600' : 'text-emerald-600'}`}
                              >
                                {s.active ? 'تعطيل' : 'تفعيل'}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: STUDENT FEE ASSIGNMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                سجل إسناد الرسوم للطلاب ({assignments.length})
              </h2>
              <p className="text-xs text-slate-500">
                تخصيص الرسوم للطلاب وفق هياكل المصروفات الدراسية
              </p>
            </div>
            {hasPermission('fees.assign') && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAssignmentModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 ml-1" />
                إسناد رسوم جديد
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-800">
                  <th className="py-2.5 px-3">الطالب</th>
                  <th className="py-2.5 px-3">هيكل الرسم</th>
                  <th className="py-2.5 px-3">المبلغ الأصلي</th>
                  <th className="py-2.5 px-3">الخصومات / المنح</th>
                  <th className="py-2.5 px-3">صافي المبلغ</th>
                  <th className="py-2.5 px-3">تاريخ الاستحقاق</th>
                  <th className="py-2.5 px-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      لا توجد عمليات إسناد رسوم حالية
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{a.studentNameAr}</div>
                        <div className="text-[11px] font-mono text-slate-400">{a.studentNumber}</div>
                      </td>
                      <td className="py-2.5 px-3">{a.feeStructureNameAr}</td>
                      <td className="py-2.5 px-3 font-mono">{formatCurrency(a.originalAmountMinor)}</td>
                      <td className="py-2.5 px-3 font-mono text-red-600">
                        {a.discountAmountMinor + a.scholarshipAmountMinor > 0
                          ? `-${formatCurrency(a.discountAmountMinor + a.scholarshipAmountMinor)}`
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(a.netAmountMinor)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{a.dueDate}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={a.status === 'INVOICED' ? 'success' : 'neutral'} size="sm">
                          {a.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: REFUNDS LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'refunds' && (
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                سجل سندات الصرف والاسترداد المالي ({refunds.length})
              </h2>
              <p className="text-xs text-slate-500">
                توثيق كامل لكافة المبالغ المستردة مع الحفاظ على حرمة السندات الأصلية
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-800">
                  <th className="py-2.5 px-3">رقم سند الاسترداد</th>
                  <th className="py-2.5 px-3">التاريخ</th>
                  <th className="py-2.5 px-3">سند القبض الأصلي</th>
                  <th className="py-2.5 px-3">الطالب</th>
                  <th className="py-2.5 px-3">مبلغ الصرف المسترد</th>
                  <th className="py-2.5 px-3">السبب والمبرر</th>
                  <th className="py-2.5 px-3">الوسيلة</th>
                  <th className="py-2.5 px-3">المعتمد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      لا توجد سندات استرداد مسجلة حتى الآن
                    </td>
                  </tr>
                ) : (
                  refunds.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {r.refundNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{r.refundDate}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600">{r.receiptNumber}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{r.studentNameAr}</div>
                        <div className="text-[11px] font-mono text-slate-400">{r.studentNumber}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-red-600">
                        {formatCurrency(r.amountMinor)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{r.reason}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="neutral" size="sm">{r.method}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{r.approvedByName || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: FINANCIAL REPORTS (10 SPECIFIC REPORTS) */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-5">
          {/* Controls Bar */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  اختر التقرير المالي المطلوب (10 تقارير معتمدة)
                </label>
                <select
                  value={reportKey}
                  onChange={(e) => setReportKey(e.target.value as any)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-blue-600 dark:text-blue-400"
                >
                  <option value="outstanding_fees">1. تقرير الرسوم والمتأخرات المستحقة (Outstanding Fees)</option>
                  <option value="paid_fees">2. تقرير الرسوم المسددة بالكامل (Paid Fees)</option>
                  <option value="daily_collection">3. تقرير التحصيل وسندات القبض اليومية (Daily Collections)</option>
                  <option value="payment_method">4. تقرير المدفوعات حسب وسيلة السداد (Payment Methods)</option>
                  <option value="overdue_fees">5. تقرير المتأخرات المتجاوزة للموعد (Overdue Fees)</option>
                  <option value="discounts">6. تقرير الخصومات والتخفيضات المالية (Discounts)</option>
                  <option value="scholarships">7. تقرير المنح والإعفاءات الدراسية (Scholarships)</option>
                  <option value="refunds">8. تقرير سندات الصرف والاسترداد (Refunds)</option>
                  <option value="invoice_register">9. سجل الفواتير والمطالبات العام (Invoice Register)</option>
                  <option value="student_statement">10. كشف حساب الطالب المالي (Student Statement)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={handleExportCSV}>
                  <Download className="w-3.5 h-3.5 ml-1" />
                  تصدير CSV (UTF-8)
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="w-3.5 h-3.5 ml-1" />
                  طباعة التقرير
                </Button>
              </div>
            </div>

            {/* Sub-Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">العام الأكاديمي:</label>
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  className="w-full py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="">كافة الأعوام</option>
                  {years.filter((y) => y.branchId === activeBranchId).map((y) => (
                    <option key={y.id} value={y.id}>{y.nameAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">من تاريخ:</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">إلى تاريخ:</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Report Results */}
          {activeReportData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeReportData.titleAr}
                </h3>
              </div>

              {/* Summary Cards */}
              {activeReportData.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(activeReportData.summary).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center"
                    >
                      <div className="text-[11px] text-slate-500">{key}</div>
                      <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                        {val}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-800">
                      {activeReportData.headers.map((h, i) => (
                        <th key={i} className="py-2 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeReportData.rows.length === 0 ? (
                      <tr>
                        <td colSpan={activeReportData.headers.length} className="py-6 text-center text-slate-400">
                          لا توجد بيانات مطابقة لمعايير هذا التقرير
                        </td>
                      </tr>
                    ) : (
                      activeReportData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-2 px-3 font-mono">{cell}</td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: STUDENT FINANCIAL STATEMENT & PROFILE */}
      {/* ========================================================================= */}
      {activeTab === 'statement' && (
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-5">
          {/* Student Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                اختر الطالب لعرض كشف الحساب المالي:
              </label>
              <select
                value={statementStudentId || (students.filter((s) => s.branchId === activeBranchId)[0]?.id || '')}
                onChange={(e) => setStatementStudentId(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                {students.filter((s) => s.branchId === activeBranchId).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstNameAr} {s.lastNameAr} ({s.studentNumber})
                  </option>
                ))}
              </select>
            </div>

            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5 ml-1" />
              طباعة كشف الحساب
            </Button>
          </div>

          {/* Student Statement Display */}
          {(() => {
            const sid = statementStudentId || (students.filter((s) => s.branchId === activeBranchId)[0]?.id);
            if (!sid) return null;
            const stmt = generateReport('student_statement', {
              branchId: activeBranchId,
              studentId: sid,
            });
            return (
              <div className="space-y-4 pt-2">
                {stmt.summary && (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {Object.entries(stmt.summary).map(([k, v]) => (
                      <div key={k} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500">{k}</div>
                        <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{v} SAR</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-800">
                        {stmt.headers.map((h, i) => (
                          <th key={i} className="py-2 px-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {stmt.rows.length === 0 ? (
                        <tr>
                          <td colSpan={stmt.headers.length} className="py-6 text-center text-slate-400">
                            لا توجد حركات مالية مسجلة لهذا الطالب
                          </td>
                        </tr>
                      ) : (
                        stmt.rows.map((r, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            {r.map((c, cIdx) => (
                              <td key={cIdx} className="py-2 px-3 font-mono">{c}</td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      <Phase9VerificationModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSuccess={refreshFinance}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => {
          setIsRefundModalOpen(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onRefundSuccess={refreshFinance}
      />

      <FeeStructureModal
        isOpen={isStructureModalOpen}
        onClose={() => {
          setIsStructureModalOpen(false);
          setSelectedStructure(null);
        }}
        structure={selectedStructure}
        onSuccess={refreshFinance}
      />

      <FeeAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        onSuccess={refreshFinance}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setActiveReceipt(null);
        }}
        receipt={activeReceipt}
      />
    </div>
  );
};
