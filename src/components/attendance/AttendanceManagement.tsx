import React, { useState, useMemo, useEffect } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { useBranch } from '../../context/BranchContext';
import { useAcademic } from '../../context/AcademicContext';
import { useStudents } from '../../context/StudentContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTimetable } from '../../context/TimetableContext';
import {
  AttendanceType,
  AttendanceStatus,
  AbsenceReasonCode,
  StudentAttendanceRow,
  PopulatedAttendanceRecord,
  AttendanceSession,
} from '../../types/attendance';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { AttendanceCorrectionModal } from './AttendanceCorrectionModal';
import { Phase8VerificationModal } from './Phase8VerificationModal';
import {
  ClipboardCheck,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
  FileSpreadsheet,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  BookOpen,
  School,
  Building2,
  GraduationCap,
  Sparkles,
  TrendingUp,
  UserCheck,
  Layers,
} from 'lucide-react';

const REASON_OPTIONS: { value: AbsenceReasonCode; labelAr: string; labelEn: string }[] = [
  { value: 'MEDICAL', labelAr: 'تقرير طبي معتمد', labelEn: 'Medical Report' },
  { value: 'FAMILY_EMERGENCY', labelAr: 'ظرف أسري طارئ', labelEn: 'Family Emergency' },
  { value: 'OFFICIAL_PERMISSION', labelAr: 'إذن رسمي مسبق', labelEn: 'Official Permission' },
  { value: 'WEATHER_CONDITION', labelAr: 'تقلبات جوية', labelEn: 'Weather Conditions' },
  { value: 'TRANSPORTATION', labelAr: 'عطل مواصلات / حافلة', labelEn: 'Transportation' },
  { value: 'UNEXCUSED', labelAr: 'غياب بدون عذر', labelEn: 'Unexcused Absence' },
  { value: 'OTHER', labelAr: 'أسباب أخرى', labelEn: 'Other Reasons' },
];

