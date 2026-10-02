import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Globe,
  Sun,
  Moon,
  Bell,
  Building2,
  ChevronDown,
  Check,
  Sparkles,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { SearchBar } from '../common/SearchBar';
import { Badge } from '../common/Badge';

export interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenTestModal: () => void;
  onOpenProfileModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenTestModal,
  onOpenProfileModal,
}) => {
  const { language, toggleLanguage, t } = useTranslation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const {
    accessibleBranches,
    activeBranchId,
    setActiveBranchId,
    activeBranch,
    isAllBranches,
    canAccessAllBranches,
  } = useBranch();
  const { currentUser, logout } = useAuth();

  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const branchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (branchRef.current && !branchRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitial = currentUser?.fullName?.slice(0, 2) || 'ع';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left Section: Mobile Menu + Branch Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Active Branch Selector Dropdown */}
          <div className="relative" ref={branchRef}>
            <button
              onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="max-w-[120px] sm:max-w-[190px] truncate">
                {isAllBranches
                  ? t('branch.all')
                  : language === 'ar'
                  ? activeBranch?.nameAr
                  : activeBranch?.nameEn}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Branch dropdown menu */}
            {isBranchDropdownOpen && (
              <div className="absolute start-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t('branch.select')}
                </div>

                {/* All Branches option (Available only for users with full multi-branch access) */}
                {canAccessAllBranches && (
                  <>
                    <button
                      onClick={() => {
                        setActiveBranchId('all');
                        setIsBranchDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm text-start hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                        isAllBranches ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <div>
                          <div>{t('branch.all')}</div>
                          <div className="text-[11px] text-slate-400">
                            {language === 'ar' ? 'عرض مدمج لكافة الفروع المتاحة' : 'Aggregated multi-campus view'}
                          </div>
                        </div>
                      </div>
                      {isAllBranches && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  </>
                )}

                {/* Individual Authorized Branches */}
                {accessibleBranches.map((b) => {
                  const isSelected = activeBranchId === b.id;
                  const isInactive = b.status === 'inactive';
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        setActiveBranchId(b.id);
                        setIsBranchDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm text-start hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                        isSelected ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${isInactive ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{language === 'ar' ? b.nameAr : b.nameEn}</span>
                            <span className="text-[10px] font-mono text-slate-400">[{b.code}]</span>
                            {isInactive && (
                              <span className="text-[9px] px-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                معطل
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {b.phone}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Center: Quick Search Bar (visible on md+) */}
        <div className="hidden md:block flex-1 max-w-md mx-2">
          <SearchBar />
        </div>

        {/* Right Section: Phase 1 Test Guide, Language, Theme, Notifications, User */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Phase 1 Verification Quick Launch Button */}
          <button
            onClick={onOpenTestModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-medium border border-blue-200/60 dark:border-blue-800 transition-colors cursor-pointer shadow-2xs"
            title="دليل اختبار المرحلة الأولى"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">{t('phase1.test_button')}</span>
            <span className="sm:hidden text-[11px]">Phase 1</span>
          </button>

          {/* Single Language Switcher (زر واحد فقط للتبديل بين اللغتين) */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
            title={language === 'ar' ? 'التحويل إلى English' : 'التحويل إلى العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* Single Theme Switcher (زر واحد فقط للتبديل المباشر بين الفاتح والداكن) */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
            title={resolvedTheme === 'dark' ? (language === 'ar' ? 'التحويل إلى الوضع الفاتح' : 'Switch to Light Mode') : (language === 'ar' ? 'التحويل إلى الوضع الداكن' : 'Switch to Dark Mode')}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">{language === 'ar' ? 'فاتح' : 'Light'}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">{language === 'ar' ? 'داكن' : 'Dark'}</span>
              </>
            )}
          </button>

          {/* Notifications button */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>

            {isNotificationOpen && (
              <div className="absolute end-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {t('header.notifications')}
                  </span>
                  <Badge variant="primary" size="sm">
                    {t('header.unread_count')}
                  </Badge>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <div className="py-2.5">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {t('dashboard.recent.student_registered')}
                    </p>
                    <span className="text-[11px] text-slate-400">منذ 15 دقيقة</span>
                  </div>
                  <div className="py-2.5">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {t('dashboard.recent.fee_collected')}
                    </p>
                    <span className="text-[11px] text-slate-400">منذ 40 دقيقة</span>
                  </div>
                  <div className="py-2.5">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {t('dashboard.recent.attendance_completed')}
                    </p>
                    <span className="text-[11px] text-slate-400">منذ ساعتين</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* User profile avatar chip & dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 sm:ps-1 sm:pe-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shadow-xs shrink-0">
                {userInitial}
              </div>
              <div className="hidden xl:block text-start">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                  {currentUser?.fullName || t('header.user.name')}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'ar' ? currentUser?.roleNameAr : currentUser?.roleNameEn}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute end-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {currentUser?.fullName}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    @{currentUser?.username}
                  </div>
                  <div className="mt-1">
                    <Badge variant="primary" size="sm">
                      {language === 'ar' ? currentUser?.roleNameAr : currentUser?.roleNameEn}
                    </Badge>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenProfileModal) onOpenProfileModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-start text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>{language === 'ar' ? 'الملف الشخصي وكلمة المرور' : 'Profile & Password'}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
