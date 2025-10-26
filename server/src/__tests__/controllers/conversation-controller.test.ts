import { Request, Response } from 'express';
import { ConversationController } from '../../api/controllers/conversation-controller';
import { ConversationService } from '../../services/conversation-service';
import { MediaStorageService } from '../../services/media-storage';
import { prisma } from '../../database/prisma';

// Mock dos serviços
jest.mock('../../services/conversation-service');
jest.mock('../../services/media-storage');
jest.mock('../../database/prisma', () => ({
  prisma: {
    whatsAppInstance: {
      findFirst: jest.fn(),
      findUnique: jest.fn()
    }
  }
}));

describe('ConversationController', () => {
  let controller: ConversationController;
  let mockRequest: any;
  let mockResponse: any;
  let mockConversationService: any;
  let mockMediaStorageService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks
    mockConversationService = {
      getConversationsByInstance: jest.fn(),
      getConversationById: jest.fn(),
      getConversationMessages: jest.fn(),
      sendMessage: jest.fn(),
      sendMediaMessageAtomic: jest.fn(),
      markConversationAsRead: jest.fn(),
      markConversationAsUnread: jest.fn(),
      getArchivedConversations: jest.fn(),
      pinConversation: jest.fn(),
      unpinConversation: jest.fn(),
      archiveConversation: jest.fn(),
      getInstanceByEvolutionName: jest.fn()
    };

    mockMediaStorageService = {
      uploadAndSendMedia: jest.fn(),
      getCdnUrl: jest.fn()
    };

    // Mock constructors
    (ConversationService as any).mockImplementation(() => mockConversationService);
    (MediaStorageService as any).mockImplementation(() => mockMediaStorageService);

    // Criar controller
    controller = new ConversationController();

    // Setup request/response mocks
    mockRequest = {
      params: {},
      body: {},
      query: {},
      headers: {},
      userId: 'user-123',
      user: { id: 'user-123' }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getConversations', () => {
    test('should get conversations by instanceId from params', async () => {
      const conversations = [
        { id: 'conv-1', remoteJid: '5511999999999@s.whatsapp.net' },
        { id: 'conv-2', remoteJid: '5511888888888@s.whatsapp.net' }
      ];

      mockRequest.params = { instanceId: 'instance-123' };
      mockConversationService.getConversationsByInstance.mockResolvedValue(conversations);

      await controller.getConversations(mockRequest, mockResponse);

      expect(mockConversationService.getConversationsByInstance).toHaveBeenCalledWith('instance-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: conversations
      });
    });

    test('should get conversations by instanceId from query', async () => {
      const conversations = [{ id: 'conv-1', remoteJid: '5511999999999@s.whatsapp.net' }];

      mockRequest.query = { instanceId: 'instance-456' };
      mockConversationService.getConversationsByInstance.mockResolvedValue(conversations);

      await controller.getConversations(mockRequest, mockResponse);

      expect(mockConversationService.getConversationsByInstance).toHaveBeenCalledWith('instance-456');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: conversations
      });
    });

    test('should map evolutionInstanceName to database instanceId', async () => {
      const conversations = [{ id: 'conv-1', remoteJid: '5511999999999@s.whatsapp.net' }];
      const instance = { id: 'db-instance-123' };

      mockRequest.params = { instanceId: 'whatsai_instance_001' };
      mockConversationService.getInstanceByEvolutionName.mockResolvedValue(instance);
      mockConversationService.getConversationsByInstance.mockResolvedValue(conversations);

      await controller.getConversations(mockRequest, mockResponse);

      expect(mockConversationService.getInstanceByEvolutionName).toHaveBeenCalledWith('whatsai_instance_001');
      expect(mockConversationService.getConversationsByInstance).toHaveBeenCalledWith('db-instance-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: conversations
      });
    });

    test('should return empty array when no instanceId provided', async () => {
      // The controller actually throws an error when trying to access req.headers.authorization
      // So we need to provide headers in the mock
      mockRequest.headers = { authorization: 'Bearer token' };

      await controller.getConversations(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });

    test('should handle service errors', async () => {
      mockRequest.params = { instanceId: 'instance-123' };
      mockConversationService.getConversationsByInstance.mockRejectedValue(new Error('Service error'));

      await controller.getConversations(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('getConversationById', () => {
    test('should get conversation successfully', async () => {
      const conversation = { id: 'conv-123', remoteJid: '5511999999999@s.whatsapp.net' };

      mockRequest.params = { conversationId: 'conv-123' };
      mockConversationService.getConversationById.mockResolvedValue(conversation);

      await controller.getConversationById(mockRequest, mockResponse);

      expect(mockConversationService.getConversationById).toHaveBeenCalledWith('conv-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: conversation
      });
    });

    test('should return 400 when conversationId is not provided', async () => {
      await controller.getConversationById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'ID da conversa é obrigatório'
      });
    });

    test('should return 404 when conversation is not found', async () => {
      mockRequest.params = { conversationId: 'non-existent' };
      mockConversationService.getConversationById.mockResolvedValue(null);

      await controller.getConversationById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Conversa não encontrada'
      });
    });

    test('should handle service errors', async () => {
      mockRequest.params = { conversationId: 'conv-123' };
      mockConversationService.getConversationById.mockRejectedValue(new Error('Service error'));

      await controller.getConversationById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('getConversationMessages', () => {
    test('should get conversation messages successfully', async () => {
      const conversationWithMessages = {
        id: 'conv-123',
        remoteJid: '5511999999999@s.whatsapp.net',
        contactName: 'Test User',
        contactPicture: null,
        isGroup: false,
        unreadCount: 0,
        isPinned: false,
        isArchived: false,
        messages: [
          { id: 'msg-1', content: 'Hello', timestamp: new Date() },
          { id: 'msg-2', content: 'Hi there', timestamp: new Date() }
        ]
      };

      mockRequest.params = { conversationId: 'conv-123' };
      mockRequest.query = { limit: '10', offset: '0' };
      mockConversationService.getConversationMessages.mockResolvedValue(conversationWithMessages);

      await controller.getConversationMessages(mockRequest, mockResponse);

      expect(mockConversationService.getConversationMessages).toHaveBeenCalledWith('conv-123', 10, 0);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          conversation: {
            id: 'conv-123',
            remoteJid: '5511999999999@s.whatsapp.net',
            contactName: 'Test User',
            contactPicture: null,
            isGroup: false,
            unreadCount: 0,
            isPinned: false,
            isArchived: false
          },
          messages: conversationWithMessages.messages.reverse()
        }
      });
    });

    test('should return 400 when conversationId is not provided', async () => {
      await controller.getConversationMessages(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'ID da conversa é obrigatório'
      });
    });

    test('should return 404 when conversation is not found', async () => {
      mockRequest.params = { conversationId: 'non-existent' };
      mockConversationService.getConversationMessages.mockResolvedValue(null);

      await controller.getConversationMessages(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Conversa não encontrada'
      });
    });

    test('should use default limit and offset when not provided', async () => {
      const conversationWithMessages = {
        id: 'conv-123',
        remoteJid: '5511999999999@s.whatsapp.net',
        contactName: 'Test User',
        contactPicture: null,
        isGroup: false,
        unreadCount: 0,
        isPinned: false,
        isArchived: false,
        messages: []
      };

      mockRequest.params = { conversationId: 'conv-123' };
      mockConversationService.getConversationMessages.mockResolvedValue(conversationWithMessages);

      await controller.getConversationMessages(mockRequest, mockResponse);

      expect(mockConversationService.getConversationMessages).toHaveBeenCalledWith('conv-123', 50, 0);
    });
  });

  describe('sendMessage', () => {
    test('should send message via conversationId successfully', async () => {
      const conversation = { id: 'conv-123', instanceId: 'instance-456', remoteJid: '5511999999999@s.whatsapp.net' };
      const message = { id: 'msg-123', content: 'Hello World', status: 'sent' };

      mockRequest.params = { conversationId: 'conv-123' };
      mockRequest.body = { remoteJid: '5511999999999@s.whatsapp.net', content: 'Hello World' };
      mockConversationService.getConversationById.mockResolvedValue(conversation);
      mockConversationService.sendMessage.mockResolvedValue(message);

      await controller.sendMessage(mockRequest, mockResponse);

      expect(mockConversationService.getConversationById).toHaveBeenCalledWith('conv-123');
      expect(mockConversationService.sendMessage).toHaveBeenCalledWith('instance-456', '5511999999999@s.whatsapp.net', 'Hello World');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: message
      });
    });

    test('should send message via instanceId successfully', async () => {
      const message = { id: 'msg-123', content: 'Hello World', status: 'sent' };

      mockRequest.params = { instanceId: 'instance-456' };
      mockRequest.body = { remoteJid: '5511999999999@s.whatsapp.net', content: 'Hello World' };
      mockConversationService.sendMessage.mockResolvedValue(message);

      await controller.sendMessage(mockRequest, mockResponse);

      expect(mockConversationService.sendMessage).toHaveBeenCalledWith('instance-456', '5511999999999@s.whatsapp.net', 'Hello World');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: message
      });
    });

    test('should return 404 when conversation is not found', async () => {
      mockRequest.params = { conversationId: 'non-existent' };
      mockRequest.body = { remoteJid: '5511999999999@s.whatsapp.net', content: 'Hello' };
      mockConversationService.getConversationById.mockResolvedValue(null);

      await controller.sendMessage(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Conversa não encontrada'
      });
    });

    test('should return 400 when neither conversationId nor instanceId provided', async () => {
      mockRequest.body = { remoteJid: '5511999999999@s.whatsapp.net', content: 'Hello' };

      await controller.sendMessage(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'ID da instância ou conversa é obrigatório'
      });
    });

    test('should handle validation errors', async () => {
      mockRequest.params = { instanceId: 'instance-456' };
      mockRequest.body = { remoteJid: '', content: 'Hello' }; // Invalid remoteJid

      await controller.sendMessage(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Dados inválidos',
        details: expect.any(Object)
      });
    });

    test('should handle WhatsApp not found error', async () => {
      mockRequest.params = { instanceId: 'instance-456' };
      mockRequest.body = { remoteJid: '5511999999999@s.whatsapp.net', content: 'Hello' };
      mockRequest.headers = { authorization: 'Bearer token' };

      // Mock prisma para verificar permissão
      (prisma.whatsAppInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'instance-456', userId: 'user-123' });

      mockConversationService.sendMessage.mockRejectedValue(new Error('Número não possui WhatsApp'));

      await controller.sendMessage(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Dados inválidos',
        details: expect.any(Error)
      });
    });

    test('should handle general service errors', async () => {
      const conversation = { id: 'conv-123', instanceId: 'instance-456' };

      mockRequest.params = { conversationId: 'conv-123' };
      mockRequest.body = { remoteJid: '5511999999999@s.whatsapp.net', content: 'Hello' };
      mockRequest.headers = { authorization: 'Bearer token' };

      // Mock prisma para verificar permissão
      (prisma.whatsAppInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'instance-456', userId: 'user-123' });
      (prisma.whatsAppInstance.findUnique as jest.Mock).mockResolvedValue({ id: 'instance-456', userId: 'user-123' });

      mockConversationService.getConversationById.mockResolvedValue(conversation);
      mockConversationService.sendMessage.mockRejectedValue(new Error('Some other error'));

      await controller.sendMessage(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Dados inválidos',
        details: expect.any(Error)
      });
    });
  });

  describe('sendMediaMessage', () => {
    test('should send media message successfully', async () => {
      const conversation = { id: 'conv-123', instanceId: 'instance-456', remoteJid: '5511999999999@s.whatsapp.net' };
      const message = { id: 'msg-123', mediaType: 'image', status: 'sent' };

      mockRequest.params = { conversationId: 'conv-123' };
      mockRequest.body = {
        remoteJid: '5511999999999@s.whatsapp.net',
        mediaUrl: 'https://example.com/image.jpg',
        mediaType: 'image',
        caption: 'Test image'
      };

      // Mock prisma para verificar permissão
      (prisma.whatsAppInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'instance-456', userId: 'user-123' });
      (prisma.whatsAppInstance.findUnique as jest.Mock).mockResolvedValue({ id: 'instance-456', userId: 'user-123' });

      mockConversationService.getConversationById.mockResolvedValue(conversation);
      mockConversationService.sendMediaMessageAtomic.mockResolvedValue(message);

      await controller.sendMediaMessage(mockRequest, mockResponse);

      expect(mockConversationService.sendMediaMessageAtomic).toHaveBeenCalledWith(
        'instance-456',
        '5511999999999@s.whatsapp.net',
        'https://example.com/image.jpg',
        'image',
        'Test image',
        undefined
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: message
      });
    });

    test('should return 400 when conversationId is not provided', async () => {
      await controller.sendMediaMessage(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'ID da conversa é obrigatório'
      });
    });

    test('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { conversationId: 'conv-123' };

      await controller.sendMediaMessage(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuário não autenticado'
      });
    });

    test('should return 404 when conversation is not found', async () => {
      mockRequest.params = { conversationId: 'non-existent' };
      mockConversationService.getConversationById.mockResolvedValue(null);

      await controller.sendMediaMessage(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Conversa não encontrada'
      });
    });

    test('should handle validation errors', async () => {
      const conversation = { id: 'conv-123', instanceId: 'instance-456' };

      mockRequest.params = { conversationId: 'conv-123' };
      mockRequest.body = { remoteJid: '', mediaUrl: 'https://example.com/image.jpg' }; // Invalid data

      // Mock prisma para verificar permissão
      (prisma.whatsAppInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'instance-456', userId: 'user-123' });
      (prisma.whatsAppInstance.findUnique as jest.Mock).mockResolvedValue({ id: 'instance-456', userId: 'user-123' });

      mockConversationService.getConversationById.mockResolvedValue(conversation);

      await controller.sendMediaMessage(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Dados inválidos',
        details: expect.any(Array)
      });
    });
  });

  describe('markConversationAsRead', () => {
    test('should mark conversation as read successfully', async () => {
      mockRequest.params = { conversationId: 'conv-123' };

      await controller.markConversationAsRead(mockRequest, mockResponse);

      expect(mockConversationService.markConversationAsRead).toHaveBeenCalledWith('conv-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Conversa marcada como lida'
      });
    });

    test('should return 400 when conversationId is not provided', async () => {
      await controller.markConversationAsRead(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'ID da conversa é obrigatório'
      });
    });

    test('should handle service errors', async () => {
      mockRequest.params = { conversationId: 'conv-123' };
      mockConversationService.markConversationAsRead.mockRejectedValue(new Error('Service error'));

      await controller.markConversationAsRead(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('pinConversation', () => {
    test('should pin conversation successfully', async () => {
      mockRequest.params = { conversationId: 'conv-123' };

      await controller.pinConversation(mockRequest, mockResponse);

      expect(mockConversationService.pinConversation).toHaveBeenCalledWith('conv-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Conversa fixada'
      });
    });

    test('should return 400 when conversationId is not provided', async () => {
      await controller.pinConversation(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'ID da conversa é obrigatório'
      });
    });
  });

  describe('archiveConversation', () => {
    test('should archive conversation successfully', async () => {
      mockRequest.params = { conversationId: 'conv-123' };

      await controller.archiveConversation(mockRequest, mockResponse);

      expect(mockConversationService.archiveConversation).toHaveBeenCalledWith('conv-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Conversa arquivada'
      });
    });

    test('should return 400 when conversationId is not provided', async () => {
      await controller.archiveConversation(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'ID da conversa é obrigatório'
      });
    });
  });

  describe('getArchivedConversations', () => {
    test('should get archived conversations successfully', async () => {
      const conversations = [
        { id: 'conv-1', remoteJid: '5511999999999@s.whatsapp.net', isArchived: true },
        { id: 'conv-2', remoteJid: '5511888888888@s.whatsapp.net', isArchived: true }
      ];

      mockRequest.params = { instanceId: 'instance-123' };
      mockConversationService.getArchivedConversations.mockResolvedValue(conversations);

      await controller.getArchivedConversations(mockRequest, mockResponse);

      expect(mockConversationService.getArchivedConversations).toHaveBeenCalledWith('instance-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: conversations
      });
    });

    test('should return 400 when instanceId is not provided', async () => {
      await controller.getArchivedConversations(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'ID da instância é obrigatório'
      });
    });
  });
});
