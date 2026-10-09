import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  FeeStructure,
  PopulatedInvoice,
  PopulatedPayment,
  PopulatedRefund,
  PopulatedStudentFeeAssignment,
  FinancialDashboardMetrics,
  ReceiptData,
  StudentFinancialStatement,
  CreateFeeStructureDTO,
  CreateInvoiceDTO,
  RecordPaymentDTO,
  ProcessRefundDTO,
  Invoice,
  Payment,
  Refund,
} from '../types/finance';
import { financeStorage } from '../services/financeStorage';
import { useAuth } from './AuthContext';
import { useBranch } from './BranchContext';
import { useAcademic } from './AcademicContext';
import { CurrencyCode, DEFAULT_CURRENCY } from '../utils/currency';

export interface FinanceContextType {
  feeStructures: FeeStructure[];
  invoices: PopulatedInvoice[];
  payments: PopulatedPayment[];
  refunds: PopulatedRefund[];
  assignments: PopulatedStudentFeeAssignment[];
  dashboardMetrics: FinancialDashboardMetrics | null;
  currency: CurrencyCode;
  isLoading: boolean;
  refreshFinance: () => void;

  // Actions
  createFeeStructure: (dto: CreateFeeStructureDTO) => Promise<FeeStructure>;
  updateFeeStructure: (id: string, updates: Partial<FeeStructure>) => Promise<FeeStructure>;
  toggleFeeStructure: (id: string) => Promise<FeeStructure>;
  assignFeeToStudent: (params: Parameters<typeof financeStorage.assignFeeToStudent>[1]) => Promise<void>;
  createInvoice: (dto: CreateInvoiceDTO, asIssued?: boolean) => Promise<Invoice>;
  issueDraftInvoice: (invoiceId: string) => Promise<Invoice>;
  voidInvoice: (invoiceId: string, voidReason: string) => Promise<Invoice>;
  recordPayment: (dto: RecordPaymentDTO) => Promise<{ payment: Payment; invoice: Invoice; receipt: ReceiptData }>;
  processRefund: (dto: ProcessRefundDTO) => Promise<{ refund: Refund; invoice: Invoice }>;
  getStudentFinancialStatement: (studentId: string, academicYearId?: string) => StudentFinancialStatement;
  generateReport: (reportKey: any, params: any) => ReturnType<typeof financeStorage.generateReport>;
  exportReportToCSV: (reportKey: any, params: any) => string;
  generateReceiptData: (payment: Payment, invoice?: Invoice) => ReceiptData;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { activeBranchId } = useBranch();
  const { years } = useAcademic();

  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [invoices, setInvoices] = useState<PopulatedInvoice[]>([]);
  const [payments, setPayments] = useState<PopulatedPayment[]>([]);
  const [refunds, setRefunds] = useState<PopulatedRefund[]>([]);
  const [assignments, setAssignments] = useState<PopulatedStudentFeeAssignment[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<FinancialDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const activeYearId = useMemo(() => {
    const current = years.find((y) => y.isCurrent);
    return current?.id || years[0]?.id;
  }, [years]);

  const refreshFinance = useCallback(() => {
    if (!currentUser || !activeBranchId) {
      setFeeStructures([]);
      setInvoices([]);
      setPayments([]);
      setRefunds([]);
      setAssignments([]);
      setDashboardMetrics(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      financeStorage.initialize();

      const structures = financeStorage.listFeeStructures(currentUser, activeBranchId);
      const invList = financeStorage.listInvoices(currentUser, activeBranchId);
      const payList = financeStorage.listPayments(currentUser, activeBranchId);
      const refList = financeStorage.listRefunds(currentUser, activeBranchId);
      const assignList = financeStorage.listAssignments(currentUser, activeBranchId);
      const metrics = financeStorage.getDashboardMetrics(currentUser, activeBranchId, activeYearId);

      setFeeStructures(structures);
      setInvoices(invList);
      setPayments(payList);
      setRefunds(refList);
      setAssignments(assignList);
      setDashboardMetrics(metrics);
    } catch (e) {
      console.error('Failed to load financial records', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, activeBranchId, activeYearId]);

  useEffect(() => {
    refreshFinance();
  }, [refreshFinance]);

  // Actions
  const createFeeStructure = async (dto: CreateFeeStructureDTO): Promise<FeeStructure> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const created = financeStorage.createFeeStructure(currentUser, dto);
    refreshFinance();
    return created;
  };

  const updateFeeStructure = async (id: string, updates: Partial<FeeStructure>): Promise<FeeStructure> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const updated = financeStorage.updateFeeStructure(currentUser, id, updates);
    refreshFinance();
    return updated;
  };

  const toggleFeeStructure = async (id: string): Promise<FeeStructure> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const toggled = financeStorage.toggleFeeStructureStatus(currentUser, id);
    refreshFinance();
    return toggled;
  };

  const assignFeeToStudent = async (params: Parameters<typeof financeStorage.assignFeeToStudent>[1]): Promise<void> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    financeStorage.assignFeeToStudent(currentUser, params);
    refreshFinance();
  };

  const createInvoice = async (dto: CreateInvoiceDTO, asIssued = false): Promise<Invoice> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const invoice = financeStorage.createInvoice(currentUser, dto, asIssued);
    refreshFinance();
    return invoice;
  };

  const issueDraftInvoice = async (invoiceId: string): Promise<Invoice> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const invoice = financeStorage.issueDraftInvoice(currentUser, invoiceId);
    refreshFinance();
    return invoice;
  };

  const voidInvoice = async (invoiceId: string, voidReason: string): Promise<Invoice> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const invoice = financeStorage.voidInvoice(currentUser, invoiceId, voidReason);
    refreshFinance();
    return invoice;
  };

  const recordPayment = async (dto: RecordPaymentDTO) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const res = financeStorage.recordPayment(currentUser, dto);
    refreshFinance();
    return res;
  };

  const processRefund = async (dto: ProcessRefundDTO) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const res = financeStorage.processRefund(currentUser, dto);
    refreshFinance();
    return res;
  };

  const getStudentFinancialStatement = (studentId: string, yearId?: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    return financeStorage.getStudentFinancialStatement(currentUser, studentId, yearId);
  };

  const generateReport = (reportKey: any, params: any) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    return financeStorage.generateReport(currentUser, reportKey, params);
  };

  const exportReportToCSV = (reportKey: any, params: any) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    return financeStorage.exportReportToCSV(currentUser, reportKey, params);
  };

  const generateReceiptData = (payment: Payment, invoice?: Invoice) => {
    return financeStorage.generateReceiptData(payment, invoice);
  };

  return (
    <FinanceContext.Provider
      value={{
        feeStructures,
        invoices,
        payments,
        refunds,
        assignments,
        dashboardMetrics,
        currency: DEFAULT_CURRENCY,
        isLoading,
        refreshFinance,
        createFeeStructure,
        updateFeeStructure,
        toggleFeeStructure,
        assignFeeToStudent,
        createInvoice,
        issueDraftInvoice,
        voidInvoice,
        recordPayment,
        processRefund,
        getStudentFinancialStatement,
        generateReport,
        exportReportToCSV,
        generateReceiptData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
