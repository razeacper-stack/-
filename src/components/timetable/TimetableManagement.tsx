import React, { useState, useMemo } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useBranch } from '../../context/BranchContext';
import { useAcademic } from '../../context/AcademicContext';
import { useTeachers } from '../../context/TeacherContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import {
  DayOfWeek,
  PopulatedTimetableEntry,
  TimetablePeriod,
  WeeklySubjectLoad,
} from '../../types/timetable';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { LessonModal } from './LessonModal';
import { PeriodModal } from './PeriodModal';
import { RoomModal } from './RoomModal';
import { CopyTimetableModal } from './CopyTimetableModal';
import { MoveLessonModal } from './MoveLessonModal';
import { Phase7VerificationModal } from './Phase7VerificationModal';
import {
  CalendarDays,
  Plus,
  Clock,
  Building2,
  Copy,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  School,
  UserCheck,
  Coffee,
  Trash2,
  Edit2,
  MoveRight,
  Filter,
  Eye,
  Send,
  Layers,
  Sparkles,
} from 'lucide-react';

const DAYS_MAP: Record<DayOfWeek, { ar: string; en: string }> = {
  0: { ar: 'الأحد', en: 'Sunday' },
  1: { ar: 'الإثنين', en: 'Monday' },
  2: { ar: 'الثلاثاء', en: 'Tuesday' },
  3: { ar: 'الأربعاء', en: 'Wednesday' },
  4: { ar: 'الخميس', en: 'Thursday' },
  5: { ar: 'الجمعة', en: 'Friday' },
  6: { ar: 'السبت', en: 'Saturday' },
};

