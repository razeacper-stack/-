import { SafeUser } from '../types/auth';
import {
  ReportCategory,
  ReportDefinition,
  ReportFilterParams,
  ReportId,
  ReportResult,
  ReportSummaryItem,
} from '../types/reports';
import { authStorage } from './authStorage';
import { branchStorage } from './branchStorage';
import { academicStorage } from './academicStorage';
import { studentStorage } from './studentStorage';
import { teacherStorage } from './teacherStorage';
import { timetableStorage } from './timetableStorage';
import { attendanceStorage } from './attendanceStorage';
import { financeStorage } from './financeStorage';
import { formatCurrency } from '../utils/currency';

export class ReportStorageService {
  private static instance: ReportStorageService;

  public static getInstance(): ReportStorageService {
    if (!ReportStorageService.instance) {
      ReportStorageService.instance = new ReportStorageService();
    }
    return ReportStorageService.instance;
  }

  // =========================================================================
  // 1. REPORT DEFINITIONS CATALOG
  // =========================================================================

  public getReportDefinitions(): ReportDefinition[] {
    return [
      // A. Student Reports
      {
        id: 'student_directory',
        category: 'students',
        titleAr: 'دليل الطلاب الشامل',
        titleEn: 'Comprehensive Student Directory',
        descriptionAr: 'قائمة شاملة ببيانات الطلاب المسجلين بالفرع مع أرقام القيد والمراحل والحالة.',
        descriptionEn: 'Complete directory of registered students with student numbers, stages, and status.',
        requiredPermission: 'students.view',
        supportedFilters: ['branchId', 'academicYearId', 'stageId', 'gradeId', 'classId', 'status', 'searchTerm'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'studentNumber', labelAr: 'الرقم الأكاديمي', labelEn: 'Student ID', isMono: true },
          { key: 'nameAr', labelAr: 'اسم الطالب (عربي)', labelEn: 'Name (AR)' },
          { key: 'nameEn', labelAr: 'اسم الطالب (إنجليزي)', labelEn: 'Name (EN)' },
          { key: 'stageNameAr', labelAr: 'المرحلة', labelEn: 'Stage' },
          { key: 'gradeNameAr', labelAr: 'الصف الدراسي', labelEn: 'Grade' },
          { key: 'classNameAr', labelAr: 'الفصل', labelEn: 'Class' },
          { key: 'gender', labelAr: 'الجنس', labelEn: 'Gender' },
          { key: 'status', labelAr: 'الحالة', labelEn: 'Status', isBadge: true },
          { key: 'enrollmentDate', labelAr: 'تاريخ القيد', labelEn: 'Enrollment Date', isMono: true },
        ],
      },
      {
        id: 'students_by_branch',
        category: 'students',
        titleAr: 'توزيع الطلاب بحسب الفرع',
        titleEn: 'Students by Campus Branch',
        descriptionAr: 'إحصائية مقارنة لأعداد الطلاب المسجلين والنشطين في الفروع المختلفة.',
        descriptionEn: 'Enrolled and active student counts distributed across campuses.',
        requiredPermission: 'students.view',
        supportedFilters: ['branchId', 'status'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'branchNameAr', labelAr: 'الفرع', labelEn: 'Branch' },
          { key: 'branchCode', labelAr: 'كود الفرع', labelEn: 'Branch Code', isMono: true },
          { key: 'totalCount', labelAr: 'إجمالي الطلاب', labelEn: 'Total Students', align: 'center', isMono: true },
          { key: 'activeCount', labelAr: 'الطلاب النشطون', labelEn: 'Active Students', align: 'center', isMono: true },
          { key: 'inactiveCount', labelAr: 'غير النشطين', labelEn: 'Inactive Students', align: 'center', isMono: true },
          { key: 'maleCount', labelAr: 'بنين', labelEn: 'Male', align: 'center', isMono: true },
          { key: 'femaleCount', labelAr: 'بنات', labelEn: 'Female', align: 'center', isMono: true },
        ],
      },
      {
        id: 'students_by_stage',
        category: 'students',
        titleAr: 'توزيع الطلاب بحسب المراحل الدراسية',
        titleEn: 'Students by Academic Stage',
        descriptionAr: 'أعداد ونسب قيد الطلاب في المراحل الابتدائية والمتوسطة والثانوية.',
        descriptionEn: 'Student distribution and enrollment percentages across stages.',
        requiredPermission: 'students.view',
        supportedFilters: ['branchId', 'academicYearId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'stageNameAr', labelAr: 'المرحلة الدراسية', labelEn: 'Stage' },
          { key: 'stageCode', labelAr: 'كود المرحلة', labelEn: 'Stage Code', isMono: true },
          { key: 'studentCount', labelAr: 'عدد الطلاب', labelEn: 'Student Count', align: 'center', isMono: true },
          { key: 'percentage', labelAr: 'النسبة من الإجمالي', labelEn: 'Percentage', align: 'center', isMono: true },
          { key: 'maleCount', labelAr: 'بنين', labelEn: 'Male', align: 'center', isMono: true },
          { key: 'femaleCount', labelAr: 'بنات', labelEn: 'Female', align: 'center', isMono: true },
        ],
      },
      {
        id: 'students_by_grade',
        category: 'students',
        titleAr: 'توزيع الطلاب بحسب الصفوف الدراسية',
        titleEn: 'Students by Grade Level',
        descriptionAr: 'تعداد الطلاب المقيدين في كل صف دراسي مع عدد الفصول المتاحة.',
        descriptionEn: 'Student enrollment by grade level with assigned class count.',
        requiredPermission: 'students.view',
        supportedFilters: ['branchId', 'academicYearId', 'stageId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'gradeNameAr', labelAr: 'الصف الدراسي', labelEn: 'Grade' },
          { key: 'stageNameAr', labelAr: 'المرحلة', labelEn: 'Stage' },
          { key: 'classCount', labelAr: 'عدد الفصول', labelEn: 'Classes Count', align: 'center', isMono: true },
          { key: 'studentCount', labelAr: 'عدد الطلاب', labelEn: 'Student Count', align: 'center', isMono: true },
          { key: 'maleCount', labelAr: 'بنين', labelEn: 'Male', align: 'center', isMono: true },
          { key: 'femaleCount', labelAr: 'بنات', labelEn: 'Female', align: 'center', isMono: true },
        ],
      },
      {
        id: 'students_by_class',
        category: 'students',
        titleAr: 'قوائم الطلاب بحسب الفصل الدراسي',
        titleEn: 'Class Rosters and Enrollments',
        descriptionAr: 'قائمة طلاب فصل دراسي محدد مع السعة الاستيعابية ونسب الإشغال.',
        descriptionEn: 'Student rosters for a specific class with capacity metrics.',
        requiredPermission: 'students.view',
        supportedFilters: ['branchId', 'academicYearId', 'stageId', 'gradeId', 'classId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'studentNumber', labelAr: 'الرقم الأكاديمي', labelEn: 'Student ID', isMono: true },
          { key: 'nameAr', labelAr: 'اسم الطالب', labelEn: 'Student Name' },
          { key: 'classNameAr', labelAr: 'الفصل', labelEn: 'Class' },
          { key: 'gender', labelAr: 'الجنس', labelEn: 'Gender' },
          { key: 'status', labelAr: 'الحالة', labelEn: 'Status', isBadge: true },
        ],
      },
      {
        id: 'enrollment_report',
        category: 'students',
        titleAr: 'تقرير القيد والقبول الأكاديمي',
        titleEn: 'Student Enrollment Log',
        descriptionAr: 'سجل عمليات تسجيل وقيد الطلاب بحسب العام الدراسي وتواريخ التقديم.',
        descriptionEn: 'Log of student admissions and registrations by academic year.',
        requiredPermission: 'students.view',
        supportedFilters: ['branchId', 'academicYearId', 'status', 'startDate', 'endDate'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'enrollmentNumber', labelAr: 'رقم القيد', labelEn: 'Enrollment No', isMono: true },
          { key: 'studentNameAr', labelAr: 'اسم الطالب', labelEn: 'Student Name' },
          { key: 'academicYearNameAr', labelAr: 'العام الدراسي', labelEn: 'Academic Year' },
          { key: 'gradeNameAr', labelAr: 'الصف الدراسي', labelEn: 'Grade' },
          { key: 'enrollmentDate', labelAr: 'تاريخ التسجيل', labelEn: 'Enrollment Date', isMono: true },
          { key: 'status', labelAr: 'حالة القيد', labelEn: 'Status', isBadge: true },
        ],
      },
      {
        id: 'student_guardian_directory',
        category: 'students',
        titleAr: 'دليل أولياء الأمور والتواصل',
        titleEn: 'Student Guardian Directory',
        descriptionAr: 'بيانات التواصل مع أولياء الأمور وصلة القرابة لكل طالب مسجل.',
        descriptionEn: 'Guardian contact records and relationships for registered students.',
        requiredPermission: 'students.view',
        supportedFilters: ['branchId', 'classId', 'searchTerm'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'studentNumber', labelAr: 'الرقم الأكاديمي', labelEn: 'Student ID', isMono: true },
          { key: 'studentNameAr', labelAr: 'اسم الطالب', labelEn: 'Student Name' },
          { key: 'guardianNameAr', labelAr: 'اسم ولي الأمر', labelEn: 'Guardian Name' },
          { key: 'relationship', labelAr: 'صلة القرابة', labelEn: 'Relationship' },
          { key: 'phone', labelAr: 'رقم الهاتف', labelEn: 'Phone', isMono: true },
          { key: 'isPrimary', labelAr: 'الأساسي', labelEn: 'Primary', isBadge: true },
        ],
      },

      // B. Teacher Reports
      {
        id: 'teacher_directory',
        category: 'teachers',
        titleAr: 'سجل أعضاء هيئة التدريس',
        titleEn: 'Faculty Members Directory',
        descriptionAr: 'الدليل الوظيفي الشامل للمعلمين وتخصصاتهم وحالاتهم التعاقدية.',
        descriptionEn: 'Faculty directory with specializations, qualifications, and employment status.',
        requiredPermission: 'teachers.view',
        supportedFilters: ['branchId', 'status', 'searchTerm'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'employeeNumber', labelAr: 'الرقم الوظيفي', labelEn: 'Emp ID', isMono: true },
          { key: 'nameAr', labelAr: 'اسم المعلم (عربي)', labelEn: 'Name (AR)' },
          { key: 'nameEn', labelAr: 'اسم المعلم (إنجليزي)', labelEn: 'Name (EN)' },
          { key: 'specializationAr', labelAr: 'التخصص', labelEn: 'Specialization' },
          { key: 'employmentType', labelAr: 'نوع التعاقد', labelEn: 'Contract Type' },
          { key: 'status', labelAr: 'الحالة الوظيفية', labelEn: 'Status', isBadge: true },
          { key: 'hireDate', labelAr: 'تاريخ التعيين', labelEn: 'Hire Date', isMono: true },
        ],
      },
      {
        id: 'teachers_by_branch',
        category: 'teachers',
        titleAr: 'توزيع المعلمين بحسب الفروع',
        titleEn: 'Faculty by Branch',
        descriptionAr: 'إحصائية كادر التدريس المخصص لكل فرع مدرسي ونسب النشاط.',
        descriptionEn: 'Teaching staff allocation and status across campus branches.',
        requiredPermission: 'teachers.view',
        supportedFilters: ['branchId', 'status'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'branchNameAr', labelAr: 'الفرع', labelEn: 'Branch' },
          { key: 'totalTeachers', labelAr: 'إجمالي المعلمين', labelEn: 'Total Teachers', align: 'center', isMono: true },
          { key: 'activeTeachers', labelAr: 'النشطون', labelEn: 'Active', align: 'center', isMono: true },
          { key: 'fullTime', labelAr: 'دوام كامل', labelEn: 'Full-Time', align: 'center', isMono: true },
          { key: 'partTime', labelAr: 'دوام جزئي', labelEn: 'Part-Time', align: 'center', isMono: true },
        ],
      },
      {
        id: 'teachers_by_subject',
        category: 'teachers',
        titleAr: 'توزيع المعلمين بحسب المواد الدراسية',
        titleEn: 'Teachers by Subject Allocation',
        descriptionAr: 'قائمة المواد التعليمية مع المعلمين المكلفين بتدريسها.',
        descriptionEn: 'Curriculum subjects mapped to assigned teaching faculty.',
        requiredPermission: 'teachers.view',
        supportedFilters: ['branchId', 'subjectId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'subjectNameAr', labelAr: 'المادة الدراسية', labelEn: 'Subject' },
          { key: 'subjectCode', labelAr: 'كود المادة', labelEn: 'Code', isMono: true },
          { key: 'teacherNameAr', labelAr: 'اسم المعلم', labelEn: 'Teacher Name' },
          { key: 'isPrimary', labelAr: 'مادة أساسية', labelEn: 'Primary Subject', isBadge: true },
        ],
      },
      {
        id: 'teacher_workload',
        category: 'teachers',
        titleAr: 'تقرير النصاب الأكاديمي للمعلمين',
        titleEn: 'Teacher Workload & Periods Report',
        descriptionAr: 'إجمالي الحصص الأسبوعية المجدولة لكل معلم ومقارنتها بالحد الأقصى للنصاب.',
        descriptionEn: 'Weekly scheduled lesson periods per faculty member vs maximum load.',
        requiredPermission: 'teachers.view',
        supportedFilters: ['branchId', 'academicYearId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'employeeNumber', labelAr: 'الرقم الوظيفي', labelEn: 'Emp ID', isMono: true },
          { key: 'nameAr', labelAr: 'اسم المعلم', labelEn: 'Teacher Name' },
          { key: 'specializationAr', labelAr: 'التخصص', labelEn: 'Specialization' },
          { key: 'assignedPeriods', labelAr: 'الحصص المجدولة', labelEn: 'Scheduled Periods', align: 'center', isMono: true },
          { key: 'maxLoad', labelAr: 'الحد الأقصى', labelEn: 'Max Load', align: 'center', isMono: true },
          { key: 'utilizationRate', labelAr: 'نسبة الإشغال', labelEn: 'Utilization', align: 'center', isMono: true },
          { key: 'status', labelAr: 'الحالة', labelEn: 'Status', isBadge: true },
        ],
      },

      // C. Academic Reports
      {
        id: 'academic_structure',
        category: 'academic',
        titleAr: 'تقرير الهيكل الأكاديمي للمدرسة',
        titleEn: 'Academic Structure & Stages Report',
        descriptionAr: 'نظرة شاملة على المراحل التعليمية والصفوف والفصول التابعة لها.',
        descriptionEn: 'Comprehensive overview of educational stages, grades, and classes.',
        requiredPermission: 'classes.view',
        supportedFilters: ['branchId', 'academicYearId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'stageNameAr', labelAr: 'المرحلة', labelEn: 'Stage' },
          { key: 'gradeNameAr', labelAr: 'الصف الدراسي', labelEn: 'Grade' },
          { key: 'gradeCode', labelAr: 'كود الصف', labelEn: 'Grade Code', isMono: true },
          { key: 'classesCount', labelAr: 'عدد الفصول', labelEn: 'Classes Count', align: 'center', isMono: true },
          { key: 'totalCapacity', labelAr: 'السعة الكلية', labelEn: 'Total Capacity', align: 'center', isMono: true },
        ],
      },
      {
        id: 'classes_report',
        category: 'academic',
        titleAr: 'تقرير الفصول والسعات الاستيعابية',
        titleEn: 'Classrooms & Capacity Ledger',
        descriptionAr: 'تفاصيل كافة الفصول المدرسية وأرقام القاعات ومعدلات استيعاب الطلاب.',
        descriptionEn: 'Detailed class sections with room allocations and capacity limits.',
        requiredPermission: 'classes.view',
        supportedFilters: ['branchId', 'academicYearId', 'stageId', 'gradeId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'classCode', labelAr: 'كود الفصل', labelEn: 'Class Code', isMono: true },
          { key: 'nameAr', labelAr: 'اسم الفصل (عربي)', labelEn: 'Class Name (AR)' },
          { key: 'gradeNameAr', labelAr: 'الصف', labelEn: 'Grade' },
          { key: 'capacity', labelAr: 'السعة القصوى', labelEn: 'Capacity', align: 'center', isMono: true },
          { key: 'enrolledCount', labelAr: 'المقيدون', labelEn: 'Enrolled', align: 'center', isMono: true },
          { key: 'occupancyRate', labelAr: 'نسبة الإشغال', labelEn: 'Occupancy', align: 'center', isMono: true },
          { key: 'roomNumber', labelAr: 'رقم القاعة', labelEn: 'Room No', isMono: true },
        ],
      },
      {
        id: 'subjects_report',
        category: 'academic',
        titleAr: 'تقرير المواد والمناهج المقررة',
        titleEn: 'Curriculum & Subjects Register',
        descriptionAr: 'دليل المقررات الدراسية والأوزان والحصص الأسبوعية المعتمدة.',
        descriptionEn: 'Subject curriculum catalog with credit weights and periods.',
        requiredPermission: 'subjects.view',
        supportedFilters: ['branchId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'code', labelAr: 'كود المادة', labelEn: 'Subject Code', isMono: true },
          { key: 'nameAr', labelAr: 'اسم المادة (عربي)', labelEn: 'Subject Name (AR)' },
          { key: 'nameEn', labelAr: 'اسم المادة (إنجليزي)', labelEn: 'Subject Name (EN)' },
          { key: 'status', labelAr: 'الحالة', labelEn: 'Status', isBadge: true },
        ],
      },

      // D. Timetable Reports
      {
        id: 'weekly_timetable',
        category: 'timetable',
        titleAr: 'الجدول الأسبوعي المعتمد',
        titleEn: 'Comprehensive Weekly Timetable',
        descriptionAr: 'جدول الحصص الأسبوعي الكامل لكافة الفصول والمعلمين والمواد.',
        descriptionEn: 'Complete weekly schedule across all classes, teachers, and rooms.',
        requiredPermission: 'timetable.view',
        supportedFilters: ['branchId', 'academicYearId', 'classId', 'teacherId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'dayOfWeek', labelAr: 'اليوم', labelEn: 'Day' },
          { key: 'periodNumber', labelAr: 'الحصة', labelEn: 'Period', align: 'center', isMono: true },
          { key: 'classNameAr', labelAr: 'الفصل', labelEn: 'Class' },
          { key: 'subjectNameAr', labelAr: 'المادة الدراسية', labelEn: 'Subject' },
          { key: 'teacherNameAr', labelAr: 'المعلم', labelEn: 'Teacher' },
          { key: 'roomCode', labelAr: 'القاعة', labelEn: 'Room', isMono: true },
          { key: 'status', labelAr: 'الحالة', labelEn: 'Status', isBadge: true },
        ],
      },
      {
        id: 'class_timetable',
        category: 'timetable',
        titleAr: 'جدول حصص الفصل الدراسي',
        titleEn: 'Class Schedule Timetable',
        descriptionAr: 'المخطط الزمني الأسبوعي لحصص ومواد فصل دراسي محدد.',
        descriptionEn: 'Weekly timetable schedule for a selected classroom section.',
        requiredPermission: 'timetable.view',
        supportedFilters: ['branchId', 'academicYearId', 'classId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'dayOfWeek', labelAr: 'اليوم', labelEn: 'Day' },
          { key: 'periodNumber', labelAr: 'رقم الحصة', labelEn: 'Period No', align: 'center', isMono: true },
          { key: 'subjectNameAr', labelAr: 'المادة', labelEn: 'Subject' },
          { key: 'teacherNameAr', labelAr: 'المعلم', labelEn: 'Teacher' },
          { key: 'roomCode', labelAr: 'القاعة', labelEn: 'Room', isMono: true },
        ],
      },
      {
        id: 'teacher_timetable',
        category: 'timetable',
        titleAr: 'جدول حصص المعلم',
        titleEn: 'Faculty Teacher Schedule',
        descriptionAr: 'الجدول الأسبوعي المخصص لمعلم محدد موضحاً الفصول والقاعات.',
        descriptionEn: 'Personal weekly timetable schedule for a selected faculty member.',
        requiredPermission: 'timetable.view',
        supportedFilters: ['branchId', 'academicYearId', 'teacherId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'dayOfWeek', labelAr: 'اليوم', labelEn: 'Day' },
          { key: 'periodNumber', labelAr: 'الحصة', labelEn: 'Period', align: 'center', isMono: true },
          { key: 'classNameAr', labelAr: 'الفصل الدراسي', labelEn: 'Class' },
          { key: 'subjectNameAr', labelAr: 'المادة', labelEn: 'Subject' },
          { key: 'roomCode', labelAr: 'القاعة الدراسية', labelEn: 'Room', isMono: true },
        ],
      },
      {
        id: 'room_timetable',
        category: 'timetable',
        titleAr: 'تقرير إشغال القاعات والغرف الدراسية',
        titleEn: 'Room & Facility Utilization',
        descriptionAr: 'متابعة مواعيد استخدام القاعات والمختبرات المدرسية خلال الأسبوع.',
        descriptionEn: 'Weekly utilization and occupancy of school rooms and labs.',
        requiredPermission: 'timetable.view',
        supportedFilters: ['branchId', 'academicYearId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'roomCode', labelAr: 'كود القاعة', labelEn: 'Room Code', isMono: true },
          { key: 'roomNameAr', labelAr: 'اسم القاعة', labelEn: 'Room Name' },
          { key: 'dayOfWeek', labelAr: 'اليوم', labelEn: 'Day' },
          { key: 'periodNumber', labelAr: 'الحصة', labelEn: 'Period', align: 'center', isMono: true },
          { key: 'classNameAr', labelAr: 'الفصل المستخدم', labelEn: 'Class Using' },
          { key: 'subjectNameAr', labelAr: 'المادة', labelEn: 'Subject' },
        ],
      },

      // E. Attendance Reports
      {
        id: 'daily_attendance',
        category: 'attendance',
        titleAr: 'تقرير الحضور والغياب اليومي',
        titleEn: 'Daily Attendance Report',
        descriptionAr: 'ملخص نسب الحضور والغياب والتأخر لكافة الفصول في تاريخ محدد.',
        descriptionEn: 'Roll-call summary of present, absent, and late students on a specific date.',
        requiredPermission: 'attendance.view',
        supportedFilters: ['branchId', 'classId', 'startDate', 'status'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'date', labelAr: 'التاريخ', labelEn: 'Date', isMono: true },
          { key: 'studentNumber', labelAr: 'الرقم الأكاديمي', labelEn: 'Student ID', isMono: true },
          { key: 'studentNameAr', labelAr: 'اسم الطالب', labelEn: 'Student Name' },
          { key: 'classNameAr', labelAr: 'الفصل', labelEn: 'Class' },
          { key: 'status', labelAr: 'حالة الحضور', labelEn: 'Attendance Status', isBadge: true },
          { key: 'notes', labelAr: 'ملاحظات / عذر', labelEn: 'Notes' },
        ],
      },
      {
        id: 'attendance_by_class',
        category: 'attendance',
        titleAr: 'سجل الحضور بحسب الفصول الدراسية',
        titleEn: 'Attendance by Class Roster',
        descriptionAr: 'إحصائية تراكمية لحضور وغياب الطلاب مقسمة بحسب الفصول الدراسية.',
        descriptionEn: 'Cumulative class-by-class attendance and absence statistics.',
        requiredPermission: 'attendance.view',
        supportedFilters: ['branchId', 'classId', 'startDate', 'endDate'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'classNameAr', labelAr: 'الفصل الدراسي', labelEn: 'Class' },
          { key: 'totalRecords', labelAr: 'إجمالي الرصد', labelEn: 'Total Records', align: 'center', isMono: true },
          { key: 'presentCount', labelAr: 'حاضر', labelEn: 'Present', align: 'center', isMono: true },
          { key: 'absentCount', labelAr: 'غائب', labelEn: 'Absent', align: 'center', isMono: true },
          { key: 'lateCount', labelAr: 'متأخر', labelEn: 'Late', align: 'center', isMono: true },
          { key: 'attendanceRate', labelAr: 'نسبة الحضور', labelEn: 'Attendance Rate', align: 'center', isMono: true },
        ],
      },
      {
        id: 'attendance_by_student',
        category: 'attendance',
        titleAr: 'سجل انتظام وحضور الطالب',
        titleEn: 'Individual Student Attendance History',
        descriptionAr: 'سجل تفصيلي لحضور وغياب طالب محدد خلال فترة زمنية.',
        descriptionEn: 'Detailed chronological attendance log for an individual student.',
        requiredPermission: 'attendance.view',
        supportedFilters: ['branchId', 'studentId', 'startDate', 'endDate'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'date', labelAr: 'التاريخ', labelEn: 'Date', isMono: true },
          { key: 'status', labelAr: 'الحالة', labelEn: 'Status', isBadge: true },
          { key: 'sessionStatus', labelAr: 'حالة الجلسة', labelEn: 'Session Status', isBadge: true },
          { key: 'notes', labelAr: 'المبرر / السبب', labelEn: 'Justification' },
        ],
      },
      {
        id: 'attendance_summary',
        category: 'attendance',
        titleAr: 'ملخص الحضور والانتظام العام',
        titleEn: 'School Attendance Summary',
        descriptionAr: 'تحليل شامل ومقارن لنسب الانتظام والغياب على مستوى المدرسة والفرع.',
        descriptionEn: 'Overall attendance and punctuality KPI indicators.',
        requiredPermission: 'attendance.view',
        supportedFilters: ['branchId', 'startDate', 'endDate'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'branchNameAr', labelAr: 'الفرع', labelEn: 'Branch' },
          { key: 'totalSessions', labelAr: 'جلسات الرصد', labelEn: 'Total Sessions', align: 'center', isMono: true },
          { key: 'totalRecords', labelAr: 'إجمالي السجلات', labelEn: 'Total Records', align: 'center', isMono: true },
          { key: 'attendanceRate', labelAr: 'متوسط الانتظام', labelEn: 'Avg Attendance', align: 'center', isMono: true },
          { key: 'absenceRate', labelAr: 'نسبة الغياب', labelEn: 'Absence Rate', align: 'center', isMono: true },
        ],
      },
      {
        id: 'absence_late_report',
        category: 'attendance',
        titleAr: 'تقرير حالات الغياب والتأخر للمتابعة',
        titleEn: 'Absence & Tardy Intervention Register',
        descriptionAr: 'حصر مفصل لحالات الغياب والتأخر الصباحي غير المبررة لاتخاذ الإجراء الإداري.',
        descriptionEn: 'Detailed roster of absent and late instances for administrative follow-up.',
        requiredPermission: 'attendance.view',
        supportedFilters: ['branchId', 'classId', 'startDate', 'endDate'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'date', labelAr: 'التاريخ', labelEn: 'Date', isMono: true },
          { key: 'studentNumber', labelAr: 'الرقم الأكاديمي', labelEn: 'Student ID', isMono: true },
          { key: 'studentNameAr', labelAr: 'اسم الطالب', labelEn: 'Student Name' },
          { key: 'classNameAr', labelAr: 'الفصل', labelEn: 'Class' },
          { key: 'type', labelAr: 'النوع', labelEn: 'Type', isBadge: true },
          { key: 'notes', labelAr: 'الملاحظات', labelEn: 'Notes' },
        ],
      },

      // F. Finance Reports (Guarded by fees.view or finance.view_reports)
      {
        id: 'fee_collection_summary',
        category: 'finance',
        titleAr: 'ملخص تحصيل الرسوم والإيرادات',
        titleEn: 'Fee Collection & Revenue Summary',
        descriptionAr: 'تقرير شامل لإجمالي المبالغ المفوترة، المحصلة، والمتبقية بدقة المبالغ الصغرى.',
        descriptionEn: 'Executive summary of total invoiced, collected, and outstanding tuition fees.',
        requiredPermission: 'finance.view_reports',
        supportedFilters: ['branchId', 'academicYearId', 'startDate', 'endDate'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'metricNameAr', labelAr: 'البند المالي', labelEn: 'Financial Metric' },
          { key: 'amountFormatted', labelAr: 'المبلغ المعتمد', labelEn: 'Amount (SAR)', align: 'end', isMono: true },
          { key: 'percentage', labelAr: 'النسبة من الإجمالي', labelEn: 'Percentage', align: 'center', isMono: true },
        ],
      },
      {
        id: 'outstanding_fees',
        category: 'finance',
        titleAr: 'تقرير الرسوم والمتأخرات المستحقة',
        titleEn: 'Outstanding Tuition & Aging Receivables',
        descriptionAr: 'كشف تفصيلي بكافة الفواتير التي تحتوي على أرصدة متبقية مستحقة السداد.',
        descriptionEn: 'Detailed ledger of active invoices with remaining balance due.',
        requiredPermission: 'finance.view_reports',
        supportedFilters: ['branchId', 'academicYearId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'invoiceNumber', labelAr: 'رقم الفاتورة', labelEn: 'Invoice No', isMono: true },
          { key: 'studentNameAr', labelAr: 'اسم الطالب', labelEn: 'Student Name' },
          { key: 'studentNumber', labelAr: 'الرقم الأكاديمي', labelEn: 'Student ID', isMono: true },
          { key: 'dueDate', labelAr: 'تاريخ الاستحقاق', labelEn: 'Due Date', isMono: true },
          { key: 'netTotalFormatted', labelAr: 'إجمالي الفاتورة', labelEn: 'Net Total', align: 'end', isMono: true },
          { key: 'paidTotalFormatted', labelAr: 'المسدد', labelEn: 'Paid', align: 'end', isMono: true },
          { key: 'balanceDueFormatted', labelAr: 'المتبقي المستحق', labelEn: 'Balance Due', align: 'end', isMono: true },
          { key: 'status', labelAr: 'حالة الفاتورة', labelEn: 'Status', isBadge: true },
        ],
      },
      {
        id: 'overdue_fees',
        category: 'finance',
        titleAr: 'تقرير الفواتير متأخرة السداد',
        titleEn: 'Overdue Invoices Register',
        descriptionAr: 'الفواتير التي تجاوزت تاريخ استحقاقها ولم يتم سدادها لاتخاذ إجراءات التحصيل.',
        descriptionEn: 'Invoices that have passed their payment due date without full settlement.',
        requiredPermission: 'finance.view_reports',
        supportedFilters: ['branchId', 'academicYearId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'invoiceNumber', labelAr: 'رقم الفاتورة', labelEn: 'Invoice No', isMono: true },
          { key: 'studentNameAr', labelAr: 'اسم الطالب', labelEn: 'Student Name' },
          { key: 'dueDate', labelAr: 'تاريخ الاستحقاق', labelEn: 'Due Date', isMono: true },
          { key: 'daysOverdue', labelAr: 'أيام التأخير', labelEn: 'Days Overdue', align: 'center', isMono: true },
          { key: 'balanceDueFormatted', labelAr: 'المبلغ المتأخر', labelEn: 'Overdue Amount', align: 'end', isMono: true },
        ],
      },
      {
        id: 'payments_register',
        category: 'finance',
        titleAr: 'سجل سندات القبض والمدفوعات',
        titleEn: 'Payments & Receipts Register',
        descriptionAr: 'توثيق تاريخي لكافة سندات القبض المستلمة بوسائل الدفع المتنوعة.',
        descriptionEn: 'Comprehensive log of all payment receipts received across all methods.',
        requiredPermission: 'finance.view_reports',
        supportedFilters: ['branchId', 'startDate', 'endDate'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'receiptNumber', labelAr: 'رقم السند', labelEn: 'Receipt No', isMono: true },
          { key: 'paymentDate', labelAr: 'تاريخ السداد', labelEn: 'Date', isMono: true },
          { key: 'invoiceNumber', labelAr: 'رقم الفاتورة', labelEn: 'Invoice No', isMono: true },
          { key: 'studentNameAr', labelAr: 'اسم الطالب', labelEn: 'Student Name' },
          { key: 'amountFormatted', labelAr: 'المبلغ المقبوض', labelEn: 'Amount', align: 'end', isMono: true },
          { key: 'method', labelAr: 'وسيلة الدفع', labelEn: 'Method', isBadge: true },
          { key: 'reference', labelAr: 'الرقم المرجعي', labelEn: 'Reference', isMono: true },
          { key: 'receivedByName', labelAr: 'المستلم المعتمد', labelEn: 'Received By' },
        ],
      },
      {
        id: 'refunds_report',
        category: 'finance',
        titleAr: 'سجل سندات الصرف والاسترداد',
        titleEn: 'Refunds & Disbursements Register',
        descriptionAr: 'توثيق كامل لكافة المبالغ المالية المستردة وأسباب الصرف المعتمدة.',
        descriptionEn: 'Audit log of all refund vouchers, justification reasons, and original receipts.',
        requiredPermission: 'finance.view_reports',
        supportedFilters: ['branchId', 'startDate', 'endDate'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'refundNumber', labelAr: 'رقم سند الصرف', labelEn: 'Refund No', isMono: true },
          { key: 'refundDate', labelAr: 'التاريخ', labelEn: 'Date', isMono: true },
          { key: 'receiptNumber', labelAr: 'سند القبض المرتبط', labelEn: 'Original Receipt', isMono: true },
          { key: 'studentNameAr', labelAr: 'اسم الطالب', labelEn: 'Student Name' },
          { key: 'amountFormatted', labelAr: 'مبلغ الاسترداد', labelEn: 'Refund Amount', align: 'end', isMono: true },
          { key: 'reason', labelAr: 'سبب ومبرر الصرف', labelEn: 'Justification' },
          { key: 'approvedByName', labelAr: 'المعتمد', labelEn: 'Approved By' },
        ],
      },
      {
        id: 'student_financial_statement',
        category: 'finance',
        titleAr: 'كشف الحساب المالي للطالب',
        titleEn: 'Student Financial Statement',
        descriptionAr: 'كشف تفصيلي بحركات الفواتير وسندات السداد ورصيد الحساب للطالب.',
        descriptionEn: 'Comprehensive statement of invoices, payments, and account balance for a student.',
        requiredPermission: 'finance.view_reports',
        supportedFilters: ['branchId', 'studentId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'date', labelAr: 'التاريخ', labelEn: 'Date', isMono: true },
          { key: 'transactionType', labelAr: 'نوع الحركة', labelEn: 'Transaction Type', isBadge: true },
          { key: 'referenceNumber', labelAr: 'رقم المستند', labelEn: 'Ref No', isMono: true },
          { key: 'description', labelAr: 'البيان', labelEn: 'Description' },
          { key: 'debitFormatted', labelAr: 'مدين (مفوتر)', labelEn: 'Invoiced (Debit)', align: 'end', isMono: true },
          { key: 'creditFormatted', labelAr: 'دائن (مسدد)', labelEn: 'Paid (Credit)', align: 'end', isMono: true },
          { key: 'balanceFormatted', labelAr: 'الرصيد التراكمي', labelEn: 'Running Balance', align: 'end', isMono: true },
        ],
      },
      {
        id: 'invoices_register',
        category: 'finance',
        titleAr: 'سجل الفواتير والمطالبات المدرسية',
        titleEn: 'Invoices & Billing Register',
        descriptionAr: 'السجل العام لكافة المطالبات المالية وحالات السداد وتواريخ الاستحقاق.',
        descriptionEn: 'Master register of all issued invoices and their payment statuses.',
        requiredPermission: 'finance.view_reports',
        supportedFilters: ['branchId', 'academicYearId', 'status', 'startDate', 'endDate'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'invoiceNumber', labelAr: 'رقم الفاتورة', labelEn: 'Invoice No', isMono: true },
          { key: 'issueDate', labelAr: 'تاريخ الإصدار', labelEn: 'Issue Date', isMono: true },
          { key: 'studentNameAr', labelAr: 'اسم الطالب', labelEn: 'Student Name' },
          { key: 'dueDate', labelAr: 'تاريخ الاستحقاق', labelEn: 'Due Date', isMono: true },
          { key: 'netTotalFormatted', labelAr: 'صافي الفاتورة', labelEn: 'Net Total', align: 'end', isMono: true },
          { key: 'paidTotalFormatted', labelAr: 'المسدد', labelEn: 'Paid', align: 'end', isMono: true },
          { key: 'balanceDueFormatted', labelAr: 'المتبقي', labelEn: 'Balance Due', align: 'end', isMono: true },
          { key: 'status', labelAr: 'الحالة', labelEn: 'Status', isBadge: true },
        ],
      },

      // G. Branch Reports
      {
        id: 'branch_overview',
        category: 'branches',
        titleAr: 'تقرير النظرة العامة للفرع المدرسي',
        titleEn: 'Branch Campus Overview Report',
        descriptionAr: 'بيانات الفرع وإحصائيات الطلاب والكوادر التعليمية والفصول الدراسية.',
        descriptionEn: 'Campus profile with student body, faculty roster, and classroom metrics.',
        requiredPermission: 'branches.view',
        supportedFilters: ['branchId'],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'branchNameAr', labelAr: 'اسم الفرع', labelEn: 'Campus Name' },
          { key: 'branchCode', labelAr: 'كود الفرع', labelEn: 'Code', isMono: true },
          { key: 'city', labelAr: 'المدينة', labelEn: 'City' },
          { key: 'managerName', labelAr: 'مدير الفرع', labelEn: 'Campus Manager' },
          { key: 'studentsCount', labelAr: 'عدد الطلاب', labelEn: 'Students', align: 'center', isMono: true },
          { key: 'teachersCount', labelAr: 'عدد المعلمين', labelEn: 'Teachers', align: 'center', isMono: true },
          { key: 'classesCount', labelAr: 'الفصول', labelEn: 'Classes', align: 'center', isMono: true },
          { key: 'status', labelAr: 'الحالة', labelEn: 'Status', isBadge: true },
        ],
      },
      {
        id: 'cross_branch_comparison',
        category: 'branches',
        titleAr: 'تقرير المقارنة المعيارية بين الفروع',
        titleEn: 'Cross-Branch Comparative Benchmark',
        descriptionAr: 'مقارنة تشغيلية متعددة الفروع لمؤشرات الطلاب والكوادر والتحصيل المالي.',
        descriptionEn: 'Cross-campus operational benchmarking across enrollment, faculty, and collections.',
        requiredPermission: 'branches.view',
        supportedFilters: [],
        supportsExport: true,
        supportsPrint: true,
        columns: [
          { key: 'branchNameAr', labelAr: 'الفرع المدرسي', labelEn: 'Branch Campus' },
          { key: 'studentsCount', labelAr: 'الطلاب النشطون', labelEn: 'Active Students', align: 'center', isMono: true },
          { key: 'teachersCount', labelAr: 'أعضاء التدريس', labelEn: 'Faculty', align: 'center', isMono: true },
          { key: 'classesCount', labelAr: 'الفصول الدراسية', labelEn: 'Classes', align: 'center', isMono: true },
          { key: 'invoicedFormatted', labelAr: 'إجمالي المفوتر', labelEn: 'Total Invoiced', align: 'end', isMono: true },
          { key: 'collectedFormatted', labelAr: 'إجمالي المحصل', labelEn: 'Total Collected', align: 'end', isMono: true },
          { key: 'attendanceRate', labelAr: 'نسبة الحضور', labelEn: 'Attendance Rate', align: 'center', isMono: true },
        ],
      },
    ];
  }

  // =========================================================================
  // 2. AUTHORIZATION & BRANCH GUARDS
  // =========================================================================

  public checkBranchAccess(actingUser: SafeUser, targetBranchId: string): void {
    if (!targetBranchId || targetBranchId === 'all') {
      if (
        authStorage.isSuperAdmin(actingUser) ||
        actingUser.hasAllBranchesAccess === true ||
        authStorage.hasPermission(actingUser, 'dashboard.view_cross_branch')
      ) {
        return;
      }
      throw new Error('غير مصرح لك باستعراض تقارير كافة الفروع المجمعة.');
    }

    if (authStorage.isSuperAdmin(actingUser) || actingUser.hasAllBranchesAccess === true) {
      return;
    }

    const userBranchIds = actingUser.branchIds || [];
    if (!userBranchIds.includes(targetBranchId)) {
      authStorage.logAudit({
        actorId: actingUser.id,
        actorName: actingUser.fullName,
        actorRole: actingUser.roleCode,
        action: 'REPORT_UNAUTHORIZED_ATTEMPT',
        targetType: 'REPORT',
        branchContext: targetBranchId,
        result: 'DENIED',
        details: `محاولة وصول غير مصرح بها لتقارير الفرع: ${targetBranchId}`,
      });
      throw new Error(`غير مصرح لك بالوصول إلى بيانات الفرع المحدد (${targetBranchId}).`);
    }
  }

  public checkReportPermission(actingUser: SafeUser, definition: ReportDefinition): void {
    if (authStorage.isSuperAdmin(actingUser)) return;

    if (definition.category === 'finance') {
      const hasFin =
        authStorage.hasPermission(actingUser, 'finance.view_reports') ||
        authStorage.hasPermission(actingUser, 'fees.view');
      if (!hasFin) {
        throw new Error('ليس لديك الصلاحية الكافية للوصول إلى التقارير المالية (finance.view_reports).');
      }
      return;
    }

    if (!authStorage.hasPermission(actingUser, definition.requiredPermission)) {
      throw new Error(
        `ليس لديك الصلاحية الكافية للوصول إلى هذا التقرير (${definition.requiredPermission}).`
      );
    }
  }

  // =========================================================================
  // 3. CORE REPORT GENERATION ENGINE
  // =========================================================================

  public generateReport(
    actingUser: SafeUser,
    reportId: ReportId,
    filters: ReportFilterParams = {}
  ): ReportResult {
    const definitions = this.getReportDefinitions();
    const definition = definitions.find((d) => d.id === reportId);

    if (!definition) {
      throw new Error(`التقرير المطلوب غير موجود في النظام (${reportId}).`);
    }

    // 1. Check required permission
    this.checkReportPermission(actingUser, definition);

    // 2. Resolve target branch
    let targetBranchId = filters.branchId;
    if (!targetBranchId) {
      if (authStorage.isSuperAdmin(actingUser) || actingUser.hasAllBranchesAccess) {
        targetBranchId = 'all';
      } else {
        targetBranchId = actingUser.branchIds?.[0] || 'branch-riyadh';
      }
    }

    // 3. Check branch isolation
    this.checkBranchAccess(actingUser, targetBranchId);

    const branches = branchStorage.getRawBranches();
    const academicYears = academicStorage.getRawYears();
    const stages = academicStorage.getRawStages();
    const grades = academicStorage.getRawGrades();
    const classes = academicStorage.getRawClasses();
    const subjects = academicStorage.getRawSubjects();
    const teachers = teacherStorage.getRawTeachers();
    const students = studentStorage.getRawStudents();
    const enrollments = studentStorage.getRawEnrollments();
    const guardians = studentStorage.getRawGuardians();
    const studentGuardians = studentStorage.getRawStudentGuardians();

    const currentBranch =
      targetBranchId === 'all'
        ? { nameAr: 'كافة الفروع المتاحة', nameEn: 'All Permitted Branches' }
        : branches.find((b) => b.id === targetBranchId) || { nameAr: targetBranchId, nameEn: targetBranchId };

    const selectedYear = filters.academicYearId
      ? academicYears.find((y) => y.id === filters.academicYearId)
      : academicYears.find((y) => y.isCurrent);

    const branchFilterPredicate = (recordBranchId: string) => {
      if (targetBranchId === 'all') return true;
      return recordBranchId === targetBranchId;
    };

    let rows: Record<string, any>[] = [];
    const summary: ReportSummaryItem[] = [];

    // =========================================================================
    // DISPATCH BY REPORT ID
    // =========================================================================

    switch (reportId) {
      // 1. student_directory
      case 'student_directory': {
        const filtered = students.filter((s) => {
          if (!branchFilterPredicate(s.branchId)) return false;
          if (filters.status && s.status !== filters.status) return false;
          if (filters.searchTerm) {
            const q = filters.searchTerm.toLowerCase();
            const match =
              s.firstNameAr.toLowerCase().includes(q) ||
              s.lastNameAr.toLowerCase().includes(q) ||
              s.studentNumber.toLowerCase().includes(q);
            if (!match) return false;
          }
          return true;
        });

        rows = filtered.map((s) => {
          const enr = enrollments.find((e) => e.studentId === s.id && e.status === 'ENROLLED');
          const cls = enr ? classes.find((c) => c.id === enr.classId) : undefined;
          const grd = cls ? grades.find((g) => g.id === cls.gradeId) : undefined;
          const stg = grd ? stages.find((st) => st.id === grd.stageId) : undefined;

          return {
            studentNumber: s.studentNumber,
            nameAr: `${s.firstNameAr} ${s.lastNameAr}`,
            nameEn: `${s.firstNameEn || ''} ${s.lastNameEn || ''}`.trim() || '-',
            stageNameAr: stg?.nameAr || '-',
            gradeNameAr: grd?.nameAr || '-',
            classNameAr: cls?.nameAr || '-',
            gender: String(s.gender).toLowerCase() === 'male' ? 'بنين' : 'بنات',
            status: s.status === 'ACTIVE' ? 'نشط' : s.status,
            enrollmentDate: s.createdAt?.slice(0, 10) || '-',
          };
        });

        summary.push(
          { key: 'total', labelAr: 'إجمالي الطلاب', labelEn: 'Total Students', value: rows.length, color: 'blue' },
          { key: 'active', labelAr: 'النشطون', labelEn: 'Active', value: rows.filter((r) => r.status === 'نشط').length, color: 'emerald' },
          { key: 'males', labelAr: 'بنين', labelEn: 'Male', value: rows.filter((r) => r.gender === 'بنين').length },
          { key: 'females', labelAr: 'بنات', labelEn: 'Female', value: rows.filter((r) => r.gender === 'بنات').length, color: 'purple' }
        );
        break;
      }

      // 2. students_by_branch
      case 'students_by_branch': {
        const allowedBranches = targetBranchId === 'all'
          ? branches.filter((b) => authStorage.isSuperAdmin(actingUser) || (actingUser.branchIds || []).includes(b.id))
          : branches.filter((b) => b.id === targetBranchId);

        rows = allowedBranches.map((b) => {
          const bStudents = students.filter((s) => s.branchId === b.id);
          const active = bStudents.filter((s) => s.status === 'ACTIVE').length;
          const male = bStudents.filter((s) => String(s.gender).toLowerCase() === 'male').length;
          const female = bStudents.filter((s) => String(s.gender).toLowerCase() === 'female').length;

          return {
            branchNameAr: b.nameAr,
            branchCode: b.code,
            totalCount: bStudents.length,
            activeCount: active,
            inactiveCount: bStudents.length - active,
            maleCount: male,
            femaleCount: female,
          };
        });

        const totalAll = rows.reduce((acc, r) => acc + r.totalCount, 0);
        summary.push(
          { key: 'branches', labelAr: 'الفروع المشمولة', labelEn: 'Branches Included', value: rows.length, color: 'blue' },
          { key: 'total_students', labelAr: 'إجمالي الطلاب بكافة الفروع', labelEn: 'Total Students Across Campuses', value: totalAll, color: 'emerald' }
        );
        break;
      }

      // 3. students_by_stage
      case 'students_by_stage': {
        const branchStudents = students.filter((s) => branchFilterPredicate(s.branchId) && s.status === 'ACTIVE');
        const total = branchStudents.length;

        rows = stages.map((stg) => {
          const stgGrades = grades.filter((g) => g.stageId === stg.id).map((g) => g.id);
          const stgClasses = classes.filter((c) => stgGrades.includes(c.gradeId)).map((c) => c.id);
          const stgStudentIds = new Set(
            enrollments
              .filter((e) => stgClasses.includes(e.classId) && e.status === 'ENROLLED')
              .map((e) => e.studentId)
          );

          const matchingStudents = branchStudents.filter((s) => stgStudentIds.has(s.id));
          const count = matchingStudents.length;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const male = matchingStudents.filter((s) => String(s.gender).toLowerCase() === 'male').length;

          return {
            stageNameAr: stg.nameAr,
            stageCode: (stg as any).code || stg.nameEn || '-',
            studentCount: count,
            percentage: `${pct}%`,
            maleCount: male,
            femaleCount: count - male,
          };
        });

        summary.push(
          { key: 'total_active', labelAr: 'إجمالي الطلاب النشطين', labelEn: 'Total Active Students', value: total, color: 'blue' },
          { key: 'stages_count', labelAr: 'عدد المراحل', labelEn: 'Stages Count', value: stages.length }
        );
        break;
      }

      // 4. students_by_grade
      case 'students_by_grade': {
        const branchStudents = students.filter((s) => branchFilterPredicate(s.branchId) && s.status === 'ACTIVE');

        rows = grades.map((grd) => {
          const stg = stages.find((st) => st.id === grd.stageId);
          const grdClasses = classes.filter((c) => c.gradeId === grd.id && branchFilterPredicate(c.branchId));
          const grdClassIds = grdClasses.map((c) => c.id);

          const enrolledIds = new Set(
            enrollments
              .filter((e) => grdClassIds.includes(e.classId) && e.status === 'ENROLLED')
              .map((e) => e.studentId)
          );

          const matching = branchStudents.filter((s) => enrolledIds.has(s.id));
          const male = matching.filter((s) => String(s.gender).toLowerCase() === 'male').length;

          return {
            gradeNameAr: grd.nameAr,
            stageNameAr: stg?.nameAr || '-',
            classCount: grdClasses.length,
            studentCount: matching.length,
            maleCount: male,
            femaleCount: matching.length - male,
          };
        });

        const totalStudents = rows.reduce((acc, r) => acc + r.studentCount, 0);
        summary.push(
          { key: 'total_enrolled', labelAr: 'إجمالي المقيدين بالصفوف', labelEn: 'Total Enrolled', value: totalStudents, color: 'blue' },
          { key: 'grades_count', labelAr: 'عدد الصفوف', labelEn: 'Grades Count', value: grades.length }
        );
        break;
      }

      // 5. students_by_class
      case 'students_by_class': {
        let targetClasses = classes.filter((c) => branchFilterPredicate(c.branchId));
        if (filters.classId) {
          targetClasses = targetClasses.filter((c) => c.id === filters.classId);
        }

        const studentRows: Record<string, any>[] = [];
        for (const cls of targetClasses) {
          const classEnrollments = enrollments.filter((e) => e.classId === cls.id && e.status === 'ENROLLED');
          for (const enr of classEnrollments) {
            const s = students.find((std) => std.id === enr.studentId);
            if (!s) continue;
            studentRows.push({
              studentNumber: s.studentNumber,
              nameAr: `${s.firstNameAr} ${s.lastNameAr}`,
              classNameAr: cls.nameAr,
              gender: String(s.gender).toLowerCase() === 'male' ? 'بنين' : 'بنات',
              status: s.status === 'ACTIVE' ? 'نشط' : s.status,
            });
          }
        }

        rows = studentRows;
        summary.push(
          { key: 'classes', labelAr: 'الفصول المستهدفة', labelEn: 'Classes Targeted', value: targetClasses.length, color: 'blue' },
          { key: 'total_students', labelAr: 'عدد الطلاب بالقائمة', labelEn: 'Total Students in Roster', value: rows.length, color: 'emerald' }
        );
        break;
      }

      // 6. enrollment_report
      case 'enrollment_report': {
        const filteredEnrollments = enrollments.filter((e) => {
          const s = students.find((std) => std.id === e.studentId);
          if (!s || !branchFilterPredicate(s.branchId)) return false;
          if (filters.academicYearId && e.academicYearId !== filters.academicYearId) return false;
          if (filters.status && e.status !== filters.status) return false;
          return true;
        });

        rows = filteredEnrollments.map((e) => {
          const s = students.find((std) => std.id === e.studentId);
          const yr = academicYears.find((y) => y.id === e.academicYearId);
          const cls = classes.find((c) => c.id === e.classId);
          const grd = cls ? grades.find((g) => g.id === cls.gradeId) : undefined;

          return {
            enrollmentNumber: (e as any).enrollmentNumber || `ENR-${e.id.slice(0, 6)}`,
            studentNameAr: s ? `${s.firstNameAr} ${s.lastNameAr}` : '-',
            academicYearNameAr: yr?.nameAr || '-',
            gradeNameAr: grd?.nameAr || '-',
            enrollmentDate: e.enrollmentDate || '-',
            status: e.status === 'ENROLLED' ? 'مقيد' : e.status,
          };
        });

        summary.push(
          { key: 'total_enrollments', labelAr: 'إجمالي طلبات القيد', labelEn: 'Total Enrollments', value: rows.length, color: 'blue' },
          { key: 'active_enrolled', labelAr: 'المقيدون فعلياً', labelEn: 'Active Enrolled', value: rows.filter((r) => r.status === 'مقيد').length, color: 'emerald' }
        );
        break;
      }

      // 7. student_guardian_directory
      case 'student_guardian_directory': {
        const branchStudents = students.filter((s) => branchFilterPredicate(s.branchId));
        const relations = studentGuardians;

        const directoryRows: Record<string, any>[] = [];
        for (const s of branchStudents) {
          const sRelations = relations.filter((r) => r.studentId === s.id);
          for (const rel of sRelations) {
            const g = guardians.find((grd) => grd.id === rel.guardianId);
            if (!g) continue;

            directoryRows.push({
              studentNumber: s.studentNumber,
              studentNameAr: `${s.firstNameAr} ${s.lastNameAr}`,
              guardianNameAr: g.fullName,
              relationship: rel.relationship || 'ولي أمر',
              phone: g.phoneNumber || '-',
              isPrimary: rel.isPrimaryContact ? 'نعم' : 'لا',
            });
          }
        }

        rows = directoryRows;
        summary.push(
          { key: 'students_count', labelAr: 'عدد الطلاب', labelEn: 'Students Count', value: branchStudents.length, color: 'blue' },
          { key: 'guardians_count', labelAr: 'أولياء الأمور المرتبطين', labelEn: 'Linked Guardians', value: rows.length, color: 'emerald' }
        );
        break;
      }

      // 8. teacher_directory
      case 'teacher_directory': {
        const filtered = teachers.filter((t) => {
          if (!branchFilterPredicate(t.branchId)) return false;
          if (filters.status && t.employmentStatus !== filters.status) return false;
          if (filters.searchTerm) {
            const q = filters.searchTerm.toLowerCase();
            const match =
              t.firstNameAr.toLowerCase().includes(q) ||
              t.lastNameAr.toLowerCase().includes(q) ||
              t.teacherNumber.toLowerCase().includes(q);
            if (!match) return false;
          }
          return true;
        });

        rows = filtered.map((t) => ({
          employeeNumber: t.teacherNumber,
          nameAr: `${t.firstNameAr} ${t.lastNameAr}`,
          nameEn: `${t.firstNameEn || ''} ${t.lastNameEn || ''}`.trim() || '-',
          specializationAr: t.specialization || '-',
          employmentType: t.employmentType === 'FULL_TIME' ? 'دوام كامل' : 'دوام جزئي',
          status: t.employmentStatus === 'ACTIVE' ? 'نشط' : t.employmentStatus,
          hireDate: t.hireDate || '-',
        }));

        summary.push(
          { key: 'total_teachers', labelAr: 'إجمالي المعلمين', labelEn: 'Total Faculty', value: rows.length, color: 'blue' },
          { key: 'active_teachers', labelAr: 'المعلمون النشطون', labelEn: 'Active Faculty', value: rows.filter((r) => r.status === 'نشط').length, color: 'emerald' }
        );
        break;
      }

      // 9. teachers_by_branch
      case 'teachers_by_branch': {
        const allowedBranches = targetBranchId === 'all'
          ? branches.filter((b) => authStorage.isSuperAdmin(actingUser) || (actingUser.branchIds || []).includes(b.id))
          : branches.filter((b) => b.id === targetBranchId);

        rows = allowedBranches.map((b) => {
          const bTeachers = teachers.filter((t) => t.branchId === b.id);
          const active = bTeachers.filter((t) => t.employmentStatus === 'ACTIVE').length;
          const fullTime = bTeachers.filter((t) => t.employmentType === 'FULL_TIME').length;

          return {
            branchNameAr: b.nameAr,
            totalTeachers: bTeachers.length,
            activeTeachers: active,
            fullTime,
            partTime: bTeachers.length - fullTime,
          };
        });

        const totalTeachers = rows.reduce((acc, r) => acc + r.totalTeachers, 0);
        summary.push(
          { key: 'branches_count', labelAr: 'الفروع المشمولة', labelEn: 'Campuses', value: rows.length, color: 'blue' },
          { key: 'total_faculty', labelAr: 'إجمالي الكادر التعليمي', labelEn: 'Total Teaching Staff', value: totalTeachers, color: 'emerald' }
        );
        break;
      }

      // 10. teachers_by_subject
      case 'teachers_by_subject': {
        const teacherSubjects = teacherStorage.getRawTeacherSubjects();
        const branchTeachers = teachers.filter((t) => branchFilterPredicate(t.branchId));
        const bTeacherIds = new Set(branchTeachers.map((t) => t.id));

        const subjectRows: Record<string, any>[] = [];
        for (const ts of teacherSubjects) {
          if (!bTeacherIds.has(ts.teacherId)) continue;
          if (filters.subjectId && ts.subjectId !== filters.subjectId) continue;

          const tch = teachers.find((t) => t.id === ts.teacherId);
          const sbj = subjects.find((s) => s.id === ts.subjectId);
          if (!tch || !sbj) continue;

          subjectRows.push({
            subjectNameAr: sbj.nameAr,
            subjectCode: sbj.subjectCode,
            teacherNameAr: `${tch.firstNameAr} ${tch.lastNameAr}`,
            isPrimary: ts.isPrimarySubject ? 'نعم' : 'لا',
          });
        }

        rows = subjectRows;
        summary.push(
          { key: 'allocations', labelAr: 'إجمالي التكليفات الأكاديمية', labelEn: 'Subject Allocations', value: rows.length, color: 'blue' }
        );
        break;
      }

      // 11. teacher_workload
      case 'teacher_workload': {
        const branchTeachers = teachers.filter((t) => branchFilterPredicate(t.branchId) && t.employmentStatus === 'ACTIVE');
        const entries = timetableStorage.getRawTimetableEntries().filter((e) => e.status === 'PUBLISHED');

        rows = branchTeachers.map((t) => {
          const teacherPeriods = entries.filter((e) => e.teacherId === t.id).length;
          const maxLoad = 24; // Standard max load
          const utilPct = Math.round((teacherPeriods / maxLoad) * 100);

          return {
            employeeNumber: t.teacherNumber,
            nameAr: `${t.firstNameAr} ${t.lastNameAr}`,
            specializationAr: t.specialization || '-',
            assignedPeriods: teacherPeriods,
            maxLoad,
            utilizationRate: `${utilPct}%`,
            status: utilPct > 100 ? 'عبء زائد' : utilPct >= 80 ? 'نصاب كامل' : 'ضمن المتاح',
          };
        });

        const totalLessons = rows.reduce((acc, r) => acc + r.assignedPeriods, 0);
        summary.push(
          { key: 'active_faculty', labelAr: 'المعلمون النشطون', labelEn: 'Active Faculty', value: rows.length, color: 'blue' },
          { key: 'total_periods', labelAr: 'إجمالي الحصص الموزعة', labelEn: 'Total Distributed Periods', value: totalLessons, color: 'emerald' }
        );
        break;
      }

      // 12. academic_structure
      case 'academic_structure': {
        rows = grades.map((grd) => {
          const stg = stages.find((st) => st.id === grd.stageId);
          const grdClasses = classes.filter((c) => c.gradeId === grd.id && branchFilterPredicate(c.branchId));
          const totalCap = grdClasses.reduce((acc, c) => acc + (c.capacity || 0), 0);

          return {
            stageNameAr: stg?.nameAr || '-',
            gradeNameAr: grd.nameAr,
            gradeCode: grd.gradeCode,
            classesCount: grdClasses.length,
            totalCapacity: totalCap,
          };
        });

        summary.push(
          { key: 'stages', labelAr: 'المراحل الدراسية', labelEn: 'Stages', value: stages.length, color: 'blue' },
          { key: 'grades', labelAr: 'الصفوف المعتمدة', labelEn: 'Grades', value: grades.length },
          { key: 'classes', labelAr: 'إجمالي الفصول المدرسية', labelEn: 'Total Classes', value: rows.reduce((acc, r) => acc + r.classesCount, 0), color: 'emerald' }
        );
        break;
      }

      // 13. classes_report
      case 'classes_report': {
        const branchClasses = classes.filter((c) => branchFilterPredicate(c.branchId));

        rows = branchClasses.map((c) => {
          const grd = grades.find((g) => g.id === c.gradeId);
          const enrolled = enrollments.filter((e) => e.classId === c.id && e.status === 'ENROLLED').length;
          const cap = c.capacity || 30;
          const occPct = Math.round((enrolled / cap) * 100);

          return {
            classCode: c.classCode,
            nameAr: c.nameAr,
            gradeNameAr: grd?.nameAr || '-',
            capacity: cap,
            enrolledCount: enrolled,
            occupancyRate: `${occPct}%`,
            roomNumber: c.roomNumber || '-',
          };
        });

        const totalCapacity = rows.reduce((acc, r) => acc + r.capacity, 0);
        const totalEnrolled = rows.reduce((acc, r) => acc + r.enrolledCount, 0);
        summary.push(
          { key: 'total_classes', labelAr: 'عدد الفصول', labelEn: 'Total Classes', value: rows.length, color: 'blue' },
          { key: 'total_capacity', labelAr: 'السعة الكلية للمقاعد', labelEn: 'Total Capacity', value: totalCapacity },
          { key: 'total_enrolled', labelAr: 'الطلاب المقيدون', labelEn: 'Enrolled Students', value: totalEnrolled, color: 'emerald' }
        );
        break;
      }

      // 14. subjects_report
      case 'subjects_report': {
        const branchSubjects = subjects.filter((s) => branchFilterPredicate(s.branchId));
        rows = branchSubjects.map((s) => ({
          code: s.subjectCode,
          nameAr: s.nameAr,
          nameEn: s.nameEn || '-',
          status: s.status === 'active' ? 'نشطة' : 'معطلة',
        }));

        summary.push(
          { key: 'subjects_count', labelAr: 'إجمالي المواد المعتمدة', labelEn: 'Total Subjects', value: rows.length, color: 'blue' }
        );
        break;
      }

      // 15. weekly_timetable
      case 'weekly_timetable': {
        let entries = timetableStorage.getRawTimetableEntries().filter((e) => branchFilterPredicate(e.branchId));
        if (filters.academicYearId) entries = entries.filter((e) => e.academicYearId === filters.academicYearId);
        if (filters.classId) entries = entries.filter((e) => e.classId === filters.classId);
        if (filters.teacherId) entries = entries.filter((e) => e.teacherId === filters.teacherId);

        const rooms = timetableStorage.getRawRooms();
        const periods = timetableStorage.getRawPeriods();

        rows = entries.map((e) => {
          const cls = classes.find((c) => c.id === e.classId);
          const sbj = subjects.find((s) => s.id === e.subjectId);
          const tch = teachers.find((t) => t.id === e.teacherId);
          const rm = rooms.find((r) => r.id === e.roomId);
          const prd = periods.find((p) => p.id === e.periodId);

          return {
            dayOfWeek: e.dayOfWeek,
            periodNumber: prd?.periodNumber ?? (e as any).periodNumber ?? 1,
            classNameAr: cls?.nameAr || '-',
            subjectNameAr: sbj?.nameAr || '-',
            teacherNameAr: tch ? `${tch.firstNameAr} ${tch.lastNameAr}` : '-',
            roomCode: rm?.roomCode || '-',
            status: e.status === 'PUBLISHED' ? 'معتمد' : 'مسودة',
          };
        });

        summary.push(
          { key: 'total_lessons', labelAr: 'إجمالي الحصص المجدولة', labelEn: 'Total Scheduled Lessons', value: rows.length, color: 'blue' },
          { key: 'published_lessons', labelAr: 'الحصص المعتمدة', labelEn: 'Published Lessons', value: rows.filter((r) => r.status === 'معتمد').length, color: 'emerald' }
        );
        break;
      }

      // 16. class_timetable
      case 'class_timetable': {
        const targetClassId = filters.classId || classes.find((c) => branchFilterPredicate(c.branchId))?.id;
        const entries = timetableStorage.getRawTimetableEntries().filter(
          (e) => e.classId === targetClassId && e.status === 'PUBLISHED'
        );
        const rooms = timetableStorage.getRawRooms();
        const periods = timetableStorage.getRawPeriods();

        rows = entries.map((e) => {
          const sbj = subjects.find((s) => s.id === e.subjectId);
          const tch = teachers.find((t) => t.id === e.teacherId);
          const rm = rooms.find((r) => r.id === e.roomId);
          const prd = periods.find((p) => p.id === e.periodId);

          return {
            dayOfWeek: e.dayOfWeek,
            periodNumber: prd?.periodNumber ?? (e as any).periodNumber ?? 1,
            subjectNameAr: sbj?.nameAr || '-',
            teacherNameAr: tch ? `${tch.firstNameAr} ${tch.lastNameAr}` : '-',
            roomCode: rm?.roomCode || '-',
          };
        });

        const targetClass = classes.find((c) => c.id === targetClassId);
        summary.push(
          { key: 'class_name', labelAr: 'الفصل الدراسي', labelEn: 'Class Section', value: targetClass?.nameAr || '-', color: 'blue' },
          { key: 'total_periods', labelAr: 'الحصص الأسبوعية', labelEn: 'Weekly Periods', value: rows.length, color: 'emerald' }
        );
        break;
      }

      // 17. teacher_timetable
      case 'teacher_timetable': {
        const targetTeacherId = filters.teacherId || teachers.find((t) => branchFilterPredicate(t.branchId))?.id;
        const entries = timetableStorage.getRawTimetableEntries().filter(
          (e) => e.teacherId === targetTeacherId && e.status === 'PUBLISHED'
        );
        const rooms = timetableStorage.getRawRooms();
        const periods = timetableStorage.getRawPeriods();

        rows = entries.map((e) => {
          const cls = classes.find((c) => c.id === e.classId);
          const sbj = subjects.find((s) => s.id === e.subjectId);
          const rm = rooms.find((r) => r.id === e.roomId);
          const prd = periods.find((p) => p.id === e.periodId);

          return {
            dayOfWeek: e.dayOfWeek,
            periodNumber: prd?.periodNumber ?? (e as any).periodNumber ?? 1,
            classNameAr: cls?.nameAr || '-',
            subjectNameAr: sbj?.nameAr || '-',
            roomCode: rm?.roomCode || '-',
          };
        });

        const targetTeacher = teachers.find((t) => t.id === targetTeacherId);
        summary.push(
          { key: 'teacher_name', labelAr: 'اسم المعلم', labelEn: 'Teacher Name', value: targetTeacher ? `${targetTeacher.firstNameAr} ${targetTeacher.lastNameAr}` : '-', color: 'blue' },
          { key: 'total_lessons', labelAr: 'إجمالي حصص المعلم', labelEn: 'Total Teacher Lessons', value: rows.length, color: 'emerald' }
        );
        break;
      }

      // 18. room_timetable
      case 'room_timetable': {
        const rooms = timetableStorage.getRawRooms().filter((r) => branchFilterPredicate(r.branchId));
        const entries = timetableStorage.getRawTimetableEntries().filter(
          (e) => branchFilterPredicate(e.branchId) && e.status === 'PUBLISHED'
        );
        const periods = timetableStorage.getRawPeriods();

        rows = entries.map((e) => {
          const rm = rooms.find((r) => r.id === e.roomId);
          const cls = classes.find((c) => c.id === e.classId);
          const sbj = subjects.find((s) => s.id === e.subjectId);
          const prd = periods.find((p) => p.id === e.periodId);

          return {
            roomCode: rm?.roomCode || '-',
            roomNameAr: rm?.nameAr || '-',
            dayOfWeek: e.dayOfWeek,
            periodNumber: prd?.periodNumber ?? (e as any).periodNumber ?? 1,
            classNameAr: cls?.nameAr || '-',
            subjectNameAr: sbj?.nameAr || '-',
          };
        });

        summary.push(
          { key: 'rooms_count', labelAr: 'القاعات المشمولة', labelEn: 'Total Rooms', value: rooms.length, color: 'blue' },
          { key: 'room_usages', labelAr: 'الحصص المجدولة بالقاعات', labelEn: 'Scheduled Room Usages', value: rows.length, color: 'emerald' }
        );
        break;
      }

      // 19. daily_attendance
      case 'daily_attendance': {
        const records = attendanceStorage.getRawRecords().filter((r) => branchFilterPredicate(r.branchId));

        rows = records.map((r) => {
          const s = students.find((std) => std.id === r.studentId);
          const cls = classes.find((c) => c.id === r.classId);

          return {
            date: r.date || '-',
            studentNumber: s?.studentNumber || '-',
            studentNameAr: s ? `${s.firstNameAr} ${s.lastNameAr}` : '-',
            classNameAr: cls?.nameAr || '-',
            status:
              r.status === 'PRESENT'
                ? 'حاضر'
                : r.status === 'ABSENT'
                ? 'غائب'
                : r.status === 'LATE'
                ? 'متأخر'
                : r.status === 'EXCUSED'
                ? 'معذور'
                : r.status,
            notes: r.note || (r as any).remarks || '-',
          };
        });

        const present = rows.filter((r) => r.status === 'حاضر').length;
        const absent = rows.filter((r) => r.status === 'غائب').length;
        summary.push(
          { key: 'total_records', labelAr: 'إجمالي السجلات المرصودة', labelEn: 'Total Records', value: rows.length, color: 'blue' },
          { key: 'present', labelAr: 'حاضر', labelEn: 'Present', value: present, color: 'emerald' },
          { key: 'absent', labelAr: 'غائب', labelEn: 'Absent', value: absent, color: 'rose' }
        );
        break;
      }

      // 20. attendance_by_class
      case 'attendance_by_class': {
        const branchClasses = classes.filter((c) => branchFilterPredicate(c.branchId));
        const records = attendanceStorage.getRawRecords();

        rows = branchClasses.map((c) => {
          const cRecords = records.filter((r) => r.classId === c.id);

          const present = cRecords.filter((r) => r.status === 'PRESENT').length;
          const absent = cRecords.filter((r) => r.status === 'ABSENT').length;
          const late = cRecords.filter((r) => r.status === 'LATE').length;
          const rate = cRecords.length > 0 ? Math.round((present / cRecords.length) * 100) : 0;

          return {
            classNameAr: c.nameAr,
            totalRecords: cRecords.length,
            presentCount: present,
            absentCount: absent,
            lateCount: late,
            attendanceRate: `${rate}%`,
          };
        });

        summary.push(
          { key: 'total_classes', labelAr: 'عدد الفصول المرصودة', labelEn: 'Classes Audited', value: rows.length, color: 'blue' }
        );
        break;
      }

      // 21. attendance_by_student
      case 'attendance_by_student': {
        const targetStudentId = filters.studentId || students.find((s) => branchFilterPredicate(s.branchId))?.id;
        const sessions = attendanceStorage.getRawSessions();
        const records = attendanceStorage.getRawRecords().filter((r) => r.studentId === targetStudentId);

        rows = records.map((r) => {
          const sess = sessions.find((s) => s.classId === r.classId && s.date === r.date);
          return {
            date: r.date || '-',
            status: r.status === 'PRESENT' ? 'حاضر' : r.status === 'ABSENT' ? 'غائب' : r.status,
            sessionStatus: sess?.status === 'LOCKED' ? 'مغلقة' : sess?.status === 'SUBMITTED' ? 'معتمدة' : 'مفتوحة',
            notes: r.note || (r as any).remarks || '-',
          };
        });

        const targetStudent = students.find((s) => s.id === targetStudentId);
        summary.push(
          { key: 'student_name', labelAr: 'اسم الطالب', labelEn: 'Student Name', value: targetStudent ? `${targetStudent.firstNameAr} ${targetStudent.lastNameAr}` : '-', color: 'blue' },
          { key: 'total_days', labelAr: 'إجمالي الأيام المرصودة', labelEn: 'Audited Days', value: rows.length, color: 'emerald' }
        );
        break;
      }

      // 22. attendance_summary
      case 'attendance_summary': {
        const allowedBranches = targetBranchId === 'all'
          ? branches.filter((b) => authStorage.isSuperAdmin(actingUser) || (actingUser.branchIds || []).includes(b.id))
          : branches.filter((b) => b.id === targetBranchId);

        const sessions = attendanceStorage.getRawSessions();
        const records = attendanceStorage.getRawRecords();

        rows = allowedBranches.map((b) => {
          const bSessions = sessions.filter((s) => s.branchId === b.id);
          const bRecords = records.filter((r) => r.branchId === b.id);

          const present = bRecords.filter((r) => r.status === 'PRESENT').length;
          const absent = bRecords.filter((r) => r.status === 'ABSENT').length;
          const rate = bRecords.length > 0 ? Math.round((present / bRecords.length) * 100) : 0;
          const absRate = bRecords.length > 0 ? Math.round((absent / bRecords.length) * 100) : 0;

          return {
            branchNameAr: b.nameAr,
            totalSessions: bSessions.length,
            totalRecords: bRecords.length,
            attendanceRate: `${rate}%`,
            absenceRate: `${absRate}%`,
          };
        });

        summary.push(
          { key: 'campuses', labelAr: 'الفروع المشمولة', labelEn: 'Branches Audited', value: rows.length, color: 'blue' }
        );
        break;
      }

      // 23. absence_late_report
      case 'absence_late_report': {
        const records = attendanceStorage.getRawRecords().filter(
          (r) => branchFilterPredicate(r.branchId) && (r.status === 'ABSENT' || r.status === 'LATE')
        );

        rows = records.map((r) => {
          const s = students.find((std) => std.id === r.studentId);
          const cls = classes.find((c) => c.id === r.classId);

          return {
            date: r.date || '-',
            studentNumber: s?.studentNumber || '-',
            studentNameAr: s ? `${s.firstNameAr} ${s.lastNameAr}` : '-',
            classNameAr: cls?.nameAr || '-',
            type: r.status === 'ABSENT' ? 'غياب كامل' : 'تأخر صباحي',
            notes: r.note || (r as any).remarks || 'لم يقدّم عذر رسمي',
          };
        });

        summary.push(
          { key: 'total_violations', labelAr: 'إجمالي حالات الغياب والتأخر', labelEn: 'Absence/Tardy Cases', value: rows.length, color: 'rose' }
        );
        break;
      }

      // 24. fee_collection_summary
      case 'fee_collection_summary': {
        let invoices = financeStorage.getRawInvoices().filter((inv) => branchFilterPredicate(inv.branchId));
        let payments = financeStorage.getRawPayments().filter((p) => branchFilterPredicate(p.branchId));
        let refunds = financeStorage.getRawRefunds().filter((r) => branchFilterPredicate(r.branchId));

        if (filters.academicYearId) {
          invoices = invoices.filter((i) => i.academicYearId === filters.academicYearId);
        }

        const invoicedMinor = invoices.reduce((acc, i) => acc + i.netTotalMinor, 0);
        const collectedMinor = payments.reduce((acc, p) => acc + p.amountMinor, 0);
        const refundedMinor = refunds.reduce((acc, r) => acc + r.amountMinor, 0);
        const netCollectedMinor = Math.max(0, collectedMinor - refundedMinor);
        const outstandingMinor = Math.max(0, invoicedMinor - netCollectedMinor);
        const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');
        const overdueMinor = overdueInvoices.reduce((acc, i) => acc + i.balanceDueMinor, 0);

        const collectionRate = invoicedMinor > 0 ? Math.round((netCollectedMinor / invoicedMinor) * 100) : 0;

        rows = [
          {
            metricNameAr: 'إجمالي الرسوم المفوترة والمطالبات',
            amountFormatted: formatCurrency(invoicedMinor),
            percentage: '100%',
          },
          {
            metricNameAr: 'إجمالي المبالغ المحصلة فعلياً (سندات القبض)',
            amountFormatted: formatCurrency(collectedMinor),
            percentage: `${invoicedMinor > 0 ? Math.round((collectedMinor / invoicedMinor) * 100) : 0}%`,
          },
          {
            metricNameAr: 'سندات الصرف والاسترداد',
            amountFormatted: formatCurrency(refundedMinor),
            percentage: `${collectedMinor > 0 ? Math.round((refundedMinor / collectedMinor) * 100) : 0}%`,
          },
          {
            metricNameAr: 'صافي الإيرادات المحصلة',
            amountFormatted: formatCurrency(netCollectedMinor),
            percentage: `${collectionRate}%`,
          },
          {
            metricNameAr: 'المبالغ المتبقية المستحقة (المتأخرات)',
            amountFormatted: formatCurrency(outstandingMinor),
            percentage: `${100 - collectionRate}%`,
          },
          {
            metricNameAr: 'المبالغ المتأخرة بعد تاريخ الاستحقاق',
            amountFormatted: formatCurrency(overdueMinor),
            percentage: `${invoicedMinor > 0 ? Math.round((overdueMinor / invoicedMinor) * 100) : 0}%`,
          },
        ];

        summary.push(
          { key: 'invoiced', labelAr: 'إجمالي المفوتر', labelEn: 'Invoiced', value: formatCurrency(invoicedMinor), color: 'blue' },
          { key: 'collected', labelAr: 'صافي المحصل', labelEn: 'Net Collected', value: formatCurrency(netCollectedMinor), color: 'emerald' },
          { key: 'outstanding', labelAr: 'المتبقي المستحق', labelEn: 'Outstanding', value: formatCurrency(outstandingMinor), color: 'amber' },
          { key: 'rate', labelAr: 'نسبة التحصيل', labelEn: 'Collection Rate', value: `${collectionRate}%` }
        );
        break;
      }

      // 25. outstanding_fees
      case 'outstanding_fees': {
        let invoices = financeStorage.getRawInvoices().filter((inv) => branchFilterPredicate(inv.branchId) && inv.balanceDueMinor > 0);
        if (filters.academicYearId) invoices = invoices.filter((i) => i.academicYearId === filters.academicYearId);

        rows = invoices.map((inv) => {
          const s = students.find((std) => std.id === inv.studentId);
          return {
            invoiceNumber: inv.invoiceNumber,
            studentNameAr: s ? (s.fullNameAr || `${s.firstNameAr} ${s.lastNameAr}`) : '-',
            studentNumber: s?.studentNumber || '-',
            dueDate: inv.dueDate,
            netTotalFormatted: formatCurrency(inv.netTotalMinor),
            paidTotalFormatted: formatCurrency(inv.paidTotalMinor),
            balanceDueFormatted: formatCurrency(inv.balanceDueMinor),
            status: inv.status === 'OVERDUE' ? 'متأخرة' : inv.status === 'PARTIALLY_PAID' ? 'سداد جزئي' : 'مستحقة',
          };
        });

        const totalDueMinor = invoices.reduce((acc, i) => acc + i.balanceDueMinor, 0);
        summary.push(
          { key: 'invoices_count', labelAr: 'عدد الفواتير المستحقة', labelEn: 'Invoices Count', value: rows.length, color: 'blue' },
          { key: 'total_due', labelAr: 'إجمالي المبالغ المستحقة', labelEn: 'Total Balance Due', value: formatCurrency(totalDueMinor), color: 'rose' }
        );
        break;
      }

      // 26. overdue_fees
      case 'overdue_fees': {
        const today = new Date().toISOString().slice(0, 10);
        const overdueInvoices = financeStorage.getRawInvoices().filter(
          (inv) => branchFilterPredicate(inv.branchId) && inv.balanceDueMinor > 0 && inv.dueDate < today
        );

        rows = overdueInvoices.map((inv) => {
          const s = students.find((std) => std.id === inv.studentId);
          const dueTimestamp = new Date(inv.dueDate).getTime();
          const nowTimestamp = new Date(today).getTime();
          const diffDays = Math.max(0, Math.floor((nowTimestamp - dueTimestamp) / (1000 * 60 * 60 * 24)));

          return {
            invoiceNumber: inv.invoiceNumber,
            studentNameAr: s ? (s.fullNameAr || `${s.firstNameAr} ${s.lastNameAr}`) : '-',
            dueDate: inv.dueDate,
            daysOverdue: `${diffDays} يوم`,
            balanceDueFormatted: formatCurrency(inv.balanceDueMinor),
          };
        });

        const overdueTotalMinor = overdueInvoices.reduce((acc, i) => acc + i.balanceDueMinor, 0);
        summary.push(
          { key: 'overdue_count', labelAr: 'عدد الفواتير المتأخرة', labelEn: 'Overdue Count', value: rows.length, color: 'rose' },
          { key: 'overdue_total', labelAr: 'إجمالي المبالغ المتأخرة', labelEn: 'Total Overdue Amount', value: formatCurrency(overdueTotalMinor), color: 'rose' }
        );
        break;
      }

      // 27. payments_register
      case 'payments_register': {
        let payments = financeStorage.getRawPayments().filter((p) => branchFilterPredicate(p.branchId));
        if (filters.startDate) payments = payments.filter((p) => p.paymentDate >= filters.startDate!);
        if (filters.endDate) payments = payments.filter((p) => p.paymentDate <= filters.endDate!);

        const allInvoices = financeStorage.getRawInvoices();
        rows = payments.map((p) => {
          const inv = allInvoices.find((i) => i.id === p.invoiceId);
          const s = students.find((std) => std.id === p.studentId);
          return {
            receiptNumber: p.receiptNumber,
            paymentDate: p.paymentDate,
            invoiceNumber: inv?.invoiceNumber || '-',
            studentNameAr: s ? (s.fullNameAr || `${s.firstNameAr} ${s.lastNameAr}`) : '-',
            amountFormatted: formatCurrency(p.amountMinor),
            method: p.method,
            reference: p.reference || '-',
            receivedByName: p.receivedByName,
          };
        });

        const totalPaymentsMinor = payments.reduce((acc, p) => acc + p.amountMinor, 0);
        summary.push(
          { key: 'payments_count', labelAr: 'عدد سندات القبض', labelEn: 'Receipts Count', value: rows.length, color: 'blue' },
          { key: 'payments_total', labelAr: 'إجمالي المقبوضات', labelEn: 'Total Collected', value: formatCurrency(totalPaymentsMinor), color: 'emerald' }
        );
        break;
      }

      // 28. refunds_report
      case 'refunds_report': {
        let refunds = financeStorage.getRawRefunds().filter((r) => branchFilterPredicate(r.branchId));
        if (filters.startDate) refunds = refunds.filter((r) => r.refundDate >= filters.startDate!);
        if (filters.endDate) refunds = refunds.filter((r) => r.refundDate <= filters.endDate!);

        const allPayments = financeStorage.getRawPayments();
        rows = refunds.map((r) => {
          const pmt = allPayments.find((p) => p.id === r.paymentId);
          const s = students.find((std) => std.id === r.studentId);
          return {
            refundNumber: r.refundNumber,
            refundDate: r.refundDate,
            receiptNumber: pmt?.receiptNumber || '-',
            studentNameAr: s ? (s.fullNameAr || `${s.firstNameAr} ${s.lastNameAr}`) : '-',
            amountFormatted: formatCurrency(r.amountMinor),
            reason: r.reason,
            approvedByName: r.approvedByName || '-',
          };
        });

        const totalRefundsMinor = refunds.reduce((acc, r) => acc + r.amountMinor, 0);
        summary.push(
          { key: 'refunds_count', labelAr: 'عدد سندات الصرف', labelEn: 'Refunds Count', value: rows.length, color: 'blue' },
          { key: 'refunds_total', labelAr: 'إجمالي المبالغ المستردة', labelEn: 'Total Refunds', value: formatCurrency(totalRefundsMinor), color: 'amber' }
        );
        break;
      }

      // 29. student_financial_statement
      case 'student_financial_statement': {
        const targetStudentId = filters.studentId || students.find((s) => branchFilterPredicate(s.branchId))?.id;
        const targetStudent = students.find((s) => s.id === targetStudentId);

        const invoices = financeStorage.getRawInvoices().filter((i) => i.studentId === targetStudentId);
        const payments = financeStorage.getRawPayments().filter((p) => p.studentId === targetStudentId);
        const refunds = financeStorage.getRawRefunds().filter((r) => r.studentId === targetStudentId);

        type StatementEntry = {
          date: string;
          transactionType: string;
          referenceNumber: string;
          description: string;
          debitMinor: number;
          creditMinor: number;
        };

        const entries: StatementEntry[] = [];

        invoices.forEach((inv) => {
          entries.push({
            date: inv.issueDate,
            transactionType: 'فاتورة دراسية',
            referenceNumber: inv.invoiceNumber,
            description: `إصدار فاتورة رسوم #${inv.invoiceNumber}`,
            debitMinor: inv.netTotalMinor,
            creditMinor: 0,
          });
        });

        payments.forEach((pay) => {
          entries.push({
            date: pay.paymentDate,
            transactionType: 'سند سداد',
            referenceNumber: pay.receiptNumber,
            description: `سداد دفعة نقدية/إلكترونية (${pay.method})`,
            debitMinor: 0,
            creditMinor: pay.amountMinor,
          });
        });

        refunds.forEach((ref) => {
          entries.push({
            date: ref.refundDate,
            transactionType: 'سند استرداد',
            referenceNumber: ref.refundNumber,
            description: `استرداد مالي: ${ref.reason}`,
            debitMinor: ref.amountMinor,
            creditMinor: 0,
          });
        });

        entries.sort((a, b) => a.date.localeCompare(b.date));

        let runningBalanceMinor = 0;
        rows = entries.map((entry) => {
          runningBalanceMinor += entry.debitMinor - entry.creditMinor;
          return {
            date: entry.date,
            transactionType: entry.transactionType,
            referenceNumber: entry.referenceNumber,
            description: entry.description,
            debitFormatted: entry.debitMinor > 0 ? formatCurrency(entry.debitMinor) : '-',
            creditFormatted: entry.creditMinor > 0 ? formatCurrency(entry.creditMinor) : '-',
            balanceFormatted: formatCurrency(runningBalanceMinor),
          };
        });

        const totalInvoicedMinor = invoices.reduce((acc, i) => acc + i.netTotalMinor, 0);
        const totalPaidMinor = payments.reduce((acc, p) => acc + p.amountMinor, 0);
        const totalBalanceMinor = Math.max(0, totalInvoicedMinor - totalPaidMinor);

        summary.push(
          { key: 'student', labelAr: 'اسم الطالب', labelEn: 'Student', value: targetStudent ? `${targetStudent.firstNameAr} ${targetStudent.lastNameAr}` : '-', color: 'blue' },
          { key: 'total_invoiced', labelAr: 'إجمالي المفوتر', labelEn: 'Total Invoiced', value: formatCurrency(totalInvoicedMinor) },
          { key: 'total_paid', labelAr: 'إجمالي المسدد', labelEn: 'Total Paid', value: formatCurrency(totalPaidMinor), color: 'emerald' },
          { key: 'current_balance', labelAr: 'الرصيد المستحق الحالي', labelEn: 'Current Balance Due', value: formatCurrency(totalBalanceMinor), color: 'rose' }
        );
        break;
      }

      // 30. invoices_register
      case 'invoices_register': {
        let invoices = financeStorage.getRawInvoices().filter((inv) => branchFilterPredicate(inv.branchId));
        if (filters.academicYearId) invoices = invoices.filter((i) => i.academicYearId === filters.academicYearId);
        if (filters.status) invoices = invoices.filter((i) => i.status === filters.status);

        rows = invoices.map((inv) => {
          const s = students.find((std) => std.id === inv.studentId);
          return {
            invoiceNumber: inv.invoiceNumber,
            issueDate: inv.issueDate,
            studentNameAr: s ? (s.fullNameAr || `${s.firstNameAr} ${s.lastNameAr}`) : '-',
            dueDate: inv.dueDate,
            netTotalFormatted: formatCurrency(inv.netTotalMinor),
            paidTotalFormatted: formatCurrency(inv.paidTotalMinor),
            balanceDueFormatted: formatCurrency(inv.balanceDueMinor),
            status:
              inv.status === 'PAID'
                ? 'مسددة'
                : inv.status === 'OVERDUE'
                ? 'متأخرة'
                : inv.status === 'PARTIALLY_PAID'
                ? 'سداد جزئي'
                : 'مستحقة',
          };
        });

        const totalInvoiced = invoices.reduce((acc, i) => acc + i.netTotalMinor, 0);
        const totalCollected = invoices.reduce((acc, i) => acc + i.paidTotalMinor, 0);
        summary.push(
          { key: 'count', labelAr: 'عدد الفواتير', labelEn: 'Invoices Count', value: rows.length, color: 'blue' },
          { key: 'net', labelAr: 'إجمالي قيمة الفواتير', labelEn: 'Total Invoices Net', value: formatCurrency(totalInvoiced), color: 'blue' },
          { key: 'paid', labelAr: 'المحصل منها', labelEn: 'Total Collected', value: formatCurrency(totalCollected), color: 'emerald' }
        );
        break;
      }

      // 31. branch_overview
      case 'branch_overview': {
        const allowedBranches = targetBranchId === 'all'
          ? branches.filter((b) => authStorage.isSuperAdmin(actingUser) || (actingUser.branchIds || []).includes(b.id))
          : branches.filter((b) => b.id === targetBranchId);

        rows = allowedBranches.map((b) => {
          const bStudents = students.filter((s) => s.branchId === b.id && s.status === 'ACTIVE').length;
          const bTeachers = teachers.filter((t) => t.branchId === b.id && t.employmentStatus === 'ACTIVE').length;
          const bClasses = classes.filter((c) => c.branchId === b.id).length;

          return {
            branchNameAr: b.nameAr,
            branchCode: b.code,
            city: b.city,
            managerName: b.managerName || 'غير محدد',
            studentsCount: bStudents,
            teachersCount: bTeachers,
            classesCount: bClasses,
            status: b.status === 'active' ? 'نشط' : 'معطل',
          };
        });

        summary.push(
          { key: 'branches', labelAr: 'الفروع', labelEn: 'Branches', value: rows.length, color: 'blue' },
          { key: 'total_students', labelAr: 'إجمالي الطلاب النشطين', labelEn: 'Total Active Students', value: rows.reduce((acc, r) => acc + r.studentsCount, 0), color: 'emerald' }
        );
        break;
      }

      // 32. cross_branch_comparison
      case 'cross_branch_comparison': {
        const allowedBranches = branches.filter(
          (b) => authStorage.isSuperAdmin(actingUser) || (actingUser.branchIds || []).includes(b.id)
        );

        const invoices = financeStorage.getRawInvoices();
        const payments = financeStorage.getRawPayments();
        const records = attendanceStorage.getRawRecords();

        rows = allowedBranches.map((b) => {
          const bStudents = students.filter((s) => s.branchId === b.id && s.status === 'ACTIVE').length;
          const bTeachers = teachers.filter((t) => t.branchId === b.id && t.employmentStatus === 'ACTIVE').length;
          const bClasses = classes.filter((c) => c.branchId === b.id).length;

          const bInvoices = invoices.filter((i) => i.branchId === b.id);
          const bPayments = payments.filter((p) => p.branchId === b.id);
          const invMinor = bInvoices.reduce((acc, i) => acc + i.netTotalMinor, 0);
          const collMinor = bPayments.reduce((acc, p) => acc + p.amountMinor, 0);

          const bRecords = records.filter((r) => r.branchId === b.id);
          const present = bRecords.filter((r) => r.status === 'PRESENT').length;
          const rate = bRecords.length > 0 ? `${Math.round((present / bRecords.length) * 100)}%` : '0%';

          return {
            branchNameAr: b.nameAr,
            studentsCount: bStudents,
            teachersCount: bTeachers,
            classesCount: bClasses,
            invoicedFormatted: formatCurrency(invMinor),
            collectedFormatted: formatCurrency(collMinor),
            attendanceRate: rate,
          };
        });

        summary.push(
          { key: 'branches_count', labelAr: 'الفروع المقارنة', labelEn: 'Campuses Compared', value: rows.length, color: 'blue' }
        );
        break;
      }

      default:
        throw new Error(`معالجة التقرير (${reportId}) غير مدعومة حالياً.`);
    }

    // Prepare Filter Summary
    const filterSummary: { labelAr: string; labelEn: string; value: string }[] = [];
    filterSummary.push({
      labelAr: 'الفرع المدرسي',
      labelEn: 'Branch Campus',
      value: currentBranch.nameAr || targetBranchId,
    });

    if (selectedYear) {
      filterSummary.push({
        labelAr: 'العام الدراسي',
        labelEn: 'Academic Year',
        value: selectedYear.nameAr,
      });
    }

    if (filters.status) {
      filterSummary.push({
        labelAr: 'الحالة المحددة',
        labelEn: 'Status Filter',
        value: filters.status,
      });
    }

    if (filters.startDate || filters.endDate) {
      filterSummary.push({
        labelAr: 'الفترة الزمنية',
        labelEn: 'Date Range',
        value: `${filters.startDate || 'البداية'} إلى ${filters.endDate || 'النهاية'}`,
      });
    }

    // Log audit
    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'REPORT_GENERATED',
      targetType: 'REPORT',
      targetId: reportId,
      branchContext: targetBranchId,
      result: 'SUCCESS',
      details: `تم إنشاء تقرير (${definition.titleAr}) بنجاح وعدد السجلات: ${rows.length}`,
    });

    return {
      definition,
      generatedAt: new Date().toISOString(),
      generatedBy: actingUser.fullName,
      branchNameAr: currentBranch.nameAr || targetBranchId,
      branchNameEn: currentBranch.nameEn || targetBranchId,
      academicYearNameAr: selectedYear?.nameAr,
      academicYearNameEn: selectedYear?.nameEn,
      filterSummary,
      columns: definition.columns,
      rows,
      summary,
      totalRows: rows.length,
    };
  }
}

export const reportStorage = ReportStorageService.getInstance();
