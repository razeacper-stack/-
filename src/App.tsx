import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useTranslation } from './context/LanguageContext';
import { BranchProvider, useBranch } from './context/BranchContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './components/auth/LoginPage';
import { UsersManagement } from './components/users/UsersManagement';
import { RolesManagement } from './components/users/RolesManagement';
import { AuditLogsViewer } from './components/audit/AuditLogsViewer';
import { UserProfileModal } from './components/users/UserProfileModal';
import { AccessDenied } from './components/common/AccessDenied';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { UpcomingPhaseView } from './components/common/UpcomingPhaseView';
import { Phase1VerificationModal } from './components/dashboard/Phase1VerificationModal';
import { AcademicProvider } from './context/AcademicContext';
import { AcademicManagement } from './components/academic/AcademicManagement';
import { StudentProvider } from './context/StudentContext';
import { StudentsManagement } from './components/students/StudentsManagement';
import { TeacherProvider } from './context/TeacherContext';
import { TeachersManagement } from './components/teachers/TeachersManagement';
import { TimetableProvider } from './context/TimetableContext';
import { TimetableManagement } from './components/timetable/TimetableManagement';
import { AttendanceProvider } from './context/AttendanceContext';
import { AttendanceManagement } from './components/attendance/AttendanceManagement';
import { FinanceProvider } from './context/FinanceContext';
import { FeesManagement } from './components/finance/FeesManagement';
import { ReportsCenter } from './components/reports/ReportsCenter';
import { SearchCenter } from './components/search/SearchCenter';
import { SearchModal } from './components/search/SearchModal';
import { Phase11VerificationModal } from './components/reports/Phase11VerificationModal';
import { AIAssistant } from './components/ai/AIAssistant';
import { AIAssistantModal } from './components/ai/AIAssistantModal';
import { Phase12VerificationModal } from './components/ai/Phase12VerificationModal';
import { ActivityCenter } from './components/activity/ActivityCenter';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { Phase13VerificationModal } from './components/activity/Phase13VerificationModal';
import { SystemSettings } from './components/settings/SystemSettings';
import { BranchesManagement } from './components/branches/BranchesManagement';

