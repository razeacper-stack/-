import React, { useState, useEffect } from 'react';
import { StudentDetail, UpdateStudentDTO, StudentGender } from '../../types/student';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useStudents } from '../../context/StudentContext';
import { Edit2, AlertCircle } from 'lucide-react';

interface StudentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentDetail | null;
}

export const StudentEditModal: React.FC<StudentEditModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const { updateStudent } = useStudents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [firstNameAr, setFirstNameAr] = useState('');
  const [lastNameAr, setLastNameAr] = useState('');
  const [firstNameEn, setFirstNameEn] = useState('');
  const [lastNameEn, setLastNameEn] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<StudentGender>('male');
  const [nationality, setNationality] = useState('سعودي');
  const [nationalId, setNationalId] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (student) {
      setFirstNameAr(student.firstNameAr || '');
      setLastNameAr(student.lastNameAr || '');
      setFirstNameEn(student.firstNameEn || '');
      setLastNameEn(student.lastNameEn || '');
      setDateOfBirth(student.dateOfBirth || '');
      setGender(student.gender || 'male');
      setNationality(student.nationality || 'سعودي');
      setNationalId(student.nationalId || '');
      setPassportNumber(student.passportNumber || '');
      setPhoneNumber(student.phoneNumber || '');
      setEmail(student.email || '');
      setAddress(student.address || '');
      setNotes(student.notes || '');
      setErrorMessage('');
    }
  }, [student, isOpen]);

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstNameAr.trim() || !lastNameAr.trim()) {
      setErrorMessage('الاسم الأول واسم العائلة بالعربية مطلوبان.');
      return;
    }
    if (!firstNameEn.trim() || !lastNameEn.trim()) {
      setErrorMessage('First and Last name in English are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const updates: UpdateStudentDTO = {
        firstNameAr: firstNameAr.trim(),
        lastNameAr: lastNameAr.trim(),
        firstNameEn: firstNameEn.trim(),
        lastNameEn: lastNameEn.trim(),
        dateOfBirth,
        gender,
        nationality: nationality.trim(),
        nationalId: nationalId.trim() || undefined,
        passportNumber: passportNumber.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await updateStudent(student.id, updates);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء تعديل بيانات الطالب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-base text-slate-900 dark:text-white">
            تعديل بيانات الطالب: {student.fullNameAr}
          </span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">الاسم الأول (عربي) *</label>
            <input
              type="text"
              required
              value={firstNameAr}
              onChange={(e) => setFirstNameAr(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">اسم العائلة (عربي) *</label>
            <input
              type="text"
              required
              value={lastNameAr}
              onChange={(e) => setLastNameAr(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">First Name (English) *</label>
            <input
              type="text"
              required
              value={firstNameEn}
              onChange={(e) => setFirstNameEn(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-sans"
            />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">Last Name (English) *</label>
            <input
              type="text"
              required
              value={lastNameEn}
              onChange={(e) => setLastNameEn(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-sans"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">تاريخ الميلاد *</label>
            <input
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">الجنس</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as StudentGender)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">رقم الهوية الوطنية / الإقامة</label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">الجنسية</label>
            <input
              type="text"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">رقم الهاتف</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-slate-600 dark:text-slate-400 mb-1">العنوان الوطني / السكن</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-slate-600 dark:text-slate-400 mb-1">ملاحظات إدارية</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            حفظ التغييرات
          </Button>
        </div>
      </form>
    </Modal>
  );
};
