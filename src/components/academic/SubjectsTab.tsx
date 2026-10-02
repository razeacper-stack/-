import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Link2,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { Subject } from '../../types/academic';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const SubjectsTab: React.FC<{
  onNavigateToGradeSubjects?: () => void;
}> = ({ onNavigateToGradeSubjects }) => {
  const { subjects, gradeSubjects, createSubject, updateSubject, toggleSubject, deleteSubject } =
    useAcademic();
  const { activeBranchId, branches, isAllBranches } = useBranch();
  const { hasPermission } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    branchId: activeBranchId && activeBranchId !== 'all' ? activeBranchId : 'branch-riyadh',
    nameAr: '',
    nameEn: '',
    subjectCode: '',
    description: '',
  });

  const [editForm, setEditForm] = useState({
    nameAr: '',
    nameEn: '',
    subjectCode: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchSearch =
        s.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [subjects, searchTerm, statusFilter]);

  const handleOpenCreate = () => {
    const targetBranch = activeBranchId && activeBranchId !== 'all' ? activeBranchId : branches[0]?.id || 'branch-riyadh';
    setCreateForm({
      branchId: targetBranch,
      nameAr: '',
      nameEn: '',
      subjectCode: '',
      description: '',
    });
    setFeedback(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setEditForm({
      nameAr: subject.nameAr,
      nameEn: subject.nameEn,
      subjectCode: subject.subjectCode,
      description: subject.description || '',
      status: subject.status,
    });
    setFeedback(null);
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await createSubject(createForm);
      setFeedback({ type: 'success', message: 'تمت إضافة المادة الدراسية بنجاح!' });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'فشل إنشاء المادة' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await updateSubject(selectedSubject.id, editForm);
      setFeedback({ type: 'success', message: 'تم تحديث المادة الدراسية بنجاح!' });
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'فشل تعديل المادة' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (subject: Subject) => {
    if (!window.confirm(`هل أنت متأكد من حذف المادة الدراسية "${subject.nameAr}"؟`)) return;
    try {
      await deleteSubject(subject.id);
      setFeedback({ type: 'success', message: `تم حذف المادة "${subject.nameAr}".` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'تعذر حذف المادة' });
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

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في المواد (الاسم، كود المقرر)..."
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
              <option value="active">مفعلة (Active)</option>
              <option value="inactive">معطلة (Inactive)</option>
            </select>
          </div>
        </div>

        {hasPermission('subjects.create') && (
          <Button variant="primary" onClick={handleOpenCreate} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            إضافة مادة دراسية
          </Button>
        )}
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSubjects.map((subject) => {
          const linksCount = gradeSubjects.filter((l) => l.subjectId === subject.id).length;

          return (
            <Card
              key={subject.id}
              className="p-5 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/60 px-2 py-0.5 rounded-md inline-block mb-1">
                        {subject.subjectCode}
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        {subject.nameAr}
                      </h3>
                      <p className="text-xs text-gray-400 font-mono">{subject.nameEn}</p>
                    </div>
                  </div>

                  <Badge variant={subject.status === 'active' ? 'success' : 'neutral'}>
                    {subject.status === 'active' ? 'نشطة' : 'معطلة'}
                  </Badge>
                </div>

                {subject.description && (
                  <p className="mt-4 text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl">
                    {subject.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                    <Link2 className="w-3.5 h-3.5" />
                    مسندة لـ ({linksCount}) صفوف
                  </span>

                  {onNavigateToGradeSubjects && (
                    <button
                      onClick={onNavigateToGradeSubjects}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      خطة التوزيع
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                {hasPermission('subjects.edit') && (
                  <button
                    onClick={() => handleOpenEdit(subject)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="تعديل المادة"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {hasPermission('subjects.delete') && (
                  <button
                    onClick={() => handleDelete(subject)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="حذف المادة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredSubjects.length === 0 && (
        <Card className="py-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base">لا توجد مواد دراسية</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
            لم يتم العثور على أي مادة دراسية مطابقة لمعايير البحث في هذا الفرع.
          </p>
        </Card>
      )}

      {/* CREATE SUBJECT MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="إضافة مادة دراسية جديدة"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
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
                    {b.nameAr}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              اسم المادة (بالعربية) *
            </label>
            <input
              type="text"
              required
              value={createForm.nameAr}
              onChange={(e) => setCreateForm({ ...createForm, nameAr: e.target.value })}
              placeholder="مثال: الرياضيات التطبيقية"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              اسم المادة (بالإنجليزية) *
            </label>
            <input
              type="text"
              required
              value={createForm.nameEn}
              onChange={(e) => setCreateForm({ ...createForm, nameEn: e.target.value })}
              placeholder="e.g. Applied Mathematics"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              كود المقرر (Subject Code) *
            </label>
            <input
              type="text"
              required
              value={createForm.subjectCode}
              onChange={(e) => setCreateForm({ ...createForm, subjectCode: e.target.value.toUpperCase() })}
              placeholder="MATH-101"
              className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              وصف المنهج والمقرر
            </label>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="موجز أهداف المقرر والمحاور التعليمية..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جارٍ الحفظ...' : 'إضافة المادة'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT SUBJECT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="تعديل المادة الدراسية"
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              اسم المادة (بالعربية) *
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
              اسم المادة (بالإنجليزية) *
            </label>
            <input
              type="text"
              required
              value={editForm.nameEn}
              onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              كود المقرر *
            </label>
            <input
              type="text"
              required
              value={editForm.subjectCode}
              onChange={(e) => setEditForm({ ...editForm, subjectCode: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
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
              <option value="active">نشطة (Active)</option>
              <option value="inactive">معطلة (Inactive)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              وصف المنهج
            </label>
            <textarea
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
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
