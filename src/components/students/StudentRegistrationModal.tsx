import React, { useState, useEffect } from 'react';
import { CreateStudentDTO, StudentGender, GuardianRelationship } from '../../types/student';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useStudents } from '../../context/StudentContext';
import { useAcademic } from '../../context/AcademicContext';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  GraduationCap,
  Shield,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  School,
  IdCard,
} from 'lucide-react';

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createStudent, generateNextNumber } = useStudents();
  const { years, stages, grades, classes } = useAcademic();
  const { activeBranchId, branches, accessibleBranches } = useBranch();
  const { currentUser } = useAuth();

  const isSuperAdmin =
    currentUser?.roleCode === 'SUPER_ADMIN' ||
    currentUser?.isProtectedSuperAdmin ||
    currentUser?.hasAllBranchesAccess;

  const branchesToDisplay = isSuperAdmin ? branches : accessibleBranches;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const initialBranch =
    (activeBranchId && activeBranchId !== 'all' && (isSuperAdmin || accessibleBranches.some((b) => b.id === activeBranchId)))
      ? activeBranchId
      : branchesToDisplay.length > 0
      ? branchesToDisplay[0].id
      : 'branch-riyadh';

  const [selectedBranchId, setSelectedBranchId] = useState(initialBranch);
  const [studentNumber, setStudentNumber] = useState('');
  const [autoGenerateNumber, setAutoGenerateNumber] = useState(true);

  // Step 1: Personal
  const [firstNameAr, setFirstNameAr] = useState('');
  const [lastNameAr, setLastNameAr] = useState('');
  const [firstNameEn, setFirstNameEn] = useState('');
  const [lastNameEn, setLastNameEn] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('2019-01-01');
  const [gender, setGender] = useState<StudentGender>('male');
  const [nationality, setNationality] = useState('سعودي');
  const [nationalId, setNationalId] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Step 2: Academic Enrollment
  const [academicYearId, setAcademicYearId] = useState('');
  const [stageId, setStageId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [classId, setClassId] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);

  // Step 3: Guardian Details
  const [guardianFullName, setGuardianFullName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState<GuardianRelationship>('father');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianAddress, setGuardianAddress] = useState('');

  const [hasSecondaryGuardian, setHasSecondaryGuardian] = useState(false);
  const [secGuardianFullName, setSecGuardianFullName] = useState('');
  const [secGuardianRelationship, setSecGuardianRelationship] = useState<GuardianRelationship>('mother');
  const [secGuardianPhone, setSecGuardianPhone] = useState('');
  const [secGuardianEmail, setSecGuardianEmail] = useState('');

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMessage('');
      const branch =
        (activeBranchId && activeBranchId !== 'all' && (isSuperAdmin || accessibleBranches.some((b) => b.id === activeBranchId)))
          ? activeBranchId
          : branchesToDisplay.length > 0
          ? branchesToDisplay[0].id
          : 'branch-riyadh';
      setSelectedBranchId(branch);
      setStudentNumber(generateNextNumber(branch));
    }
  }, [isOpen, activeBranchId, branchesToDisplay, accessibleBranches, isSuperAdmin]);

  // When branch changes, auto generate next student number and clear dependent selections
  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    if (autoGenerateNumber) {
      setStudentNumber(generateNextNumber(branchId));
    }
    setAcademicYearId('');
    setStageId('');
    setGradeId('');
    setClassId('');
  };

  // Filter academic options based on selected branch
  const availableYears = years.filter((y) => y.branchId === selectedBranchId && (y.status === 'ACTIVE' || y.status === 'PLANNED'));
  const availableStages = stages.filter((s) => s.branchId === selectedBranchId && s.status === 'active');
  const availableGrades = grades.filter((g) => g.branchId === selectedBranchId && g.stageId === stageId && g.status === 'active');
  const availableClasses = classes.filter((c) => c.branchId === selectedBranchId && c.gradeId === gradeId && c.status === 'active');

  // Auto select active year if available
  useEffect(() => {
    if (!academicYearId && availableYears.length > 0) {
      const currentYear = availableYears.find((y) => y.isCurrent) || availableYears[0];
      setAcademicYearId(currentYear.id);
    }
  }, [availableYears, academicYearId]);

  const selectedClass = classes.find((c) => c.id === classId);

  // Step 1 Validation
  const validateStep1 = () => {
    if (!firstNameAr.trim() || !lastNameAr.trim()) {
      setErrorMessage('الاسم الأول واسم العائلة باللغة العربية مطلوبان.');
      return false;
    }
    if (!firstNameEn.trim() || !lastNameEn.trim()) {
      setErrorMessage('First and Last names in English are required.');
      return false;
    }
    if (!dateOfBirth) {
      setErrorMessage('يرجى تحديد تاريخ ميلاد الطالب.');
      return false;
    }
    if (!autoGenerateNumber && !studentNumber.trim()) {
      setErrorMessage('يرجى إدخال الرقم التعريفي للطالب.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!academicYearId) {
      setErrorMessage('يرجى اختيار العام الدراسي.');
      return false;
    }
    if (!stageId) {
      setErrorMessage('يرجى اختيار المرحلة الدراسية.');
      return false;
    }
    if (!gradeId) {
      setErrorMessage('يرجى اختيار الصف الدراسي.');
      return false;
    }
    if (!classId) {
      setErrorMessage('يرجى اختيار الفصل أو الشعبة.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (!guardianFullName.trim() || !guardianPhone.trim()) {
      setErrorMessage('بيانات ولي الأمر الأساسي (الاسم الكامل ورقم الهاتف) مطلوبة.');
      return false;
    }
    if (hasSecondaryGuardian && (!secGuardianFullName.trim() || !secGuardianPhone.trim())) {
      setErrorMessage('يرجى استكمال بيانات جهة الاتصال الإضافية أو إلغاء تفعيلها.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handleBack = () => {
    setErrorMessage('');
    if (step === 4) setStep(3);
    else if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const dto: CreateStudentDTO = {
        branchId: selectedBranchId,
        studentNumber: autoGenerateNumber ? undefined : studentNumber.trim(),
        firstNameAr: firstNameAr.trim(),
        lastNameAr: lastNameAr.trim(),
        firstNameEn: firstNameEn.trim(),
        lastNameEn: lastNameEn.trim(),
        dateOfBirth,
        gender,
        nationality,
        nationalId: nationalId.trim() || undefined,
        passportNumber: passportNumber.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,

        academicYearId,
        stageId,
        gradeId,
        classId,
        enrollmentDate,

        guardian: {
          fullName: guardianFullName.trim(),
          relationship: guardianRelationship,
          phoneNumber: guardianPhone.trim(),
          email: guardianEmail.trim() || undefined,
          address: guardianAddress.trim() || address.trim() || undefined,
          isPrimaryContact: true,
          isEmergencyContact: true,
        },

        secondaryGuardian: hasSecondaryGuardian
          ? {
              fullName: secGuardianFullName.trim(),
              relationship: secGuardianRelationship,
              phoneNumber: secGuardianPhone.trim(),
              email: secGuardianEmail.trim() || undefined,
              isEmergencyContact: true,
            }
          : undefined,
      };

      await createStudent(dto);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء تسجيل الطالب والقيد الأكاديمي');
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
            <School className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              تسجيل طالب جديد وقيد أكاديمي
            </h2>
            <p className="text-xs text-slate-500">
              إدخال البيانات الشخصية، ربط ولي الأمر، وتسكين الطالب في الشعبة الدراسية
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          {[
            { num: 1, title: 'البيانات الشخصية', icon: User },
            { num: 2, title: 'التسكين والفصل', icon: GraduationCap },
            { num: 3, title: 'ولي الأمر', icon: Shield },
            { num: 4, title: 'مراجعة وتأكيد', icon: CheckCircle2 },
          ].map((s) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : isDone
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isDone
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? '✓' : s.num}
                </div>
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            );
          })}
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: PERSONAL INFO */}
        {step === 1 && (
          <div className="space-y-3">
            {/* Campus Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  الفرع التعليمي *
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  {branchesToDisplay.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nameAr} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    الرقم التعريفي للطالب *
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-blue-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoGenerateNumber}
                      onChange={(e) => {
                        setAutoGenerateNumber(e.target.checked);
                        if (e.target.checked) {
                          setStudentNumber(generateNextNumber(selectedBranchId));
                        }
                      }}
                      className="rounded text-blue-600"
                    />
                    <span>توليد تلقائي</span>
                  </label>
                </div>
                <input
                  type="text"
                  required
                  disabled={autoGenerateNumber}
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  placeholder="STU-2026-001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-mono disabled:opacity-70 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                />
              </div>
            </div>

            {/* Arabic Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  الاسم الأول (بالعربية) *
                </label>
                <input
                  type="text"
                  required
                  value={firstNameAr}
                  onChange={(e) => setFirstNameAr(e.target.value)}
                  placeholder="مثال: ريان"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  اسم العائلة (بالعربية) *
                </label>
                <input
                  type="text"
                  required
                  value={lastNameAr}
                  onChange={(e) => setLastNameAr(e.target.value)}
                  placeholder="مثال: القحطاني"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* English Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  First Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={firstNameEn}
                  onChange={(e) => setFirstNameEn(e.target.value)}
                  placeholder="e.g. Rayan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Last Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={lastNameEn}
                  onChange={(e) => setLastNameEn(e.target.value)}
                  placeholder="e.g. Al-Qahtani"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-sans"
                />
              </div>
            </div>

            {/* DOB, Gender, Nationality */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  تاريخ الميلاد *
                </label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  الجنس *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as StudentGender)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  <option value="male">ذكر (بنين)</option>
                  <option value="female">أنثى (بنات)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  الجنسية
                </label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* National ID & Passport */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  رقم الهوية الوطنية / الإقامة (اختياري)
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="10xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  العنوان الوطني / السكن
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="المدينة - الحي"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ACADEMIC ENROLLMENT */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300">
              يرجى اختيار الهيكل الدراسي لتسكين الطالب في الشعبة المناسبة. يضمن النظام التحقق من السعة الاستيعابية ومطابقة المرحلة والفرع.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  العام الدراسي *
                </label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">-- اختر العام الدراسي --</option>
                  {availableYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.nameAr} {y.isCurrent ? '(الحالي)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  تاريخ القيد والتسجيل
                </label>
                <input
                  type="date"
                  value={enrollmentDate}
                  onChange={(e) => setEnrollmentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  المرحلة الدراسية *
                </label>
                <select
                  value={stageId}
                  onChange={(e) => {
                    setStageId(e.target.value);
                    setGradeId('');
                    setClassId('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
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
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  الصف الدراسي *
                </label>
                <select
                  value={gradeId}
                  disabled={!stageId}
                  onChange={(e) => {
                    setGradeId(e.target.value);
                    setClassId('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">-- اختر الصف الدراسي --</option>
                  {availableGrades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nameAr} ({g.gradeCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Class Section Selection with Live Capacity Meter */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                الفصل والشعبة الدراسية *
              </label>

              {!gradeId ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  يرجى اختيار المرحلة والصف الدراسي أولاً لعرض الفصول المتاحة
                </div>
              ) : availableClasses.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-900">
                  لا توجد فصول دراسية مضافة لهذا الصف حالياً في هذا الفرع.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableClasses.map((cls) => {
                    const isSelected = classId === cls.id;
                    return (
                      <div
                        key={cls.id}
                        onClick={() => setClassId(cls.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {cls.nameAr}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {cls.classCode}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>الغرفة: {cls.roomNumber || '—'}</span>
                          <span>السعة: {cls.capacity} طالب</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: GUARDIAN DETAILS */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>ولي الأمر الأساسي (المسؤول الأول)</span>
                </span>
                <Badge variant="primary">جهة الاتصال الرئيسية</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    الاسم الكامل لولي الأمر *
                  </label>
                  <input
                    type="text"
                    required
                    value={guardianFullName}
                    onChange={(e) => setGuardianFullName(e.target.value)}
                    placeholder="مثال: سعد إبراهيم القحطاني"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    صلة القرابة *
                  </label>
                  <select
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value as GuardianRelationship)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="father">أب (Father)</option>
                    <option value="mother">أم (Mother)</option>
                    <option value="brother">أخ (Brother)</option>
                    <option value="uncle">عم / خال (Uncle)</option>
                    <option value="guardian">ولي أمر قانوني (Guardian)</option>
                    <option value="other">آخر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    رقم الهاتف المحمول *
                  </label>
                  <input
                    type="tel"
                    required
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    البريد الإلكتروني (اختياري)
                  </label>
                  <input
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Optional Secondary Guardian */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={hasSecondaryGuardian}
                  onChange={(e) => setHasSecondaryGuardian(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  إضافة جهة اتصال طوارئ ثانية (مثل: الأم / الأخ)
                </span>
              </label>

              {hasSecondaryGuardian && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-slate-500 mb-1">الاسم الكامل *</label>
                    <input
                      type="text"
                      required
                      value={secGuardianFullName}
                      onChange={(e) => setSecGuardianFullName(e.target.value)}
                      placeholder="الاسم الكامل"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">صلة القرابة</label>
                    <select
                      value={secGuardianRelationship}
                      onChange={(e) => setSecGuardianRelationship(e.target.value as GuardianRelationship)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="mother">أم</option>
                      <option value="father">أب</option>
                      <option value="brother">أخ</option>
                      <option value="sister">أخت</option>
                      <option value="uncle">عم / خال</option>
                      <option value="other">آخر</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 mb-1">رقم هاتف الطوارئ *</label>
                    <input
                      type="tel"
                      required
                      value={secGuardianPhone}
                      onChange={(e) => setSecGuardianPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & CONFIRM */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
              اكتملت جميع البيانات بنجاح. يرجى مراجعة ملخص تسجيل الطالب قبل التأكيد والحفظ النهائي.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-200 dark:border-slate-800 pb-1">
                  بيانات الطالب
                </span>
                <div>الاسم: <span className="font-semibold text-slate-800 dark:text-slate-100">{firstNameAr} {lastNameAr}</span></div>
                <div>English: <span className="font-sans text-slate-800 dark:text-slate-100">{firstNameEn} {lastNameEn}</span></div>
                <div>الرقم التعريفي: <span className="font-mono text-blue-600 font-bold">{studentNumber}</span></div>
                <div>الميلاد: {dateOfBirth} ({gender === 'male' ? 'ذكر' : 'أنثى'})</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-200 dark:border-slate-800 pb-1">
                  التسكين والفصل
                </span>
                <div>الفصل: <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedClass?.nameAr}</span></div>
                <div>كود الشعبة: <span className="font-mono">{selectedClass?.classCode}</span></div>
                <div>السعة القصوى: {selectedClass?.capacity} طالب</div>
                <div>تاريخ القيد: {enrollmentDate}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1.5 sm:col-span-2">
                <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-200 dark:border-slate-800 pb-1">
                  بيانات ولي الأمر
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    {guardianFullName} ({guardianRelationship}) • هاتف: <span className="font-mono">{guardianPhone}</span>
                  </div>
                  <Badge variant="primary">أساسي</Badge>
                </div>
                {hasSecondaryGuardian && (
                  <div className="text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    جهة طوارئ إضافية: {secGuardianFullName} ({secGuardianRelationship}) • هاتف: {secGuardianPhone}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
            >
              رجوع
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              إلغاء
            </Button>
          )}

          {step < 4 ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleNext}
            >
              التالي
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              تأكيد التسجيل والقيد
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
