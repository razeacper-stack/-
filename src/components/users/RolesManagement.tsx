import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { RoleModel, StandardPermissionKey } from '../../types/auth';
import { PERMISSIONS_BY_MODULE, ALL_PERMISSIONS } from '../../config/permissions';
import { authStorage } from '../../services/authStorage';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const RolesManagement: React.FC = () => {
  const { currentUser, hasPermission, refreshUser } = useAuth();
  const { language, t } = useTranslation();

  const [roles, setRoles] = useState<RoleModel[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<StandardPermissionKey[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadedRoles = authStorage.getStoredRoles();
    setRoles(loadedRoles);
    if (loadedRoles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(loadedRoles[0].id);
      setSelectedPermissions([...loadedRoles[0].permissions]);
    }
  }, []);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const handleSelectRole = (role: RoleModel) => {
    setSelectedRoleId(role.id);
    setSelectedPermissions([...role.permissions]);
    setFeedback(null);
  };

  const handleTogglePermission = (permKey: StandardPermissionKey) => {
    if (selectedRole?.code === 'SUPER_ADMIN') {
      setFeedback({
        type: 'error',
        message: 'أمان النظام: صلاحيات Super Admin كاملة ومحمية لا يمكن تقليصها.',
      });
      return;
    }

    setSelectedPermissions((prev) => {
      if (prev.includes(permKey)) {
        return prev.filter((k) => k !== permKey);
      } else {
        return [...prev, permKey];
      }
    });
  };

  const handleToggleModuleAll = (modulePerms: StandardPermissionKey[]) => {
    if (selectedRole?.code === 'SUPER_ADMIN') return;

    const allSelected = modulePerms.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !modulePerms.includes(p)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...modulePerms])));
    }
  };

  const handleSavePermissions = () => {
    if (!currentUser || !selectedRole) return;
    setFeedback(null);
    setIsSaving(true);

    try {
      const updated = authStorage.updateRolePermissions(currentUser, selectedRole.id, selectedPermissions);
      setFeedback({
        type: 'success',
        message:
          language === 'ar'
            ? `تم حفظ وتحديث مصفوفة الصلاحيات لدور "${updated.nameAr}" بنجاح.`
            : `Permission matrix updated successfully for role "${updated.nameEn}".`,
      });

      // Reload roles from storage
      const refreshedRoles = authStorage.getStoredRoles();
      setRoles(refreshedRoles);
      refreshUser();
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'فشل تحديث الصلاحيات' });
    } finally {
      setIsSaving(false);
    }
  };

  const canEditRoles = hasPermission('users.edit') || hasPermission('settings.edit');
  const isSuperAdminRole = selectedRole?.code === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {language === 'ar' ? 'مصفوفة الأدوار والصلاحيات (RBAC Matrix)' : 'Roles & Permissions Matrix'}
          </h2>
          <Badge variant="primary" size="sm">
            Phase 2
          </Badge>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {language === 'ar'
            ? 'تحديد الصلاحيات الدقيقة لكل رتبة وظيفية في المدرسة (Granular Permissions)'
            : 'Configure role-based access control and assign fine-grained permissions per organizational role'}
        </p>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm animate-in fade-in duration-200 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Main Split Grid: Left Roles list, Right Permissions Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Roles List (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {language === 'ar' ? 'الأدوار المعرفة' : 'System Roles'}
          </div>

          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = r.id === selectedRoleId;
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectRole(r)}
                  className={`w-full p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500/80 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      <span>{language === 'ar' ? r.nameAr : r.nameEn}</span>
                    </span>

                    {r.code === 'SUPER_ADMIN' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        كامل الصلاحيات
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">
                        {r.permissions.length} صلاحية
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {language === 'ar' ? r.descriptionAr : r.descriptionEn}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permissions Matrix (8 cols) */}
        <div className="lg:col-span-8">
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {language === 'ar' ? 'صلاحيات الدور:' : 'Permissions for:'}{' '}
                    <span className="text-blue-600 dark:text-blue-400">
                      {language === 'ar' ? selectedRole?.nameAr : selectedRole?.nameEn}
                    </span>
                  </span>
                </div>

                {isSuperAdminRole && (
                  <Badge variant="primary" size="sm">
                    <Lock className="w-3 h-3 me-1" />
                    محمي ومثبت
                  </Badge>
                )}
              </div>
            }
            subtitle={
              isSuperAdminRole
                ? 'يمتلك هذا الدور حكماً كافة الصلاحيات الحالية والمستقبلية بشكل غير قابل للتقليص'
                : 'حدد أو أزل الإشارات لضبط الصلاحيات الممنوحة للمستخدمين التابعين لهذا الدور'
            }
            action={
              canEditRoles && !isSuperAdminRole && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Save className="w-4 h-4" />}
                  isLoading={isSaving}
                  onClick={handleSavePermissions}
                >
                  {language === 'ar' ? 'حفظ الصلاحيات' : 'Save Changes'}
                </Button>
              )
            }
          >
            <div className="space-y-6">
              {Object.entries(PERMISSIONS_BY_MODULE).map(([moduleKey, perms]) => {
                const moduleKeys = perms.map((p) => p.key);
                const allSelected = moduleKeys.every((k) => selectedPermissions.includes(k));

                return (
                  <div
                    key={moduleKey}
                    className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-3"
                  >
                    {/* Module Header with Select All toggle */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          {moduleKey}
                        </span>
                      </div>

                      {!isSuperAdminRole && canEditRoles && (
                        <button
                          type="button"
                          onClick={() => handleToggleModuleAll(moduleKeys)}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          {allSelected
                            ? language === 'ar'
                              ? 'إلغاء تحديد القسم'
                              : 'Deselect Module'
                            : language === 'ar'
                            ? 'تحديد كل القسم'
                            : 'Select Module'}
                        </button>
                      )}
                    </div>

                    {/* Permissions Checkbox Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {perms.map((p) => {
                        const isChecked = selectedPermissions.includes(p.key) || isSuperAdminRole;
                        return (
                          <label
                            key={p.key}
                            className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all select-none ${
                              isChecked
                                ? 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/60 text-slate-900 dark:text-slate-100 shadow-2xs'
                                : 'bg-slate-100/50 dark:bg-slate-950/30 border-transparent text-slate-500 dark:text-slate-400'
                            } ${isSuperAdminRole || !canEditRoles ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                          >
                            <input
                              type="checkbox"
                              disabled={isSuperAdminRole || !canEditRoles}
                              checked={isChecked}
                              onChange={() => handleTogglePermission(p.key)}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500 mt-0.5"
                            />
                            <div className="space-y-0.5 flex-1">
                              <div className="text-xs font-semibold leading-tight">
                                {language === 'ar' ? p.nameAr : p.nameEn}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                {p.key}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
