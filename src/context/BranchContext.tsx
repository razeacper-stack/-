import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Branch } from '../types';
import { branchStorage } from '../services/branchStorage';
import { useAuth } from './AuthContext';
import { authStorage } from '../services/authStorage';

export interface BranchContextType {
  branches: Branch[];
  accessibleBranches: Branch[];
  activeBranchId: string; // 'all' or branch.id
  activeBranch: Branch | null;
  setActiveBranchId: (id: string) => void;
  isAllBranches: boolean;
  canAccessAllBranches: boolean;
  refreshBranches: () => void;
  createBranch: (data: {
    code: string;
    nameAr: string;
    nameEn: string;
    addressAr: string;
    addressEn: string;
    phone: string;
    email: string;
    managerName?: string;
    status: 'active' | 'inactive';
  }) => Promise<Branch>;
  updateBranch: (
    branchId: string,
    data: {
      code?: string;
      nameAr?: string;
      nameEn?: string;
      addressAr?: string;
      addressEn?: string;
      phone?: string;
      email?: string;
      managerName?: string;
      status?: 'active' | 'inactive';
    }
  ) => Promise<Branch>;
  toggleBranchStatus: (branchId: string) => Promise<Branch>;
}

const STORAGE_KEY = 'sms_active_branch_v3';

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [branches, setBranches] = useState<Branch[]>(() => {
    branchStorage.initialize();
    return branchStorage.getStoredBranches();
  });

  const refreshBranches = useCallback(() => {
    const list = branchStorage.getStoredBranches();
    setBranches(list);
  }, []);

  // Compute branches that the logged-in user is authorized to view
  const accessibleBranches = useMemo(() => {
    if (!currentUser) return [];
    return branchStorage.getUserAccessibleBranches(currentUser, authStorage.hasPermission(currentUser, 'branches.edit'));
  }, [branches, currentUser]);

  const canAccessAllBranches = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.roleCode === 'SUPER_ADMIN' || currentUser.isProtectedSuperAdmin || currentUser.hasAllBranchesAccess) {
      return true;
    }
    // If user's assigned branches include all active branches
    const activeCount = branches.filter((b) => b.status === 'active').length;
    return activeCount > 0 && accessibleBranches.length >= activeCount;
  }, [currentUser, branches, accessibleBranches]);

  const [activeBranchId, setActiveBranchIdState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        if (!currentUser) return stored;
        const isSuper =
          currentUser.roleCode === 'SUPER_ADMIN' ||
          currentUser.isProtectedSuperAdmin ||
          currentUser.hasAllBranchesAccess;
        if (isSuper) return stored;
        if (stored === 'all') {
          return currentUser.branchIds && currentUser.branchIds.length > 0 ? currentUser.branchIds[0] : 'all';
        }
        if (currentUser.branchIds && currentUser.branchIds.includes(stored)) {
          return stored;
        }
        return currentUser.branchIds && currentUser.branchIds.length > 0 ? currentUser.branchIds[0] : 'all';
      }
    } catch {
      // Ignore
    }
    return 'all';
  });

  // Ensure activeBranchId conforms to the current user's access rights
  useEffect(() => {
    if (!currentUser || accessibleBranches.length === 0) return;

    if (activeBranchId === 'all') {
      // If user is not authorized for "All Branches", fall back to their first allowed branch
      if (!canAccessAllBranches) {
        const fallback = accessibleBranches[0]?.id || 'all';
        setActiveBranchIdState(fallback);
        localStorage.setItem(STORAGE_KEY, fallback);
      }
    } else {
      // If currently active branch is not in user's accessible list
      const hasAccess = accessibleBranches.some((b) => b.id === activeBranchId);
      if (!hasAccess) {
        const fallback = canAccessAllBranches ? 'all' : accessibleBranches[0]?.id || 'all';
        setActiveBranchIdState(fallback);
        localStorage.setItem(STORAGE_KEY, fallback);
      }
    }
  }, [currentUser, accessibleBranches, canAccessAllBranches, activeBranchId]);

  const setActiveBranchId = (id: string) => {
    if (!currentUser) return;

    if (id === 'all') {
      if (!canAccessAllBranches) {
        authStorage.logAudit({
          actorId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: currentUser.roleCode,
          action: 'UNAUTHORIZED_BRANCH_ACCESS',
          targetType: 'BRANCH',
          result: 'DENIED',
          details: `User "${currentUser.username}" attempted unauthorized global multi-branch view`,
        });
        throw new Error('غير مصرح لك باستعراض كافة الفروع المدرسية معاً.');
      }
      setActiveBranchIdState('all');
      localStorage.setItem(STORAGE_KEY, 'all');

      authStorage.logAudit({
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.roleCode,
        action: 'BRANCH_SWITCHED',
        targetType: 'BRANCH',
        targetIdentifier: 'ALL_BRANCHES',
        result: 'SUCCESS',
        details: `User switched view to All Campuses aggregate`,
      });
      return;
    }

    // Verify user access to the chosen branch
    const targetBranch = branches.find((b) => b.id === id);
    if (!targetBranch) {
      throw new Error('الفرع المختار غير موجود.');
    }

    const hasAccess = branchStorage.canUserAccessBranch(currentUser, id);
    if (!hasAccess) {
      authStorage.logAudit({
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.roleCode,
        action: 'UNAUTHORIZED_BRANCH_ACCESS',
        targetType: 'BRANCH',
        targetId: targetBranch.id,
        targetIdentifier: targetBranch.code,
        branchContext: targetBranch.nameAr,
        result: 'DENIED',
        details: `User "${currentUser.username}" blocked from switching to unauthorized branch "${targetBranch.code}"`,
      });
      throw new Error(`غير مصرح لك بالوصول إلى فرع (${targetBranch.nameAr}). تم توثيق المحاولة.`);
    }

    setActiveBranchIdState(id);
    localStorage.setItem(STORAGE_KEY, id);

    authStorage.logAudit({
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.roleCode,
      action: 'BRANCH_SWITCHED',
      targetType: 'BRANCH',
      targetId: targetBranch.id,
      targetIdentifier: targetBranch.code,
      branchContext: targetBranch.nameAr,
      result: 'SUCCESS',
      details: `Switched active branch context to "${targetBranch.nameAr}" [${targetBranch.code}]`,
    });
  };

  const isAllBranches = activeBranchId === 'all';
  const activeBranch = isAllBranches ? null : branches.find((b) => b.id === activeBranchId) || null;

  const createBranch = async (data: any): Promise<Branch> => {
    if (!currentUser) throw new Error('يجب تسجيل الدخول أولاً.');
    const newBranch = branchStorage.createBranch(currentUser, data);
    refreshBranches();
    return newBranch;
  };

  const updateBranch = async (branchId: string, data: any): Promise<Branch> => {
    if (!currentUser) throw new Error('يجب تسجيل الدخول أولاً.');
    const updated = branchStorage.updateBranch(currentUser, branchId, data);
    refreshBranches();
    return updated;
  };

  const toggleBranchStatus = async (branchId: string): Promise<Branch> => {
    if (!currentUser) throw new Error('يجب تسجيل الدخول أولاً.');
    const toggled = branchStorage.toggleBranchStatus(currentUser, branchId);
    refreshBranches();
    return toggled;
  };

  return (
    <BranchContext.Provider
      value={{
        branches,
        accessibleBranches,
        activeBranchId,
        activeBranch,
        setActiveBranchId,
        isAllBranches,
        canAccessAllBranches,
        refreshBranches,
        createBranch,
        updateBranch,
        toggleBranchStatus,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = (): BranchContextType => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
