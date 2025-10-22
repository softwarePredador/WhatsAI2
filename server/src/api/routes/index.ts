import { Router } from 'express';
import { authRoutes } from './auth';
import { instanceRoutes } from './instances';
import { webhookRoutes } from './webhooks';
import settingsRoutes from './settings';
import accountRoutes from './account';
import { authMiddleware } from '@/api/middlewares/auth-middleware';

const router = Router();

// Health check endpoint (public)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'WhatsAI Multi-Instance Manager',
    version: '1.0.0'
  });
});

// Authentication routes (public)
router.use('/auth', authRoutes);

// Protected routes (require authentication)
router.use('/instances', authMiddleware, instanceRoutes);
router.use('/settings', authMiddleware, settingsRoutes);
router.use('/account', authMiddleware, accountRoutes);
router.use('/webhooks', webhookRoutes);

export { router as apiRoutes };