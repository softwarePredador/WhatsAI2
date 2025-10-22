import { Router } from 'express';
import { WebhookController } from '../controllers/webhook-controller';

const router = Router();
const webhookController = new WebhookController();

// Webhook routes for Evolution API
router.post('/evolution/:instanceId', webhookController.handleEvolutionWebhook);
router.post('/message/:instanceId', webhookController.handleMessageWebhook);
router.post('/status/:instanceId', webhookController.handleStatusWebhook);

export { router as webhookRoutes };