import React from 'react';
import { Filter, Calendar, RotateCcw } from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
import { useTranslation } from '../../context/LanguageContext';
import { academicStorage } from '../../services/academicStorage';
import { teacherStorage } from '../../services/teacherStorage';
import { studentStorage } from '../../services/studentStorage';
import { DatePreset, ReportDefinition, ReportFilterParams } from '../../types/reports';
import { Button } from '../common/Button';

export interface ReportFiltersProps {
  definition: ReportDefinition;
  filters: ReportFilterParams;
  onChangeFilters: (filters: ReportFilterParams) => void;
  onReset: () => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  definition,
  filters,
  onChangeFilters,
  onReset,
}) => {
  const { branches, isAllBranches } = useBranch();
  const { language, t } = useTranslation();

  const academicYears = academicStorage.getRawYears();
  const stages = academicStorage.getRawStages();
  const grades = academicStorage.getRawGrades();
  const classes = academicStorage.getRawClasses();
  const subjects = academicStorage.getRawSubjects();
  const teachers = teacherStorage.getRawTeachers();
  const students = studentStorage.getRawStudents();

  const supported = definition.supportedFilters;

  const handleDatePresetChange = (preset: DatePreset) => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    let start = '';
    let end = formatDate(today);

    if (preset === 'today') {
      start = formatDate(today);
      end = formatDate(today);
    } else if (preset === 'yesterday') {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      start = formatDate(yest);
      end = formatDate(yest);
    } else if (preset === 'this_week') {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay()); // Sunday or start of week
      start = formatDate(d);
    } else if (preset === 'this_month') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      start = formatDate(d);
    } else if (preset === 'this_year') {
      const d = new Date(today.getFullYear(), 0, 1);
      start = formatDate(d);
    }

    onChangeFilters({
      ...filters,
      datePreset: preset,
      startDate: start,
      endDate: end,
    });
  };

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 no-print">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{language === 'ar' ? 'خيارات وتصفية التقرير' : 'Report Filters & Criteria'}</span>
        </div>

        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer font-medium"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{language === 'ar' ? 'إعادة ضبط' : 'Reset'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
        {/* Branch Filter */}
        {supported.includes('branchId') && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              {language === 'ar' ? 'الفرع' : 'Branch'}
            </label>
            <select
              value={filters.branchId || 'all'}
              onChange={(e) => onChangeFilters({ ...filters, branchId: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="all">{t('branch.all')}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {language === 'ar' ? b.nameAr : b.nameEn}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Academic Year Filter */}
        {supported.includes('academicYearId') && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              {language === 'ar' ? 'العام الدراسي' : 'Academic Year'}
            </label>
            <select
              value={filters.academicYearId || ''}
              onChange={(e) => onChangeFilters({ ...filters, academicYearId: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="">{language === 'ar' ? 'العام الحالي' : 'Current Year'}</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.nameAr} {y.isCurrent ? '★' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stage Filter */}
        {supported.includes('stageId') && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              {language === 'ar' ? 'المرحلة' : 'Stage'}
            </label>
            <select
              value={filters.stageId || ''}
              onChange={(e) => onChangeFilters({ ...filters, stageId: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="">{language === 'ar' ? 'كافة المراحل' : 'All Stages'}</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameAr}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Grade Filter */}
        {supported.includes('gradeId') && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              {language === 'ar' ? 'الصف' : 'Grade'}
            </label>
            <select
              value={filters.gradeId || ''}
              onChange={(e) => onChangeFilters({ ...filters, gradeId: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="">{language === 'ar' ? 'كافة الصفوف' : 'All Grades'}</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nameAr}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Class Filter */}
        {supported.includes('classId') && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              {language === 'ar' ? 'الفصل' : 'Class'}
            </label>
            <select
              value={filters.classId || ''}
              onChange={(e) => onChangeFilters({ ...filters, classId: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="">{language === 'ar' ? 'كافة الفصول' : 'All Classes'}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr} ({c.classCode})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Subject Filter */}
        {supported.includes('subjectId') && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              {language === 'ar' ? 'المادة' : 'Subject'}
            </label>
            <select
              value={filters.subjectId || ''}
              onChange={(e) => onChangeFilters({ ...filters, subjectId: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="">{language === 'ar' ? 'كافة المواد' : 'All Subjects'}</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameAr}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Teacher Filter */}
        {supported.includes('teacherId') && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              {language === 'ar' ? 'المعلم' : 'Teacher'}
            </label>
            <select
              value={filters.teacherId || ''}
              onChange={(e) => onChangeFilters({ ...filters, teacherId: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="">{language === 'ar' ? 'كافة المعلمين' : 'All Faculty'}</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstNameAr} {t.lastNameAr}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Student Filter */}
        {supported.includes('studentId') && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              {language === 'ar' ? 'الطالب' : 'Student'}
            </label>
            <select
              value={filters.studentId || ''}
              onChange={(e) => onChangeFilters({ ...filters, studentId: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="">{language === 'ar' ? 'اختر طالباً...' : 'Select Student...'}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstNameAr} {s.lastNameAr} ({s.studentNumber})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        {supported.includes('status') && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              {language === 'ar' ? 'الحالة' : 'Status'}
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => onChangeFilters({ ...filters, status: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="">{language === 'ar' ? 'كافة الحالات' : 'All Statuses'}</option>
              <option value="ACTIVE">{language === 'ar' ? 'نشط' : 'Active'}</option>
              <option value="INACTIVE">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
              <option value="PAID">{language === 'ar' ? 'مسددة' : 'Paid'}</option>
              <option value="OVERDUE">{language === 'ar' ? 'متأخرة' : 'Overdue'}</option>
              <option value="PRESENT">{language === 'ar' ? 'حاضر' : 'Present'}</option>
              <option value="ABSENT">{language === 'ar' ? 'غائب' : 'Absent'}</option>
            </select>
          </div>
        )}

        {/* Date Presets (If supported) */}
        {(supported.includes('startDate') || supported.includes('endDate')) && (
          <>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                {language === 'ar' ? 'الفترة' : 'Preset'}
              </label>
              <select
                value={filters.datePreset || 'custom'}
                onChange={(e) => handleDatePresetChange(e.target.value as DatePreset)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="custom">{language === 'ar' ? 'مخصص' : 'Custom'}</option>
                <option value="today">{language === 'ar' ? 'اليوم' : 'Today'}</option>
                <option value="yesterday">{language === 'ar' ? 'أمس' : 'Yesterday'}</option>
                <option value="this_week">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</option>
                <option value="this_month">{language === 'ar' ? 'هذا الشهر' : 'This Month'}</option>
                <option value="this_year">{language === 'ar' ? 'هذا العام' : 'This Year'}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                {language === 'ar' ? 'من تاريخ' : 'Start Date'}
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onChangeFilters({ ...filters, startDate: e.target.value || undefined, datePreset: 'custom' })}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                {language === 'ar' ? 'إلى تاريخ' : 'End Date'}
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onChangeFilters({ ...filters, endDate: e.target.value || undefined, datePreset: 'custom' })}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
