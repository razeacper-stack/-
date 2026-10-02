import React, { useState } from 'react';
import {
  StudentDetail,
  Guardian,
  StudentStatus,
  GuardianRelationship,
} from '../../types/student';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useStudents } from '../../context/StudentContext';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Shield,
  Eye,
  EyeOff,
  Edit2,
  Archive,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  UserCheck,
  FileText,
  Building2,
  Layers,
  School,
  XCircle,
} from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentDetail | null;
  onOpenEdit: (student: StudentDetail) => void;
  onOpenTransfer: (student: StudentDetail) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  onOpenEdit,
  onOpenTransfer,
}) => {
  const { changeStudentStatus, archiveStudent, addGuardian } = useStudents();
  const { hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'guardians' | 'lifecycle'>('profile');
  const [showNationalId, setShowNationalId] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [showStatusConfirm, setShowStatusConfirm] = useState<StudentStatus | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Add Guardian Form State
  const [showAddGuardianForm, setShowAddGuardianForm] = useState(false);
  const [guardianFullName, setGuardianFullName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState<GuardianRelationship>('mother');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianAddress, setGuardianAddress] = useState('');
  const [guardianIsPrimary, setGuardianIsPrimary] = useState(false);
  const [guardianIsEmergency, setGuardianIsEmergency] = useState(true);

  if (!student) return null;

  // Age calculation
  const calculateAge = (dobString: string): number => {
    try {
      const birth = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 0 ? age : 0;
    } catch {
      return 0;
    }
  };

  const handleStatusChange = async (newStatus: StudentStatus) => {
    try {
      setIsProcessing(true);
      setErrorMessage('');
      await changeStudentStatus(student.id, newStatus, statusReason);
      setShowStatusConfirm(null);
      setStatusReason('');
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء تغيير الحالة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveReason.trim()) {
      setErrorMessage('سبب الأرشفة مطلوب إلزامياً للتوثيق الإداري.');
      return;
    }
    try {
      setIsProcessing(true);
      setErrorMessage('');
      await archiveStudent(student.id, archiveReason.trim());
      setShowArchiveConfirm(false);
      setArchiveReason('');
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء أرشفة الطالب');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddGuardianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianFullName.trim() || !guardianPhone.trim()) {
      setErrorMessage('اسم ولي الأمر ورقم الهاتف مطلوبان.');
      return;
    }
    try {
      setIsProcessing(true);
      setErrorMessage('');
      await addGuardian(student.id, {
        fullName: guardianFullName.trim(),
        relationship: guardianRelationship,
        phoneNumber: guardianPhone.trim(),
        email: guardianEmail.trim() || undefined,
        address: guardianAddress.trim() || undefined,
        isPrimaryContact: guardianIsPrimary,
        isEmergencyContact: guardianIsEmergency,
      });
      setShowAddGuardianForm(false);
      setGuardianFullName('');
      setGuardianPhone('');
      setGuardianEmail('');
      setGuardianAddress('');
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إضافة ولي الأمر');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: StudentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" dot>منتظم (نشط)</Badge>;
      case 'INACTIVE':
        return <Badge variant="warning" dot>موقوف مؤقتاً</Badge>;
      case 'ARCHIVED':
        return <Badge variant="neutral" dot>مؤرشف / مسحوب</Badge>;
    }
  };

  const getRelationshipLabel = (rel: string) => {
    const map: Record<string, string> = {
      father: 'أب',
      mother: 'أم',
      brother: 'أخ',
      sister: 'أخت',
      uncle: 'عم / خال',
      aunt: 'عمة / خالة',
      grandfather: 'جد',
      grandmother: 'جدة',
      guardian: 'ولي أمر قانوني',
      other: 'آخر',
    };
    return map[rel] || rel;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
            {student.firstNameAr.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {student.fullNameAr}
              </h2>
              {getStatusBadge(student.status)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>{student.studentNumber}</span>
              <span>•</span>
              <span className="font-sans">{student.fullNameEn}</span>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>البيانات الشخصية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'academic'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>القيد الأكاديمي والفصل</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guardians')}
            className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'guardians'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>أولياء الأمور ({student.guardians.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lifecycle')}
            className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'lifecycle'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>إدارة الحالة والعمليات</span>
          </button>
        </div>

        {/* TAB 1: PERSONAL PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[11px] text-slate-400 block mb-1">الاسم الكامل (عربي)</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {student.fullNameAr}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[11px] text-slate-400 block mb-1">Full Name (English)</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-sans">
                  {student.fullNameEn}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[11px] text-slate-400 block mb-1">تاريخ الميلاد والعمر</span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {student.dateOfBirth} ({calculateAge(student.dateOfBirth)} سنوات)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[11px] text-slate-400 block mb-1">الجنس والجنسية</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {student.gender === 'male' ? 'ذكر' : 'أنثى'} • {student.nationality}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[11px] text-slate-400 block mb-1">رقم الهوية الوطنية / الإقامة</span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-slate-800 dark:text-slate-100">
                    {student.nationalId
                      ? showNationalId
                        ? student.nationalId
                        : '••••••••' + student.nationalId.slice(-4)
                      : 'غير مسجل'}
                  </span>
                  {student.nationalId && (
                    <button
                      type="button"
                      onClick={() => setShowNationalId(!showNationalId)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {showNationalId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[11px] text-slate-400 block mb-1">الفرع والفرع الأكاديمي</span>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {student.branchNameAr || student.branchId}
                  </span>
                </div>
              </div>
            </div>

            {/* Contacts & Address */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">بيانات التواصل والإقامة</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{student.phoneNumber || 'لا يوجد هاتف مباشر'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{student.email || 'لا يوجد بريد إلكتروني'}</span>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                  <span>{student.address || 'العنوان الوطني غير مدخل'}</span>
                </div>
              </div>
            </div>

            {student.notes && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>ملاحظات إدارية وطبية</span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
                  {student.notes}
                </p>
              </div>
            )}

            {hasPermission('students.edit') && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenEdit(student)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  تعديل الملف الشخصي
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACADEMIC & ENROLLMENT */}
        {activeTab === 'academic' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>القيد الدراسي الحالي</span>
                </span>
                <Badge variant="primary">
                  {student.activeEnrollment?.status || 'مسجل'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">العام الدراسي</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {student.currentYearNameAr || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">المرحلة الدراسية</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {student.currentStageNameAr || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">الصف الدراسي</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {student.currentGradeNameAr || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">الفصل والشعبة</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {student.currentClassNameAr || '—'} ({student.currentClassCode || '—'})
                  </span>
                </div>
              </div>

              {hasPermission('students.edit') && student.status === 'ACTIVE' && (
                <div className="mt-3 pt-3 border-t border-blue-200/50 dark:border-blue-900/50 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenTransfer(student)}
                    leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                  >
                    نقل الطالب إلى فصل آخر
                  </Button>
                </div>
              )}
            </div>

            {/* Enrollment History Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>سجل القيود والتنقلات السابقة</span>
              </h4>
              <div className="space-y-2">
                {student.enrollmentHistory && student.enrollmentHistory.length > 0 ? (
                  student.enrollmentHistory.map((enr, idx) => (
                    <div
                      key={enr.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>{enr.enrollmentDate}</span>
                          <span>•</span>
                          <span className="text-blue-600 dark:text-blue-400">{enr.status}</span>
                        </div>
                        {enr.notes && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {enr.notes}
                          </div>
                        )}
                      </div>
                      <Badge variant={enr.status === 'ENROLLED' ? 'success' : 'neutral'}>
                        {enr.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">لا يوجد سجل قيود سابقة.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GUARDIANS & CONTACTS */}
        {activeTab === 'guardians' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                أولياء الأمور المعتمدون
              </h4>
              {hasPermission('students.edit') && !showAddGuardianForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddGuardianForm(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  إضافة ولي أمر آخر
                </Button>
              )}
            </div>

            {/* Add Guardian Form */}
            {showAddGuardianForm && (
              <form
                onSubmit={handleAddGuardianSubmit}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    بيانات ولي الأمر الجديد
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddGuardianForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    إلغاء
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">الاسم الكامل *</label>
                    <input
                      type="text"
                      required
                      value={guardianFullName}
                      onChange={(e) => setGuardianFullName(e.target.value)}
                      placeholder="الاسم الكامل"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">صلة القرابة *</label>
                    <select
                      value={guardianRelationship}
                      onChange={(e) => setGuardianRelationship(e.target.value as GuardianRelationship)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="father">أب (Father)</option>
                      <option value="mother">أم (Mother)</option>
                      <option value="brother">أخ (Brother)</option>
                      <option value="sister">أخت (Sister)</option>
                      <option value="uncle">عم / خال (Uncle)</option>
                      <option value="guardian">ولي أمر قانوني (Guardian)</option>
                      <option value="other">آخر</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">رقم الهاتف *</label>
                    <input
                      type="tel"
                      required
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">البريد الإلكتروني (اختياري)</label>
                    <input
                      type="email"
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guardianIsPrimary}
                      onChange={(e) => setGuardianIsPrimary(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>تعيين كجهة اتصال أساسية (Primary Contact)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guardianIsEmergency}
                      onChange={(e) => setGuardianIsEmergency(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>جهة اتصال طوارئ</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddGuardianForm(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isProcessing}
                  >
                    حفظ ولي الأمر
                  </Button>
                </div>
              </form>
            )}

            {/* Guardians List */}
            <div className="space-y-3">
              {student.guardians.map((g) => (
                <div
                  key={g.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {g.fullName}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({getRelationshipLabel(g.relationship)})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {g.isPrimaryContact && (
                        <Badge variant="primary" dot>الجهة الأساسية</Badge>
                      )}
                      {g.isEmergencyContact && (
                        <Badge variant="danger">طوارئ</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${g.phoneNumber}`} className="hover:text-blue-600 transition-colors">
                        {g.phoneNumber}
                      </a>
                    </div>
                    {g.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{g.email}</span>
                      </div>
                    )}
                    {g.address && (
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{g.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: LIFECYCLE & AUDIT ACTIONS */}
        {activeTab === 'lifecycle' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                الحالة التشغيلية للقيد
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                يمكنك تغيير حالة الطالب بحسب متطلبات المدرسة. يرجى إرفاق مبرر إداري واضح لكل إجراء.
              </p>

              <div className="flex flex-wrap gap-2">
                {student.status !== 'ACTIVE' && hasPermission('students.edit') && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowStatusConfirm('ACTIVE')}
                    leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                  >
                    تفعيل وإعادة انتظام الطالب
                  </Button>
                )}

                {student.status === 'ACTIVE' && hasPermission('students.edit') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStatusConfirm('INACTIVE')}
                    leftIcon={<Clock className="w-3.5 h-3.5 text-amber-500" />}
                  >
                    تعليق القيد مؤقتاً (إيقاف)
                  </Button>
                )}

                {student.status !== 'ARCHIVED' && hasPermission('students.delete') && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowArchiveConfirm(true)}
                    leftIcon={<Archive className="w-3.5 h-3.5" />}
                  >
                    أرشفة ملف الطالب وسحب القيد
                  </Button>
                )}
              </div>
            </div>

            {/* Change Status Confirmation Box */}
            {showStatusConfirm && (
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                  تأكيد تغيير الحالة إلى {showStatusConfirm === 'ACTIVE' ? 'منتظم (نشط)' : 'موقوف مؤقتاً'}
                </span>
                <input
                  type="text"
                  placeholder="سبب تغيير الحالة (مثال: انتهاء فترة السفر / دفع الرسوم)"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStatusConfirm(null)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isProcessing}
                    onClick={() => handleStatusChange(showStatusConfirm)}
                  >
                    تأكيد التغيير
                  </Button>
                </div>
              </div>
            )}

            {/* Archive Confirmation Box */}
            {showArchiveConfirm && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 space-y-2">
                <span className="text-xs font-bold text-red-900 dark:text-red-200 block">
                  تأكيد أرشفة ملف الطالب
                </span>
                <p className="text-[11px] text-red-700 dark:text-red-300">
                  سيتم تحويل حالة الطالب إلى "مؤرشف"، وتحديث قيده الدراسي إلى مسحوب (WITHDRAWN)، وسجل العملية في سجل التدقيق الأمني.
                </p>
                <input
                  type="text"
                  required
                  placeholder="سبب الأرشفة الإداري (إلزامي)"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowArchiveConfirm(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={isProcessing}
                    onClick={handleArchive}
                  >
                    تأكيد الأرشفة
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
