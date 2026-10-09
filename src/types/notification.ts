import { StandardPermissionKey } from './auth';

export type NotificationType =
  | 'SYSTEM'
  | 'SECURITY'
  | 'ATTENDANCE'
  | 'TIMETABLE'
  | 'FINANCE'
  | 'STUDENT'
  | 'TEACHER'
  | 'REPORT'
  | 'AI'
  | 'TASK'
  | 'GENERAL';

export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface AppNotification {
  id: string;
  userId?: string;
  targetRoles?: string[];
  branchId: string;
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  severity: NotificationSeverity;
  priority: NotificationPriority;
  createdAt: string;
  readAt?: string;
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionTab?: string;
  actionLabelAr?: string;
  actionLabelEn?: string;
  requiredPermission?: StandardPermissionKey;
  metadata?: Record<string, any>;
  dedupKey?: string;
}

export interface NotificationFilterParams {
  type?: NotificationType | 'ALL';
  severity?: NotificationSeverity | 'ALL';
  isRead?: boolean | 'ALL';
  branchId?: string;
  search?: string;
}

export interface NotificationPreferences {
  enabledTypes: Record<NotificationType, boolean>;
  allowCriticalAlways: boolean;
  emailDigest?: boolean;
}
