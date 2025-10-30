/**
 * Check Limits Middleware
 * Task 3.5: Sistema de Limites e Quotas
 * 
 * Middleware to check if user can perform actions based on their plan limits
 */

import { Request, Response, NextFunction } from 'express';
import { PlansService } from '../services/plans-service';

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export type LimitAction = 'create_instance' | 'send_message' | 'create_template' | 'create_campaign';

/**
 * Middleware factory to check specific action limits
 * 
 * Usage:
 * router.post('/instances', authMiddleware, checkLimits('create_instance'), createInstance)
 */
export const checkLimits = (action: LimitAction) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Não autenticado',
        });
      }

      // Check if user can perform the action
      const result = await PlansService.canPerformAction(userId, action);

      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          error: result.reason,
          code: 'LIMIT_EXCEEDED',
          action,
        });
      }

      // Action allowed, continue
      next();
    } catch (error) {
      console.error('Error checking limits:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar limites',
      });
    }
  };
};

/**
 * Middleware to check instance creation limit
 */
export const checkInstanceLimit = checkLimits('create_instance');

/**
 * Middleware to check message sending limit
 */
export const checkMessageLimit = checkLimits('send_message');

/**
 * Middleware to check template creation limit
 */
export const checkTemplateLimit = checkLimits('create_template');

/**
 * Middleware to check campaign creation limit
 */
export const checkCampaignLimit = checkLimits('create_campaign');

/**
 * Middleware to increment message count after successful send
 * Should be used AFTER the message is sent successfully
 * 
 * Usage:
 * router.post('/messages', authMiddleware, checkMessageLimit, sendMessage, incrementMessageCount)
 */
export const incrementMessageCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return next();
    }

    // Get count from request body (for bulk messages)
    const count = req.body?.count || 1;

    // Increment counter
    await PlansService.incrementMessageCount(userId, count);

    next();
  } catch (error) {
    console.error('Error incrementing message count:', error);
    // Don't block the response, just log the error
    next();
  }
};

/**
 * Middleware to attach usage info to response
 * Useful for showing usage bars in the frontend
 * 
 * Usage:
 * router.get('/dashboard', authMiddleware, attachUsageInfo, getDashboard)
 */
export const attachUsageInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return next();
    }

    // Get usage info
    const usage = await PlansService.getUserUsage(userId);

    // Attach to request for use in route handlers
    (req as any).usage = usage;

    next();
  } catch (error) {
    console.error('Error attaching usage info:', error);
    // Don't block the request, just continue
    next();
  }
};

export default {
  checkLimits,
  checkInstanceLimit,
  checkMessageLimit,
  checkTemplateLimit,
  checkCampaignLimit,
  incrementMessageCount,
  attachUsageInfo,
};
