import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SafeUser, StandardPermissionKey } from '../types/auth';
import { authStorage } from '../services/authStorage';

export interface AuthContextType {
  currentUser: SafeUser | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: (identifier: string, passwordAttempt: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permission: StandardPermissionKey) => boolean;
  hasAnyPermission: (permissions: StandardPermissionKey[]) => boolean;
  refreshUser: () => void;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and load active session on startup
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        await authStorage.initialize();
        const freshUser = authStorage.refreshSession();
        if (mounted && freshUser) {
          setCurrentUser(freshUser);
        } else if (mounted) {
          setCurrentUser(null);
        }
      } catch (e) {
        console.error('Session load error', e);
        if (mounted) setCurrentUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initSession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (identifier: string, passwordAttempt: string) => {
    setIsLoading(true);
    try {
      const result = await authStorage.authenticate(identifier, passwordAttempt);
      if (result.error || !result.user) {
        return { success: false, error: result.error || 'فشل تسجيل الدخول' };
      }

      setCurrentUser(result.user);
      authStorage.setStoredSession(result.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'حدث خطأ أثناء الاتصال بالنظام' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    if (currentUser) {
      authStorage.logAudit({
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.roleCode,
        action: 'LOGOUT',
        targetType: 'SESSION',
        result: 'SUCCESS',
        details: `User "${currentUser.username}" logged out`,
      });
    }
    authStorage.setStoredSession(null);
    setCurrentUser(null);
  }, [currentUser]);

  const hasPermission = useCallback(
    (perm: StandardPermissionKey): boolean => {
      return authStorage.hasPermission(currentUser, perm);
    },
    [currentUser]
  );

  const hasAnyPermission = useCallback(
    (perms: StandardPermissionKey[]): boolean => {
      if (!currentUser) return false;
      return perms.some((p) => authStorage.hasPermission(currentUser, p));
    },
    [currentUser]
  );

  const refreshUser = useCallback(() => {
    if (!currentUser) return;
    try {
      const fresh = authStorage.refreshSession();
      if (fresh) {
        setCurrentUser(fresh);
      }
    } catch {
      // Ignore
    }
  }, [currentUser]);

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!currentUser) {
      return { success: false, error: 'غير مصرح' };
    }
    try {
      await authStorage.changeOwnPassword(currentUser.id, currentPass, newPass);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'فشل تغيير كلمة المرور' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isSuperAdmin: authStorage.isSuperAdmin(currentUser),
        isLoading,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        refreshUser,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
