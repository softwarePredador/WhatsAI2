/**
 * Configurações do usuário - Types e Defaults
 */

export interface UserSettings {
  notifications: {
    push: boolean;
    instanceStatus: boolean;
    qrCodeReady: boolean;
  };
  autoRefresh: {
    enabled: boolean;
    interval: number;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    push: true,
    instanceStatus: true,
    qrCodeReady: true,
  },
  autoRefresh: {
    enabled: true,
    interval: 5,
  },
  appearance: {
    theme: 'light',
  },
};

export const STORAGE_KEY = 'whatsai_settings';
