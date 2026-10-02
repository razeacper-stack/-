import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  Layers,
  School,
  BookOpen,
  Link2,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { AcademicOverviewTab } from './AcademicOverviewTab';
import { AcademicYearsTab } from './AcademicYearsTab';
import { StagesGradesTab } from './StagesGradesTab';
import { ClassesTab } from './ClassesTab';
import { SubjectsTab } from './SubjectsTab';
import { GradeSubjectsTab } from './GradeSubjectsTab';
import { Phase4VerificationModal } from './Phase4VerificationModal';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export type AcademicSubTab =
  | 'overview'
  | 'years'
  | 'stages'
  | 'classes'
  | 'subjects'
  | 'grade_subjects';

interface AcademicManagementProps {
  initialTab?: AcademicSubTab;
}

export const AcademicManagement: React.FC<AcademicManagementProps> = ({
  initialTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<AcademicSubTab>(initialTab);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const { activeBranch, isAllBranches } = useBranch();
  const { hasPermission } = useAuth();
  const { t } = useTranslation();

  // Keep activeTab in sync if initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const navTabs = [
    {
      id: 'overview' as const,
      labelAr: 'نظرة عامة',
      labelEn: 'Overview',
      icon: GraduationCap,
      permission: 'academic_years.view',
    },
    {
      id: 'years' as const,
      labelAr: 'السنوات الدراسية',
      labelEn: 'Academic Years',
      icon: Calendar,
      permission: 'academic_years.view',
    },
    {
      id: 'stages' as const,
      labelAr: 'المراحل والصفوف',
      labelEn: 'Stages & Grades',
      icon: Layers,
      permission: 'academic_stages.view',
    },
    {
      id: 'classes' as const,
      labelAr: 'الفصول والشُعب',
      labelEn: 'Classes & Sections',
      icon: School,
      permission: 'classes.view',
    },
    {
      id: 'subjects' as const,
      labelAr: 'المواد الدراسية',
      labelEn: 'Subjects',
      icon: BookOpen,
      permission: 'subjects.view',
    },
    {
      id: 'grade_subjects' as const,
      labelAr: 'ربط المواد بالصفوف',
      labelEn: 'Curriculum Plan',
      icon: Link2,
      permission: 'grade_subjects.view',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              الإدارة الأكاديمية (Academic Management)
            </h1>
            <Badge variant="primary">PHASE 4</Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            <span>نطاق العمل الحالي:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {isAllBranches ? 'جميع الفروع المدرسية' : activeBranch?.nameAr || 'الفرع المختار'}
            </span>
          </p>
        </div>

        {/* Global Test Suite Button */}
        <button
          onClick={() => setIsTestModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors shadow-sm self-start md:self-auto"
        >
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>منصة التحقق والفحص الآلي (22 اختبارًا)</span>
        </button>
      </div>

      {/* Tabs navigation pill bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-100 dark:border-gray-800 scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.labelAr}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <AcademicOverviewTab
            onNavigateTab={(tab) => setActiveTab(tab as AcademicSubTab)}
            onOpenTestModal={() => setIsTestModalOpen(true)}
          />
        )}

        {activeTab === 'years' && <AcademicYearsTab />}

        {activeTab === 'stages' && <StagesGradesTab />}

        {activeTab === 'classes' && <ClassesTab />}

        {activeTab === 'subjects' && (
          <SubjectsTab onNavigateToGradeSubjects={() => setActiveTab('grade_subjects')} />
        )}

        {activeTab === 'grade_subjects' && <GradeSubjectsTab />}
      </div>

      {/* Phase 4 Verification Modal */}
      <Phase4VerificationModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
};
