import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  TeacherDetail,
  TeacherFilterParams,
  TeacherStats,
  CreateTeacherDTO,
  UpdateTeacherDTO,
  TeacherStatus,
  TeacherClassRole,
} from '../types/teacher';
import { teacherStorage } from '../services/teacherStorage';
import { useAuth } from './AuthContext';
import { useBranch } from './BranchContext';

export interface TeacherContextType {
  teachers: TeacherDetail[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: TeacherFilterParams;
  setFilters: (newFilters: Partial<TeacherFilterParams>) => void;
  resetFilters: () => void;
  stats: TeacherStats | null;
  isLoading: boolean;
  selectedTeacher: TeacherDetail | null;
  setSelectedTeacher: (teacher: TeacherDetail | null) => void;
  refreshTeachers: () => void;
  refreshStats: () => void;
  createTeacher: (dto: CreateTeacherDTO) => Promise<TeacherDetail>;
  updateTeacher: (teacherId: string, updates: UpdateTeacherDTO) => Promise<TeacherDetail>;
  changeTeacherStatus: (teacherId: string, status: TeacherStatus, reason?: string) => Promise<TeacherDetail>;
  archiveTeacher: (teacherId: string, reason: string) => Promise<TeacherDetail>;
  restoreTeacher: (teacherId: string, reason?: string) => Promise<TeacherDetail>;
  assignSubject: (teacherId: string, subjectId: string, isPrimary?: boolean) => Promise<void>;
  removeSubject: (teacherId: string, subjectId: string) => Promise<void>;
  assignClass: (teacherId: string, classId: string, academicYearId: string, role?: TeacherClassRole) => Promise<void>;
  removeClass: (teacherClassId: string) => Promise<void>;
  addQualification: (
    teacherId: string,
    data: Parameters<typeof teacherStorage.addQualification>[2]
  ) => Promise<void>;
  removeQualification: (qualificationId: string) => Promise<void>;
  generateNextNumber: (branchId: string) => string;
  exportCSV: () => string;
}

const TeacherContext = createContext<TeacherContextType | undefined>(undefined);

export const TeacherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { activeBranchId } = useBranch();

