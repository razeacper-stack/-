import React from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { useTranslation } from '../../context/LanguageContext';

export interface UpcomingPhaseViewProps {
  tabId: string;
  onBackToDashboard: () => void;
}

const TAB_PHASE_INFO: Record<string, { phase: number; titleAr: string; titleEn: string; descAr: string; descEn: string }> = {
  branches: {
    phase: 3,
    titleAr: 'إدارة الفروع (Multi-Branch Management)',
    titleEn: 'Multi-Branch Management',
    descAr: 'إضافة وتعديل وحذف الفروع، وتعيين مدراء الفروع، ومراقبة السعة الاستيعابية لكل حرم مدرسي.',
    descEn: 'Configure campuses, assign branch managers, and manage capacity.',
  },
  stages: {
    phase: 4,
    titleAr: 'الهيكل الدراسي والمراحل والصفوف',
    titleEn: 'Academic Structure & Stages',
    descAr: 'إنشاء المراحل التعليمية (ابتدائي، متوسط، ثانوي)، وتحديد الصفوف والفصول والمواد.',
    descEn: 'Define educational stages, grades, sections, and curriculum.',
  },
  subjects: {
    phase: 4,
    titleAr: 'المواد والمناهج الدراسية',
    titleEn: 'Curriculum & Subjects',
    descAr: 'إدارة المواد الدراسية وربطها بالمراحل والصفوف وساعات التدريس المعتمدة.',
    descEn: 'Manage curriculum subjects and stage mappings.',
  },
  students: {
    phase: 5,
    titleAr: 'إدارة الطلاب وأولياء الأمور',
    titleEn: 'Students & Parents Management',
    descAr: 'تسجيل الطلاب، بيانات ولي الأمر، التصفية بالفرع والمرحلة والصف، والملف الشامل للطالب (Profile).',
    descEn: 'Student directory, profile views, filtering by branch and classroom, parent info.',
  },
  teachers: {
    phase: 6,
    titleAr: 'إدارة الكادر التعليمي (دائم ومؤقت)',
    titleEn: 'Faculty & Teachers Management',
    descAr: 'المعلمون الدائمون، والمعلمون بنظام الحصة (المؤقتون) مع احتساب المستحقات المالية التلقائية.',
    descEn: 'Permanent salaried teachers and per-lesson hourly instructors with payroll calculation.',
  },
  timetable: {
    phase: 7,
    titleAr: 'الجداول المدرسية وتوزيع الحصص',
    titleEn: 'Timetable & Lesson Scheduling',
    descAr: 'بناء جداول الحصص الأسبوعية حسب الفرع والصف والمعلم وتفادي التعارضات.',
    descEn: 'Weekly schedules by branch, grade, section, and teacher without scheduling conflicts.',
  },
  attendance: {
    phase: 8,
    titleAr: 'منظومة الحضور والغياب اليومي',
    titleEn: 'Attendance & Absence Tracking',
    descAr: 'رصد الحضور (حاضر، غائب، متأخر، معذور) حسب الفصل والطالب، مع الإحصائيات الدقيقة.',
    descEn: 'Daily roll call tracking, tardiness, excusals, and real-time attendance rates.',
  },
  fees: {
    phase: 9,
    titleAr: 'الرسوم المدرسية وسندات القبض',
    titleEn: 'Tuition Fees & Payments',
    descAr: 'إدارة الرسوم الدراسية، تسجيل الدفعات، إصدار الإيصالات، وتتبع المتبقي وحالة الدفع.',
    descEn: 'Tuition management, payments ledger, receipts issuance, and balance tracking.',
  },
  reports: {
    phase: 11,
    titleAr: 'التقارير الشاملة والطباعة والتصدير',
    titleEn: 'Reporting, Analytics & Exporting',
    descAr: 'تقارير الطلاب، الحضور، الرسوم، المعلمين، والفروع مع دعم الطباعة والتصدير.',
    descEn: 'Comprehensive multi-campus analytics, PDF printing, and export tools.',
  },
  ai_assistant: {
    phase: 12,
    titleAr: 'المساعد الذكي لإدارة المدرسة (AI School Assistant)',
    titleEn: 'AI School Assistant',
    descAr: 'مساعد ذكي مدعوم بنماذج Gemini للإجابة عن أسئلة الإدارة، وتحليل الحضور والرسوم، واقتراح الجداول.',
    descEn: 'Conversational school management AI for analytics, scheduling insights, and inquiries.',
  },
  users: {
    phase: 2,
    titleAr: 'إدارة المستخدمين والأدوار والصلاحيات (Auth & RBAC)',
    titleEn: 'Users, Roles & Permissions (Phase 2)',
    descAr: 'هذه هي المرحلة التالية مباشرة بعد اعتماد اختبار المرحلة 1: إنشاء المستخدمين، تحديد الأدوار، الصلاحيات الدقيقة، وعزل الفروع.',
    descEn: 'This is the immediate next phase: Super Admin, Branch Managers, RBAC, and granular permissions.',
  },
  audit_logs: {
    phase: 13,
    titleAr: 'سجل العمليات والأمان (Audit Trail)',
    titleEn: 'Security & Audit Logging',
    descAr: 'تتبع كل عمليات تسجيل الدخول، والتعديلات على الطلاب، والرسوم، والحضور بدقة.',
    descEn: 'System activity logging and immutable audit trails.',
  },
  settings: {
    phase: 14,
    titleAr: 'إعدادات النظام العامة',
    titleEn: 'System Settings',
    descAr: 'تخصيص بيانات المدرسة، السنة الأكاديمية النشطة، وسياسات النظام.',
    descEn: 'School branding, active academic years, and global parameters.',
  },
};

export const UpcomingPhaseView: React.FC<UpcomingPhaseViewProps> = ({
  tabId,
  onBackToDashboard,
}) => {
  const { language, direction, t } = useTranslation();
  const ArrowIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;
  const info = TAB_PHASE_INFO[tabId] || {
    phase: 2,
    titleAr: 'قسم قيد التطوير وفق الخارطة',
    titleEn: 'Upcoming Module',
    descAr: 'هذا القسم مجدول للتنفيذ وفق خارطة العمل المعتمدة.',
    descEn: 'Scheduled for implementation in sequence.',
  };

  const isNextPhase = info.phase === 2;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowIcon className="w-4 h-4" />}
        onClick={onBackToDashboard}
      >
        {t('common.back')} {t('nav.dashboard')}
      </Button>

      <Card className="text-center p-8 sm:p-12 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 shadow-sm">
          {isNextPhase ? (
            <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          ) : (
            <Lock className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Badge variant={isNextPhase ? 'primary' : 'neutral'} size="md">
              {isNextPhase ? 'المرحلة التالية المباشرة' : `Phase ${info.phase}`}
            </Badge>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {language === 'ar' ? info.titleAr : info.titleEn}
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            {language === 'ar' ? info.descAr : info.descEn}
          </p>
        </div>

        {isNextPhase ? (
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 max-w-md mx-auto">
            سيتم البدء في بناء هذه المرحلة (المستخدمون والصلاحيات) فور تأكيد نجاح اختبار المرحلة 1 الحالية.
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            يتم العمل بنظام تسلسلي دقيق وفق تعليماتك: المرحلة 1 ← اختبار واكتمال ← المرحلة 2 ← وهكذا.
          </div>
        )}

        <div className="pt-2">
          <Button variant="primary" onClick={onBackToDashboard}>
            {language === 'ar' ? 'العودة إلى لوحة تحكم المرحلة 1' : 'Return to Phase 1 Dashboard'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
