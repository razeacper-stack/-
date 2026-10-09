/**
 * Centralized Financial Calculation Engine (Phase 9)
 * Pure, audited calculation routines operating strictly on exact INTEGER MINOR UNITS.
 * No floating point currency math is permitted.
 */

import {
  InvoiceLine,
  InvoiceDiscount,
  InvoiceScholarship,
  InvoiceStatus,
  Payment,
  Refund,
  DiscountType,
  ScholarshipType,
} from '../types/finance';
import {
  addMinor,
  subtractMinor,
  calculatePercentageMinor,
} from '../utils/currency';

export class FinancialCalculationEngine {
  /**
   * Calculate line item gross amount: quantity * unitAmountMinor
   */
  public static calculateLineGross(quantity: number, unitAmountMinor: number): number {
    const qty = Math.max(0, Math.round(quantity) || 0);
    const unit = Math.max(0, Math.round(unitAmountMinor) || 0);
    return qty * unit;
  }

  /**
   * Calculate line item net amount: gross - discount - scholarship
   */
  public static calculateLineNet(
    grossAmountMinor: number,
    discountAmountMinor: number = 0,
    scholarshipAmountMinor: number = 0
  ): number {
    const gross = Math.max(0, Math.round(grossAmountMinor) || 0);
    const disc = Math.max(0, Math.round(discountAmountMinor) || 0);
    const schol = Math.max(0, Math.round(scholarshipAmountMinor) || 0);
    const net = gross - disc - schol;
    return Math.max(0, net);
  }

  /**
   * Calculate invoice subtotal by summing gross amounts of all lines
   */
  public static calculateSubtotal(lines: Array<{ grossAmountMinor: number }>): number {
    if (!lines || lines.length === 0) return 0;
    return addMinor(...lines.map((l) => l.grossAmountMinor));
  }

  /**
   * Calculate discount amount (FIXED in minor units or PERCENTAGE 0-100)
   */
  public static calculateDiscount(
    baseAmountMinor: number,
    type: DiscountType,
    value: number
  ): number {
    if (baseAmountMinor <= 0 || value <= 0) return 0;

    if (type === 'PERCENTAGE') {
      const percentage = Math.min(100, Math.max(0, value));
      return calculatePercentageMinor(baseAmountMinor, percentage);
    }

    // FIXED amount in minor units: cannot exceed base amount
    const fixedMinor = Math.round(value);
    return Math.min(baseAmountMinor, Math.max(0, fixedMinor));
  }

  /**
   * Calculate scholarship amount (FIXED in minor units or PERCENTAGE 0-100)
   */
  public static calculateScholarship(
    baseAmountMinor: number,
    type: ScholarshipType,
    value: number
  ): number {
    if (baseAmountMinor <= 0 || value <= 0) return 0;

    if (type === 'PERCENTAGE') {
      const percentage = Math.min(100, Math.max(0, value));
      return calculatePercentageMinor(baseAmountMinor, percentage);
    }

    // FIXED amount in minor units: cannot exceed base amount
    const fixedMinor = Math.round(value);
    return Math.min(baseAmountMinor, Math.max(0, fixedMinor));
  }

  /**
   * Calculate cumulative discounts from list of discount specifications
   */
  public static calculateDiscountsTotal(
    subtotalMinor: number,
    discounts: Array<{ type: DiscountType; value: number }>
  ): number {
    if (!discounts || discounts.length === 0 || subtotalMinor <= 0) return 0;

    let totalDisc = 0;
    let remainingBase = subtotalMinor;

    for (const d of discounts) {
      const calculated = this.calculateDiscount(subtotalMinor, d.type, d.value);
      const applicable = Math.min(remainingBase, calculated);
      totalDisc = addMinor(totalDisc, applicable);
      remainingBase = Math.max(0, remainingBase - applicable);
    }

    return totalDisc;
  }

