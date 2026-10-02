import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  GraduationCap,
  Shield,
  Filter,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { AcademicStage, Grade } from '../../types/academic';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const StagesGradesTab: React.FC = () => {
  const {
    stages,
    grades,
    createStage,
    updateStage,
    toggleStage,
    deleteStage,
    createGrade,
    updateGrade,
    toggleGrade,
    deleteGrade,
  } = useAcademic();

  const { activeBranchId, branches, isAllBranches } = useBranch();
  const { hasPermission } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');

  // Stage Modals
  const [isCreateStageModalOpen, setIsCreateStageModalOpen] = useState(false);
  const [isEditStageModalOpen, setIsEditStageModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<AcademicStage | null>(null);

  // Grade Modals
  const [isCreateGradeModalOpen, setIsCreateGradeModalOpen] = useState(false);
  const [isEditGradeModalOpen, setIsEditGradeModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [gradeParentStageId, setGradeParentStageId] = useState<string>('');

  // Forms
  const [stageForm, setStageForm] = useState({
    branchId: activeBranchId && activeBranchId !== 'all' ? activeBranchId : 'branch-riyadh',
    nameAr: '',
    nameEn: '',
    description: '',
    displayOrder: 1,
  });

  const [gradeForm, setGradeForm] = useState({
    branchId: activeBranchId && activeBranchId !== 'all' ? activeBranchId : 'branch-riyadh',
    stageId: '',
    nameAr: '',
    nameEn: '',
    gradeCode: '',
    displayOrder: 1,
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Stages
  const filteredStages = useMemo(() => {
    return stages.filter((stg) => {
      const matchSearch =
        stg.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stg.nameEn.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStageFilter = selectedStageFilter === 'ALL' || stg.id === selectedStageFilter;
      return matchSearch && matchStageFilter;
    });
  }, [stages, searchTerm, selectedStageFilter]);

  // Stage Handlers
  const handleOpenCreateStage = () => {
    const targetBranch = activeBranchId && activeBranchId !== 'all' ? activeBranchId : branches[0]?.id || 'branch-riyadh';
    setStageForm({
      branchId: targetBranch,
      nameAr: '',
      nameEn: '',
      description: '',
      displayOrder: stages.length + 1,
    });
    setFeedback(null);
    setIsCreateStageModalOpen(true);
  };

  const handleOpenEditStage = (stage: AcademicStage) => {
    setSelectedStage(stage);
    setStageForm({
      branchId: stage.branchId,
      nameAr: stage.nameAr,
      nameEn: stage.nameEn,
      description: stage.description,
      displayOrder: stage.displayOrder,
    });
    setFeedback(null);
    setIsEditStageModalOpen(true);
  };

  const handleStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (selectedStage) {
        await updateStage(selectedStage.id, {
          nameAr: stageForm.nameAr,
          nameEn: stageForm.nameEn,
          description: stageForm.description,
          displayOrder: Number(stageForm.displayOrder),
        });
        setFeedback({ type: 'success', message: 'تم تحديث المرحلة الدراسية بنجاح!' });
        setIsEditStageModalOpen(false);
      } else {
        await createStage(stageForm);
        setFeedback({ type: 'success', message: 'تم إنشاء المرحلة الدراسية بنجاح!' });
        setIsCreateStageModalOpen(false);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'حدث خطأ أثناء معالجة المرحلة' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStage = async (stage: AcademicStage) => {
    if (!window.confirm(`هل أنت متأكد من حذف المرحلة الدراسية "${stage.nameAr}"؟`)) return;
    try {
      await deleteStage(stage.id);
      setFeedback({ type: 'success', message: `تم حذف المرحلة "${stage.nameAr}".` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'تعذر حذف المرحلة' });
    }
  };

  // Grade Handlers
  const handleOpenCreateGrade = (stageId?: string) => {
    const parentStage = stageId || stages[0]?.id || '';
    const stageObj = stages.find((s) => s.id === parentStage);
    const targetBranch = stageObj?.branchId || activeBranchId || 'branch-riyadh';

    setGradeForm({
      branchId: targetBranch,
      stageId: parentStage,
      nameAr: '',
      nameEn: '',
      gradeCode: '',
      displayOrder: grades.filter((g) => g.stageId === parentStage).length + 1,
    });
    setGradeParentStageId(parentStage);
    setFeedback(null);
    setIsCreateGradeModalOpen(true);
  };

  const handleOpenEditGrade = (grade: Grade) => {
    setSelectedGrade(grade);
    setGradeForm({
      branchId: grade.branchId,
      stageId: grade.stageId,
      nameAr: grade.nameAr,
      nameEn: grade.nameEn,
      gradeCode: grade.gradeCode,
      displayOrder: grade.displayOrder,
    });
    setFeedback(null);
    setIsEditGradeModalOpen(true);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (selectedGrade) {
        await updateGrade(selectedGrade.id, {
          nameAr: gradeForm.nameAr,
          nameEn: gradeForm.nameEn,
          gradeCode: gradeForm.gradeCode,
          stageId: gradeForm.stageId,
          displayOrder: Number(gradeForm.displayOrder),
        });
        setFeedback({ type: 'success', message: 'تم تحديث الصف الدراسي بنجاح!' });
        setIsEditGradeModalOpen(false);
      } else {
        await createGrade(gradeForm);
        setFeedback({ type: 'success', message: 'تم إنشاء الصف الدراسي بنجاح!' });
        setIsCreateGradeModalOpen(false);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'حدث خطأ أثناء معالجة الصف' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGrade = async (grade: Grade) => {
    if (!window.confirm(`هل أنت متأكد من حذف الصف الدراسي "${grade.nameAr}"؟`)) return;
    try {
      await deleteGrade(grade.id);
      setFeedback({ type: 'success', message: `تم حذف الصف "${grade.nameAr}".` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'تعذر حذف الصف' });
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
              placeholder="بحث في المراحل والصفوف الدراسية..."
              className="w-full pr-9 pl-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="ALL">جميع المراحل</option>
              {stages.map((stg) => (
                <option key={stg.id} value={stg.id}>
                  {stg.nameAr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('grades.create') && stages.length > 0 && (
            <Button variant="outline" onClick={() => handleOpenCreateGrade()} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              إضافة صف دراسي
            </Button>
          )}

          {hasPermission('academic_stages.create') && (
            <Button variant="primary" onClick={handleOpenCreateStage} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              إنشاء مرحلة دراسية
            </Button>
          )}
        </div>
      </div>

      {/* Stages & Child Grades Tree */}
      <div className="space-y-6">
        {filteredStages.map((stage) => {
          const stageGrades = grades
            .filter((g) => g.stageId === stage.id)
            .sort((a, b) => a.displayOrder - b.displayOrder);

          return (
            <Card key={stage.id} className="p-6 transition-all border border-gray-200 dark:border-gray-800">
              {/* Stage Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{stage.nameAr}</h3>
                      <Badge variant={stage.status === 'active' ? 'success' : 'neutral'}>
                        {stage.status === 'active' ? 'نشطة' : 'معطلة'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {stage.nameEn} • الترتيب: {stage.displayOrder}
                      {stage.description && ` • ${stage.description}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasPermission('grades.create') && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenCreateGrade(stage.id)}
                      className="text-xs gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      إضافة صف للمرحلة
                    </Button>
                  )}

                  {hasPermission('academic_stages.edit') && (
                    <button
                      onClick={() => handleOpenEditStage(stage)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="تعديل المرحلة"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  {hasPermission('academic_stages.delete') && (
                    <button
                      onClick={() => handleDeleteStage(stage)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="حذف المرحلة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Grades Grid inside this Stage */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
                  الصفوف الدراسية التابعة ({stageGrades.length} صف):
                </h4>

                {stageGrades.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stageGrades.map((grade) => (
                      <div
                        key={grade.id}
                        className="p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:border-blue-500/40 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                            {grade.displayOrder}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-sm">
                              {grade.nameAr}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {grade.gradeCode}
                              </span>
                              <span className="text-[10px] text-gray-400">{grade.nameEn}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {hasPermission('grades.edit') && (
                            <button
                              onClick={() => handleOpenEditGrade(grade)}
                              className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                              title="تعديل الصف"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasPermission('grades.delete') && (
                            <button
                              onClick={() => handleDeleteGrade(grade)}
                              className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950"
                              title="حذف الصف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
                    لا توجد صفوف مضافة في هذه المرحلة بعد. انقر على "إضافة صف للمرحلة" للبدء.
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {filteredStages.length === 0 && (
          <Card className="py-12 text-center">
            <Layers className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base">لا توجد مراحل دراسية</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
              قم بإنشاء المراحل الدراسية للمدرسة (مثل الابتدائي، المتوسط، الثانوي) ثم ربط الصفوف بها.
            </p>
          </Card>
        )}
      </div>

      {/* CREATE / EDIT STAGE MODAL */}
      <Modal
        isOpen={isCreateStageModalOpen || isEditStageModalOpen}
        onClose={() => {
          setIsCreateStageModalOpen(false);
          setIsEditStageModalOpen(false);
          setSelectedStage(null);
        }}
        title={selectedStage ? 'تعديل المرحلة الدراسية' : 'إنشاء مرحلة دراسية جديدة'}
        maxWidth="md"
      >
        <form onSubmit={handleStageSubmit} className="space-y-4">
          {/* Branch selector if in all branches mode */}
          {isAllBranches && !selectedStage && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                الفرع المدرسي *
              </label>
              <select
                value={stageForm.branchId}
                onChange={(e) => setStageForm({ ...stageForm, branchId: e.target.value })}
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
              اسم المرحلة بالعربية *
            </label>
            <input
              type="text"
              required
              value={stageForm.nameAr}
              onChange={(e) => setStageForm({ ...stageForm, nameAr: e.target.value })}
              placeholder="مثال: المرحلة الابتدائية"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              اسم المرحلة بالإنجليزية *
            </label>
            <input
              type="text"
              required
              value={stageForm.nameEn}
              onChange={(e) => setStageForm({ ...stageForm, nameEn: e.target.value })}
              placeholder="e.g. Primary Stage"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              ترتيب العرض (Sequence)
            </label>
            <input
              type="number"
              min="1"
              value={stageForm.displayOrder}
              onChange={(e) => setStageForm({ ...stageForm, displayOrder: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              وصف المرحلة
            </label>
            <textarea
              rows={3}
              value={stageForm.description}
              onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
              placeholder="تفاصيل ونطاق المرحلة التعليمية..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreateStageModalOpen(false);
                setIsEditStageModalOpen(false);
                setSelectedStage(null);
              }}
            >
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جارٍ الحفظ...' : selectedStage ? 'حفظ التعديلات' : 'إنشاء المرحلة'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE / EDIT GRADE MODAL */}
      <Modal
        isOpen={isCreateGradeModalOpen || isEditGradeModalOpen}
        onClose={() => {
          setIsCreateGradeModalOpen(false);
          setIsEditGradeModalOpen(false);
          setSelectedGrade(null);
        }}
        title={selectedGrade ? 'تعديل الصف الدراسي' : 'إضافة صف دراسي جديد'}
        maxWidth="md"
      >
        <form onSubmit={handleGradeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              المرحلة التابع لها *
            </label>
            <select
              required
              value={gradeForm.stageId}
              onChange={(e) => {
                const selected = stages.find((s) => s.id === e.target.value);
                setGradeForm({
                  ...gradeForm,
                  stageId: e.target.value,
                  branchId: selected?.branchId || gradeForm.branchId,
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

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              اسم الصف بالعربية *
            </label>
            <input
              type="text"
              required
              value={gradeForm.nameAr}
              onChange={(e) => setGradeForm({ ...gradeForm, nameAr: e.target.value })}
              placeholder="مثال: الصف الأول الابتدائي"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              اسم الصف بالإنجليزية *
            </label>
            <input
              type="text"
              required
              value={gradeForm.nameEn}
              onChange={(e) => setGradeForm({ ...gradeForm, nameEn: e.target.value })}
              placeholder="e.g. Grade 1 (Primary)"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                كود الصف *
              </label>
              <input
                type="text"
                required
                value={gradeForm.gradeCode}
                onChange={(e) => setGradeForm({ ...gradeForm, gradeCode: e.target.value.toUpperCase() })}
                placeholder="PRI-G01"
                className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                الترتيب
              </label>
              <input
                type="number"
                min="1"
                value={gradeForm.displayOrder}
                onChange={(e) => setGradeForm({ ...gradeForm, displayOrder: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreateGradeModalOpen(false);
                setIsEditGradeModalOpen(false);
                setSelectedGrade(null);
              }}
            >
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جارٍ الحفظ...' : selectedGrade ? 'حفظ التعديلات' : 'إضافة الصف'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
