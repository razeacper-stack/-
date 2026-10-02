import React, { useState, useEffect } from 'react';
import { StudentDetail } from '../../types/student';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useStudents } from '../../context/StudentContext';
import { useAcademic } from '../../context/AcademicContext';
import { ArrowRightLeft, AlertCircle, School, Check } from 'lucide-react';

interface StudentTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentDetail | null;
}

export const StudentTransferModal: React.FC<StudentTransferModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const { transferClass } = useStudents();
  const { stages, grades, classes } = useAcademic();

  const [selectedStageId, setSelectedStageId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (student && student.activeEnrollment) {
      setSelectedStageId(student.activeEnrollment.stageId || '');
      setSelectedGradeId(student.activeEnrollment.gradeId || '');
      setSelectedClassId('');
      setTransferReason('');
      setErrorMessage('');
    }
  }, [student, isOpen]);

  if (!student) return null;

  const branchId = student.branchId;
  const availableStages = stages.filter((s) => s.branchId === branchId && s.status === 'active');
  const availableGrades = grades.filter((g) => g.branchId === branchId && g.stageId === selectedStageId && g.status === 'active');
  const availableClasses = classes.filter((c) => c.branchId === branchId && c.gradeId === selectedGradeId && c.status === 'active');

  const targetClass = classes.find((c) => c.id === selectedClassId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      setErrorMessage('يرجى اختيار الفصل الدراسي البديل.');
      return;
    }
    if (student.activeEnrollment && student.activeEnrollment.classId === selectedClassId) {
      setErrorMessage('الطالب مقيد بالفعل في نفس هذا الفصل حالياً.');
      return;
    }
    if (!transferReason.trim()) {
      setErrorMessage('سبب النقل إلزامي لتوثيق الإجراء في سجل القيد.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await transferClass(student.id, selectedClassId, transferReason.trim());
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء نقل الطالب للفصل الجديد');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              نقل الطالب إلى فصل / شعبة أخرى
            </h3>
            <p className="text-xs text-slate-500">
              تغيير الفصل مع توثيق القيد السابق في سجل التحويلات
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Current Class Snapshot */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
          <span className="text-slate-400 block mb-1">الفصل الحالي المسجل به الطالب:</span>
          <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>{student.fullNameAr}</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400">
              {student.currentClassNameAr || 'فصل غير محدد'} ({student.currentClassCode})
            </span>
          </div>
        </div>

        {/* Target Stage & Grade Selection */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">المرحلة الدراسية</label>
            <select
              value={selectedStageId}
              onChange={(e) => {
                setSelectedStageId(e.target.value);
                setSelectedGradeId('');
                setSelectedClassId('');
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">-- اختر المرحلة --</option>
              {availableStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameAr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">الصف الدراسي</label>
            <select
              value={selectedGradeId}
              disabled={!selectedStageId}
              onChange={(e) => {
                setSelectedGradeId(e.target.value);
                setSelectedClassId('');
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
            >
              <option value="">-- اختر الصف --</option>
              {availableGrades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nameAr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Target Class Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            اختر الفصل الدراسي المستهدف *
          </label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {availableClasses.map((cls) => {
              const isSelected = selectedClassId === cls.id;
              const isCurrent = student.activeEnrollment?.classId === cls.id;
              return (
                <div
                  key={cls.id}
                  onClick={() => !isCurrent && setSelectedClassId(cls.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'border-slate-200 bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                      : isSelected
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 cursor-pointer'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 cursor-pointer bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <School className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-xs font-bold block">{cls.nameAr}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{cls.classCode} • الغرفة: {cls.roomNumber || '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">
                      السعة: {cls.capacity}
                    </span>
                    {isCurrent && <Badge variant="neutral">الفصل الحالي</Badge>}
                    {isSelected && <Badge variant="primary">محدد للنقل</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transfer Reason */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            سبب النقل (إلزامي للتوثيق الإداري) *
          </label>
          <textarea
            required
            rows={2}
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            placeholder="مثال: رغبة ولي الأمر / إعادة توزيع الطلاب لتوازن الشعب / الترقية للصف التالي"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={!selectedClassId || !transferReason.trim()}
          >
            تأكيد النقل الآن
          </Button>
        </div>
      </form>
    </Modal>
  );
};
