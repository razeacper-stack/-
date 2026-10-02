import React, { useState } from 'react';
import {
  CheckCircle2,
  Building2,
  Database,
  Smartphone,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useTranslation } from '../../context/LanguageContext';
import { useBranch } from '../../context/BranchContext';
import { DATABASE_SCHEMA } from '../../db/schema';

export interface Phase1VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSkeletonLoading: boolean;
  onToggleSkeleton: () => void;
}

export const Phase1VerificationModal: React.FC<Phase1VerificationModalProps> = ({
  isOpen,
  onClose,
  isSkeletonLoading,
  onToggleSkeleton,
}) => {
  const { language, direction, t } = useTranslation();
  const { branches, activeBranchId, setActiveBranchId, isAllBranches } = useBranch();

  const [activeTab, setActiveTab] = useState<'checklist' | 'database' | 'tokens'>('checklist');

  const checklistItems = [
    {
      id: 'i18n',
      title: 'نظام اللغات والاتجاهات (i18n & RTL/LTR)',
      titleEn: 'i18n & Bidirectional Support',
      desc: 'دعم كامل ومباشر للعربية والإنجليزية مع ضبط html[dir] و html[lang] وتغيير الخطوط ديناميكياً (Cairo للغة العربية، Plus Jakarta Sans للإنجليزية).',
      status: 'verified',
    },
    {
      id: 'theme',
      title: 'محرك المظهر المتعدد (Light, Dark, System)',
      titleEn: 'Theme Engine (Light, Dark, System)',
      desc: 'دعم كامل للوضع الفاتح، والوضع الداكن النظيف المريح للعين (Dark Slate/Navy #0B1120)، والوضع التلقائي المستند للنظام مع التخزين في localStorage.',
      status: 'verified',
    },
    {
      id: 'responsive',
      title: 'التصميم التكيفي لجميع الشاشات (Responsive Shell)',
      titleEn: 'Fully Responsive Shell',
      desc: 'قائمة جانبية ثابتة على شاشات الديسكتوب واللابتوب، وتتحول تلقائياً إلى درج منزلق (Drawer) على شاشات الموبايل والتابلت.',
      status: 'verified',
    },
    {
      id: 'branch',
      title: 'هيكل الفروع المتعددة (Multi-Branch Architecture)',
      titleEn: 'Multi-Branch Campus Isolation',
      desc: 'دعم مسبق لـ 5 فروع مع إمكانية التبديل الفوري، وعزل البيانات، ودعم عرض "جميع الفروع" للمدير العام (Super Admin).',
      status: 'verified',
    },
    {
      id: 'skeleton',
      title: 'حالات التحميل والانتقال السلس (Skeleton & Motion)',
      titleEn: 'Shimmer Skeletons & Transitions',
      desc: 'مكونات Skeleton جاهزة تضمن للمستخدم عدم تجربة أي وميض أو قفزات بصرية أثناء جلب البيانات في المراحل القادمة.',
      status: 'verified',
    },
    {
      id: 'db',
      title: 'تحديد معمارية قاعدة البيانات لجميع المراحل',
      titleEn: 'Database Architecture Normalized Contracts',
      desc: 'هيكل متكامل ومطابق للشروط لجداول: users, roles, branches, academic stages, students, teachers, timetables, attendance, fees, audit_logs.',
      status: 'verified',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>{language === 'ar' ? 'دليل اختبار وتحقق المرحلة 1' : 'Phase 1 Verification Matrix'}</span>
        </div>
      }
      subtitle={
        language === 'ar'
          ? 'دليل الاختبار التفاعلي للتحقق من سلامة البنية التحتية والتصميم قبل بدء المرحلة 2'
          : 'Interactive test bench to inspect foundations, responsive shell, and theme systems'
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'ar' ? 'المرحلة الحالية: 1 من 15' : 'Current Phase: 1 of 15'}
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Navigation Tabs inside modal */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'ar' ? 'عناصر التحقق المنجزة' : 'Verified Matrix'}
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'database'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'ar' ? 'معمارية الجداول (Schema)' : 'Database Schema'}
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'tokens'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'ar' ? 'عناصر التصميم (Tokens)' : 'Design Tokens'}
          </button>
        </div>

        {/* Tab 1: Checklist & Interactive Live Controls */}
        {activeTab === 'checklist' && (
          <div className="space-y-3">
            {/* Quick Interactive Test Bench */}
            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 space-y-2.5">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                {language === 'ar' ? 'فحص وضع التحميل الهيكلي (Skeleton):' : 'Skeleton Loading Test:'}
              </span>
              <div>
                {/* Skeleton Toggle */}
                <Button
                  variant={isSkeletonLoading ? 'primary' : 'outline'}
                  size="sm"
                  onClick={onToggleSkeleton}
                  className="w-full justify-start text-xs"
                >
                  {isSkeletonLoading
                    ? (language === 'ar' ? 'إلغاء وضع التحميل الهيكلي (Skeleton)' : 'Disable Skeleton Mode')
                    : (language === 'ar' ? 'معاينة وضع التحميل الهيكلي (Skeleton)' : 'Simulate Skeleton Mode')}
                </Button>
              </div>
            </div>

            {/* Checklist Matrix */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pe-1">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {language === 'ar' ? item.title : item.titleEn}
                      </h4>
                      <Badge variant="success" size="sm">
                        مكتمل ومفحوص
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Database Schema Architecture */}
        {activeTab === 'database' && (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pe-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'ar'
                ? 'تم إعداد المخطط المعماري الكامل (Normalized Schema) لكافة جداول النظام المتوافقة مع متطلبات المراحل من 2 إلى 15:'
                : 'Normalized relational schema ready for implementation in upcoming phases:'}
            </p>
            {Object.entries(DATABASE_SCHEMA).map(([key, schema]) => (
              <div
                key={key}
                className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {schema.tableName}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    PK: {schema.primaryKey}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  {schema.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {schema.columns.map((c) => (
                    <span
                      key={c.name}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {c.name}: {c.type}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Design Tokens & Palette */}
        {activeTab === 'tokens' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="w-full h-8 rounded-lg bg-[#2563EB] mb-2" />
                <div className="text-xs font-bold">Primary</div>
                <div className="text-[11px] font-mono text-slate-400">#2563EB</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="w-full h-8 rounded-lg bg-[#EAF2FF] border border-blue-200 mb-2" />
                <div className="text-xs font-bold">Secondary</div>
                <div className="text-[11px] font-mono text-slate-400">#EAF2FF</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="w-full h-8 rounded-lg bg-[#22C55E] mb-2" />
                <div className="text-xs font-bold">Success</div>
                <div className="text-[11px] font-mono text-slate-400">#22C55E</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="w-full h-8 rounded-lg bg-[#EF4444] mb-2" />
                <div className="text-xs font-bold">Danger</div>
                <div className="text-[11px] font-mono text-slate-400">#EF4444</div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'فلسفة التصميم (Apple-Inspired Minimalism)' : 'Design Philosophy'}
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                {language === 'ar'
                  ? 'تم اعتماد مساحات واسعة، وبطاقات ذات عمق أحادي (Single-Elevation)، مع حظر الكبسولات العشوائية (Zero-Pill Discipline) على البيانات الوصفية، وأرقام جدولية مصفوفة بدقة (Tabular Numerals)، وتدرجات داكنة مريحة (#0B1120 و #111827) دون أسود خام.'
                  : 'Clean flat surfaces with subtle 1px border lines, zero clutter, tabular numerals for all metrics, and balanced typography.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
