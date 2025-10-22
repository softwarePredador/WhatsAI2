/**
 * Configurações do usuário - Types e Defaults
 */

export interface UserSettings {
  notifications: {
    email: boolean;
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
    compactMode: boolean;
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    email: true,
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
    compactMode: false,
  },
};

export const STORAGE_KEY = 'whatsai_settings';