export const AttendanceManagement: React.FC = () => {
  const { language, direction } = useLanguage();
  const { currentUser, hasPermission } = useAuth();
  const { activeBranchId, branches, isAllBranches } = useBranch();
  const { years: academicYears, classes, stages, grades } = useAcademic();
  const { students: allStudents } = useStudents();
  const { entries: timetableEntries, periods } = useTimetable();

  const {
    records,
    sessions,
    isLoading,
    refreshData,
    getClassRosterWithAttendance,
    saveClassAttendance,
    lockAttendance,
    unlockAttendance,
    deleteAttendanceRecord,
    getStudentAttendanceSummary,
    getClassAttendanceDashboard,
    exportCSV,
  } = useAttendance();

  // Navigation tab state: 'roster' | 'overview' | 'records' | 'student_profile' | 'reports'
  const [activeTab, setActiveTab] = useState<'roster' | 'overview' | 'records' | 'student_profile' | 'reports'>('roster');

  // Branch Selection
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    if (activeBranchId && activeBranchId !== 'all') return activeBranchId;
    return branches[0]?.id || 'branch-riyadh';
  });

  useEffect(() => {
    if (activeBranchId && activeBranchId !== 'all') {
      setSelectedBranchId(activeBranchId);
    }
  }, [activeBranchId]);

  // Selected Date
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Tab 1 (Roster) Form State
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('DAILY');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [selectedTimetableEntryId, setSelectedTimetableEntryId] = useState<string>('');

  // Roster Data
  const [rosterStudents, setRosterStudents] = useState<StudentAttendanceRow[]>([]);
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [rosterSearch, setRosterSearch] = useState<string>('');

  // Tab 3 (Records Log) Filters
  const [recordClassFilter, setRecordClassFilter] = useState<string>('all');
  const [recordStatusFilter, setRecordStatusFilter] = useState<string>('all');
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>('all');
  const [recordSearch, setRecordSearch] = useState<string>('');

  // Tab 4 (Student Profile) State
  const [profileStudentId, setProfileStudentId] = useState<string>('');

  // Modals State
  const [correctionRecord, setCorrectionRecord] = useState<PopulatedAttendanceRecord | null>(null);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState<boolean>(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState<boolean>(false);

  // Filter available classes by selected branch
  const branchClasses = useMemo(() => {
    return classes.filter((c) => c.branchId === selectedBranchId && c.status === 'active');
  }, [classes, selectedBranchId]);

  // Filter available academic years by selected branch
  const branchYears = useMemo(() => {
    return academicYears.filter((y) => y.branchId === selectedBranchId);
  }, [academicYears, selectedBranchId]);

  // Set default Academic Year & Class when branch changes
  useEffect(() => {
    if (branchYears.length > 0 && !branchYears.some((y) => y.id === selectedAcademicYearId)) {
      const activeYear = branchYears.find((y) => y.isCurrent) || branchYears[0];
      setSelectedAcademicYearId(activeYear.id);
    }
  }, [branchYears, selectedAcademicYearId]);

  useEffect(() => {
    if (branchClasses.length > 0 && !branchClasses.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(branchClasses[0].id);
    }
  }, [branchClasses, selectedClassId]);

  // Timetable Lessons for this class
  const classTimetableEntries = useMemo(() => {
    if (!selectedClassId) return [];
    return timetableEntries.filter((e) => e.classId === selectedClassId);
  }, [timetableEntries, selectedClassId]);

  const branchPeriods = useMemo(() => {
    return periods.filter((p) => p.branchId === selectedBranchId && !p.isBreak && p.status === 'active');
  }, [periods, selectedBranchId]);

  // Load Class Roster when Class/Date/Type/Period changes
  const loadRoster = () => {
    if (!selectedClassId || !selectedAcademicYearId || !selectedBranchId) return;
    try {
      setSaveErrorMsg(null);
      const res = getClassRosterWithAttendance({
        branchId: selectedBranchId,
        academicYearId: selectedAcademicYearId,
        classId: selectedClassId,
        date: selectedDate,
        type: attendanceType,
        timetableEntryId: attendanceType === 'LESSON' ? selectedTimetableEntryId || undefined : undefined,
        periodId: attendanceType === 'LESSON' ? selectedPeriodId || undefined : undefined,
      });

      setRosterStudents(res.students);
      setCurrentSession(res.session);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'حدث خطأ أثناء تحميل قائمة الطلاب.');
    }
  };

  useEffect(() => {
    loadRoster();
  }, [
    selectedBranchId,
    selectedAcademicYearId,
    selectedClassId,
    selectedDate,
    attendanceType,
    selectedPeriodId,
    selectedTimetableEntryId,
  ]);

  // Quick Date Navigation
  const changeDateByDays = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Status Change in Roster
  const handleStudentStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setRosterStudents((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;

        let checkInTime = s.checkInTime;
        let checkOutTime = s.checkOutTime;
        let lateMinutes = s.lateMinutes;

        if (newStatus === 'PRESENT' && !checkInTime) {
          checkInTime = '07:30';
        } else if (newStatus === 'LATE') {
          if (!checkInTime) checkInTime = '07:45';
          if (!lateMinutes) lateMinutes = 15;
        } else if (newStatus === 'EARLY_DEPARTURE') {
          if (!checkOutTime) checkOutTime = '12:00';
        }

        return {
          ...s,
          status: newStatus,
          checkInTime,
          checkOutTime,
          lateMinutes,
        };
      })
    );
  };

  // Mark All Helper
  const handleMarkAll = (status: AttendanceStatus) => {
    setRosterStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status,
        checkInTime: status === 'PRESENT' ? '07:30' : undefined,
        checkOutTime: undefined,
        lateMinutes: undefined,
      }))
    );
  };

  // Reset Roster
  const handleResetRoster = () => {
    loadRoster();
  };

  // Save Attendance Action
  const handleSaveAttendance = async (submitAndLock: boolean = false) => {
    if (!selectedClassId || !selectedAcademicYearId || !selectedBranchId) return;

    try {
      setIsSaving(true);
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);

      const recordsToSave = rosterStudents
        .filter((s) => s.status !== 'NOT_RECORDED')
        .map((s) => ({
          studentId: s.studentId,
          status: s.status as AttendanceStatus,
          checkInTime: s.checkInTime,
          checkOutTime: s.checkOutTime,
          lateMinutes: s.lateMinutes,
          reasonCode: s.reasonCode,
          note: s.note,
        }));

      if (recordsToSave.length === 0) {
        throw new Error('يرجى تحديد حالة الحضور لطالب واحد على الأقل قبل الحفظ.');
      }

      const res = await saveClassAttendance({
        branchId: selectedBranchId,
        academicYearId: selectedAcademicYearId,
        classId: selectedClassId,
        date: selectedDate,
        type: attendanceType,
        timetableEntryId: attendanceType === 'LESSON' ? selectedTimetableEntryId || undefined : undefined,
        periodId: attendanceType === 'LESSON' ? selectedPeriodId || undefined : undefined,
        records: recordsToSave,
        submitAndLock,
      });

      setCurrentSession(res.session);
      setSaveSuccessMsg(
        submitAndLock
          ? 'تم اعتماد وإقفال سجل الحضور رسمياً بنجاح.'
          : `تم حفظ سجل حضور ${res.savedCount} طالباً بنجاح.`
      );
      loadRoster();
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'فشل في حفظ الحضور.');
    } finally {
      setIsSaving(false);
    }
  };

  // Lock / Unlock Session
  const handleToggleLock = async () => {
    if (!selectedClassId || !selectedBranchId) return;
    try {
      setIsSaving(true);
      setSaveErrorMsg(null);

      if (currentSession?.status === 'LOCKED') {
        const res = await unlockAttendance({
          branchId: selectedBranchId,
          classId: selectedClassId,
          date: selectedDate,
          type: attendanceType,
          periodId: attendanceType === 'LESSON' ? selectedPeriodId || undefined : undefined,
        });
        setCurrentSession(res);
        setSaveSuccessMsg('تم إلغاء قفل سجل الحضور، وأصبح قابلاً للتعديل الآن.');
      } else {
        const res = await lockAttendance({
          branchId: selectedBranchId,
          classId: selectedClassId,
          date: selectedDate,
          type: attendanceType,
          periodId: attendanceType === 'LESSON' ? selectedPeriodId || undefined : undefined,
        });
        setCurrentSession(res);
        setSaveSuccessMsg('تم قفل جلسة الحضور بنجاح.');
      }
      loadRoster();
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'فشل في تعديل حالة القفل.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    try {
      const csv = exportCSV({
        branchId: selectedBranchId,
        date: selectedDate,
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_${selectedBranchId}_${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'فشل تصدير ملف CSV.');
    }
  };

  // Branch Daily Summary for Stats Card
  const dailySummary = useMemo(() => {
    return getClassAttendanceDashboard(selectedBranchId, selectedDate);
  }, [selectedBranchId, selectedDate, records, sessions]);

  const totalEnrolledToday = dailySummary.reduce((acc, c) => acc + c.totalStudents, 0);
  const totalPresentToday = dailySummary.reduce((acc, c) => acc + c.presentCount, 0);
  const totalAbsentToday = dailySummary.reduce((acc, c) => acc + c.absentCount, 0);
  const totalLateToday = dailySummary.reduce((acc, c) => acc + c.lateCount, 0);
  const totalExcusedToday = dailySummary.reduce((acc, c) => acc + c.excusedCount, 0);
  const totalRecordedToday = dailySummary.reduce((acc, c) => acc + c.recordedCount, 0);

  const overallDailyRate = totalRecordedToday > 0 ? Math.round((totalPresentToday / totalRecordedToday) * 100) : 100;

  // Filtered Roster by Search
  const filteredRoster = useMemo(() => {
    if (!rosterSearch.trim()) return rosterStudents;
    const q = rosterSearch.toLowerCase();
    return rosterStudents.filter(
      (s) =>
        s.fullNameAr.toLowerCase().includes(q) ||
        s.fullNameEn.toLowerCase().includes(q) ||
        s.studentIdNumber.toLowerCase().includes(q)
    );
  }, [rosterStudents, rosterSearch]);

  // Tab 3 Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (r.branchId !== selectedBranchId) return false;
      if (recordClassFilter !== 'all' && r.classId !== recordClassFilter) return false;
      if (recordStatusFilter !== 'all' && r.status !== recordStatusFilter) return false;
      if (recordTypeFilter !== 'all' && r.type !== recordTypeFilter) return false;
      if (recordSearch.trim()) {
        const q = recordSearch.toLowerCase();
        const matchesName = r.studentNameAr.toLowerCase().includes(q) || r.studentNameEn.toLowerCase().includes(q);
        const matchesNum = r.studentIdNumber.toLowerCase().includes(q);
        if (!matchesName && !matchesNum) return false;
      }
      return true;
    });
  }, [records, selectedBranchId, recordClassFilter, recordStatusFilter, recordTypeFilter, recordSearch]);

  // Tab 4 Student Profile
  const selectedStudentDetail = useMemo(() => {
    if (!profileStudentId) return null;
    return allStudents.find((s) => s.id === profileStudentId) || null;
  }, [allStudents, profileStudentId]);

  const studentProfileSummary = useMemo(() => {
    if (!profileStudentId) return null;
    try {
      return getStudentAttendanceSummary(profileStudentId);
    } catch {
      return null;
    }
  }, [profileStudentId, records]);

  const isSessionLocked = currentSession?.status === 'LOCKED';
  const canUnlock = hasPermission('attendance.unlock') || (currentUser && currentUser.roleCode === 'SUPER_ADMIN');

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-800 text-white shadow-sm relative overflow-hidden">
        <div className="absolute -end-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <ClipboardCheck className="w-4 h-4 text-emerald-300" />
              <span>نظام إدارة المدارس — المرحلة 8 (Phase 8: Attendance & Absences)</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              منظومة رصد الحضور والغياب المتقدمة
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl">
              رصد الحضور اليومي وحصص الجدول الدراسي، تدقيق الغياب والأعذار، القفل الإداري للسجلات، والتصحيح الموثق بسجل التدقيق.
            </p>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-300" />
              <span>تصدير CSV</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsVerificationOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              <span>فحص واختبار المرحلة 8 (28 فحص)</span>
            </Button>
          </div>
        </div>

        {/* Date & Branch Global Selector Bar */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Branch Picker */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-200" />
            <span className="text-blue-200 font-medium">الفرع الحالي:</span>
            {isAllBranches ? (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-white/15 border border-white/25 rounded-lg px-2.5 py-1 text-white font-semibold focus:outline-none"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="text-slate-900">
                    {language === 'ar' ? b.nameAr : b.nameEn}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold bg-white/20 px-2.5 py-1 rounded-lg">
                {branches.find((b) => b.id === selectedBranchId)?.nameAr || selectedBranchId}
              </span>
            )}
          </div>

          {/* Date Picker & Quick Nav */}
          <div className="flex items-center gap-1.5 bg-white/10 rounded-xl p-1 border border-white/15">
            <button
              onClick={() => changeDateByDays(-1)}
              title="اليوم السابق"
              className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              {direction === 'rtl' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-mono font-semibold px-2 py-0.5 focus:outline-none"
            />
            <button
              onClick={() => changeDateByDays(1)}
              title="اليوم التالي"
              className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              {direction === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium text-[11px] transition-colors"
            >
              اليوم
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Summary Metric Cards for Selected Date */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>نسبة الحضور اليوم</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
            {overallDailyRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {totalRecordedToday} من إجمالي {totalEnrolledToday} مرصود
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>الطلاب الحاضرون</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {totalPresentToday}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            حضور منتظم في الموعد
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>الغياب والغياب بعذر</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
            {totalAbsentToday + totalExcusedToday}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {totalExcusedToday} بعذر • {totalAbsentToday} بدون عذر
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>المتأخرون والخروج المبكر</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {totalLateToday}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            تأخر مسجل مع دقائق التأخر
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>اكتمال رصد الفصول</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
            {dailySummary.filter((c) => c.isCompleted).length} / {dailySummary.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {dailySummary.filter((c) => c.sessionStatus === 'LOCKED').length} فصل مقفل ومعتمد
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'roster', label: 'رصد الحضور (Roll Call)', icon: ClipboardCheck },
          { id: 'overview', label: 'المتابعة اليومية للفصول', icon: Layers },
          { id: 'records', label: 'سجل الحضور والعمليات', icon: BookOpen },
          { id: 'student_profile', label: 'ملف حضور الطالب', icon: UserCheck },
          { id: 'reports', label: 'التقارير والتصدير CSV', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ROSTER / ROLL CALL */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Class, Academic Year & Mode Selector Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Academic Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  العام الأكاديمي
                </label>
                <select
                  value={selectedAcademicYearId}
                  onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {branchYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {language === 'ar' ? y.nameAr : y.nameEn} {y.isCurrent ? '★ (الحالي)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  الفصل الدراسي
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  {branchClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {language === 'ar' ? c.nameAr : c.nameEn} ({c.classCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Toggle: Daily vs Lesson Attendance */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نوع الرصد
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setAttendanceType('DAILY');
                      setSelectedPeriodId('');
                      setSelectedTimetableEntryId('');
                    }}
                    className={`px-2 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                      attendanceType === 'DAILY'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    حضور يومي شامل
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAttendanceType('LESSON');
                      if (branchPeriods.length > 0 && !selectedPeriodId) {
                        setSelectedPeriodId(branchPeriods[0].id);
                      }
                    }}
                    className={`px-2 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                      attendanceType === 'LESSON'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    حصة دراسية بالجدول
                  </button>
                </div>
              </div>

              {/* Timetable Lesson / Period Selector (if LESSON mode) */}
              {attendanceType === 'LESSON' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    فترة الحصة بالجدول
                  </label>
                  <select
                    value={selectedPeriodId}
                    onChange={(e) => {
                      setSelectedPeriodId(e.target.value);
                      const entry = classTimetableEntries.find((te) => te.periodId === e.target.value);
                      if (entry) setSelectedTimetableEntryId(entry.id);
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {branchPeriods.map((p) => {
                      const matchedEntry = classTimetableEntries.find((te) => te.periodId === p.id);
                      return (
                        <option key={p.id} value={p.id}>
                          {language === 'ar' ? p.nameAr : p.nameEn} ({p.startTime} - {p.endTime})
                          {matchedEntry ? ` [مجدول: ${matchedEntry.id}]` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div className="flex items-end">
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl w-full">
                    رصد الحضور الصباحي اليومي المعتمد للفصل كاملاً
                  </div>
                </div>
              )}
            </div>

            {/* Session Status & Quick Action Controls Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
              {/* Session State Badge */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">حالة الجلسة:</span>
                  {isSessionLocked ? (
                    <Badge variant="danger" size="md">
                      <Lock className="w-3.5 h-3.5 mr-1 inline" />
                      مقفل رسمياً (LOCKED)
                    </Badge>
                  ) : currentSession?.status === 'SUBMITTED' ? (
                    <Badge variant="info" size="md">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
                      معتمد ومرفوع (SUBMITTED)
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="md">
                      مسودة مفتوحة (OPEN)
                    </Badge>
                  )}
                </div>

                {currentSession?.submittedByName && (
                  <span className="text-xs text-slate-500 font-mono">
                    بواسطة: {currentSession.submittedByName}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll('PRESENT')}
                  disabled={isSessionLocked}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                  <span>الكل حاضر</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll('ABSENT')}
                  disabled={isSessionLocked}
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-500 mr-1" />
                  <span>الكل غائب</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetRoster}
                  disabled={isSaving}
                >
                  إعادة ضبط
                </Button>

                {!isSessionLocked ? (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={isSaving}
                      onClick={() => handleSaveAttendance(false)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      حفظ الحضور
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={isSaving}
                      onClick={() => handleSaveAttendance(true)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Lock className="w-3.5 h-3.5 mr-1" />
                      حفظ وإقفال السجل
                    </Button>
                  </>
                ) : (
                  canUnlock && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isLoading={isSaving}
                      onClick={handleToggleLock}
                      className="border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50"
                    >
                      <Unlock className="w-3.5 h-3.5 mr-1" />
                      إلغاء قفل الجلسة
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Notification Messages */}
            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
                <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
                  ✕
                </button>
              </div>
            )}
            {saveErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{saveErrorMsg}</span>
                </div>
                <button onClick={() => setSaveErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Student Roster Table Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xs space-y-3">
            {/* Search inside Roster */}
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>قائمة طلاب الفصل المقيدين ({filteredRoster.length} طالباً)</span>
              </div>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم الطالب أو رقمه..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full text-xs ps-8 pe-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Roster Items */}
            {filteredRoster.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                لا يوجد طلاب مسجلون بهذا الفصل في العام الأكاديمي المحدد.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRoster.map((student, idx) => {
                  const isPresent = student.status === 'PRESENT';
                  const isAbsent = student.status === 'ABSENT';
                  const isLate = student.status === 'LATE';
                  const isExcused = student.status === 'EXCUSED';
                  const isEarly = student.status === 'EARLY_DEPARTURE';

                  return (
                    <div
                      key={student.studentId}
                      className={`
                        p-3 rounded-xl border text-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3
                        ${
                          student.status === 'NOT_RECORDED'
                            ? 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30'
                            : isPresent
                            ? 'border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/30 dark:bg-emerald-950/20'
                            : isAbsent
                            ? 'border-rose-200 dark:border-rose-900/70 bg-rose-50/30 dark:bg-rose-950/20'
                            : isLate
                            ? 'border-amber-200 dark:border-amber-900/70 bg-amber-50/30 dark:bg-amber-950/20'
                            : isExcused
                            ? 'border-indigo-200 dark:border-indigo-900/70 bg-indigo-50/30 dark:bg-indigo-950/20'
                            : 'border-purple-200 dark:border-purple-900/70 bg-purple-50/30 dark:bg-purple-950/20'
                        }
                      `}
                    >
                      {/* Student Info */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <span className="font-mono text-slate-400 text-[11px] font-bold w-6">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {language === 'ar' ? student.fullNameAr : student.fullNameEn}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {student.studentIdNumber}
                          </div>
                        </div>
                      </div>

                      {/* Status Selector Pills */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isSessionLocked}
                          onClick={() => handleStudentStatusChange(student.studentId, 'PRESENT')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                            isPresent
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                          }`}
                        >
                          حاضر
                        </button>
                        <button
                          type="button"
                          disabled={isSessionLocked}
                          onClick={() => handleStudentStatusChange(student.studentId, 'ABSENT')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                            isAbsent
                              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50'
                          }`}
                        >
                          غائب
                        </button>
                        <button
                          type="button"
                          disabled={isSessionLocked}
                          onClick={() => handleStudentStatusChange(student.studentId, 'LATE')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                            isLate
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-amber-50'
                          }`}
                        >
                          متأخر
                        </button>
                        <button
                          type="button"
                          disabled={isSessionLocked}
                          onClick={() => handleStudentStatusChange(student.studentId, 'EXCUSED')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                            isExcused
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50'
                          }`}
                        >
                          بعذر
                        </button>
                        <button
                          type="button"
                          disabled={isSessionLocked}
                          onClick={() => handleStudentStatusChange(student.studentId, 'EARLY_DEPARTURE')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                            isEarly
                              ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-50'
                          }`}
                        >
                          خروج مبكر
                        </button>
                      </div>

                      {/* Detail inputs based on status */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isLate && (
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-400">تأخر:</span>
                            <input
                              type="number"
                              min="0"
                              max="240"
                              disabled={isSessionLocked}
                              value={student.lateMinutes || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setRosterStudents((prev) =>
                                  prev.map((s) => (s.studentId === student.studentId ? { ...s, lateMinutes: val } : s))
                                );
                              }}
                              placeholder="دقائق"
                              className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                            <span className="text-[11px] text-slate-400">دقيقة</span>
                          </div>
                        )}

                        {(isAbsent || isExcused || isLate || isEarly) && (
                          <select
                            disabled={isSessionLocked}
                            value={student.reasonCode || ''}
                            onChange={(e) => {
                              const val = e.target.value as AbsenceReasonCode;
                              setRosterStudents((prev) =>
                                prev.map((s) => (s.studentId === student.studentId ? { ...s, reasonCode: val } : s))
                              );
                            }}
                            className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                          >
                            <option value="">-- سبب العذر --</option>
                            {REASON_OPTIONS.map((r) => (
                              <option key={r.value} value={r.value}>
                                {language === 'ar' ? r.labelAr : r.labelEn}
                              </option>
                            ))}
                          </select>
                        )}

                        <input
                          type="text"
                          disabled={isSessionLocked}
                          value={student.note || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRosterStudents((prev) =>
                              prev.map((s) => (s.studentId === student.studentId ? { ...s, note: val } : s))
                            );
                          }}
                          placeholder="ملاحظة..."
                          className="w-32 sm:w-44 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DAILY CLASS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  لوحة المتابعة الشاملة لجميع الفصول — تاريخ {selectedDate}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  توضح حالة رصد كل فصل في الفرع المحدد، ومعدلات الحضور، وإمكانية الانتقال الفوري لرصد الحضور.
                </div>
              </div>
            </div>

            {dailySummary.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                لا توجد فصول دراسية معرفة في هذا الفرع.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dailySummary.map((cls) => {
                  const rate = cls.recordedCount > 0 ? Math.round((cls.presentCount / cls.recordedCount) * 100) : 0;
                  return (
                    <div
                      key={cls.classId}
                      className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-2xs hover:shadow-xs transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {cls.classNameAr}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {cls.stageNameAr} • {cls.gradeNameAr}
                          </div>
                        </div>

                        {cls.sessionStatus === 'LOCKED' ? (
                          <Badge variant="danger" size="sm">
                            <Lock className="w-3 h-3 mr-1 inline" />
                            مقفل
                          </Badge>
                        ) : cls.sessionStatus === 'SUBMITTED' ? (
                          <Badge variant="info" size="sm">
                            معتمد
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            مفتوح
                          </Badge>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">نسبة الحضور:</span>
                          <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {rate}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>

                      {/* Mini stats badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 font-mono">
                          الطلاب: {cls.totalStudents}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold font-mono">
                          حاضر: {cls.presentCount}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold font-mono">
                          غائب: {cls.absentCount}
                        </span>
                        {cls.lateCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono">
                            متأخر: {cls.lateCount}
                          </span>
                        )}
                      </div>

                      {/* Quick jump to roll call for this class */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {cls.isCompleted ? '✓ اكتمل الرصد' : '⚠ لم يكتمل الرصد بعد'}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClassId(cls.classId);
                            setActiveTab('roster');
                          }}
                        >
                          رصد الحضور
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RECORDS LOG & AUDITED CORRECTIONS */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xs space-y-4">
            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم الطالب أو رقمه..."
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  className="w-full text-xs ps-8 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <select
                  value={recordClassFilter}
                  onChange={(e) => setRecordClassFilter(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">كافة الفصول الدراسية</option>
                  {branchClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={recordStatusFilter}
                  onChange={(e) => setRecordStatusFilter(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">كافة حالات الحضور</option>
                  <option value="PRESENT">حاضر (Present)</option>
                  <option value="ABSENT">غائب (Absent)</option>
                  <option value="LATE">متأخر (Late)</option>
                  <option value="EXCUSED">بعذر (Excused)</option>
                  <option value="EARLY_DEPARTURE">خروج مبكر (Early)</option>
                </select>
              </div>

              <div>
                <select
                  value={recordTypeFilter}
                  onChange={(e) => setRecordTypeFilter(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">كافة أنواع الرصد (يومي وحصص)</option>
                  <option value="DAILY">حضور يومي (Daily)</option>
                  <option value="LESSON">حضور حصص الجدول (Lesson)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                    <th className="py-2.5 px-3 font-semibold text-start">التاريخ والنوع</th>
                    <th className="py-2.5 px-3 font-semibold text-start">الطالب والرقم الأكاديمي</th>
                    <th className="py-2.5 px-3 font-semibold text-start">الفصل الدراسي</th>
                    <th className="py-2.5 px-3 font-semibold text-start">الحالة</th>
                    <th className="py-2.5 px-3 font-semibold text-start">الوقت / التأخر</th>
                    <th className="py-2.5 px-3 font-semibold text-start">سبب العذر والملاحظات</th>
                    <th className="py-2.5 px-3 font-semibold text-start">الراصد والقفل</th>
                    <th className="py-2.5 px-3 font-semibold text-end">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        لا توجد سجلات حضور تطابق معايير البحث.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                            {r.date}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {r.type === 'DAILY' ? 'يومي' : `حصة (${r.periodNameAr || r.periodId})`}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {r.studentNameAr}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {r.studentIdNumber}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {r.classNameAr}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {r.status === 'PRESENT' && <Badge variant="success" size="sm">حاضر</Badge>}
                          {r.status === 'ABSENT' && <Badge variant="danger" size="sm">غائب</Badge>}
                          {r.status === 'LATE' && <Badge variant="warning" size="sm">متأخر</Badge>}
                          {r.status === 'EXCUSED' && <Badge variant="info" size="sm">بعذر</Badge>}
                          {r.status === 'EARLY_DEPARTURE' && <Badge variant="neutral" size="sm">خروج مبكر</Badge>}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          {r.checkInTime && <div>دخول: {r.checkInTime}</div>}
                          {r.lateMinutes ? <div className="text-amber-600 font-bold">{r.lateMinutes} د تأخر</div> : null}
                          {r.checkOutTime && <div>خروج: {r.checkOutTime}</div>}
                          {!r.checkInTime && !r.lateMinutes && !r.checkOutTime && '-'}
                        </td>
                        <td className="py-2.5 px-3 max-w-[200px]">
                          {r.reasonCode && (
                            <div className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                              {REASON_OPTIONS.find((ro) => ro.value === r.reasonCode)?.labelAr || r.reasonCode}
                            </div>
                          )}
                          {r.note && <div className="text-slate-500 text-[11px] truncate">"{r.note}"</div>}
                          {!r.reasonCode && !r.note && <span className="text-slate-400">-</span>}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                            {r.recordedByName || r.recordedBy}
                          </div>
                          <div>
                            {r.lockedAt ? (
                              <Badge variant="danger" size="sm">مقفل</Badge>
                            ) : (
                              <Badge variant="neutral" size="sm">مفتوح</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setCorrectionRecord(r);
                                setIsCorrectionOpen(true);
                              }}
                              title="تصحيح رسمي موثق"
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('هل أنت متأكد من حذف هذا السجل نهائياً؟')) {
                                  try {
                                    await deleteAttendanceRecord(r.id);
                                  } catch (err: any) {
                                    alert(err.message);
                                  }
                                }
                              }}
                              title="حذف"
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STUDENT ATTENDANCE PROFILE */}
      {activeTab === 'student_profile' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xs space-y-4">
            {/* Student Search & Select Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                اختر طالباً لعرض ملف الحضور التفصيلي:
              </label>
              <select
                value={profileStudentId}
                onChange={(e) => setProfileStudentId(e.target.value)}
                className="w-72 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="">-- اضغط لاختيار طالب من الفرع --</option>
                {allStudents
                  .filter((s) => s.branchId === selectedBranchId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullNameAr} ({s.studentNumber})
                    </option>
                  ))}
              </select>
            </div>

            {/* Student Profile Card & Summary Metrics */}
            {selectedStudentDetail && studentProfileSummary ? (
              <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                {/* Info Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 border border-blue-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      ملف الحضور والسلوك الأكاديمي
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedStudentDetail.fullNameAr}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      رقم القيد: {selectedStudentDetail.studentNumber} • الجنسية: {selectedStudentDetail.nationality}
                    </div>
                  </div>

                  {/* Attendance Rate Circle */}
                  <div className="flex items-center gap-3">
                    <div className="text-end">
                      <div className="text-xs text-slate-500">نسبة الالتزام بالحضور:</div>
                      <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {studentProfileSummary.stats.attendanceRate}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                    <div className="text-xs text-slate-500">إجمالي الجلسات</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                      {studentProfileSummary.stats.totalSessions}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                    <div className="text-xs text-emerald-700 dark:text-emerald-300">أيام الحضور</div>
                    <div className="text-lg font-bold text-emerald-600 font-mono mt-0.5">
                      {studentProfileSummary.stats.presentCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                    <div className="text-xs text-rose-700 dark:text-rose-300">غياب بدون عذر</div>
                    <div className="text-lg font-bold text-rose-600 font-mono mt-0.5">
                      {studentProfileSummary.stats.absentCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                    <div className="text-xs text-amber-700 dark:text-amber-300">أيام التأخر</div>
                    <div className="text-lg font-bold text-amber-600 font-mono mt-0.5">
                      {studentProfileSummary.stats.lateCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
                    <div className="text-xs text-indigo-700 dark:text-indigo-300">غياب بعذر مقبول</div>
                    <div className="text-lg font-bold text-indigo-600 font-mono mt-0.5">
                      {studentProfileSummary.stats.excusedCount}
                    </div>
                  </div>
                </div>

                {/* Chronological Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                        <th className="py-2.5 px-3 text-start">التاريخ والنوع</th>
                        <th className="py-2.5 px-3 text-start">الفصل</th>
                        <th className="py-2.5 px-3 text-start">الحالة</th>
                        <th className="py-2.5 px-3 text-start">الأوقات والتأخر</th>
                        <th className="py-2.5 px-3 text-start">السبب والملاحظات</th>
                        <th className="py-2.5 px-3 text-start">سجل التدقيق والتصحيح</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {studentProfileSummary.records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{r.date}</span>
                            <span className="text-[11px] text-slate-400 block">
                              {r.type === 'DAILY' ? 'يومي' : `حصة (${r.periodNameAr || ''})`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">{r.classNameAr}</td>
                          <td className="py-2.5 px-3">
                            {r.status === 'PRESENT' && <Badge variant="success" size="sm">حاضر</Badge>}
                            {r.status === 'ABSENT' && <Badge variant="danger" size="sm">غائب</Badge>}
                            {r.status === 'LATE' && <Badge variant="warning" size="sm">متأخر</Badge>}
                            {r.status === 'EXCUSED' && <Badge variant="info" size="sm">بعذر</Badge>}
                            {r.status === 'EARLY_DEPARTURE' && <Badge variant="neutral" size="sm">خروج مبكر</Badge>}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">
                            {r.checkInTime && <div>دخول: {r.checkInTime}</div>}
                            {r.lateMinutes ? <div className="text-amber-600 font-bold">{r.lateMinutes} د تأخر</div> : null}
                            {r.checkOutTime && <div>خروج: {r.checkOutTime}</div>}
                          </td>
                          <td className="py-2.5 px-3 max-w-[200px]">
                            {r.reasonCode && (
                              <div className="font-semibold text-slate-700 dark:text-slate-300">
                                {REASON_OPTIONS.find((ro) => ro.value === r.reasonCode)?.labelAr || r.reasonCode}
                              </div>
                            )}
                            {r.note && <div className="text-slate-500 italic truncate">"{r.note}"</div>}
                          </td>
                          <td className="py-2.5 px-3">
                            {r.history && r.history.length > 0 ? (
                              <span className="text-amber-600 font-medium text-[11px] flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                تم تصحيحه {r.history.length} مرة
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">أصلي دون تعديل</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                يرجى اختيار طالب من القائمة أعلاه لعرض سجله وإحصائيات حضوره.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS & EXPORT */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  تصدير تقارير الحضور والغياب الرسمية
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  تصدير سجلات الحضور متوافقة مع ملفات Excel بترميز UTF-8 وعلامة BOM ومسميات الأعذار المعتمدة.
                </div>
              </div>

              <Button variant="primary" size="sm" onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700">
                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                <span>تحميل ملف CSV الآن</span>
              </Button>
            </div>

            {/* Quick summary before export */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
              <div className="font-bold text-slate-700 dark:text-slate-300">مواصفات التصدير:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                <li>الفرع المختار: {branches.find((b) => b.id === selectedBranchId)?.nameAr || selectedBranchId}</li>
                <li>تاريخ الرصد: {selectedDate}</li>
                <li>إجمالي السجلات الجاهزة للتصدير: {records.filter((r) => r.branchId === selectedBranchId).length} سجل</li>
                <li>الترميز: UTF-8 مع BOM لضمان عرض النصوص والأرقام والأسماء العربية بدقة في Microsoft Excel و Google Sheets</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Audited Attendance Correction Modal */}
      <AttendanceCorrectionModal
        isOpen={isCorrectionOpen}
        onClose={() => {
          setIsCorrectionOpen(false);
          setCorrectionRecord(null);
        }}
        record={correctionRecord}
        onSuccess={() => {
          refreshData();
          loadRoster();
        }}
      />

      {/* Phase 8 Verification Modal (28 automated tests) */}
      <Phase8VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
      />
    </div>
  );
};
