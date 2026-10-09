import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { useTranslation } from '../../context/LanguageContext';

export interface AppLayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  breadcrumbs?: BreadcrumbItem[];
  onOpenTestModal: () => void;
  onOpenProfileModal?: () => void;
  onOpenSearchModal?: () => void;
  onOpenAIModal?: () => void;
  onOpenPhase12Modal?: () => void;
  onOpenPhase13Modal?: () => void;
  onOpenNotificationCenter?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentTab,
  onSelectTab,
  breadcrumbs,
  onOpenTestModal,
  onOpenProfileModal,
  onOpenSearchModal,
  onOpenAIModal,
  onOpenPhase12Modal,
  onOpenPhase13Modal,
  onOpenNotificationCenter,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { direction } = useTranslation();

  return (
    <div className="min-h-screen bg-[#F7FAFC] dark:bg-[#0B1120] text-[#172033] dark:text-[#E2E8F0] flex flex-row transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenTestModal={onOpenTestModal}
          onOpenProfileModal={onOpenProfileModal}
          onOpenSearchModal={onOpenSearchModal}
          onOpenAIModal={onOpenAIModal}
          onOpenPhase12Modal={onOpenPhase12Modal}
          onOpenPhase13Modal={onOpenPhase13Modal}
          onOpenNotificationCenter={onOpenNotificationCenter}
          onNavigateTab={onSelectTab}
        />

        {/* Subheader / Breadcrumbs bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50">
          <Breadcrumb items={breadcrumbs} />
        </div>

        {/* Scrollable Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
