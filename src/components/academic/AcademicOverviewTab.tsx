import React from 'react';
import {
  GraduationCap,
  Calendar,
  Layers,
  School,
  BookOpen,
  Link2,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { useBranch } from '../../context/BranchContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const AcademicOverviewTab: React.FC<{
  onNavigateTab: (tabId: string) => void;
  onOpenTestModal: () => void;
}> = ({ onNavigateTab, onOpenTestModal }) => {
  const { overviewStats, years, stages, grades, classes, subjects, gradeSubjects } = useAcademic();
  const { activeBranch, isAllBranches } = useBranch();

  const currentYear = years.find((y) => y.isCurrent);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-700 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>المرحلة الرابعة: الهيكل الأكاديمي المكتمل</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isAllBranches
                ? 'الهيكل الأكاديمي لجميع المجمعات المدرسية'
                : `الهيكل الأكاديمي: ${activeBranch?.nameAr || 'الفرع المحدد'}`}
            </h2>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              إدارة تسلسل الهيكل التعليمي: الفروع ← السنوات الدراسية ← المراحل ← الصفوف ← الفصول والشُعب ← المواد والمناهج الدراسية، مع عزل أمني دقيق للبيانات.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={onOpenTestModal}
              className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-md gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              فحص الهيكل (22 اختبارًا)
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigateTab('years')}
              className="bg-white text-blue-700 hover:bg-blue-50 border-transparent font-bold gap-2"
            >
              <Calendar className="w-4 h-4" />
              إدارة السنوات
            </Button>
          </div>
        </div>

        {/* Decorative circle */}
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Primary KPI Grid (Extracted from real DB data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Years Card */}
        <Card
          className="p-5 hover:shadow-lg transition-all border-l-4 border-l-blue-500 cursor-pointer"
          onClick={() => onNavigateTab('years')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">السنوات الدراسية</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {overviewStats?.yearsCount ?? years.length}
            </span>
            <span className="text-xs text-gray-400">سنة مسجلة</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>السنة الحالية: {currentYear ? currentYear.nameAr : 'غير محددة'}</span>
          </div>
        </Card>

        {/* Stages & Grades Card */}
        <Card
          className="p-5 hover:shadow-lg transition-all border-l-4 border-l-purple-500 cursor-pointer"
          onClick={() => onNavigateTab('stages')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">المراحل والصفوف</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {overviewStats?.stagesCount ?? stages.length}
            </span>
            <span className="text-xs text-gray-400">مراحل ({overviewStats?.gradesCount ?? grades.length} صفًا)</span>
          </div>
          <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
            تدرج أكاديمي من الابتدائي للثانوي
          </div>
        </Card>

        {/* Classes Card */}
        <Card
          className="p-5 hover:shadow-lg transition-all border-l-4 border-l-emerald-500 cursor-pointer"
          onClick={() => onNavigateTab('classes')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">الشُعب والفصول</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {overviewStats?.classesCount ?? classes.length}
            </span>
            <span className="text-xs text-gray-400">شعبة مفعلة</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>السعة الاستيعابية: {overviewStats?.totalCapacity ?? 0} مقعد</span>
          </div>
        </Card>

        {/* Subjects & Curriculum Card */}
        <Card
          className="p-5 hover:shadow-lg transition-all border-l-4 border-l-amber-500 cursor-pointer"
          onClick={() => onNavigateTab('subjects')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">المواد والمناهج</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {overviewStats?.subjectsCount ?? subjects.length}
            </span>
            <span className="text-xs text-gray-400">مقرر دراسي</span>
          </div>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
            <Link2 className="w-3.5 h-3.5" />
            <span>{overviewStats?.gradeSubjectLinksCount ?? gradeSubjects.length} خطة إسناد بالصفوف</span>
          </div>
        </Card>
      </div>

      {/* Middle Section: Current Academic Year Highlights & Hierarchy Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Academic Year Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">السنة الدراسية الحالية</h3>
            </div>
            {currentYear && (
              <Badge variant="success">نشطة حالياً</Badge>
            )}
          </div>

          {currentYear ? (
            <div className="mt-5 space-y-4">
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{currentYear.nameAr}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentYear.nameEn}</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">تاريخ الانطلاق:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{currentYear.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">تاريخ الختام:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{currentYear.endDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">حالة العام:</span>
                  <Badge variant={currentYear.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {currentYear.status}
                  </Badge>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => onNavigateTab('years')}
                className="w-full justify-center text-xs"
              >
                تعديل التقويم وإدارة السنوات
              </Button>
            </div>
          ) : (
            <div className="py-10 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                لم يتم تعيين سنة دراسية حالية لهذا الفرع بعد.
              </p>
              <Button variant="primary" size="sm" onClick={() => onNavigateTab('years')}>
                تعيين سنة حالية
              </Button>
            </div>
          )}
        </Card>

        {/* Academic Hierarchy Pipeline */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">التسلسل الهيكلي للفرع الحالي</h3>
            </div>
            <span className="text-xs text-gray-400">تسلسل معياري معتمد</span>
          </div>

          <div className="mt-6 space-y-4">
            {stages.map((stg, idx) => {
              const stageGrades = grades.filter((g) => g.stageId === stg.id);

              return (
                <div
                  key={stg.id}
                  className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:border-blue-500/40 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200/60 dark:border-gray-700/60">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                        {stg.nameAr} <span className="text-xs font-normal text-gray-400">({stg.nameEn})</span>
                      </h4>
                    </div>
                    <Badge variant={stg.status === 'active' ? 'success' : 'neutral'}>
                      {stg.status === 'active' ? 'نشطة' : 'معطلة'}
                    </Badge>
                  </div>

                  {/* Child grades chips */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">الصفوف:</span>
                    {stageGrades.length > 0 ? (
                      stageGrades.map((g) => {
                        const gradeClassCount = classes.filter((c) => c.gradeId === g.id).length;
                        return (
                          <div
                            key={g.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 shadow-sm"
                          >
                            <span className="font-medium">{g.nameAr}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
                              {gradeClassCount} شُعب
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-gray-400 italic">لا توجد صفوف مضافة بعد</span>
                    )}
                  </div>
                </div>
              );
            })}

            {stages.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">
                لا توجد مراحل دراسية مسجلة في هذا الفرع.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Navigation Footer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab('classes')}
          className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">توزيع الفصول والشُعب</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">إدارة القاعات والسعات الاستيعابية</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 rtl:rotate-180" />
        </div>

        <div
          onClick={() => onNavigateTab('grade_subjects')}
          className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-indigo-500/50 cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">مصفوفة ربط المواد بالصفوف</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">إسناد المقررات وحصصها الأسبوعية</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 rtl:rotate-180" />
        </div>

        <div
          onClick={onOpenTestModal}
          className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">منصة الاختبارات الآلية</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">22 اختبار تحقق معتمد للمرحلة 4</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 rtl:rotate-180" />
        </div>
      </div>
    </div>
  );
};
