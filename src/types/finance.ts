/**
 * Fees & Financial Management Types (Phase 9)
 * Production-grade school fees, invoicing, multi-part payments, refunds, receipts & ledgers.
 * STRICT MONEY RULE: All amounts are stored in exact INTEGER MINOR UNITS (e.g. 10050 = 100.50 SAR).
 */

import { CurrencyCode } from '../utils/currency';

export type FeeFrequency =
  | 'ONE_TIME'
  | 'MONTHLY'
  | 'TERM'
  | 'SEMESTER'
  | 'ANNUAL'
  | 'CUSTOM';

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'VOID'
  | 'REFUNDED';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'CHEQUE'
  | 'ONLINE'
  | 'OTHER';

export type PaymentStatus = 'COMPLETED' | 'VOIDED';

export type RefundStatus = 'PENDING' | 'APPROVED' | 'PROCESSED' | 'REJECTED';

export type DiscountType = 'FIXED' | 'PERCENTAGE';
export type ScholarshipType = 'FIXED' | 'PERCENTAGE';

export interface FeeStructure {
  id: string;
  branchId: string;
  academicYearId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  stageId?: string;
  gradeId?: string;
  classId?: string;
  amountMinor: number; // Stored in minor units (e.g. 500000 = 5000.00)
  frequency: FeeFrequency;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo: string;   // YYYY-MM-DD
  active: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFeeAssignment {
  id: string;
  branchId: string;
  academicYearId: string;
  studentId: string;
  enrollmentId?: string;
  feeStructureId: string;
  originalAmountMinor: number;
  discountAmountMinor: number;
  scholarshipAmountMinor: number;
  netAmountMinor: number;
  dueDate: string;
  status: 'PENDING' | 'INVOICED' | 'CANCELLED';
  notes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  feeStructureId?: string;
  descriptionAr: string;
  descriptionEn: string;
  quantity: number;
  unitAmountMinor: number;
  grossAmountMinor: number;
  discountAmountMinor: number;
  scholarshipAmountMinor: number;
  netAmountMinor: number;
}

export interface InvoiceDiscount {
  id: string;
  invoiceId: string;
  type: DiscountType;
  value: number; // Minor units if FIXED, or percentage (0-100) if PERCENTAGE
  calculatedAmountMinor: number;
  reason: string;
  authorizedBy: string;
  createdAt: string;
}

export interface InvoiceScholarship {
  id: string;
  invoiceId: string;
  type: ScholarshipType;
  value: number; // Minor units if FIXED, or percentage (0-100) if PERCENTAGE
  calculatedAmountMinor: number;
  reason: string;
  authorizedBy: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  branchId: string;
  academicYearId: string;
  studentId: string;
  enrollmentId?: string;
  invoiceNumber: string; // e.g. "INV-2026-0001"
  issueDate: string;     // YYYY-MM-DD
  dueDate: string;       // YYYY-MM-DD
  subtotalMinor: number;
  discountTotalMinor: number;
  scholarshipTotalMinor: number;
  netTotalMinor: number;
  paidTotalMinor: number;
  balanceDueMinor: number;
  status: InvoiceStatus;
  notes?: string;
  voidReason?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  lines: InvoiceLine[];
  discounts: InvoiceDiscount[];
  scholarships: InvoiceScholarship[];
}

export interface Payment {
  id: string;
  branchId: string;
  academicYearId: string;
  studentId: string;
  invoiceId: string;
  receiptNumber: string; // e.g. "RCP-2026-0001"
  paymentDate: string;   // YYYY-MM-DD or ISO
  amountMinor: number;
  method: PaymentMethod;
  reference?: string;    // Bank transaction ID, Cheque number, etc.
  notes?: string;
  status: PaymentStatus;
  receivedBy: string;
  receivedByName: string;
  createdAt: string;
}

export interface Refund {
  id: string;
  branchId: string;
  academicYearId: string;
  studentId: string;
  paymentId: string;
  invoiceId: string;
  refundNumber: string;  // e.g. "RFD-2026-0001"
  refundDate: string;    // YYYY-MM-DD
  amountMinor: number;
  reason: string;
  method: PaymentMethod;
  status: RefundStatus;
  approvedBy?: string;
  approvedByName?: string;
  processedBy: string;
  processedByName: string;
  createdAt: string;
}

export interface ReceiptData {
  receiptNumber: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  studentId: string;
  studentNumber: string;
  studentNameAr: string;
  studentNameEn: string;
  branchId: string;
  branchNameAr: string;
  branchNameEn: string;
  academicYearId: string;
  academicYearNameAr: string;
  academicYearNameEn: string;
  paymentDate: string;
  amountMinor: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  receivedByName: string;
  invoiceSubtotalMinor: number;
  invoiceDiscountTotalMinor: number;
  invoiceScholarshipTotalMinor: number;
  invoiceNetTotalMinor: number;
  invoicePaidTotalMinor: number;
  invoiceRemainingBalanceMinor: number;
  currency: CurrencyCode;
}

// Populated DTOs for UI tables & details
export interface PopulatedInvoice extends Invoice {
  studentNameAr: string;
  studentNameEn: string;
  studentNumber: string;
  branchNameAr: string;
  branchNameEn: string;
  academicYearNameAr: string;
  academicYearNameEn: string;
  classNameAr?: string;
  classNameEn?: string;
}

export interface PopulatedPayment extends Payment {
  studentNameAr: string;
  studentNameEn: string;
  studentNumber: string;
  invoiceNumber: string;
  branchNameAr: string;
  branchNameEn: string;
}

export interface PopulatedRefund extends Refund {
  studentNameAr: string;
  studentNameEn: string;
  studentNumber: string;
  invoiceNumber: string;
  receiptNumber: string;
  branchNameAr: string;
  branchNameEn: string;
}

export interface PopulatedStudentFeeAssignment extends StudentFeeAssignment {
  studentNameAr: string;
  studentNameEn: string;
  studentNumber: string;
  feeStructureNameAr: string;
  feeStructureNameEn: string;
  branchNameAr: string;
  branchNameEn: string;
}

// Student Financial Profile & Statement
export interface StudentFinancialStatement {
  studentId: string;
  studentNumber: string;
  studentNameAr: string;
  studentNameEn: string;
  branchId: string;
  branchNameAr: string;
  branchNameEn: string;
  academicYearId: string;
  totalBilledMinor: number;
  totalDiscountsMinor: number;
  totalScholarshipsMinor: number;
  totalNetBilledMinor: number;
  totalPaidMinor: number;
  totalRefundedMinor: number;
  netCollectedMinor: number;
  outstandingBalanceMinor: number;
  overdueAmountMinor: number;
  invoices: PopulatedInvoice[];
  payments: PopulatedPayment[];
  refunds: PopulatedRefund[];
}

// Financial Dashboard Aggregates
export interface FinancialDashboardMetrics {
  totalInvoicedMinor: number;
  totalCollectedMinor: number;
  outstandingBalanceMinor: number;
  overdueAmountMinor: number;
  totalDiscountsMinor: number;
  totalScholarshipsMinor: number;
  totalRefundsMinor: number;
  netCollectionMinor: number;
  collectionRatePercentage: number;
  invoicesCountByStatus: Record<InvoiceStatus, number>;
  paymentsCountByMethod: Record<PaymentMethod, { count: number; totalMinor: number }>;
}

// Create/Update DTOs
export interface CreateFeeStructureDTO {
  branchId: string;
  academicYearId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  stageId?: string;
  gradeId?: string;
  classId?: string;
  amountMinor: number;
  frequency: FeeFrequency;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface CreateInvoiceDTO {
  branchId: string;
  academicYearId: string;
  studentId: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  lines: Array<{
    feeStructureId?: string;
    descriptionAr: string;
    descriptionEn: string;
    quantity: number;
    unitAmountMinor: number;
  }>;
  discounts?: Array<{
    type: DiscountType;
    value: number;
    reason: string;
  }>;
  scholarships?: Array<{
    type: ScholarshipType;
    value: number;
    reason: string;
  }>;
}

export interface RecordPaymentDTO {
  branchId: string;
  academicYearId: string;
  studentId: string;
  invoiceId: string;
  amountMinor: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface ProcessRefundDTO {
  branchId: string;
  paymentId: string;
  amountMinor: number;
  reason: string;
  method: PaymentMethod;
}
