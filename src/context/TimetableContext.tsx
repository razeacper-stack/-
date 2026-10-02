import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  TimetablePeriod,
  SchoolRoom,
  PopulatedTimetableEntry,
  WeeklySubjectLoad,
  DayOfWeek,
  CreateTimetableEntryDTO,
  UpdateTimetableEntryDTO,
  MoveTimetableEntryDTO,
  CopyClassTimetableDTO,
  CreatePeriodDTO,
  UpdatePeriodDTO,
  CreateRoomDTO,
  UpdateRoomDTO,
  TimetableFilterParams,
  TimetableConflict,
} from '../types/timetable';
import { timetableStorage } from '../services/timetableStorage';
import { useAuth } from './AuthContext';
import { useBranch } from './BranchContext';
import { useAcademic } from './AcademicContext';

interface TimetableContextType {
  entries: PopulatedTimetableEntry[];
  periods: TimetablePeriod[];
  rooms: SchoolRoom[];
  activeDays: DayOfWeek[];
  isLoading: boolean;
  refreshData: () => void;

  // Timetable Lesson Actions
  createEntry: (dto: CreateTimetableEntryDTO) => Promise<PopulatedTimetableEntry>;
  updateEntry: (id: string, dto: UpdateTimetableEntryDTO) => Promise<PopulatedTimetableEntry>;
  moveEntry: (id: string, moveDto: MoveTimetableEntryDTO) => Promise<PopulatedTimetableEntry>;
  deleteEntry: (id: string) => Promise<void>;
  publishClassTimetable: (classId: string, academicYearId: string) => Promise<{ publishedCount: number }>;
  unpublishClassTimetable: (classId: string, academicYearId: string) => Promise<{ unpublishedCount: number }>;
  copyClassTimetable: (dto: CopyClassTimetableDTO) => Promise<{ copiedCount: number }>;

  // Period Actions
  createPeriod: (dto: CreatePeriodDTO) => Promise<TimetablePeriod>;
  updatePeriod: (id: string, dto: UpdatePeriodDTO) => Promise<TimetablePeriod>;

  // Room Actions
  createRoom: (dto: CreateRoomDTO) => Promise<SchoolRoom>;
  updateRoom: (id: string, dto: UpdateRoomDTO) => Promise<SchoolRoom>;

  // Subject Load & Conflict Checkers
  getSubjectLoad: (classId: string, academicYearId: string) => WeeklySubjectLoad[];
  detectConflict: (candidate: any, excludeId?: string) => TimetableConflict | null;
  exportCSV: (params: TimetableFilterParams) => string;
}

const TimetableContext = createContext<TimetableContextType | null>(null);

export const TimetableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { activeBranchId, branches } = useBranch();
  const { years } = useAcademic();

  const [entries, setEntries] = useState<PopulatedTimetableEntry[]>([]);
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [rooms, setRooms] = useState<SchoolRoom[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Determine effective branch ID for timetable scope
  const effectiveBranchId = useMemo(() => {
    if (activeBranchId && activeBranchId !== 'all') {
      return activeBranchId;
    }
    return branches[0]?.id || 'branch-riyadh';
  }, [activeBranchId, branches]);

  const activeDays = useMemo(() => {
    return timetableStorage.getActiveDaysForBranch(effectiveBranchId);
  }, [effectiveBranchId]);

  const refreshData = useCallback(() => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      timetableStorage.initialize();

      const branchPeriods = timetableStorage.listPeriods(currentUser, effectiveBranchId);
      setPeriods(branchPeriods);

      const branchRooms = timetableStorage.listRooms(currentUser, effectiveBranchId);
      setRooms(branchRooms);

      const allEntries = timetableStorage.listTimetableEntries(currentUser, {
        branchId: effectiveBranchId,
      });
      setEntries(allEntries);
    } catch (err) {
      console.error('Error refreshing timetable data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, effectiveBranchId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Lesson CRUD
  const createEntry = async (dto: CreateTimetableEntryDTO): Promise<PopulatedTimetableEntry> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const result = timetableStorage.createTimetableEntry(currentUser, dto);
    refreshData();
    return result;
  };

  const updateEntry = async (id: string, dto: UpdateTimetableEntryDTO): Promise<PopulatedTimetableEntry> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const result = timetableStorage.updateTimetableEntry(currentUser, id, dto);
    refreshData();
    return result;
  };

  const moveEntry = async (id: string, moveDto: MoveTimetableEntryDTO): Promise<PopulatedTimetableEntry> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const result = timetableStorage.moveTimetableEntry(currentUser, id, moveDto);
    refreshData();
    return result;
  };

  const deleteEntry = async (id: string): Promise<void> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    timetableStorage.deleteTimetableEntry(currentUser, id);
    refreshData();
  };

  const publishClassTimetable = async (
    classId: string,
    academicYearId: string
  ): Promise<{ publishedCount: number }> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const result = timetableStorage.publishClassTimetable(
      currentUser,
      effectiveBranchId,
      academicYearId,
      classId
    );
    refreshData();
    return result;
  };

  const unpublishClassTimetable = async (
    classId: string,
    academicYearId: string
  ): Promise<{ unpublishedCount: number }> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const result = timetableStorage.unpublishClassTimetable(
      currentUser,
      effectiveBranchId,
      academicYearId,
      classId
    );
    refreshData();
    return result;
  };

  const copyClassTimetable = async (
    dto: CopyClassTimetableDTO
  ): Promise<{ copiedCount: number }> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const result = timetableStorage.copyClassTimetable(currentUser, dto);
    refreshData();
    return result;
  };

  // Period Actions
  const createPeriod = async (dto: CreatePeriodDTO): Promise<TimetablePeriod> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const result = timetableStorage.createPeriod(currentUser, dto);
    refreshData();
    return result;
  };

  const updatePeriod = async (id: string, dto: UpdatePeriodDTO): Promise<TimetablePeriod> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const result = timetableStorage.updatePeriod(currentUser, id, dto);
    refreshData();
    return result;
  };

  // Room Actions
  const createRoom = async (dto: CreateRoomDTO): Promise<SchoolRoom> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const result = timetableStorage.createRoom(currentUser, dto);
    refreshData();
    return result;
  };

  const updateRoom = async (id: string, dto: UpdateRoomDTO): Promise<SchoolRoom> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const result = timetableStorage.updateRoom(currentUser, id, dto);
    refreshData();
    return result;
  };

  // Subject Load & Conflict Checkers
  const getSubjectLoad = (classId: string, academicYearId: string): WeeklySubjectLoad[] => {
    return timetableStorage.getWeeklySubjectLoad(classId, academicYearId);
  };

  const detectConflict = (candidate: any, excludeId?: string): TimetableConflict | null => {
    return timetableStorage.detectConflict(candidate, excludeId);
  };

  const exportCSV = (params: TimetableFilterParams): string => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    return timetableStorage.exportTimetableCSV(currentUser, params);
  };

  return (
    <TimetableContext.Provider
      value={{
        entries,
        periods,
        rooms,
        activeDays,
        isLoading,
        refreshData,
        createEntry,
        updateEntry,
        moveEntry,
        deleteEntry,
        publishClassTimetable,
        unpublishClassTimetable,
        copyClassTimetable,
        createPeriod,
        updatePeriod,
        createRoom,
        updateRoom,
        getSubjectLoad,
        detectConflict,
        exportCSV,
      }}
    >
      {children}
    </TimetableContext.Provider>
  );
};

export const useTimetable = (): TimetableContextType => {
  const context = useContext(TimetableContext);
  if (!context) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
};
