import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  StudentDetail,
  StudentFilterParams,
  StudentStats,
  CreateStudentDTO,
  UpdateStudentDTO,
  StudentStatus,
} from '../types/student';
import { studentStorage } from '../services/studentStorage';
import { useAuth } from './AuthContext';
import { useBranch } from './BranchContext';

export interface StudentContextType {
  students: StudentDetail[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: StudentFilterParams;
  setFilters: (newFilters: Partial<StudentFilterParams>) => void;
  resetFilters: () => void;
  stats: StudentStats | null;
  isLoading: boolean;
  selectedStudent: StudentDetail | null;
  setSelectedStudent: (student: StudentDetail | null) => void;
  refreshStudents: () => void;
  refreshStats: () => void;
  createStudent: (dto: CreateStudentDTO) => Promise<StudentDetail>;
  updateStudent: (studentId: string, updates: UpdateStudentDTO) => Promise<StudentDetail>;
  changeStudentStatus: (studentId: string, status: StudentStatus, reason?: string) => Promise<StudentDetail>;
  archiveStudent: (studentId: string, reason: string) => Promise<StudentDetail>;
  transferClass: (studentId: string, newClassId: string, reason: string) => Promise<StudentDetail>;
  addGuardian: (
    studentId: string,
    data: Parameters<typeof studentStorage.addGuardianToStudent>[2]
  ) => Promise<StudentDetail>;
  generateNextNumber: (branchId: string) => string;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { activeBranchId } = useBranch();

  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isSuperAdmin =
    currentUser?.roleCode === 'SUPER_ADMIN' ||
    currentUser?.isProtectedSuperAdmin ||
    currentUser?.hasAllBranchesAccess;

  const [filters, setFiltersState] = useState<StudentFilterParams>(() => {
    let initialBranch = activeBranchId || 'all';
    if (!isSuperAdmin && currentUser?.branchIds) {
      if (initialBranch !== 'all' && !currentUser.branchIds.includes(initialBranch)) {
        initialBranch = currentUser.branchIds.length > 0 ? currentUser.branchIds[0] : 'all';
      }
    }
    return {
      search: '',
      branchId: initialBranch,
      academicYearId: 'all',
      stageId: 'all',
      gradeId: 'all',
      classId: 'all',
      status: 'all',
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
      studentStorage.initialize();

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

      const result = studentStorage.listStudents(currentUser, {
        ...filters,
        branchId: targetBranch,
      });

      setStudents(result.students);
      setTotalCount(result.totalCount);
      setPage(result.page);
      setPageSize(result.pageSize);
      setTotalPages(result.totalPages);

      const branchForStats = targetBranch !== 'all' ? targetBranch : undefined;
      const statsResult = studentStorage.getStudentStats(currentUser, branchForStats);
      setStats(statsResult);
    } catch (err: any) {
      console.error('Error loading student roster:', err);
      // Graceful fallback if permission or branch error occurred
      try {
        const isSuper =
          currentUser.roleCode === 'SUPER_ADMIN' ||
          currentUser.isProtectedSuperAdmin ||
          currentUser.hasAllBranchesAccess;
        const fallbackBranch = !isSuper && currentUser.branchIds?.length ? currentUser.branchIds[0] : 'all';
        const fallbackResult = studentStorage.listStudents(currentUser, {
          ...filters,
          branchId: fallbackBranch,
        });
        setStudents(fallbackResult.students);
        setTotalCount(fallbackResult.totalCount);
        setPage(fallbackResult.page);
        setPageSize(fallbackResult.pageSize);
        setTotalPages(fallbackResult.totalPages);
        const statsResult = studentStorage.getStudentStats(currentUser, fallbackBranch !== 'all' ? fallbackBranch : undefined);
        setStats(statsResult);
      } catch {
        setStudents([]);
        setTotalCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, filters, activeBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setFilters = (newFilters: Partial<StudentFilterParams>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
      // If filtering changed (other than page), reset page to 1
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  };

  const resetFilters = () => {
    setFiltersState({
      search: '',
      branchId: activeBranchId || 'all',
      academicYearId: 'all',
      stageId: 'all',
      gradeId: 'all',
      classId: 'all',
      status: 'all',
      gender: 'all',
      sortBy: 'createdAt',
      sortDirection: 'desc',
      page: 1,
      pageSize: 15,
    });
  };

  const refreshStudents = () => {
    loadData();
  };

  const refreshStats = () => {
    if (!currentUser) return;
    const branchForStats = filters.branchId !== 'all' ? filters.branchId : activeBranchId;
    setStats(studentStorage.getStudentStats(currentUser, branchForStats));
  };

  const createStudent = async (dto: CreateStudentDTO): Promise<StudentDetail> => {
    if (!currentUser) throw new Error('Unauthenticated');
    const created = studentStorage.createStudentWithEnrollment(currentUser, dto);
    loadData();
    return created;
  };

  const updateStudent = async (studentId: string, updates: UpdateStudentDTO): Promise<StudentDetail> => {
    if (!currentUser) throw new Error('Unauthenticated');
    const updated = studentStorage.updateStudent(currentUser, studentId, updates);
    loadData();
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent(updated);
    }
    return updated;
  };

  const changeStudentStatus = async (
    studentId: string,
    status: StudentStatus,
    reason?: string
  ): Promise<StudentDetail> => {
    if (!currentUser) throw new Error('Unauthenticated');
    const updated = studentStorage.changeStudentStatus(currentUser, studentId, status, reason);
    loadData();
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent(updated);
    }
    return updated;
  };

  const archiveStudent = async (studentId: string, reason: string): Promise<StudentDetail> => {
    if (!currentUser) throw new Error('Unauthenticated');
    const updated = studentStorage.archiveStudent(currentUser, studentId, reason);
    loadData();
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent(updated);
    }
    return updated;
  };

  const transferClass = async (
    studentId: string,
    newClassId: string,
    reason: string
  ): Promise<StudentDetail> => {
    if (!currentUser) throw new Error('Unauthenticated');
    const updated = studentStorage.transferStudentClass(currentUser, studentId, newClassId, reason);
    loadData();
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent(updated);
    }
    return updated;
  };

  const addGuardian = async (
    studentId: string,
    data: Parameters<typeof studentStorage.addGuardianToStudent>[2]
  ): Promise<StudentDetail> => {
    if (!currentUser) throw new Error('Unauthenticated');
    const updated = studentStorage.addGuardianToStudent(currentUser, studentId, data);
    loadData();
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent(updated);
    }
    return updated;
  };

  const generateNextNumber = (branchId: string): string => {
    return studentStorage.generateNextStudentNumber(branchId);
  };

  return (
    <StudentContext.Provider
      value={{
        students,
        totalCount,
        page,
        pageSize,
        totalPages,
        filters,
        setFilters,
        resetFilters,
        stats,
        isLoading,
        selectedStudent,
        setSelectedStudent,
        refreshStudents,
        refreshStats,
        createStudent,
        updateStudent,
        changeStudentStatus,
        archiveStudent,
        transferClass,
        addGuardian,
        generateNextNumber,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudents = (): StudentContextType => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudents must be used within a StudentProvider');
  }
  return context;
};
