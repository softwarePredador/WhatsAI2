import { Request, Response } from 'express';
import { z } from 'zod';
import { AccountDeletionService } from '../../../services/account-deletion-service';
import { prisma } from '../../../database/prisma';

// Validation schema
const deleteAccountSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmEmail: z.string().email('Invalid email format'),
  confirmDeletion: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm account deletion' })
  })
});

// Initialize service
const accountDeletionService = new AccountDeletionService(prisma);

export async function getAccountDeletionPreview(req: Request, res: Response): Promise<void> {
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

    const preview = await accountDeletionService.getAccountDeletionPreview(userId);

    res.json({
      success: true,
      data: preview,
      message: 'Account deletion preview retrieved successfully'
    });
  } catch (error) {
    console.error('Get account deletion preview error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get account deletion preview',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
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
    const validationResult = deleteAccountSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
        message: 'Please check your input and try again'
      });
      return;
    }

    const { password, confirmEmail } = validationResult.data;

    const result = await accountDeletionService.deleteUserAccount(userId, {
      password,
      confirmEmail
    });

    res.json({
      success: true,
      data: result,
      message: 'Account deleted successfully. All associated data has been permanently removed.'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: error.message
        });
        return;
      }
      
      if (error.message.includes('Email confirmation') || error.message.includes('Invalid password')) {
        res.status(400).json({
          success: false,
          error: 'Authentication failed',
          message: error.message
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}