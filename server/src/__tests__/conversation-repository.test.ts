import { ConversationRepository } from '../database/repositories/conversation-repository';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

const mockPrisma = mockDeep<PrismaClient>();

describe('ConversationRepository', () => {
  let repository: ConversationRepository;

  beforeEach(() => {
    mockReset(mockPrisma);
    repository = new ConversationRepository(mockPrisma);
  });

  describe('findById', () => {
    it('should return conversation when found', async () => {
      const mockConversation = {
        id: '1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        nickname: null,
        contactName: 'John Doe',
        contactPicture: null,
        isGroup: false,
        lastMessage: 'Hello',
        lastMessageAt: new Date(),
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await repository.findById('1');

      expect(result).toEqual(mockConversation);
      expect(mockPrisma.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });

    it('should return null when conversation not found', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
      expect(mockPrisma.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent' }
      });
    });
  });

  describe('findByInstanceId', () => {
    it('should return conversations for instance', async () => {
      const mockConversations = [
        {
          id: '1',
          instanceId: 'instance-1',
          remoteJid: '123@c.us',
          nickname: null,
          contactName: 'John Doe',
          contactPicture: null,
          isGroup: false,
          lastMessage: 'Hello',
          lastMessageAt: new Date(),
          unreadCount: 0,
          isArchived: false,
          isPinned: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.conversation.findMany.mockResolvedValue(mockConversations);

      const result = await repository.findByInstanceId('instance-1');

      expect(result).toEqual(mockConversations);
      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith({
        where: { 
          instanceId: 'instance-1',
          isArchived: false
        },
        orderBy: [
          { isPinned: 'desc' },
          { lastMessageAt: 'desc' }
        ],
        include: {
          messages: {
            orderBy: { timestamp: 'desc' },
            select: {
              content: true,
              fromMe: true,
              messageType: true,
              timestamp: true
            },
            take: 1
          }
        }
      });
    });
  });

  describe('findByInstanceAndRemoteJid', () => {
    it('should return conversation when found', async () => {
      const mockConversation = {
        id: '1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        nickname: null,
        contactName: 'John Doe',
        contactPicture: null,
        isGroup: false,
        lastMessage: 'Hello',
        lastMessageAt: new Date(),
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await repository.findByInstanceAndRemoteJid('instance-1', '123@c.us');

      expect(result).toEqual(mockConversation);
      expect(mockPrisma.conversation.findUnique).toHaveBeenCalledWith({
        where: {
          instanceId_remoteJid: {
            instanceId: 'instance-1',
            remoteJid: '123@c.us'
          }
        }
      });
    });

    it('should return null when conversation not found', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null);

      const result = await repository.findByInstanceAndRemoteJid('instance-1', 'nonexistent@c.us');

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithMessages', () => {
    it('should return conversation with messages', async () => {
      const mockConversation = {
        id: '1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        nickname: null,
        contactName: 'John Doe',
        contactPicture: null,
        isGroup: false,
        lastMessage: 'Hello',
        lastMessageAt: new Date(),
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          {
            id: 'msg-1',
            instanceId: 'instance-1',
            remoteJid: '123@c.us',
            fromMe: false,
            messageType: 'text',
            content: 'Hello',
            messageId: 'msg-id-1',
            timestamp: new Date(),
            status: 'DELIVERED',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await repository.findByIdWithMessages('1');

      expect(result).toEqual(mockConversation);
      expect(mockPrisma.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          messages: {
            orderBy: { timestamp: 'desc' },
            select: {
              id: true,
              fromMe: true,
              messageType: true,
              content: true,
              mediaUrl: true,
              fileName: true,
              caption: true,
              messageId: true,
              timestamp: true,
              status: true
            },
            take: 50,
            skip: 0
          }
        }
      });
    });
  });

  describe('create', () => {
    it('should create a new conversation', async () => {
      const createData = {
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        contactName: 'John Doe',
        contactPicture: 'http://example.com/picture.jpg',
        isGroup: false
      };

      const mockCreatedConversation = {
        id: '1',
        ...createData,
        nickname: null,
        lastMessage: null,
        lastMessageAt: new Date(),
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.conversation.create.mockResolvedValue(mockCreatedConversation);

      const result = await repository.create(createData);

      expect(result).toEqual(mockCreatedConversation);
      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          lastMessageAt: expect.any(Date)
        }
      });
    });
  });

  describe('update', () => {
    it('should update conversation', async () => {
      const updateData = {
        contactName: 'Jane Doe',
        lastMessage: 'Updated message'
      };

      const mockUpdatedConversation = {
        id: '1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        nickname: null,
        contactName: 'Jane Doe',
        contactPicture: null,
        isGroup: false,
        lastMessage: 'Updated message',
        lastMessageAt: new Date(),
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.conversation.update.mockResolvedValue(mockUpdatedConversation);

      const result = await repository.update('1', updateData);

      expect(result).toEqual(mockUpdatedConversation);
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('upsert', () => {
    it('should upsert conversation with contactName', async () => {
      const upsertData = {
        contactName: 'John Doe',
        contactPicture: 'http://example.com/picture.jpg',
        isGroup: false
      };

      const mockCreatedConversation = {
        id: '1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        nickname: null,
        contactName: 'John Doe',
        contactPicture: 'http://example.com/picture.jpg',
        isGroup: false,
        lastMessage: null,
        lastMessageAt: new Date(),
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.conversation.upsert.mockResolvedValue(mockCreatedConversation);

      const result = await repository.upsert('instance-1', '123@c.us', upsertData);

      expect(result).toEqual(mockCreatedConversation);
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
          contactName: 'John Doe',
          contactPicture: 'http://example.com/picture.jpg',
          isGroup: false,
          lastMessageAt: expect.any(Date)
        },
        update: {
          lastMessageAt: expect.any(Date),
          updatedAt: expect.any(Date),
          contactName: 'John Doe',
          contactPicture: 'http://example.com/picture.jpg'
        }
      });
    });

    it('should upsert conversation without optional fields', async () => {
      const upsertData = {};

      const mockUpsertedConversation = {
        id: '1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        nickname: null,
        contactName: null,
        contactPicture: null,
        isGroup: false,
        lastMessage: null,
        lastMessageAt: new Date(),
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.conversation.upsert.mockResolvedValue(mockUpsertedConversation);

      const result = await repository.upsert('instance-1', '123@c.us', upsertData);

      expect(result).toEqual(mockUpsertedConversation);
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
          contactName: null,
          contactPicture: null,
          isGroup: false,
          lastMessageAt: expect.any(Date)
        },
        update: {
          lastMessageAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark conversation as read', async () => {
      const mockUpdatedConversation = {
        id: '1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        nickname: null,
        contactName: 'John Doe',
        contactPicture: null,
        isGroup: false,
        lastMessage: 'Hello',
        lastMessageAt: new Date(),
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.conversation.update.mockResolvedValue(mockUpdatedConversation);

      const result = await repository.markAsRead('1');

      expect(result).toEqual(mockUpdatedConversation);
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          unreadCount: 0,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('incrementUnreadCount', () => {
    it('should increment unread count', async () => {
      const mockUpdatedConversation = {
        id: '1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        nickname: null,
        contactName: 'John Doe',
        contactPicture: null,
        isGroup: false,
        lastMessage: 'Hello',
        lastMessageAt: new Date(),
        unreadCount: 1,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.conversation.update.mockResolvedValue(mockUpdatedConversation);

      const result = await repository.incrementUnreadCount('1');

      expect(result).toEqual(mockUpdatedConversation);
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          unreadCount: {
            increment: 1
          },
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('archive', () => {
    it('should archive conversation', async () => {
      const mockUpdatedConversation = {
        id: '1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        nickname: null,
        contactName: 'John Doe',
        contactPicture: null,
        isGroup: false,
        lastMessage: 'Hello',
        lastMessageAt: new Date(),
        unreadCount: 0,
        isArchived: true,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.conversation.update.mockResolvedValue(mockUpdatedConversation);

      const result = await repository.archive('1');

      expect(result).toEqual(mockUpdatedConversation);
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isArchived: true,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('pin', () => {
    it('should pin conversation', async () => {
      const mockUpdatedConversation = {
        id: '1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        nickname: null,
        contactName: 'John Doe',
        contactPicture: null,
        isGroup: false,
        lastMessage: 'Hello',
        lastMessageAt: new Date(),
        unreadCount: 0,
        isArchived: false,
        isPinned: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.conversation.update.mockResolvedValue(mockUpdatedConversation);

      const result = await repository.pin('1');

      expect(result).toEqual(mockUpdatedConversation);
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isPinned: true,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('unpin', () => {
    it('should unpin conversation', async () => {
      const mockUpdatedConversation = {
        id: '1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        nickname: null,
        contactName: 'John Doe',
        contactPicture: null,
        isGroup: false,
        lastMessage: 'Hello',
        lastMessageAt: new Date(),
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.conversation.update.mockResolvedValue(mockUpdatedConversation);

      const result = await repository.unpin('1');

      expect(result).toEqual(mockUpdatedConversation);
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isPinned: false,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('delete', () => {
    it('should delete conversation', async () => {
      mockPrisma.conversation.delete.mockResolvedValue({
        id: '1',
        instanceId: 'instance-1',
        remoteJid: '123@c.us',
        nickname: null,
        contactName: 'John Doe',
        contactPicture: null,
        isGroup: false,
        lastMessage: 'Hello',
        lastMessageAt: new Date(),
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await repository.delete('1');

      expect(mockPrisma.conversation.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });
  });

  describe('getArchivedConversations', () => {
    it('should return archived conversations', async () => {
      const mockArchivedConversations = [
        {
          id: '1',
          instanceId: 'instance-1',
          remoteJid: '123@c.us',
          nickname: null,
          contactName: 'John Doe',
          contactPicture: null,
          isGroup: false,
          lastMessage: 'Hello',
          lastMessageAt: new Date(),
          unreadCount: 0,
          isArchived: true,
          isPinned: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.conversation.findMany.mockResolvedValue(mockArchivedConversations);

      const result = await repository.getArchivedConversations('instance-1');

      expect(result).toEqual(mockArchivedConversations);
      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith({
        where: {
          instanceId: 'instance-1',
          isArchived: true
        },
        orderBy: { updatedAt: 'desc' }
      });
    });
  });
});