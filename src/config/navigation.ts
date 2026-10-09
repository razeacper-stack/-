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
  Search,
  Bell,
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
        status: 'active',
      },
    ],
  },
  {
    id: 'intelligence',
    labelKey: 'nav.group.intelligence',
    items: [
      {
        id: 'search',
        labelKey: 'nav.search',
        icon: Search,
        phase: 11,
        status: 'active',
      },
      {
        id: 'reports',
        labelKey: 'nav.reports',
        icon: FileBarChart2,
        phase: 11,
        status: 'active',
        badge: '32 تقرير',
      },
      {
        id: 'ai_assistant',
        labelKey: 'nav.ai_assistant',
        icon: Bot,
        phase: 12,
        status: 'active',
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
        id: 'notifications',
        labelKey: 'nav.notifications',
        icon: Bell,
        phase: 13,
        status: 'active',
        badge: 'الإشعارات',
      },
      {
        id: 'audit_logs',
        labelKey: 'nav.audit_logs',
        icon: History,
        phase: 13,
        status: 'active',
        badge: 'مركز النشاط',
      },
      {
        id: 'settings',
        labelKey: 'nav.settings',
        icon: Settings,
        phase: 14,
        status: 'active',
      },
    ],
  },
];
