import { Request, Response } from 'express';
import { WebhookController } from '../../api/controllers/webhook-controller';
import { SocketService } from '../../services/socket-service';
import { ConversationService } from '../../services/conversation-service';
import { prisma } from '../../database/prisma';

// Mock dos serviços
jest.mock('../../services/socket-service');
jest.mock('../../services/conversation-service');
jest.mock('../../database/prisma', () => ({
  prisma: {
    whatsAppInstance: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}));

describe('WebhookController', () => {
  let webhookController: WebhookController;
  let mockRequest: any;
  let mockResponse: any;
  let mockSocketService: jest.Mocked<SocketService>;
  let mockConversationService: jest.Mocked<ConversationService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks
    mockSocketService = {
      emitToInstance: jest.fn(),
      getInstance: jest.fn().mockReturnValue({
        emitToInstance: jest.fn()
      })
    } as any;

    mockConversationService = {
      recordLidMapping: jest.fn(),
      handleMessageStatusUpdate: jest.fn(),
      handleIncomingMessageAtomic: jest.fn(),
      updateContactFromWebhook: jest.fn(),
      updateUnreadCount: jest.fn()
    } as any;

    // Mock SocketService.getInstance
    (SocketService.getInstance as jest.Mock).mockReturnValue(mockSocketService);

    // Mock ConversationService constructor
    (ConversationService as jest.Mock).mockImplementation(() => mockConversationService);

    // Criar controller
    webhookController = new WebhookController();

    // Setup request/response mocks
    mockRequest = {
      params: {},
      body: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('handleEvolutionWebhook', () => {
    test('should return 400 when instanceId is not provided', async () => {
      mockRequest.params = {};

      await webhookController.handleEvolutionWebhook(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Instance ID is required'
      });
    });

    test('should return 200 when instance is not found in database', async () => {
      mockRequest.params = { instanceId: 'non-existent-instance' };
      mockRequest.body = { event: 'messages.upsert', data: {} };

      (prisma.whatsAppInstance.findUnique as jest.Mock).mockResolvedValue(null);

      await webhookController.handleEvolutionWebhook(mockRequest, mockResponse);

      expect(prisma.whatsAppInstance.findUnique).toHaveBeenCalledWith({
        where: { evolutionInstanceName: 'non-existent-instance' }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Webhook ignored - instance not found in database'
      });
    });

    test('should process messages.upsert event successfully', async () => {
      const instanceId = 'test-instance';
      const mockInstance = { id: 'instance-123', name: 'Test Instance' };

      mockRequest.params = { instanceId };
      mockRequest.body = {
        event: 'messages.upsert',
        data: {
          key: { id: 'msg-123' },
          message: { text: 'Hello' },
          pushName: 'Test User'
        }
      };

      (prisma.whatsAppInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);

      await webhookController.handleEvolutionWebhook(mockRequest, mockResponse);

      expect(mockConversationService.handleIncomingMessageAtomic).toHaveBeenCalledWith(
        instanceId,
        mockRequest.body.data
      );
      expect(mockSocketService.emitToInstance).toHaveBeenCalledWith(instanceId, 'evolution_event', mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Webhook processed successfully'
      });
    });

    test('should process send.message event and convert to upsert format', async () => {
      const instanceId = 'test-instance';
      const mockInstance = { id: 'instance-123', name: 'Test Instance' };

      mockRequest.params = { instanceId };
      mockRequest.body = {
        event: 'send.message',
        data: {
          key: { id: 'msg-123' },
          message: { text: 'Sent message' },
          pushName: 'Test User',
          instanceId: 'test-instance'
        }
      };

      (prisma.whatsAppInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);

      await webhookController.handleEvolutionWebhook(mockRequest, mockResponse);

      expect(mockConversationService.handleIncomingMessageAtomic).toHaveBeenCalledWith(
        instanceId,
        expect.objectContaining({
          key: expect.objectContaining({ fromMe: true }),
          pushName: 'Test User',
          status: 'SENT',
          message: { text: 'Sent message' },
          instanceId: 'test-instance',
          source: 'web'
        })
      );
    });

    test('should process messages.update event for LID mapping', async () => {
      const instanceId = 'test-instance';
      const mockInstance = { id: 'instance-123', name: 'Test Instance' };

      mockRequest.params = { instanceId };
      mockRequest.body = {
        event: 'messages.update',
        data: {
          remoteJid: '1234567890@lid',
          key: { id: 'msg-123' },
          status: 'DELIVERED'
        }
      };

      (prisma.whatsAppInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);

      await webhookController.handleEvolutionWebhook(mockRequest, mockResponse);

      expect(mockConversationService.recordLidMapping).toHaveBeenCalledWith('msg-123', '1234567890@lid', null);
      expect(mockConversationService.handleMessageStatusUpdate).toHaveBeenCalledWith(instanceId, {
        messageId: 'msg-123',
        status: 'DELIVERED',
        remoteJid: '1234567890@lid'
      });
    });

    test('should process contacts.update event', async () => {
      const instanceId = 'test-instance';
      const mockInstance = { id: 'instance-123', name: 'Test Instance' };

      mockRequest.params = { instanceId };
      mockRequest.body = {
        event: 'contacts.update',
        data: {
          remoteJid: '1234567890@s.whatsapp.net',
          pushName: 'Updated Name',
          profilePicUrl: 'https://example.com/photo.jpg'
        }
      };

      (prisma.whatsAppInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);

      await webhookController.handleEvolutionWebhook(mockRequest, mockResponse);

      expect(mockConversationService.updateContactFromWebhook).toHaveBeenCalledWith(instanceId, '1234567890@s.whatsapp.net', {
        contactName: 'Updated Name',
        contactPicture: 'https://example.com/photo.jpg'
      });
    });

    test('should process chats.upsert event for unread count', async () => {
      const instanceId = 'test-instance';
      const mockInstance = { id: 'instance-123', name: 'Test Instance' };

      mockRequest.params = { instanceId };
      mockRequest.body = {
        event: 'chats.upsert',
        data: {
          remoteJid: '1234567890@s.whatsapp.net',
          unreadMessages: 5
        }
      };

      (prisma.whatsAppInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);

      await webhookController.handleEvolutionWebhook(mockRequest, mockResponse);

      expect(mockConversationService.updateUnreadCount).toHaveBeenCalledWith(instanceId, '1234567890@s.whatsapp.net', 5);
    });

    test('should process presence.update event', async () => {
      const instanceId = 'test-instance';
      const mockInstance = { id: 'instance-123', name: 'Test Instance' };

      mockRequest.params = { instanceId };
      mockRequest.body = {
        event: 'presence.update',
        data: {
          id: '1234567890@s.whatsapp.net',
          presences: {
            '1234567890@s.whatsapp.net': {
              lastKnownPresence: 'composing'
            }
          }
        }
      };

      (prisma.whatsAppInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);

      await webhookController.handleEvolutionWebhook(mockRequest, mockResponse);

      expect(mockSocketService.emitToInstance).toHaveBeenCalledWith(instanceId, 'presence:update', {
        contactId: '1234567890@s.whatsapp.net',
        status: 'composing',
        isTyping: true,
        isOnline: false
      });
    });

    test('should process connection.update event and update instance status', async () => {
      const instanceId = 'test-instance';
      const mockInstance = { id: 'instance-123', name: 'Test Instance' };

      mockRequest.params = { instanceId };
      mockRequest.body = {
        event: 'connection.update',
        data: {
          state: 'open',
          statusCode: 200
        }
      };

      (prisma.whatsAppInstance.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockInstance) // First call for validation
        .mockResolvedValueOnce(mockInstance); // Second call for update

      await webhookController.handleEvolutionWebhook(mockRequest, mockResponse);

      expect(prisma.whatsAppInstance.update).toHaveBeenCalledWith({
        where: { id: 'instance-123' },
        data: {
          status: 'CONNECTED',
          connected: true,
          updatedAt: expect.any(Date)
        }
      });

      expect(mockSocketService.emitToInstance).toHaveBeenCalledWith('instance-123', 'instance:status', {
        status: 'CONNECTED',
        state: 'open',
        statusCode: 200,
        connected: true
      });
    });

    test('should process qrcode.updated event and save QR code', async () => {
      const instanceId = 'test-instance';
      const mockInstance = { id: 'instance-123', name: 'Test Instance' };
      const qrCode = 'base64-qr-code-data';

      mockRequest.params = { instanceId };
      mockRequest.body = {
        event: 'qrcode.updated',
        data: {
          qrcode: qrCode
        }
      };

      (prisma.whatsAppInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);

      await webhookController.handleEvolutionWebhook(mockRequest, mockResponse);

      expect(prisma.whatsAppInstance.update).toHaveBeenCalledWith({
        where: { id: 'instance-123' },
        data: {
          qrCode,
          lastSeen: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });

      expect(mockSocketService.emitToInstance).toHaveBeenCalledWith('instance-123', 'qrcode:updated', {
        qrCode,
        timestamp: expect.any(String)
      });
    });

    test('should handle invalid webhook data with Zod validation error', async () => {
      mockRequest.params = { instanceId: 'test-instance' };
      mockRequest.body = {
        event: 'messages.upsert',
        data: 'invalid-data-format' // Should be object
      };

      await webhookController.handleEvolutionWebhook(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid webhook data',
        details: expect.any(Array)
      });
    });

    test('should handle unexpected errors', async () => {
      mockRequest.params = { instanceId: 'test-instance' };
      mockRequest.body = { event: 'messages.upsert', data: {} };

      (prisma.whatsAppInstance.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await webhookController.handleEvolutionWebhook(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to process webhook'
      });
    });
  });

  describe('handleMessageWebhook', () => {
    test('should return 400 when instanceId is not provided', async () => {
      mockRequest.params = {};

      await webhookController.handleMessageWebhook(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Instance ID is required'
      });
    });

    test('should process message webhook successfully', async () => {
      const instanceId = 'test-instance';
      const messageData = { text: 'Test message', from: 'user@example.com' };

      mockRequest.params = { instanceId };
      mockRequest.body = messageData;

      await webhookController.handleMessageWebhook(mockRequest, mockResponse);

      expect(mockSocketService.emitToInstance).toHaveBeenCalledWith(instanceId, 'message_received', messageData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Message webhook processed successfully'
      });
    });

    test('should handle errors in message webhook processing', async () => {
      mockRequest.params = { instanceId: 'test-instance' };
      mockRequest.body = {};

      // Mock socket service to throw error
      mockSocketService.emitToInstance.mockImplementation(() => {
        throw new Error('Socket error');
      });

      await webhookController.handleMessageWebhook(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to process message webhook'
      });
    });
  });

  describe('handleStatusWebhook', () => {
    test('should return 400 when instanceId is not provided', async () => {
      mockRequest.params = {};

      await webhookController.handleStatusWebhook(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Instance ID is required'
      });
    });

    test('should process status webhook successfully', async () => {
      const instanceId = 'test-instance';
      const statusData = { status: 'online', timestamp: Date.now() };

      mockRequest.params = { instanceId };
      mockRequest.body = statusData;

      await webhookController.handleStatusWebhook(mockRequest, mockResponse);

      expect(mockSocketService.emitToInstance).toHaveBeenCalledWith(instanceId, 'status_changed', statusData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Status webhook processed successfully'
      });
    });

    test('should handle errors in status webhook processing', async () => {
      mockRequest.params = { instanceId: 'test-instance' };
      mockRequest.body = {};

      mockSocketService.emitToInstance.mockImplementation(() => {
        throw new Error('Socket error');
      });

      await webhookController.handleStatusWebhook(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to process status webhook'
      });
    });
  });
});