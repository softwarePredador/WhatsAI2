import { UserSettingsRepository } from '../database/repositories/user-settings-repository';
import { CreateUserSettingsRequest, UpdateUserSettingsRequest, UserSettings } from '../types';

export class UserSettingsService {
  constructor(private userSettingsRepository: UserSettingsRepository) {}

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      let settings = await this.userSettingsRepository.findByUserId(userId);
      
      // If user doesn't have settings yet, create default ones
      if (!settings) {
        const defaultSettings = await this.userSettingsRepository.getDefaultSettings();
        settings = await this.userSettingsRepository.create(userId, defaultSettings);
      }

      return settings;
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw new Error('Failed to get user settings');
    }
  }

  async createUserSettings(userId: string, data: CreateUserSettingsRequest): Promise<UserSettings> {
    try {
      // Check if settings already exist
      const existingSettings = await this.userSettingsRepository.findByUserId(userId);
      if (existingSettings) {
        throw new Error('User settings already exist. Use update instead.');
      }

      return await this.userSettingsRepository.create(userId, data);
    } catch (error) {
      console.error('Error creating user settings:', error);
      throw error;
    }
  }

  async updateUserSettings(userId: string, data: UpdateUserSettingsRequest): Promise<UserSettings> {
    try {
      // Validate auto-refresh interval
      if (data.autoRefreshInterval && (data.autoRefreshInterval < 5 || data.autoRefreshInterval > 300)) {
        throw new Error('Auto-refresh interval must be between 5 and 300 seconds');
      }

      // Validate theme
      if (data.theme && !['light', 'dark', 'auto'].includes(data.theme)) {
        throw new Error('Invalid theme. Must be one of: light, dark, auto');
      }

      // Validate notification frequency
      if (data.notificationFrequency && !['immediate', 'hourly', 'daily'].includes(data.notificationFrequency)) {
        throw new Error('Invalid notification frequency. Must be one of: immediate, hourly, daily');
      }

      return await this.userSettingsRepository.update(userId, data);
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  async deleteUserSettings(userId: string): Promise<void> {
    try {
      const existingSettings = await this.userSettingsRepository.findByUserId(userId);
      if (!existingSettings) {
        throw new Error('User settings not found');
      }

      await this.userSettingsRepository.delete(userId);
    } catch (error) {
      console.error('Error deleting user settings:', error);
      throw error;
    }
  }

  async resetToDefaults(userId: string): Promise<UserSettings> {
    try {
      const defaultSettings = await this.userSettingsRepository.getDefaultSettings();
      return await this.userSettingsRepository.update(userId, defaultSettings);
    } catch (error) {
      console.error('Error resetting user settings to defaults:', error);
      throw error;
    }
  }

  // Helper method to get theme for user (with fallback)
  async getUserTheme(userId: string): Promise<string> {
    try {
      const settings = await this.getUserSettings(userId);
      return settings?.theme || 'light';
    } catch (error) {
      console.error('Error getting user theme:', error);
      return 'light'; // Default fallback
    }
  }

  // Helper method to get auto-refresh settings for user
  async getAutoRefreshSettings(userId: string): Promise<{ enabled: boolean; interval: number }> {
    try {
      const settings = await this.getUserSettings(userId);
      return {
        enabled: settings?.autoRefresh || true,
        interval: settings?.autoRefreshInterval || 30
      };
    } catch (error) {
      console.error('Error getting auto-refresh settings:', error);
      return { enabled: true, interval: 30 }; // Default fallback
    }
  }
}