export const TimetableManagement: React.FC = () => {
  const { language, t } = useTranslation();
  const {
    entries,
    periods,
    rooms,
    activeDays,
    isLoading,
    refreshData,
    deleteEntry,
    publishClassTimetable,
    unpublishClassTimetable,
    getSubjectLoad,
    exportCSV,
  } = useTimetable();

  const { branches, accessibleBranches, activeBranchId, isAllBranches } = useBranch();
  const { years, stages, grades, classes, subjects, gradeSubjects } = useAcademic();
  const { teachers } = useTeachers();
  const { hasPermission, isSuperAdmin, currentUser } = useAuth();

  // Permissions
  const canCreate = hasPermission('timetable.create');
  const canEdit = hasPermission('timetable.edit');
  const canDelete = hasPermission('timetable.delete');
  const canPublish = hasPermission('timetable.publish');
  const canManagePeriods = hasPermission('timetable.manage_periods');
  const canManageRooms = hasPermission('timetable.manage_rooms');
  const canExport = hasPermission('timetable.export');

  // Branch Selection
  const availableBranches = isSuperAdmin ? branches : accessibleBranches;
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    activeBranchId && activeBranchId !== 'all'
      ? activeBranchId
      : availableBranches[0]?.id || 'branch-riyadh'
  );

  // Sync selected branch if activeBranchId changes and is not 'all'
  React.useEffect(() => {
    if (activeBranchId && activeBranchId !== 'all') {
      setSelectedBranchId(activeBranchId);
    }
  }, [activeBranchId]);

  // Academic Year Selection
  const branchYears = useMemo(
    () => years.filter((y) => y.branchId === selectedBranchId),
    [years, selectedBranchId]
  );
  const activeYear = branchYears.find((y) => y.status === 'ACTIVE' || y.isCurrent) || branchYears[0];
  const [selectedYearId, setSelectedYearId] = useState<string>(activeYear?.id || '');

  React.useEffect(() => {
    if (activeYear && (!selectedYearId || !branchYears.some((y) => y.id === selectedYearId))) {
      setSelectedYearId(activeYear.id);
    }
  }, [activeYear, branchYears, selectedYearId]);

  // View Mode: 'class' | 'teacher' | 'room' | 'overview'
  const [viewMode, setViewMode] = useState<'class' | 'teacher' | 'room' | 'overview'>('class');

  // Class View Selection
  const branchClasses = useMemo(
    () =>
      classes.filter(
        (c) =>
          c.branchId === selectedBranchId &&
          (!selectedYearId || c.academicYearId === selectedYearId)
      ),
    [classes, selectedBranchId, selectedYearId]
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(branchClasses[0]?.id || '');

  React.useEffect(() => {
    if (branchClasses.length > 0 && (!selectedClassId || !branchClasses.some((c) => c.id === selectedClassId))) {
      setSelectedClassId(branchClasses[0].id);
    }
  }, [branchClasses, selectedClassId]);

  // Teacher View Selection
  const branchTeachers = useMemo(
    () => teachers.filter((t) => t.branchId === selectedBranchId && t.employmentStatus !== 'ARCHIVED'),
    [teachers, selectedBranchId]
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(branchTeachers[0]?.id || '');

  React.useEffect(() => {
    if (branchTeachers.length > 0 && (!selectedTeacherId || !branchTeachers.some((t) => t.id === selectedTeacherId))) {
      setSelectedTeacherId(branchTeachers[0].id);
    }
  }, [branchTeachers, selectedTeacherId]);

  // Room View Selection
  const branchRooms = useMemo(
    () => rooms.filter((r) => r.branchId === selectedBranchId && r.status === 'active'),
    [rooms, selectedBranchId]
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string>(branchRooms[0]?.id || '');

  React.useEffect(() => {
    if (branchRooms.length > 0 && (!selectedRoomId || !branchRooms.some((r) => r.id === selectedRoomId))) {
      setSelectedRoomId(branchRooms[0].id);
    }
  }, [branchRooms, selectedRoomId]);

  // Modals state
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<PopulatedTimetableEntry | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<{ day: DayOfWeek; periodId: string } | null>(null);

  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const [movingEntry, setMovingEntry] = useState<PopulatedTimetableEntry | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  // Status message
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Branch periods sorted by periodNumber
  const branchPeriods = useMemo(
    () =>
      periods
        .filter((p) => p.branchId === selectedBranchId && p.status === 'active')
        .sort((a, b) => a.periodNumber - b.periodNumber),
    [periods, selectedBranchId]
  );

  // Filtered timetable entries according to current view
  const currentViewEntries = useMemo(() => {
    return entries.filter((e) => {
      if (e.branchId !== selectedBranchId) return false;
      if (selectedYearId && e.academicYearId !== selectedYearId) return false;

      if (viewMode === 'class') {
        return e.classId === selectedClassId;
      }
      if (viewMode === 'teacher') {
        return e.teacherId === selectedTeacherId;
      }
      if (viewMode === 'room') {
        return e.roomId === selectedRoomId;
      }
      return true;
    });
  }, [entries, selectedBranchId, selectedYearId, viewMode, selectedClassId, selectedTeacherId, selectedRoomId]);

  // Check publishing status of currently selected class timetable
  const classEntries = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.branchId === selectedBranchId &&
          e.academicYearId === selectedYearId &&
          e.classId === selectedClassId
      ),
    [entries, selectedBranchId, selectedYearId, selectedClassId]
  );

  const isClassPublished = classEntries.length > 0 && classEntries.every((e) => e.status === 'PUBLISHED');
  const classStatusBadge = useMemo(() => {
    if (classEntries.length === 0) {
      return <Badge variant="neutral" size="sm">فارغ (لا توجد حصص)</Badge>;
    }
    if (isClassPublished) {
      return (
        <Badge variant="success" dot size="sm">
          معتمد ومنشور (PUBLISHED)
        </Badge>
      );
    }
    return (
      <Badge variant="warning" dot size="sm">
        مسودة قيد الإعداد (DRAFT)
      </Badge>
    );
  }, [classEntries.length, isClassPublished]);

  // Subject load breakdown for selected class
  const subjectLoads = useMemo(() => {
    if (!selectedClassId || !selectedYearId) return [];
    return getSubjectLoad(selectedClassId, selectedYearId);
  }, [selectedClassId, selectedYearId, getSubjectLoad, entries]);

  // Handlers
  const handlePublishClass = async () => {
    if (!selectedClassId || !selectedYearId) return;
    try {
      const res = await publishClassTimetable(selectedClassId, selectedYearId);
      showNotification('success', `تم اعتماد ونشر جدول الفصل بنجاح (${res.publishedCount} حصة).`);
    } catch (err: any) {
      showNotification('error', err.message || 'فشل في نشر الجدول.');
    }
  };

  const handleUnpublishClass = async () => {
    if (!selectedClassId || !selectedYearId) return;
    try {
      const res = await unpublishClassTimetable(selectedClassId, selectedYearId);
      showNotification('success', `تم إلغاء النشر وإعادة الجدول إلى مسودة (${res.unpublishedCount} حصة).`);
    } catch (err: any) {
      showNotification('error', err.message || 'فشل في إلغاء النشر.');
    }
  };

  const handleDeleteLesson = async (entryId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الحصة المجدولة؟')) return;
    try {
      await deleteEntry(entryId);
      showNotification('success', 'تم حذف الحصة الدراسية بنجاح.');
    } catch (err: any) {
      showNotification('error', err.message || 'فشل في حذف الحصة.');
    }
  };

  const handleExportCSV = () => {
    try {
      const csv = exportCSV({
        branchId: selectedBranchId,
        academicYearId: selectedYearId,
        classId: viewMode === 'class' ? selectedClassId : undefined,
        teacherId: viewMode === 'teacher' ? selectedTeacherId : undefined,
        roomId: viewMode === 'room' ? selectedRoomId : undefined,
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `timetable_${selectedBranchId}_${viewMode}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('success', 'تم تصدير ملف الجدول بصيغة CSV بنجاح.');
    } catch (err: any) {
      showNotification('error', err.message || 'فشل تصدير الجدول.');
    }
  };

  const handleAddSlotClick = (day: DayOfWeek, periodId: string) => {
    if (!canCreate) return;
    setDefaultSlot({ day, periodId });
    setEditingLesson(null);
    setIsLessonModalOpen(true);
  };

  const handleEditLessonClick = (entry: PopulatedTimetableEntry) => {
    if (!canEdit) return;
    setEditingLesson(entry);
    setDefaultSlot(null);
    setIsLessonModalOpen(true);
  };

  const handleMoveLessonClick = (entry: PopulatedTimetableEntry) => {
    if (!canEdit) return;
    setMovingEntry(entry);
    setIsMoveModalOpen(true);
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t('nav.timetable') || 'الجداول المدرسية وتوزيع الحصص'}
                </h1>
                <Badge variant="primary" size="sm">
                  المرحلة 7 (Phase 7)
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تسكين الحصص الأسبوعية، كشف التعارضات الذري، إدارة الفترات والقاعات، واعتماد الجداول
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {canManagePeriods && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPeriodModalOpen(true)}
                leftIcon={<Clock className="w-3.5 h-3.5 text-indigo-500" />}
              >
                الفترات والحصص
              </Button>
            )}

            {canManageRooms && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRoomModalOpen(true)}
                leftIcon={<Building2 className="w-3.5 h-3.5 text-emerald-500" />}
              >
                القاعات والمعامل
              </Button>
            )}

            {canExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                leftIcon={<Download className="w-3.5 h-3.5 text-slate-500" />}
              >
                تصدير CSV
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVerificationModalOpen(true)}
              className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            >
              دليل التحقق (25 فحصاً)
            </Button>

            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingLesson(null);
                  setDefaultSlot(null);
                  setIsLessonModalOpen(true);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                تسكين حصة جديدة
              </Button>
            )}
          </div>
        </div>

        {/* Global Context Pickers: Branch & Academic Year */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Branch Selector (Available to SuperAdmin or multi-branch managers) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                الفرع:
              </span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                disabled={!isSuperAdmin && accessibleBranches.length <= 1}
                className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {language === 'ar' ? b.nameAr : b.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                العام الدراسي:
              </span>
              <select
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {branchYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.nameAr} {y.isCurrent ? '⭐ (الحالي)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Modes Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-medium">
            <button
              onClick={() => setViewMode('class')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'class'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>جدول الفصل</span>
            </button>

            <button
              onClick={() => setViewMode('teacher')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'teacher'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>جدول المعلم</span>
            </button>

            <button
              onClick={() => setViewMode('room')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'room'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>جدول القاعة</span>
            </button>

            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'overview'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>إحصائيات الفرع</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Target Selector Toolbar per View Mode */}
      {viewMode === 'class' && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              اختر الفصل الدراسي:
            </span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[200px]"
            >
              {branchClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nameAr} ({cls.classCode})
                </option>
              ))}
            </select>
            {classStatusBadge}
          </div>

          {/* Class Actions: Publish, Unpublish, Copy */}
          <div className="flex items-center gap-2">
            {canPublish && (
              <>
                {!isClassPublished ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handlePublishClass}
                    disabled={classEntries.length === 0}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    اعتماد ونشر الجدول
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUnpublishClass}
                    className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    إلغاء النشر (تحويل لمسودة)
                  </Button>
                )}
              </>
            )}

            {canCreate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCopyModalOpen(true)}
                disabled={classEntries.length === 0}
                leftIcon={<Copy className="w-3.5 h-3.5 text-purple-600" />}
              >
                نسخ الجدول لفصل آخر
              </Button>
            )}
          </div>
        </div>
      )}

      {viewMode === 'teacher' && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              اختر المعلم لعرض جدول حصصه:
            </span>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[240px]"
            >
              {branchTeachers.map((tch) => (
                <option key={tch.id} value={tch.id}>
                  {tch.fullNameAr} ({tch.teacherNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span>
              إجمالي الحصص المجدولة للمعلم:{' '}
              <strong className="text-blue-600 dark:text-blue-400 font-bold">
                {currentViewEntries.length} حصة أسبوعياً
              </strong>
            </span>
          </div>
        </div>
      )}

      {viewMode === 'room' && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              اختر القاعة أو المعمل:
            </span>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[240px]"
            >
              {branchRooms.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  {rm.nameAr} [{rm.roomCode}] - سعة {rm.capacity} طالب
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span>
              نسبة إشغال القاعة:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                {currentViewEntries.length} حصة مجدولة
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Main Timetable Weekly Grid (for class, teacher, and room views) */}
      {viewMode !== 'overview' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 w-36 border-e border-slate-200 dark:border-slate-700">
                    الحصة والتوقيت
                  </th>
                  {activeDays.map((day) => (
                    <th
                      key={day}
                      className="py-3 px-4 text-center text-xs font-bold text-slate-800 dark:text-slate-200 border-e border-slate-200 dark:border-slate-700 last:border-e-0"
                    >
                      <div className="font-bold">{DAYS_MAP[day]?.ar}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{DAYS_MAP[day]?.en}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {branchPeriods.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeDays.length + 1}
                      className="py-12 text-center text-slate-400 text-xs"
                    >
                      لا توجد فترات دراسية معرفة لهذا الفرع. يرجى إضافة الفترات والحصص من زر "الفترات والحصص".
                    </td>
                  </tr>
                ) : (
                  branchPeriods.map((period) => {
                    const isBreak = period.isBreak;

                    if (isBreak) {
                      return (
                        <tr
                          key={period.id}
                          className="bg-amber-50/60 dark:bg-amber-950/20 border-y border-amber-200/70 dark:border-amber-800/50"
                        >
                          <td className="py-3 px-4 border-e border-amber-200/70 dark:border-amber-800/50 font-semibold text-xs text-amber-900 dark:text-amber-200">
                            <div className="flex items-center gap-1.5">
                              <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>{period.nameAr}</span>
                            </div>
                            <div className="text-[10px] text-amber-700/80 dark:text-amber-400 font-mono mt-0.5">
                              {period.startTime} - {period.endTime} ({period.durationMinutes} دقيقة)
                            </div>
                          </td>
                          <td
                            colSpan={activeDays.length}
                            className="py-2.5 px-4 text-center text-xs text-amber-800 dark:text-amber-300 font-medium"
                          >
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px]">
                              <span>🚫 فترة استراحة / فسحة / صلاة — لا يتم تسكين حصص أكاديمية</span>
                            </span>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={period.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
                        {/* Period Column */}
                        <td className="py-3 px-4 border-e border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40">
                          <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            {period.nameAr}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {period.startTime} - {period.endTime}
                          </div>
                        </td>

                        {/* Day Slots */}
                        {activeDays.map((day) => {
                          const slotEntry = currentViewEntries.find(
                            (e) => e.dayOfWeek === day && e.periodId === period.id
                          );

                          return (
                            <td
                              key={`${day}-${period.id}`}
                              className="py-2.5 px-2.5 border-e border-slate-200 dark:border-slate-800 last:border-e-0 align-top min-w-[150px]"
                            >
                              {slotEntry ? (
                                <div className="group relative p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 shadow-2xs hover:shadow-sm transition-all">
                                  {/* Subject & Code */}
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <span className="font-bold text-xs text-blue-950 dark:text-blue-200 leading-tight">
                                      {slotEntry.subjectNameAr}
                                    </span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                        slotEntry.status === 'PUBLISHED'
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      }`}
                                    >
                                      {slotEntry.status === 'PUBLISHED' ? 'معتمد' : 'مسودة'}
                                    </span>
                                  </div>

                                  {/* Context Details based on viewMode */}
                                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                                    {viewMode !== 'teacher' && (
                                      <div className="flex items-center gap-1">
                                        <UserCheck className="w-3 h-3 text-slate-400" />
                                        <span className="truncate">{slotEntry.teacherNameAr}</span>
                                      </div>
                                    )}

                                    {viewMode !== 'class' && (
                                      <div className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300">
                                        <School className="w-3 h-3 text-blue-500" />
                                        <span>{slotEntry.classNameAr}</span>
                                      </div>
                                    )}

                                    {slotEntry.roomCode && (
                                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                        <Building2 className="w-3 h-3 text-slate-400" />
                                        <span>{slotEntry.roomCode}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Quick Action Overlay on Hover */}
                                  {(canEdit || canDelete) && (
                                    <div className="mt-2 pt-1.5 border-t border-blue-200/60 dark:border-blue-900/60 flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                      {canEdit && (
                                        <button
                                          onClick={() => handleMoveLessonClick(slotEntry)}
                                          title="نقل الحصة إلى موعد آخر"
                                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                        >
                                          <MoveRight className="w-3.5 h-3.5" />
                                        </button>
                                      )}

                                      {canEdit && (
                                        <button
                                          onClick={() => handleEditLessonClick(slotEntry)}
                                          title="تعديل بيانات الحصة"
                                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}

                                      {canDelete && (
                                        <button
                                          onClick={() => handleDeleteLesson(slotEntry.id)}
                                          title="حذف الحصة من الجدول"
                                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddSlotClick(day, period.id)}
                                  disabled={!canCreate || viewMode !== 'class'}
                                  className={`w-full h-16 rounded-xl border border-dashed flex flex-col items-center justify-center transition-all ${
                                    canCreate && viewMode === 'class'
                                      ? 'border-slate-300 dark:border-slate-700/80 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-slate-400 hover:text-blue-600 cursor-pointer'
                                      : 'border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-default'
                                  }`}
                                >
                                  {canCreate && viewMode === 'class' ? (
                                    <>
                                      <Plus className="w-4 h-4 mb-0.5" />
                                      <span className="text-[10px] font-medium">تسكين حصة</span>
                                    </>
                                  ) : (
                                    <span className="text-[11px] text-slate-300 dark:text-slate-700">شاغر</span>
                                  )}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class View Extra: Weekly Subject Load Breakdown Card */}
      {viewMode === 'class' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  متابعة النصاب الأسبوعي لمواد الفصل ({selectedClass?.nameAr})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  مقارنة الحصص المجدولة فعلياً مع النصاب المعتمد في الخطة الدراسية
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                إجمالي الحصص المجدولة:{' '}
                <strong className="text-blue-600 dark:text-blue-400">{classEntries.length} حصة</strong>
              </span>
            </div>
          </div>

          {subjectLoads.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              لم يتم ربط مواد دراسية بالمرحلة الدراسية لهذا الفصل في الهيكل الأكاديمي.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjectLoads.map((load) => {
                const percent = Math.min(
                  100,
                  Math.round((load.scheduledPeriods / (load.requiredPeriods || 1)) * 100)
                );

                return (
                  <div
                    key={load.subjectId}
                    className="p-3.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {load.subjectNameAr}
                      </span>
                      {load.status === 'COMPLETE' ? (
                        <Badge variant="success" size="sm">مكتمل ({load.scheduledPeriods}/{load.requiredPeriods})</Badge>
                      ) : load.status === 'EXCESS' ? (
                        <Badge variant="danger" size="sm">تجاوز ({load.scheduledPeriods}/{load.requiredPeriods})</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">متبقي {load.remainingPeriods} حصص</Badge>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          load.status === 'COMPLETE'
                            ? 'bg-emerald-500'
                            : load.status === 'EXCESS'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>المطلوب: {load.requiredPeriods} حصص</span>
                      <span>المجدول: {load.scheduledPeriods} حصص</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Overview Analytics View */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                إجمالي الحصص المسكنة بالفرع
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {entries.filter((e) => e.branchId === selectedBranchId).length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">حصة مسكنة في التقويم الأسبوعي</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                الحصص المعتمدة والمنشورة
              </span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {entries.filter((e) => e.branchId === selectedBranchId && e.status === 'PUBLISHED').length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">حصة معتمدة للطلاب والمعلمين</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                الحصص قيد المسودة
              </span>
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {entries.filter((e) => e.branchId === selectedBranchId && e.status === 'DRAFT').length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">بانتظار الاعتماد والنشر</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                القاعات والمعامل المشغولة
              </span>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {branchRooms.length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">قاعة مسجلة بنظام الفرع</span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <LessonModal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        branchId={selectedBranchId}
        academicYearId={selectedYearId}
        defaultClassId={selectedClassId}
        defaultDay={defaultSlot?.day}
        defaultPeriodId={defaultSlot?.periodId}
        editingEntry={editingLesson}
        onSuccess={() => {
          showNotification('success', editingLesson ? 'تم تعديل الحصة بنجاح.' : 'تم تسكين الحصة بنجاح.');
        }}
      />

      <PeriodModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        branchId={selectedBranchId}
      />

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        branchId={selectedBranchId}
      />

      <CopyTimetableModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        branchId={selectedBranchId}
        academicYearId={selectedYearId}
        sourceClassId={selectedClassId}
        onSuccess={() => {
          showNotification('success', 'تم نسخ الجدول بنجاح.');
        }}
      />

      <MoveLessonModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        entry={movingEntry}
        onSuccess={() => {
          showNotification('success', 'تم نقل الحصة بنجاح بعد التحقق من التعارضات.');
        }}
      />

      <Phase7VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />
    </div>
  );
};
