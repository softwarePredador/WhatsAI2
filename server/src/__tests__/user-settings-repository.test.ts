import { UserSettingsRepository } from '../database/repositories/user-settings-repository';
import { CreateUserSettingsRequest, UpdateUserSettingsRequest } from '../types';

jest.mock('../database/prisma', () => ({
  prisma: {
    userSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  }
}));

const mockPrisma = jest.mocked(require('../database/prisma').prisma);

describe('UserSettingsRepository', () => {
  let repository: UserSettingsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new UserSettingsRepository(mockPrisma);
  });

  describe('findByUserId', () => {
    it('should return user settings when found', async () => {
      const mockDbSettings = {
        id: '1',
        userId: 'user-1',
        displayName: 'John Doe',
        profilePicture: 'http://example.com/avatar.jpg',
        bio: 'Software Developer',
        theme: 'dark',
        language: 'en-US',
        emailNotifications: true,
        pushNotifications: false,
        soundNotifications: true,
        notificationFrequency: 'immediate',
        autoRefresh: true,
        autoRefreshInterval: 30,
        showOnlineStatus: true,
        allowDataCollection: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.userSettings.findUnique.mockResolvedValue(mockDbSettings);

      const result = await repository.findByUserId('user-1');

      expect(result).toEqual({
        id: '1',
        userId: 'user-1',
        displayName: 'John Doe',
        profilePicture: 'http://example.com/avatar.jpg',
        bio: 'Software Developer',
        theme: 'dark',
        language: 'en-US',
        emailNotifications: true,
        pushNotifications: false,
        soundNotifications: true,
        notificationFrequency: 'immediate',
        autoRefresh: true,
        autoRefreshInterval: 30,
        showOnlineStatus: true,
        allowDataCollection: false,
        createdAt: mockDbSettings.createdAt,
        updatedAt: mockDbSettings.updatedAt
      });
      expect(mockPrisma.userSettings.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' }
      });
    });

    it('should return null when user settings not found', async () => {
      mockPrisma.userSettings.findUnique.mockResolvedValue(null);

      const result = await repository.findByUserId('user-999');

      expect(result).toBeNull();
      expect(mockPrisma.userSettings.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-999' }
      });
    });

    it('should handle null optional fields correctly', async () => {
      const mockDbSettings = {
        id: '1',
        userId: 'user-1',
        displayName: null,
        profilePicture: null,
        bio: null,
        theme: 'light',
        language: 'pt-BR',
        emailNotifications: true,
        pushNotifications: true,
        soundNotifications: true,
        notificationFrequency: 'immediate',
        autoRefresh: true,
        autoRefreshInterval: 30,
        showOnlineStatus: true,
        allowDataCollection: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.userSettings.findUnique.mockResolvedValue(mockDbSettings);

      const result = await repository.findByUserId('user-1');

      expect(result).toEqual({
        id: '1',
        userId: 'user-1',
        displayName: undefined,
        profilePicture: undefined,
        bio: undefined,
        theme: 'light',
        language: 'pt-BR',
        emailNotifications: true,
        pushNotifications: true,
        soundNotifications: true,
        notificationFrequency: 'immediate',
        autoRefresh: true,
        autoRefreshInterval: 30,
        showOnlineStatus: true,
        allowDataCollection: false,
        createdAt: mockDbSettings.createdAt,
        updatedAt: mockDbSettings.updatedAt
      });
    });
  });

  describe('create', () => {
    it('should create user settings with all fields', async () => {
      const createData: CreateUserSettingsRequest = {
        displayName: 'Jane Smith',
        profilePicture: 'http://example.com/avatar2.jpg',
        bio: 'Product Manager',
        theme: 'auto',
        language: 'es-ES',
        emailNotifications: false,
        pushNotifications: true,
        soundNotifications: false,
        notificationFrequency: 'daily',
        autoRefresh: false,
        autoRefreshInterval: 60,
        showOnlineStatus: false,
        allowDataCollection: true
      };

      const mockCreatedSettings = {
        id: '2',
        userId: 'user-2',
        displayName: 'Jane Smith',
        profilePicture: 'http://example.com/avatar2.jpg',
        bio: 'Product Manager',
        theme: 'auto',
        language: 'es-ES',
        emailNotifications: false,
        pushNotifications: true,
        soundNotifications: false,
        notificationFrequency: 'daily',
        autoRefresh: false,
        autoRefreshInterval: 60,
        showOnlineStatus: false,
        allowDataCollection: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.userSettings.create.mockResolvedValue(mockCreatedSettings);

      const result = await repository.create('user-2', createData);

      expect(result).toEqual({
        id: '2',
        userId: 'user-2',
        displayName: 'Jane Smith',
        profilePicture: 'http://example.com/avatar2.jpg',
        bio: 'Product Manager',
        theme: 'auto',
        language: 'es-ES',
        emailNotifications: false,
        pushNotifications: true,
        soundNotifications: false,
        notificationFrequency: 'daily',
        autoRefresh: false,
        autoRefreshInterval: 60,
        showOnlineStatus: false,
        allowDataCollection: true,
        createdAt: mockCreatedSettings.createdAt,
        updatedAt: mockCreatedSettings.updatedAt
      });
      expect(mockPrisma.userSettings.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-2',
          displayName: 'Jane Smith',
          profilePicture: 'http://example.com/avatar2.jpg',
          bio: 'Product Manager',
          theme: 'auto',
          language: 'es-ES',
          emailNotifications: false,
          pushNotifications: true,
          soundNotifications: false,
          notificationFrequency: 'daily',
          autoRefresh: false,
          autoRefreshInterval: 60,
          showOnlineStatus: false,
          allowDataCollection: true
        }
      });
    });

    it('should create user settings with defaults when fields are undefined', async () => {
      const createData: CreateUserSettingsRequest = {};

      const mockCreatedSettings = {
        id: '3',
        userId: 'user-3',
        displayName: null,
        profilePicture: null,
        bio: null,
        theme: 'light',
        language: 'pt-BR',
        emailNotifications: true,
        pushNotifications: true,
        soundNotifications: true,
        notificationFrequency: 'immediate',
        autoRefresh: true,
        autoRefreshInterval: 30,
        showOnlineStatus: true,
        allowDataCollection: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.userSettings.create.mockResolvedValue(mockCreatedSettings);

      const result = await repository.create('user-3', createData);

      expect(result).toEqual({
        id: '3',
        userId: 'user-3',
        displayName: undefined,
        profilePicture: undefined,
        bio: undefined,
        theme: 'light',
        language: 'pt-BR',
        emailNotifications: true,
        pushNotifications: true,
        soundNotifications: true,
        notificationFrequency: 'immediate',
        autoRefresh: true,
        autoRefreshInterval: 30,
        showOnlineStatus: true,
        allowDataCollection: false,
        createdAt: mockCreatedSettings.createdAt,
        updatedAt: mockCreatedSettings.updatedAt
      });
      expect(mockPrisma.userSettings.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-3',
          theme: 'light',
          language: 'pt-BR',
          emailNotifications: true,
          pushNotifications: true,
          soundNotifications: true,
          notificationFrequency: 'immediate',
          autoRefresh: true,
          autoRefreshInterval: 30,
          showOnlineStatus: true,
          allowDataCollection: false
        }
      });
    });
  });

  describe('update', () => {
    it('should update existing user settings', async () => {
      const updateData: UpdateUserSettingsRequest = {
        theme: 'dark',
        emailNotifications: false,
        autoRefreshInterval: 45
      };

      const mockUpdatedSettings = {
        id: '1',
        userId: 'user-1',
        displayName: 'John Doe',
        profilePicture: 'http://example.com/avatar.jpg',
        bio: 'Software Developer',
        theme: 'dark',
        language: 'en-US',
        emailNotifications: false,
        pushNotifications: true,
        soundNotifications: true,
        notificationFrequency: 'immediate',
        autoRefresh: true,
        autoRefreshInterval: 45,
        showOnlineStatus: true,
        allowDataCollection: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.userSettings.upsert.mockResolvedValue(mockUpdatedSettings);

      const result = await repository.update('user-1', updateData);

      expect(result).toEqual({
        id: '1',
        userId: 'user-1',
        displayName: 'John Doe',
        profilePicture: 'http://example.com/avatar.jpg',
        bio: 'Software Developer',
        theme: 'dark',
        language: 'en-US',
        emailNotifications: false,
        pushNotifications: true,
        soundNotifications: true,
        notificationFrequency: 'immediate',
        autoRefresh: true,
        autoRefreshInterval: 45,
        showOnlineStatus: true,
        allowDataCollection: false,
        createdAt: mockUpdatedSettings.createdAt,
        updatedAt: mockUpdatedSettings.updatedAt
      });
      expect(mockPrisma.userSettings.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: {
          theme: 'dark',
          emailNotifications: false,
          autoRefreshInterval: 45
        },
        create: {
          userId: 'user-1',
          theme: 'dark',
          language: 'pt-BR',
          emailNotifications: false,
          pushNotifications: true,
          soundNotifications: true,
          notificationFrequency: 'immediate',
          autoRefresh: true,
          autoRefreshInterval: 45,
          showOnlineStatus: true,
          allowDataCollection: false
        }
      });
    });

    it('should create settings if they do not exist', async () => {
      const updateData: UpdateUserSettingsRequest = {
        displayName: 'New User',
        theme: 'auto'
      };

      const mockCreatedSettings = {
        id: '4',
        userId: 'user-4',
        displayName: 'New User',
        profilePicture: null,
        bio: null,
        theme: 'auto',
        language: 'pt-BR',
        emailNotifications: true,
        pushNotifications: true,
        soundNotifications: true,
        notificationFrequency: 'immediate',
        autoRefresh: true,
        autoRefreshInterval: 30,
        showOnlineStatus: true,
        allowDataCollection: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.userSettings.upsert.mockResolvedValue(mockCreatedSettings);

      const result = await repository.update('user-4', updateData);

      expect(result).toEqual({
        id: '4',
        userId: 'user-4',
        displayName: 'New User',
        profilePicture: undefined,
        bio: undefined,
        theme: 'auto',
        language: 'pt-BR',
        emailNotifications: true,
        pushNotifications: true,
        soundNotifications: true,
        notificationFrequency: 'immediate',
        autoRefresh: true,
        autoRefreshInterval: 30,
        showOnlineStatus: true,
        allowDataCollection: false,
        createdAt: mockCreatedSettings.createdAt,
        updatedAt: mockCreatedSettings.updatedAt
      });
      expect(mockPrisma.userSettings.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-4' },
        update: {
          displayName: 'New User',
          theme: 'auto'
        },
        create: {
          userId: 'user-4',
          displayName: 'New User',
          theme: 'auto',
          language: 'pt-BR',
          emailNotifications: true,
          pushNotifications: true,
          soundNotifications: true,
          notificationFrequency: 'immediate',
          autoRefresh: true,
          autoRefreshInterval: 30,
          showOnlineStatus: true,
          allowDataCollection: false
        }
      });
    });
  });

  describe('delete', () => {
    it('should delete user settings', async () => {
      mockPrisma.userSettings.delete.mockResolvedValue({
        id: '1',
        userId: 'user-1',
        displayName: 'John Doe',
        profilePicture: 'http://example.com/avatar.jpg',
        bio: 'Software Developer',
        theme: 'dark',
        language: 'en-US',
        emailNotifications: true,
        pushNotifications: false,
        soundNotifications: true,
        notificationFrequency: 'immediate',
        autoRefresh: true,
        autoRefreshInterval: 30,
        showOnlineStatus: true,
        allowDataCollection: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await repository.delete('user-1');

      expect(mockPrisma.userSettings.delete).toHaveBeenCalledWith({
        where: { userId: 'user-1' }
      });
    });
  });

  describe('getDefaultSettings', () => {
    it('should return default settings', async () => {
      const result = await repository.getDefaultSettings();

      expect(result).toEqual({
        theme: 'light',
        language: 'pt-BR',
        emailNotifications: true,
        pushNotifications: true,
        soundNotifications: true,
        notificationFrequency: 'immediate',
        autoRefresh: true,
        autoRefreshInterval: 30,
        showOnlineStatus: true,
        allowDataCollection: false
      });
    });
  });
});