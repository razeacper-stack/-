/**
 * School Management System — Production Configuration & Desktop Runtime
 * Phase 15 Final Production & Packaging Configuration
 */

export interface AppProductionConfig {
  name: string;
  shortName: string;
  version: string;
  identifier: string;
  targetPlatform: 'windows' | 'web';
  schemaVersion: number;
  environment: 'production' | 'development' | 'test';
  aiProviderMode: 'builtin' | 'gemini_proxy';
  cspEnforced: boolean;
  minWindowDimensions: { width: number; height: number };
  defaultWindowDimensions: { width: number; height: number };
}

export const PRODUCTION_CONFIG: AppProductionConfig = {
  name: 'School Management System — نظام إدارة المدارس',
  shortName: 'SMS App',
  version: '1.0.0',
  identifier: 'com.schoolms.app',
  targetPlatform: 'windows',
  schemaVersion: 1,
  environment: (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') ? 'production' : 'production',
  aiProviderMode: 'builtin', // Default safe, zero-secret offline local AI engine
  cspEnforced: true,
  minWindowDimensions: { width: 1024, height: 680 },
  defaultWindowDimensions: { width: 1280, height: 800 },
};

/**
 * Checks if the current execution context is within the native Tauri desktop webview.
 */
export function isTauriDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__);
}

/**
 * Validates that production local storage maintains current schema integrity.
 */
export function verifyStorageSchemaVersion(): { current: number; compatible: boolean } {
  if (typeof localStorage === 'undefined') {
    return { current: PRODUCTION_CONFIG.schemaVersion, compatible: true };
  }
  const storedVerStr = localStorage.getItem('sms_schema_version');
  if (!storedVerStr) {
    localStorage.setItem('sms_schema_version', String(PRODUCTION_CONFIG.schemaVersion));
    return { current: PRODUCTION_CONFIG.schemaVersion, compatible: true };
  }
  const storedVer = parseInt(storedVerStr, 10);
  return {
    current: storedVer,
    compatible: storedVer === PRODUCTION_CONFIG.schemaVersion,
  };
}
