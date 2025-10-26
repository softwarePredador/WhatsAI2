import { MessageRepository, CreateMessageData, UpdateMessageData } from '../database/repositories/message-repository';

jest.mock('../database/prisma', () => ({
  prisma: {
    message: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  }
}));

const mockPrisma = jest.mocked(require('../database/prisma').prisma);

describe('MessageRepository', () => {
  let repository: MessageRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new MessageRepository(mockPrisma);
  });

  describe('findById', () => {
    it('should return message when found', async () => {
      const mockMessage = {
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
        createdAt: new Date(),
        updatedAt: new Date(),
        conversationId: 'conv-1'
      };

      mockPrisma.message.findUnique.mockResolvedValue(mockMessage);

      const result = await repository.findById('1');

      expect(result).toEqual(mockMessage);
      expect(mockPrisma.message.findUnique).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });

    it('should return null when message not found', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
      expect(mockPrisma.message.findUnique).toHaveBeenCalledWith({
        where: { id: '999' }
      });
    });
  });

  describe('findByInstanceId', () => {
    it('should return messages for instance with default parameters', async () => {
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
          createdAt: new Date(),
          updatedAt: new Date(),
          conversationId: 'conv-1'
        }
      ];

      mockPrisma.message.findMany.mockResolvedValue(mockMessages);

      const result = await repository.findByInstanceId('instance-1');

      expect(result).toEqual(mockMessages);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { instanceId: 'instance-1' },
        orderBy: { timestamp: 'desc' },
        take: 50,
        skip: 0
      });
    });

    it('should return messages with custom limit and offset', async () => {
      const mockMessages: any[] = [];

      mockPrisma.message.findMany.mockResolvedValue(mockMessages);

      const result = await repository.findByInstanceId('instance-1', 20, 10);

      expect(result).toEqual(mockMessages);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { instanceId: 'instance-1' },
        orderBy: { timestamp: 'desc' },
        take: 20,
        skip: 10
      });
    });
  });

  describe('findByConversation', () => {
    it('should return messages for conversation', async () => {
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
          createdAt: new Date(),
          updatedAt: new Date(),
          conversationId: 'conv-1'
        }
      ];

      mockPrisma.message.findMany.mockResolvedValue(mockMessages);

      const result = await repository.findByConversation('instance-1', '123@c.us');

      expect(result).toEqual(mockMessages);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: {
          instanceId: 'instance-1',
          remoteJid: '123@c.us'
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
        skip: 0
      });
    });
  });

  describe('findByRemoteJid', () => {
    it('should return messages for remoteJid', async () => {
      const mockMessages: any[] = [];

      mockPrisma.message.findMany.mockResolvedValue(mockMessages);

      const result = await repository.findByRemoteJid('instance-1', '123@c.us', 30, 5);

      expect(result).toEqual(mockMessages);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: {
          instanceId: 'instance-1',
          remoteJid: '123@c.us'
        },
        orderBy: { timestamp: 'desc' },
        take: 30,
        skip: 5
      });
    });
  });

  describe('create', () => {
    it('should create a new message', async () => {
      const createData: CreateMessageData = {
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        fromMe: false,
        messageType: 'text',
        content: 'Hello World',
        messageId: 'msg-1',
        timestamp: new Date(),
        status: 'PENDING'
      };

      const mockCreatedMessage = {
        id: '1',
        ...createData,
        mediaUrl: null,
        fileName: null,
        caption: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversationId: null
      };

      mockPrisma.message.upsert.mockResolvedValue(mockCreatedMessage);

      const result = await repository.create(createData);

      expect(result).toEqual(mockCreatedMessage);
      expect(mockPrisma.message.upsert).toHaveBeenCalledWith({
        where: { messageId: 'msg-1' },
        update: {
          content: 'Hello World',
          updatedAt: expect.any(Date)
        },
        create: createData
      });
    });

    it('should create message with optional fields', async () => {
      const createData: CreateMessageData = {
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        fromMe: true,
        messageType: 'image',
        content: 'Image message',
        messageId: 'msg-2',
        timestamp: new Date(),
        mediaUrl: 'http://example.com/image.jpg',
        fileName: 'image.jpg',
        caption: 'Test image'
      };

      const mockCreatedMessage = {
        id: '2',
        ...createData,
        status: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversationId: null
      };

      mockPrisma.message.upsert.mockResolvedValue(mockCreatedMessage);

      const result = await repository.create(createData);

      expect(result).toEqual(mockCreatedMessage);
      expect(mockPrisma.message.upsert).toHaveBeenCalledWith({
        where: { messageId: 'msg-2' },
        update: {
          content: 'Image message',
          updatedAt: expect.any(Date)
        },
        create: createData
      });
    });
  });

  describe('update', () => {
    it('should update message with all fields', async () => {
      const updateData: UpdateMessageData = {
        content: 'Updated content',
        mediaUrl: 'http://example.com/new-image.jpg',
        fileName: 'new-image.jpg',
        caption: 'Updated caption',
        status: 'DELIVERED'
      };

      const mockUpdatedMessage = {
        id: '1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        fromMe: false,
        messageType: 'image',
        content: 'Updated content',
        mediaUrl: 'http://example.com/new-image.jpg',
        fileName: 'new-image.jpg',
        caption: 'Updated caption',
        messageId: 'msg-1',
        timestamp: new Date(),
        status: 'DELIVERED',
        createdAt: new Date(),
        updatedAt: new Date(),
        conversationId: 'conv-1'
      };

      mockPrisma.message.update.mockResolvedValue(mockUpdatedMessage);

      const result = await repository.update('1', updateData);

      expect(result).toEqual(mockUpdatedMessage);
      expect(mockPrisma.message.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should update message with partial fields', async () => {
      const updateData: UpdateMessageData = {
        status: 'READ'
      };

      const mockUpdatedMessage = {
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
        status: 'READ',
        createdAt: new Date(),
        updatedAt: new Date(),
        conversationId: 'conv-1'
      };

      mockPrisma.message.update.mockResolvedValue(mockUpdatedMessage);

      const result = await repository.update('1', updateData);

      expect(result).toEqual(mockUpdatedMessage);
      expect(mockPrisma.message.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('delete', () => {
    it('should delete message', async () => {
      mockPrisma.message.delete.mockResolvedValue({
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
        createdAt: new Date(),
        updatedAt: new Date(),
        conversationId: 'conv-1'
      });

      await repository.delete('1');

      expect(mockPrisma.message.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });
  });

  describe('deleteByInstanceId', () => {
    it('should delete all messages for instance', async () => {
      mockPrisma.message.deleteMany.mockResolvedValue({ count: 5 });

      await repository.deleteByInstanceId('instance-1');

      expect(mockPrisma.message.deleteMany).toHaveBeenCalledWith({
        where: { instanceId: 'instance-1' }
      });
    });
  });

  describe('findByMessageId', () => {
    it('should return message when found by messageId', async () => {
      const mockMessage = {
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
        createdAt: new Date(),
        updatedAt: new Date(),
        conversationId: 'conv-1'
      };

      mockPrisma.message.findUnique.mockResolvedValue(mockMessage);

      const result = await repository.findByMessageId('msg-1');

      expect(result).toEqual(mockMessage);
      expect(mockPrisma.message.findUnique).toHaveBeenCalledWith({
        where: { messageId: 'msg-1' }
      });
    });

    it('should return null when message not found by messageId', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(null);

      const result = await repository.findByMessageId('non-existent');

      expect(result).toBeNull();
      expect(mockPrisma.message.findUnique).toHaveBeenCalledWith({
        where: { messageId: 'non-existent' }
      });
    });
  });

  describe('getMessageCount', () => {
    it('should return message count for instance', async () => {
      mockPrisma.message.count.mockResolvedValue(25);

      const result = await repository.getMessageCount('instance-1');

      expect(result).toBe(25);
      expect(mockPrisma.message.count).toHaveBeenCalledWith({
        where: { instanceId: 'instance-1' }
      });
    });
  });

  describe('getMessageCountByRemoteJid', () => {
    it('should return message count for remoteJid', async () => {
      mockPrisma.message.count.mockResolvedValue(10);

      const result = await repository.getMessageCountByRemoteJid('instance-1', '123@c.us');

      expect(result).toBe(10);
      expect(mockPrisma.message.count).toHaveBeenCalledWith({
        where: {
          instanceId: 'instance-1',
          remoteJid: '123@c.us'
        }
      });
    });
  });

  describe('searchMessages', () => {
    it('should return messages matching search query', async () => {
      const mockMessages = [
        {
          id: '1',
          instanceId: 'instance-1',
          remoteJid: '123@c.us',
          fromMe: false,
          messageType: 'text',
          content: 'Hello World',
          mediaUrl: null,
          fileName: null,
          caption: null,
          messageId: 'msg-1',
          timestamp: new Date(),
          status: 'DELIVERED',
          createdAt: new Date(),
          updatedAt: new Date(),
          conversationId: 'conv-1'
        }
      ];

      mockPrisma.message.findMany.mockResolvedValue(mockMessages);

      const result = await repository.searchMessages('instance-1', 'Hello');

      expect(result).toEqual(mockMessages);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: {
          instanceId: 'instance-1',
          content: {
            contains: 'Hello'
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 50
      });
    });

    it('should use custom limit for search', async () => {
      const mockMessages: any[] = [];

      mockPrisma.message.findMany.mockResolvedValue(mockMessages);

      const result = await repository.searchMessages('instance-1', 'test', 20);

      expect(result).toEqual(mockMessages);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: {
          instanceId: 'instance-1',
          content: {
            contains: 'test'
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 20
      });
    });
  });
});