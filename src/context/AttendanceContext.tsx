import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  AttendanceRecord,
  PopulatedAttendanceRecord,
  AttendanceSession,
  AttendanceStats,
  ClassAttendanceSummary,
  StudentAttendanceRow,
  AttendanceType,
  SaveClassAttendanceDTO,
  CorrectAttendanceDTO,
  LockAttendanceDTO,
  AttendanceFilterParams,
} from '../types/attendance';
import { attendanceStorage } from '../services/attendanceStorage';
import { useAuth } from './AuthContext';
import { useBranch } from './BranchContext';

interface AttendanceContextType {
  records: PopulatedAttendanceRecord[];
  sessions: AttendanceSession[];
  isLoading: boolean;
  refreshData: () => void;

  // Actions
  getClassRosterWithAttendance: (params: {
    branchId: string;
    academicYearId: string;
    classId: string;
    date: string;
    type: AttendanceType;
    timetableEntryId?: string;
    periodId?: string;
  }) => {
    students: StudentAttendanceRow[];
    session: AttendanceSession | null;
  };

  saveClassAttendance: (dto: SaveClassAttendanceDTO) => Promise<{
    savedCount: number;
    session: AttendanceSession;
  }>;

  correctAttendance: (
    recordId: string,
    dto: CorrectAttendanceDTO
  ) => Promise<PopulatedAttendanceRecord>;

  lockAttendance: (dto: LockAttendanceDTO) => Promise<AttendanceSession>;
  unlockAttendance: (dto: LockAttendanceDTO) => Promise<AttendanceSession>;
  deleteAttendanceRecord: (recordId: string) => Promise<void>;

  getStudentAttendanceSummary: (
    studentId: string,
    academicYearId?: string
  ) => {
    stats: AttendanceStats;
    records: PopulatedAttendanceRecord[];
  };

  getClassAttendanceDashboard: (branchId: string, date: string) => ClassAttendanceSummary[];
  exportCSV: (filters: AttendanceFilterParams) => string;
}

const AttendanceContext = createContext<AttendanceContextType | null>(null);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { activeBranchId, branches } = useBranch();

  const [records, setRecords] = useState<PopulatedAttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const effectiveBranchId = useMemo(() => {
    if (activeBranchId && activeBranchId !== 'all') {
      return activeBranchId;
    }
    return branches[0]?.id || 'branch-riyadh';
  }, [activeBranchId, branches]);

  const refreshData = useCallback(() => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      attendanceStorage.initialize();
      const loaded = attendanceStorage.listRecords(currentUser, {
        branchId: effectiveBranchId,
      });
      setRecords(loaded);
      setSessions(attendanceStorage.getRawSessions());
    } catch (err) {
      console.error('Error refreshing attendance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, effectiveBranchId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Operations
  const getClassRosterWithAttendance = (params: {
    branchId: string;
    academicYearId: string;
    classId: string;
    date: string;
    type: AttendanceType;
    timetableEntryId?: string;
    periodId?: string;
  }) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    return attendanceStorage.getClassRosterWithAttendance(currentUser, params);
  };

  const saveClassAttendance = async (dto: SaveClassAttendanceDTO) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const result = attendanceStorage.saveClassAttendance(currentUser, dto);
    refreshData();
    return result;
  };

  const correctAttendance = async (recordId: string, dto: CorrectAttendanceDTO) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const result = attendanceStorage.correctAttendance(currentUser, recordId, dto);
    refreshData();
    return result;
  };

  const lockAttendance = async (dto: LockAttendanceDTO) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const result = attendanceStorage.lockAttendance(currentUser, dto);
    refreshData();
    return result;
  };

  const unlockAttendance = async (dto: LockAttendanceDTO) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const result = attendanceStorage.unlockAttendance(currentUser, dto);
    refreshData();
    return result;
  };

  const deleteAttendanceRecord = async (recordId: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    attendanceStorage.deleteAttendanceRecord(currentUser, recordId);
    refreshData();
  };

  const getStudentAttendanceSummary = (studentId: string, academicYearId?: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    return attendanceStorage.getStudentAttendanceSummary(currentUser, studentId, academicYearId);
  };

  const getClassAttendanceDashboard = (branchId: string, date: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    return attendanceStorage.getClassAttendanceDashboard(currentUser, branchId, date);
  };

  const exportCSV = (filters: AttendanceFilterParams) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    return attendanceStorage.exportAttendanceCSV(currentUser, filters);
  };

  return (
    <AttendanceContext.Provider
      value={{
        records,
        sessions,
        isLoading,
        refreshData,
        getClassRosterWithAttendance,
        saveClassAttendance,
        correctAttendance,
        lockAttendance,
        unlockAttendance,
        deleteAttendanceRecord,
        getStudentAttendanceSummary,
        getClassAttendanceDashboard,
        exportCSV,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = (): AttendanceContextType => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