  const [teachers, setTeachers] = useState<TeacherDetail[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherDetail | null>(null);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isSuperAdmin =
    currentUser?.roleCode === 'SUPER_ADMIN' ||
    currentUser?.isProtectedSuperAdmin ||
    currentUser?.hasAllBranchesAccess;

  const [filters, setFiltersState] = useState<TeacherFilterParams>(() => {
    let initialBranch = activeBranchId || 'all';
    if (!isSuperAdmin && currentUser?.branchIds) {
      if (initialBranch !== 'all' && !currentUser.branchIds.includes(initialBranch)) {
        initialBranch = currentUser.branchIds.length > 0 ? currentUser.branchIds[0] : 'all';
      }
    }
    return {
      search: '',
      branchId: initialBranch,
      status: 'all',
      employmentType: 'all',
      subjectId: 'all',
      gender: 'all',
      sortBy: 'createdAt',
      sortDirection: 'desc',
      page: 1,
      pageSize: 15,
    };
  });

  // Keep branch in sync with activeBranchId unless user chose a specific filter
  useEffect(() => {
    if (!currentUser) return;
    const isSuper =
      currentUser.roleCode === 'SUPER_ADMIN' ||
      currentUser.isProtectedSuperAdmin ||
      currentUser.hasAllBranchesAccess;

    if (activeBranchId) {
      let branchToSet = activeBranchId;
      if (!isSuper && currentUser.branchIds) {
        if (branchToSet !== 'all' && !currentUser.branchIds.includes(branchToSet)) {
          branchToSet = currentUser.branchIds.length > 0 ? currentUser.branchIds[0] : 'all';
        }
      }
      setFiltersState((prev) => ({
        ...prev,
        branchId: branchToSet,
        page: 1,
      }));
    }
  }, [activeBranchId, currentUser]);

  const loadData = useCallback(() => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      teacherStorage.initialize();

      const isSuper =
        currentUser.roleCode === 'SUPER_ADMIN' ||
        currentUser.isProtectedSuperAdmin ||
        currentUser.hasAllBranchesAccess;

      let targetBranch = filters.branchId;
      if ((!targetBranch || targetBranch === 'all') && activeBranchId && activeBranchId !== 'all') {
        targetBranch = activeBranchId;
      }

      // If user is restricted to specific branches, verify and sanitize targetBranch
      if (!isSuper && currentUser.branchIds) {
        if (targetBranch && targetBranch !== 'all' && !currentUser.branchIds.includes(targetBranch)) {
          targetBranch = currentUser.branchIds.length > 0 ? currentUser.branchIds[0] : 'all';
        }
      }

      const result = teacherStorage.listTeachers(currentUser, {
        ...filters,
        branchId: targetBranch,
      });

      setTeachers(result.teachers);
      setTotalCount(result.totalCount);
      setPage(result.page);
      setPageSize(result.pageSize);
      setTotalPages(result.totalPages);

      const branchForStats = targetBranch !== 'all' ? targetBranch : undefined;
      const statsResult = teacherStorage.getTeacherStats(currentUser, branchForStats);
      setStats(statsResult);
    } catch (err: any) {
      console.error('Error loading teacher roster:', err);
      // Graceful fallback if permission or branch error occurred
      try {
        const isSuper =
          currentUser.roleCode === 'SUPER_ADMIN' ||
          currentUser.isProtectedSuperAdmin ||
          currentUser.hasAllBranchesAccess;
        const fallbackBranch = !isSuper && currentUser.branchIds && currentUser.branchIds.length > 0 ? currentUser.branchIds[0] : 'all';
        const fallbackResult = teacherStorage.listTeachers(currentUser, {
          ...filters,
          branchId: fallbackBranch,
        });
        setTeachers(fallbackResult.teachers);
        setTotalCount(fallbackResult.totalCount);
      } catch {
        setTeachers([]);
        setTotalCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, activeBranchId, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setFilters = (newFilters: Partial<TeacherFilterParams>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1, // reset page unless page explicitly changed
    }));
  };

  const resetFilters = () => {
    let initialBranch = activeBranchId || 'all';
    if (!isSuperAdmin && currentUser?.branchIds) {
      if (initialBranch !== 'all' && !currentUser.branchIds.includes(initialBranch)) {
        initialBranch = currentUser.branchIds.length > 0 ? currentUser.branchIds[0] : 'all';
      }
    }
    setFiltersState({
      search: '',
      branchId: initialBranch,
      status: 'all',
      employmentType: 'all',
      subjectId: 'all',
      gender: 'all',
      sortBy: 'createdAt',
      sortDirection: 'desc',
      page: 1,
      pageSize: 15,
    });
  };

  const refreshTeachers = useCallback(() => {
    loadData();
  }, [loadData]);

  const refreshStats = useCallback(() => {
    if (!currentUser) return;
    try {
      const branchTarget = filters.branchId && filters.branchId !== 'all' ? filters.branchId : undefined;
      const s = teacherStorage.getTeacherStats(currentUser, branchTarget);
      setStats(s);
    } catch {
      // Ignore
    }
  }, [currentUser, filters.branchId]);

