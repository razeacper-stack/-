import { SafeUser } from '../../types/auth';
import { AIMessage, AIConversationContext } from '../../types/ai';

export class AIContextService {
  private static instance: AIContextService;

  public static getInstance(): AIContextService {
    if (!AIContextService.instance) {
      AIContextService.instance = new AIContextService();
    }
    return AIContextService.instance;
  }

  private getStorageKey(userId: string): string {
    return `sms_ai_history_${userId}`;
  }

  /**
   * Builds the current context object for the active user session.
   */
  public getContext(
    actingUser: SafeUser,
    branchId: string,
    branchName: string,
    academicYearId?: string,
    academicYearName?: string,
    language: 'ar' | 'en' = 'ar',
    activeTab: string = 'ai_assistant'
  ): AIConversationContext {
    const history = this.getHistory(actingUser.id);
    return {
      userId: actingUser.id,
      userName: actingUser.fullName,
      userRole: actingUser.roleCode,
      currentBranchId: branchId,
      currentBranchName: branchName,
      academicYearId,
      academicYearName,
      language,
      activeTab,
      history,
    };
  }

  /**
   * Retrieves conversation history from localStorage.
   */
  public getHistory(userId: string): AIMessage[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(userId));
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Saves conversation history to localStorage.
   */
  public saveHistory(userId: string, messages: AIMessage[]): void {
    try {
      // Keep only last 50 messages to avoid local storage exhaustion
      const trimmed = messages.slice(-50);
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save AI chat history to localStorage', e);
    }
  }

  /**
   * Clears conversation history for the user.
   */
  public clearHistory(userId: string): void {
    try {
      localStorage.removeItem(this.getStorageKey(userId));
    } catch (e) {
      console.warn('Failed to clear AI chat history', e);
    }
  }

  /**
   * Adds a message to history and persists it.
   */
  public appendMessage(userId: string, message: AIMessage): AIMessage[] {
    const history = this.getHistory(userId);
    const updated = [...history, message];
    this.saveHistory(userId, updated);
    return updated;
  }

  /**
   * Updates an existing message (e.g. updating proposed action status).
   */
  public updateMessage(userId: string, messageId: string, updater: (msg: AIMessage) => AIMessage): AIMessage[] {
    const history = this.getHistory(userId);
    const updated = history.map((m) => (m.id === messageId ? updater(m) : m));
    this.saveHistory(userId, updated);
    return updated;
  }
}

export const aiContextService = AIContextService.getInstance();