const AppContent: React.FC = () => {
  const { t, language } = useTranslation();
  const { activeBranch, isAllBranches } = useBranch();
  const { isAuthenticated, isLoading, currentUser, isSuperAdmin, hasPermission } = useAuth();

  // Helper to read initial tab from URL hash, params or session storage
  const getInitialTab = (): string => {
    try {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '').trim();
        if (hash) return hash;
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam) return tabParam;
        const saved = sessionStorage.getItem('sms_current_tab');
        if (saved) return saved;
      }
    } catch {}
    return 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState<string>(getInitialTab);

  // Synchronize active tab with sessionStorage and URL hash
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sms_current_tab', currentTab);
        if (window.location.hash !== `#${currentTab}`) {
          window.history.replaceState(null, '', `#${currentTab}`);
        }
      }
    } catch {}
  }, [currentTab]);

  // Synchronize on browser history popstate / hashchange (e.g. Back/Forward)
  React.useEffect(() => {
    const handleHashChange = () => {
      try {
        const hash = window.location.hash.replace('#', '').trim();
        if (hash && hash !== currentTab) {
          setCurrentTab(hash);
        }
      } catch {}
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentTab]);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [isPhase11ModalOpen, setIsPhase11ModalOpen] = useState<boolean>(false);
  const [isPhase12ModalOpen, setIsPhase12ModalOpen] = useState<boolean>(false);
  const [isPhase13ModalOpen, setIsPhase13ModalOpen] = useState<boolean>(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [isSkeletonLoading, setIsSkeletonLoading] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Global Keyboard Shortcuts:
  // Cmd+K / Ctrl+K to toggle search
  // Cmd+J / Ctrl+J to toggle AI Assistant
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsAIModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If session is initializing, show clean minimal loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC] dark:bg-[#0B1120]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {language === 'ar' ? 'جارٍ تحميل النظام والتحقق من الجلسة...' : 'Loading session & security kernel...'}
          </span>
        </div>
      </div>
    );
  }

  // Protected Routes: If not authenticated, force Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Generate contextual breadcrumbs
  const getBreadcrumbs = () => {
    if (currentTab === 'dashboard') {
      return [
        {
          label: isAllBranches
            ? t('branch.all')
            : language === 'ar'
            ? activeBranch?.nameAr || ''
            : activeBranch?.nameEn || '',
          current: true,
        },
      ];
    }

    const tabLabel = t(`nav.${currentTab}`) || currentTab;
    return [
      {
        label: isAllBranches
          ? t('branch.all')
          : language === 'ar'
          ? activeBranch?.nameAr || ''
          : activeBranch?.nameEn || '',
      },
      {
        label: tabLabel,
        current: true,
      },
    ];
  };

  // Render view based on current tab with granular permission checks
  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        if (!hasPermission('dashboard.view')) {
          return (
            <AccessDenied
              requiredPermission="dashboard.view"
              onGoBack={() => setCurrentTab('users')}
            />
          );
        }
        return (
          <DashboardOverview
            onOpenTestModal={() => setIsTestModalOpen(true)}
            isSkeletonLoading={isSkeletonLoading}
            onToggleSkeleton={() => setIsSkeletonLoading((prev) => !prev)}
            onNavigateTab={setCurrentTab}
          />
        );

      case 'branches':
        if (!hasPermission('branches.view') && !isSuperAdmin) {
          return (
            <AccessDenied
              requiredPermission="branches.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <BranchesManagement onNavigateTab={setCurrentTab} />;

      case 'academic':
        if (!hasPermission('academic_years.view') && !hasPermission('academic_stages.view')) {
          return (
            <AccessDenied
              requiredPermission="academic_years.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <AcademicManagement initialTab="overview" />;

      case 'academic_years':
        if (!hasPermission('academic_years.view')) {
          return (
            <AccessDenied
              requiredPermission="academic_years.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <AcademicManagement initialTab="years" />;

      case 'stages':
        if (!hasPermission('academic_stages.view')) {
          return (
            <AccessDenied
              requiredPermission="academic_stages.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <AcademicManagement initialTab="stages" />;

      case 'classes':
        if (!hasPermission('classes.view')) {
          return (
            <AccessDenied
              requiredPermission="classes.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <AcademicManagement initialTab="classes" />;

      case 'subjects':
        if (!hasPermission('subjects.view')) {
          return (
            <AccessDenied
              requiredPermission="subjects.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <AcademicManagement initialTab="subjects" />;

      case 'grade_subjects':
        if (!hasPermission('grade_subjects.view')) {
          return (
            <AccessDenied
              requiredPermission="grade_subjects.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <AcademicManagement initialTab="grade_subjects" />;

      case 'students':
        if (!hasPermission('students.view')) {
          return (
            <AccessDenied
              requiredPermission="students.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <StudentsManagement />;

      case 'teachers':
        if (!hasPermission('teachers.view')) {
          return (
            <AccessDenied
              requiredPermission="teachers.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <TeachersManagement />;

      case 'timetable':
        if (!hasPermission('timetable.view')) {
          return (
            <AccessDenied
              requiredPermission="timetable.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <TimetableManagement />;

      case 'attendance':
        if (!hasPermission('attendance.view')) {
          return (
            <AccessDenied
              requiredPermission="attendance.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <AttendanceManagement />;

      case 'fees':
        if (!hasPermission('fees.view')) {
          return (
            <AccessDenied
              requiredPermission="fees.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <FeesManagement />;

      case 'users':
        if (!hasPermission('users.view')) {
          return (
            <AccessDenied
              requiredPermission="users.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <UsersManagement />;

      case 'roles':
        if (!hasPermission('users.view') && !hasPermission('settings.view')) {
          return (
            <AccessDenied
              requiredPermission="users.view / settings.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <RolesManagement />;

      case 'notifications':
        return <NotificationCenter isPageView={true} onNavigateTab={setCurrentTab} />;

      case 'audit_logs':
      case 'activity':
        if (!hasPermission('audit.view') && !hasPermission('users.view') && !hasPermission('settings.view') && !isSuperAdmin) {
          return (
            <AccessDenied
              requiredPermission="audit.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <ActivityCenter />;

      case 'reports':
        if (!hasPermission('reports.view') && !hasPermission('finance.view_reports') && !isSuperAdmin) {
          return (
            <AccessDenied
              requiredPermission="reports.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <ReportsCenter />;

      case 'search':
        return <SearchCenter onNavigateTab={setCurrentTab} />;

      case 'ai_assistant':
        return <AIAssistant onNavigateTab={setCurrentTab} />;

      case 'settings':
        if (!hasPermission('settings.view') && !isSuperAdmin) {
          return (
            <AccessDenied
              requiredPermission="settings.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <SystemSettings onGoBack={() => setCurrentTab('dashboard')} />;

      default:
        return (
          <UpcomingPhaseView
            tabId={currentTab}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        );
    }
  };

  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      breadcrumbs={getBreadcrumbs()}
      onOpenTestModal={() => setIsTestModalOpen(true)}
      onOpenProfileModal={() => setIsProfileModalOpen(true)}
      onOpenSearchModal={() => setIsSearchModalOpen(true)}
      onOpenAIModal={() => setIsAIModalOpen(true)}
      onOpenPhase12Modal={() => setIsPhase12ModalOpen(true)}
      onOpenPhase13Modal={() => setIsPhase13ModalOpen(true)}
      onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
    >
      {renderCurrentView()}

      {/* Phase 1 & 2 Verification Modal */}
      <Phase1VerificationModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        isSkeletonLoading={isSkeletonLoading}
        onToggleSkeleton={() => setIsSkeletonLoading((prev) => !prev)}
      />

      {/* Phase 11 Search & Reports Verification Modal */}
      <Phase11VerificationModal
        isOpen={isPhase11ModalOpen}
        onClose={() => setIsPhase11ModalOpen(false)}
      />

      {/* Phase 12 AI Smart Assistant Verification Modal */}
      <Phase12VerificationModal
        isOpen={isPhase12ModalOpen}
        onClose={() => setIsPhase12ModalOpen(false)}
      />

      {/* Phase 13 Notifications + Activity Center Verification Modal */}
      <Phase13VerificationModal
        isOpen={isPhase13ModalOpen}
        onClose={() => setIsPhase13ModalOpen(false)}
      />

      {/* Global In-App Notifications Center Modal */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onNavigateTab={setCurrentTab}
      />

      {/* Global Quick Search Modal (Cmd+K / Ctrl+K) */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigateTab={setCurrentTab}
      />

      {/* Global Floating AI Assistant Modal (Cmd+J / Ctrl+J) */}
      <AIAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />

      {/* User Profile & Password Change Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </AppLayout>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <BranchProvider>
            <AcademicProvider>
              <StudentProvider>
                <TeacherProvider>
                  <TimetableProvider>
                    <AttendanceProvider>
                      <FinanceProvider>
                        <AppContent />
                      </FinanceProvider>
                    </AttendanceProvider>
                  </TimetableProvider>
                </TeacherProvider>
              </StudentProvider>
            </AcademicProvider>
          </BranchProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
