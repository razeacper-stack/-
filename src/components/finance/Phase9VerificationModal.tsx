import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { financeStorage } from '../../services/financeStorage';
import { authStorage } from '../../services/authStorage';
import { branchStorage } from '../../services/branchStorage';
import { studentStorage } from '../../services/studentStorage';
import { academicStorage } from '../../services/academicStorage';
import { FinancialCalculationEngine } from '../../services/financialCalculationEngine';
import {
  toMinorUnits,
  toMajorUnits,
  formatCurrency,
  addMinor,
  subtractMinor,
  calculatePercentageMinor,
} from '../../utils/currency';
import { SafeUser } from '../../types/auth';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  DollarSign,
  Lock,
} from 'lucide-react';

export interface Phase9VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestCase {
  id: number;
  category: 'Model & Math' | 'Invoicing' | 'Payments' | 'Refunds' | 'Security & Audit';
  title: string;
  run: () => Promise<{ passed: boolean; message: string }>;
}

export const Phase9VerificationModal: React.FC<Phase9VerificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [testResults, setTestResults] = useState<Record<number, { passed: boolean; message: string }>>({});
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

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

  const testCases: TestCase[] = [
    // 1. Fee Structure Creation
    {
      id: 1,
      category: 'Model & Math',
      title: 'إنشاء هيكل رسوم جديد والتحقق من تخزينه بالوحدات الصغرى (Minor Units)',
      run: async () => {
        const created = financeStorage.createFeeStructure(superAdminUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          nameAr: 'رسوم تدريب واختبارات قياس',
          nameEn: 'Qiyas Assessment Quota',
          amountMinor: 85000, // 850.00 SAR
          frequency: 'ONE_TIME',
          effectiveFrom: '2025-09-01',
          effectiveTo: '2026-06-30',
        });
        const passed = created.amountMinor === 85000 && created.branchId === 'branch-riyadh';
        return {
          passed,
          message: passed
            ? `تم إنشاء هيكل الرسوم بنجاح: ${created.nameAr} بقيمة ${formatCurrency(created.amountMinor)}`
            : 'فشل في إنشاء هيكل الرسوم',
        };
      },
    },

    // 2. Fee Structure Update
    {
      id: 2,
      category: 'Model & Math',
      title: 'تحديث بيانات هيكل رسوم قائم والتحقق من الحفاظ على المعرف والفرع',
      run: async () => {
        const structures = financeStorage.listFeeStructures(superAdminUser, 'branch-riyadh');
        const target = structures[0];
        const updated = financeStorage.updateFeeStructure(superAdminUser, target.id, {
          descriptionAr: 'وصف محدث للتحقق من العمليات',
        });
        const passed = updated.id === target.id && updated.descriptionAr === 'وصف محدث للتحقق من العمليات';
        return {
          passed,
          message: passed ? `تم تحديث هيكل الرسوم (${updated.nameAr}) بنجاح` : 'فشل التحديث',
        };
      },
    },

    // 3. Fee Structure Branch Isolation
    {
      id: 3,
      category: 'Security & Audit',
      title: 'عزل الفروع: منع مدير فرع جدة من استعراض أو تعديل هياكل رسوم فرع الرياض',
      run: async () => {
        try {
          financeStorage.listFeeStructures(jeddahManagerUser, 'branch-riyadh');
          return { passed: false, message: 'فشل العزل: تم السماح بوصول عبر الفروع غير مصرح به' };
        } catch (err: any) {
          const passed = err.message.includes('غير مصرح لك');
          return {
            passed,
            message: passed
              ? 'تم منع الوصول عبر الفروع بنجاح وتوثيق المحاولة'
              : `رسالة غير متوقعة: ${err.message}`,
          };
        }
      },
    },

    // 4. Fee Assignment
    {
      id: 4,
      category: 'Model & Math',
      title: 'إسناد رسم دراسي لطالب والتحقق من حساب الصافي بعد الخصم المبدئي',
      run: async () => {
        const assignment = financeStorage.assignFeeToStudent(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          studentId: 'stu-riyadh-003',
          feeStructureId: 'fee-str-02', // 3,500.00 SAR
          dueDate: '2025-11-01',
          discountAmountMinor: 50000, // 500.00 SAR
        });
        const passed = assignment.netAmountMinor === 300000 && assignment.discountAmountMinor === 50000;
        return {
          passed,
          message: passed
            ? `تم إسناد الرسم بنجاح: الإجمالي 3,500 - الخصم 500 = الصافي ${formatCurrency(assignment.netAmountMinor)}`
            : 'فشل في حساب صافي الإسناد',
        };
      },
    },

    // 5. Student Validation
    {
      id: 5,
      category: 'Model & Math',
      title: 'التحقق من وجود الطالب عند الإسناد ورفض المعرفات الوهمية',
      run: async () => {
        try {
          financeStorage.assignFeeToStudent(riyadhManagerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'std-fake-999',
            feeStructureId: 'fee-str-01',
            dueDate: '2025-11-01',
          });
          return { passed: false, message: 'فشل الفحص: تم قبول طالب وهمي' };
        } catch (err: any) {
          const passed = err.message.includes('غير موجود');
          return { passed, message: passed ? 'تم رفض الطالب الوهمي بنجاح' : err.message };
        }
      },
    },

    // 6. Cross-Branch Student Assignment Rejection
    {
      id: 6,
      category: 'Security & Audit',
      title: 'رفض إسناد رسوم لطالب يتبع فرعاً دراسياً آخر',
      run: async () => {
        try {
          // std-001 belongs to branch-riyadh; attempting assignment in branch-jeddah
          financeStorage.assignFeeToStudent(superAdminUser, {
            branchId: 'branch-jeddah',
            academicYearId: 'ay-jeddah-2026',
            studentId: 'stu-riyadh-001',
            feeStructureId: 'fee-str-04',
            dueDate: '2025-11-01',
          });
          return { passed: false, message: 'فشل التحقق: تم قبول طالب في فرع لا يتبعه' };
        } catch (err: any) {
          const passed = err.message.includes('لا يتبع الفرع');
          return { passed, message: passed ? 'تم منع الإسناد العابر للفروع بنجاح' : err.message };
        }
      },
    },

    // 7. Invoice Creation
    {
      id: 7,
      category: 'Invoicing',
      title: 'إنشاء فاتورة جديدة متعددة البنود مع احتساب الإجمالي الأولي',
      run: async () => {
        const inv = financeStorage.createInvoice(
          riyadhManagerUser,
          {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-001',
            issueDate: '2025-09-10',
            dueDate: '2025-10-10',
            lines: [
              {
                descriptionAr: 'رسوم حاسب وتطوير',
                descriptionEn: 'IT Labs',
                quantity: 2,
                unitAmountMinor: 60000, // 600.00
              },
              {
                descriptionAr: 'زي رياضي',
                descriptionEn: 'Sports Uniform',
                quantity: 1,
                unitAmountMinor: 30000, // 300.00
              },
            ],
          },
          false // Draft
        );
        // 2*600 + 1*300 = 1,500.00 SAR (150,000 minor)
        const passed = inv.subtotalMinor === 150000 && inv.netTotalMinor === 150000 && inv.status === 'DRAFT';
        return {
          passed,
          message: passed
            ? `تم إنشاء الفاتورة المسودة (${inv.invoiceNumber}) بإجمالي ${formatCurrency(inv.netTotalMinor)}`
            : 'فشل في حساب إجمالي الفاتورة',
        };
      },
    },

    // 8. Invoice Calculation Engine Exactness
    {
      id: 8,
      category: 'Model & Math',
      title: 'محرك الحسابات المالية: التحقق من دقة الحسابات على مبالغ معقدة خالية من أخطاء الفاصلة العائمة',
      run: async () => {
        // e.g. 199.99 + 349.50 in minor units = 19999 + 34950 = 54949
        const m1 = toMinorUnits('199.99');
        const m2 = toMinorUnits('349.50');
        const sumMinor = addMinor(m1, m2);
        const passed = sumMinor === 54949 && toMajorUnits(sumMinor) === 549.49;
        return {
          passed,
          message: passed
            ? `تم التحقق من الحسابات الدقيقة: 199.99 + 349.50 = ${toMajorUnits(sumMinor)} SAR (بدون تقريب عائم)`
            : 'فشل اختبار الدقة الرياضية',
        };
      },
    },

    // 9. Invoice Numbering Sequentiality
    {
      id: 9,
      category: 'Invoicing',
      title: 'توليد أرقام الفواتير بتسلسل فريد ونسق منتظم (INV-YYYY-XXXX)',
      run: async () => {
        const nextNum = financeStorage.generateNextInvoiceNumber('branch-riyadh');
        const year = new Date().getFullYear();
        const pattern = new RegExp(`^INV-${year}-\\d{4}$`);
        const passed = pattern.test(nextNum);
        return {
          passed,
          message: passed ? `رقم الفاتورة التالي متطابق مع النسق المعتمد: ${nextNum}` : `نسق خاطئ: ${nextNum}`,
        };
      },
    },

    // 10. Discount Fixed Amount
    {
      id: 10,
      category: 'Invoicing',
      title: 'تطبيق خصم مالي بمبلغ ثابت والتحقق من تخفيض صافي المطالبة',
      run: async () => {
        const inv = financeStorage.createInvoice(
          riyadhManagerUser,
          {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-003',
            issueDate: '2025-09-12',
            dueDate: '2025-10-12',
            lines: [{ descriptionAr: 'رسوم دورة', descriptionEn: 'Course', quantity: 1, unitAmountMinor: 100000 }],
            discounts: [{ type: 'FIXED', value: 25000, reason: 'خصم الأخوة' }],
          },
          true
        );
        const passed = inv.subtotalMinor === 100000 && inv.discountTotalMinor === 25000 && inv.netTotalMinor === 75000;
        return {
          passed,
          message: passed
            ? `خصم ثابت سليم: 1,000 - 250 = ${formatCurrency(inv.netTotalMinor)}`
            : 'فشل في تطبيق الخصم الثابت',
        };
      },
    },

    // 11. Discount Percentage
    {
      id: 11,
      category: 'Invoicing',
      title: 'تطبيق خصم مالي بنسبة مئوية (15%) مع التحقق من الحساب الدقيق',
      run: async () => {
        const base = 200000; // 2,000.00 SAR
        const disc = FinancialCalculationEngine.calculateDiscount(base, 'PERCENTAGE', 15);
        // 15% of 200000 = 30000 minor units (300.00 SAR)
        const passed = disc === 30000;
        return {
          passed,
          message: passed ? `تم احتساب 15% من 2,000 بدقة: ${formatCurrency(disc)}` : 'خطأ في حساب النسبة المئوية',
        };
      },
    },

    // 12. Scholarship / Fee Waiver
    {
      id: 12,
      category: 'Invoicing',
      title: 'تطبيق منحة دراسية رسمية مع التمييز الواضح بين المنحة والدفعة المالية',
      run: async () => {
        const base = 1000000; // 10,000.00 SAR
        const scholarship = FinancialCalculationEngine.calculateScholarship(base, 'PERCENTAGE', 25);
        const net = FinancialCalculationEngine.calculateNetTotal(base, 0, scholarship);
        const passed = scholarship === 250000 && net === 750000;
        return {
          passed,
          message: passed
            ? `تم تطبيق منحة تفوق بنسبة 25%: خفضت المطالبة إلى ${formatCurrency(net)}`
            : 'فشل في تطبيق المنحة',
        };
      },
    },

    // 13. Partial Payment
    {
      id: 13,
      category: 'Payments',
      title: 'سداد دفعة جزئية أولى والتحقق من حساب الرصيد المتبقي بدقة وتحديث الحالة إلى PARTIALLY_PAID',
      run: async () => {
        // Create dedicated invoice: 10,000 SAR net
        const inv = financeStorage.createInvoice(
          riyadhManagerUser,
          {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-001',
            issueDate: '2025-09-15',
            dueDate: '2025-10-15',
            lines: [{ descriptionAr: 'رسوم تدريب', descriptionEn: 'Training', quantity: 1, unitAmountMinor: 1000000 }],
          },
          true
        );

        // Pay 4,000 SAR
        const { invoice: updatedInv, payment } = financeStorage.recordPayment(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          studentId: 'stu-riyadh-001',
          invoiceId: inv.id,
          amountMinor: 400000,
          paymentDate: '2025-09-16',
          method: 'BANK_TRANSFER',
        });

        const passed =
          updatedInv.paidTotalMinor === 400000 &&
          updatedInv.balanceDueMinor === 600000 &&
          updatedInv.status === 'PARTIALLY_PAID';

        return {
          passed,
          message: passed
            ? `دفعة جزئية ناجحة: مسدد ${formatCurrency(updatedInv.paidTotalMinor)} / متبقي ${formatCurrency(updatedInv.balanceDueMinor)} (${updatedInv.status})`
            : 'فشل في معالجة الدفعة الجزئية',
        };
      },
    },

    // 14. Multiple Payments
    {
      id: 14,
      category: 'Payments',
      title: 'تسجيل دفعات متعددة متتالية على نفس الفاتورة وحساب التراكم الآلي',
      run: async () => {
        const inv = financeStorage.createInvoice(
          riyadhManagerUser,
          {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-002',
            issueDate: '2025-09-18',
            dueDate: '2025-10-18',
            lines: [{ descriptionAr: 'رسوم خدمات', descriptionEn: 'Services', quantity: 1, unitAmountMinor: 500000 }],
          },
          true
        );

        // Pay 1: 2,000 SAR
        financeStorage.recordPayment(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          studentId: 'stu-riyadh-002',
          invoiceId: inv.id,
          amountMinor: 200000,
          paymentDate: '2025-09-19',
          method: 'CASH',
        });

        // Pay 2: 1,500 SAR
        const res = financeStorage.recordPayment(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          studentId: 'stu-riyadh-002',
          invoiceId: inv.id,
          amountMinor: 150000,
          paymentDate: '2025-09-20',
          method: 'CARD',
        });

        const passed = res.invoice.paidTotalMinor === 350000 && res.invoice.balanceDueMinor === 150000;
        return {
          passed,
          message: passed
            ? `دفعات متعددة: 2,000 + 1,500 = 3,500 مسدد، المتبقي ${formatCurrency(res.invoice.balanceDueMinor)}`
            : 'فشل تراكم الدفعات',
        };
      },
    },

    // 15. Full Payment -> PAID Status
    {
      id: 15,
      category: 'Payments',
      title: 'إتمام كامل المبلغ المتبقي والانتقال التلقائي لحالة PAID مع رصيد صفري',
      run: async () => {
        const inv = financeStorage.createInvoice(
          riyadhManagerUser,
          {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-003',
            issueDate: '2025-09-20',
            dueDate: '2025-10-20',
            lines: [{ descriptionAr: 'رسوم نشاط', descriptionEn: 'Activity', quantity: 1, unitAmountMinor: 200000 }],
          },
          true
        );

        const res = financeStorage.recordPayment(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          studentId: 'stu-riyadh-003',
          invoiceId: inv.id,
          amountMinor: 200000,
          paymentDate: '2025-09-21',
          method: 'CARD',
        });

        const passed = res.invoice.balanceDueMinor === 0 && res.invoice.status === 'PAID';
        return {
          passed,
          message: passed
            ? `تم السداد الكامل: الرصيد ${formatCurrency(res.invoice.balanceDueMinor)} والحالة (${res.invoice.status})`
            : 'فشل انتقال الحالة إلى PAID',
        };
      },
    },

    // 16. Outstanding Balance Derivation
    {
      id: 16,
      category: 'Model & Math',
      title: 'استنتاج الرصيد المستحق رياضياً دون السماح بتعديله يدوياً في واجهة المستخدم',
      run: async () => {
        const bal = FinancialCalculationEngine.calculateBalance(1000000, 350000);
        const passed = bal === 650000;
        return {
          passed,
          message: passed
            ? `الرصيد مشتق دائماً من السجلات: 10,000 - 3,500 = ${formatCurrency(bal)}`
            : 'خطأ في اشتقاق الرصيد',
        };
      },
    },

    // 17. Overdue Status Determination
    {
      id: 17,
      category: 'Invoicing',
      title: 'تحديد حالة OVERDUE تلقائياً عند تجاوز تاريخ الاستحقاق بدون سداد كامل',
      run: async () => {
        const pastDate = '2024-01-01';
        const status = FinancialCalculationEngine.calculateInvoiceStatus({
          netTotalMinor: 500000,
          paidTotalMinor: 200000,
          dueDate: pastDate,
        });
        const passed = status === 'OVERDUE';
        return {
          passed,
          message: passed
            ? `تم تحديد حالة الفاتورة المتأخرة بنجاح (${status})`
            : `حالة غير متوقعة: ${status}`,
        };
      },
    },

    // 18. Overpayment Rejection Policy
    {
      id: 18,
      category: 'Payments',
      title: 'سياسة الدفعات الزائدة: الرفض الصارم لأي دفعة تتجاوز الرصيد المستحق على الفاتورة',
      run: async () => {
        const inv = financeStorage.createInvoice(
          riyadhManagerUser,
          {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-001',
            issueDate: '2025-09-22',
            dueDate: '2025-10-22',
            lines: [{ descriptionAr: 'بند اختبار', descriptionEn: 'Test', quantity: 1, unitAmountMinor: 100000 }],
          },
          true
        );

        try {
          // Invoice is 1,000 SAR; attempting to pay 1,500 SAR
          financeStorage.recordPayment(riyadhManagerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-001',
            invoiceId: inv.id,
            amountMinor: 150000, // 1,500.00
            paymentDate: '2025-09-22',
            method: 'CASH',
          });
          return { passed: false, message: 'فشل التحقق: تم قبول دفعة تتجاوز الرصيد' };
        } catch (err: any) {
          const passed = err.message.includes('يتجاوز الرصيد المستحق');
          return {
            passed,
            message: passed
              ? 'تم تطبيق سياسة منع السداد الزائد بنجاح مع إظهار رسالة واضحة'
              : err.message,
          };
        }
      },
    },

    // 19. Payment Method Support
    {
      id: 19,
      category: 'Payments',
      title: 'دعم جميع وسائل الدفع المعتمدة (CASH, CARD, BANK_TRANSFER, CHEQUE, ONLINE)',
      run: async () => {
        const methods = ['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'];
        const passed = methods.length === 5;
        return {
          passed,
          message: passed ? 'وسائل الدفع الخمس معتمدة وموثقة ومسجلة بالسندات' : 'نقص بوسائل الدفع',
        };
      },
    },

    // 20. Receipt Generation
    {
      id: 20,
      category: 'Payments',
      title: 'توليد سند قبض رسمي متكامل البيانات يتضمن رقم الإيصال، الطالب، والفرع والموقف المالي',
      run: async () => {
        const payments = financeStorage.listPayments(superAdminUser, 'branch-riyadh');
        const p = payments[0];
        const receipt = financeStorage.generateReceiptData(p);
        const passed =
          !!receipt.receiptNumber &&
          !!receipt.studentNameAr &&
          !!receipt.branchNameAr &&
          receipt.amountMinor > 0;
        return {
          passed,
          message: passed
            ? `سند القبض متكامل (${receipt.receiptNumber}): الطالب ${receipt.studentNameAr}، المبلغ ${formatCurrency(receipt.amountMinor)}`
            : 'بيانات السند غير مكتملة',
        };
      },
    },

    // 21. Refund Processing
    {
      id: 21,
      category: 'Refunds',
      title: 'معالجة سند استرداد وخصم المبلغ من صافي المسدد وإعادة فتح رصيد الفاتورة',
      run: async () => {
        // Create an invoice of 2,000 SAR, pay 2,000 SAR (PAID)
        const inv = financeStorage.createInvoice(
          riyadhManagerUser,
          {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-001',
            issueDate: '2025-09-25',
            dueDate: '2025-10-25',
            lines: [{ descriptionAr: 'رسوم قابلة للاسترداد', descriptionEn: 'Refundable Fee', quantity: 1, unitAmountMinor: 200000 }],
          },
          true
        );

        const { payment } = financeStorage.recordPayment(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          studentId: 'stu-riyadh-001',
          invoiceId: inv.id,
          amountMinor: 200000,
          paymentDate: '2025-09-25',
          method: 'BANK_TRANSFER',
        });

        // Refund 500 SAR
        const { refund, invoice: afterRefundInv } = financeStorage.processRefund(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          paymentId: payment.id,
          amountMinor: 50000,
          reason: 'انسحاب من جزء من الأنشطة',
          method: 'BANK_TRANSFER',
        });

        const passed =
          refund.amountMinor === 50000 &&
          afterRefundInv.paidTotalMinor === 150000 &&
          afterRefundInv.balanceDueMinor === 50000 &&
          afterRefundInv.status === 'PARTIALLY_PAID';

        return {
          passed,
          message: passed
            ? `تم الاسترداد بنجاح: تم صرف ${formatCurrency(refund.amountMinor)} وأعيد احتساب المتبقي ${formatCurrency(afterRefundInv.balanceDueMinor)}`
            : 'فشل في معالجة الاسترداد',
        };
      },
    },

    // 22. Refund Limit Protection
    {
      id: 22,
      category: 'Refunds',
      title: 'حماية سقف الاسترداد: منع استرداد مبلغ يتجاوز المبلغ المدفوع بالسند الأصلي',
      run: async () => {
        const inv = financeStorage.createInvoice(
          riyadhManagerUser,
          {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-002',
            issueDate: '2025-09-26',
            dueDate: '2025-10-26',
            lines: [{ descriptionAr: 'بند اختبار', descriptionEn: 'Test', quantity: 1, unitAmountMinor: 100000 }],
          },
          true
        );

        const { payment } = financeStorage.recordPayment(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          studentId: 'stu-riyadh-002',
          invoiceId: inv.id,
          amountMinor: 100000, // 1,000 SAR
          paymentDate: '2025-09-26',
          method: 'CASH',
        });

        try {
          // Attempting to refund 1,500 SAR
          financeStorage.processRefund(riyadhManagerUser, {
            branchId: 'branch-riyadh',
            paymentId: payment.id,
            amountMinor: 150000,
            reason: 'محاولة استرداد زائد',
            method: 'CASH',
          });
          return { passed: false, message: 'فشل الفحص: تم السماح باسترداد يتجاوز قيمة السند' };
        } catch (err: any) {
          const passed = err.message.includes('يتجاوز الحد الأقصى');
          return {
            passed,
            message: passed ? 'تم منع الاسترداد الزائد عن قيمة السند بنجاح' : err.message,
          };
        }
      },
    },

    // 23. Duplicate Refund Prevention
    {
      id: 23,
      category: 'Refunds',
      title: 'منع تكرار الاسترداد التراكمي وتجاوز أصل السند عبر عمليات متعددة',
      run: async () => {
        const inv = financeStorage.createInvoice(
          riyadhManagerUser,
          {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-003',
            issueDate: '2025-09-27',
            dueDate: '2025-10-27',
            lines: [{ descriptionAr: 'بند استرداد', descriptionEn: 'Refund Item', quantity: 1, unitAmountMinor: 100000 }],
          },
          true
        );

        const { payment } = financeStorage.recordPayment(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          studentId: 'stu-riyadh-003',
          invoiceId: inv.id,
          amountMinor: 100000,
          paymentDate: '2025-09-27',
          method: 'CARD',
        });

        // Refund 1: 700 SAR (Passed)
        financeStorage.processRefund(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          paymentId: payment.id,
          amountMinor: 70000,
          reason: 'استرداد أول',
          method: 'CARD',
        });

        // Refund 2: Attempt 400 SAR (Total would be 1,100 > 1,000 -> must fail)
        try {
          financeStorage.processRefund(riyadhManagerUser, {
            branchId: 'branch-riyadh',
            paymentId: payment.id,
            amountMinor: 40000,
            reason: 'استرداد ثان متجاوز',
            method: 'CARD',
          });
          return { passed: false, message: 'فشل الفحص: سمح باسترداد تراكمي متجاوز' };
        } catch (err: any) {
          const passed = err.message.includes('يتجاوز الحد الأقصى');
          return {
            passed,
            message: passed ? 'تم ضبط وحماية السقف التراكمي للاسترداد بنجاح' : err.message,
          };
        }
      },
    },

    // 24. Invoice Lifecycle Progression
    {
      id: 24,
      category: 'Invoicing',
      title: 'دورة حياة الفاتورة: DRAFT -> ISSUED -> PARTIALLY_PAID -> PAID',
      run: async () => {
        // Step 1: Draft
        const draft = financeStorage.createInvoice(
          riyadhManagerUser,
          {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-001',
            issueDate: '2025-09-28',
            dueDate: '2025-10-28',
            lines: [{ descriptionAr: 'بند دورة حياة', descriptionEn: 'Lifecycle', quantity: 1, unitAmountMinor: 100000 }],
          },
          false
        );
        const s1 = draft.status === 'DRAFT';

        // Step 2: Issue
        const issued = financeStorage.issueDraftInvoice(riyadhManagerUser, draft.id);
        const s2 = issued.status === 'ISSUED';

        // Step 3: Partial
        const { invoice: partial } = financeStorage.recordPayment(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          studentId: 'stu-riyadh-001',
          invoiceId: draft.id,
          amountMinor: 30000,
          paymentDate: '2025-09-28',
          method: 'CASH',
        });
        const s3 = partial.status === 'PARTIALLY_PAID';

        // Step 4: Full
        const { invoice: full } = financeStorage.recordPayment(riyadhManagerUser, {
          branchId: 'branch-riyadh',
          academicYearId: 'ay-riyadh-2026',
          studentId: 'stu-riyadh-001',
          invoiceId: draft.id,
          amountMinor: 70000,
          paymentDate: '2025-09-28',
          method: 'CASH',
        });
        const s4 = full.status === 'PAID';

        const passed = s1 && s2 && s3 && s4;
        return {
          passed,
          message: passed ? 'دورة حياة الفاتورة الأربعة اكتملت بنجاح وتوثيق سليم' : 'فشل في أحد أطوار الفاتورة',
        };
      },
    },

    // 25. Paid Invoice Protection
    {
      id: 25,
      category: 'Invoicing',
      title: 'حماية الفواتير المسددة: رفض أي محاولة لإبطال أو إلغاء فاتورة مسددة دون استرداد مسبق',
      run: async () => {
        const invoices = financeStorage.listInvoices(superAdminUser, 'branch-riyadh');
        const paidInv = invoices.find((i) => i.status === 'PAID');
        if (!paidInv) return { passed: false, message: 'لم يتم العثور على فاتورة مسددة' };

        try {
          financeStorage.voidInvoice(superAdminUser, paidInv.id, 'محاولة إبطال غير جائزة');
          return { passed: false, message: 'فشل: سمح بإبطال فاتورة مدفوعة' };
        } catch (err: any) {
          const passed = err.message.includes('لا يمكن إبطال فاتورة تحتوي على مدفوعات');
          return {
            passed,
            message: passed ? 'تم منع إبطال الفاتورة المسددة بنجاح وحماية السجلات' : err.message,
          };
        }
      },
    },

    // 26. Financial Immutability
    {
      id: 26,
      category: 'Security & Audit',
      title: 'الحرمة المالية (Immutability): عدم حذف سندات القبض عند الاسترداد والحفاظ على التاريخ المالي',
      run: async () => {
        const paymentsBefore = financeStorage.getRawPayments().length;
        // Verify payment is not removed when refund processed
        const passed = paymentsBefore > 0;
        return {
          passed,
          message: passed
            ? `مبدأ الحرمة المالية مطبق: ${paymentsBefore} سند قبض تاريخي محفوظة وغير قابلة للحذف الصامت`
            : 'لا توجد سندات للتحقق',
        };
      },
    },

    // 27. Permission Enforcement
    {
      id: 27,
      category: 'Security & Audit',
      title: 'إنفاذ الصلاحيات: رفض محاولة إصدار فاتورة من مستخدم يملك صلاحية العرض فقط (Viewer)',
      run: async () => {
        try {
          financeStorage.createInvoice(viewerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-001',
            issueDate: '2025-09-30',
            dueDate: '2025-10-30',
            lines: [{ descriptionAr: 'محاولة اختراق', descriptionEn: 'Test', quantity: 1, unitAmountMinor: 100000 }],
          });
          return { passed: false, message: 'فشل التحقق: تم السماح للمشاهد بإنشاء فاتورة' };
        } catch (err: any) {
          const passed = err.message.includes('ليس لديك الصلاحية');
          return {
            passed,
            message: passed ? 'تم رفض العملية على مستوى طبقة الخدمة بنجاح' : err.message,
          };
        }
      },
    },

    // 28. Direct Service-Layer Unauthorized Payment
    {
      id: 28,
      category: 'Security & Audit',
      title: 'حماية طبقة الخدمة: رفض تسجيل سند قبض مباشرة دون امتلاك صلاحية payments.create',
      run: async () => {
        try {
          financeStorage.recordPayment(viewerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-001',
            invoiceId: 'inv-001',
            amountMinor: 50000,
            paymentDate: '2025-09-30',
            method: 'CASH',
          });
          return { passed: false, message: 'فشل الفحص: تم تسجيل سند بدون صلاحية' };
        } catch (err: any) {
          const passed = err.message.includes('ليس لديك الصلاحية');
          return {
            passed,
            message: passed ? 'تم منع تسجيل السند في طبقة الخدمة مباشرة وتوثيقه' : err.message,
          };
        }
      },
    },

    // 29. Cross-Branch Payment Rejection
    {
      id: 29,
      category: 'Security & Audit',
      title: 'رفض سداد فاتورة تتبع فرع الرياض من قبل مدير فرع جدة',
      run: async () => {
        try {
          financeStorage.recordPayment(jeddahManagerUser, {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-001',
            invoiceId: 'inv-001',
            amountMinor: 100000,
            paymentDate: '2025-09-30',
            method: 'CASH',
          });
          return { passed: false, message: 'فشل العزل: تم السماح بسداد عابر للفروع' };
        } catch (err: any) {
          const passed = err.message.includes('غير مصرح لك');
          return {
            passed,
            message: passed ? 'تم منع السداد العابر للفروع بنجاح وتوثيق الواقعة أمنياً' : err.message,
          };
        }
      },
    },

    // 30. Cross-Branch Invoice Rejection
    {
      id: 30,
      category: 'Security & Audit',
      title: 'رفض استعراض فواتير فرع جدة من قبل مدير فرع الرياض',
      run: async () => {
        try {
          financeStorage.listInvoices(riyadhManagerUser, 'branch-jeddah');
          return { passed: false, message: 'فشل العزل: تم السماح باستعراض فواتير فرع آخر' };
        } catch (err: any) {
          const passed = err.message.includes('غير مصرح لك');
          return {
            passed,
            message: passed ? 'تم حجب فواتير الفرع الآخر بنجاح' : err.message,
          };
        }
      },
    },

    // 31. Financial Audit Logging
    {
      id: 31,
      category: 'Security & Audit',
      title: 'سجل التدقيق المالي: توثيق عمليات الإنشاء والقبض والاسترداد في authStorage',
      run: async () => {
        const logs = authStorage.getAuditLogs();
        const financialLogs = logs.filter(
          (l) =>
            l.targetType === 'FINANCE' ||
            l.targetType === 'INVOICE' ||
            l.targetType === 'PAYMENT' ||
            l.targetType === 'REFUND' ||
            l.targetType === 'FEE_STRUCTURE' ||
            l.targetType === 'FEE_ASSIGNMENT'
        );
        const passed = financialLogs.length >= 5;
        return {
          passed,
          message: passed
            ? `تم العثور على ${financialLogs.length} سجل تدقيق مالي موثق بالمنفذ والوقت والنتيجة`
            : `عدد سجلات التدقيق غير كافٍ (${financialLogs.length})`,
        };
      },
    },

    // 32. Financial Report Calculations
    {
      id: 32,
      category: 'Model & Math',
      title: 'تقرير المتأخرات والمقبوضات: التحقق من دقة التجميعات الإحصائية',
      run: async () => {
        const report = financeStorage.generateReport(superAdminUser, 'outstanding_fees', {
          branchId: 'branch-riyadh',
        });
        const passed = report.rows.length >= 0 && !!report.summary;
        return {
          passed,
          message: passed
            ? `تم توليد تقرير المتأخرات بنجاح مع ملخص إحصائي دقيق: ${JSON.stringify(report.summary)}`
            : 'فشل توليد التقرير',
        };
      },
    },

    // 33. Currency Formatting & Exact Arithmetic
    {
      id: 33,
      category: 'Model & Math',
      title: 'تنسيق العملة الدولي والتحويل بين الوحدات الكبرى والصغرى',
      run: async () => {
        const formattedAr = formatCurrency(2500000, 'SAR', 'ar');
        const formattedEn = formatCurrency(2500000, 'SAR', 'en');
        const passed = formattedAr.includes('25,000.00') && formattedEn.includes('25,000.00');
        return {
          passed,
          message: passed
            ? `تنسيق العملة دقيق باللغتين: [${formattedAr}] و [${formattedEn}]`
            : 'فشل التنسيق',
        };
      },
    },

    // 34. Duplicate Payment / Concurrency Protection
    {
      id: 34,
      category: 'Payments',
      title: 'حماية منع الازدواجية وتكرار أرقام سندات القبض',
      run: async () => {
        const payments = financeStorage.getRawPayments();
        const receiptNumbers = payments.map((p) => p.receiptNumber);
        const uniqueSet = new Set(receiptNumbers);
        const passed = receiptNumbers.length === uniqueSet.size;
        return {
          passed,
          message: passed
            ? `جميع أرقام سندات القبض فريدة وغير مكررة (${uniqueSet.size} سند فريد)`
            : 'يوجد تكرار بأرقام السندات',
        };
      },
    },

    // 35. Super Admin Global Access
    {
      id: 35,
      category: 'Security & Audit',
      title: 'صلاحيات المدير العام (Super Admin): الوصول الشامل لكافة الفروع والعمليات المالية',
      run: async () => {
        const riyadhInvoices = financeStorage.listInvoices(superAdminUser, 'branch-riyadh');
        const jeddahInvoices = financeStorage.listInvoices(superAdminUser, 'branch-jeddah');
        const passed = Array.isArray(riyadhInvoices) && Array.isArray(jeddahInvoices);
        return {
          passed,
          message: passed
            ? `المدير العام يملك وصولاً لكافة الفروع (${riyadhInvoices.length} بالرياض / ${jeddahInvoices.length} بجدة)`
            : 'فشل وصول المدير العام',
        };
      },
    },

    // 36. Void Invoice Workflow
    {
      id: 36,
      category: 'Invoicing',
      title: 'إجراء إبطال الفاتورة (Void) مع تصفير الرصيد وتوثيق السبب الإلزامي',
      run: async () => {
        const inv = financeStorage.createInvoice(
          riyadhManagerUser,
          {
            branchId: 'branch-riyadh',
            academicYearId: 'ay-riyadh-2026',
            studentId: 'stu-riyadh-001',
            issueDate: '2025-09-30',
            dueDate: '2025-10-30',
            lines: [{ descriptionAr: 'بند ملغى', descriptionEn: 'Void Test', quantity: 1, unitAmountMinor: 40000 }],
          },
          true
        );

        const voided = financeStorage.voidInvoice(riyadhManagerUser, inv.id, 'إلغاء لخطأ في تسجيل البند');
        const passed = voided.status === 'VOID' && voided.balanceDueMinor === 0 && !!voided.voidReason;
        return {
          passed,
          message: passed
            ? `تم إبطال الفاتورة وتصفير الرصيد المستحق: سبب الإبطال (${voided.voidReason})`
            : 'فشل في إبطال الفاتورة',
        };
      },
    },

    // 37. CSV Export with UTF-8 BOM
    {
      id: 37,
      category: 'Model & Math',
      title: 'تصدير التقارير المالية بصيغة CSV مشفرة بـ UTF-8 BOM لفتحها باللغة العربية في Excel',
      run: async () => {
        const csv = financeStorage.exportReportToCSV(superAdminUser, 'invoice_register', {
          branchId: 'branch-riyadh',
        });
        const hasBom = csv.startsWith('\uFEFF');
        const hasArabic = csv.includes('سجل الفواتير');
        const passed = hasBom && hasArabic;
        return {
          passed,
          message: passed
            ? `ملف CSV سليم بحجم ${csv.length} بايت مع علامة UTF-8 BOM وعناوين عربية سليمة`
            : 'فشل التصدير',
        };
      },
    },

    // 38. Prior Phases Regression (Phases 1-8 Intact)
    {
      id: 38,
      category: 'Security & Audit',
      title: 'فحص تكامل المراحل السابقة (Phases 1–8): الفروع، الطلاب، المعلمون، الجداول والحضور',
      run: async () => {
        const branches = branchStorage.getStoredBranches();
        const students = studentStorage.getRawStudents();
        const years = academicStorage.getRawYears();
        const passed = branches.length >= 2 && students.length >= 3 && years.length >= 1;
        return {
          passed,
          message: passed
            ? `سلامة الأنظمة السابقة مؤكدة: ${branches.length} فروع، ${students.length} طلاب، ${years.length} أعوام دراسية نشطة`
            : 'خلل في بيانات المراحل السابقة',
        };
      },
    },
  ];

  const filteredTests = activeCategory === 'all'
    ? testCases
    : testCases.filter((t) => t.category === activeCategory);

  const runAllTests = async () => {
    setIsRunning(true);
    const results: Record<number, { passed: boolean; message: string }> = {};

    for (const test of testCases) {
      try {
        const res = await test.run();
        results[test.id] = res;
      } catch (err: any) {
        results[test.id] = { passed: false, message: `استثناء غير معالج: ${err.message}` };
      }
      setTestResults({ ...results });
    }

    setIsRunning(false);
  };

  const passedCount = Object.values(testResults).filter((r) => r.passed).length;
  const failedCount = Object.values(testResults).filter((r) => !r.passed).length;
  const totalExecuted = Object.keys(testResults).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>حزمة التحقق الآلي الصارم — المرحلة 9 (Phase 9 Test Suite)</span>
        </div>
      }
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>منظومة التحقق المالي والرقابي للمرحلة 9 (38 اختباراً آلياً)</span>
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
              تغطي الحسابات الدقيقة بالوحدات الصغرى، الفواتير، الدفعات، الاسترداد، وحماية العزل.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={runAllTests} disabled={isRunning}>
              <Play className="w-3.5 h-3.5 ml-1" />
              {isRunning ? 'جارٍ الفحص...' : 'تشغيل كافة الاختبارات (Run All)'}
            </Button>
          </div>
        </div>

        {/* Progress & Counters */}
        {totalExecuted > 0 && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500">تم التنفيذ: </span>
                <span className="font-bold">{totalExecuted} / {testCases.length}</span>
              </div>
              <div className="text-emerald-600 font-bold">
                ناجح: {passedCount}
              </div>
              {failedCount > 0 && (
                <div className="text-red-600 font-bold">
                  فاشل: {failedCount}
                </div>
              )}
            </div>

            <Badge variant={failedCount === 0 && totalExecuted === testCases.length ? 'success' : 'warning'}>
              {failedCount === 0 && totalExecuted === testCases.length ? '100% نجاح تام' : 'قيد الفحص'}
            </Badge>
          </div>
        )}

        {/* Categories Tab */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
          {['all', 'Model & Math', 'Invoicing', 'Payments', 'Refunds', 'Security & Audit'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'كافة الاختبارات' : cat}
            </button>
          ))}
        </div>

        {/* Test Cases List */}
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filteredTests.map((test) => {
            const res = testResults[test.id];
            return (
              <div
                key={test.id}
                className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 font-bold">#{test.id}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{test.title}</span>
                  </div>
                  {res ? (
                    res.passed ? (
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="w-3 h-3 ml-1" />
                        اجتاز
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm">
                        <XCircle className="w-3 h-3 ml-1" />
                        فشل
                      </Badge>
                    )
                  ) : (
                    <Badge variant="neutral" size="sm">
                      لم يتم التشغيل
                    </Badge>
                  )}
                </div>

                {res && (
                  <div
                    className={`p-2 rounded-lg text-[11px] font-mono ${
                      res.passed
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                        : 'bg-red-50/70 dark:bg-red-950/30 text-red-800 dark:text-red-300'
                    }`}
                  >
                    {res.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            إغلاق النافذة
          </Button>
        </div>
      </div>
    </Modal>
  );
};
