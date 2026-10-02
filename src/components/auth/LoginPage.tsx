import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  Shield,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { language, toggleLanguage, direction, t } = useTranslation();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage(
        language === 'ar'
          ? 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني'
          : 'Please enter your username or email'
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        language === 'ar' ? 'يرجى إدخال كلمة المرور' : 'Please enter your password'
      );
      return;
    }

    setIsLoading(true);
    const result = await login(identifier, password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || (language === 'ar' ? 'فشل تسجيل الدخول' : 'Login failed'));
    }
  };

  const fillCredentials = (user: string, pass: string) => {
    setIdentifier(user);
    setPassword(pass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F7FAFC] dark:bg-[#0B1120] text-[#172033] dark:text-[#E2E8F0] transition-colors p-4 sm:p-6 md:p-8">
      {/* Top Bar with Single Language Switcher & Single Theme Switcher */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
            {t('app.name')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Single Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
            title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* Single Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
            title={resolvedTheme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
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
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 shadow-2xs">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {language === 'ar' ? 'تسجيل الدخول للنظام' : 'Sign in to your account'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
              {language === 'ar'
                ? 'أدخل بيانات اعتمادك للوصول إلى لوحة الإدارة والصلاحيات'
                : 'Enter your credentials to access your administrative workspace'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/70 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username/Email Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={language === 'ar' ? 'superadmin أو البريد...' : 'superadmin or email...'}
                  className="w-full h-11 ps-10 pe-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {language === 'ar' ? 'تشفير آمن SHA-256' : 'SHA-256 Protected'}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 ps-10 pe-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {language === 'ar' ? 'تذكر جلستي على هذا الجهاز' : 'Remember my session'}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-semibold shadow-sm mt-2"
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </Button>
          </form>

          {/* Quick Test Accounts Switcher (For rapid evaluation) */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>
                  {language === 'ar'
                    ? 'حسابات الاختبار التجريبية (انقر للتعبئة الفورية):'
                    : 'Evaluation Test Credentials (Click to fill):'}
                </span>
              </span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                {showDemoAccounts ? 'إخفاء' : 'إظهار'}
              </span>
            </button>

            {showDemoAccounts && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-start">
                <button
                  type="button"
                  onClick={() => fillCredentials('superadmin', 'Admin@123456')}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/60 dark:bg-slate-950/40 text-[11px] transition-all cursor-pointer text-start"
                >
                  <div className="font-bold text-blue-600 dark:text-blue-400">Super Admin</div>
                  <div className="text-slate-400 text-[10px]">superadmin · كافة الصلاحيات</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('admin', 'Admin@123456')}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/60 dark:bg-slate-950/40 text-[11px] transition-all cursor-pointer text-start"
                >
                  <div className="font-bold text-slate-700 dark:text-slate-200">Admin</div>
                  <div className="text-slate-400 text-[10px]">admin · صلاحيات إدارية</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('teacher', 'Admin@123456')}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/60 dark:bg-slate-950/40 text-[11px] transition-all cursor-pointer text-start"
                >
                  <div className="font-bold text-slate-700 dark:text-slate-200">Teacher</div>
                  <div className="text-slate-400 text-[10px]">teacher · تدريس وحضور فقط</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('viewer', 'Admin@123456')}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/60 dark:bg-slate-950/40 text-[11px] transition-all cursor-pointer text-start"
                >
                  <div className="font-bold text-slate-700 dark:text-slate-200">Viewer</div>
                  <div className="text-slate-400 text-[10px]">viewer · قراءة واطلاع فقط</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('disabled_user', 'Admin@123456')}
                  className="p-2 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 text-[11px] transition-all cursor-pointer text-start col-span-2"
                >
                  <div className="font-bold text-amber-700 dark:text-amber-400">
                    {language === 'ar' ? 'فحص الحساب المعطل (Disabled)' : 'Test Disabled Account'}
                  </div>
                  <div className="text-slate-400 text-[10px]">disabled_user · اختبار رفض الدخول للحساب المعطل</div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-6xl mx-auto text-center text-xs text-slate-400 dark:text-slate-500 py-2">
        {language === 'ar'
          ? 'نظام إدارة المدارس — المرحلة 2: التحقق والمستخدمين والصلاحيات (Auth & RBAC)'
          : 'School Management System — Phase 2: Authentication, Users & RBAC'}
      </div>
    </div>
  );
};
