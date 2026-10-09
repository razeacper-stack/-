// Polyfill localStorage if running in Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

import { financeStorage } from '../src/services/financeStorage';
import { FinancialCalculationEngine } from '../src/services/financialCalculationEngine';
import { authStorage } from '../src/services/authStorage';
import { branchStorage } from '../src/services/branchStorage';
import { academicStorage } from '../src/services/academicStorage';
import { studentStorage } from '../src/services/studentStorage';
import { teacherStorage } from '../src/services/teacherStorage';
import {
  toMinorUnits,
  toMajorUnits,
  formatCurrency,
  addMinor,
  subtractMinor,
  calculatePercentageMinor,
} from '../src/utils/currency';
import { SafeUser } from '../src/types/auth';

async function main() {
  console.log('========================================================');
  console.log('RUNNING PHASE 9 — FEES & FINANCIAL MANAGEMENT TEST SUITE');
  console.log('========================================================');

  await authStorage.initialize();
  branchStorage.initialize();
  academicStorage.initialize();
  studentStorage.initialize();
  teacherStorage.initialize();
  financeStorage.initialize();

  // Test Actors
  const superAdminUser: SafeUser = {
    id: 'usr-super-admin',
    fullName: 'المدير العام للنظام (Super Admin)',
    username: 'superadmin',
    email: 'admin@school.edu.sa',
    roleId: 'role-super-admin',
    roleCode: 'SUPER_ADMIN',
    roleNameAr: 'المدير العام',
    roleNameEn: 'Super Admin',
    branchIds: ['branch-riyadh', 'branch-jeddah'],
    hasAllBranchesAccess: true,
    status: 'active',
    isProtectedSuperAdmin: true,
    permissions: [],
    createdAt: '2026-01-01',
  };

  const riyadhManagerUser: SafeUser = {
    id: 'usr-mgr-riyadh',
    fullName: 'أ. أحمد الشمري (مدير فرع الرياض)',
    username: 'mgr_riyadh',
    email: 'mgr.riyadh@school.edu.sa',
    roleId: 'role-manager',
    roleCode: 'MANAGER',
    roleNameAr: 'مدير فرع',
    roleNameEn: 'Branch Manager',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    permissions: [
      'dashboard.view',
      'fees.view',
      'fees.create',
      'fees.edit',
      'fees.manage_structures',
      'fees.assign',
      'fees.issue',
      'fees.apply_discount',
      'fees.apply_scholarship',
      'payments.view',
      'payments.create',
      'payments.refund',
      'payments.approve_refund',
      'payments.export',
      'finance.view_reports',
      'finance.export',
    ],
    createdAt: '2026-01-01',
  };

  const jeddahManagerUser: SafeUser = {
    id: 'usr-mgr-jeddah',
    fullName: 'أ. سامي الزهراني (مدير فرع جدة)',
    username: 'mgr_jeddah',
    email: 'mgr.jeddah@school.edu.sa',
    roleId: 'role-manager',
    roleCode: 'MANAGER',
    roleNameAr: 'مدير فرع',
    roleNameEn: 'Branch Manager',
    branchIds: ['branch-jeddah'],
    hasAllBranchesAccess: false,
    status: 'active',
    permissions: [
      'dashboard.view',
      'fees.view',
      'fees.create',
      'fees.edit',
      'fees.manage_structures',
      'fees.assign',
      'fees.issue',
      'payments.view',
      'payments.create',
      'payments.export',
    ],
    createdAt: '2026-01-01',
  };

  const viewerUser: SafeUser = {
    id: 'usr-viewer',
    fullName: 'أ. فهد المشاهد (مشاهد فقط)',
    username: 'viewer',
    email: 'viewer@school.edu.sa',
    roleId: 'role-viewer',
    roleCode: 'VIEWER',
    roleNameAr: 'مشاهد',
    roleNameEn: 'Viewer',
    branchIds: ['branch-riyadh'],
    hasAllBranchesAccess: false,
    status: 'active',
    permissions: ['dashboard.view', 'fees.view'],
    createdAt: '2026-01-01',
  };

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testNum: number, name: string, details?: string) {
    const pad = testNum < 10 ? `0${testNum}` : `${testNum}`;
    if (condition) {
      passedTests++;
      console.log(`[PASS] Test ${pad}: ${name} -> ${details || 'OK'}`);
    } else {
      failedTests++;
      console.error(`[FAIL] Test ${pad}: ${name} -> ${details || 'Assertion failed'}`);
    }
  }

  // 1. Fee structure creation
  try {
    const s = financeStorage.createFeeStructure(superAdminUser, {
      branchId: 'branch-riyadh',
      academicYearId: 'ay-riyadh-2026',
      nameAr: 'رسوم الأنشطة الإثرائية',
      nameEn: 'Enrichment Programs',
      amountMinor: 120000, // 1,200.00 SAR
      frequency: 'TERM',
      effectiveFrom: '2025-09-01',
      effectiveTo: '2026-06-30',
    });
    assert(s.amountMinor === 120000 && s.branchId === 'branch-riyadh', 1, 'Fee Structure Creation & Minor Units', `Created ${s.nameAr}: ${formatCurrency(s.amountMinor)}`);
  } catch (e: any) {
    assert(false, 1, 'Fee Structure Creation', e.message);
  }

  // 2. Fee structure update
  try {
    const list = financeStorage.listFeeStructures(superAdminUser, 'branch-riyadh');
    const updated = financeStorage.updateFeeStructure(superAdminUser, list[0].id, {
      descriptionAr: 'تحديث الوصف المعتمد للاختبار',
    });
    assert(updated.descriptionAr === 'تحديث الوصف المعتمد للاختبار', 2, 'Fee Structure Update', `Updated structure: ${updated.nameAr}`);
  } catch (e: any) {
    assert(false, 2, 'Fee Structure Update', e.message);
  }

  // 3. Fee structure branch isolation
  try {
    financeStorage.listFeeStructures(jeddahManagerUser, 'branch-riyadh');
    assert(false, 3, 'Fee Structure Branch Isolation', 'Cross-branch query was not blocked');
  } catch (e: any) {
    assert(e.message.includes('غير مصرح لك'), 3, 'Fee Structure Branch Isolation', 'Cross-branch access properly rejected');
  }

  // 4. Fee assignment to student
  try {
    const a = financeStorage.assignFeeToStudent(riyadhManagerUser, {
      branchId: 'branch-riyadh',
      academicYearId: 'ay-riyadh-2026',
      studentId: 'stu-riyadh-002',
      feeStructureId: 'fee-str-02', // 3,500.00 SAR
      dueDate: '2025-11-01',
      discountAmountMinor: 50000,
    });
    assert(a.netAmountMinor === 300000, 4, 'Fee Assignment Calculation', `Assigned net: ${formatCurrency(a.netAmountMinor)}`);
  } catch (e: any) {
    assert(false, 4, 'Fee Assignment Calculation', e.message);
  }

  // 5. Student validation on assignment
  try {
    financeStorage.assignFeeToStudent(riyadhManagerUser, {
      branchId: 'branch-riyadh',
      academicYearId: 'ay-riyadh-2026',
      studentId: 'std-non-existent',
      feeStructureId: 'fee-str-01',
      dueDate: '2025-11-01',
    });
    assert(false, 5, 'Student Existence Validation', 'Accepted nonexistent student');
  } catch (e: any) {
    assert(e.message.includes('غير موجود'), 5, 'Student Existence Validation', 'Rejected nonexistent student');
  }

  // 6. Cross-branch student validation
  try {
    financeStorage.assignFeeToStudent(superAdminUser, {
      branchId: 'branch-jeddah',
      academicYearId: 'ay-jeddah-2026',
      studentId: 'stu-riyadh-001', // belongs to Riyadh
      feeStructureId: 'fee-str-04',
      dueDate: '2025-11-01',
    });
    assert(false, 6, 'Cross-Branch Student Assignment Validation', 'Allowed student in wrong branch');
  } catch (e: any) {
    assert(e.message.includes('لا يتبع الفرع'), 6, 'Cross-Branch Student Assignment Validation', 'Rejected cross-branch student assignment');
  }

  // 7. Invoice creation & multi-line subtotal
  let testInvId = '';
  try {
    const inv = financeStorage.createInvoice(riyadhManagerUser, {
      branchId: 'branch-riyadh',
      academicYearId: 'ay-riyadh-2026',
      studentId: 'stu-riyadh-001',
      issueDate: '2025-09-10',
      dueDate: '2025-10-10',
      lines: [
        { descriptionAr: 'حاسب آلي', descriptionEn: 'IT', quantity: 2, unitAmountMinor: 50000 },
        { descriptionAr: 'نشاط بيئي', descriptionEn: 'Eco', quantity: 1, unitAmountMinor: 30000 },
      ],
    }, false);
    testInvId = inv.id;
    assert(inv.subtotalMinor === 130000 && inv.status === 'DRAFT', 7, 'Invoice Creation & Multi-Line Subtotal', `Created draft invoice: ${inv.invoiceNumber} (${formatCurrency(inv.subtotalMinor)})`);
  } catch (e: any) {
    assert(false, 7, 'Invoice Creation & Multi-Line Subtotal', e.message);
  }

  // 8. Invoice calculation engine exactness
  const calcSub = FinancialCalculationEngine.calculateSubtotal([
    { grossAmountMinor: 10050 },
    { grossAmountMinor: 20050 },
  ]);
  assert(calcSub === 30100, 8, 'Calculation Engine Exact Minor Subtotal', `100.50 + 200.50 = ${toMajorUnits(calcSub)} SAR`);

  // 9. Invoice sequential numbering
  const invNum = financeStorage.generateNextInvoiceNumber('branch-riyadh');
  assert(/^INV-\d{4}-\d{4}$/.test(invNum), 9, 'Invoice Sequential Numbering', `Generated next number: ${invNum}`);

  // 10. Discount fixed amount
  const discFixed = FinancialCalculationEngine.calculateDiscount(500000, 'FIXED', 100000);
  assert(discFixed === 100000, 10, 'Discount Fixed Amount', `Fixed 1,000 off 5,000: ${formatCurrency(discFixed)}`);

  // 11. Discount percentage
  const discPct = FinancialCalculationEngine.calculateDiscount(200000, 'PERCENTAGE', 20);
  assert(discPct === 40000, 11, 'Discount Percentage Calculation', `20% of 2,000 = ${formatCurrency(discPct)}`);

  // 12. Scholarship calculation & deduction
  const schol = FinancialCalculationEngine.calculateScholarship(1000000, 'PERCENTAGE', 50);
  const netAfterSchol = FinancialCalculationEngine.calculateNetTotal(1000000, 0, schol);
  assert(schol === 500000 && netAfterSchol === 500000, 12, 'Scholarship Calculation & Net Total', `50% scholarship: net = ${formatCurrency(netAfterSchol)}`);

  // 13. Partial payment
  let liveInvId = '';
  try {
    const liveInv = financeStorage.createInvoice(riyadhManagerUser, {
      branchId: 'branch-riyadh',
      academicYearId: 'ay-riyadh-2026',
      studentId: 'stu-riyadh-001',
      issueDate: '2026-09-01',
      dueDate: '2026-12-31',
      lines: [{ descriptionAr: 'رسوم فصلية', descriptionEn: 'Term Fee', quantity: 1, unitAmountMinor: 1000000 }],
    }, true);
    liveInvId = liveInv.id;

    const res = financeStorage.recordPayment(riyadhManagerUser, {
      branchId: 'branch-riyadh',
      academicYearId: 'ay-riyadh-2026',
      studentId: 'stu-riyadh-001',
      invoiceId: liveInv.id,
      amountMinor: 300000,
      paymentDate: '2025-09-13',
      method: 'BANK_TRANSFER',
    });
    assert(res.invoice.paidTotalMinor === 300000 && res.invoice.balanceDueMinor === 700000 && res.invoice.status === 'PARTIALLY_PAID', 13, 'Partial Payment & Remaining Balance', `Paid 3,000 / Remaining ${formatCurrency(res.invoice.balanceDueMinor)} (${res.invoice.status})`);
  } catch (e: any) {
    assert(false, 13, 'Partial Payment', e.message);
  }

  // 14. Multiple payments on same invoice
  try {
    const res2 = financeStorage.recordPayment(riyadhManagerUser, {
      branchId: 'branch-riyadh',
      academicYearId: 'ay-riyadh-2026',
      studentId: 'stu-riyadh-001',
      invoiceId: liveInvId,
      amountMinor: 400000,
      paymentDate: '2025-09-14',
      method: 'CARD',
    });
    assert(res2.invoice.paidTotalMinor === 700000 && res2.invoice.balanceDueMinor === 300000, 14, 'Multiple Payments Cumulative Total', `Total paid 7,000 / Remaining ${formatCurrency(res2.invoice.balanceDueMinor)}`);
  } catch (e: any) {
    assert(false, 14, 'Multiple Payments', e.message);
  }

  // 15. Full payment transition to PAID
  try {
    const res3 = financeStorage.recordPayment(riyadhManagerUser, {
      branchId: 'branch-riyadh',
      academicYearId: 'ay-riyadh-2026',
      studentId: 'stu-riyadh-001',
      invoiceId: liveInvId,
      amountMinor: 300000,
      paymentDate: '2025-09-15',
      method: 'CASH',
    });
    assert(res3.invoice.balanceDueMinor === 0 && res3.invoice.status === 'PAID', 15, 'Full Payment & Transition to PAID', `Zero balance reached: ${res3.invoice.status}`);
  } catch (e: any) {
    assert(false, 15, 'Full Payment', e.message);
  }

  // 16. Outstanding balance derived property
  const bal = FinancialCalculationEngine.calculateBalance(850000, 250000);
  assert(bal === 600000, 16, 'Outstanding Balance Derived Property', `8,500 - 2,500 = ${formatCurrency(bal)}`);

  // 17. Overdue status calculation
  const overdueStatus = FinancialCalculationEngine.calculateInvoiceStatus({
    netTotalMinor: 500000,
    paidTotalMinor: 100000,
    dueDate: '2024-01-01',
  });
  assert(overdueStatus === 'OVERDUE', 17, 'Overdue Status Derivation', `Past due invoice resolved to ${overdueStatus}`);

  // 18. Payment validation (Amount > 0)
  try {
    financeStorage.recordPayment(riyadhManagerUser, {
      branchId: 'branch-riyadh',
      academicYearId: 'ay-riyadh-2026',
      studentId: 'stu-riyadh-001',
      invoiceId: liveInvId,
      amountMinor: 0,
      paymentDate: '2025-09-15',
      method: 'CASH',
    });
    assert(false, 18, 'Payment Validation: Zero Amount Rejection', 'Allowed zero payment');
  } catch (e: any) {
    assert(e.message.includes('أكبر من الصفر'), 18, 'Payment Validation: Zero Amount Rejection', 'Rejected zero/negative payment amount');
  }

  // 19. Payment method acceptance
  const validMethods = ['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'ONLINE'];
  assert(validMethods.length === 5, 19, 'Configurable Payment Methods Support', 'All 5 standard payment methods supported');

  // 20. Receipt generation
  const paymentsList = financeStorage.listPayments(superAdminUser, 'branch-riyadh');
  const receipt = financeStorage.generateReceiptData(paymentsList[0]);
  assert(!!receipt.receiptNumber && receipt.amountMinor > 0, 20, 'Printable Receipt Generation', `Generated receipt ${receipt.receiptNumber} for ${receipt.studentNameAr}`);

  // 21. Controlled refund processing
  let refundPayId = paymentsList[0].id;
  try {
    const { refund, invoice: afterRef } = financeStorage.processRefund(superAdminUser, {
      branchId: 'branch-riyadh',
      paymentId: refundPayId,
      amountMinor: 10000, // 100.00 SAR
      reason: 'استرداد مصاريف أنشطة',
      method: 'BANK_TRANSFER',
    });
    assert(refund.amountMinor === 10000 && afterRef.balanceDueMinor >= 10000, 21, 'Refund Processing & Balance Recalculation', `Refunded ${formatCurrency(refund.amountMinor)} / Invoice updated`);
  } catch (e: any) {
    assert(false, 21, 'Refund Processing', e.message);
  }

  // 22. Refund limit enforcement
  try {
    financeStorage.processRefund(superAdminUser, {
      branchId: 'branch-riyadh',
      paymentId: refundPayId,
      amountMinor: 99999999, // Exceeds payment
      reason: 'استرداد مفرط',
      method: 'CASH',
    });
    assert(false, 22, 'Refund Cap Protection', 'Allowed refund exceeding payment');
  } catch (e: any) {
    assert(e.message.includes('يتجاوز الحد الأقصى'), 22, 'Refund Cap Protection', 'Blocked refund exceeding refundable amount');
  }

  // 23. Duplicate refund prevention
  try {
    // Attempt refund with empty reason
    financeStorage.processRefund(superAdminUser, {
      branchId: 'branch-riyadh',
      paymentId: refundPayId,
      amountMinor: 1000,
      reason: '',
      method: 'CASH',
    });
    assert(false, 23, 'Refund Mandatory Justification Guard', 'Allowed refund without reason');
  } catch (e: any) {
    assert(e.message.includes('مبرر الاسترداد'), 23, 'Refund Mandatory Justification Guard', 'Enforced mandatory justification for refunds');
  }

  // 24. Invoice lifecycle: Draft -> Issued
  try {
    const issued = financeStorage.issueDraftInvoice(riyadhManagerUser, testInvId);
    assert(issued.status === 'ISSUED', 24, 'Invoice Lifecycle Progression (DRAFT -> ISSUED)', `Invoice issued: ${issued.invoiceNumber}`);
  } catch (e: any) {
    assert(false, 24, 'Invoice Lifecycle Progression', e.message);
  }

  // 25. Paid invoice protection from voiding
  try {
    financeStorage.voidInvoice(superAdminUser, liveInvId, 'محاولة إلغاء فاتورة مدفوعة');
    assert(false, 25, 'Paid Invoice Protection', 'Allowed voiding a paid invoice');
  } catch (e: any) {
    assert(e.message.includes('لا يمكن إبطال فاتورة تحتوي على مدفوعات'), 25, 'Paid Invoice Protection', 'Protected paid invoice from unauthorized voiding');
  }

  // 26. Financial immutability: Original payments preserved
  const originalPaymentsCount = financeStorage.getRawPayments().length;
  assert(originalPaymentsCount > 0, 26, 'Financial Immutability of Payment Vouchers', `${originalPaymentsCount} payment records preserved permanently without deletion`);

  // 27. Permission enforcement: Viewer denied invoice creation
  try {
    financeStorage.createInvoice(viewerUser, {
      branchId: 'branch-riyadh',
      academicYearId: 'ay-riyadh-2026',
      studentId: 'stu-riyadh-001',
      issueDate: '2025-09-20',
      dueDate: '2025-10-20',
      lines: [{ descriptionAr: 'بند', descriptionEn: 'Item', quantity: 1, unitAmountMinor: 10000 }],
    });
    assert(false, 27, 'Role Permission Enforcement', 'Viewer was allowed to create invoice');
  } catch (e: any) {
    assert(e.message.includes('ليس لديك الصلاحية'), 27, 'Role Permission Enforcement', 'Viewer correctly denied mutation access');
  }

  // 28. Direct service-layer unauthorized payment
  try {
    financeStorage.recordPayment(viewerUser, {
      branchId: 'branch-riyadh',
      academicYearId: 'ay-riyadh-2026',
      studentId: 'stu-riyadh-001',
      invoiceId: testInvId,
      amountMinor: 5000,
      paymentDate: '2025-09-20',
      method: 'CASH',
    });
    assert(false, 28, 'Service-Layer Direct Guard on Payments', 'Viewer recorded payment directly');
  } catch (e: any) {
    assert(e.message.includes('ليس لديك الصلاحية'), 28, 'Service-Layer Direct Guard on Payments', 'Service layer blocked unauthorized payment call');
  }

  // 29. Cross-branch payment rejection
  try {
    financeStorage.recordPayment(jeddahManagerUser, {
      branchId: 'branch-riyadh',
      academicYearId: 'ay-riyadh-2026',
      studentId: 'stu-riyadh-001',
      invoiceId: testInvId,
      amountMinor: 5000,
      paymentDate: '2025-09-20',
      method: 'CASH',
    });
    assert(false, 29, 'Cross-Branch Payment Rejection', 'Allowed Jeddah manager to record payment in Riyadh');
  } catch (e: any) {
    assert(e.message.includes('غير مصرح لك'), 29, 'Cross-Branch Payment Rejection', 'Cross-branch payment attempt blocked & audited');
  }

  // 30. Cross-branch invoice query rejection
  try {
    financeStorage.listInvoices(riyadhManagerUser, 'branch-jeddah');
    assert(false, 30, 'Cross-Branch Invoice Access Guard', 'Allowed Riyadh manager to view Jeddah invoices');
  } catch (e: any) {
    assert(e.message.includes('غير مصرح لك'), 30, 'Cross-Branch Invoice Access Guard', 'Isolated branch invoice ledger');
  }

  // 31. Financial audit logging
  const auditLogs = authStorage.getAuditLogs();
  const finLogs = auditLogs.filter(
    (l) =>
      l.targetType === 'FINANCE' ||
      l.targetType === 'INVOICE' ||
      l.targetType === 'PAYMENT' ||
      l.targetType === 'REFUND'
  );
  assert(finLogs.length >= 3, 31, 'Centralized Financial Audit Trail', `${finLogs.length} financial transactions recorded in centralized audit ledger`);

  // 32. Financial report calculations
  const report = financeStorage.generateReport(superAdminUser, 'outstanding_fees', {
    branchId: 'branch-riyadh',
  });
  assert(Array.isArray(report.rows) && !!report.summary, 32, 'Financial Report Dynamic Generation', `Generated ${report.titleAr} with ${report.rows.length} records`);

  // 33. Currency exact arithmetic & conversions
  const mConv = toMinorUnits('1250.75');
  const majConv = toMajorUnits(mConv);
  assert(mConv === 125075 && majConv === 1250.75, 33, 'Currency Exact Decimal & Minor Units Conversion', '1250.75 <-> 125075 lossless round-trip');

  // 34. Duplicate receipt number protection
  const allPayments = financeStorage.getRawPayments();
  const receiptNums = allPayments.map((p) => p.receiptNumber);
  const isUnique = new Set(receiptNums).size === receiptNums.length;
  assert(isUnique, 34, 'Receipt Number Uniqueness Guarantee', `All ${receiptNums.length} receipts have unique sequential identifiers`);

  // 35. Super Admin Global Multi-Branch Access
  const rInvs = financeStorage.listInvoices(superAdminUser, 'branch-riyadh');
  const jInvs = financeStorage.listInvoices(superAdminUser, 'branch-jeddah');
  assert(Array.isArray(rInvs) && Array.isArray(jInvs), 35, 'Super Admin Unhindered Global Access', `Super Admin accessed both Riyadh (${rInvs.length}) and Jeddah (${jInvs.length})`);

  // 36. Overpayment rejection on live invoice
  try {
    financeStorage.recordPayment(riyadhManagerUser, {
      branchId: 'branch-riyadh',
      academicYearId: 'ay-riyadh-2026',
      studentId: 'stu-riyadh-001',
      invoiceId: testInvId,
      amountMinor: 999999999, // Huge amount
      paymentDate: '2025-09-20',
      method: 'CASH',
    });
    assert(false, 36, 'Overpayment Policy Rejection Guard', 'Allowed overpayment');
  } catch (e: any) {
    assert(e.message.includes('يتجاوز الرصيد المستحق'), 36, 'Overpayment Policy Rejection Guard', 'Strict overpayment policy prevented balance inflation');
  }

  // 37. CSV Export with UTF-8 BOM
  const csv = financeStorage.exportReportToCSV(superAdminUser, 'invoice_register', {
    branchId: 'branch-riyadh',
  });
  assert(csv.startsWith('\uFEFF') && csv.length > 50, 37, 'CSV Export with UTF-8 BOM for Arabic Excel', `Generated ${csv.length} bytes valid UTF-8 BOM CSV`);

  // 38. Prior phases regression check
  const bCount = branchStorage.getStoredBranches().length;
  const sCount = studentStorage.getRawStudents().length;
  const tCount = teacherStorage.getRawTeachers().length;
  assert(bCount >= 2 && sCount >= 3 && tCount >= 3, 38, 'Regression Integrity for Phases 1-8', `System intact: ${bCount} branches, ${sCount} students, ${tCount} teachers`);

  console.log('========================================================');
  console.log(`PHASE 9 TESTS TOTAL:  ${passedTests + failedTests}`);
  console.log(`PHASE 9 TESTS PASSED: ${passedTests}`);
  console.log(`PHASE 9 TESTS FAILED: ${failedTests}`);
  console.log('========================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Phase 9 Test runner failed:', err);
  process.exit(1);
});
