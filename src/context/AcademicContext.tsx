import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  AcademicYear,
  AcademicStage,
  Grade,
  ClassSection,
  Subject,
  GradeSubject,
  AcademicBranchStats,
} from '../types/academic';
import { academicStorage } from '../services/academicStorage';
import { useAuth } from './AuthContext';
import { useBranch } from './BranchContext';

export interface AcademicContextType {
  years: AcademicYear[];
  stages: AcademicStage[];
  grades: Grade[];
  classes: ClassSection[];
  subjects: Subject[];
  gradeSubjects: GradeSubject[];
  overviewStats: AcademicBranchStats | null;
  isLoading: boolean;
  refreshAll: () => void;

  // Years
  createYear: (data: Parameters<typeof academicStorage.createAcademicYear>[1]) => Promise<AcademicYear>;
  updateYear: (yearId: string, updates: Parameters<typeof academicStorage.updateAcademicYear>[2]) => Promise<AcademicYear>;
  setCurrentYear: (yearId: string) => Promise<AcademicYear>;
  deleteYear: (yearId: string) => Promise<void>;

  // Stages
  createStage: (data: Parameters<typeof academicStorage.createStage>[1]) => Promise<AcademicStage>;
  updateStage: (stageId: string, updates: Parameters<typeof academicStorage.updateStage>[2]) => Promise<AcademicStage>;
  toggleStage: (stageId: string) => Promise<AcademicStage>;
  deleteStage: (stageId: string) => Promise<void>;

  // Grades
  createGrade: (data: Parameters<typeof academicStorage.createGrade>[1]) => Promise<Grade>;
  updateGrade: (gradeId: string, updates: Parameters<typeof academicStorage.updateGrade>[2]) => Promise<Grade>;
  toggleGrade: (gradeId: string) => Promise<Grade>;
  deleteGrade: (gradeId: string) => Promise<void>;

  // Classes
  createClass: (data: Parameters<typeof academicStorage.createClass>[1]) => Promise<ClassSection>;
  updateClass: (classId: string, updates: Parameters<typeof academicStorage.updateClass>[2]) => Promise<ClassSection>;
  toggleClass: (classId: string) => Promise<ClassSection>;
  deleteClass: (classId: string) => Promise<void>;

  // Subjects
  createSubject: (data: Parameters<typeof academicStorage.createSubject>[1]) => Promise<Subject>;
  updateSubject: (subjectId: string, updates: Parameters<typeof academicStorage.updateSubject>[2]) => Promise<Subject>;
  toggleSubject: (subjectId: string) => Promise<Subject>;
  deleteSubject: (subjectId: string) => Promise<void>;

