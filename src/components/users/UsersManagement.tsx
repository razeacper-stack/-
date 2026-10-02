import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  Key,
  Edit2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { SafeUser, RoleModel } from '../../types/auth';
import { authStorage } from '../../services/authStorage';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const UsersManagement: React.FC = () => {
  const { currentUser, hasPermission, refreshUser } = useAuth();
  const { language, t } = useTranslation();

  const [users, setUsers] = useState<SafeUser[]>([]);
  const [roles, setRoles] = useState<RoleModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);

  // Forms states
  const [createForm, setCreateForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleId: '',
    status: 'active' as 'active' | 'disabled',
  });

  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    roleId: '',
    status: 'active' as 'active' | 'disabled',
  });

  const [resetPassForm, setResetPassForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Notifications / feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    if (!currentUser) return;
    try {
      const allUsers = authStorage.listUsers(currentUser);
      const allRoles = authStorage.getStoredRoles();
      setUsers(allUsers);
      setRoles(allRoles);
      if (allRoles.length > 0 && !createForm.roleId) {
        setCreateForm((prev) => ({ ...prev, roleId: allRoles[0].id }));
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'فشل جلب قائمة المستخدمين' });
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'ALL' || u.roleCode === roleFilter || u.roleId === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Handle Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFeedback(null);

    if (createForm.password !== createForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'كلمة المرور وتأكيدها غير متطابقين.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await authStorage.createUser(currentUser, {
        fullName: createForm.fullName,
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        roleId: createForm.roleId,
        status: createForm.status,
      });

      setFeedback({
        type: 'success',
        message: language === 'ar' ? 'تم إنشاء حساب المستخدم بنجاح.' : 'User created successfully.',
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        roleId: roles[0]?.id || '',
        status: 'active',
      });
      loadData();
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'فشل إنشاء المستخدم' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (user: SafeUser) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      roleId: user.roleId,
      status: user.status,
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedUser) return;
    setFeedback(null);

    setIsSubmitting(true);
    try {
      authStorage.updateUser(currentUser, selectedUser.id, editForm);
      setFeedback({
        type: 'success',
        message: language === 'ar' ? 'تم تحديث بيانات المستخدم بنجاح.' : 'User updated successfully.',
      });
      setIsEditModalOpen(false);
      loadData();
      refreshUser();
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'فشل تعديل المستخدم' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Status (Disable/Enable)
  const handleToggleStatus = (user: SafeUser) => {
    if (!currentUser) return;
    setFeedback(null);

    try {
      authStorage.toggleUserStatus(currentUser, user.id);
      setFeedback({
        type: 'success',
        message:
          user.status === 'active'
            ? language === 'ar'
              ? `تم تعطيل حساب ${user.fullName} بنجاح.`
              : `Account ${user.fullName} disabled.`
            : language === 'ar'
            ? `تم إعادة تفعيل حساب ${user.fullName} بنجاح.`
            : `Account ${user.fullName} re-enabled.`,
      });
      loadData();
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'فشل تغيير حالة المستخدم' });
    }
  };

  // Handle Reset Password Submit
  const handleResetPassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedUser) return;
    setFeedback(null);

    if (resetPassForm.newPassword !== resetPassForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'كلمة المرور وتأكيدها غير متطابقين.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await authStorage.resetUserPassword(currentUser, selectedUser.id, resetPassForm.newPassword);
      setFeedback({
        type: 'success',
        message:
          language === 'ar'
            ? `تمت إعادة تعيين كلمة المرور للمستخدم ${selectedUser.username} بنجاح.`
            : `Password reset successfully for ${selectedUser.username}.`,
      });
      setIsResetPassModalOpen(false);
      setResetPassForm({ newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'فشل إعادة تعيين كلمة المرور' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreateUser = hasPermission('users.create');
  const canEditUser = hasPermission('users.edit');

  return (
    <div className="space-y-6">
      {/* Header & Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {language === 'ar' ? 'إدارة المستخدمين وحسابات الموظفين' : 'Staff & Users Management'}
            </h2>
            <Badge variant="primary" size="sm">
              Phase 2 Active
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'التحكم في حسابات مسؤولي النظام والمعلمين والموظفين وتعيين الأدوار وضبط الصلاحيات'
              : 'Provision, configure roles, and audit access credentials across faculty and administration'}
          </p>
        </div>

        {canCreateUser && (
          <Button
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            {language === 'ar' ? 'إنشاء مستخدم جديد' : 'New User Account'}
          </Button>
        )}
      </div>

      {/* Feedback Toast Banner */}
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
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'ar' ? 'بحث بالاسم، اسم المستخدم، البريد...' : 'Search name, username, email...'}
              className="w-full h-10 ps-9 pe-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">{language === 'ar' ? 'جميع الأدوار (All Roles)' : 'All Roles'}</option>
            {roles.map((r) => (
              <option key={r.id} value={r.code}>
                {language === 'ar' ? r.nameAr : r.nameEn}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">{language === 'ar' ? 'جميع الحالات (All Statuses)' : 'All Statuses'}</option>
            <option value="active">{language === 'ar' ? 'نشط فقط (Active Only)' : 'Active Only'}</option>
            <option value="disabled">{language === 'ar' ? 'معطل فقط (Disabled Only)' : 'Disabled Only'}</option>
          </select>
        </div>
      </Card>

      {/* Users Desktop Table & Mobile Cards */}
      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <span>{language === 'ar' ? 'سجل المستخدمين' : 'User Accounts Directory'}</span>
            <span className="text-xs font-normal text-slate-400">
              {filteredUsers.length} {language === 'ar' ? 'مستخدم' : 'users'}
            </span>
          </div>
        }
      >
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
            {language === 'ar' ? 'لا توجد نتائج تطابق معايير البحث.' : 'No users match your filter criteria.'}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                    <th className="pb-3 text-start">{language === 'ar' ? 'المستخدم' : 'User'}</th>
                    <th className="pb-3 text-start">{language === 'ar' ? 'اسم الحساب' : 'Username'}</th>
                    <th className="pb-3 text-start">{language === 'ar' ? 'الدور والرتبة' : 'Role'}</th>
                    <th className="pb-3 text-start">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="pb-3 text-start">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</th>
                    <th className="pb-3 text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredUsers.map((u) => {
                    const isProtected = u.isProtectedSuperAdmin;
                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* User Full Name & Avatar */}
                        <td className="py-3.5 pe-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {u.fullName.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{u.fullName}</span>
                                {isProtected && (
                                  <span
                                    title="حساب Super Admin محمي من التعطيل أو الحذف"
                                    className="p-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                                  >
                                    <Shield className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Username */}
                        <td className="py-3.5 pe-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                          @{u.username}
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 pe-4">
                          <Badge
                            variant={u.roleCode === 'SUPER_ADMIN' ? 'primary' : 'neutral'}
                            size="sm"
                          >
                            {language === 'ar' ? u.roleNameAr : u.roleNameEn}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 pe-4">
                          {u.status === 'active' ? (
                            <Badge variant="success" size="sm" dot>
                              {language === 'ar' ? 'نشط' : 'Active'}
                            </Badge>
                          ) : (
                            <Badge variant="danger" size="sm" dot>
                              {language === 'ar' ? 'معطل' : 'Disabled'}
                            </Badge>
                          )}
                        </td>

                        {/* Created At */}
                        <td className="py-3.5 pe-4 font-mono text-[11px] text-slate-400 tabular-nums">
                          {new Date(u.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            {canEditUser && (
                              <>
                                {/* Edit attributes */}
                                <button
                                  onClick={() => handleOpenEdit(u)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="تعديل الحساب"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                {/* Reset Password */}
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setIsResetPassModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="إعادة تعيين كلمة المرور"
                                >
                                  <Key className="w-4 h-4" />
                                </button>

                                {/* Toggle Disable/Enable (Protected for Super Admin) */}
                                <button
                                  disabled={isProtected}
                                  onClick={() => handleToggleStatus(u)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isProtected
                                      ? 'opacity-30 cursor-not-allowed text-slate-400'
                                      : u.status === 'active'
                                      ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                                  }`}
                                  title={
                                    isProtected
                                      ? 'حساب محمي لا يمكن تعطيله'
                                      : u.status === 'active'
                                      ? 'تعطيل الحساب'
                                      : 'إعادة تفعيل الحساب'
                                  }
                                >
                                  {u.status === 'active' ? (
                                    <Lock className="w-4 h-4" />
                                  ) : (
                                    <Unlock className="w-4 h-4" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {filteredUsers.map((u) => {
                const isProtected = u.isProtectedSuperAdmin;
                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                          {u.fullName.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-1">
                            <span>{u.fullName}</span>
                            {isProtected && <Shield className="w-3.5 h-3.5 text-blue-500" />}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">@{u.username}</div>
                        </div>
                      </div>

                      <Badge
                        variant={u.status === 'active' ? 'success' : 'danger'}
                        size="sm"
                        dot
                      >
                        {u.status === 'active'
                          ? language === 'ar'
                            ? 'نشط'
                            : 'Active'
                          : language === 'ar'
                          ? 'معطل'
                          : 'Disabled'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-400">{u.email}</span>
                      <Badge variant="neutral" size="sm">
                        {language === 'ar' ? u.roleNameAr : u.roleNameEn}
                      </Badge>
                    </div>

                    {canEditUser && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenEdit(u)}
                        >
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Key className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setSelectedUser(u);
                            setIsResetPassModalOpen(true);
                          }}
                        >
                          كلمة المرور
                        </Button>
                        <Button
                          variant={u.status === 'active' ? 'outline' : 'primary'}
                          size="sm"
                          disabled={isProtected}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.status === 'active' ? 'تعطيل' : 'تفعيل'}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={language === 'ar' ? 'إنشاء حساب مستخدم جديد' : 'Create New User Account'}
        subtitle={
          language === 'ar'
            ? 'تسجيل موظف أو معلم جديد في النظام وتعيين كلمة مرور مشفرة'
            : 'Register a new administrator, faculty member or staff'
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-start">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'الاسم الكامل' : 'Full Name'} *
            </label>
            <input
              type="text"
              required
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
              placeholder={language === 'ar' ? 'مثال: أ. محمد السالم' : 'e.g. John Doe'}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'اسم المستخدم (Username)' : 'Username'} *
              </label>
              <input
                type="text"
                required
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                placeholder="m_salem"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
              </label>
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="user@schoolms.edu"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'كلمة المرور' : 'Password'} *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="••••••••"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={createForm.confirmPassword}
                onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'الدور (Role)' : 'Assigned Role'} *
              </label>
              <select
                value={createForm.roleId}
                onChange={(e) => setCreateForm({ ...createForm, roleId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {language === 'ar' ? r.nameAr : r.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'الحالة المبدئية' : 'Initial Status'}
              </label>
              <select
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as any })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm"
              >
                <option value="active">{language === 'ar' ? 'نشط (Active)' : 'Active'}</option>
                <option value="disabled">{language === 'ar' ? 'معطل (Disabled)' : 'Disabled'}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {language === 'ar' ? 'حفظ وإنشاء المستخدم' : 'Save & Provision'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={language === 'ar' ? 'تعديل بيانات المستخدم' : 'Edit User Profile'}
        subtitle={selectedUser ? `@${selectedUser.username}` : ''}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-start">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
            </label>
            <input
              type="text"
              required
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <input
              type="email"
              required
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'الدور والرتبة' : 'Role'}
              </label>
              <select
                disabled={selectedUser?.isProtectedSuperAdmin}
                value={editForm.roleId}
                onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm disabled:opacity-50"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {language === 'ar' ? r.nameAr : r.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'حالة الحساب' : 'Status'}
              </label>
              <select
                disabled={selectedUser?.isProtectedSuperAdmin}
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm disabled:opacity-50"
              >
                <option value="active">{language === 'ar' ? 'نشط (Active)' : 'Active'}</option>
                <option value="disabled">{language === 'ar' ? 'معطل (Disabled)' : 'Disabled'}</option>
              </select>
            </div>
          </div>

          {selectedUser?.isProtectedSuperAdmin && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>هذا حساب مدير عام النظام الأساسي ومحمي من تقليص الدور أو التعطيل.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={isResetPassModalOpen}
        onClose={() => setIsResetPassModalOpen(false)}
        title={language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Administrative Password Reset'}
        subtitle={selectedUser ? `للمستخدم: ${selectedUser.fullName} (@${selectedUser.username})` : ''}
      >
        <form onSubmit={handleResetPassSubmit} className="space-y-4 text-start">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={resetPassForm.newPassword}
              onChange={(e) => setResetPassForm({ ...resetPassForm, newPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm font-mono focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={resetPassForm.confirmPassword}
              onChange={(e) => setResetPassForm({ ...resetPassForm, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm font-mono focus:outline-none"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            {language === 'ar'
              ? 'سيتم تشفير كلمة المرور فوراً بملح خوارزمي (Salted SHA-256) قبل حفظها في قاعدة البيانات.'
              : 'Password will be salted and hashed with SHA-256 before storage.'}
          </p>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setIsResetPassModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {language === 'ar' ? 'إعادة التعيين الآن' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
