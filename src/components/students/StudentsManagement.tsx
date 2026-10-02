import React, { useState } from 'react';
import { useStudents } from '../../context/StudentContext';
import { useBranch } from '../../context/BranchContext';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import { StudentDetail, StudentStatus, StudentGender } from '../../types/student';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { StudentProfileModal } from './StudentProfileModal';
import { StudentRegistrationModal } from './StudentRegistrationModal';
import { StudentEditModal } from './StudentEditModal';
import { StudentTransferModal } from './StudentTransferModal';
import { Phase5VerificationModal } from './Phase5VerificationModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RotateCcw,
  Download,
  Building2,
  GraduationCap,
  Calendar,
  Layers,
  School,
  Eye,
  Edit2,
  ArrowRightLeft,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Archive,
  Phone,
  LayoutGrid,
  Table as TableIcon,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const StudentsManagement: React.FC = () => {
  const {
    students,
    totalCount,
    page,
    pageSize,
    totalPages,
    filters,
    setFilters,
    resetFilters,
    stats,
    isLoading,
    refreshStudents,
  } = useStudents();

  const { branches, accessibleBranches, activeBranchId } = useBranch();
  const { years, stages, grades, classes } = useAcademic();
  const { hasPermission, currentUser } = useAuth();

  const isSuperAdmin =
    currentUser?.roleCode === 'SUPER_ADMIN' ||
    currentUser?.isProtectedSuperAdmin ||
    currentUser?.hasAllBranchesAccess;

  const branchesToDisplay = isSuperAdmin ? branches : accessibleBranches;

  // Modals state
  const [selectedStudentForView, setSelectedStudentForView] = useState<StudentDetail | null>(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<StudentDetail | null>(null);
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState<StudentDetail | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // View Mode: 'table' or 'grid'
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filter options scoped to branch
  const effectiveBranch = filters.branchId && filters.branchId !== 'all' ? filters.branchId : activeBranchId;
  const filteredStages = stages.filter((s) => !effectiveBranch || effectiveBranch === 'all' || s.branchId === effectiveBranch);
  const filteredGrades = grades.filter((g) => {
    if (filters.stageId && filters.stageId !== 'all' && g.stageId !== filters.stageId) return false;
    if (effectiveBranch && effectiveBranch !== 'all' && g.branchId !== effectiveBranch) return false;
    return true;
  });
  const filteredClasses = classes.filter((c) => {
    if (filters.gradeId && filters.gradeId !== 'all' && c.gradeId !== filters.gradeId) return false;
    if (effectiveBranch && effectiveBranch !== 'all' && c.branchId !== effectiveBranch) return false;
    return true;
  });

  const getStatusBadge = (status: StudentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" dot size="sm">منتظم</Badge>;
      case 'INACTIVE':
        return <Badge variant="warning" dot size="sm">موقوف</Badge>;
      case 'ARCHIVED':
        return <Badge variant="neutral" dot size="sm">مؤرشف</Badge>;
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) return;
    const headers = ['رقم الطالب', 'الاسم بالعربية', 'الاسم بالإنجليزية', 'الجنس', 'الفرع', 'المرحلة', 'الصف', 'الفصل', 'ولي الأمر', 'رقم الهاتف', 'الحالة'];
    const rows = students.map((s) => [
      s.studentNumber,
      `"${s.fullNameAr}"`,
      `"${s.fullNameEn}"`,
      s.gender === 'male' ? 'ذكر' : 'أنثى',
      `"${s.branchNameAr || s.branchId}"`,
      `"${s.currentStageNameAr || ''}"`,
      `"${s.currentGradeNameAr || ''}"`,
      `"${s.currentClassNameAr || ''}"`,
      `"${s.primaryGuardian?.fullName || ''}"`,
      s.primaryGuardian?.phoneNumber || s.phoneNumber || '',
      s.status,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Students_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  شؤون الطلاب وأولياء الأمور
                </h1>
                <Badge variant="primary" size="sm">
                  PHASE 5
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                سجل الطلاب الشامل، بيانات الهوية، أولياء الأمور، والتسكين الأكاديمي بالفصول
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVerificationModalOpen(true)}
            leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          >
            فحص وتحقق المرحلة 5
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            تصدير CSV
          </Button>

          {hasPermission('students.create') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRegisterModalOpen(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              تسجيل طالب جديد
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">إجمالي الطلاب</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.totalStudents}
              </span>
              <Users className="w-4 h-4 text-blue-500 opacity-80" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">الطلاب المنتظمون</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.activeStudents}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-80" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">قيد معلق / موقوف</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {stats.inactiveStudents}
              </span>
              <Clock className="w-4 h-4 text-amber-500 opacity-80" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">ملفات مؤرشفة</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-600 dark:text-slate-300">
                {stats.archivedStudents}
              </span>
              <Archive className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">توزيع الجنسين</span>
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {stats.maleStudents} <span className="text-[10px] text-slate-400">بنين</span> / {stats.femaleStudents} <span className="text-[10px] text-slate-400">بنات</span>
              </span>
              <GraduationCap className="w-4 h-4 text-purple-500 opacity-80" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">مقيدون بالعام الحالي</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {stats.enrolledCurrentYear}
              </span>
              <School className="w-4 h-4 text-blue-500 opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="بحث بالاسم، رقم الطالب، رقم الهوية، أو هاتف ولي الأمر..."
              className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* View mode toggle & reset */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="عرض الجدول"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="عرض البطاقات"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              title="إعادة تعيين الفلاتر"
            >
              إعادة تعيين
            </Button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Branch Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">الفرع</label>
            <select
              value={filters.branchId || 'all'}
              disabled={!isSuperAdmin && branchesToDisplay.length <= 1}
              onChange={(e) =>
                setFilters({
                  branchId: e.target.value,
                  stageId: 'all',
                  gradeId: 'all',
                  classId: 'all',
                })
              }
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-60"
            >
              {(isSuperAdmin || branchesToDisplay.length > 1) && (
                <option value="all">
                  {isSuperAdmin ? 'جميع الفروع' : 'كافة الفروع المتاحة'}
                </option>
              )}
              {branchesToDisplay.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Stage Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">المرحلة الدراسية</label>
            <select
              value={filters.stageId || 'all'}
              onChange={(e) =>
                setFilters({
                  stageId: e.target.value,
                  gradeId: 'all',
                  classId: 'all',
                })
              }
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">كافة المراحل</option>
              {filteredStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Level Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">الصف الدراسي</label>
            <select
              value={filters.gradeId || 'all'}
              onChange={(e) =>
                setFilters({
                  gradeId: e.target.value,
                  classId: 'all',
                })
              }
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">كافة الصفوف</option>
              {filteredGrades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Class Section Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">الفصل / الشعبة</label>
            <select
              value={filters.classId || 'all'}
              onChange={(e) => setFilters({ classId: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">كافة الفصول</option>
              {filteredClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr} ({c.classCode})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">الحالة</label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilters({ status: e.target.value as any })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">كافة الحالات</option>
              <option value="ACTIVE">منتظم (نشط)</option>
              <option value="INACTIVE">موقوف مؤقتاً</option>
              <option value="ARCHIVED">مؤرشف</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">الجنس</label>
            <select
              value={filters.gender || 'all'}
              onChange={(e) => setFilters({ gender: e.target.value as any })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">الكل (بنين وبنات)</option>
              <option value="male">بنين (ذكر)</option>
              <option value="female">بنات (أنثى)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">جارٍ تحميل سجل الطلاب والبيانات الأكاديمية...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              لا يوجد طلاب مطابقون لمعايير البحث
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              لم نعثر على أي سجلات تطابق الفلاتر المحددة حالياً. يمكنك تعديل البحث أو إضافة طالب جديد.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              إعادة ضبط الفلاتر
            </Button>
            {hasPermission('students.create') && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsRegisterModalOpen(true)}
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              >
                تسجيل طالب جديد
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">رقم الطالب</th>
                  <th className="px-4 py-3 font-semibold">اسم الطالب</th>
                  <th className="px-4 py-3 font-semibold">الفرع</th>
                  <th className="px-4 py-3 font-semibold">الصف / الفصل</th>
                  <th className="px-4 py-3 font-semibold">ولي الأمر الأساسي</th>
                  <th className="px-4 py-3 font-semibold text-center">الحالة</th>
                  <th className="px-4 py-3 font-semibold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Student Number & Avatar */}
                    <td className="px-4 py-3 font-mono font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                          {student.firstNameAr.charAt(0)}
                        </div>
                        <span className="text-blue-600 dark:text-blue-400">{student.studentNumber}</span>
                      </div>
                    </td>

                    {/* Names */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {student.fullNameAr}
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        {student.fullNameEn} • {student.gender === 'male' ? 'ذكر' : 'أنثى'}
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{student.branchNameAr || student.branchId}</span>
                      </div>
                    </td>

                    {/* Academic Class & Grade */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {student.currentClassNameAr || 'غير مسكن'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {student.currentGradeNameAr || ''} {student.currentStageNameAr ? `(${student.currentStageNameAr})` : ''}
                      </div>
                    </td>

                    {/* Primary Guardian */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {student.primaryGuardian ? (
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {student.primaryGuardian.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3" />
                            <span>{student.primaryGuardian.phoneNumber}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">لا يوجد</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {getStatusBadge(student.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForView(student)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          title="عرض الملف الكامل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {hasPermission('students.edit') && (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForTransfer(student)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                              title="نقل فصل"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedStudentForEdit(student)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                              title="تعديل البيانات"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {students.map((student) => (
            <div
              key={student.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-base">
                      {student.firstNameAr.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {student.fullNameAr}
                      </h4>
                      <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                        {student.studentNumber}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(student.status)}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">الصف والفصل:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {student.currentClassNameAr || 'غير مسكن'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">الفرع:</span>
                    <span>{student.branchNameAr || student.branchId}</span>
                  </div>

                  {student.primaryGuardian && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ولي الأمر:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {student.primaryGuardian.fullName} ({student.primaryGuardian.phoneNumber})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStudentForView(student)}
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                >
                  الملف الكامل
                </Button>

                {hasPermission('students.edit') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStudentForTransfer(student)}
                    leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                  >
                    نقل
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="text-slate-500">
            عرض صفحة <span className="font-bold text-slate-900 dark:text-white">{page}</span> من أصل{' '}
            <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span> (إجمالي{' '}
            {totalCount} طالب)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setFilters({ page: page - 1 })}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-600 dark:text-blue-400">
              {page}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setFilters({ page: page + 1 })}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      <StudentProfileModal
        isOpen={!!selectedStudentForView}
        onClose={() => setSelectedStudentForView(null)}
        student={selectedStudentForView}
        onOpenEdit={(s) => {
          setSelectedStudentForView(null);
          setSelectedStudentForEdit(s);
        }}
        onOpenTransfer={(s) => {
          setSelectedStudentForView(null);
          setSelectedStudentForTransfer(s);
        }}
      />

      <StudentRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => refreshStudents()}
      />

      <StudentEditModal
        isOpen={!!selectedStudentForEdit}
        onClose={() => setSelectedStudentForEdit(null)}
        student={selectedStudentForEdit}
      />

      <StudentTransferModal
        isOpen={!!selectedStudentForTransfer}
        onClose={() => setSelectedStudentForTransfer(null)}
        student={selectedStudentForTransfer}
      />

      <Phase5VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />
    </div>
  );
};
