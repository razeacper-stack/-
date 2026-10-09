/**
 * Finance & Fees Storage Engine (Phase 9)
 * Multi-branch school tuition, fee structures, invoicing, payments, refunds, receipts, and audit trail.
 * STRICT MONEY RULE: All amounts are stored in exact INTEGER MINOR UNITS.
 */

import { SafeUser } from '../types/auth';
import {
  FeeStructure,
  StudentFeeAssignment,
  Invoice,
  InvoiceLine,
  InvoiceDiscount,
  InvoiceScholarship,
  Payment,
  Refund,
  ReceiptData,
  PopulatedInvoice,
  PopulatedPayment,
  PopulatedRefund,
  PopulatedStudentFeeAssignment,
  StudentFinancialStatement,
  FinancialDashboardMetrics,
  CreateFeeStructureDTO,
  CreateInvoiceDTO,
  RecordPaymentDTO,
  ProcessRefundDTO,
  InvoiceStatus,
  PaymentMethod,
  RefundStatus,
  DiscountType,
  ScholarshipType,
} from '../types/finance';
import { authStorage } from './authStorage';
import { branchStorage } from './branchStorage';
import { academicStorage } from './academicStorage';
import { studentStorage } from './studentStorage';
import { FinancialCalculationEngine } from './financialCalculationEngine';
import {
  CurrencyCode,
  DEFAULT_CURRENCY,
  formatCurrency,
  toMajorUnits,
  toMinorUnits,
  addMinor,
  subtractMinor,
} from '../utils/currency';

const FEE_STRUCTURES_KEY = 'school_fee_structures';
const STUDENT_FEE_ASSIGNMENTS_KEY = 'school_fee_assignments';
const INVOICES_KEY = 'school_invoices';
const PAYMENTS_KEY = 'school_payments';
const REFUNDS_KEY = 'school_refunds';
const FINANCE_SETTINGS_KEY = 'school_finance_settings';

export interface FinanceSettings {
  currency: CurrencyCode;
  receiptHeaderAr: string;
  receiptHeaderEn: string;
  taxRegistrationNumber?: string;
  defaultPaymentDueDays: number;
}

