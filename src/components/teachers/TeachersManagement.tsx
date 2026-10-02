import React, { useState } from 'react';
import { useTeachers } from '../../context/TeacherContext';
import { useBranch } from '../../context/BranchContext';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import {
  TeacherDetail,
  TeacherStatus,
  EmploymentType,
  TeacherGender,
} from '../../types/teacher';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { TeacherProfileModal } from './TeacherProfileModal';
import { TeacherRegistrationModal } from './TeacherRegistrationModal';
import { TeacherEditModal } from './TeacherEditModal';
import { TeacherSubjectModal } from './TeacherSubjectModal';
import { TeacherClassModal } from './TeacherClassModal';
import { TeacherArchiveModal } from './TeacherArchiveModal';
import { Phase6VerificationModal } from './Phase6VerificationModal';
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  RotateCcw,
  Download,
  Building2,
  GraduationCap,
  Calendar,
  School,
  BookOpen,
  Eye,
  Edit2,
  Archive,
  Phone,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Clock,
  DollarSign,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';

export const TeachersManagement: React.FC = () => {
  const {
    teachers,
    totalCount,
    page,
    pageSize,
    totalPages,
    filters,
    setFilters,
    resetFilters,
    stats,
    isLoading,
    refreshTeachers,
    exportCSV,
  } = useTeachers();

  const { branches, accessibleBranches, activeBranchId } = useBranch();
  const { subjects } = useAcademic();
  const { hasPermission, currentUser, isSuperAdmin } = useAuth();

  const availableBranches = isSuperAdmin ? branches : accessibleBranches;

  // View state
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal states
  const [selectedTeacherForView, setSelectedTeacherForView] = useState<TeacherDetail | null>(null);
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<TeacherDetail | null>(null);
  const [selectedTeacherForSubjects, setSelectedTeacherForSubjects] = useState<TeacherDetail | null>(null);
  const [selectedTeacherForClasses, setSelectedTeacherForClasses] = useState<TeacherDetail | null>(null);
  const [selectedTeacherForArchive, setSelectedTeacherForArchive] = useState<TeacherDetail | null>(null);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // Permissions
  const canCreate = hasPermission('teachers.create');
  const canEdit = hasPermission('teachers.edit');
  const canArchive = hasPermission('teachers.archive');
  const canRestore = hasPermission('teachers.restore');
  const canManageSubjects = hasPermission('teachers.manage_subjects');
  const canManageClasses = hasPermission('teachers.manage_classes');
  const canExport = hasPermission('teachers.export');

  // Filter available subjects for the currently selected branch
  const effectiveBranch = filters.branchId && filters.branchId !== 'all' ? filters.branchId : activeBranchId;
  const filteredSubjects = subjects.filter(
    (s) => !effectiveBranch || effectiveBranch === 'all' || s.branchId === effectiveBranch
  );

  const getStatusBadge = (status: TeacherStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" dot size="sm">على رأس العمل</Badge>;
      case 'INACTIVE':
        return <Badge variant="neutral" dot size="sm">غير نشط</Badge>;
      case 'ON_LEAVE':
        return <Badge variant="warning" dot size="sm">في إجازة</Badge>;
      case 'SUSPENDED':
        return <Badge variant="danger" dot size="sm">موقوف</Badge>;
      case 'ARCHIVED':
        return <Badge variant="neutral" size="sm">مؤرشف</Badge>;
    }
  };

  const getEmploymentTypeBadge = (type: EmploymentType) => {
    switch (type) {
      case 'FULL_TIME':
        return <Badge variant="primary" size="sm">دوام كامل</Badge>;
      case 'PART_TIME':
        return <Badge variant="info" size="sm">دوام جزئي</Badge>;
      case 'CONTRACT':
        return <Badge variant="warning" size="sm">عقد سنوي</Badge>;
      case 'TEMPORARY':
        return <Badge variant="neutral" size="sm">معلم حصة</Badge>;
    }
  };

  const handleExport = () => {
    try {
      const csv = exportCSV();
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `teachers_roster_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'فشل تصدير البيانات');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                إدارة هيئة التدريس (Faculty & Teachers)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                دليل الكادر الأكاديمي، المؤهلات العلمية، المواد المسندة وتسكين الفصول الدراسية
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVerificationModalOpen(true)}
            leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          >
            دليل واختبارات المرحلة 6
          </Button>

          {canExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              leftIcon={<Download className="w-4 h-4 text-slate-500" />}
            >
              تصدير CSV
            </Button>
          )}

          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRegisterModalOpen(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              تسجيل معلم جديد
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              إجمالي المعلمين
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {stats.totalTeachers}
              </span>
              <Users className="w-4 h-4 text-blue-500 opacity-80" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">
              على رأس العمل
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {stats.activeTeachers}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 block">
              في إجازة رسمية
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
                {stats.onLeaveTeachers}
              </span>
              <Clock className="w-4 h-4 text-amber-500 opacity-80" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              دوام كامل (رسمي)
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {stats.fullTimeTeachers}
              </span>
              <GraduationCap className="w-4 h-4 text-indigo-500 opacity-80" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              معلمو الحصص (مؤقت)
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {stats.temporaryTeachers}
              </span>
              <DollarSign className="w-4 h-4 text-emerald-500 opacity-80" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-400 block">
              المؤرشفين
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-slate-500">
                {stats.archivedTeachers}
              </span>
              <Archive className="w-4 h-4 text-slate-400 opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث بالاسم، الرقم الوظيفي، الجوال، التخصص..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-hidden transition-colors"
            />
          </div>

          {/* View mode toggle & Reset */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="عرض الجدول"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="عرض البطاقات"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={resetFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              إعادة ضبط
            </Button>
          </div>
        </div>

        {/* Multi-criteria filter row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          {/* Branch Filter */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">الفرع المكتبي</label>
            <select
              value={filters.branchId || 'all'}
              onChange={(e) => setFilters({ branchId: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs cursor-pointer font-medium"
            >
              <option value="all">جميع الفروع المتاحة</option>
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">الحالة الوظيفية</label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilters({ status: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs cursor-pointer font-medium"
            >
              <option value="all">كافة الحالات</option>
              <option value="ACTIVE">على رأس العمل</option>
              <option value="ON_LEAVE">في إجازة</option>
              <option value="INACTIVE">غير نشط</option>
              <option value="SUSPENDED">موقوف</option>
              <option value="ARCHIVED">مؤرشف</option>
            </select>
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">نوع التعاقد</label>
            <select
              value={filters.employmentType || 'all'}
              onChange={(e) => setFilters({ employmentType: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs cursor-pointer font-medium"
            >
              <option value="all">كافة العقود</option>
              <option value="FULL_TIME">دوام كامل (رسمي)</option>
              <option value="PART_TIME">دوام جزئي</option>
              <option value="CONTRACT">عقد سنوي</option>
              <option value="TEMPORARY">معلم حصة (مؤقت)</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">المادة الدراسية</label>
            <select
              value={filters.subjectId || 'all'}
              onChange={(e) => setFilters({ subjectId: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs cursor-pointer font-medium"
            >
              <option value="all">كافة المواد</option>
              {filteredSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">الجنس</label>
            <select
              value={filters.gender || 'all'}
              onChange={(e) => setFilters({ gender: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs cursor-pointer font-medium"
            >
              <option value="all">الكل</option>
              <option value="male">ذكور</option>
              <option value="female">إناث</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">الترتيب حسب</label>
            <select
              value={filters.sortBy || 'createdAt'}
              onChange={(e) => setFilters({ sortBy: e.target.value as any })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs cursor-pointer font-medium"
            >
              <option value="createdAt">تاريخ التسجيل</option>
              <option value="fullNameAr">الاسم (أبجدياً)</option>
              <option value="teacherNumber">الرقم الوظيفي</option>
              <option value="hireDate">تاريخ التعيين</option>
              <option value="specialization">التخصص</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">جارٍ جلب سجلات هيئة التدريس وتطبيق عزل الفروع...</p>
        </div>
      ) : teachers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              لا توجد سجلات معلمين مطابقة
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              جرب تغيير معايير البحث أو التصفية، أو قم بتسجيل معلم جديد بالفرع الحالي.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              إعادة ضبط التصفية
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsRegisterModalOpen(true)}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                تسجيل معلم جديد
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-3 text-start">المعلم (الاسم والرقم)</th>
                  <th className="px-4 py-3 text-start">الفرع والتخصص</th>
                  <th className="px-4 py-3 text-start">التعاقد والحالة</th>
                  <th className="px-4 py-3 text-start">المواد المسندة</th>
                  <th className="px-4 py-3 text-start">الفصول</th>
                  <th className="px-4 py-3 text-end">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {teachers.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Name & Teacher Number */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {t.firstNameAr?.[0] || 'م'}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => setSelectedTeacherForView(t)}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-start cursor-pointer block"
                          >
                            {t.fullNameAr}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                            <span>{t.teacherNumber}</span>
                            <span>•</span>
                            <span>{t.phoneNumber}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Branch & Specialization */}
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {t.specialization}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-blue-500" />
                          {t.branchNameAr || t.branchId}
                        </span>
                      </div>
                    </td>

                    {/* Employment Type & Status */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div>{getStatusBadge(t.employmentStatus)}</div>
                        <div>{getEmploymentTypeBadge(t.employmentType)}</div>
                      </div>
                    </td>

                    {/* Assigned Subjects */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {t.subjects && t.subjects.length > 0 ? (
                          t.subjects.slice(0, 2).map((s) => (
                            <span
                              key={s.id}
                              className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-medium"
                            >
                              {s.nameAr}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px]">بدون مواد</span>
                        )}
                        {t.subjects && t.subjects.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                            +{t.subjects.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Assigned Classes */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {t.classes && t.classes.length > 0 ? (
                          t.classes.slice(0, 2).map((c) => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium"
                            >
                              {c.classNameAr}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px]">بدون فصول</span>
                        )}
                        {t.classes && t.classes.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                            +{t.classes.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedTeacherForView(t)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="عرض الملف الكامل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setSelectedTeacherForEdit(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="تعديل البيانات"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {canManageSubjects && (
                          <button
                            type="button"
                            onClick={() => setSelectedTeacherForSubjects(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="إسناد المواد"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                        )}

                        {canManageClasses && (
                          <button
                            type="button"
                            onClick={() => setSelectedTeacherForClasses(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="تسكين الفصول"
                          >
                            <School className="w-4 h-4" />
                          </button>
                        )}

                        {(canArchive || canRestore) && (
                          <button
                            type="button"
                            onClick={() => setSelectedTeacherForArchive(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={t.employmentStatus === 'ARCHIVED' ? 'استعادة' : 'أرشفة'}
                          >
                            <Archive className="w-4 h-4" />
                          </button>
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
        /* Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {teachers.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 hover:border-blue-400 dark:hover:border-blue-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                    {t.firstNameAr?.[0] || 'م'}
                  </div>
                  <div>
                    <h4
                      onClick={() => setSelectedTeacherForView(t)}
                      className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm hover:text-blue-600 cursor-pointer"
                    >
                      {t.fullNameAr}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {t.teacherNumber}
                    </span>
                  </div>
                </div>
                {getStatusBadge(t.employmentStatus)}
              </div>

              <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">التخصص:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{t.specialization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الفرع:</span>
                  <span className="text-slate-700 dark:text-slate-300">{t.branchNameAr || t.branchId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">التعاقد:</span>
                  <span>{getEmploymentTypeBadge(t.employmentType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الجوال:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 dir-ltr">{t.phoneNumber}</span>
                </div>
              </div>

              {/* Subject Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {t.subjects && t.subjects.length > 0 ? (
                  t.subjects.slice(0, 3).map((s) => (
                    <span
                      key={s.id}
                      className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px]"
                    >
                      {s.nameAr}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400">بدون مواد مسندة</span>
                )}
                {t.subjects && t.subjects.length > 3 && (
                  <span className="text-[10px] text-slate-400">+{t.subjects.length - 3}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Eye className="w-3 h-3" />}
                  onClick={() => setSelectedTeacherForView(t)}
                >
                  الملف
                </Button>
                <div className="flex items-center gap-1">
                  {canManageSubjects && (
                    <button
                      type="button"
                      onClick={() => setSelectedTeacherForSubjects(t)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="المواد"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canManageClasses && (
                    <button
                      type="button"
                      onClick={() => setSelectedTeacherForClasses(t)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="الفصول"
                    >
                      <School className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setSelectedTeacherForEdit(t)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="تعديل"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="text-slate-500">
            عرض <span className="font-bold text-slate-800 dark:text-slate-200">{(page - 1) * pageSize + 1}</span> إلى{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {Math.min(page * pageSize, totalCount)}
            </span>{' '}
            من إجمالي <span className="font-bold text-slate-800 dark:text-slate-200">{totalCount}</span> معلماً
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setFilters({ page: page - 1 })}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-slate-700 dark:text-slate-300">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setFilters({ page: page + 1 })}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <TeacherProfileModal
        isOpen={Boolean(selectedTeacherForView)}
        onClose={() => setSelectedTeacherForView(null)}
        teacher={selectedTeacherForView}
        onOpenEdit={(tch) => {
          setSelectedTeacherForView(null);
          setSelectedTeacherForEdit(tch);
        }}
        onOpenSubjects={(tch) => {
          setSelectedTeacherForView(null);
          setSelectedTeacherForSubjects(tch);
        }}
        onOpenClasses={(tch) => {
          setSelectedTeacherForView(null);
          setSelectedTeacherForClasses(tch);
        }}
        onOpenArchive={(tch) => {
          setSelectedTeacherForView(null);
          setSelectedTeacherForArchive(tch);
        }}
      />

      <TeacherRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => refreshTeachers()}
      />

      <TeacherEditModal
        isOpen={Boolean(selectedTeacherForEdit)}
        onClose={() => setSelectedTeacherForEdit(null)}
        teacher={selectedTeacherForEdit}
        onSuccess={() => refreshTeachers()}
      />

      <TeacherSubjectModal
        isOpen={Boolean(selectedTeacherForSubjects)}
        onClose={() => setSelectedTeacherForSubjects(null)}
        teacher={selectedTeacherForSubjects}
        onSuccess={() => refreshTeachers()}
      />

      <TeacherClassModal
        isOpen={Boolean(selectedTeacherForClasses)}
        onClose={() => setSelectedTeacherForClasses(null)}
        teacher={selectedTeacherForClasses}
        onSuccess={() => refreshTeachers()}
      />

      <TeacherArchiveModal
        isOpen={Boolean(selectedTeacherForArchive)}
        onClose={() => setSelectedTeacherForArchive(null)}
        teacher={selectedTeacherForArchive}
        onSuccess={() => refreshTeachers()}
      />

      <Phase6VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />
    </div>
  );
};
