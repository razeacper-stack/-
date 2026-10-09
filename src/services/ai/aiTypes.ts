export * from '../../types/ai';

import {
  AIProviderType,
  AIProviderRequest,
  AIProviderResponse,
  AIToolCall,
  AIToolDefinition,
  AIDataCard,
  AIProposedAction,
} from '../../types/ai';

export interface AIToolResult {
  toolName: string;
  callId: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTimeMs?: number;
}

export type AIRequest = AIProviderRequest;
export type AIResponse = AIProviderResponse;

export interface AIProvider {
  id: AIProviderType;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  isAvailable: () => boolean;
  generateResponse: (request: AIRequest) => Promise<AIResponse>;
}