export class FinanceStorageService {
  private static instance: FinanceStorageService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): FinanceStorageService {
    if (!FinanceStorageService.instance) {
      FinanceStorageService.instance = new FinanceStorageService();
    }
    return FinanceStorageService.instance;
  }

  // Multi-branch Isolation & Permission Guards
  public checkBranchAccess(actingUser: SafeUser, targetBranchId: string): void {
    if (authStorage.isSuperAdmin(actingUser)) return;
    if (actingUser.hasAllBranchesAccess) return;

    if (!actingUser.branchIds || !actingUser.branchIds.includes(targetBranchId)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'FINANCIAL_CROSS_BRANCH_REJECTED',
        targetType: 'FINANCE',
        targetId: targetBranchId,
        branchContext: targetBranchId,
        result: 'DENIED',
        details: `أمان النظام: محاولة وصول مالي غير مصرح بها للفرع (${targetBranchId}) من قبل المستخدم (${actingUser.fullName})`,
      });
      throw new Error(`غير مصرح لك بالوصول أو تنفيذ عمليات مالية في هذا الفرع (${targetBranchId}).`);
    }
  }

  public checkPermission(actingUser: SafeUser, requiredPermission: any): void {
    if (authStorage.isSuperAdmin(actingUser)) return;

    if (!authStorage.hasPermission(actingUser, requiredPermission)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'FINANCIAL_UNAUTHORIZED_ATTEMPT',
        targetType: 'FINANCE',
        result: 'DENIED',
        details: `صلاحيات غير كافية: المستخدم (${actingUser.fullName}) لا يملك الصلاحية المطلوبة (${requiredPermission})`,
      });
      throw new Error(`ليس لديك الصلاحية الكافية لإتمام هذه العملية المالية (${requiredPermission}).`);
    }
  }

  // Initialize and Seed Default Financial Data
  public initialize(): void {
    if (this.initialized) return;

    if (!localStorage.getItem(FINANCE_SETTINGS_KEY)) {
      const defaultSettings: FinanceSettings = {
        currency: DEFAULT_CURRENCY,
        receiptHeaderAr: 'مدارس التميز الأهلية النموذجية',
        receiptHeaderEn: 'Excellence Model Schools',
        taxRegistrationNumber: '300987654300003',
        defaultPaymentDueDays: 30,
      };
      localStorage.setItem(FINANCE_SETTINGS_KEY, JSON.stringify(defaultSettings));
    }

    if (!localStorage.getItem(FEE_STRUCTURES_KEY)) {
      localStorage.setItem(FEE_STRUCTURES_KEY, JSON.stringify([]));
    }

    if (!localStorage.getItem(INVOICES_KEY)) {
      localStorage.setItem(INVOICES_KEY, JSON.stringify([]));
    }

    if (!localStorage.getItem(PAYMENTS_KEY)) {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify([]));
    }

    if (!localStorage.getItem(REFUNDS_KEY)) {
      localStorage.setItem(REFUNDS_KEY, JSON.stringify([]));
    }

    if (!localStorage.getItem(STUDENT_FEE_ASSIGNMENTS_KEY)) {
      localStorage.setItem(STUDENT_FEE_ASSIGNMENTS_KEY, JSON.stringify([]));
    }

    this.initialized = true;
  }

  // Raw Storage Accessors
  public getRawFeeStructures(): FeeStructure[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(FEE_STRUCTURES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getRawInvoices(): Invoice[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(INVOICES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getRawPayments(): Payment[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(PAYMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getRawRefunds(): Refund[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(REFUNDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getRawAssignments(): StudentFeeAssignment[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(STUDENT_FEE_ASSIGNMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getFinanceSettings(): FinanceSettings {
    this.initialize();
    try {
      const raw = localStorage.getItem(FINANCE_SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      currency: DEFAULT_CURRENCY,
      receiptHeaderAr: 'مدارس التميز الأهلية النموذجية',
      receiptHeaderEn: 'Excellence Model Schools',
      taxRegistrationNumber: '300987654300003',
      defaultPaymentDueDays: 30,
    };
  }

  public updateFinanceSettings(actingUser: SafeUser, updates: Partial<FinanceSettings>): FinanceSettings {
    if (!authStorage.isSuperAdmin(actingUser) && !authStorage.hasPermission(actingUser, 'settings.edit') && !authStorage.hasPermission(actingUser, 'finance.manage_settings')) {
      throw new Error('ليس لديك الصلاحية لتعديل الإعدادات المالية.');
    }
    const current = this.getFinanceSettings();
    const updated: FinanceSettings = {
      ...current,
      ...updates,
    };
    try {
      localStorage.setItem(FINANCE_SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save finance settings', e);
    }
    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'SYSTEM_SETTINGS_CHANGED',
      targetType: 'SYSTEM',
      result: 'SUCCESS',
      details: `تم تحديث الإعدادات المالية بواسطة ${actingUser.fullName}`,
    });
    return updated;
  }

  // Sequential & Unique Identifiers
  public generateNextInvoiceNumber(branchId: string): string {
    const invoices = this.getRawInvoices();
    const branchInvoices = invoices.filter((inv) => inv.branchId === branchId);
    const year = new Date().getFullYear();
    const count = branchInvoices.length + 1;
    const padded = String(count).padStart(4, '0');
    return `INV-${year}-${padded}`;
  }

  public generateNextReceiptNumber(branchId: string): string {
    const payments = this.getRawPayments();
    const branchPayments = payments.filter((p) => p.branchId === branchId);
    const year = new Date().getFullYear();
    const count = branchPayments.length + 1;
    const padded = String(count).padStart(4, '0');
    return `RCP-${year}-${padded}`;
  }

  public generateNextRefundNumber(branchId: string): string {
    const refunds = this.getRawRefunds();
    const branchRefunds = refunds.filter((r) => r.branchId === branchId);
    const year = new Date().getFullYear();
    const count = branchRefunds.length + 1;
    const padded = String(count).padStart(4, '0');
    return `RFD-${year}-${padded}`;
  }

  // =========================================================================
  // 1. Fee Structures Management
  // =========================================================================

  public listFeeStructures(
    actingUser: SafeUser,
    branchId: string,
    academicYearId?: string
  ): FeeStructure[] {
    this.checkPermission(actingUser, 'fees.view');
    this.checkBranchAccess(actingUser, branchId);

    const list = this.getRawFeeStructures();
    return list.filter(
      (s) => s.branchId === branchId && (!academicYearId || s.academicYearId === academicYearId)
    );
  }

  public createFeeStructure(
    actingUser: SafeUser,
    dto: CreateFeeStructureDTO
  ): FeeStructure {
    this.checkPermission(actingUser, 'fees.manage_structures');
    this.checkBranchAccess(actingUser, dto.branchId);

    if (!dto.nameAr || !dto.nameAr.trim()) {
      throw new Error('اسم هيكل الرسوم بالعربية مطلوب.');
    }
    if (!dto.amountMinor || dto.amountMinor <= 0) {
      throw new Error('يجب تحديد مبلغ رسوم صالح أكبر من الصفر.');
    }

    const structures = this.getRawFeeStructures();
    const newStructure: FeeStructure = {
      id: `fee-str-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      branchId: dto.branchId,
      academicYearId: dto.academicYearId,
      nameAr: dto.nameAr.trim(),
      nameEn: dto.nameEn?.trim() || dto.nameAr.trim(),
      descriptionAr: dto.descriptionAr?.trim(),
      descriptionEn: dto.descriptionEn?.trim(),
      stageId: dto.stageId,
      gradeId: dto.gradeId,
      classId: dto.classId,
      amountMinor: Math.round(dto.amountMinor),
      frequency: dto.frequency || 'ANNUAL',
      effectiveFrom: dto.effectiveFrom || new Date().toISOString().split('T')[0],
      effectiveTo: dto.effectiveTo || new Date().toISOString().split('T')[0],
      active: true,
      createdBy: actingUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    structures.unshift(newStructure);
    localStorage.setItem(FEE_STRUCTURES_KEY, JSON.stringify(structures));

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'FEE_STRUCTURE_CREATED',
      targetType: 'FEE_STRUCTURE',
      targetId: newStructure.id,
      targetIdentifier: newStructure.nameAr,
      branchContext: dto.branchId,
      result: 'SUCCESS',
      details: `تم إنشاء هيكل رسوم جديد (${newStructure.nameAr}) بقيمة ${formatCurrency(newStructure.amountMinor)}`,
    });

    return newStructure;
  }

  public updateFeeStructure(
    actingUser: SafeUser,
    structureId: string,
    updates: Partial<FeeStructure>
  ): FeeStructure {
    this.checkPermission(actingUser, 'fees.manage_structures');

    const structures = this.getRawFeeStructures();
    const index = structures.findIndex((s) => s.id === structureId);
    if (index === -1) {
      throw new Error('هيكل الرسوم المطلوب غير موجود.');
    }

    const existing = structures[index];
    this.checkBranchAccess(actingUser, existing.branchId);

    const updated: FeeStructure = {
      ...existing,
      ...updates,
      id: existing.id,
      branchId: existing.branchId, // Branch cannot be changed
      academicYearId: existing.academicYearId,
      amountMinor: updates.amountMinor !== undefined ? Math.round(updates.amountMinor) : existing.amountMinor,
      updatedBy: actingUser.id,
      updatedAt: new Date().toISOString(),
    };

    structures[index] = updated;
    localStorage.setItem(FEE_STRUCTURES_KEY, JSON.stringify(structures));

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'FEE_STRUCTURE_UPDATED',
      targetType: 'FEE_STRUCTURE',
      targetId: updated.id,
      targetIdentifier: updated.nameAr,
      branchContext: updated.branchId,
      result: 'SUCCESS',
      details: `تم تحديث هيكل الرسوم (${updated.nameAr})`,
    });

    return updated;
  }

  public toggleFeeStructureStatus(actingUser: SafeUser, structureId: string): FeeStructure {
    this.checkPermission(actingUser, 'fees.manage_structures');

    const structures = this.getRawFeeStructures();
    const existing = structures.find((s) => s.id === structureId);
    if (!existing) {
      throw new Error('هيكل الرسوم المطلوب غير موجود.');
    }
    this.checkBranchAccess(actingUser, existing.branchId);

    const newStatus = !existing.active;
    return this.updateFeeStructure(actingUser, structureId, { active: newStatus });
  }

  // =========================================================================
  // 2. Student Fee Assignments
  // =========================================================================

  public assignFeeToStudent(
    actingUser: SafeUser,
    params: {
      branchId: string;
      academicYearId: string;
      studentId: string;
      feeStructureId: string;
      dueDate: string;
      discountAmountMinor?: number;
      scholarshipAmountMinor?: number;
      notes?: string;
    }
  ): StudentFeeAssignment {
    this.checkPermission(actingUser, 'fees.assign');
    this.checkBranchAccess(actingUser, params.branchId);

    const students = studentStorage.getRawStudents();
    const student = students.find((s) => s.id === params.studentId);
    if (!student) {
      throw new Error('الطالب المحدد غير موجود.');
    }
    if (student.branchId !== params.branchId) {
      throw new Error('الطالب لا يتبع الفرع المحدد.');
    }

    const structures = this.getRawFeeStructures();
    const feeStructure = structures.find((s) => s.id === params.feeStructureId);
    if (!feeStructure) {
      throw new Error('هيكل الرسوم المحدد غير موجود.');
    }
    if (feeStructure.branchId !== params.branchId) {
      throw new Error('هيكل الرسوم لا يتبع الفرع المحدد.');
    }

    const enrollments = studentStorage.getRawEnrollments();
    const enrollment = enrollments.find(
      (e) => e.studentId === params.studentId && e.academicYearId === params.academicYearId
    );

    const originalMinor = feeStructure.amountMinor;
    const discountMinor = Math.min(originalMinor, Math.max(0, Math.round(params.discountAmountMinor || 0)));
    const scholarshipMinor = Math.min(
      Math.max(0, originalMinor - discountMinor),
      Math.max(0, Math.round(params.scholarshipAmountMinor || 0))
    );
    const netMinor = Math.max(0, originalMinor - discountMinor - scholarshipMinor);

    const assignments = this.getRawAssignments();
    const newAssignment: StudentFeeAssignment = {
      id: `sfa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      branchId: params.branchId,
      academicYearId: params.academicYearId,
      studentId: params.studentId,
      enrollmentId: enrollment?.id,
      feeStructureId: params.feeStructureId,
      originalAmountMinor: originalMinor,
      discountAmountMinor: discountMinor,
      scholarshipAmountMinor: scholarshipMinor,
      netAmountMinor: netMinor,
      dueDate: params.dueDate,
      status: 'PENDING',
      notes: params.notes,
      createdBy: actingUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    assignments.unshift(newAssignment);
    localStorage.setItem(STUDENT_FEE_ASSIGNMENTS_KEY, JSON.stringify(assignments));

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'FEE_ASSIGNED',
      targetType: 'FEE_ASSIGNMENT',
      targetId: newAssignment.id,
      targetIdentifier: `${student.firstNameAr} ${student.lastNameAr} - ${feeStructure.nameAr}`,
      branchContext: params.branchId,
      result: 'SUCCESS',
      details: `تم إسناد رسوم (${feeStructure.nameAr}) للطالب (${student.firstNameAr} ${student.lastNameAr}) بصافي ${formatCurrency(netMinor)}`,
    });

    return newAssignment;
  }

  public listAssignments(
    actingUser: SafeUser,
    branchId: string,
    academicYearId?: string,
    studentId?: string
  ): PopulatedStudentFeeAssignment[] {
    this.checkPermission(actingUser, 'fees.view');
    this.checkBranchAccess(actingUser, branchId);

    const assignments = this.getRawAssignments();
    const students = studentStorage.getRawStudents();
    const structures = this.getRawFeeStructures();
    const branches = branchStorage.getStoredBranches();

    return assignments
      .filter((a) => {
        if (a.branchId !== branchId) return false;
        if (academicYearId && a.academicYearId !== academicYearId) return false;
        if (studentId && a.studentId !== studentId) return false;
        return true;
      })
      .map((a) => {
        const student = students.find((s) => s.id === a.studentId);
        const structure = structures.find((s) => s.id === a.feeStructureId);
        const branch = branches.find((b) => b.id === a.branchId);

        return {
          ...a,
          studentNameAr: student ? `${student.firstNameAr} ${student.lastNameAr}` : 'طالب غير محدد',
          studentNameEn: student ? `${student.firstNameEn} ${student.lastNameEn}` : 'Unknown Student',
          studentNumber: student?.studentNumber || '',
          feeStructureNameAr: structure?.nameAr || 'رسم غير محدد',
          feeStructureNameEn: structure?.nameEn || 'Unknown Fee',
          branchNameAr: branch?.nameAr || '',
          branchNameEn: branch?.nameEn || '',
        };
      });
  }

  // =========================================================================
  // 3. Invoice Management (Charges & Invoicing)
  // =========================================================================

  public createInvoice(
    actingUser: SafeUser,
    dto: CreateInvoiceDTO,
    asIssued = false
  ): Invoice {
    this.checkPermission(actingUser, asIssued ? 'fees.issue' : 'fees.create');
    this.checkBranchAccess(actingUser, dto.branchId);

    const students = studentStorage.getRawStudents();
    const student = students.find((s) => s.id === dto.studentId);
    if (!student) {
      throw new Error('الطالب المحدد غير موجود.');
    }
    if (student.branchId !== dto.branchId) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'FINANCIAL_CROSS_BRANCH_REJECTED',
        targetType: 'INVOICE',
        branchContext: dto.branchId,
        result: 'DENIED',
        details: `محاولة إصدار فاتورة لطالب يتبع فرعاً آخر: الطالب (${student.firstNameAr}) يتبع فرع (${student.branchId}) والفاتورة في (${dto.branchId})`,
      });
      throw new Error('لا يمكن إصدار فاتورة لطالب مقيد في فرع دراسي آخر.');
    }

    if (!dto.lines || dto.lines.length === 0) {
      throw new Error('يجب إضافة بند واحد على الأقل في الفاتورة.');
    }

    const invoiceId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const invoiceNumber = this.generateNextInvoiceNumber(dto.branchId);

    // Compute Lines
    const lines: InvoiceLine[] = dto.lines.map((l, index) => {
      const gross = FinancialCalculationEngine.calculateLineGross(l.quantity, l.unitAmountMinor);
      return {
        id: `line-${invoiceId}-${index + 1}`,
        invoiceId,
        feeStructureId: l.feeStructureId,
        descriptionAr: l.descriptionAr.trim(),
        descriptionEn: (l.descriptionEn || l.descriptionAr).trim(),
        quantity: Math.max(1, Math.round(l.quantity)),
        unitAmountMinor: Math.round(l.unitAmountMinor),
        grossAmountMinor: gross,
        discountAmountMinor: 0,
        scholarshipAmountMinor: 0,
        netAmountMinor: gross,
      };
    });

    const subtotalMinor = FinancialCalculationEngine.calculateSubtotal(lines);

    // Compute Discounts
    let discountTotalMinor = 0;
    const discounts: InvoiceDiscount[] = [];
    if (dto.discounts && dto.discounts.length > 0) {
      for (const d of dto.discounts) {
        if (d.value > 0) {
          const calculated = FinancialCalculationEngine.calculateDiscount(
            subtotalMinor,
            d.type,
            d.value
          );
          const applicable = Math.min(subtotalMinor - discountTotalMinor, calculated);
          if (applicable > 0) {
            discountTotalMinor = addMinor(discountTotalMinor, applicable);
            discounts.push({
              id: `disc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              invoiceId,
              type: d.type,
              value: d.value,
              calculatedAmountMinor: applicable,
              reason: d.reason || 'خصم مالي معتمد',
              authorizedBy: actingUser.id,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    // Compute Scholarships
    let scholarshipTotalMinor = 0;
    const scholarships: InvoiceScholarship[] = [];
    const afterDiscounts = Math.max(0, subtotalMinor - discountTotalMinor);
    if (dto.scholarships && dto.scholarships.length > 0) {
      for (const s of dto.scholarships) {
        if (s.value > 0) {
          const calculated = FinancialCalculationEngine.calculateScholarship(
            afterDiscounts,
            s.type,
            s.value
          );
          const applicable = Math.min(afterDiscounts - scholarshipTotalMinor, calculated);
          if (applicable > 0) {
            scholarshipTotalMinor = addMinor(scholarshipTotalMinor, applicable);
            scholarships.push({
              id: `schol-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              invoiceId,
              type: s.type,
              value: s.value,
              calculatedAmountMinor: applicable,
              reason: s.reason || 'منحة دراسية معتمدة',
              authorizedBy: actingUser.id,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    const netTotalMinor = FinancialCalculationEngine.calculateNetTotal(
      subtotalMinor,
      discountTotalMinor,
      scholarshipTotalMinor
    );

    const enrollments = studentStorage.getRawEnrollments();
    const enrollment = enrollments.find(
      (e) => e.studentId === dto.studentId && e.academicYearId === dto.academicYearId
    );

    const initialStatus: InvoiceStatus = asIssued ? 'ISSUED' : 'DRAFT';

    const newInvoice: Invoice = {
      id: invoiceId,
      branchId: dto.branchId,
      academicYearId: dto.academicYearId,
      studentId: dto.studentId,
      enrollmentId: enrollment?.id,
      invoiceNumber,
      issueDate: dto.issueDate || new Date().toISOString().split('T')[0],
      dueDate: dto.dueDate || new Date().toISOString().split('T')[0],
      subtotalMinor,
      discountTotalMinor,
      scholarshipTotalMinor,
      netTotalMinor,
      paidTotalMinor: 0,
      balanceDueMinor: netTotalMinor,
      status: initialStatus,
      notes: dto.notes?.trim(),
      createdBy: actingUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines,
      discounts,
      scholarships,
    };

    const invoices = this.getRawInvoices();
    invoices.unshift(newInvoice);
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: asIssued ? 'INVOICE_ISSUED' : 'INVOICE_CREATED',
      targetType: 'INVOICE',
      targetId: newInvoice.id,
      targetIdentifier: newInvoice.invoiceNumber,
      branchContext: dto.branchId,
      result: 'SUCCESS',
      details: `تم إنشاء فاتورة (${newInvoice.invoiceNumber}) للطالب (${student.firstNameAr} ${student.lastNameAr}) بصافي ${formatCurrency(netTotalMinor)}`,
    });

    return newInvoice;
  }

  public issueDraftInvoice(actingUser: SafeUser, invoiceId: string): Invoice {
    this.checkPermission(actingUser, 'fees.issue');

    const invoices = this.getRawInvoices();
    const index = invoices.findIndex((i) => i.id === invoiceId);
    if (index === -1) {
      throw new Error('الفاتورة المطلوبة غير موجودة.');
    }

    const invoice = invoices[index];
    this.checkBranchAccess(actingUser, invoice.branchId);

    if (invoice.status !== 'DRAFT') {
      throw new Error(`لا يمكن إصدار فاتورة بحالتها الحالية (${invoice.status}). فقط المسودات قابلة للإصدار.`);
    }

    invoice.status = 'ISSUED';
    invoice.updatedBy = actingUser.id;
    invoice.updatedAt = new Date().toISOString();

    invoices[index] = invoice;
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'INVOICE_ISSUED',
      targetType: 'INVOICE',
      targetId: invoice.id,
      targetIdentifier: invoice.invoiceNumber,
      branchContext: invoice.branchId,
      result: 'SUCCESS',
      details: `تم اعتماد وإصدار الفاتورة (${invoice.invoiceNumber}) رسمياً`,
    });

    return invoice;
  }

  public voidInvoice(actingUser: SafeUser, invoiceId: string, voidReason: string): Invoice {
    this.checkPermission(actingUser, 'fees.void');

    if (!voidReason || !voidReason.trim()) {
      throw new Error('يجب ذكر سبب ومبرر إلغاء الفاتورة وإبطالها (Void Reason).');
    }

    const invoices = this.getRawInvoices();
    const index = invoices.findIndex((i) => i.id === invoiceId);
    if (index === -1) {
      throw new Error('الفاتورة المطلوبة غير موجودة.');
    }

    const invoice = invoices[index];
    this.checkBranchAccess(actingUser, invoice.branchId);

    // Paid or partially paid invoices cannot be simply voided without handling payments
    if (invoice.paidTotalMinor > 0) {
      throw new Error('لا يمكن إبطال فاتورة تحتوي على مدفوعات مقبوضة. يرجى معالجة الاسترداد أولاً.');
    }

    invoice.status = 'VOID';
    invoice.voidReason = voidReason.trim();
    invoice.balanceDueMinor = 0;
    invoice.updatedBy = actingUser.id;
    invoice.updatedAt = new Date().toISOString();

    invoices[index] = invoice;
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'INVOICE_VOIDED',
      targetType: 'INVOICE',
      targetId: invoice.id,
      targetIdentifier: invoice.invoiceNumber,
      branchContext: invoice.branchId,
      result: 'SUCCESS',
      details: `تم إبطال الفاتورة (${invoice.invoiceNumber}). السبب: ${voidReason}`,
    });

    return invoice;
  }

  public getInvoiceById(actingUser: SafeUser, invoiceId: string): PopulatedInvoice {
    this.checkPermission(actingUser, 'fees.view');

    const invoices = this.getRawInvoices();
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) {
      throw new Error('الفاتورة غير موجودة.');
    }

    this.checkBranchAccess(actingUser, invoice.branchId);
    return this.populateInvoice(invoice);
  }

  public listInvoices(
    actingUser: SafeUser,
    branchId: string,
    filters?: {
      academicYearId?: string;
      studentId?: string;
      status?: InvoiceStatus;
      startDate?: string;
      endDate?: string;
    }
  ): PopulatedInvoice[] {
    this.checkPermission(actingUser, 'fees.view');
    this.checkBranchAccess(actingUser, branchId);

    let list = this.getRawInvoices().filter((inv) => inv.branchId === branchId);

    if (filters?.academicYearId) {
      list = list.filter((i) => i.academicYearId === filters.academicYearId);
    }
    if (filters?.studentId) {
      list = list.filter((i) => i.studentId === filters.studentId);
    }
    if (filters?.status) {
      list = list.filter((i) => i.status === filters.status);
    }
    if (filters?.startDate) {
      list = list.filter((i) => i.issueDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      list = list.filter((i) => i.issueDate <= filters.endDate!);
    }

    return list.map((inv) => this.populateInvoice(inv));
  }

  private populateInvoice(invoice: Invoice): PopulatedInvoice {
    const students = studentStorage.getRawStudents();
    const branches = branchStorage.getStoredBranches();
    const years = academicStorage.getRawYears();
    const enrollments = studentStorage.getRawEnrollments();
    const classes = academicStorage.getRawClasses();

    const student = students.find((s) => s.id === invoice.studentId);
    const branch = branches.find((b) => b.id === invoice.branchId);
    const year = years.find((y) => y.id === invoice.academicYearId);
    const enrollment = enrollments.find(
      (e) => e.studentId === invoice.studentId && e.academicYearId === invoice.academicYearId
    );
    const cls = enrollment ? classes.find((c) => c.id === enrollment.classId) : undefined;

    return {
      ...invoice,
      studentNameAr: student ? `${student.firstNameAr} ${student.lastNameAr}` : 'طالب غير محدد',
      studentNameEn: student ? `${student.firstNameEn} ${student.lastNameEn}` : 'Unknown Student',
      studentNumber: student?.studentNumber || '',
      branchNameAr: branch?.nameAr || '',
      branchNameEn: branch?.nameEn || '',
      academicYearNameAr: year?.nameAr || '',
      academicYearNameEn: year?.nameEn || '',
      classNameAr: cls?.nameAr,
      classNameEn: cls?.nameEn,
    };
  }

  // =========================================================================
  // 4. Payments & Receipts Management
  // =========================================================================

  public recordPayment(actingUser: SafeUser, dto: RecordPaymentDTO): { payment: Payment; invoice: Invoice; receipt: ReceiptData } {
    this.checkPermission(actingUser, 'payments.create');
    this.checkBranchAccess(actingUser, dto.branchId);

    if (!dto.amountMinor || dto.amountMinor <= 0) {
      throw new Error('يجب إدخال مبلغ سداد صالح أكبر من الصفر.');
    }

    const invoices = this.getRawInvoices();
    const invIndex = invoices.findIndex((i) => i.id === dto.invoiceId);
    if (invIndex === -1) {
      throw new Error('الفاتورة المراد سدادها غير موجودة.');
    }

    const invoice = invoices[invIndex];

    // Branch Isolation Check on Invoice vs Target Branch
    if (invoice.branchId !== dto.branchId) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'FINANCIAL_CROSS_BRANCH_REJECTED',
        targetType: 'PAYMENT',
        branchContext: dto.branchId,
        result: 'DENIED',
        details: `محاولة سداد فاتورة فرع آخر: الفاتورة (${invoice.invoiceNumber}) في (${invoice.branchId}) ومحاولة السداد في (${dto.branchId})`,
      });
      throw new Error('غير مصرح بسداد فاتورة تابعة لفرع آخر.');
    }

    // Student & Year match validation
    if (invoice.studentId !== dto.studentId) {
      throw new Error('معرف الطالب لا يتطابق مع الطالب المسجل في الفاتورة.');
    }
    if (invoice.academicYearId !== dto.academicYearId) {
      throw new Error('العام الدراسي المحدد لا يتطابق مع العام الدراسي للفاتورة.');
    }

    // Status validation
    if (invoice.status === 'VOID') {
      throw new Error('لا يمكن تسجيل سداد على فاتورة ملغاة / مبطلة (Void).');
    }
    if (invoice.status === 'DRAFT') {
      throw new Error('يجب اعتماد وإصدار الفاتورة أولاً قبل تسجيل الدفعات عليها.');
    }
    if (invoice.status === 'PAID') {
      throw new Error('هذه الفاتورة مسددة بالكامل بالفعل.');
    }

    // CRITICAL OVERPAYMENT POLICY CHECK:
    // Reject payments exceeding current balance due
    if (dto.amountMinor > invoice.balanceDueMinor) {
      throw new Error(
        `مبلغ السداد (${formatCurrency(dto.amountMinor)}) يتجاوز الرصيد المستحق المتبقي على الفاتورة (${formatCurrency(invoice.balanceDueMinor)}).`
      );
    }

    // Concurrency & Duplicate receipt protection
    const payments = this.getRawPayments();
    const receiptNumber = this.generateNextReceiptNumber(dto.branchId);

    const existingReceipt = payments.find((p) => p.receiptNumber === receiptNumber);
    if (existingReceipt) {
      throw new Error(`رقم سند القبض (${receiptNumber}) تم استخدامه مسبقاً. يرجى إعادة المحاولة.`);
    }

    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newPayment: Payment = {
      id: paymentId,
      branchId: dto.branchId,
      academicYearId: dto.academicYearId,
      studentId: dto.studentId,
      invoiceId: dto.invoiceId,
      receiptNumber,
      paymentDate: dto.paymentDate || new Date().toISOString().split('T')[0],
      amountMinor: Math.round(dto.amountMinor),
      method: dto.method || 'CASH',
      reference: dto.reference?.trim(),
      notes: dto.notes?.trim(),
      status: 'COMPLETED',
      receivedBy: actingUser.id,
      receivedByName: actingUser.fullName,
      createdAt: new Date().toISOString(),
    };

    payments.unshift(newPayment);
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));

    // Update Invoice Balance & Status atomically
    const invoicePayments = payments.filter((p) => p.invoiceId === invoice.id);
    const refunds = this.getRawRefunds().filter((r) => r.invoiceId === invoice.id);

    const paidTotalMinor = FinancialCalculationEngine.calculatePaidTotal(invoicePayments, refunds);
    const balanceDueMinor = FinancialCalculationEngine.calculateBalance(invoice.netTotalMinor, paidTotalMinor);
    const newStatus = FinancialCalculationEngine.calculateInvoiceStatus({
      status: invoice.status,
      netTotalMinor: invoice.netTotalMinor,
      paidTotalMinor,
      dueDate: invoice.dueDate,
    });

    invoice.paidTotalMinor = paidTotalMinor;
    invoice.balanceDueMinor = balanceDueMinor;
    invoice.status = newStatus;
    invoice.updatedBy = actingUser.id;
    invoice.updatedAt = new Date().toISOString();

    invoices[invIndex] = invoice;
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'PAYMENT_CREATED',
      targetType: 'PAYMENT',
      targetId: newPayment.id,
      targetIdentifier: newPayment.receiptNumber,
      branchContext: dto.branchId,
      result: 'SUCCESS',
      details: `تم تسجيل سند قبض (${newPayment.receiptNumber}) بمبلغ ${formatCurrency(newPayment.amountMinor)} على الفاتورة (${invoice.invoiceNumber})`,
    });

    const receipt = this.generateReceiptData(newPayment, invoice);
    return { payment: newPayment, invoice, receipt };
  }

  public generateReceiptData(payment: Payment, invoice?: Invoice): ReceiptData {
    const students = studentStorage.getRawStudents();
    const branches = branchStorage.getStoredBranches();
    const years = academicStorage.getRawYears();
    const settings = this.getFinanceSettings();

    if (!invoice) {
      invoice = this.getRawInvoices().find((i) => i.id === payment.invoiceId);
    }

    const student = students.find((s) => s.id === payment.studentId);
    const branch = branches.find((b) => b.id === payment.branchId);
    const year = years.find((y) => y.id === payment.academicYearId);

    return {
      receiptNumber: payment.receiptNumber,
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      invoiceNumber: invoice?.invoiceNumber || '',
      studentId: payment.studentId,
      studentNumber: student?.studentNumber || '',
      studentNameAr: student ? `${student.firstNameAr} ${student.lastNameAr}` : 'طالب غير محدد',
      studentNameEn: student ? `${student.firstNameEn} ${student.lastNameEn}` : 'Unknown Student',
      branchId: payment.branchId,
      branchNameAr: branch?.nameAr || '',
      branchNameEn: branch?.nameEn || '',
      academicYearId: payment.academicYearId,
      academicYearNameAr: year?.nameAr || '',
      academicYearNameEn: year?.nameEn || '',
      paymentDate: payment.paymentDate,
      amountMinor: payment.amountMinor,
      method: payment.method,
      reference: payment.reference,
      notes: payment.notes,
      receivedByName: payment.receivedByName,
      invoiceSubtotalMinor: invoice?.subtotalMinor || 0,
      invoiceDiscountTotalMinor: invoice?.discountTotalMinor || 0,
      invoiceScholarshipTotalMinor: invoice?.scholarshipTotalMinor || 0,
      invoiceNetTotalMinor: invoice?.netTotalMinor || 0,
      invoicePaidTotalMinor: invoice?.paidTotalMinor || 0,
      invoiceRemainingBalanceMinor: invoice?.balanceDueMinor || 0,
      currency: settings.currency,
    };
  }

  public listPayments(
    actingUser: SafeUser,
    branchId: string,
    filters?: {
      academicYearId?: string;
      studentId?: string;
      invoiceId?: string;
      method?: PaymentMethod;
      startDate?: string;
      endDate?: string;
    }
  ): PopulatedPayment[] {
    this.checkPermission(actingUser, 'payments.view');
    this.checkBranchAccess(actingUser, branchId);

    const payments = this.getRawPayments().filter((p) => p.branchId === branchId);
    const students = studentStorage.getRawStudents();
    const invoices = this.getRawInvoices();
    const branches = branchStorage.getStoredBranches();

    let list = payments;
    if (filters?.academicYearId) {
      list = list.filter((p) => p.academicYearId === filters.academicYearId);
    }
    if (filters?.studentId) {
      list = list.filter((p) => p.studentId === filters.studentId);
    }
    if (filters?.invoiceId) {
      list = list.filter((p) => p.invoiceId === filters.invoiceId);
    }
    if (filters?.method) {
      list = list.filter((p) => p.method === filters.method);
    }
    if (filters?.startDate) {
      list = list.filter((p) => p.paymentDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      list = list.filter((p) => p.paymentDate <= filters.endDate!);
    }

    return list.map((p) => {
      const student = students.find((s) => s.id === p.studentId);
      const invoice = invoices.find((i) => i.id === p.invoiceId);
      const branch = branches.find((b) => b.id === p.branchId);

      return {
        ...p,
        studentNameAr: student ? `${student.firstNameAr} ${student.lastNameAr}` : 'طالب غير محدد',
        studentNameEn: student ? `${student.firstNameEn} ${student.lastNameEn}` : 'Unknown Student',
        studentNumber: student?.studentNumber || '',
        invoiceNumber: invoice?.invoiceNumber || '',
        branchNameAr: branch?.nameAr || '',
        branchNameEn: branch?.nameEn || '',
      };
    });
  }

  // =========================================================================
  // 5. Refunds Management (Controlled & Non-Destructive)
  // =========================================================================

  public processRefund(
    actingUser: SafeUser,
    dto: ProcessRefundDTO
  ): { refund: Refund; invoice: Invoice } {
    this.checkPermission(actingUser, 'payments.refund');
    this.checkBranchAccess(actingUser, dto.branchId);

    if (!dto.amountMinor || dto.amountMinor <= 0) {
      throw new Error('يجب تحديد مبلغ استرداد صالح أكبر من الصفر.');
    }
    if (!dto.reason || !dto.reason.trim()) {
      throw new Error('يجب ذكر سبب ومبرر الاسترداد المالي.');
    }

    const payments = this.getRawPayments();
    const payment = payments.find((p) => p.id === dto.paymentId);
    if (!payment) {
      throw new Error('سند القبض المراد استرداده غير موجود.');
    }
    if (payment.branchId !== dto.branchId) {
      throw new Error('سند القبض يتبع فرعاً آخر ولا يمكن استرداده من هذا الفرع.');
    }
    if (payment.status === 'VOIDED') {
      throw new Error('لا يمكن استرداد دفعة ملغاة مسبقاً.');
    }

    // Check previously processed refunds on this payment
    const refunds = this.getRawRefunds();
    const paymentRefunds = refunds.filter(
      (r) => r.paymentId === payment.id && r.status === 'PROCESSED'
    );
    const previouslyRefundedMinor = FinancialCalculationEngine.calculateRefunded(paymentRefunds);
    const maxRefundableMinor = Math.max(0, payment.amountMinor - previouslyRefundedMinor);

    if (dto.amountMinor > maxRefundableMinor) {
      throw new Error(
        `مبلغ الاسترداد (${formatCurrency(dto.amountMinor)}) يتجاوز الحد الأقصى القابل للاسترداد لهذا السند (${formatCurrency(maxRefundableMinor)}).`
      );
    }

    const invoices = this.getRawInvoices();
    const invIndex = invoices.findIndex((i) => i.id === payment.invoiceId);
    if (invIndex === -1) {
      throw new Error('الفاتورة الأصلية غير موجودة.');
    }
    const invoice = invoices[invIndex];

    const refundNumber = this.generateNextRefundNumber(dto.branchId);
    const refundId = `rfd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newRefund: Refund = {
      id: refundId,
      branchId: dto.branchId,
      academicYearId: payment.academicYearId,
      studentId: payment.studentId,
      paymentId: payment.id,
      invoiceId: invoice.id,
      refundNumber,
      refundDate: new Date().toISOString().split('T')[0],
      amountMinor: Math.round(dto.amountMinor),
      reason: dto.reason.trim(),
      method: dto.method || payment.method,
      status: 'PROCESSED',
      approvedBy: actingUser.id,
      approvedByName: actingUser.fullName,
      processedBy: actingUser.id,
      processedByName: actingUser.fullName,
      createdAt: new Date().toISOString(),
    };

    refunds.unshift(newRefund);
    localStorage.setItem(REFUNDS_KEY, JSON.stringify(refunds));

    // Recalculate invoice paid total and balance due
    const invoicePayments = payments.filter((p) => p.invoiceId === invoice.id);
    const allInvoiceRefunds = refunds.filter(
      (r) => r.invoiceId === invoice.id && r.status === 'PROCESSED'
    );

    const paidTotalMinor = FinancialCalculationEngine.calculatePaidTotal(invoicePayments, allInvoiceRefunds);
    const balanceDueMinor = FinancialCalculationEngine.calculateBalance(invoice.netTotalMinor, paidTotalMinor);
    const newStatus = FinancialCalculationEngine.calculateInvoiceStatus({
      status: invoice.status,
      netTotalMinor: invoice.netTotalMinor,
      paidTotalMinor,
      dueDate: invoice.dueDate,
      hasRefunds: true,
    });

    invoice.paidTotalMinor = paidTotalMinor;
    invoice.balanceDueMinor = balanceDueMinor;
    invoice.status = newStatus;
    invoice.updatedBy = actingUser.id;
    invoice.updatedAt = new Date().toISOString();

    invoices[invIndex] = invoice;
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'REFUND_PROCESSED',
      targetType: 'REFUND',
      targetId: newRefund.id,
      targetIdentifier: newRefund.refundNumber,
      branchContext: dto.branchId,
      result: 'SUCCESS',
      details: `تمت معالجة سند استرداد (${newRefund.refundNumber}) بمبلغ ${formatCurrency(newRefund.amountMinor)} مرتبط بالسند (${payment.receiptNumber})`,
    });

    return { refund: newRefund, invoice };
  }

  public listRefunds(
    actingUser: SafeUser,
    branchId: string,
    filters?: {
      academicYearId?: string;
      studentId?: string;
      invoiceId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): PopulatedRefund[] {
    this.checkPermission(actingUser, 'payments.view');
    this.checkBranchAccess(actingUser, branchId);

    const refunds = this.getRawRefunds().filter((r) => r.branchId === branchId);
    const students = studentStorage.getRawStudents();
    const invoices = this.getRawInvoices();
    const payments = this.getRawPayments();
    const branches = branchStorage.getStoredBranches();

    let list = refunds;
    if (filters?.academicYearId) {
      list = list.filter((r) => r.academicYearId === filters.academicYearId);
    }
    if (filters?.studentId) {
      list = list.filter((r) => r.studentId === filters.studentId);
    }
    if (filters?.invoiceId) {
      list = list.filter((r) => r.invoiceId === filters.invoiceId);
    }
    if (filters?.startDate) {
      list = list.filter((r) => r.refundDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      list = list.filter((r) => r.refundDate <= filters.endDate!);
    }

    return list.map((r) => {
      const student = students.find((s) => s.id === r.studentId);
      const invoice = invoices.find((i) => i.id === r.invoiceId);
      const payment = payments.find((p) => p.id === r.paymentId);
      const branch = branches.find((b) => b.id === r.branchId);

      return {
        ...r,
        studentNameAr: student ? `${student.firstNameAr} ${student.lastNameAr}` : 'طالب غير محدد',
        studentNameEn: student ? `${student.firstNameEn} ${student.lastNameEn}` : 'Unknown Student',
        studentNumber: student?.studentNumber || '',
        invoiceNumber: invoice?.invoiceNumber || '',
        receiptNumber: payment?.receiptNumber || '',
        branchNameAr: branch?.nameAr || '',
        branchNameEn: branch?.nameEn || '',
      };
    });
  }

  // =========================================================================
  // 6. Student Financial Statement & Profile
  // =========================================================================

  public getStudentFinancialStatement(
    actingUser: SafeUser,
    studentId: string,
    academicYearId?: string
  ): StudentFinancialStatement {
    this.checkPermission(actingUser, 'fees.view');

    const students = studentStorage.getRawStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      throw new Error('الطالب المطلوب غير موجود.');
    }
    this.checkBranchAccess(actingUser, student.branchId);

    const branches = branchStorage.getStoredBranches();
    const branch = branches.find((b) => b.id === student.branchId);

    // Invoices for student
    let invoices = this.getRawInvoices().filter((i) => i.studentId === studentId);
    if (academicYearId) {
      invoices = invoices.filter((i) => i.academicYearId === academicYearId);
    }
    const populatedInvoices = invoices.map((inv) => this.populateInvoice(inv));

    // Payments for student
    let payments = this.getRawPayments().filter((p) => p.studentId === studentId && p.status === 'COMPLETED');
    if (academicYearId) {
      payments = payments.filter((p) => p.academicYearId === academicYearId);
    }
    const populatedPayments = this.listPayments(actingUser, student.branchId, {
      studentId,
      academicYearId,
    });

    // Refunds for student
    let refunds = this.getRawRefunds().filter((r) => r.studentId === studentId && r.status === 'PROCESSED');
    if (academicYearId) {
      refunds = refunds.filter((r) => r.academicYearId === academicYearId);
    }
    const populatedRefunds = this.listRefunds(actingUser, student.branchId, {
      studentId,
      academicYearId,
    });

    // Cumulative sums
    const totalBilledMinor = addMinor(...invoices.filter((i) => i.status !== 'VOID').map((i) => i.subtotalMinor));
    const totalDiscountsMinor = addMinor(...invoices.filter((i) => i.status !== 'VOID').map((i) => i.discountTotalMinor));
    const totalScholarshipsMinor = addMinor(...invoices.filter((i) => i.status !== 'VOID').map((i) => i.scholarshipTotalMinor));
    const totalNetBilledMinor = addMinor(...invoices.filter((i) => i.status !== 'VOID').map((i) => i.netTotalMinor));
    const totalPaidMinor = addMinor(...payments.map((p) => p.amountMinor));
    const totalRefundedMinor = addMinor(...refunds.map((r) => r.amountMinor));
    const netCollectedMinor = Math.max(0, totalPaidMinor - totalRefundedMinor);
    const outstandingBalanceMinor = addMinor(...invoices.filter((i) => i.status !== 'VOID').map((i) => i.balanceDueMinor));

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueAmountMinor = addMinor(
      ...invoices
        .filter((i) => i.status !== 'VOID' && i.status !== 'PAID' && i.dueDate < todayStr)
        .map((i) => i.balanceDueMinor)
    );

    return {
      studentId: student.id,
      studentNumber: student.studentNumber,
      studentNameAr: `${student.firstNameAr} ${student.lastNameAr}`,
      studentNameEn: `${student.firstNameEn} ${student.lastNameEn}`,
      branchId: student.branchId,
      branchNameAr: branch?.nameAr || '',
      branchNameEn: branch?.nameEn || '',
      academicYearId: academicYearId || 'all',
      totalBilledMinor,
      totalDiscountsMinor,
      totalScholarshipsMinor,
      totalNetBilledMinor,
      totalPaidMinor,
      totalRefundedMinor,
      netCollectedMinor,
      outstandingBalanceMinor,
      overdueAmountMinor,
      invoices: populatedInvoices,
      payments: populatedPayments,
      refunds: populatedRefunds,
    };
  }

  // =========================================================================
  // 7. Financial Dashboard Metrics (Audited & Calculated)
  // =========================================================================

  public getDashboardMetrics(
    actingUser: SafeUser,
    branchId: string,
    academicYearId?: string
  ): FinancialDashboardMetrics {
    this.checkPermission(actingUser, 'fees.view');
    this.checkBranchAccess(actingUser, branchId);

    let invoices = this.getRawInvoices().filter((i) => i.branchId === branchId && i.status !== 'VOID');
    let payments = this.getRawPayments().filter((p) => p.branchId === branchId && p.status === 'COMPLETED');
    let refunds = this.getRawRefunds().filter((r) => r.branchId === branchId && r.status === 'PROCESSED');

    if (academicYearId) {
      invoices = invoices.filter((i) => i.academicYearId === academicYearId);
      payments = payments.filter((p) => p.academicYearId === academicYearId);
      refunds = refunds.filter((r) => r.academicYearId === academicYearId);
    }

    const totalInvoicedMinor = addMinor(...invoices.map((i) => i.netTotalMinor));
    const totalDiscountsMinor = addMinor(...invoices.map((i) => i.discountTotalMinor));
    const totalScholarshipsMinor = addMinor(...invoices.map((i) => i.scholarshipTotalMinor));
    const totalCollectedMinor = addMinor(...payments.map((p) => p.amountMinor));
    const totalRefundsMinor = addMinor(...refunds.map((r) => r.amountMinor));
    const netCollectionMinor = Math.max(0, totalCollectedMinor - totalRefundsMinor);
    const outstandingBalanceMinor = addMinor(...invoices.map((i) => i.balanceDueMinor));

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueAmountMinor = addMinor(
      ...invoices
        .filter((i) => i.status !== 'PAID' && i.dueDate < todayStr)
        .map((i) => i.balanceDueMinor)
    );

    const collectionRatePercentage =
      totalInvoicedMinor > 0
        ? Math.min(100, Math.round((netCollectionMinor / totalInvoicedMinor) * 100))
        : 0;

    const invoicesCountByStatus: Record<InvoiceStatus, number> = {
      DRAFT: 0,
      ISSUED: 0,
      PARTIALLY_PAID: 0,
      PAID: 0,
      OVERDUE: 0,
      VOID: 0,
      REFUNDED: 0,
    };

    invoices.forEach((inv) => {
      invoicesCountByStatus[inv.status] = (invoicesCountByStatus[inv.status] || 0) + 1;
    });

    const paymentsCountByMethod: Record<PaymentMethod, { count: number; totalMinor: number }> = {
      CASH: { count: 0, totalMinor: 0 },
      BANK_TRANSFER: { count: 0, totalMinor: 0 },
      CARD: { count: 0, totalMinor: 0 },
      CHEQUE: { count: 0, totalMinor: 0 },
      ONLINE: { count: 0, totalMinor: 0 },
      OTHER: { count: 0, totalMinor: 0 },
    };

    payments.forEach((p) => {
      if (!paymentsCountByMethod[p.method]) {
        paymentsCountByMethod[p.method] = { count: 0, totalMinor: 0 };
      }
      paymentsCountByMethod[p.method].count += 1;
      paymentsCountByMethod[p.method].totalMinor = addMinor(
        paymentsCountByMethod[p.method].totalMinor,
        p.amountMinor
      );
    });

    return {
      totalInvoicedMinor,
      totalCollectedMinor,
      outstandingBalanceMinor,
      overdueAmountMinor,
      totalDiscountsMinor,
      totalScholarshipsMinor,
      totalRefundsMinor,
      netCollectionMinor,
      collectionRatePercentage,
      invoicesCountByStatus,
      paymentsCountByMethod,
    };
  }

  // =========================================================================
  // 8. Financial Reports Generation (10 Specific Reports)
  // =========================================================================

  public generateReport(
    actingUser: SafeUser,
    reportKey:
      | 'student_statement'
      | 'outstanding_fees'
      | 'paid_fees'
      | 'daily_collection'
      | 'payment_method'
      | 'overdue_fees'
      | 'discounts'
      | 'scholarships'
      | 'refunds'
      | 'invoice_register',
    params: {
      branchId: string;
      academicYearId?: string;
      startDate?: string;
      endDate?: string;
      studentId?: string;
      paymentMethod?: PaymentMethod;
    }
  ): { titleAr: string; titleEn: string; headers: string[]; rows: (string | number)[][]; summary?: Record<string, string | number> } {
    this.checkPermission(actingUser, 'finance.view_reports');
    this.checkBranchAccess(actingUser, params.branchId);

    const invoices = this.listInvoices(actingUser, params.branchId, {
      academicYearId: params.academicYearId,
      startDate: params.startDate,
      endDate: params.endDate,
      studentId: params.studentId,
    });

    const payments = this.listPayments(actingUser, params.branchId, {
      academicYearId: params.academicYearId,
      startDate: params.startDate,
      endDate: params.endDate,
      studentId: params.studentId,
      method: params.paymentMethod,
    });

    const refunds = this.listRefunds(actingUser, params.branchId, {
      academicYearId: params.academicYearId,
      startDate: params.startDate,
      endDate: params.endDate,
      studentId: params.studentId,
    });

    const todayStr = new Date().toISOString().split('T')[0];

    switch (reportKey) {
      // 1. Student Statement
      case 'student_statement': {
        const studentId = params.studentId || (invoices[0]?.studentId);
        if (!studentId) {
          return {
            titleAr: 'كشف حساب الطالب المالي',
            titleEn: 'Student Financial Statement',
            headers: ['التاريخ', 'النوع', 'الرقم المرجعي', 'البيان', 'مدين', 'دائن', 'الرصيد'],
            rows: [],
          };
        }
        const statement = this.getStudentFinancialStatement(actingUser, studentId, params.academicYearId);
        const rows: (string | number)[][] = [];

        statement.invoices.forEach((inv) => {
          rows.push([
            inv.issueDate,
            'فاتورة رسوم',
            inv.invoiceNumber,
            inv.notes || 'استحقاق رسوم دراسية',
            toMajorUnits(inv.netTotalMinor).toFixed(2),
            '0.00',
            toMajorUnits(inv.balanceDueMinor).toFixed(2),
          ]);
        });

        statement.payments.forEach((pay) => {
          rows.push([
            pay.paymentDate,
            'سند قبض',
            pay.receiptNumber,
            `سداد دفعة (${pay.method})`,
            '0.00',
            toMajorUnits(pay.amountMinor).toFixed(2),
            '-',
          ]);
        });

        statement.refunds.forEach((rfd) => {
          rows.push([
            rfd.refundDate,
            'سند استرداد',
            rfd.refundNumber,
            rfd.reason,
            toMajorUnits(rfd.amountMinor).toFixed(2),
            '0.00',
            '-',
          ]);
        });

        return {
          titleAr: `كشف حساب مالي - ${statement.studentNameAr} (${statement.studentNumber})`,
          titleEn: `Financial Statement - ${statement.studentNameEn}`,
          headers: ['التاريخ', 'النوع', 'الرقم المرجعي', 'البيان', 'مدين (SAR)', 'دائن (SAR)', 'الرصيد المتبقي (SAR)'],
          rows,
          summary: {
            'إجمالي الرسوم': toMajorUnits(statement.totalNetBilledMinor).toFixed(2),
            'إجمالي المسدد': toMajorUnits(statement.netCollectedMinor).toFixed(2),
            'الرصيد المستحق': toMajorUnits(statement.outstandingBalanceMinor).toFixed(2),
          },
        };
      }

      // 2. Outstanding Fees Report
      case 'outstanding_fees': {
        const outstanding = invoices.filter((i) => i.balanceDueMinor > 0 && i.status !== 'VOID');
        const rows = outstanding.map((i) => [
          i.invoiceNumber,
          i.studentNumber,
          i.studentNameAr,
          i.classNameAr || '-',
          i.dueDate,
          toMajorUnits(i.netTotalMinor).toFixed(2),
          toMajorUnits(i.paidTotalMinor).toFixed(2),
          toMajorUnits(i.balanceDueMinor).toFixed(2),
          i.status,
        ]);
        const totalOutstanding = addMinor(...outstanding.map((i) => i.balanceDueMinor));
        return {
          titleAr: 'تقرير الرسوم والمتأخرات المستحقة',
          titleEn: 'Outstanding Fees Ledger Report',
          headers: ['رقم الفاتورة', 'رقم الطالب', 'اسم الطالب', 'الفصل', 'تاريخ الاستحقاق', 'الصافي', 'المسدد', 'المتبقي', 'الحالة'],
          rows,
          summary: {
            'عدد الفواتير المستحقة': outstanding.length,
            'إجمالي المبالغ المستحقة': toMajorUnits(totalOutstanding).toFixed(2),
          },
        };
      }

      // 3. Paid Fees Report
      case 'paid_fees': {
        const paidInvoices = invoices.filter((i) => i.status === 'PAID');
        const rows = paidInvoices.map((i) => [
          i.invoiceNumber,
          i.studentNumber,
          i.studentNameAr,
          i.issueDate,
          toMajorUnits(i.netTotalMinor).toFixed(2),
          toMajorUnits(i.paidTotalMinor).toFixed(2),
          'مسددة بالكامل',
        ]);
        const totalPaid = addMinor(...paidInvoices.map((i) => i.paidTotalMinor));
        return {
          titleAr: 'تقرير الرسوم المسددة بالكامل',
          titleEn: 'Fully Paid Fees Report',
          headers: ['رقم الفاتورة', 'رقم الطالب', 'اسم الطالب', 'تاريخ الإصدار', 'الصافي', 'المسدد', 'الحالة'],
          rows,
          summary: {
            'عدد الفواتير المسددة': paidInvoices.length,
            'إجمالي المبالغ المسددة': toMajorUnits(totalPaid).toFixed(2),
          },
        };
      }

      // 4. Daily Collection Report
      case 'daily_collection': {
        const rows = payments.map((p) => [
          p.paymentDate,
          p.receiptNumber,
          p.studentNumber,
          p.studentNameAr,
          p.invoiceNumber,
          p.method,
          p.reference || '-',
          toMajorUnits(p.amountMinor).toFixed(2),
          p.receivedByName,
        ]);
        const totalCollected = addMinor(...payments.map((p) => p.amountMinor));
        return {
          titleAr: 'تقرير التحصيل وسندات القبض اليومية',
          titleEn: 'Daily Collection & Receipt Ledger',
          headers: ['تاريخ السداد', 'رقم السند', 'رقم الطالب', 'اسم الطالب', 'الفاتورة', 'طريقة الدفع', 'المرجع', 'المبلغ', 'المستلم'],
          rows,
          summary: {
            'عدد السندات': payments.length,
            'إجمالي المقبوضات': toMajorUnits(totalCollected).toFixed(2),
          },
        };
      }

      // 5. Payment Method Report
      case 'payment_method': {
        const grouped: Record<string, { count: number; totalMinor: number }> = {};
        payments.forEach((p) => {
          if (!grouped[p.method]) grouped[p.method] = { count: 0, totalMinor: 0 };
          grouped[p.method].count += 1;
          grouped[p.method].totalMinor = addMinor(grouped[p.method].totalMinor, p.amountMinor);
        });
        const rows = Object.entries(grouped).map(([method, data]) => [
          method,
          data.count,
          toMajorUnits(data.totalMinor).toFixed(2),
        ]);
        return {
          titleAr: 'تقرير المدفوعات حسب وسيلة السداد',
          titleEn: 'Collections by Payment Method Report',
          headers: ['وسيلة السداد', 'عدد العمليات', 'إجمالي المبلغ المحصل'],
          rows,
        };
      }

      // 6. Overdue Fees Report
      case 'overdue_fees': {
        const overdue = invoices.filter(
          (i) => i.status !== 'PAID' && i.status !== 'VOID' && i.dueDate < todayStr && i.balanceDueMinor > 0
        );
        const rows = overdue.map((i) => [
          i.invoiceNumber,
          i.studentNumber,
          i.studentNameAr,
          i.classNameAr || '-',
          i.dueDate,
          toMajorUnits(i.balanceDueMinor).toFixed(2),
          'متأخرة عن موعد الاستحقاق',
        ]);
        const totalOverdue = addMinor(...overdue.map((i) => i.balanceDueMinor));
        return {
          titleAr: 'تقرير المستحقات والمتأخرات المتجاوزة للموعد',
          titleEn: 'Aging & Overdue Receivables Report',
          headers: ['رقم الفاتورة', 'رقم الطالب', 'اسم الطالب', 'الفصل', 'تاريخ الاستحقاق', 'المبلغ المتأخر', 'الحالة'],
          rows,
          summary: {
            'عدد الفواتير المتأخرة': overdue.length,
            'إجمالي مبالغ المتأخرات': toMajorUnits(totalOverdue).toFixed(2),
          },
        };
      }

      // 7. Discounts Report
      case 'discounts': {
        const rows: (string | number)[][] = [];
        let totalDisc = 0;
        invoices.forEach((inv) => {
          inv.discounts.forEach((d) => {
            totalDisc = addMinor(totalDisc, d.calculatedAmountMinor);
            rows.push([
              inv.invoiceNumber,
              inv.studentNumber,
              inv.studentNameAr,
              d.type === 'PERCENTAGE' ? `${d.value}%` : 'مبلغ ثابت',
              toMajorUnits(d.calculatedAmountMinor).toFixed(2),
              d.reason,
              d.createdAt.split('T')[0],
            ]);
          });
        });
        return {
          titleAr: 'تقرير الخصومات والتخفيضات المالية الممنوحة',
          titleEn: 'Discounts & Deductions Report',
          headers: ['رقم الفاتورة', 'رقم الطالب', 'اسم الطالب', 'نوع الخصم', 'قيمة الخصم', 'السبب والمبرر', 'التاريخ'],
          rows,
          summary: {
            'عدد الخصومات الممنوحة': rows.length,
            'إجمالي مبالغ الخصومات': toMajorUnits(totalDisc).toFixed(2),
          },
        };
      }

      // 8. Scholarships Report
      case 'scholarships': {
        const rows: (string | number)[][] = [];
        let totalSchol = 0;
        invoices.forEach((inv) => {
          inv.scholarships.forEach((s) => {
            totalSchol = addMinor(totalSchol, s.calculatedAmountMinor);
            rows.push([
              inv.invoiceNumber,
              inv.studentNumber,
              inv.studentNameAr,
              s.type === 'PERCENTAGE' ? `${s.value}%` : 'مبلغ ثابت',
              toMajorUnits(s.calculatedAmountMinor).toFixed(2),
              s.reason,
              s.createdAt.split('T')[0],
            ]);
          });
        });
        return {
          titleAr: 'تقرير المنح الدراسية والإعفاءات المعتمدة',
          titleEn: 'Scholarships & Waivers Report',
          headers: ['رقم الفاتورة', 'رقم الطالب', 'اسم الطالب', 'نوع المنحة', 'قيمة المنحة', 'مبرر المنحة', 'التاريخ'],
          rows,
          summary: {
            'عدد المنح المعتمدة': rows.length,
            'إجمالي مبالغ المنح': toMajorUnits(totalSchol).toFixed(2),
          },
        };
      }

      // 9. Refunds Report
      case 'refunds': {
        const rows = refunds.map((r) => [
          r.refundNumber,
          r.refundDate,
          r.receiptNumber,
          r.studentNumber,
          r.studentNameAr,
          toMajorUnits(r.amountMinor).toFixed(2),
          r.reason,
          r.method,
          r.approvedByName || '-',
        ]);
        const totalRefunded = addMinor(...refunds.map((r) => r.amountMinor));
        return {
          titleAr: 'تقرير سندات الصرف والاسترداد المالي',
          titleEn: 'Tuition Refunds & Disbursements Report',
          headers: ['رقم سند الصرف', 'التاريخ', 'سند القبض الأصلي', 'رقم الطالب', 'اسم الطالب', 'مبلغ الاسترداد', 'السبب', 'الوسيلة', 'المعتمد'],
          rows,
          summary: {
            'عدد سندات الصرف': refunds.length,
            'إجمالي المبالغ المستردة': toMajorUnits(totalRefunded).toFixed(2),
          },
        };
      }

      // 10. Invoice Register
      case 'invoice_register':
      default: {
        const rows = invoices.map((i) => [
          i.invoiceNumber,
          i.issueDate,
          i.dueDate,
          i.studentNumber,
          i.studentNameAr,
          toMajorUnits(i.subtotalMinor).toFixed(2),
          toMajorUnits(i.discountTotalMinor + i.scholarshipTotalMinor).toFixed(2),
          toMajorUnits(i.netTotalMinor).toFixed(2),
          toMajorUnits(i.paidTotalMinor).toFixed(2),
          toMajorUnits(i.balanceDueMinor).toFixed(2),
          i.status,
        ]);
        const totalNet = addMinor(...invoices.filter((i) => i.status !== 'VOID').map((i) => i.netTotalMinor));
        const totalPaid = addMinor(...invoices.filter((i) => i.status !== 'VOID').map((i) => i.paidTotalMinor));
        const totalBalance = addMinor(...invoices.filter((i) => i.status !== 'VOID').map((i) => i.balanceDueMinor));
        return {
          titleAr: 'سجل الفواتير والمطالبات العام (Invoice Register)',
          titleEn: 'Comprehensive Invoicing Register',
          headers: ['رقم الفاتورة', 'تاريخ الإصدار', 'الاستحقاق', 'رقم الطالب', 'اسم الطالب', 'الإجمالي', 'الخصومات والمنح', 'الصافي', 'المسدد', 'المتبقي', 'الحالة'],
          rows,
          summary: {
            'إجمالي الفواتير': invoices.length,
            'صافي المطالبات': toMajorUnits(totalNet).toFixed(2),
            'إجمالي المحصل': toMajorUnits(totalPaid).toFixed(2),
            'الرصيد المتبقي': toMajorUnits(totalBalance).toFixed(2),
          },
        };
      }
    }
  }

  // =========================================================================
  // 9. CSV Export with UTF-8 BOM
  // =========================================================================

  public exportReportToCSV(
    actingUser: SafeUser,
    reportKey: any,
    params: { branchId: string; academicYearId?: string; startDate?: string; endDate?: string }
  ): string {
    this.checkPermission(actingUser, 'finance.export');
    this.checkBranchAccess(actingUser, params.branchId);

    const report = this.generateReport(actingUser, reportKey, params);
    const bom = '\uFEFF';

    const escapeField = (val: any) => {
      let str = String(val ?? '').replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str}"`;
    };

    const lines: string[] = [];
    lines.push(escapeField(report.titleAr));
    lines.push(report.headers.map(escapeField).join(','));

    report.rows.forEach((row) => {
      lines.push(row.map(escapeField).join(','));
    });

    if (report.summary) {
      lines.push('');
      lines.push(escapeField('--- ملخص التقرير ---'));
      Object.entries(report.summary).forEach(([key, val]) => {
        lines.push(`${escapeField(key)},${escapeField(val)}`);
      });
    }

    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'FINANCIAL_REPORT_EXPORTED',
      targetType: 'FINANCE',
      branchContext: params.branchId,
      result: 'SUCCESS',
      details: `تم تصدير تقرير (${report.titleAr}) إلى ملف CSV`,
    });

    return bom + lines.join('\n');
  }
}

export const financeStorage = FinanceStorageService.getInstance();
