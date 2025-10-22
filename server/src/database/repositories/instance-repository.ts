import { prisma } from '../../database/prisma';
import { WhatsAppInstance, InstanceStatus } from '../../types';
import { Prisma } from '@prisma/client';

export class PrismaInstanceRepository {
  async create(data: {
    name: string;
    userId: string;
    evolutionInstanceName: string;
    evolutionApiUrl: string;
    evolutionApiKey: string;
    webhook?: string;
  }): Promise<WhatsAppInstance> {
    const instance = await prisma.whatsAppInstance.create({
      data: {
        name: data.name,
        userId: data.userId,
        evolutionInstanceName: data.evolutionInstanceName,
        evolutionApiUrl: data.evolutionApiUrl,
        evolutionApiKey: data.evolutionApiKey,
        webhook: data.webhook || null,
        status: 'PENDING',
        connected: false,
      },
    });

    return this.mapToWhatsAppInstance(instance);
  }

  async findAll(): Promise<WhatsAppInstance[]> {
    const instances = await prisma.whatsAppInstance.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return instances.map(this.mapToWhatsAppInstance);
  }

  async findById(id: string): Promise<WhatsAppInstance | null> {
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id },
    });

    return instance ? this.mapToWhatsAppInstance(instance) : null;
  }

  async findByEvolutionName(evolutionInstanceName: string): Promise<WhatsAppInstance | null> {
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { evolutionInstanceName },
    });

    return instance ? this.mapToWhatsAppInstance(instance) : null;
  }

  async update(id: string, data: Partial<WhatsAppInstance>): Promise<WhatsAppInstance> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name) updateData.name = data.name;
    if (data.status) updateData.status = data.status;
    if (data.connected !== undefined) updateData.connected = data.connected;
    if (data.webhook) updateData.webhook = data.webhook;
    if (data.qrCode) updateData.qrCode = data.qrCode;
    if (data.lastSeen) updateData.lastSeen = data.lastSeen;
    if (data.connectedAt) updateData.connectedAt = data.connectedAt;

    const instance = await prisma.whatsAppInstance.update({
      where: { id },
      data: updateData,
    });

    return this.mapToWhatsAppInstance(instance);
  }

  async updateStatus(id: string, status: InstanceStatus, connected: boolean = false): Promise<void> {
    const updateData: any = {
      status: status,
      connected,
      updatedAt: new Date(),
    };

    if (connected) {
      updateData.connectedAt = new Date();
    }

    await prisma.whatsAppInstance.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.whatsAppInstance.delete({
      where: { id },
    });
  }

  async saveMessage(data: {
    instanceId: string;
    remoteJid: string;
    fromMe: boolean;
    messageType: string;
    content: string;
    messageId: string;
    timestamp: Date;
    mediaUrl?: string;
    fileName?: string;
    caption?: string;
  }): Promise<void> {
    await prisma.message.create({
      data: {
        instanceId: data.instanceId,
        remoteJid: data.remoteJid,
        fromMe: data.fromMe,
        messageType: data.messageType as any,
        content: data.content,
        messageId: data.messageId,
        timestamp: data.timestamp,
        mediaUrl: data.mediaUrl || null,
        fileName: data.fileName || null,
        caption: data.caption || null,
      },
    });
  }

  async getMessages(instanceId: string, limit: number = 50): Promise<any[]> {
    const messages = await prisma.message.findMany({
      where: { instanceId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return messages;
  }

  private mapToWhatsAppInstance(instance: any): WhatsAppInstance {
    return {
      id: instance.id,
      name: instance.name,
      apiKey: instance.evolutionApiKey,
      serverUrl: instance.evolutionApiUrl,
      status: instance.status as InstanceStatus,
      qrCode: instance.qrCode,
      connected: instance.connected,
      lastSeen: instance.lastSeen,
      connectedAt: instance.connectedAt,
      webhook: instance.webhook,
      evolutionInstanceName: instance.evolutionInstanceName,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
    };
  }
}