  const createTeacher = async (dto: CreateTeacherDTO): Promise<TeacherDetail> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const created = teacherStorage.createTeacher(currentUser, dto);
    loadData();
    return created;
  };

  const updateTeacher = async (
    teacherId: string,
    updates: UpdateTeacherDTO
  ): Promise<TeacherDetail> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const updated = teacherStorage.updateTeacher(currentUser, teacherId, updates);
    loadData();
    if (selectedTeacher && selectedTeacher.id === teacherId) {
      setSelectedTeacher(updated);
    }
    return updated;
  };

  const changeTeacherStatus = async (
    teacherId: string,
    status: TeacherStatus,
    reason?: string
  ): Promise<TeacherDetail> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const updated = teacherStorage.changeTeacherStatus(currentUser, teacherId, status, reason);
    loadData();
    if (selectedTeacher && selectedTeacher.id === teacherId) {
      setSelectedTeacher(updated);
    }
    return updated;
  };

  const archiveTeacher = async (teacherId: string, reason: string): Promise<TeacherDetail> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const updated = teacherStorage.archiveTeacher(currentUser, teacherId, reason);
    loadData();
    if (selectedTeacher && selectedTeacher.id === teacherId) {
      setSelectedTeacher(updated);
    }
    return updated;
  };

  const restoreTeacher = async (teacherId: string, reason?: string): Promise<TeacherDetail> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const updated = teacherStorage.restoreTeacher(currentUser, teacherId, reason);
    loadData();
    if (selectedTeacher && selectedTeacher.id === teacherId) {
      setSelectedTeacher(updated);
    }
    return updated;
  };

  const assignSubject = async (teacherId: string, subjectId: string, isPrimary = false): Promise<void> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    teacherStorage.assignSubjectToTeacher(currentUser, teacherId, subjectId, isPrimary);
    loadData();
    if (selectedTeacher && selectedTeacher.id === teacherId) {
      const fresh = teacherStorage.getTeacherById(currentUser, teacherId);
      setSelectedTeacher(fresh);
    }
  };

  const removeSubject = async (teacherId: string, subjectId: string): Promise<void> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    teacherStorage.removeSubjectFromTeacher(currentUser, teacherId, subjectId);
    loadData();
    if (selectedTeacher && selectedTeacher.id === teacherId) {
      const fresh = teacherStorage.getTeacherById(currentUser, teacherId);
      setSelectedTeacher(fresh);
    }
  };

  const assignClass = async (
    teacherId: string,
    classId: string,
    academicYearId: string,
    role: TeacherClassRole = 'PRIMARY_TEACHER'
  ): Promise<void> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    teacherStorage.assignClassToTeacher(currentUser, teacherId, classId, academicYearId, role);
    loadData();
    if (selectedTeacher && selectedTeacher.id === teacherId) {
      const fresh = teacherStorage.getTeacherById(currentUser, teacherId);
      setSelectedTeacher(fresh);
    }
  };

  const removeClass = async (teacherClassId: string): Promise<void> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    teacherStorage.removeClassFromTeacher(currentUser, teacherClassId);
    loadData();
    if (selectedTeacher) {
      const fresh = teacherStorage.getTeacherById(currentUser, selectedTeacher.id);
      setSelectedTeacher(fresh);
    }
  };

  const addQualification = async (
    teacherId: string,
    data: Parameters<typeof teacherStorage.addQualification>[2]
  ): Promise<void> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    teacherStorage.addQualification(currentUser, teacherId, data);
    loadData();
    if (selectedTeacher && selectedTeacher.id === teacherId) {
      const fresh = teacherStorage.getTeacherById(currentUser, teacherId);
      setSelectedTeacher(fresh);
    }
  };

  const removeQualification = async (qualificationId: string): Promise<void> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    teacherStorage.removeQualification(currentUser, qualificationId);
    loadData();
    if (selectedTeacher) {
      const fresh = teacherStorage.getTeacherById(currentUser, selectedTeacher.id);
      setSelectedTeacher(fresh);
    }
  };

  const generateNextNumber = (branchId: string): string => {
    return teacherStorage.generateNextTeacherNumber(branchId);
  };

  const exportCSV = (): string => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    return teacherStorage.exportTeachersCSV(currentUser, filters);
  };

  return (
    <TeacherContext.Provider
      value={{
        teachers,
        totalCount,
        page,
        pageSize,
        totalPages,
        filters,
        setFilters,
        resetFilters,
        stats,
        isLoading,
        selectedTeacher,
        setSelectedTeacher,
        refreshTeachers,
        refreshStats,
        createTeacher,
        updateTeacher,
        changeTeacherStatus,
        archiveTeacher,
        restoreTeacher,
        assignSubject,
        removeSubject,
        assignClass,
        removeClass,
        addQualification,
        removeQualification,
        generateNextNumber,
        exportCSV,
      }}
    >
      {children}
    </TeacherContext.Provider>
  );
};

export const useTeachers = (): TeacherContextType => {
  const context = useContext(TeacherContext);
  if (!context) {
    throw new Error('useTeachers must be used within a TeacherProvider');
  }
  return context;
};
