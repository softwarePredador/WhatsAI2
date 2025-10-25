import { PrismaClient } from '@prisma/client';

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

export interface CreateMessageData {
  instanceId: string;
  remoteJid: string;
  fromMe: boolean;
  messageType: string;
  content: string;
  messageId: string;
  timestamp: Date;
  status?: string; // Status da mensagem: PENDING, SENT, DELIVERED, READ, PLAYED, FAILED
  mediaUrl?: string;
  fileName?: string;
  caption?: string;
  conversationId?: string;
}

export interface UpdateMessageData {
  content?: string;
  mediaUrl?: string;
  fileName?: string;
  caption?: string;
}

export class MessageRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: { id }
    });
  }

  async findByInstanceId(instanceId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { instanceId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });
  }

  async findByConversation(instanceId: string, remoteJid: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { 
        instanceId,
        remoteJid 
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });
  }

  async findByRemoteJid(instanceId: string, remoteJid: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        instanceId,
        remoteJid
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });
  }

  async create(data: CreateMessageData): Promise<Message> {
    // Use upsert to avoid unique constraint errors if message already exists
    return this.prisma.message.upsert({
      where: { messageId: data.messageId },
      update: {
        content: data.content,
        updatedAt: new Date()
      },
      create: data
    });
  }

  async update(id: string, data: UpdateMessageData): Promise<Message> {
    return this.prisma.message.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.message.delete({
      where: { id }
    });
  }

  async deleteByInstanceId(instanceId: string): Promise<void> {
    await this.prisma.message.deleteMany({
      where: { instanceId }
    });
  }

  async findByMessageId(messageId: string): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: { messageId }
    });
  }

  async getMessageCount(instanceId: string): Promise<number> {
    return this.prisma.message.count({
      where: { instanceId }
    });
  }

  async getMessageCountByRemoteJid(instanceId: string, remoteJid: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        instanceId,
        remoteJid
      }
    });
  }

  async searchMessages(instanceId: string, query: string, limit: number = 50): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        instanceId,
        content: {
          contains: query
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }
}