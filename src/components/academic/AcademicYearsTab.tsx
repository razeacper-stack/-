import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Star,
  Edit2,
  Trash2,
  Archive,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Filter,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { AcademicYear, AcademicYearStatus } from '../../types/academic';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const AcademicYearsTab: React.FC = () => {
  const { years, createYear, updateYear, setCurrentYear, deleteYear } = useAcademic();
  const { activeBranchId, branches, isAllBranches, activeBranch } = useBranch();
  const { hasPermission } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AcademicYearStatus>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    branchId: activeBranchId && activeBranchId !== 'all' ? activeBranchId : (branches[0]?.id || ''),
    nameAr: '',
    nameEn: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE' as AcademicYearStatus,
    isCurrent: false,
  });

  const [editForm, setEditForm] = useState({
    nameAr: '',
    nameEn: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE' as AcademicYearStatus,
    isCurrent: false,
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered years
  const filteredYears = useMemo(() => {
    return years.filter((y) => {
      const matchSearch =
        y.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        y.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        y.startDate.includes(searchTerm) ||
        y.endDate.includes(searchTerm);

      const matchStatus = statusFilter === 'ALL' || y.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [years, searchTerm, statusFilter]);

  const handleOpenCreate = () => {
    const targetBranch = activeBranchId && activeBranchId !== 'all' ? activeBranchId : (branches[0]?.id || '');
    setCreateForm({
      branchId: targetBranch,
      nameAr: '',
      nameEn: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 300 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'ACTIVE',
      isCurrent: false,
    });
    setFeedback(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (year: AcademicYear) => {
    setSelectedYear(year);
    setEditForm({
      nameAr: year.nameAr,
      nameEn: year.nameEn,
      startDate: year.startDate,
      endDate: year.endDate,
      status: year.status,
      isCurrent: year.isCurrent,
    });
    setFeedback(null);
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (new Date(createForm.startDate) >= new Date(createForm.endDate)) {
        throw new Error('تاريخ بداية السنة الدراسية يجب أن يسبق تاريخ نهايتها.');
      }

      await createYear(createForm);
      setFeedback({ type: 'success', message: 'تم تأسيس السنة الدراسية بنجاح!' });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'فشل إنشاء السنة الدراسية' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (new Date(editForm.startDate) >= new Date(editForm.endDate)) {
        throw new Error('تاريخ بداية السنة الدراسية يجب أن يسبق تاريخ نهايتها.');
      }

      await updateYear(selectedYear.id, editForm);
      setFeedback({ type: 'success', message: 'تم تحديث بيانات السنة الدراسية بنجاح!' });
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'فشل تحديث السنة الدراسية' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetCurrent = async (year: AcademicYear) => {
    try {
      await setCurrentYear(year.id);
      setFeedback({ type: 'success', message: `تم تفعيل "${year.nameAr}" كسنة حالية نشطة للفرع بنجاح.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'فشل تعيين السنة الحالية' });
    }
  };

  const handleDelete = async (year: AcademicYear) => {
    if (!window.confirm(`هل أنت متأكد من حذف/أرشفة السنة الدراسية "${year.nameAr}"؟`)) return;
    try {
      await deleteYear(year.id);
      setFeedback({ type: 'success', message: `تم حذف السنة الدراسية "${year.nameAr}".` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'تعذر حذف السنة الدراسية' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm font-semibold transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في السنوات الدراسية (الاسم أو التواريخ)..."
              className="w-full pr-9 pl-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="ACTIVE">نشطة (ACTIVE)</option>
              <option value="PLANNED">مخططة (PLANNED)</option>
              <option value="CLOSED">مغلقة (CLOSED)</option>
              <option value="ARCHIVED">مؤرشفة (ARCHIVED)</option>
            </select>
          </div>
        </div>

        {hasPermission('academic_years.create') && (
          <Button variant="primary" onClick={handleOpenCreate} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            إنشاء سنة دراسية جديدة
          </Button>
        )}
      </div>

      {/* Years List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredYears.map((year) => {
          const branchObj = branches.find((b) => b.id === year.branchId);

          return (
            <Card
              key={year.id}
              className={`p-5 transition-all relative overflow-hidden border-2 ${
                year.isCurrent
                  ? 'border-blue-500 shadow-md shadow-blue-500/5 dark:bg-blue-950/10'
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              {year.isCurrent && (
                <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-br-xl shadow-sm flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  السنة الحالية للفرع
                </div>
              )}

              <div className="flex items-start justify-between gap-3 pt-2">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">
                    {year.nameAr}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {year.nameEn}
                  </p>
                </div>

                <Badge
                  variant={
                    year.status === 'ACTIVE'
                      ? 'success'
                      : year.status === 'PLANNED'
                      ? 'warning'
                      : year.status === 'CLOSED'
                      ? 'danger'
                      : 'neutral'
                  }
                >
                  {year.status}
                </Badge>
              </div>

              {/* Campus tag if all branches view */}
              {isAllBranches && (
                <div className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {branchObj?.nameAr || year.branchId}
                </div>
              )}

              {/* Dates */}
              <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">البداية:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{year.startDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">النهاية:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{year.endDate}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                {!year.isCurrent && year.status !== 'CLOSED' && year.status !== 'ARCHIVED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetCurrent(year)}
                    className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 gap-1"
                  >
                    <Star className="w-3.5 h-3.5" />
                    تعيين كحالية
                  </Button>
                )}

                <div className="flex items-center gap-1.5 mr-auto">
                  {hasPermission('academic_years.edit') && (
                    <button
                      onClick={() => handleOpenEdit(year)}
                      title="تعديل السنة الدراسية"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  {hasPermission('academic_years.delete') && !year.isCurrent && (
                    <button
                      onClick={() => handleDelete(year)}
                      title="حذف/أرشفة السنة"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredYears.length === 0 && (
        <Card className="py-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base">لا توجد سنوات دراسية</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
            لم يتم العثور على أي سنة دراسية مطابقة لمعايير البحث في هذا الفرع.
          </p>
        </Card>
      )}

      {/* CREATE YEAR MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="إنشاء سنة دراسية جديدة"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Branch selector if in all branches mode */}
          {isAllBranches && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                الفرع المدرسي *
              </label>
              <select
                value={createForm.branchId}
                onChange={(e) => setCreateForm({ ...createForm, branchId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nameAr} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              اسم السنة الدراسية (بالعربية) *
            </label>
            <input
              type="text"
              required
              value={createForm.nameAr}
              onChange={(e) => setCreateForm({ ...createForm, nameAr: e.target.value })}
              placeholder="مثال: العام الدراسي 2026–2027"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              اسم السنة الدراسية (بالإنجليزية) *
            </label>
            <input
              type="text"
              required
              value={createForm.nameEn}
              onChange={(e) => setCreateForm({ ...createForm, nameEn: e.target.value })}
              placeholder="e.g. Academic Year 2026–2027"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                تاريخ البداية *
              </label>
              <input
                type="date"
                required
                value={createForm.startDate}
                onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                تاريخ النهاية *
              </label>
              <input
                type="date"
                required
                value={createForm.endDate}
                onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              الحالة التشغيلية
            </label>
            <select
              value={createForm.status}
              onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as any })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="ACTIVE">نشطة (ACTIVE)</option>
              <option value="PLANNED">مخططة (PLANNED)</option>
              <option value="CLOSED">مغلقة (CLOSED)</option>
            </select>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createForm.isCurrent}
                onChange={(e) => setCreateForm({ ...createForm, isCurrent: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                تعيين هذه السنة مباشرة كـ "السنة الدراسية الحالية" للفرع (ستلغي تفعيل أي سنة حالية أخرى تلقائياً وبشكل ذري)
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جارٍ الحفظ...' : 'تأسيس السنة الدراسية'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT YEAR MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="تعديل بيانات السنة الدراسية"
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              اسم السنة الدراسية (بالعربية) *
            </label>
            <input
              type="text"
              required
              value={editForm.nameAr}
              onChange={(e) => setEditForm({ ...editForm, nameAr: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              اسم السنة الدراسية (بالإنجليزية) *
            </label>
            <input
              type="text"
              required
              value={editForm.nameEn}
              onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                تاريخ البداية *
              </label>
              <input
                type="date"
                required
                value={editForm.startDate}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                تاريخ النهاية *
              </label>
              <input
                type="date"
                required
                value={editForm.endDate}
                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              الحالة
            </label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="ACTIVE">نشطة (ACTIVE)</option>
              <option value="PLANNED">مخططة (PLANNED)</option>
              <option value="CLOSED">مغلقة (CLOSED)</option>
              <option value="ARCHIVED">مؤرشفة (ARCHIVED)</option>
            </select>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.isCurrent}
                onChange={(e) => setEditForm({ ...editForm, isCurrent: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                تعيين كسنة دراسية حالية للفرع
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
