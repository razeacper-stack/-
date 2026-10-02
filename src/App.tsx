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

const AppContent: React.FC = () => {
  const { t, language } = useTranslation();
  const { activeBranch, isAllBranches } = useBranch();
  const { isAuthenticated, isLoading, currentUser, hasPermission } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [isSkeletonLoading, setIsSkeletonLoading] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

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

      case 'audit_logs':
        if (!hasPermission('users.view') && !hasPermission('settings.view')) {
          return (
            <AccessDenied
              requiredPermission="users.view"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <AuditLogsViewer />;

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
    >
      {renderCurrentView()}

      {/* Phase 1 & 2 Verification Modal */}
      <Phase1VerificationModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        isSkeletonLoading={isSkeletonLoading}
        onToggleSkeleton={() => setIsSkeletonLoading((prev) => !prev)}
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
                      <AppContent />
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
