import express from 'express';
import { authMiddleware } from '../middlewares/auth-middleware';
import { getAccountDeletionPreview, deleteAccount } from '../controllers/account/account-deletion';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/account/deletion/preview - Get preview of data to be deleted
router.get('/deletion/preview', getAccountDeletionPreview);

// DELETE /api/account/deletion - Delete account with confirmation
router.delete('/deletion', deleteAccount);

export default router;