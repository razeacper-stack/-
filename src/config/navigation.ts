import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  UserCheck,
  CalendarDays,
  Clock,
  ClipboardCheck,
  CreditCard,
  FileBarChart2,
  ShieldAlert,
  Bot,
  Settings,
  History,
  BookOpen,
  Calendar,
  Layers,
  School,
} from 'lucide-react';
import React from 'react';

export interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  phase: number;
  badge?: string;
  status: 'active' | 'upcoming';
}

export interface NavGroup {
  id: string;
  labelKey: string;
  items: NavItem[];
}

export const NAVIGATION_CONFIG: NavGroup[] = [
  {
    id: 'main',
    labelKey: 'nav.group.main',
    items: [
      {
        id: 'dashboard',
        labelKey: 'nav.dashboard',
        icon: LayoutDashboard,
        phase: 1,
        status: 'active',
      },
    ],
  },
  {
    id: 'academic',
    labelKey: 'nav.group.academic',
    items: [
      {
        id: 'branches',
        labelKey: 'nav.branches',
        icon: Building2,
        phase: 3,
        status: 'active',
        badge: '5 فروع',
      },
      {
        id: 'academic_years',
        labelKey: 'nav.academic_years',
        icon: Calendar,
        phase: 4,
        status: 'active',
      },
      {
        id: 'stages',
        labelKey: 'nav.stages',
        icon: Layers,
        phase: 4,
        status: 'active',
      },
      {
        id: 'classes',
        labelKey: 'nav.classes',
        icon: School,
        phase: 4,
        status: 'active',
      },
      {
        id: 'subjects',
        labelKey: 'nav.subjects',
        icon: BookOpen,
        phase: 4,
        status: 'active',
      },
    ],
  },
  {
    id: 'personnel',
    labelKey: 'nav.group.personnel',
    items: [
      {
        id: 'students',
        labelKey: 'nav.students',
        icon: Users,
        phase: 5,
        status: 'active',
      },
      {
        id: 'teachers',
        labelKey: 'nav.teachers',
        icon: UserCheck,
        phase: 6,
        status: 'active',
      },
    ],
  },
  {
    id: 'operations',
    labelKey: 'nav.group.operations',
    items: [
      {
        id: 'timetable',
        labelKey: 'nav.timetable',
        icon: CalendarDays,
        phase: 7,
        status: 'active',
      },
      {
        id: 'attendance',
        labelKey: 'nav.attendance',
        icon: ClipboardCheck,
        phase: 8,
        status: 'active',
      },
    ],
  },
  {
    id: 'finance',
    labelKey: 'nav.group.finance',
    items: [
      {
        id: 'fees',
        labelKey: 'nav.fees',
        icon: CreditCard,
        phase: 9,
        status: 'upcoming',
      },
    ],
  },
  {
    id: 'intelligence',
    labelKey: 'nav.group.intelligence',
    items: [
      {
        id: 'reports',
        labelKey: 'nav.reports',
        icon: FileBarChart2,
        phase: 11,
        status: 'upcoming',
      },
      {
        id: 'ai_assistant',
        labelKey: 'nav.ai_assistant',
        icon: Bot,
        phase: 12,
        status: 'upcoming',
        badge: 'AI',
      },
    ],
  },
  {
    id: 'administration',
    labelKey: 'nav.group.administration',
    items: [
      {
        id: 'users',
        labelKey: 'nav.users',
        icon: Users,
        phase: 2,
        status: 'active',
      },
      {
        id: 'roles',
        labelKey: 'nav.roles',
        icon: ShieldAlert,
        phase: 2,
        status: 'active',
      },
      {
        id: 'audit_logs',
        labelKey: 'nav.audit_logs',
        icon: History,
        phase: 2,
        status: 'active',
      },
      {
        id: 'settings',
        labelKey: 'nav.settings',
        icon: Settings,
        phase: 14,
        status: 'upcoming',
      },
    ],
  },
];
