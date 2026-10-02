import React, { useState } from 'react';
import {
  TeacherDetail,
  TeacherStatus,
  TeacherGender,
  EmploymentType,
  TeacherClassRole,
} from '../../types/teacher';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useTeachers } from '../../context/TeacherContext';
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
  RotateCcw,
  CheckCircle2,
  Clock,
  Plus,
  BookOpen,
  School,
  Award,
  DollarSign,
  AlertCircle,
  FileText,
  UserCheck,
  Building2,
  Trash2,
} from 'lucide-react';

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherDetail | null;
  onOpenEdit: (teacher: TeacherDetail) => void;
  onOpenSubjects: (teacher: TeacherDetail) => void;
  onOpenClasses: (teacher: TeacherDetail) => void;
  onOpenArchive: (teacher: TeacherDetail) => void;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onOpenEdit,
  onOpenSubjects,
  onOpenClasses,
  onOpenArchive,
}) => {
  const { changeTeacherStatus, addQualification, removeQualification, removeSubject, removeClass } = useTeachers();
  const { hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'qualifications' | 'subjects' | 'classes' | 'lifecycle'>('overview');
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // New qualification form
  const [showAddQual, setShowAddQual] = useState(false);
  const [qualDegree, setQualDegree] = useState('');
  const [qualField, setQualField] = useState('');
  const [qualInstitution, setQualInstitution] = useState('');
  const [qualYear, setQualYear] = useState<number>(new Date().getFullYear());
  const [qualHighest, setQualHighest] = useState(false);

  // Status change state
  const [selectedStatus, setSelectedStatus] = useState<TeacherStatus | ''>('');
  const [statusReason, setStatusReason] = useState('');

  if (!isOpen || !teacher) return null;

  const canEdit = hasPermission('teachers.edit');
  const canArchive = hasPermission('teachers.archive');
  const canRestore = hasPermission('teachers.restore');
  const canManageSubjects = hasPermission('teachers.manage_subjects');
  const canManageClasses = hasPermission('teachers.manage_classes');
  const canViewSensitive = hasPermission('teachers.view_sensitive_data');

  const getStatusBadge = (status: TeacherStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" dot size="sm">على رأس العمل (نشط)</Badge>;
      case 'INACTIVE':
        return <Badge variant="neutral" dot size="sm">غير نشط</Badge>;
      case 'ON_LEAVE':
        return <Badge variant="warning" dot size="sm">في إجازة رسمية</Badge>;
      case 'SUSPENDED':
        return <Badge variant="danger" dot size="sm">موقوف إدارياً</Badge>;
      case 'ARCHIVED':
        return <Badge variant="neutral" size="sm">مؤرشف</Badge>;
    }
  };

  const getEmploymentTypeBadge = (type: EmploymentType) => {
    switch (type) {
      case 'FULL_TIME':
        return <Badge variant="primary" size="sm">دوام كامل (رسمي)</Badge>;
      case 'PART_TIME':
        return <Badge variant="info" size="sm">دوام جزئي</Badge>;
      case 'CONTRACT':
        return <Badge variant="warning" size="sm">عقد سنوي</Badge>;
      case 'TEMPORARY':
        return <Badge variant="neutral" size="sm">معلم حصة (مؤقت)</Badge>;
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

  const handleAddQualification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qualDegree.trim()) return;

    try {
      setIsProcessing(true);
      setActionError(null);
      await addQualification(teacher.id, {
        degree: qualDegree.trim(),
        fieldOfStudy: qualField.trim() || teacher.specialization,
        institution: qualInstitution.trim(),
        graduationYear: qualYear,
        isHighestDegree: qualHighest,
      });
      setShowAddQual(false);
      setQualDegree('');
      setQualField('');
      setQualInstitution('');
      setQualHighest(false);
    } catch (err: any) {
      setActionError(err.message || 'فشل إضافة المؤهل الدراسي');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveQualification = async (qualId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المؤهل الأكاديمي؟')) return;
    try {
      setIsProcessing(true);
      setActionError(null);
      await removeQualification(qualId);
    } catch (err: any) {
      setActionError(err.message || 'فشل حذف المؤهل الدراسي');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveSubject = async (subjectId: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء إسناد هذه المادة الدراسية؟')) return;
    try {
      setIsProcessing(true);
      setActionError(null);
      await removeSubject(teacher.id, subjectId);
    } catch (err: any) {
      setActionError(err.message || 'فشل إلغاء إسناد المادة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveClass = async (teacherClassId: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء تسكين المعلم في هذا الفصل؟')) return;
    try {
      setIsProcessing(true);
      setActionError(null);
      await removeClass(teacherClassId);
    } catch (err: any) {
      setActionError(err.message || 'فشل إلغاء تسكين الفصل');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    try {
      setIsProcessing(true);
      setActionError(null);
      await changeTeacherStatus(teacher.id, selectedStatus, statusReason.trim() || undefined);
      setSelectedStatus('');
      setStatusReason('');
    } catch (err: any) {
      setActionError(err.message || 'فشل تغيير الحالة الوظيفية');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base">
            {teacher.firstNameAr?.[0] || 'م'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {teacher.fullNameAr}
              </h3>
              {getStatusBadge(teacher.employmentStatus)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {teacher.teacherNumber} • {teacher.fullNameEn}
            </div>
          </div>
        </div>
      }
      subtitle={
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            {teacher.branchNameAr || teacher.branchId}
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
            {teacher.specialization}
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          {getEmploymentTypeBadge(teacher.employmentType)}
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => onOpenEdit(teacher)}
              >
                تعديل البيانات
              </Button>
            )}
            {teacher.employmentStatus !== 'ARCHIVED' && canArchive && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Archive className="w-3.5 h-3.5 text-amber-500" />}
                onClick={() => onOpenArchive(teacher)}
              >
                أرشفة المعلم
              </Button>
            )}
            {teacher.employmentStatus === 'ARCHIVED' && canRestore && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={() => onOpenArchive(teacher)}
              >
                استعادة من الأرشيف
              </Button>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {actionError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            المعلومات الشخصية والوظيفية
          </button>
          <button
            onClick={() => setActiveTab('qualifications')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'qualifications'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <span>المؤهلات العلمية</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {teacher.qualifications?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'subjects'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <span>المواد المسندة</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {teacher.subjects?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'classes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <span>الفصول والشُعب</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {teacher.classes?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'lifecycle'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            إدارة الحالة الوظيفية
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Identity & Personal Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  البيانات الشخصية
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">الاسم بالعربية:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{teacher.fullNameAr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">الاسم بالإنجليزية:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{teacher.fullNameEn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">الجنس:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {teacher.gender === 'male' ? 'ذكر' : 'أنثى'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">تاريخ الميلاد:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{teacher.dateOfBirth || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">الجنسية:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{teacher.nationality || 'غير محدد'}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  معلومات الاتصال
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> الجوال الأساسي:
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 dir-ltr">{teacher.phoneNumber}</span>
                  </div>
                  {teacher.alternatePhoneNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> جوال بديل:
                      </span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 dir-ltr">{teacher.alternatePhoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> البريد الإلكتروني:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 text-[11px] truncate max-w-[160px]">
                      {teacher.email || 'غير مسجل'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> العنوان الوطني:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                      {teacher.address || 'غير محدد'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Details & Protected Sensitive Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                  بيانات التعيين والوثائق الرسمية المحمية
                </span>
                {canViewSensitive && (
                  <button
                    type="button"
                    onClick={() => setShowSensitiveData(!showSensitiveData)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showSensitiveData ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> إخفاء الوثائق
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> إظهار الوثائق الحساسة
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">تاريخ التعيين:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {teacher.hireDate || 'غير مسجل'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">الهوية الوطنية / الإقامة:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {canViewSensitive && showSensitiveData
                      ? teacher.nationalId || 'غير مسجل'
                      : teacher.nationalId
                      ? `${teacher.nationalId.slice(0, 3)}••••••${teacher.nationalId.slice(-1)}`
                      : 'غير مسجل'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">جواز السفر:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {canViewSensitive && showSensitiveData
                      ? teacher.passportNumber || 'لا يوجد'
                      : teacher.passportNumber
                      ? `${teacher.passportNumber.slice(0, 2)}••••••`
                      : 'لا يوجد'}
                  </span>
                </div>
              </div>

              {teacher.employmentType === 'TEMPORARY' && (
                <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs">
                  <span className="text-blue-800 dark:text-blue-300 flex items-center gap-1.5 font-medium">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    أجر الحصة الدراسية المعتمد:
                  </span>
                  <span className="font-bold text-blue-900 dark:text-blue-200">
                    {teacher.perLessonRate ? `${teacher.perLessonRate} ر.س / حصة` : 'غير محدد'}
                  </span>
                </div>
              )}

              {/* Login Account Separation Info */}
              <div className="p-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  حساب تسجيل الدخول للنظام (Portal Account):
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {teacher.userId ? 'مرتبط بحساب مستخدم نشط' : 'سجل معلم فقط (بدون حساب دخول مستقل)'}
                </span>
              </div>

              {teacher.notes && (
                <div className="text-xs pt-1">
                  <span className="text-slate-400 block mb-0.5">ملاحظات إدارية:</span>
                  <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    {teacher.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Qualifications */}
        {activeTab === 'qualifications' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  المؤهلات والشهادات العلمية المسجلة
                </h4>
                <p className="text-[11px] text-slate-400">
                  سجل الدرجات العلمية (بكالوريوس، ماجستير، دكتوراه، دبلوم) والجامعات المانحة
                </p>
              </div>
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setShowAddQual(!showAddQual)}
                >
                  {showAddQual ? 'إلغاء' : 'إضافة مؤهل جديد'}
                </Button>
              )}
            </div>

            {/* Add Qualification Form */}
            {showAddQual && (
              <form onSubmit={handleAddQualification} className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
                <h5 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  تسجيل مؤهل أكاديمي جديد
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      الدرجة العلمية * (بكالوريوس / ماجستير / دكتوراه)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: بكالوريوس تربوي"
                      value={qualDegree}
                      onChange={(e) => setQualDegree(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      التخصص الدقيق
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: رياضيات تطبيقية"
                      value={qualField}
                      onChange={(e) => setQualField(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      الجامعة / الكلية المانحة
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: جامعة الملك سعود"
                      value={qualInstitution}
                      onChange={(e) => setQualInstitution(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      سنة التخرج
                    </label>
                    <input
                      type="number"
                      value={qualYear}
                      min={1970}
                      max={new Date().getFullYear()}
                      onChange={(e) => setQualYear(parseInt(e.target.value, 10))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qualHighest}
                      onChange={(e) => setQualHighest(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>تعيين كأعلى مؤهل دراسي تم الحصول عليه</span>
                  </label>
                  <Button size="sm" variant="primary" type="submit" disabled={isProcessing}>
                    {isProcessing ? 'جارٍ الحفظ...' : 'حفظ المؤهل'}
                  </Button>
                </div>
              </form>
            )}

            {/* Qualifications List */}
            {teacher.qualifications && teacher.qualifications.length > 0 ? (
              <div className="space-y-2">
                {teacher.qualifications.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{q.degree}</span>
                          {q.isHighestDegree && (
                            <Badge variant="primary" size="sm">أعلى مؤهل</Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {q.fieldOfStudy} • {q.institution || 'مؤسسة غير محددة'} ({q.graduationYear})
                        </p>
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQualification(q.id)}
                        disabled={isProcessing}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="حذف المؤهل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <GraduationCap className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">لا توجد مؤهلات أكاديمية مسجلة حالياً لهذا المعلم</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Subjects */}
        {activeTab === 'subjects' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  المواد والمناهج الدراسية المسندة بالفرع
                </h4>
                <p className="text-[11px] text-slate-400">
                  يقتصر إسناد المواد الدراسية على المناهج المعتمدة في فرع المعلم ({teacher.branchNameAr || teacher.branchId})
                </p>
              </div>
              {canManageSubjects && (
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => onOpenSubjects(teacher)}
                >
                  إسناد مواد دراسية
                </Button>
              )}
            </div>

            {teacher.subjects && teacher.subjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {teacher.subjects.map((sbj) => (
                  <div
                    key={sbj.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{sbj.nameAr}</span>
                          {sbj.isPrimarySubject && (
                            <Badge variant="success" size="sm">مادة رئيسية</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {sbj.subjectCode} • {sbj.nameEn}
                        </p>
                      </div>
                    </div>
                    {canManageSubjects && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(sbj.subjectId)}
                        disabled={isProcessing}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="إلغاء إسناد المادة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">لم يتم إسناد أي مادة دراسية لهذا المعلم بعد</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Classes */}
        {activeTab === 'classes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  الفصول والشُعب المسكن بها المعلم
                </h4>
                <p className="text-[11px] text-slate-400">
                  تسكين المعلم في الفصول كمعلم أساسي أو رائد فصل أو معلم مادة
                </p>
              </div>
              {canManageClasses && (
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => onOpenClasses(teacher)}
                >
                  تسكين في فصل جديد
                </Button>
              )}
            </div>

            {teacher.classes && teacher.classes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {teacher.classes.map((tc) => (
                  <div
                    key={tc.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
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
                    {canManageClasses && (
                      <button
                        type="button"
                        onClick={() => handleRemoveClass(tc.id)}
                        disabled={isProcessing}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="إلغاء التسكين"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <School className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">لم يتم تسكين المعلم في أي فصل دراسي حالياً</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Lifecycle & Status Management */}
        {activeTab === 'lifecycle' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                الحالة التشغيلية الحالية للمعلم
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(teacher.employmentStatus)}
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {teacher.employmentStatus === 'ACTIVE' && 'المعلم يمارس مهامه التدريسية بشكل اعتيادي'}
                      {teacher.employmentStatus === 'ON_LEAVE' && 'المعلم في إجازة معتمدة (أمومة/مرضية/تدريبية)'}
                      {teacher.employmentStatus === 'INACTIVE' && 'المعلم غير نشط مؤقتاً'}
                      {teacher.employmentStatus === 'SUSPENDED' && 'المعلم موقوف عن التدريس بقرار إداري'}
                      {teacher.employmentStatus === 'ARCHIVED' && 'المعلم مؤرشف ومنتهية خدماته بالفرع'}
                    </span>
                  </div>
                  {teacher.archivedAt && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                      تمت الأرشفة بتاريخ: {new Date(teacher.archivedAt).toLocaleDateString('ar-SA')} - السبب: {teacher.archiveReason}
                    </p>
                  )}
                </div>
              </div>

              {canEdit && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    تغيير الحالة الوظيفية للمعلم:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['ACTIVE', 'ON_LEAVE', 'INACTIVE', 'SUSPENDED'] as TeacherStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStatus(st)}
                        className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                          selectedStatus === st
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {st === 'ACTIVE' && 'نشط (على رأس العمل)'}
                        {st === 'ON_LEAVE' && 'في إجازة'}
                        {st === 'INACTIVE' && 'غير نشط'}
                        {st === 'SUSPENDED' && 'موقوف إدارياً'}
                      </button>
                    ))}
                  </div>

                  {selectedStatus && (
                    <div className="space-y-2 pt-2">
                      <input
                        type="text"
                        placeholder="سبب تغيير الحالة الوظيفية (اختياري للتوثيق الإداري)..."
                        value={statusReason}
                        onChange={(e) => setStatusReason(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleStatusChange}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'جارٍ الحفظ...' : 'تأكيد تغيير الحالة'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
