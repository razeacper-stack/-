import React, { useState } from 'react';
import { TeacherDetail } from '../../types/teacher';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useTeachers } from '../../context/TeacherContext';
import { useAcademic } from '../../context/AcademicContext';
import {
  BookOpen,
  Plus,
  Trash2,
  AlertCircle,
  Building2,
  CheckCircle2,
} from 'lucide-react';

interface TeacherSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherDetail | null;
  onSuccess?: () => void;
}

export const TeacherSubjectModal: React.FC<TeacherSubjectModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onSuccess,
}) => {
  const { assignSubject, removeSubject } = useTeachers();
  const { subjects } = useAcademic();

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [showOtherBranches, setShowOtherBranches] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !teacher) return null;

  // Filter subjects belonging strictly to the teacher's branch
  const branchSubjects = subjects.filter((s) => s.branchId === teacher.branchId && s.status === 'active');
  const alreadyAssignedIds = new Set(teacher.subjects.map((s) => s.subjectId));
  const availableSubjects = branchSubjects.filter((s) => !alreadyAssignedIds.has(s.id));

  // Cross-branch subjects for rejection testing
  const otherBranchSubjects = subjects.filter((s) => s.branchId !== teacher.branchId && s.status === 'active');
  const selectableSubjects = showOtherBranches ? [...availableSubjects, ...otherBranchSubjects] : availableSubjects;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      await assignSubject(teacher.id, selectedSubjectId, isPrimary);
      setSelectedSubjectId('');
      setIsPrimary(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل إسناد المادة الدراسية.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async (subjectId: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء إسناد هذه المادة الدراسية؟')) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      await removeSubject(teacher.id, subjectId);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل إلغاء إسناد المادة.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              إسناد المواد الدراسية للمعلم
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {teacher.fullNameAr} ({teacher.teacherNumber})
            </div>
          </div>
        </div>
      }
      subtitle={
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-1">
          <Building2 className="w-3.5 h-3.5 text-blue-500" />
          <span>فرع: {teacher.branchNameAr || teacher.branchId}</span>
        </div>
      }
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Assign New Subject Form */}
        <form onSubmit={handleAssign} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              إسناد مادة جديدة من مناهج الفرع
            </span>
            <button
              type="button"
              onClick={() => setShowOtherBranches(!showOtherBranches)}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {showOtherBranches ? 'إخفاء مواد الفروع الأخرى' : '⚡ تجربة رفض الربط: إظهار مواد من فروع أخرى'}
            </button>
          </div>

          {selectableSubjects.length > 0 ? (
            <div className="space-y-2.5">
              <div>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs cursor-pointer font-medium"
                >
                  <option value="">-- اختر مادة دراسية للإسناد --</option>
                  {selectableSubjects.map((s) => {
                    const isOtherBranch = s.branchId !== teacher.branchId;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.nameAr} ({s.subjectCode}) {isOtherBranch ? `⚠️ [فرع آخر: ${s.branchId} - سيتم الرفض بموجب الأمان]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>تعيين كمادة تخصص رئيسية للمعلم</span>
                </label>
                <Button
                  size="sm"
                  variant="primary"
                  type="submit"
                  disabled={!selectedSubjectId || isProcessing}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  {isProcessing ? 'جارٍ الإسناد...' : 'إسناد المادة'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              جميع المواد الدراسية المعتمدة في هذا الفرع مسندة بالفعل لهذا المعلم.
            </p>
          )}
        </form>

        {/* Currently Assigned Subjects */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            المواد المسندة حالياً ({teacher.subjects?.length || 0})
          </span>

          {teacher.subjects && teacher.subjects.length > 0 ? (
            <div className="space-y-2">
              {teacher.subjects.map((sbj) => (
                <div
                  key={sbj.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{sbj.nameAr}</span>
                        {sbj.isPrimarySubject && (
                          <Badge variant="success" size="sm">رئيسية</Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {sbj.subjectCode} • {sbj.nameEn}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(sbj.subjectId)}
                    disabled={isProcessing}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="إلغاء الإسناد"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500">لا توجد مواد دراسية مسندة لهذا المعلم بعد</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};