  /**
   * Calculate cumulative scholarships from list of scholarship specifications
   */
  public static calculateScholarshipsTotal(
    afterDiscountsMinor: number,
    scholarships: Array<{ type: ScholarshipType; value: number }>
  ): number {
    if (!scholarships || scholarships.length === 0 || afterDiscountsMinor <= 0) return 0;

    let totalSchol = 0;
    let remainingBase = afterDiscountsMinor;

    for (const s of scholarships) {
      const calculated = this.calculateScholarship(afterDiscountsMinor, s.type, s.value);
      const applicable = Math.min(remainingBase, calculated);
      totalSchol = addMinor(totalSchol, applicable);
      remainingBase = Math.max(0, remainingBase - applicable);
    }

    return totalSchol;
  }

  /**
   * Calculate net total: subtotal - discounts - scholarships
   */
  public static calculateNetTotal(
    subtotalMinor: number,
    discountTotalMinor: number,
    scholarshipTotalMinor: number
  ): number {
    const sub = Math.max(0, Math.round(subtotalMinor) || 0);
    const disc = Math.max(0, Math.round(discountTotalMinor) || 0);
    const schol = Math.max(0, Math.round(scholarshipTotalMinor) || 0);
    const deductions = addMinor(disc, schol);
    return Math.max(0, sub - deductions);
  }

  /**
   * Calculate total valid payments against an invoice (excluding voided payments)
   */
  public static calculateGrossPayments(payments: Payment[]): number {
    if (!payments || payments.length === 0) return 0;
    const valid = payments.filter((p) => p.status === 'COMPLETED');
    return addMinor(...valid.map((p) => p.amountMinor));
  }

  /**
   * Calculate total processed refunds against an invoice
   */
  public static calculateRefunded(refunds: Refund[]): number {
    if (!refunds || refunds.length === 0) return 0;
    const processed = refunds.filter((r) => r.status === 'PROCESSED');
    return addMinor(...processed.map((r) => r.amountMinor));
  }

  /**
   * Calculate net paid total: valid payments - processed refunds
   * Guaranteed never to drop below zero.
   */
  public static calculatePaidTotal(payments: Payment[], refunds: Refund[] = []): number {
    const grossPaid = this.calculateGrossPayments(payments);
    const refunded = this.calculateRefunded(refunds);
    return Math.max(0, grossPaid - refunded);
  }

  /**
   * Calculate outstanding balance due:
   * Net Total - Net Paid (Valid Payments - Valid Refunds)
   */
  public static calculateBalance(netTotalMinor: number, paidTotalMinor: number): number {
    const net = Math.max(0, Math.round(netTotalMinor) || 0);
    const paid = Math.max(0, Math.round(paidTotalMinor) || 0);
    return Math.max(0, net - paid);
  }

  /**
   * Outstanding amount alias
   */
  public static calculateOutstanding(netTotalMinor: number, paidTotalMinor: number): number {
    return this.calculateBalance(netTotalMinor, paidTotalMinor);
  }

  /**
   * Determine invoice status based on lifecycle, balance and due date
   */
  public static calculateInvoiceStatus(params: {
    status?: InvoiceStatus;
    netTotalMinor: number;
    paidTotalMinor: number;
    dueDate: string;
    isVoid?: boolean;
    hasRefunds?: boolean;
  }): InvoiceStatus {
    const { status, netTotalMinor, paidTotalMinor, dueDate, isVoid, hasRefunds } = params;

    if (isVoid || status === 'VOID') return 'VOID';
    if (status === 'DRAFT') return 'DRAFT';

    const net = Math.max(0, Math.round(netTotalMinor) || 0);
    const paid = Math.max(0, Math.round(paidTotalMinor) || 0);

    // If completely paid and net > 0
    if (net > 0 && paid >= net) {
      return 'PAID';
    }

    // Check overdue first if past due date and still has unpaid balance
    if (dueDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (dueDate < todayStr && paid < net) {
        return 'OVERDUE';
      }
    }

    // If partially paid
    if (paid > 0 && paid < net) {
      return 'PARTIALLY_PAID';
    }

    // If fully refunded back to 0 after being paid
    if (hasRefunds && paid === 0 && net > 0) {
      return 'REFUNDED';
    }

    return 'ISSUED';
  }
}
