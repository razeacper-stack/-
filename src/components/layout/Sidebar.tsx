import React from 'react';
import {
  GraduationCap,
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { NAVIGATION_CONFIG, NavItem } from '../../config/navigation';
import { useTranslation } from '../../context/LanguageContext';
import { useBranch } from '../../context/BranchContext';

export interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { language, direction, t } = useTranslation();
  const { activeBranch, isAllBranches } = useBranch();
  const ArrowIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  const handleNavClick = (item: NavItem) => {
    onSelectTab(item.id);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-e border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              {t('app.name')}
            </h1>
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-0.5 inline-block">
              {isAllBranches
                ? t('branch.all')
                : language === 'ar'
                ? activeBranch?.nameAr
                : activeBranch?.nameEn}
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAVIGATION_CONFIG.map((group) => (
          <div key={group.id} className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {t(group.labelKey)}
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isPhase1 = item.phase === 1;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium
                    transition-all duration-150 cursor-pointer select-none group
                    ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    />
                    <span>{t(item.labelKey)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300">
                        {item.badge}
                      </span>
                    )}
                    {isPhase1 ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                        Phase 1
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        P{item.phase}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer with Phase 1 Roadmap card */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Phase 1 Verified</span>
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">100%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full w-full" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-tight">
            {language === 'ar' ? 'جاهز للمرحلة 2 (المستخدمين والأدوار)' : 'Ready for Phase 2 (Users & Roles)'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 xl:w-72 h-screen shrink-0 sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer content */}
          <div
            className={`
              relative w-72 max-w-[85vw] h-full shadow-2xl z-10
              animate-in duration-200
              ${direction === 'rtl' ? 'slide-in-from-right' : 'slide-in-from-left'}
            `}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
