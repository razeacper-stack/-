import React, { useState, useMemo } from 'react';
import {
  School,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  DoorOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { ClassSection } from '../../types/academic';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const ClassesTab: React.FC = () => {
  const { classes, stages, grades, years, createClass, updateClass, toggleClass, deleteClass } =
    useAcademic();
  const { activeBranchId, branches, isAllBranches } = useBranch();
  const { hasPermission } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('ALL');
  const [selectedGradeId, setSelectedGradeId] = useState('ALL');
  const [selectedYearId, setSelectedYearId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassSection | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    branchId: activeBranchId && activeBranchId !== 'all' ? activeBranchId : 'branch-riyadh',
    academicYearId: '',
    stageId: '',
    gradeId: '',
    nameAr: '',
    nameEn: '',
    classCode: '',
    capacity: 25,
    roomNumber: '',
    notes: '',
  });

  const [editForm, setEditForm] = useState({
    nameAr: '',
    nameEn: '',
    classCode: '',
    capacity: 25,
    roomNumber: '',
    status: 'active' as 'active' | 'inactive',
    notes: '',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered grades for dropdowns
  const availableGradesForCreate = useMemo(() => {
    if (!createForm.stageId) return grades;
    return grades.filter((g) => g.stageId === createForm.stageId);
  }, [grades, createForm.stageId]);

  // Filtered classes list
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchSearch =
        cls.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.classCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.roomNumber && cls.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStage = selectedStageId === 'ALL' || cls.stageId === selectedStageId;
      const matchGrade = selectedGradeId === 'ALL' || cls.gradeId === selectedGradeId;
      const matchYear = selectedYearId === 'ALL' || cls.academicYearId === selectedYearId;
      const matchStatus = statusFilter === 'ALL' || cls.status === statusFilter;

      return matchSearch && matchStage && matchGrade && matchYear && matchStatus;
    });
  }, [classes, searchTerm, selectedStageId, selectedGradeId, selectedYearId, statusFilter]);

  const handleOpenCreate = () => {
    const targetBranch = activeBranchId && activeBranchId !== 'all' ? activeBranchId : branches[0]?.id || 'branch-riyadh';
    const activeYear = years.find((y) => y.isCurrent) || years[0];
    const initialStage = stages[0]?.id || '';
    const initialGrade = grades.find((g) => g.stageId === initialStage)?.id || grades[0]?.id || '';

    setCreateForm({
      branchId: targetBranch,
      academicYearId: activeYear?.id || '',
      stageId: initialStage,
      gradeId: initialGrade,
      nameAr: '',
      nameEn: '',
      classCode: '',
      capacity: 25,
      roomNumber: '',
      notes: '',
    });
    setFeedback(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassSection) => {
    setSelectedClass(cls);
    setEditForm({
      nameAr: cls.nameAr,
      nameEn: cls.nameEn,
      classCode: cls.classCode,
      capacity: cls.capacity,
      roomNumber: cls.roomNumber || '',
      status: cls.status,
      notes: cls.notes || '',
    });
    setFeedback(null);
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (Number(createForm.capacity) <= 0 || !Number.isInteger(Number(createForm.capacity))) {
        throw new Error('السعة الاستيعابية يجب أن تكون رقماً صحيحاً أكبر من الصفر.');
      }

      await createClass({
        ...createForm,
        capacity: Number(createForm.capacity),
      });

      setFeedback({ type: 'success', message: 'تم تأسيس الفصل الدراسي بنجاح!' });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'حدث خطأ أثناء إنشاء الفصل' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (Number(editForm.capacity) <= 0 || !Number.isInteger(Number(editForm.capacity))) {
        throw new Error('السعة الاستيعابية يجب أن تكون رقماً صحيحاً أكبر من الصفر.');
      }

      await updateClass(selectedClass.id, {
        ...editForm,
        capacity: Number(editForm.capacity),
      });

      setFeedback({ type: 'success', message: 'تم تحديث بيانات الفصل بنجاح!' });
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'حدث خطأ أثناء تعديل الفصل' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cls: ClassSection) => {
    if (!window.confirm(`هل أنت متأكد من حذف الفصل الدراسي "${cls.nameAr}"؟`)) return;
    try {
      await deleteClass(cls.id);
      setFeedback({ type: 'success', message: `تم حذف الفصل "${cls.nameAr}".` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'تعذر حذف الفصل' });
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

      {/* Action and Filter Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في الفصول (الاسم، الكود، رقم القاعة)..."
              className="w-full pr-9 pl-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {hasPermission('classes.create') && (
            <Button variant="primary" onClick={handleOpenCreate} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              إنشاء فصل دراسي جديد
            </Button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />

          {/* Stage Filter */}
          <select
            value={selectedStageId}
            onChange={(e) => setSelectedStageId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          >
            <option value="ALL">جميع المراحل</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nameAr}
              </option>
            ))}
          </select>

          {/* Grade Filter */}
          <select
            value={selectedGradeId}
            onChange={(e) => setSelectedGradeId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          >
            <option value="ALL">جميع الصفوف</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nameAr}
              </option>
            ))}
          </select>

          {/* Academic Year Filter */}
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          >
            <option value="ALL">جميع السنوات الدراسية</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.nameAr} {y.isCurrent ? '★ (الحالية)' : ''}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          >
            <option value="ALL">الحالة (الكل)</option>
            <option value="active">مفعل</option>
            <option value="inactive">معطل</option>
          </select>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClasses.map((cls) => {
          const stageObj = stages.find((s) => s.id === cls.stageId);
          const gradeObj = grades.find((g) => g.id === cls.gradeId);
          const yearObj = years.find((y) => y.id === cls.academicYearId);

          return (
            <Card
              key={cls.id}
              className="p-5 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold mb-1">
                      {cls.classCode}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      {cls.nameAr}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">{cls.nameEn}</p>
                  </div>

                  <Badge variant={cls.status === 'active' ? 'success' : 'neutral'}>
                    {cls.status === 'active' ? 'نشط' : 'معطل'}
                  </Badge>
                </div>

                {/* Metadata Tags */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
                  {stageObj && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium">
                      {stageObj.nameAr}
                    </span>
                  )}
                  {gradeObj && (
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                      {gradeObj.nameAr}
                    </span>
                  )}
                </div>

                {/* Capacity & Room Info */}
                <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      السعة الاستيعابية:
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {cls.capacity} مقعد
                    </span>
                  </div>

                  {cls.roomNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <DoorOpen className="w-3.5 h-3.5" />
                        رقم القاعة:
                      </span>
                      <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                        {cls.roomNumber}
                      </span>
                    </div>
                  )}

                  {yearObj && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-gray-700/60 text-[11px] text-gray-500">
                      <span>العام الدراسي:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{yearObj.nameAr}</span>
                    </div>
                  )}
                </div>

                {cls.notes && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic line-clamp-1">
                    ملاحظات: {cls.notes}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                {hasPermission('classes.edit') && (
                  <button
                    onClick={() => handleOpenEdit(cls)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="تعديل الفصل"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {hasPermission('classes.delete') && (
                  <button
                    onClick={() => handleDelete(cls)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="حذف الفصل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredClasses.length === 0 && (
        <Card className="py-12 text-center">
          <School className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base">لا توجد فصول دراسية</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
            لم يتم العثور على فصول دراسية مطابقة للفلاتر المحددة.
          </p>
        </Card>
      )}

      {/* CREATE CLASS MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="إنشاء فصل دراسي جديد"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                السنة الدراسية *
              </label>
              <select
                required
                value={createForm.academicYearId}
                onChange={(e) => setCreateForm({ ...createForm, academicYearId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.nameAr} {y.isCurrent ? '★ (الحالية)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                المرحلة الدراسية *
              </label>
              <select
                required
                value={createForm.stageId}
                onChange={(e) => {
                  const newStageId = e.target.value;
                  const matchingGrades = grades.filter((g) => g.stageId === newStageId);
                  setCreateForm({
                    ...createForm,
                    stageId: newStageId,
                    gradeId: matchingGrades[0]?.id || '',
                  });
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              الصف الدراسي التابع له *
            </label>
            <select
              required
              value={createForm.gradeId}
              onChange={(e) => setCreateForm({ ...createForm, gradeId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              {availableGradesForCreate.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nameAr} ({g.gradeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                اسم الفصل بالعربية *
              </label>
              <input
                type="text"
                required
                value={createForm.nameAr}
                onChange={(e) => setCreateForm({ ...createForm, nameAr: e.target.value })}
                placeholder="مثال: فصل 1/أ"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                اسم الفصل بالإنجليزية *
              </label>
              <input
                type="text"
                required
                value={createForm.nameEn}
                onChange={(e) => setCreateForm({ ...createForm, nameEn: e.target.value })}
                placeholder="e.g. Section 1-A"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                كود الفصل *
              </label>
              <input
                type="text"
                required
                value={createForm.classCode}
                onChange={(e) => setCreateForm({ ...createForm, classCode: e.target.value.toUpperCase() })}
                placeholder="RUH-1A"
                className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                السعة (مقاعد) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={createForm.capacity}
                onChange={(e) => setCreateForm({ ...createForm, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                رقم القاعة
              </label>
              <input
                type="text"
                value={createForm.roomNumber}
                onChange={(e) => setCreateForm({ ...createForm, roomNumber: e.target.value })}
                placeholder="القاعة 101"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              ملاحظات إضافية
            </label>
            <textarea
              rows={2}
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              placeholder="تجهيزات الفصل، الشاشات التفاعلية..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جارٍ الحفظ...' : 'تأسيس الفصل الدراسي'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT CLASS MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="تعديل بيانات الفصل الدراسي"
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                اسم الفصل بالعربية *
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
                اسم الفصل بالإنجليزية *
              </label>
              <input
                type="text"
                required
                value={editForm.nameEn}
                onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                كود الفصل *
              </label>
              <input
                type="text"
                required
                value={editForm.classCode}
                onChange={(e) => setEditForm({ ...editForm, classCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                السعة (مقاعد) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={editForm.capacity}
                onChange={(e) => setEditForm({ ...editForm, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                رقم القاعة
              </label>
              <input
                type="text"
                value={editForm.roomNumber}
                onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}
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
              <option value="active">نشط (Active)</option>
              <option value="inactive">معطل (Inactive)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              الملاحظات
            </label>
            <textarea
              rows={2}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
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
