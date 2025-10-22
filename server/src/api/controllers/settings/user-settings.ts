import { Request, Response } from 'express';
import { z } from 'zod';
import { UserSettingsService } from '../../../services/user-settings-service';
import { UserSettingsRepository } from '../../../database/repositories/user-settings-repository';
import { prisma } from '../../../database/prisma';

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: string;
    }
  }
}

// Validation schemas
const createUserSettingsSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  profilePicture: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.string().min(2).max(5).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  soundNotifications: z.boolean().optional(),
  notificationFrequency: z.enum(['immediate', 'hourly', 'daily']).optional(),
  autoRefresh: z.boolean().optional(),
  autoRefreshInterval: z.number().min(5).max(300).optional(),
  showOnlineStatus: z.boolean().optional(),
  allowDataCollection: z.boolean().optional()
});

const updateUserSettingsSchema = createUserSettingsSchema.partial();

// Initialize service
const userSettingsRepository = new UserSettingsRepository(prisma);
const userSettingsService = new UserSettingsService(userSettingsRepository);

export async function getUserSettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        message: 'User ID not found in request'
      });
      return;
    }

    const settings = await userSettingsService.getUserSettings(userId);

    res.json({
      success: true,
      data: { settings },
      message: 'User settings retrieved successfully'
    });
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user settings',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

export async function createUserSettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        message: 'User ID not found in request'
      });
      return;
    }
    
    // Validate request body
    const validationResult = createUserSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const settings = await userSettingsService.createUserSettings(userId, validationResult.data);

    res.status(201).json({
      success: true,
      data: { settings },
      message: 'User settings created successfully'
    });
  } catch (error) {
    console.error('Create user settings error:', error);
    
    if (error instanceof Error && error.message.includes('already exist')) {
      res.status(409).json({
        success: false,
        error: 'Settings already exist',
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create user settings',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

export async function updateUserSettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        message: 'User ID not found in request'
      });
      return;
    }
    
    // Validate request body
    const validationResult = updateUserSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const settings = await userSettingsService.updateUserSettings(userId, validationResult.data);

    res.json({
      success: true,
      data: { settings },
      message: 'User settings updated successfully'
    });
  } catch (error) {
    console.error('Update user settings error:', error);
    
    if (error instanceof Error && error.message.includes('Invalid')) {
      res.status(400).json({
        success: false,
        error: 'Invalid data',
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update user settings',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

export async function deleteUserSettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        message: 'User ID not found in request'
      });
      return;
    }

    await userSettingsService.deleteUserSettings(userId);

    res.json({
      success: true,
      message: 'User settings deleted successfully'
    });
  } catch (error) {
    console.error('Delete user settings error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Settings not found',
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete user settings',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

export async function resetUserSettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        message: 'User ID not found in request'
      });
      return;
    }

    const settings = await userSettingsService.resetToDefaults(userId);

    res.json({
      success: true,
      data: { settings },
      message: 'User settings reset to defaults successfully'
    });
  } catch (error) {
    console.error('Reset user settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset user settings',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

export async function getUserTheme(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        message: 'User ID not found in request'
      });
      return;
    }

    const theme = await userSettingsService.getUserTheme(userId);

    res.json({
      success: true,
      data: { theme },
      message: 'User theme retrieved successfully'
    });
  } catch (error) {
    console.error('Get user theme error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user theme',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

export async function getAutoRefreshSettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        message: 'User ID not found in request'
      });
      return;
    }

    const autoRefreshSettings = await userSettingsService.getAutoRefreshSettings(userId);

    res.json({
      success: true,
      data: autoRefreshSettings,
      message: 'Auto-refresh settings retrieved successfully'
    });
  } catch (error) {
    console.error('Get auto-refresh settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auto-refresh settings',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}