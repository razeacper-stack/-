import React, { useState } from 'react';
import {
  Building2,
  Plus,
  School,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { Branch } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { storageResetService } from '../../services/storageResetService';

export interface BranchesManagementProps {
  onNavigateTab?: (tab: string) => void;
}

export const BranchesManagement: React.FC<BranchesManagementProps> = ({ onNavigateTab }) => {
  const { language, direction, t } = useTranslation();
  const { branches, createBranch, updateBranch, toggleBranchStatus, setActiveBranchId, refreshBranches } = useBranch();
  const { currentUser, isSuperAdmin, hasPermission } = useAuth();
  const ArrowIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [form, setForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    phone: '',
    email: '',
    managerName: '',
    addressAr: '',
    addressEn: '',
    status: 'active' as 'active' | 'inactive',
  });

  const canCreate = isSuperAdmin || hasPermission('branches.create');
  const canEdit = isSuperAdmin || hasPermission('branches.edit');

  const handleOpenCreate = () => {
    const nextNum = branches.length + 1;
    const padded = String(nextNum).padStart(2, '0');
    setForm({
      code: `SCH-${padded}`,
      nameAr: '',
      nameEn: '',
      phone: '',
      email: '',
      managerName: '',
      addressAr: '',
      addressEn: '',
      status: 'active',
    });
    setEditingBranch(null);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setForm({
      code: branch.code,
      nameAr: branch.nameAr,
      nameEn: branch.nameEn,
      phone: branch.phone,
      email: branch.email,
      managerName: branch.managerName || '',
      addressAr: branch.addressAr,
      addressEn: branch.addressEn,
      status: branch.status,
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr.trim() || !form.nameEn.trim()) {
      setFeedback({
        type: 'error',
        message: language === 'ar' ? 'يرجى إدخال اسم المدرسة بالعربية والإنجليزية.' : 'Please enter school name in Arabic and English.',
      });
      return;
    }

    if (!form.code.trim()) {
      setFeedback({
        type: 'error',
        message: language === 'ar' ? 'رمز المدرسة مطلوب.' : 'School code is required.',
      });
      return;
    }

    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, form);
        setFeedback({
          type: 'success',
          message: language === 'ar' ? 'تم تحديث بيانات المدرسة بنجاح.' : 'School details updated successfully.',
        });
      } else {
        const created = await createBranch(form);
        setActiveBranchId(created.id);
        setFeedback({
          type: 'success',
          message: language === 'ar' ? 'تم تسجيل المدرسة الجديدة بنجاح وتم تعيينها كمدرسة نشطة.' : 'New school registered and activated successfully.',
        });
      }
      setIsModalOpen(false);
      refreshBranches();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || (language === 'ar' ? 'فشلت العملية' : 'Operation failed'),
      });
    }
  };

  const handleToggleStatus = async (branchId: string) => {
    try {
      await toggleBranchStatus(branchId);
      refreshBranches();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'فشل تغيير حالة المدرسة',
      });
    }
  };

  const handlePurgeAllData = () => {
    if (!isSuperAdmin || !currentUser) return;
    try {
      storageResetService.purgeAllData(currentUser);
      setIsPurgeModalOpen(false);
      refreshBranches();
      setFeedback({
        type: 'success',
        message: language === 'ar' ? 'تم تفريغ كافة البيانات بنجاح، يمكنك الآن تسجيل بياناتك من الصفر.' : 'All data wiped successfully. You can now register from scratch.',
      });
      // Force reload state
      window.location.reload();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'فشلت عملية التفريغ',
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <School className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>{language === 'ar' ? 'إدارة المدارس والفروع (تسجيل المدارس)' : 'Schools & Campuses Management'}</span>
            </h1>
            <Badge variant="primary" size="sm">
              {branches.length} {language === 'ar' ? 'مدارس مسجلة' : 'Registered'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'تسجيل المدارس الجديدة من الصفر، إدارة الفروع، وتعيين بيانات الإدارة والتواصل'
              : 'Register new schools from scratch, manage campuses, and assign administrative details'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-500" />}
              onClick={() => setIsPurgeModalOpen(true)}
              className="text-xs border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600"
            >
              {language === 'ar' ? 'تفريغ كافة البيانات (بدء من الصفر)' : 'Wipe All Data (Start Clean)'}
            </Button>
          )}

          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreate}
              className="shadow-sm"
            >
              {language === 'ar' ? 'تسجيل مدرسة جديدة' : 'Register New School'}
            </Button>
          )}
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs sm:text-sm animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ZERO DATA EMPTY STATE */}
      {branches.length === 0 ? (
        <Card className="py-16 px-6 text-center max-w-2xl mx-auto space-y-5 border-dashed border-2 border-slate-300 dark:border-slate-700">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 shadow-sm">
            <School className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {language === 'ar' ? 'لا توجد أي مدرسة مسجلة في النظام حتى الآن' : 'No Schools Registered Yet'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {language === 'ar'
                ? 'النظام جاهز تماماً لتسجيل بياناتك من الصفر. ابدأ الآن بتسجيل مدرستك الأولى لإضافة المعلمين، والفصول، والجداول الدراسية، والطلاب.'
                : 'The system is ready for your fresh data. Start now by registering your first school to configure faculty, classes, timetables, and students.'}
            </p>
          </div>

          {canCreate && (
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Plus className="w-5 h-5" />}
                onClick={handleOpenCreate}
                className="shadow-md"
              >
                {language === 'ar' ? 'تسجيل المدرسة الأولى الآن' : 'Register First School Now'}
              </Button>
            </div>
          )}
        </Card>
      ) : (
        /* GRID OF REGISTERED SCHOOLS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((b) => {
            const isInactive = b.status === 'inactive';
            return (
              <Card
                key={b.id}
                className={`flex flex-col justify-between transition-all hover:shadow-md border ${
                  isInactive ? 'opacity-70 bg-slate-50/50 dark:bg-slate-900/50' : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="space-y-4">
                  {/* Top card bar */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                          {b.code}
                        </span>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {isInactive ? (
                            <span className="text-amber-600 dark:text-amber-400">معطل مؤقتاً</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">مدرسة نشطة</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Badge variant={isInactive ? 'warning' : 'success'} size="sm">
                      {isInactive ? 'غير نشط' : 'نشط'}
                    </Badge>
                  </div>

                  {/* School names */}
                  <div className="space-y-0.5">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                      {language === 'ar' ? b.nameAr : b.nameEn}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {language === 'ar' ? b.nameEn : b.nameAr}
                    </p>
                  </div>

                  {/* Details metadata */}
                  <div className="space-y-2 pt-1 text-xs text-slate-600 dark:text-slate-300">
                    {b.managerName && (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          <span className="text-slate-400 me-1">{language === 'ar' ? 'المدير:' : 'Principal:'}</span>
                          <span className="font-semibold">{b.managerName}</span>
                        </span>
                      </div>
                    )}

                    {b.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px] truncate">{b.phone}</span>
                      </div>
                    )}

                    {b.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{b.email}</span>
                      </div>
                    )}

                    {b.addressAr && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {language === 'ar' ? b.addressAr : b.addressEn || b.addressAr}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer card actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActiveBranchId(b.id);
                      if (onNavigateTab) onNavigateTab('dashboard');
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  >
                    <span>{language === 'ar' ? 'اختيار للعمل' : 'Select Branch'}</span>
                    <ArrowIcon className="w-3.5 h-3.5 ms-1" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleToggleStatus(b.id)}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title={isInactive ? 'تفعيل المدرسة' : 'تعطيل المدرسة'}
                        >
                          {isInactive ? 'تفعيل' : 'تعطيل'}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="تعديل بيانات المدرسة"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT SCHOOL MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-blue-600" />
            <span>
              {editingBranch
                ? language === 'ar' ? 'تعديل بيانات المدرسة' : 'Edit School Details'
                : language === 'ar' ? 'تسجيل مدرسة جديدة' : 'Register New School'}
            </span>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'ar' ? 'اسم المدرسة (بالعربية) *' : 'School Name (Arabic) *'}
              </label>
              <input
                type="text"
                required
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                placeholder={language === 'ar' ? 'مثال: مدرسة الأمل النموذجية الأهلية' : 'School Name in Arabic'}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'ar' ? 'اسم المدرسة (بالإنجليزية) *' : 'School Name (English) *'}
              </label>
              <input
                type="text"
                required
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                placeholder="e.g. Al-Amal Model School"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'ar' ? 'رمز / كود المدرسة *' : 'School Code *'}
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SCH-01"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'ar' ? 'اسم مدير المدرسة / المسؤول' : 'Principal / Manager Name'}
              </label>
              <input
                type="text"
                value={form.managerName}
                onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                placeholder={language === 'ar' ? 'أ. محمد العتيبي' : 'Principal Name'}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'ar' ? 'رقم الهاتف الرسمي' : 'Official Phone'}
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+966 11 000 0000"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'ar' ? 'البريد الإلكتروني الرسمي' : 'Official Email'}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="school@example.com"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'ar' ? 'العنوان والموقع التفصيلي' : 'Address'}
              </label>
              <input
                type="text"
                value={form.addressAr}
                onChange={(e) => setForm({ ...form, addressAr: e.target.value, addressEn: e.target.value })}
                placeholder={language === 'ar' ? 'الرياض، حي الملقا، طريق الملك فهد' : 'City, Street Address'}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingBranch
                ? language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'
                : language === 'ar' ? 'تسجيل المدرسة' : 'Register School'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* PURGE ALL DATA CONFIRMATION MODAL */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-200 dark:border-rose-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">
                  {language === 'ar' ? 'تأكيد تفريغ كافة البيانات' : 'Confirm Complete Data Wipe'}
                </h3>
                <span className="text-[11px] text-rose-500 font-medium">بدء من الصفر بقاعدة بيانات فارغة</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'ar'
                ? 'سيتم مسح وتفريغ كافة المدارس، والمعلمين، والطلاب، والفصول، والجداول، والسندات التجريبية، ولن يتبقى أي بيانات في النظام. يمكنك بعدها تسجيل مدرستك وبياناتك الحقيقية من الصفر. هل تريد الاستمرار؟'
                : 'All mock schools, faculty, students, timetables, and financial records will be wiped completely. You will be able to input your genuine data from scratch. Are you sure you want to proceed?'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setIsPurgeModalOpen(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="danger" size="sm" onClick={handlePurgeAllData}>
                {language === 'ar' ? 'نعم، مسح كافة البيانات الآن' : 'Yes, Wipe All Data Now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