  // Grade Subjects
  assignSubject: (data: Parameters<typeof academicStorage.assignSubjectToGrade>[1]) => Promise<GradeSubject>;
  updateGradeSubject: (linkId: string, updates: Parameters<typeof academicStorage.updateGradeSubject>[2]) => Promise<GradeSubject>;
  removeGradeSubject: (linkId: string) => Promise<void>;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, hasPermission } = useAuth();
  const { activeBranchId } = useBranch();

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [stages, setStages] = useState<AcademicStage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeSubjects, setGradeSubjects] = useState<GradeSubject[]>([]);
  const [overviewStats, setOverviewStats] = useState<AcademicBranchStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAll = useCallback(() => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      academicStorage.initialize();

      const branchTarget = activeBranchId || 'all';

      // Load years
      if (hasPermission('academic_years.view')) {
        setYears(academicStorage.listAcademicYears(currentUser, branchTarget));
      } else {
        setYears([]);
      }

      // Load stages
      if (hasPermission('academic_stages.view')) {
        setStages(academicStorage.listStages(currentUser, branchTarget));
      } else {
        setStages([]);
      }

      // Load grades
      if (hasPermission('grades.view')) {
        setGrades(academicStorage.listGrades(currentUser, branchTarget));
      } else {
        setGrades([]);
      }

      // Load classes
      if (hasPermission('classes.view')) {
        setClasses(academicStorage.listClasses(currentUser, { branchId: branchTarget }));
      } else {
        setClasses([]);
      }

      // Load subjects
      if (hasPermission('subjects.view')) {
        setSubjects(academicStorage.listSubjects(currentUser, branchTarget));
      } else {
        setSubjects([]);
      }

      // Load grade-subject links
      if (hasPermission('grade_subjects.view')) {
        setGradeSubjects(academicStorage.listGradeSubjects(currentUser, branchTarget));
      } else {
        setGradeSubjects([]);
      }

      // Stats
      if (hasPermission('academic_years.view')) {
        setOverviewStats(academicStorage.getAcademicOverviewStats(currentUser, branchTarget));
      } else {
        setOverviewStats(null);
      }
    } catch (e) {
      console.error('AcademicContext refresh error', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, activeBranchId, hasPermission]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Year Handlers
  const createYear = async (data: Parameters<typeof academicStorage.createAcademicYear>[1]) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.createAcademicYear(currentUser, data);
    refreshAll();
    return result;
  };

  const updateYear = async (yearId: string, updates: Parameters<typeof academicStorage.updateAcademicYear>[2]) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.updateAcademicYear(currentUser, yearId, updates);
    refreshAll();
    return result;
  };

  const setCurrentYear = async (yearId: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.setCurrentAcademicYear(currentUser, yearId);
    refreshAll();
    return result;
  };

  const deleteYear = async (yearId: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    academicStorage.deleteAcademicYear(currentUser, yearId);
    refreshAll();
  };

  // Stage Handlers
  const createStage = async (data: Parameters<typeof academicStorage.createStage>[1]) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.createStage(currentUser, data);
    refreshAll();
    return result;
  };

  const updateStage = async (stageId: string, updates: Parameters<typeof academicStorage.updateStage>[2]) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.updateStage(currentUser, stageId, updates);
    refreshAll();
    return result;
  };

  const toggleStage = async (stageId: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.toggleStageStatus(currentUser, stageId);
    refreshAll();
    return result;
  };

  const deleteStage = async (stageId: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    academicStorage.deleteStage(currentUser, stageId);
    refreshAll();
  };

  // Grade Handlers
  const createGrade = async (data: Parameters<typeof academicStorage.createGrade>[1]) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.createGrade(currentUser, data);
    refreshAll();
    return result;
  };

  const updateGrade = async (gradeId: string, updates: Parameters<typeof academicStorage.updateGrade>[2]) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.updateGrade(currentUser, gradeId, updates);
    refreshAll();
    return result;
  };

  const toggleGrade = async (gradeId: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.toggleGradeStatus(currentUser, gradeId);
    refreshAll();
    return result;
  };

  const deleteGrade = async (gradeId: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    academicStorage.deleteGrade(currentUser, gradeId);
    refreshAll();
  };

  // Class Handlers
  const createClass = async (data: Parameters<typeof academicStorage.createClass>[1]) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.createClass(currentUser, data);
    refreshAll();
    return result;
  };

  const updateClass = async (classId: string, updates: Parameters<typeof academicStorage.updateClass>[2]) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.updateClass(currentUser, classId, updates);
    refreshAll();
    return result;
  };

  const toggleClass = async (classId: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.toggleClassStatus(currentUser, classId);
    refreshAll();
    return result;
  };

  const deleteClass = async (classId: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    academicStorage.deleteClass(currentUser, classId);
    refreshAll();
  };

  // Subject Handlers
  const createSubject = async (data: Parameters<typeof academicStorage.createSubject>[1]) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.createSubject(currentUser, data);
    refreshAll();
    return result;
  };

  const updateSubject = async (subjectId: string, updates: Parameters<typeof academicStorage.updateSubject>[2]) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.updateSubject(currentUser, subjectId, updates);
    refreshAll();
    return result;
  };

  const toggleSubject = async (subjectId: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.toggleSubjectStatus(currentUser, subjectId);
    refreshAll();
    return result;
  };

  const deleteSubject = async (subjectId: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    academicStorage.deleteSubject(currentUser, subjectId);
    refreshAll();
  };

  // Grade-Subject Handlers
  const assignSubject = async (data: Parameters<typeof academicStorage.assignSubjectToGrade>[1]) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.assignSubjectToGrade(currentUser, data);
    refreshAll();
    return result;
  };

  const updateGradeSubject = async (
    linkId: string,
    updates: Parameters<typeof academicStorage.updateGradeSubject>[2]
  ) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = academicStorage.updateGradeSubject(currentUser, linkId, updates);
    refreshAll();
    return result;
  };

  const removeGradeSubject = async (linkId: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    academicStorage.removeGradeSubject(currentUser, linkId);
    refreshAll();
  };

  const value = useMemo(
    () => ({
      years,
      stages,
      grades,
      classes,
      subjects,
      gradeSubjects,
      overviewStats,
      isLoading,
      refreshAll,
      createYear,
      updateYear,
      setCurrentYear,
      deleteYear,
      createStage,
      updateStage,
      toggleStage,
      deleteStage,
      createGrade,
      updateGrade,
      toggleGrade,
      deleteGrade,
      createClass,
      updateClass,
      toggleClass,
      deleteClass,
      createSubject,
      updateSubject,
      toggleSubject,
      deleteSubject,
      assignSubject,
      updateGradeSubject,
      removeGradeSubject,
    }),
    [
      years,
      stages,
      grades,
      classes,
      subjects,
      gradeSubjects,
      overviewStats,
      isLoading,
      refreshAll,
    ]
  );

  return <AcademicContext.Provider value={value}>{children}</AcademicContext.Provider>;
};

export const useAcademic = (): AcademicContextType => {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};
