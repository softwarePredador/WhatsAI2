import { PrismaClient } from '@prisma/client';
import { CreateUserSettingsRequest, UpdateUserSettingsRequest, UserSettings } from '../../types';

export class UserSettingsRepository {
  constructor(private prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<UserSettings | null> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId }
    });

    if (!settings) return null;

    return {
      id: settings.id,
      userId: settings.userId,
      displayName: settings.displayName ?? undefined,
      profilePicture: settings.profilePicture ?? undefined,
      bio: settings.bio ?? undefined,
      theme: settings.theme as 'light' | 'dark' | 'auto',
      language: settings.language,
      emailNotifications: settings.emailNotifications,
      pushNotifications: settings.pushNotifications,
      soundNotifications: settings.soundNotifications,
      notificationFrequency: settings.notificationFrequency as 'immediate' | 'hourly' | 'daily',
      autoRefresh: settings.autoRefresh,
      autoRefreshInterval: settings.autoRefreshInterval,
      showOnlineStatus: settings.showOnlineStatus,
      allowDataCollection: settings.allowDataCollection,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };
  }

  async create(userId: string, data: CreateUserSettingsRequest): Promise<UserSettings> {
    const createData: any = {
      userId,
      theme: data.theme || 'light',
      language: data.language || 'pt-BR',
      emailNotifications: data.emailNotifications ?? true,
      pushNotifications: data.pushNotifications ?? true,
      soundNotifications: data.soundNotifications ?? true,
      notificationFrequency: data.notificationFrequency || 'immediate',
      autoRefresh: data.autoRefresh ?? true,
      autoRefreshInterval: data.autoRefreshInterval || 30,
      showOnlineStatus: data.showOnlineStatus ?? true,
      allowDataCollection: data.allowDataCollection ?? false
    };

    if (data.displayName !== undefined) createData.displayName = data.displayName;
    if (data.profilePicture !== undefined) createData.profilePicture = data.profilePicture;
    if (data.bio !== undefined) createData.bio = data.bio;

    const settings = await this.prisma.userSettings.create({
      data: createData
    });

    return {
      id: settings.id,
      userId: settings.userId,
      displayName: settings.displayName ?? undefined,
      profilePicture: settings.profilePicture ?? undefined,
      bio: settings.bio ?? undefined,
      theme: settings.theme as 'light' | 'dark' | 'auto',
      language: settings.language,
      emailNotifications: settings.emailNotifications,
      pushNotifications: settings.pushNotifications,
      soundNotifications: settings.soundNotifications,
      notificationFrequency: settings.notificationFrequency as 'immediate' | 'hourly' | 'daily',
      autoRefresh: settings.autoRefresh,
      autoRefreshInterval: settings.autoRefreshInterval,
      showOnlineStatus: settings.showOnlineStatus,
      allowDataCollection: settings.allowDataCollection,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };
  }

  async update(userId: string, data: UpdateUserSettingsRequest): Promise<UserSettings> {
    const updateData: any = {};
    
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.profilePicture !== undefined) updateData.profilePicture = data.profilePicture;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.emailNotifications !== undefined) updateData.emailNotifications = data.emailNotifications;
    if (data.pushNotifications !== undefined) updateData.pushNotifications = data.pushNotifications;
    if (data.soundNotifications !== undefined) updateData.soundNotifications = data.soundNotifications;
    if (data.notificationFrequency !== undefined) updateData.notificationFrequency = data.notificationFrequency;
    if (data.autoRefresh !== undefined) updateData.autoRefresh = data.autoRefresh;
    if (data.autoRefreshInterval !== undefined) updateData.autoRefreshInterval = data.autoRefreshInterval;
    if (data.showOnlineStatus !== undefined) updateData.showOnlineStatus = data.showOnlineStatus;
    if (data.allowDataCollection !== undefined) updateData.allowDataCollection = data.allowDataCollection;

    const createData: any = {
      userId,
      theme: data.theme || 'light',
      language: data.language || 'pt-BR',
      emailNotifications: data.emailNotifications ?? true,
      pushNotifications: data.pushNotifications ?? true,
      soundNotifications: data.soundNotifications ?? true,
      notificationFrequency: data.notificationFrequency || 'immediate',
      autoRefresh: data.autoRefresh ?? true,
      autoRefreshInterval: data.autoRefreshInterval || 30,
      showOnlineStatus: data.showOnlineStatus ?? true,
      allowDataCollection: data.allowDataCollection ?? false
    };

    if (data.displayName !== undefined) createData.displayName = data.displayName;
    if (data.profilePicture !== undefined) createData.profilePicture = data.profilePicture;
    if (data.bio !== undefined) createData.bio = data.bio;

    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      update: updateData,
      create: createData
    });

    return {
      id: settings.id,
      userId: settings.userId,
      displayName: settings.displayName ?? undefined,
      profilePicture: settings.profilePicture ?? undefined,
      bio: settings.bio ?? undefined,
      theme: settings.theme as 'light' | 'dark' | 'auto',
      language: settings.language,
      emailNotifications: settings.emailNotifications,
      pushNotifications: settings.pushNotifications,
      soundNotifications: settings.soundNotifications,
      notificationFrequency: settings.notificationFrequency as 'immediate' | 'hourly' | 'daily',
      autoRefresh: settings.autoRefresh,
      autoRefreshInterval: settings.autoRefreshInterval,
      showOnlineStatus: settings.showOnlineStatus,
      allowDataCollection: settings.allowDataCollection,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.userSettings.delete({
      where: { userId }
    });
  }

  async getDefaultSettings(): Promise<Partial<CreateUserSettingsRequest>> {
    return {
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
    };
  }
}