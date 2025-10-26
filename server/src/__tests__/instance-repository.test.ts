import { PrismaInstanceRepository } from '../database/repositories/instance-repository';
import { PrismaClient } from '@prisma/client';
import { InstanceStatus } from '../types';

jest.mock('../database/prisma', () => ({
  prisma: {
    whatsAppInstance: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    conversation: {
      upsert: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  }
}));

const mockPrisma = jest.mocked(require('../database/prisma').prisma);

describe('PrismaInstanceRepository', () => {
  let repository: PrismaInstanceRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaInstanceRepository();
  });

  describe('create', () => {
    it('should create a new instance', async () => {
      const createData = {
        name: 'Test Instance',
        userId: 'user-1',
        evolutionInstanceName: 'evolution-test',
        evolutionApiUrl: 'http://localhost:8080',
        evolutionApiKey: 'test-key',
        webhook: 'http://example.com/webhook'
      };

      const mockCreatedInstance = {
        id: '1',
        name: 'Test Instance',
        userId: 'user-1',
        evolutionInstanceName: 'evolution-test',
        evolutionApiUrl: 'http://localhost:8080',
        evolutionApiKey: 'test-key',
        webhook: 'http://example.com/webhook',
        status: 'PENDING',
        connected: false,
        qrCode: null,
        lastSeen: null,
        connectedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.whatsAppInstance.create.mockResolvedValue(mockCreatedInstance);

      const result = await repository.create(createData);

      expect(result).toEqual({
        id: '1',
        name: 'Test Instance',
        apiKey: 'test-key',
        serverUrl: 'http://localhost:8080',
        status: 'PENDING',
        qrCode: null,
        connected: false,
        lastSeen: null,
        connectedAt: null,
        webhook: 'http://example.com/webhook',
        evolutionInstanceName: 'evolution-test',
        createdAt: mockCreatedInstance.createdAt,
        updatedAt: mockCreatedInstance.updatedAt
      });
      expect(mockPrisma.whatsAppInstance.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Instance',
          userId: 'user-1',
          evolutionInstanceName: 'evolution-test',
          evolutionApiUrl: 'http://localhost:8080',
          evolutionApiKey: 'test-key',
          webhook: 'http://example.com/webhook',
          status: 'PENDING',
          connected: false
        }
      });
    });

    it('should create instance without webhook', async () => {
      const createData = {
        name: 'Test Instance',
        userId: 'user-1',
        evolutionInstanceName: 'evolution-test',
        evolutionApiUrl: 'http://localhost:8080',
        evolutionApiKey: 'test-key'
      };

      const mockCreatedInstance = {
        id: '1',
        name: 'Test Instance',
        userId: 'user-1',
        evolutionInstanceName: 'evolution-test',
        evolutionApiUrl: 'http://localhost:8080',
        evolutionApiKey: 'test-key',
        webhook: null,
        status: 'PENDING',
        connected: false,
        qrCode: null,
        lastSeen: null,
        connectedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.whatsAppInstance.create.mockResolvedValue(mockCreatedInstance);

      const result = await repository.create(createData);

      expect(result.webhook).toBeNull();
      expect(mockPrisma.whatsAppInstance.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Instance',
          userId: 'user-1',
          evolutionInstanceName: 'evolution-test',
          evolutionApiUrl: 'http://localhost:8080',
          evolutionApiKey: 'test-key',
          webhook: null,
          status: 'PENDING',
          connected: false
        }
      });
    });
  });

  describe('findAll', () => {
    it('should return all instances', async () => {
      const mockInstances = [
        {
          id: '1',
          name: 'Instance 1',
          userId: 'user-1',
          evolutionInstanceName: 'evolution-1',
          evolutionApiUrl: 'http://localhost:8080',
          evolutionApiKey: 'key-1',
          webhook: null,
          status: 'CONNECTED',
          connected: true,
          qrCode: 'qr-code-data',
          lastSeen: new Date(),
          connectedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.whatsAppInstance.findMany.mockResolvedValue(mockInstances);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '1',
        name: 'Instance 1',
        apiKey: 'key-1',
        serverUrl: 'http://localhost:8080',
        status: 'CONNECTED',
        qrCode: 'qr-code-data',
        connected: true,
        lastSeen: expect.any(Date),
        connectedAt: expect.any(Date),
        webhook: null,
        evolutionInstanceName: 'evolution-1',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
      expect(mockPrisma.whatsAppInstance.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('findById', () => {
    it('should return instance when found', async () => {
      const mockInstance = {
        id: '1',
        name: 'Test Instance',
        userId: 'user-1',
        evolutionInstanceName: 'evolution-test',
        evolutionApiUrl: 'http://localhost:8080',
        evolutionApiKey: 'test-key',
        webhook: null,
        status: 'CONNECTED',
        connected: true,
        qrCode: 'qr-code-data',
        lastSeen: new Date(),
        connectedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.whatsAppInstance.findUnique.mockResolvedValue(mockInstance);

      const result = await repository.findById('1');

      expect(result).toEqual({
        id: '1',
        name: 'Test Instance',
        apiKey: 'test-key',
        serverUrl: 'http://localhost:8080',
        status: 'CONNECTED',
        qrCode: 'qr-code-data',
        connected: true,
        lastSeen: mockInstance.lastSeen,
        connectedAt: mockInstance.connectedAt,
        webhook: null,
        evolutionInstanceName: 'evolution-test',
        createdAt: mockInstance.createdAt,
        updatedAt: mockInstance.updatedAt
      });
      expect(mockPrisma.whatsAppInstance.findUnique).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });

    it('should return null when instance not found', async () => {
      mockPrisma.whatsAppInstance.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEvolutionName', () => {
    it('should return instance when found', async () => {
      const mockInstance = {
        id: '1',
        name: 'Test Instance',
        userId: 'user-1',
        evolutionInstanceName: 'evolution-test',
        evolutionApiUrl: 'http://localhost:8080',
        evolutionApiKey: 'test-key',
        webhook: null,
        status: 'CONNECTED',
        connected: true,
        qrCode: 'qr-code-data',
        lastSeen: new Date(),
        connectedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.whatsAppInstance.findUnique.mockResolvedValue(mockInstance);

      const result = await repository.findByEvolutionName('evolution-test');

      expect(result).toEqual({
        id: '1',
        name: 'Test Instance',
        apiKey: 'test-key',
        serverUrl: 'http://localhost:8080',
        status: 'CONNECTED',
        qrCode: 'qr-code-data',
        connected: true,
        lastSeen: mockInstance.lastSeen,
        connectedAt: mockInstance.connectedAt,
        webhook: null,
        evolutionInstanceName: 'evolution-test',
        createdAt: mockInstance.createdAt,
        updatedAt: mockInstance.updatedAt
      });
      expect(mockPrisma.whatsAppInstance.findUnique).toHaveBeenCalledWith({
        where: { evolutionInstanceName: 'evolution-test' }
      });
    });

    it('should return null when instance not found', async () => {
      mockPrisma.whatsAppInstance.findUnique.mockResolvedValue(null);

      const result = await repository.findByEvolutionName('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update instance with all fields', async () => {
      const updateData = {
        name: 'Updated Name',
        status: 'CONNECTED' as InstanceStatus,
        connected: true,
        webhook: 'http://example.com/new-webhook',
        qrCode: 'new-qr-code',
        lastSeen: new Date(),
        connectedAt: new Date()
      };

      const mockUpdatedInstance = {
        id: '1',
        name: 'Updated Name',
        userId: 'user-1',
        evolutionInstanceName: 'evolution-test',
        evolutionApiUrl: 'http://localhost:8080',
        evolutionApiKey: 'test-key',
        webhook: 'http://example.com/new-webhook',
        status: 'CONNECTED',
        connected: true,
        qrCode: 'new-qr-code',
        lastSeen: updateData.lastSeen,
        connectedAt: updateData.connectedAt,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.whatsAppInstance.update.mockResolvedValue(mockUpdatedInstance);

      const result = await repository.update('1', updateData);

      expect(result).toEqual({
        id: '1',
        name: 'Updated Name',
        apiKey: 'test-key',
        serverUrl: 'http://localhost:8080',
        status: 'CONNECTED',
        qrCode: 'new-qr-code',
        connected: true,
        lastSeen: updateData.lastSeen,
        connectedAt: updateData.connectedAt,
        webhook: 'http://example.com/new-webhook',
        evolutionInstanceName: 'evolution-test',
        createdAt: mockUpdatedInstance.createdAt,
        updatedAt: mockUpdatedInstance.updatedAt
      });
      expect(mockPrisma.whatsAppInstance.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          updatedAt: expect.any(Date),
          name: 'Updated Name',
          status: 'CONNECTED',
          connected: true,
          webhook: 'http://example.com/new-webhook',
          qrCode: 'new-qr-code',
          lastSeen: updateData.lastSeen,
          connectedAt: updateData.connectedAt
        }
      });
    });

    it('should update instance with partial fields', async () => {
      const updateData = {
        status: 'DISCONNECTED' as InstanceStatus,
        connected: false
      };

      const mockUpdatedInstance = {
        id: '1',
        name: 'Test Instance',
        userId: 'user-1',
        evolutionInstanceName: 'evolution-test',
        evolutionApiUrl: 'http://localhost:8080',
        evolutionApiKey: 'test-key',
        webhook: null,
        status: 'DISCONNECTED',
        connected: false,
        qrCode: null,
        lastSeen: null,
        connectedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.whatsAppInstance.update.mockResolvedValue(mockUpdatedInstance);

      const result = await repository.update('1', updateData);

      expect(result.status).toBe('DISCONNECTED');
      expect(result.connected).toBe(false);
      expect(mockPrisma.whatsAppInstance.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          updatedAt: expect.any(Date),
          status: 'DISCONNECTED',
          connected: false
        }
      });
    });
  });

  describe('updateStatus', () => {
    it('should update status and connected state', async () => {
      await repository.updateStatus('1', 'CONNECTED' as InstanceStatus, true);

      expect(mockPrisma.whatsAppInstance.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'CONNECTED',
          connected: true,
          updatedAt: expect.any(Date),
          connectedAt: expect.any(Date)
        }
      });
    });

    it('should update status without connectedAt when not connected', async () => {
      await repository.updateStatus('1', 'DISCONNECTED' as InstanceStatus, false);

      expect(mockPrisma.whatsAppInstance.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'DISCONNECTED',
          connected: false,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('delete', () => {
    it('should delete instance', async () => {
      const mockDeletedInstance = {
        id: '1',
        name: 'Test Instance',
        userId: 'user-1',
        evolutionInstanceName: 'evolution-test',
        evolutionApiUrl: 'http://localhost:8080',
        evolutionApiKey: 'test-key',
        webhook: null,
        status: 'PENDING',
        connected: false,
        qrCode: null,
        lastSeen: null,
        connectedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.whatsAppInstance.delete.mockResolvedValue(mockDeletedInstance);

      await repository.delete('1');

      expect(mockPrisma.whatsAppInstance.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });
  });

  describe('saveMessage', () => {
    it('should save message and update/create conversation', async () => {
      const messageData = {
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        fromMe: false,
        messageType: 'text',
        content: 'Hello World',
        messageId: 'msg-123',
        timestamp: new Date()
      };

      const mockConversation = {
        id: 'conv-1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        nickname: null,
        contactName: null,
        contactPicture: null,
        isGroup: false,
        lastMessage: 'Hello World',
        lastMessageAt: messageData.timestamp,
        unreadCount: 1,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.conversation.upsert.mockResolvedValue(mockConversation);
      mockPrisma.message.create.mockResolvedValue({
        id: '1',
        ...messageData,
        conversationId: 'conv-1',
        status: null,
        mediaUrl: null,
        fileName: null,
        caption: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await repository.saveMessage(messageData);

      expect(mockPrisma.conversation.upsert).toHaveBeenCalledWith({
        where: {
          instanceId_remoteJid: {
            instanceId: 'instance-1',
            remoteJid: '123@c.us'
          }
        },
        create: {
          instanceId: 'instance-1',
          remoteJid: '123@c.us',
          isGroup: false, // remoteJid does not include '@g.us'
          lastMessage: 'Hello World',
          lastMessageAt: messageData.timestamp,
          unreadCount: 1 // fromMe is false, so increment
        },
        update: {
          lastMessage: 'Hello World',
          lastMessageAt: messageData.timestamp,
          unreadCount: { increment: 1 },
          updatedAt: expect.any(Date)
        }
      });

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          instanceId: 'instance-1',
          remoteJid: '123@c.us',
          fromMe: false,
          messageType: 'text',
          content: 'Hello World',
          messageId: 'msg-123',
          timestamp: messageData.timestamp,
          mediaUrl: null,
          fileName: null,
          caption: null,
          conversationId: 'conv-1'
        }
      });
    });

    it('should handle message from me (no unread count increment)', async () => {
      const messageData = {
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        fromMe: true,
        messageType: 'text',
        content: 'Hello from me',
        messageId: 'msg-124',
        timestamp: new Date()
      };

      const mockConversation = {
        id: 'conv-1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        nickname: null,
        contactName: null,
        contactPicture: null,
        isGroup: false,
        lastMessage: 'Hello from me',
        lastMessageAt: messageData.timestamp,
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.conversation.upsert.mockResolvedValue(mockConversation);
      mockPrisma.message.create.mockResolvedValue({
        id: '2',
        ...messageData,
        conversationId: 'conv-1',
        status: null,
        mediaUrl: null,
        fileName: null,
        caption: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await repository.saveMessage(messageData);

      expect(mockPrisma.conversation.upsert).toHaveBeenCalledWith({
        where: {
          instanceId_remoteJid: {
            instanceId: 'instance-1',
            remoteJid: '123@c.us'
          }
        },
        create: {
          instanceId: 'instance-1',
          remoteJid: '123@c.us',
          isGroup: false, // remoteJid does not include '@g.us'
          lastMessage: 'Hello from me',
          lastMessageAt: messageData.timestamp,
          unreadCount: 0 // fromMe is true, so no increment
        },
        update: {
          lastMessage: 'Hello from me',
          lastMessageAt: messageData.timestamp,
          unreadCount: undefined, // fromMe is true, so no increment
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('getMessages', () => {
    it('should return messages for instance', async () => {
      const mockMessages = [
        {
          id: '1',
          instanceId: 'instance-1',
          remoteJid: '123@c.us',
          fromMe: false,
          messageType: 'text',
          content: 'Hello',
          mediaUrl: null,
          fileName: null,
          caption: null,
          messageId: 'msg-1',
          timestamp: new Date(),
          status: 'DELIVERED',
          conversationId: 'conv-1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.message.findMany.mockResolvedValue(mockMessages);

      const result = await repository.getMessages('instance-1', 50);

      expect(result).toEqual(mockMessages);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { instanceId: 'instance-1' },
        orderBy: { timestamp: 'desc' },
        take: 50
      });
    });

    it('should use default limit when not specified', async () => {
      const mockMessages: any[] = [];

      mockPrisma.message.findMany.mockResolvedValue(mockMessages);

      await repository.getMessages('instance-1');

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { instanceId: 'instance-1' },
        orderBy: { timestamp: 'desc' },
        take: 50
      });
    });
  });
});