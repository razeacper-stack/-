import React, { useState } from 'react';
import { TimetablePeriod, CreatePeriodDTO, UpdatePeriodDTO } from '../../types/timetable';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useTimetable } from '../../context/TimetableContext';
import {
  Clock,
  Plus,
  Coffee,
  AlertCircle,
  Building2,
  Trash2,
  Edit2,
  CheckCircle2,
} from 'lucide-react';

interface PeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
}

export const PeriodModal: React.FC<PeriodModalProps> = ({ isOpen, onClose, branchId }) => {
  const { periods, createPeriod, updatePeriod } = useTimetable();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

  // Form State
  const [periodNumber, setPeriodNumber] = useState<number>(1);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:45');
  const [isBreak, setIsBreak] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const branchPeriods = periods
    .filter((p) => p.branchId === branchId)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  const handleOpenAdd = () => {
    const nextNum = branchPeriods.length > 0 ? Math.max(...branchPeriods.map((p) => p.periodNumber)) + 1 : 1;
    setPeriodNumber(nextNum);
    setNameAr(`الحصة ${nextNum}`);
    setNameEn(`Period ${nextNum}`);
    setStartTime('08:00');
    setEndTime('08:45');
    setIsBreak(false);
    setEditingPeriodId(null);
    setShowAddForm(true);
    setErrorMessage(null);
  };

  const handleOpenEdit = (p: TimetablePeriod) => {
    setPeriodNumber(p.periodNumber);
    setNameAr(p.nameAr);
    setNameEn(p.nameEn);
    setStartTime(p.startTime);
    setEndTime(p.endTime);
    setIsBreak(p.isBreak);
    setEditingPeriodId(p.id);
    setShowAddForm(true);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nameAr.trim() || !nameEn.trim()) {
      setErrorMessage('اسم الفترة بالعربية والإنجليزية مطلوب.');
      return;
    }
    if (startTime >= endTime) {
      setErrorMessage('وقت بدء الحصة يجب أن يكون أسبق من وقت الانتهاء.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingPeriodId) {
        const updateDto: UpdatePeriodDTO = {
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          periodNumber,
          startTime,
          endTime,
          isBreak,
        };
        await updatePeriod(editingPeriodId, updateDto);
      } else {
        const createDto: CreatePeriodDTO = {
          branchId,
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          periodNumber,
          startTime,
          endTime,
          isBreak,
          status: 'active',
        };
        await createPeriod(createDto);
      }
      setShowAddForm(false);
      setEditingPeriodId(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في حفظ الفترة الزمنية.');
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
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              إدارة الحصص والفترات اليومية (Bell Schedule)
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              تحديد أوقات الحصص والفسح اليومية وفق التقويم المعتمد للفرع
            </div>
          </div>
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

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            عدد الحصص والفترات المعرفة: <strong className="text-slate-800 dark:text-slate-200">{branchPeriods.length}</strong>
          </span>

          {!showAddForm && (
            <Button size="sm" variant="primary" onClick={handleOpenAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              إضافة فترة جديدة
            </Button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {editingPeriodId ? 'تعديل بيانات الفترة' : 'إضافة حصة / فترة جديدة للفرع'}
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                إلغاء
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  رقم الترتيب *
                </label>
                <input
                  type="number"
                  min="1"
                  value={periodNumber}
                  onChange={(e) => setPeriodNumber(parseInt(e.target.value) || 1)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  اسم الفترة (عربي) *
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: الحصة الأولى"
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  اسم الفترة (إنجليزي) *
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Period 1"
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  وقت البدء *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  وقت الانتهاء *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pb-1.5">
                  <input
                    type="checkbox"
                    checked={isBreak}
                    onChange={(e) => setIsBreak(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>فترة فسحة / صلاة (محظورة من الحصص)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="secondary" type="button" onClick={() => setShowAddForm(false)}>
                إلغاء
              </Button>
              <Button size="sm" variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'جارٍ الحفظ...' : editingPeriodId ? 'تحديث الفترة' : 'إضافة'}
              </Button>
            </div>
          </form>
        )}

        {/* Periods List */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs max-h-[380px] overflow-y-auto">
          {branchPeriods.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              لا توجد فترات دراسية معرفة لهذا الفرع. انقر على &quot;إضافة فترة جديدة&quot; لبدء التكوين.
            </div>
          ) : (
            branchPeriods.map((p) => (
              <div
                key={p.id}
                className={`p-3 flex items-center justify-between transition-colors ${
                  p.isBreak
                    ? 'bg-amber-50/50 dark:bg-amber-950/20'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-[11px]">
                    {p.periodNumber}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {p.nameAr} ({p.nameEn})
                      </span>
                      {p.isBreak ? (
                        <Badge variant="warning" size="sm">
                          فسحة / صلاة
                        </Badge>
                      ) : (
                        <Badge variant="primary" size="sm">
                          حصة تعليمية
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                      <span>{p.startTime} - {p.endTime}</span>
                      <span>•</span>
                      <span>{p.durationMinutes} دقيقة</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};
