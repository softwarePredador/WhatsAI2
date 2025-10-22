import { Router } from 'express';
import { ConversationController } from '../controllers/conversation-controller';
import { authMiddleware } from '../middlewares/auth-middleware';

const router = Router();
const conversationController = new ConversationController();

// Apply auth middleware to all conversation routes
router.use(authMiddleware);

// Get all conversations (with optional instanceId filter)
router.get('/', (req, res) => {
  conversationController.getConversations(req, res);
});

// Get conversations for a specific instance
router.get('/instance/:instanceId', (req, res) => {
  conversationController.getConversations(req, res);
});

// Get specific conversation
router.get('/:conversationId', (req, res) => {
  conversationController.getConversation(req, res);
});

// Get messages for a specific conversation
router.get('/:conversationId/messages', (req, res) => {
  conversationController.getConversationMessages(req, res);
});

// Send message in a conversation
router.post('/:conversationId/messages', (req, res) => {
  conversationController.sendMessage(req, res);
});

// Send message in a conversation (alternative route for instance)
router.post('/instance/:instanceId/send', (req, res) => {
  conversationController.sendMessage(req, res);
});

// Mark conversation as read
router.patch('/:conversationId/read', (req, res) => {
  conversationController.markAsRead(req, res);
});

// Pin conversation
router.patch('/:conversationId/pin', (req, res) => {
  conversationController.pinConversation(req, res);
});

// Unpin conversation
router.patch('/:conversationId/unpin', (req, res) => {
  conversationController.unpinConversation(req, res);
});

// Archive conversation
router.patch('/:conversationId/archive', (req, res) => {
  conversationController.archiveConversation(req, res);
});

// Get archived conversations for an instance
router.get('/instance/:instanceId/archived', (req, res) => {
  conversationController.getArchivedConversations(req, res);
});

export { router as conversationRoutes };