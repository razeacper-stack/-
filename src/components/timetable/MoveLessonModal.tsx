import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { PopulatedTimetableEntry, DayOfWeek, TimetableConflict } from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import { MoveRight, AlertCircle, CalendarDays, Clock, Building2, CheckCircle2 } from 'lucide-react';

interface MoveLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: PopulatedTimetableEntry | null;
  onSuccess?: () => void;
}

const DAYS_MAP: Record<DayOfWeek, { ar: string; en: string }> = {
  0: { ar: 'الأحد', en: 'Sunday' },
  1: { ar: 'الإثنين', en: 'Monday' },
  2: { ar: 'الثلاثاء', en: 'Tuesday' },
  3: { ar: 'الأربعاء', en: 'Wednesday' },
  4: { ar: 'الخميس', en: 'Thursday' },
  5: { ar: 'الجمعة', en: 'Friday' },
  6: { ar: 'السبت', en: 'Saturday' },
};

export const MoveLessonModal: React.FC<MoveLessonModalProps> = ({
  isOpen,
  onClose,
  entry,
  onSuccess,
}) => {
  const { periods, rooms, activeDays, moveEntry, detectConflict } = useTimetable();

  const [targetDay, setTargetDay] = useState<DayOfWeek>(entry ? entry.dayOfWeek : 0);
  const [targetPeriodId, setTargetPeriodId] = useState<string>(entry ? entry.periodId : '');
  const [targetRoomId, setTargetRoomId] = useState<string>(entry?.roomId || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when entry changes
  React.useEffect(() => {
    if (entry) {
      setTargetDay(entry.dayOfWeek);
      setTargetPeriodId(entry.periodId);
      setTargetRoomId(entry.roomId || '');
      setErrorMessage(null);
    }
  }, [entry]);

  if (!isOpen || !entry) return null;

  // Real-time pre-check conflict for candidate destination
  const activePeriods = periods.filter((p) => p.branchId === entry.branchId && p.status === 'active');
  const branchRooms = rooms.filter((r) => r.branchId === entry.branchId && r.status === 'active');

  const selectedPeriod = activePeriods.find((p) => p.id === targetPeriodId);

  const previewConflict: TimetableConflict | null = (() => {
    if (!targetPeriodId) return null;
    return detectConflict(
      {
        id: entry.id,
        branchId: entry.branchId,
        academicYearId: entry.academicYearId,
        classId: entry.classId,
        subjectId: entry.subjectId,
        teacherId: entry.teacherId,
        roomId: targetRoomId || undefined,
        dayOfWeek: targetDay,
        periodId: targetPeriodId,
      },
      entry.id
    );
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!targetPeriodId) {
      setErrorMessage('يرجى تحديد الفترة الدراسية المستهدفة.');
      return;
    }

    if (targetDay === entry.dayOfWeek && targetPeriodId === entry.periodId && (targetRoomId || '') === (entry.roomId || '')) {
      setErrorMessage('لم تقم بتغيير موعد الحصة أو القاعة.');
      return;
    }

    if (previewConflict) {
      setErrorMessage(`لا يمكن نقل الحصة لوجود تعارض: ${previewConflict.messageAr}`);
      return;
    }

    try {
      setIsSubmitting(true);
      await moveEntry(entry.id, {
        dayOfWeek: targetDay,
        periodId: targetPeriodId,
        roomId: targetRoomId || undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في نقل الحصة.');
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
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <MoveRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              نقل موعد الحصة الدراسية (Move Lesson)
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              تغيير يوم أو فترة الحصة مع فحص فوري للتعارضات
            </div>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Lesson Info Card */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {entry.subjectNameAr}
            </span>
            <Badge variant="primary" size="sm">
              {entry.classNameAr}
            </Badge>
          </div>
          <div className="text-slate-600 dark:text-slate-400 flex items-center gap-3">
            <span>المعلم: {entry.teacherNameAr}</span>
            <span>الموعد الحالي: {DAYS_MAP[entry.dayOfWeek]?.ar} - {entry.periodNameAr}</span>
          </div>
        </div>

        {/* Target Day */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            اليوم المستهدف <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {activeDays.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setTargetDay(day)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  targetDay === day
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {DAYS_MAP[day]?.ar}
              </button>
            ))}
          </div>
        </div>

        {/* Target Period */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            الفترة / الحصة المستهدفة <span className="text-rose-500">*</span>
          </label>
          <select
            value={targetPeriodId}
            onChange={(e) => setTargetPeriodId(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          >
            <option value="">-- اختر الفترة --</option>
            {activePeriods.map((p) => (
              <option key={p.id} value={p.id} disabled={p.isBreak}>
                {p.nameAr} ({p.startTime} - {p.endTime}) {p.isBreak ? '⛔ [فسحة / استراحة]' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Target Room */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            القاعة / المعمل (اختياري)
          </label>
          <select
            value={targetRoomId}
            onChange={(e) => setTargetRoomId(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">بدون تحديد قاعة خاصة (القاعة الافتراضية)</option>
            {branchRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nameAr} [{r.roomCode}] (سعة: {r.capacity})
              </option>
            ))}
          </select>
        </div>

        {/* Real-time Conflict Alert Preview */}
        {previewConflict ? (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <span className="font-bold block">تعارض مكتشف في الوجهة المختارة:</span>
              <span>{previewConflict.messageAr}</span>
            </div>
          </div>
        ) : targetPeriodId && !selectedPeriod?.isBreak ? (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>الموعد متاح وخالٍ من أي تعارض مع المعلم أو الفصل أو القاعة.</span>
          </div>
        ) : null}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || Boolean(previewConflict) || selectedPeriod?.isBreak}
            leftIcon={<MoveRight className="w-3.5 h-3.5" />}
          >
            {isSubmitting ? 'جارٍ النقل...' : 'تأكيد النقل'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
