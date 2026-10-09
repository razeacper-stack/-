import { SafeUser, StandardPermissionKey } from './auth';

export type AIProviderType = 'builtin' | 'gemini' | 'openai' | 'custom';

export type AIMessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface AIDataCardItem {
  label: string;
  value: string | number;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
  badge?: string;
}

export interface AIDataCardColumn {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
}

export interface AIDataCard {
  type: 'metric' | 'table' | 'list' | 'kpi_grid';
  title: string;
  subtitle?: string;
  items?: AIDataCardItem[];
  columns?: AIDataCardColumn[];
  rows?: Record<string, any>[];
  footnote?: string;
}

export interface AIToolCall {
  id: string;
  toolName: string;
  arguments: Record<string, any>;
  status: 'pending' | 'completed' | 'failed' | 'denied';
  result?: any;
  error?: string;
}

export interface AIProposedAction {
  actionId: string;
  type: 'update_student_status' | 'update_teacher_status' | 'toggle_class_status';
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  entityName: string;
  changes: Array<{
    field: string;
    label: string;
    from: any;
    to: any;
  }>;
  requiredPermission: StandardPermissionKey;
  status: 'pending' | 'confirmed' | 'cancelled' | 'executed' | 'rejected';
  requiresConfirmation: true;
  payload: Record<string, any>;
}

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  timestamp: string;
  toolCalls?: AIToolCall[];
  dataCard?: AIDataCard;
  proposedAction?: AIProposedAction;
  source?: string;
  scope?: {
    branchName?: string;
    academicYear?: string;
    date?: string;
  };
  error?: boolean;
}

export interface AIToolDefinition {
  name: string;
  descriptionAr: string;
  descriptionEn: string;
  requiredPermission: StandardPermissionKey | null;
  requiresFinance?: boolean;
  parameters: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
      }
    >;
    required?: string[];
  };
  execute: (actingUser: SafeUser, branchId: string, args: any) => Promise<any> | any;
}

export interface AIConversationContext {
  userId: string;
  userName: string;
  userRole: string;
  currentBranchId: string;
  currentBranchName?: string;
  academicYearId?: string;
  academicYearName?: string;
  language: 'ar' | 'en';
  activeTab?: string;
  history: AIMessage[];
}

export interface AIProviderRequest {
  query: string;
  actingUser: SafeUser;
  branchId: string;
  academicYearId?: string;
  language: 'ar' | 'en';
  context: AIConversationContext;
  availableTools: AIToolDefinition[];
}

export interface AIProviderResponse {
  content: string;
  toolCalls?: AIToolCall[];
  dataCard?: AIDataCard;
  proposedAction?: AIProposedAction;
  source?: string;
  scope?: {
    branchName?: string;
    academicYear?: string;
    date?: string;
  };
  error?: boolean;
}

export interface AIQuickAction {
  id: string;
  icon: string;
  labelAr: string;
  labelEn: string;
  promptAr: string;
  promptEn: string;
  requiredPermission?: StandardPermissionKey;
  requiresFinance?: boolean;
}
