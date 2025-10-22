import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth-middleware';
import {
  getUserSettings,
  createUserSettings,
  updateUserSettings,
  deleteUserSettings,
  resetUserSettings,
  getUserTheme,
  getAutoRefreshSettings
} from '../controllers/settings/user-settings';

const router = Router();

// Apply auth middleware to all settings routes
router.use(authMiddleware);

// GET /api/settings - Get user settings (creates defaults if not exists)
router.get('/', getUserSettings);

// POST /api/settings - Create user settings (explicit creation)
router.post('/', createUserSettings);

// PUT /api/settings - Update user settings (upsert behavior)
router.put('/', updateUserSettings);

// DELETE /api/settings - Delete user settings
router.delete('/', deleteUserSettings);

// POST /api/settings/reset - Reset settings to defaults
router.post('/reset', resetUserSettings);

// GET /api/settings/theme - Get only theme setting
router.get('/theme', getUserTheme);

// GET /api/settings/auto-refresh - Get only auto-refresh settings
router.get('/auto-refresh', getAutoRefreshSettings);

export default router;