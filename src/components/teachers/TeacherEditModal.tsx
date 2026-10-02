import React, { useState, useEffect } from 'react';
import {
  TeacherDetail,
  UpdateTeacherDTO,
  TeacherGender,
  TeacherStatus,
  EmploymentType,
} from '../../types/teacher';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTeachers } from '../../context/TeacherContext';
import {
  Edit2,
  Building2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface TeacherEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherDetail | null;
  onSuccess?: () => void;
}

export const TeacherEditModal: React.FC<TeacherEditModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onSuccess,
}) => {
  const { updateTeacher } = useTeachers();

  const [firstNameAr, setFirstNameAr] = useState('');
  const [middleNameAr, setMiddleNameAr] = useState('');
  const [lastNameAr, setLastNameAr] = useState('');
  const [firstNameEn, setFirstNameEn] = useState('');
  const [middleNameEn, setMiddleNameEn] = useState('');
  const [lastNameEn, setLastNameEn] = useState('');
  const [gender, setGender] = useState<TeacherGender>('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [passportNumber, setPassportNumber] = useState('');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [alternatePhoneNumber, setAlternatePhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [hireDate, setHireDate] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('FULL_TIME');
  const [employmentStatus, setEmploymentStatus] = useState<TeacherStatus>('ACTIVE');
  const [specialization, setSpecialization] = useState('');
  const [perLessonRate, setPerLessonRate] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (teacher) {
      setFirstNameAr(teacher.firstNameAr || '');
      setMiddleNameAr(teacher.middleNameAr || '');
      setLastNameAr(teacher.lastNameAr || '');
      setFirstNameEn(teacher.firstNameEn || '');
      setMiddleNameEn(teacher.middleNameEn || '');
      setLastNameEn(teacher.lastNameEn || '');
      setGender(teacher.gender || 'male');
      setDateOfBirth(teacher.dateOfBirth || '');
      setNationality(teacher.nationality || '');
      setNationalId(teacher.nationalId?.includes('•') ? '' : teacher.nationalId || '');
      setPassportNumber(teacher.passportNumber?.includes('•') ? '' : teacher.passportNumber || '');
      setPhoneNumber(teacher.phoneNumber || '');
      setAlternatePhoneNumber(teacher.alternatePhoneNumber || '');
      setEmail(teacher.email || '');
      setAddress(teacher.address || '');
      setHireDate(teacher.hireDate || '');
      setEmploymentType(teacher.employmentType || 'FULL_TIME');
      setEmploymentStatus(teacher.employmentStatus || 'ACTIVE');
      setSpecialization(teacher.specialization || '');
      setPerLessonRate(teacher.perLessonRate);
      setNotes(teacher.notes || '');
      setErrorMessage(null);
    }
  }, [teacher, isOpen]);

  if (!isOpen || !teacher) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstNameAr.trim() || !lastNameAr.trim()) {
      setErrorMessage('الاسم الأول واسم العائلة بالعربية مطلوبان.');
      return;
    }
    if (!firstNameEn.trim() || !lastNameEn.trim()) {
      setErrorMessage('الاسم الأول واسم العائلة بالإنجليزية مطلوبان.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage('رقم الجوال مطلوب.');
      return;
    }
    if (!specialization.trim()) {
      setErrorMessage('التخصص الأكاديمي مطلوب.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updates: UpdateTeacherDTO = {
        firstNameAr: firstNameAr.trim(),
        middleNameAr: middleNameAr.trim() || undefined,
        lastNameAr: lastNameAr.trim(),
        firstNameEn: firstNameEn.trim(),
        middleNameEn: middleNameEn.trim() || undefined,
        lastNameEn: lastNameEn.trim(),
        gender,
        dateOfBirth: dateOfBirth || undefined,
        nationality: nationality.trim() || undefined,
        nationalId: nationalId.trim() || undefined,
        passportNumber: passportNumber.trim() || undefined,
        phoneNumber: phoneNumber.trim(),
        alternatePhoneNumber: alternatePhoneNumber.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        address: address.trim() || undefined,
        hireDate: hireDate || undefined,
        employmentStatus,
        employmentType,
        specialization: specialization.trim(),
        perLessonRate: employmentType === 'TEMPORARY' ? perLessonRate : undefined,
        notes: notes.trim() || undefined,
      };

      await updateTeacher(teacher.id, updates);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تحديث بيانات المعلم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Edit2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              تعديل ملف المعلم: {teacher.fullNameAr}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {teacher.teacherNumber} • {teacher.branchNameAr || teacher.branchId}
            </div>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Branch Indicator (Non-editable for safety) */}
        <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            الفرع التعليمي المعتمد:
          </span>
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {teacher.branchNameAr || teacher.branchId}
          </span>
        </div>

        {/* Names */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            الاسم الكامل (عربي وإنجليزي)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                الاسم الأول (بالعربية) *
              </label>
              <input
                type="text"
                required
                value={firstNameAr}
                onChange={(e) => setFirstNameAr(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                اسم الأب / الأوسط
              </label>
              <input
                type="text"
                value={middleNameAr}
                onChange={(e) => setMiddleNameAr(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                اسم العائلة (بالعربية) *
              </label>
              <input
                type="text"
                required
                value={lastNameAr}
                onChange={(e) => setLastNameAr(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                First Name (EN) *
              </label>
              <input
                type="text"
                required
                value={firstNameEn}
                onChange={(e) => setFirstNameEn(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                Middle Name (EN)
              </label>
              <input
                type="text"
                value={middleNameEn}
                onChange={(e) => setMiddleNameEn(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                Last Name (EN) *
              </label>
              <input
                type="text"
                required
                value={lastNameEn}
                onChange={(e) => setLastNameEn(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Identity & Demographics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
              الجنس *
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as TeacherGender)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs cursor-pointer"
            >
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
              تاريخ الميلاد
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
              الجنسية
            </label>
            <input
              type="text"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
              الهوية الوطنية / الإقامة
            </label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
              رقم الجوال الأساسي *
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono dir-ltr text-right"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
              رقم جوال بديل
            </label>
            <input
              type="tel"
              value={alternatePhoneNumber}
              onChange={(e) => setAlternatePhoneNumber(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono dir-ltr text-right"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
            />
          </div>
        </div>

        {/* Professional */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            البيانات المهنية والحالة
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                التخصص الأكاديمي *
              </label>
              <input
                type="text"
                required
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                نوع التعاقد الوظيفي *
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs cursor-pointer"
              >
                <option value="FULL_TIME">دوام كامل (رسمي)</option>
                <option value="PART_TIME">دوام جزئي</option>
                <option value="CONTRACT">عقد سنوي محدد</option>
                <option value="TEMPORARY">معلم حصص (مؤقت / بالأجر)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                الحالة الوظيفية
              </label>
              <select
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value as TeacherStatus)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs cursor-pointer"
              >
                <option value="ACTIVE">على رأس العمل (نشط)</option>
                <option value="ON_LEAVE">في إجازة</option>
                <option value="INACTIVE">غير نشط</option>
                <option value="SUSPENDED">موقوف إدارياً</option>
              </select>
            </div>
          </div>

          {employmentType === 'TEMPORARY' && (
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center gap-3 text-xs">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-blue-900 dark:text-blue-200 mb-0.5">
                  أجر الحصة الواحدة (ر.س) للمعلم المؤقت:
                </label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={perLessonRate || ''}
                  onChange={(e) => setPerLessonRate(parseFloat(e.target.value) || undefined)}
                  className="w-36 px-2.5 py-1 rounded border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
              ملاحظات إدارية
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
