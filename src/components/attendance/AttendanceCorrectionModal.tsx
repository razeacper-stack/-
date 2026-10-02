import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  PopulatedAttendanceRecord,
  AttendanceStatus,
  AbsenceReasonCode,
  CorrectAttendanceDTO,
} from '../../types/attendance';
import { useAttendance } from '../../context/AttendanceContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  AlertTriangle,
  History,
  Clock,
  FileText,
  UserCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PopulatedAttendanceRecord | null;
  onSuccess?: () => void;
}

const REASON_OPTIONS: { value: AbsenceReasonCode; labelAr: string; labelEn: string }[] = [
  { value: 'MEDICAL', labelAr: 'عذر مرضي / تقرير طبي معتمد', labelEn: 'Medical / Doctor Note' },
  { value: 'FAMILY_EMERGENCY', labelAr: 'ظرف أسري طارئ', labelEn: 'Family Emergency' },
  { value: 'OFFICIAL_PERMISSION', labelAr: 'استئذان رسمي مسبق من الإدارة', labelEn: 'Official Prior Permission' },
  { value: 'WEATHER_CONDITION', labelAr: 'تقلبات جوية / تعليق الدراسة', labelEn: 'Weather Conditions' },
  { value: 'TRANSPORTATION', labelAr: 'عطل حافلة / مواصلات', labelEn: 'Transportation Issue' },
  { value: 'UNEXCUSED', labelAr: 'غياب بدون عذر', labelEn: 'Unexcused Absence' },
  { value: 'OTHER', labelAr: 'أسباب أخرى', labelEn: 'Other Reasons' },
];

