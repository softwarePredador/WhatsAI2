import { PrismaClient } from '@prisma/client';

type Conversation = {
  id: string;
  instanceId: string;
  remoteJid: string;
  contactName?: string | null;
  contactPicture?: string | null;
  isGroup: boolean;
  lastMessage?: string | null;
  lastMessageAt?: Date | null;
  unreadCount: number;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type Message = {
  id: string;
  instanceId: string;
  remoteJid: string;
  fromMe: boolean;
  messageType: string;
  content: string;
  mediaUrl?: string | null;
  fileName?: string | null;
  caption?: string | null;
  messageId: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  conversationId?: string | null;
};

export interface ConversationWithMessages {
  id: string;
  instanceId: string;
  remoteJid: string;
  contactName?: string | null;
  contactPicture?: string | null;
  isGroup: boolean;
  lastMessage?: string | null;
  lastMessageAt?: Date | null;
  unreadCount: number;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface CreateConversationData {
  instanceId: string;
  remoteJid: string;
  contactName?: string;
  contactPicture?: string;
  isGroup?: boolean;
}

export interface UpdateConversationData {
  contactName?: string;
  contactPicture?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount?: number;
  isArchived?: boolean;
  isPinned?: boolean;
}

export class ConversationRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(conversationId: string): Promise<Conversation | null> {
    return (this.prisma as any).conversation.findUnique({
      where: { id: conversationId }
    });
  }

  async findByInstanceId(instanceId: string): Promise<Conversation[]> {
    console.log('🔍 [ConversationRepository] findByInstanceId chamado com instanceId:', instanceId);

    const result = await (this.prisma as any).conversation.findMany({
      where: {
        instanceId,
        isArchived: false
      },
      orderBy: [
        { isPinned: 'desc' },
        { lastMessageAt: 'desc' }
      ],
      include: {
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' },
          select: {
            content: true,
            fromMe: true,
            timestamp: true,
            messageType: true
          }
        }
      }
    });

    console.log('🔍 [ConversationRepository] Conversas encontradas (não arquivadas):', result.length);

    // Também verificar quantas conversas arquivadas existem
    const archivedCount = await (this.prisma as any).conversation.count({
      where: {
        instanceId,
        isArchived: true
      }
    });
    console.log('🔍 [ConversationRepository] Conversas arquivadas:', archivedCount);

    return result;
  }

  async findAllByInstanceId(instanceId: string): Promise<Conversation[]> {
    const result = await (this.prisma as any).conversation.findMany({
      where: {
        instanceId
      },
      orderBy: [
        { isPinned: 'desc' },
        { lastMessageAt: 'desc' }
      ]
    });

    return result;
  }

  async findByIdWithMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<ConversationWithMessages | null> {
    return (this.prisma as any).conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          take: limit,
          skip: offset,
          orderBy: { timestamp: 'desc' },
          select: {
            id: true,
            content: true,
            fromMe: true,
            messageType: true,
            timestamp: true,
            messageId: true,
            status: true,
            mediaUrl: true,
            fileName: true,
            caption: true
          }
        }
      }
    });
  }

  async create(data: CreateConversationData): Promise<Conversation> {
    return (this.prisma as any).conversation.create({
      data: {
        ...data,
        lastMessageAt: new Date()
      }
    });
  }

  async update(id: string, data: UpdateConversationData): Promise<Conversation> {
    return (this.prisma as any).conversation.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async upsert(instanceId: string, remoteJid: string, data: Partial<CreateConversationData>): Promise<Conversation> {
    // Prepare update data - only include fields that have values
    const updateData: any = {
      lastMessageAt: new Date(),
      updatedAt: new Date()
    };
    
    // Only update contactName if provided and not null
    if (data.contactName) {
      updateData.contactName = data.contactName;
    }
    
    // Only update contactPicture if provided and not null
    if (data.contactPicture) {
      updateData.contactPicture = data.contactPicture;
    }
    
    return (this.prisma as any).conversation.upsert({
      where: {
        instanceId_remoteJid: {
          instanceId,
          remoteJid
        }
      },
      create: {
        instanceId,
        remoteJid,
        contactName: data.contactName || null,
        contactPicture: data.contactPicture || null,
        isGroup: data.isGroup || false,
        lastMessageAt: new Date()
      },
      update: updateData
    });
  }

  async markAsRead(id: string): Promise<Conversation> {
    return (this.prisma as any).conversation.update({
      where: { id },
      data: {
        unreadCount: 0,
        updatedAt: new Date()
      }
    });
  }

  async incrementUnreadCount(id: string): Promise<Conversation> {
    return (this.prisma as any).conversation.update({
      where: { id },
      data: {
        unreadCount: {
          increment: 1
        },
        updatedAt: new Date()
      }
    });
  }

  async archive(id: string): Promise<Conversation> {
    return (this.prisma as any).conversation.update({
      where: { id },
      data: {
        isArchived: true,
        updatedAt: new Date()
      }
    });
  }

  async pin(id: string): Promise<Conversation> {
    return (this.prisma as any).conversation.update({
      where: { id },
      data: {
        isPinned: true,
        updatedAt: new Date()
      }
    });
  }

  async unpin(id: string): Promise<Conversation> {
    return (this.prisma as any).conversation.update({
      where: { id },
      data: {
        isPinned: false,
        updatedAt: new Date()
      }
    });
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).conversation.delete({
      where: { id }
    });
  }

  async getArchivedConversations(instanceId: string): Promise<Conversation[]> {
    return (this.prisma as any).conversation.findMany({
      where: {
        instanceId,
        isArchived: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
}