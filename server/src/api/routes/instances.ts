import { Router } from 'express';
import { WhatsAppInstanceController } from '../controllers/instance-controller';

const router = Router();
const instanceController = new WhatsAppInstanceController();

// Instance management routes
router.post('/', instanceController.createInstance);
router.get('/', instanceController.listInstances);
router.get('/evolution/list', instanceController.listEvolutionInstances);
router.post('/sync-all', instanceController.syncAllInstancesStatus);
router.get('/:instanceId', instanceController.getInstance);
router.delete('/:instanceId', instanceController.deleteInstance);
router.post('/:instanceId/connect', instanceController.connectInstance);
router.post('/:instanceId/disconnect', instanceController.disconnectInstance);
router.post('/:instanceId/refresh-status', instanceController.refreshInstanceStatus);
router.get('/:instanceId/qr', instanceController.getQRCode);
router.post('/:instanceId/send-message', instanceController.sendMessage);

export { router as instanceRoutes };