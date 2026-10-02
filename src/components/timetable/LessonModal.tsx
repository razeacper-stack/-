import React, { useState, useEffect, useMemo } from 'react';
import {
  DayOfWeek,
  PopulatedTimetableEntry,
  CreateTimetableEntryDTO,
  UpdateTimetableEntryDTO,
} from '../../types/timetable';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useTimetable } from '../../context/TimetableContext';
import { useAcademic } from '../../context/AcademicContext';
import { useTeachers } from '../../context/TeacherContext';
import {
  CalendarDays,
  Clock,
  BookOpen,
  UserCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  School,
  Layers,
} from 'lucide-react';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  academicYearId: string;
  defaultClassId?: string;
  defaultDay?: DayOfWeek;
  defaultPeriodId?: string;
  editingEntry?: PopulatedTimetableEntry | null;
  onSuccess?: () => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  isOpen,
  onClose,
  branchId,
  academicYearId,
  defaultClassId,
  defaultDay,
  defaultPeriodId,
  editingEntry,
  onSuccess,
}) => {
  const { periods, rooms, activeDays, createEntry, updateEntry, detectConflict } = useTimetable();
  const { classes, subjects, grades, gradeSubjects } = useAcademic();
  const { teachers } = useTeachers();

  const isEditing = Boolean(editingEntry);

  // Form State
  const [selectedClassId, setSelectedClassId] = useState<string>(
    editingEntry?.classId || defaultClassId || ''
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    editingEntry?.subjectId || ''
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    editingEntry?.teacherId || ''
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    editingEntry?.roomId || ''
  );
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    editingEntry ? editingEntry.dayOfWeek : defaultDay !== undefined ? defaultDay : (activeDays[0] ?? 0)
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    editingEntry?.periodId || defaultPeriodId || ''
  );
  const [notes, setNotes] = useState<string>(editingEntry?.notes || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset or initialize state when opening modal
  useEffect(() => {
    if (isOpen) {
      if (editingEntry) {
        setSelectedClassId(editingEntry.classId);
        setSelectedSubjectId(editingEntry.subjectId);
        setSelectedTeacherId(editingEntry.teacherId);
        setSelectedRoomId(editingEntry.roomId || '');
        setSelectedDay(editingEntry.dayOfWeek);
        setSelectedPeriodId(editingEntry.periodId);
        setNotes(editingEntry.notes || '');
      } else {
        setSelectedClassId(defaultClassId || '');
        setSelectedSubjectId('');
        setSelectedTeacherId('');
        setSelectedRoomId('');
        setSelectedDay(defaultDay !== undefined ? defaultDay : (activeDays[0] ?? 0));
        setSelectedPeriodId(defaultPeriodId || (periods.find((p) => !p.isBreak)?.id || ''));
        setNotes('');
      }
      setErrorMessage(null);
    }
  }, [isOpen, editingEntry, defaultClassId, defaultDay, defaultPeriodId, activeDays, periods]);

  // Filter available classes strictly for the current branch & academic year
  const branchClasses = useMemo(() => {
    return classes.filter(
      (c) => c.branchId === branchId && c.academicYearId === academicYearId && c.status === 'active'
    );
  }, [classes, branchId, academicYearId]);

  // Selected class entity
  const currentClass = useMemo(() => {
    return branchClasses.find((c) => c.id === selectedClassId);
  }, [branchClasses, selectedClassId]);

  // Compatible subjects for selected class grade
  const availableSubjects = useMemo(() => {
    if (!currentClass) return [];
    const classGradeSubjects = gradeSubjects.filter(
      (gs) => gs.gradeId === currentClass.gradeId && gs.branchId === branchId
    );
    const subjectIds = new Set(classGradeSubjects.map((gs) => gs.subjectId));
    // If grade subjects exist, prioritize them; otherwise show all active branch subjects
    const filtered = subjects.filter(
      (s) => s.branchId === branchId && s.status === 'active' && (subjectIds.size === 0 || subjectIds.has(s.id))
    );
    return filtered;
  }, [currentClass, gradeSubjects, subjects, branchId]);

  // Eligible teachers for the selected subject (Using PHASE 6 teacher_subjects relationship)
  const eligibleTeachers = useMemo(() => {
    if (!selectedSubjectId) return [];
    return teachers.filter((t) => {
      if (t.branchId !== branchId) return false;
      if (t.employmentStatus === 'ARCHIVED' || t.employmentStatus === 'INACTIVE' || t.employmentStatus === 'SUSPENDED') {
        return false;
      }
      // Check if teacher has this subject assigned in their profile
      return t.subjects && t.subjects.some((s) => s.subjectId === selectedSubjectId);
    });
  }, [teachers, branchId, selectedSubjectId]);

  // Active non-break periods
  const selectablePeriods = useMemo(() => {
    return periods.filter((p) => p.branchId === branchId && p.status === 'active');
  }, [periods, branchId]);

  // Active rooms
  const branchRooms = useMemo(() => {
    return rooms.filter((r) => r.branchId === branchId && r.status === 'active');
  }, [rooms, branchId]);

  // Live conflict detection preview
  const liveConflict = useMemo(() => {
    if (!selectedClassId || !selectedSubjectId || !selectedTeacherId || !selectedPeriodId) {
      return null;
    }
    return detectConflict(
      {
        branchId,
        academicYearId,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        teacherId: selectedTeacherId,
        roomId: selectedRoomId || undefined,
        dayOfWeek: selectedDay,
        periodId: selectedPeriodId,
      },
      editingEntry?.id
    );
  }, [
    selectedClassId,
    selectedSubjectId,
    selectedTeacherId,
    selectedRoomId,
    selectedDay,
    selectedPeriodId,
    branchId,
    academicYearId,
    detectConflict,
    editingEntry,
  ]);

  const dayNames: Record<DayOfWeek, string> = {
    0: 'الأحد (Sunday)',
    1: 'الاثنين (Monday)',
    2: 'الثلاثاء (Tuesday)',
    3: 'الأربعاء (Wednesday)',
    4: 'الخميس (Thursday)',
    5: 'الجمعة (Friday)',
    6: 'السبت (Saturday)',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedClassId) {
      setErrorMessage('يرجى اختيار الفصل الدراسي.');
      return;
    }
    if (!selectedSubjectId) {
      setErrorMessage('يرجى اختيار المادة الدراسية.');
      return;
    }
    if (!selectedTeacherId) {
      setErrorMessage('يرجى اختيار معلم المادة.');
      return;
    }
    if (!selectedPeriodId) {
      setErrorMessage('يرجى تحديد الحصة / الفترة الزمنية.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditing && editingEntry) {
        const updateDto: UpdateTimetableEntryDTO = {
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          teacherId: selectedTeacherId,
          roomId: selectedRoomId || undefined,
          dayOfWeek: selectedDay,
          periodId: selectedPeriodId,
          notes: notes.trim() || undefined,
        };
        await updateEntry(editingEntry.id, updateDto);
      } else {
        const createDto: CreateTimetableEntryDTO = {
          branchId,
          academicYearId,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          teacherId: selectedTeacherId,
          roomId: selectedRoomId || undefined,
          dayOfWeek: selectedDay,
          periodId: selectedPeriodId,
          status: 'DRAFT',
          notes: notes.trim() || undefined,
        };
        await createEntry(createDto);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في حفظ الحصة الدراسية.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {isEditing ? 'تعديل الحصة الدراسية المجدولة' : 'تسكين حصة جديدة في الجدول'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              ربط الفصل والمادة بالمعلم المؤهل والقاعة والفترة المعتمدة
            </div>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error / Conflict Alert Banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Conflict Warning Warning */}
        {liveConflict && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">تعارض في المواعيد مكتشف تلقائياً:</span>
              <span>{liveConflict.messageAr}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* Class Selection */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
              الفصل الدراسي *
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSubjectId('');
                setSelectedTeacherId('');
              }}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer"
            >
              <option value="">-- اختر الفصل الدراسي --</option>
              {branchClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr} ({c.nameEn})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selection */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
              المادة الدراسية *
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedTeacherId('');
              }}
              required
              disabled={!selectedClassId}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer disabled:opacity-50"
            >
              <option value="">-- اختر المادة --</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameAr} ({s.subjectCode})
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Selection (Filtered to eligible teachers) */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                المعلم المؤهل للمادة *
              </label>
              {selectedSubjectId && (
                <span className="text-[10px] text-slate-400">
                  {eligibleTeachers.length} معلماً مؤهلاً بالفرع
                </span>
              )}
            </div>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              required
              disabled={!selectedSubjectId}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer disabled:opacity-50"
            >
              <option value="">-- اختر المعلم المصرح له بتدريس المادة --</option>
              {eligibleTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullNameAr} ({t.teacherNumber}) - {t.specialization}
                </option>
              ))}
            </select>
            {selectedSubjectId && eligibleTeachers.length === 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                تنبيه: لا يوجد معلمون مسند لهم تخصص هذه المادة في فرع المدرسة. يرجى إسناد المادة لمعلم من شاشة هيئة التدريس أولاً.
              </p>
            )}
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
              اليوم الدراسي *
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value) as DayOfWeek)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer"
            >
              {activeDays.map((day) => (
                <option key={day} value={day}>
                  {dayNames[day]}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selection */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
              الحصة / الفترة الزمنية *
            </label>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer"
            >
              <option value="">-- اختر الحصة --</option>
              {selectablePeriods.map((p) => (
                <option key={p.id} value={p.id} disabled={p.isBreak}>
                  {p.nameAr} ({p.startTime} - {p.endTime}) {p.isBreak ? '☕ [استراحة - محظور]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Room Selection (Optional) */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
              القاعة الدراسية أو المعمل (اختياري)
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer"
            >
              <option value="">-- القاعة الافتراضية للفصل / بدون قاعة خاصة --</option>
              {branchRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameAr} [{r.roomCode}] - سعة: {r.capacity} طالب
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
              ملاحظات وتوجيهات إضافية
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: إحضار الأدوات الهندسية / حصة مخصصة في المعمل"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            إلغاء
          </Button>

          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={isSubmitting || Boolean(liveConflict)}
            leftIcon={<CalendarDays className="w-4 h-4" />}
          >
            {isSubmitting
              ? 'جارٍ الحفظ والتحقق...'
              : isEditing
              ? 'تحديث الحصة المجدولة'
              : 'تسكين الحصة في الجدول'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