export const AttendanceCorrectionModal: React.FC<AttendanceCorrectionModalProps> = ({
  isOpen,
  onClose,
  record,
  onSuccess,
}) => {
  const { language } = useLanguage();
  const { correctAttendance } = useAttendance();

  const [status, setStatus] = useState<AttendanceStatus>('PRESENT');
  const [checkInTime, setCheckInTime] = useState<string>('');
  const [checkOutTime, setCheckOutTime] = useState<string>('');
  const [lateMinutes, setLateMinutes] = useState<string>('');
  const [reasonCode, setReasonCode] = useState<AbsenceReasonCode | ''>('');
  const [note, setNote] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setStatus(record.status);
      setCheckInTime(record.checkInTime || '');
      setCheckOutTime(record.checkOutTime || '');
      setLateMinutes(record.lateMinutes !== undefined ? String(record.lateMinutes) : '');
      setReasonCode(record.reasonCode || '');
      setNote(record.note || '');
      setCorrectionReason('');
      setError(null);
    }
  }, [record, isOpen]);

  if (!record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      setError(
        language === 'ar'
          ? 'يجب إدخال سبب ومبرر رسمي لإجراء تصحيح سجل الحضور لتوثيقه في سجل التدقيق.'
          : 'Official justification reason is required for audited attendance correction.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const dto: CorrectAttendanceDTO = {
        status,
        checkInTime: checkInTime || undefined,
        checkOutTime: checkOutTime || undefined,
        lateMinutes: lateMinutes ? parseInt(lateMinutes, 10) : undefined,
        reasonCode: reasonCode ? (reasonCode as AbsenceReasonCode) : undefined,
        note: note.trim() || undefined,
        correctionReason: correctionReason.trim(),
      };

      await correctAttendance(record.id, dto);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ التصحيح.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (st: AttendanceStatus) => {
    switch (st) {
      case 'PRESENT':
        return <Badge variant="success">حاضر (Present)</Badge>;
      case 'ABSENT':
        return <Badge variant="danger">غائب (Absent)</Badge>;
      case 'LATE':
        return <Badge variant="warning">متأخر (Late)</Badge>;
      case 'EXCUSED':
        return <Badge variant="info">بعذر (Excused)</Badge>;
      case 'EARLY_DEPARTURE':
        return <Badge variant="neutral">خروج مبكر (Early)</Badge>;
      default:
        return <Badge variant="neutral">{st}</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>
            {language === 'ar' ? 'التصحيح الموثق لسجل الحضور' : 'Audited Attendance Correction'}
          </span>
        </div>
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Student & Record Summary Header Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {language === 'ar' ? 'بيانات الطالب والسجل' : 'Student & Record Info'}
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {language === 'ar' ? record.studentNameAr : record.studentNameEn}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {record.studentIdNumber} • {record.classNameAr}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ar' ? 'الحالة الحالية:' : 'Current Status:'}
                </span>
                {getStatusBadge(record.status)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                {record.date} ({record.type === 'DAILY' ? 'يومي' : `حصة ${record.periodNameAr || ''}`})
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Correction Form Fields */}
        <div className="space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'ar' ? 'الحالة الجديدة المعتمدة *' : 'New Attendance Status *'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(
                [
                  { value: 'PRESENT', labelAr: 'حاضر', labelEn: 'Present', color: 'emerald' },
                  { value: 'ABSENT', labelAr: 'غائب', labelEn: 'Absent', color: 'rose' },
                  { value: 'LATE', labelAr: 'متأخر', labelEn: 'Late', color: 'amber' },
                  { value: 'EXCUSED', labelAr: 'بعذر مقبول', labelEn: 'Excused', color: 'indigo' },
                  { value: 'EARLY_DEPARTURE', labelAr: 'خروج مبكر', labelEn: 'Early Departure', color: 'purple' },
                ] as const
              ).map((opt) => {
                const isSelected = status === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`
                      px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-center
                      ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }
                    `}
                  >
                    {language === 'ar' ? opt.labelAr : opt.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Times & Late Minutes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {language === 'ar' ? 'وقت الدخول / الحضور' : 'Check-in Time'}
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {language === 'ar' ? 'وقت الخروج / الانصراف' : 'Check-out Time'}
              </label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {language === 'ar' ? 'دقائق التأخر (دقيقة)' : 'Late Minutes'}
              </label>
              <input
                type="number"
                min="0"
                max="300"
                value={lateMinutes}
                onChange={(e) => setLateMinutes(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Reason Code */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {language === 'ar' ? 'تصنيف سبب الغياب أو التأخر' : 'Absence / Delay Reason Code'}
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value as AbsenceReasonCode)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{language === 'ar' ? '-- بدون تصنيف خاص --' : '-- No Specific Reason --'}</option>
              {REASON_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {language === 'ar' ? r.labelAr : r.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Record Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {language === 'ar' ? 'ملاحظات إضافية على السجل' : 'Record Notes'}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={language === 'ar' ? 'ملاحظة توضيحية حول حالة الطالب...' : 'Optional notes...'}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mandatory Correction Justification */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
            <label className="block text-xs font-bold text-amber-900 dark:text-amber-200">
              {language === 'ar'
                ? 'سبب ومبرر التصحيح الإداري (إلزامي للتدقيق والرقابة) *'
                : 'Administrative Justification Reason (Required for Audit Trail) *'}
            </label>
            <textarea
              rows={2}
              required
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'مثال: تم إحضار تقرير طبي رسمي معتمد من مستشفى الملك فيصل، أو خطأ في إدخال الحصة...'
                  : 'e.g. Official approved medical excuse certificate submitted by parent...'
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="text-[10px] text-amber-800 dark:text-amber-300">
              {language === 'ar'
                ? 'ملاحظة: سيتم تسجيل اسم المستخدم الحالي والتوقيت الدقيق والحالة السابقة في السجل الدائم للتدقيق.'
                : 'Note: Current user identity, exact timestamp, and previous state will be recorded in the permanent audit trail.'}
            </div>
          </div>
        </div>

        {/* Previous Correction History (if any) */}
        {record.history && record.history.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'سجل التعديلات السابقة' : 'Previous Correction Trail'}</span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {record.history.map((h, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 text-[11px] space-y-0.5 border border-slate-200/50 dark:border-slate-700/40"
                >
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">{h.changedByName}</span>
                    <span className="font-mono text-[10px] text-slate-500">{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <span>{h.previousStatus}</span>
                    <span>→</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{h.newStatus}</span>
                    <span className="text-slate-400">|</span>
                    <span className="italic">"{h.reason}"</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {language === 'ar' ? 'اعتماد وحفظ التصحيح' : 'Save Correction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
