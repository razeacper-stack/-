import React, { useState, useMemo } from 'react';
import {
  Link2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  Layers,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { GradeSubject } from '../../types/academic';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const GradeSubjectsTab: React.FC = () => {
  const {
    grades,
    subjects,
    gradeSubjects,
    stages,
    assignSubject,
    updateGradeSubject,
    removeGradeSubject,
  } = useAcademic();

  const { activeBranchId, branches } = useBranch();
  const { hasPermission } = useAuth();

  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<GradeSubject | null>(null);

  // Forms
  const [assignForm, setAssignForm] = useState({
    branchId: activeBranchId && activeBranchId !== 'all' ? activeBranchId : 'branch-riyadh',
    gradeId: '',
    subjectId: '',
    weeklyPeriods: 5,
    creditHours: 3,
  });

  const [editForm, setEditForm] = useState({
    weeklyPeriods: 5,
    creditHours: 3,
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group by grade
  const gradeLinkGroups = useMemo(() => {
    const list = selectedGradeFilter === 'ALL'
      ? grades
      : grades.filter((g) => g.id === selectedGradeFilter);

    return list.map((grade) => {
      const stage = stages.find((s) => s.id === grade.stageId);
      const links = gradeSubjects.filter((l) => l.gradeId === grade.id);

      const matchingLinks = links.filter((link) => {
        const subject = subjects.find((s) => s.id === link.subjectId);
        if (!searchTerm) return true;
        return (
          subject?.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subject?.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subject?.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          grade.nameAr.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

      const totalWeeklyPeriods = links.reduce((sum, l) => sum + l.weeklyPeriods, 0);

      return {
        grade,
        stage,
        links: matchingLinks,
        allLinksCount: links.length,
        totalWeeklyPeriods,
      };
    });
  }, [grades, stages, gradeSubjects, subjects, selectedGradeFilter, searchTerm]);

  const handleOpenAssign = (gradeId?: string) => {
    const targetGrade = gradeId || grades[0]?.id || '';
    const gradeObj = grades.find((g) => g.id === targetGrade);
    const targetBranch = gradeObj?.branchId || activeBranchId || 'branch-riyadh';

    setAssignForm({
      branchId: targetBranch,
      gradeId: targetGrade,
      subjectId: subjects[0]?.id || '',
      weeklyPeriods: 5,
      creditHours: 3,
    });
    setFeedback(null);
    setIsAssignModalOpen(true);
  };

  const handleOpenEdit = (link: GradeSubject) => {
    setSelectedLink(link);
    setEditForm({
      weeklyPeriods: link.weeklyPeriods,
      creditHours: link.creditHours || 3,
    });
    setFeedback(null);
    setIsEditModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (!assignForm.gradeId || !assignForm.subjectId) {
        throw new Error('يرجى اختيار الصف والمادة.');
      }
      if (assignForm.weeklyPeriods <= 0) {
        throw new Error('نصاب الحصص الأسبوعية يجب أن يكون أكبر من الصفر.');
      }

      await assignSubject(assignForm);
      setFeedback({ type: 'success', message: 'تم إسناد المادة إلى الصف بنجاح!' });
      setIsAssignModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'حدث خطأ أثناء إسناد المادة' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLink) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (editForm.weeklyPeriods <= 0) {
        throw new Error('نصاب الحصص الأسبوعية يجب أن يكون أكبر من الصفر.');
      }

      await updateGradeSubject(selectedLink.id, editForm);
      setFeedback({ type: 'success', message: 'تم تحديث خطة المقرر بنجاح!' });
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'حدث خطأ أثناء التحديث' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (link: GradeSubject, subjectName: string, gradeName: string) => {
    if (!window.confirm(`هل أنت متأكد من فك ارتباط مادة "${subjectName}" عن "${gradeName}"؟`)) return;
    try {
      await removeGradeSubject(link.id);
      setFeedback({ type: 'success', message: `تم إلغاء مقرر "${subjectName}" من خطة الصف.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'تعذر إلغاء المقرر' });
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

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في خطط المقررات والمواد المسندة..."
              className="w-full pr-9 pl-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="ALL">جميع الصفوف الدراسية</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nameAr} ({g.gradeCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasPermission('grade_subjects.create') && grades.length > 0 && subjects.length > 0 && (
          <Button variant="primary" onClick={() => handleOpenAssign()} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            ربط مادة بصف دراسي
          </Button>
        )}
      </div>

      {/* Grade Subject Plan Cards */}
      <div className="space-y-6">
        {gradeLinkGroups.map(({ grade, stage, links, allLinksCount, totalWeeklyPeriods }) => {
          if (selectedGradeFilter !== 'ALL' && grade.id !== selectedGradeFilter) return null;

          return (
            <Card key={grade.id} className="p-6 transition-all border border-gray-200 dark:border-gray-800">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{grade.nameAr}</h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold">
                        {grade.gradeCode}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {stage?.nameAr || 'المرحلة الدراسية'} • إجمالي الحصص الأسبوعية المقررة: <span className="font-bold text-blue-600 dark:text-blue-400">{totalWeeklyPeriods} حصة</span>
                    </p>
                  </div>
                </div>

                {hasPermission('grade_subjects.create') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAssign(grade.id)}
                    className="gap-1.5 text-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إسناد مقرر للصف
                  </Button>
                )}
              </div>

              {/* Subject Badges / Grid */}
              <div className="mt-4">
                {links.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {links.map((link) => {
                      const subject = subjects.find((s) => s.id === link.subjectId);
                      if (!subject) return null;

                      return (
                        <div
                          key={link.id}
                          className="p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:border-blue-500/40 transition-all flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-sm">
                              {subject.nameAr}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-mono text-[10px] text-gray-400">{subject.subjectCode}</span>
                              <span>•</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {link.weeklyPeriods} حصص/أسبوع
                              </span>
                              {link.creditHours && (
                                <>
                                  <span>•</span>
                                  <span>{link.creditHours} ساعات</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {hasPermission('grade_subjects.edit') && (
                              <button
                                onClick={() => handleOpenEdit(link)}
                                className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                                title="تعديل الحصص"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {hasPermission('grade_subjects.delete') && (
                              <button
                                onClick={() => handleRemove(link, subject.nameAr, grade.nameAr)}
                                className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950"
                                title="إلغاء المقرر"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
                    لم يتم تخصيص مواد لهذا الصف بعد. اضغط على "إسناد مقرر للصف" لإعداد الخطة الدراسية.
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {gradeLinkGroups.length === 0 && (
          <Card className="py-12 text-center">
            <Link2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base">لا توجد صفوف دراسية</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
              قم بإنشاء الصفوف والمواد الدراسية أولاً لتتمكن من بناء خطط المناهج المدرسية.
            </p>
          </Card>
        )}
      </div>

      {/* ASSIGN SUBJECT MODAL */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="ربط مادة دراسية بصف دراسي"
        maxWidth="md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              الصف الدراسي المستهدف *
            </label>
            <select
              required
              value={assignForm.gradeId}
              onChange={(e) => {
                const g = grades.find((gr) => gr.id === e.target.value);
                setAssignForm({
                  ...assignForm,
                  gradeId: e.target.value,
                  branchId: g?.branchId || assignForm.branchId,
                });
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nameAr} ({g.gradeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              المادة الدراسية المقررة *
            </label>
            <select
              required
              value={assignForm.subjectId}
              onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              {subjects
                .filter((s) => s.branchId === assignForm.branchId && s.status === 'active')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameAr} ({s.subjectCode})
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              يتم استعراض المواد النشطة التابعة لنفس فرع الصف المختار فقط لمنع التداخل بين الفروع.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                نصاب الحصص الأسبوعية *
              </label>
              <input
                type="number"
                min="1"
                max="25"
                required
                value={assignForm.weeklyPeriods}
                onChange={(e) => setAssignForm({ ...assignForm, weeklyPeriods: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                الساعات المعتمدة (اختياري)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={assignForm.creditHours}
                onChange={(e) => setAssignForm({ ...assignForm, creditHours: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جارٍ الحفظ...' : 'إسناد المادة'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT LINK MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="تعديل نصاب الحصص المقررة"
        maxWidth="sm"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              نصاب الحصص الأسبوعية *
            </label>
            <input
              type="number"
              min="1"
              max="25"
              required
              value={editForm.weeklyPeriods}
              onChange={(e) => setEditForm({ ...editForm, weeklyPeriods: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              الساعات المعتمدة
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={editForm.creditHours}
              onChange={(e) => setEditForm({ ...editForm, creditHours: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التعديل'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
