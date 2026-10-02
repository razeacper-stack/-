import React, { useState } from 'react';
import { TeacherDetail, TeacherClassRole } from '../../types/teacher';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useTeachers } from '../../context/TeacherContext';
import { useAcademic } from '../../context/AcademicContext';
import {
  School,
  Plus,
  Trash2,
  AlertCircle,
  Building2,
  Calendar,
} from 'lucide-react';

interface TeacherClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherDetail | null;
  onSuccess?: () => void;
}

export const TeacherClassModal: React.FC<TeacherClassModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onSuccess,
}) => {
  const { assignClass, removeClass } = useTeachers();
  const { classes, years, grades } = useAcademic();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedRole, setSelectedRole] = useState<TeacherClassRole>('PRIMARY_TEACHER');
  const [showOtherBranches, setShowOtherBranches] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !teacher) return null;

  // Branch isolation filters
  const branchClasses = classes.filter((c) => c.branchId === teacher.branchId && c.status === 'active');
  const otherBranchClasses = classes.filter((c) => c.branchId !== teacher.branchId && c.status === 'active');
  const selectableClasses = showOtherBranches ? [...branchClasses, ...otherBranchClasses] : branchClasses;

  const branchYears = years.filter((y) => y.branchId === teacher.branchId && y.status === 'ACTIVE');
  const activeYear = branchYears.find((y) => y.isCurrent) || branchYears[0];

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;

    const yearToUse = selectedYearId || activeYear?.id;
    if (!yearToUse) {
      setErrorMessage('يرجى تحديد السنة الدراسية المعتمدة.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      await assignClass(teacher.id, selectedClassId, yearToUse, selectedRole);
      setSelectedClassId('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تسكين المعلم في الفصل.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async (teacherClassId: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء تسكين المعلم في هذا الفصل؟')) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      await removeClass(teacherClassId);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل إلغاء تسكين الفصل.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleBadge = (role: TeacherClassRole) => {
    switch (role) {
      case 'PRIMARY_TEACHER':
        return <Badge variant="primary" size="sm">معلم أساسي</Badge>;
      case 'HOMEROOM_TEACHER':
        return <Badge variant="success" size="sm">رائد فصل</Badge>;
      case 'SUBJECT_TEACHER':
        return <Badge variant="info" size="sm">معلم مادة</Badge>;
      case 'ASSISTANT_TEACHER':
        return <Badge variant="neutral" size="sm">معلم مساعد</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              تسكين المعلم في الفصول والشُعب
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

        {/* Assign Form */}
        <form onSubmit={handleAssign} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              تسكين في فصل جديد بالفرع
            </span>
            <button
              type="button"
              onClick={() => setShowOtherBranches(!showOtherBranches)}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {showOtherBranches ? 'إخفاء فصول الفروع الأخرى' : '⚡ تجربة رفض التسكين: إظهار فصول من فروع أخرى'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                الفصل الدراسي *
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs cursor-pointer font-medium"
              >
                <option value="">-- اختر الفصل الدراسي --</option>
                {selectableClasses.map((c) => {
                  const grd = grades.find((g) => g.id === c.gradeId);
                  const isOther = c.branchId !== teacher.branchId;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.nameAr} {grd ? `(${grd.nameAr})` : ''} {isOther ? `⚠️ [فرع آخر: ${c.branchId} - سيتم الرفض]` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                الدور والمسؤولية *
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as TeacherClassRole)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs cursor-pointer font-medium"
              >
                <option value="PRIMARY_TEACHER">معلم أساسي (Primary)</option>
                <option value="HOMEROOM_TEACHER">رائد فصل (Homeroom)</option>
                <option value="SUBJECT_TEACHER">معلم مادة (Subject Teacher)</option>
                <option value="ASSISTANT_TEACHER">معلم مساعد (Assistant)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              العام الدراسي: {activeYear?.nameAr || 'العام الحالي'}
            </span>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              disabled={!selectedClassId || isProcessing}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              {isProcessing ? 'جارٍ التسكين...' : 'تأكيد التسكين'}
            </Button>
          </div>
        </form>

        {/* Currently Assigned Classes */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            الفصول المسكن بها حالياً ({teacher.classes?.length || 0})
          </span>

          {teacher.classes && teacher.classes.length > 0 ? (
            <div className="space-y-2">
              {teacher.classes.map((tc) => (
                <div
                  key={tc.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <School className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{tc.classNameAr}</span>
                        {getRoleBadge(tc.role)}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {tc.gradeNameAr} • {tc.academicYearNameAr || 'العام الحالي'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(tc.id)}
                    disabled={isProcessing}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="إلغاء التسكين"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <School className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500">لم يتم تسكين المعلم في أي فصل دراسي بعد</p>
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
