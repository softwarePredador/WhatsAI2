import { prisma } from '../database/prisma';
import { 
  Campaign, 
  CampaignMessage, 
  CampaignProgress, 
  CampaignStats,
  Recipient 
} from '../types';
import { 
  CreateCampaignInput, 
  UpdateCampaignInput, 
  ListCampaignsQuery 
} from '../schemas/campaign-schemas';
import { templateService } from './template-service';
import { EventEmitter } from 'events';

export class CampaignService extends EventEmitter {
  private runningCampaigns: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Create a new campaign
   */
  async createCampaign(userId: string, data: CreateCampaignInput): Promise<Campaign> {
    // Verify instance belongs to user
    const instance = await prisma.whatsAppInstance.findFirst({
      where: {
        id: data.instanceId,
        userId
      }
    });

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    // If using template, verify it exists
    if (data.templateId) {
      const template = await templateService.getTemplateById(data.templateId, userId);
      if (!template) {
        throw new Error('Template não encontrado');
      }
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name: data.name,
        instanceId: data.instanceId,
        templateId: data.templateId,
        message: data.message,
        mediaUrl: data.mediaUrl || null,
        mediaType: data.mediaType || null,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        rateLimit: data.rateLimit || 10,
        totalRecipients: data.recipients.length,
        pendingCount: data.recipients.length,
        recipientsData: JSON.stringify(data.recipients),
        status: data.scheduledFor ? 'SCHEDULED' : 'DRAFT'
      }
    });

    // Create campaign messages
    await this.createCampaignMessages(campaign.id, data.recipients, data.message);

    return this.formatCampaign(campaign);
  }

  /**
   * Create campaign messages for all recipients
   */
  private async createCampaignMessages(
    campaignId: string,
    recipients: Recipient[],
    baseMessage: string
  ): Promise<void> {
    const messages = recipients.map(recipient => ({
      campaignId,
      recipient: recipient.phone,
      message: baseMessage,
      variables: recipient.variables ? JSON.stringify(recipient.variables) : null,
      status: 'PENDING'
    }));

    // Batch insert (500 at a time to avoid timeouts)
    const batchSize = 500;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      await prisma.campaignMessage.createMany({
        data: batch
      });
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string, userId: string): Promise<Campaign | null> {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId
      }
    });

    if (!campaign) {
      return null;
    }

    return this.formatCampaign(campaign);
  }

  /**
   * List campaigns with filters
   */
  async listCampaigns(userId: string, query: Partial<ListCampaignsQuery> = {}): Promise<{
    campaigns: Campaign[];
    total: number;
  }> {
    const {
      status,
      instanceId,
      search,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    // Build where clause
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (instanceId) {
      where.instanceId = instanceId;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Get total count
    const total = await prisma.campaign.count({ where });

    // Get campaigns
    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset
    });

    return {
      campaigns: campaigns.map(c => this.formatCampaign(c)),
      total
    };
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    campaignId: string,
    userId: string,
    data: UpdateCampaignInput
  ): Promise<Campaign | null> {
    // Check if campaign exists and belongs to user
    const existing = await this.getCampaignById(campaignId, userId);
    if (!existing) {
      return null;
    }

    // Can only update DRAFT or SCHEDULED campaigns
    if (!['DRAFT', 'SCHEDULED'].includes(existing.status)) {
      throw new Error('Apenas campanhas em rascunho ou agendadas podem ser editadas');
    }

    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.message) updateData.message = data.message;
    if (data.mediaUrl !== undefined) updateData.mediaUrl = data.mediaUrl || null;
    if (data.mediaType !== undefined) updateData.mediaType = data.mediaType || null;
    if (data.rateLimit) updateData.rateLimit = data.rateLimit;
    if (data.scheduledFor !== undefined) {
      updateData.scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;
      updateData.status = data.scheduledFor ? 'SCHEDULED' : 'DRAFT';
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: updateData
    });

    return this.formatCampaign(updated);
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string, userId: string): Promise<boolean> {
    const existing = await this.getCampaignById(campaignId, userId);
    if (!existing) {
      return false;
    }

    // Can only delete DRAFT, COMPLETED, or FAILED campaigns
    if (!['DRAFT', 'COMPLETED', 'FAILED'].includes(existing.status)) {
      throw new Error('Apenas campanhas em rascunho, completadas ou falhas podem ser excluídas');
    }

    await prisma.campaign.delete({
      where: { id: campaignId }
    });

    return true;
  }

  /**
   * Start campaign
   */
  async startCampaign(campaignId: string, userId: string): Promise<Campaign> {
    const campaign = await this.getCampaignById(campaignId, userId);
    if (!campaign) {
      throw new Error('Campanha não encontrada');
    }

    if (!['DRAFT', 'SCHEDULED', 'PAUSED'].includes(campaign.status)) {
      throw new Error('Campanha não pode ser iniciada');
    }

    // Update status
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    // Start sending messages
    this.processCampaign(campaignId);

    return this.formatCampaign(updated);
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string, userId: string): Promise<Campaign> {
    const campaign = await this.getCampaignById(campaignId, userId);
    if (!campaign) {
      throw new Error('Campanha não encontrada');
    }

    if (campaign.status !== 'RUNNING') {
      throw new Error('Apenas campanhas em execução podem ser pausadas');
    }

    // Stop processing
    const timer = this.runningCampaigns.get(campaignId);
    if (timer) {
      clearInterval(timer);
      this.runningCampaigns.delete(campaignId);
    }

    // Update status
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'PAUSED' }
    });

    return this.formatCampaign(updated);
  }

  /**
   * Cancel campaign
   */
  async cancelCampaign(campaignId: string, userId: string): Promise<Campaign> {
    const campaign = await this.getCampaignById(campaignId, userId);
    if (!campaign) {
      throw new Error('Campanha não encontrada');
    }

    // Stop processing
    const timer = this.runningCampaigns.get(campaignId);
    if (timer) {
      clearInterval(timer);
      this.runningCampaigns.delete(campaignId);
    }

    // Update status
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'FAILED',
        completedAt: new Date()
      }
    });

    return this.formatCampaign(updated);
  }

  /**
   * Get campaign progress
   */
  async getCampaignProgress(campaignId: string, userId: string): Promise<CampaignProgress> {
    const campaign = await this.getCampaignById(campaignId, userId);
    if (!campaign) {
      throw new Error('Campanha não encontrada');
    }

    const progress = campaign.totalRecipients > 0
      ? ((campaign.sentCount + campaign.failedCount) / campaign.totalRecipients) * 100
      : 0;

    // Estimate time remaining
    let estimatedTimeRemaining: number | undefined;
    let currentRate: number | undefined;

    if (campaign.status === 'RUNNING' && campaign.sentCount > 0 && campaign.startedAt) {
      const elapsedSeconds = (Date.now() - campaign.startedAt.getTime()) / 1000;
      currentRate = (campaign.sentCount / elapsedSeconds) * 60; // messages per minute
      
      if (currentRate > 0) {
        estimatedTimeRemaining = (campaign.pendingCount / currentRate) * 60; // seconds
      }
    }

    return {
      campaignId: campaign.id,
      status: campaign.status,
      progress: Math.round(progress * 100) / 100,
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
      deliveredCount: campaign.deliveredCount,
      failedCount: campaign.failedCount,
      pendingCount: campaign.pendingCount,
      estimatedTimeRemaining,
      currentRate
    };
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(userId: string): Promise<CampaignStats> {
    const [
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalMessages,
      deliveredMessages,
      recentCampaigns
    ] = await Promise.all([
      prisma.campaign.count({ where: { userId } }),
      prisma.campaign.count({ 
        where: { 
          userId, 
          status: { in: ['RUNNING', 'SCHEDULED', 'PAUSED'] } 
        } 
      }),
      prisma.campaign.count({ 
        where: { userId, status: 'COMPLETED' } 
      }),
      prisma.campaign.aggregate({
        where: { userId },
        _sum: { sentCount: true }
      }),
      prisma.campaign.aggregate({
        where: { userId },
        _sum: { deliveredCount: true }
      }),
      prisma.campaign.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    const totalMessagesSent = totalMessages._sum.sentCount || 0;
    const totalDelivered = deliveredMessages._sum.deliveredCount || 0;
    const averageDeliveryRate = totalMessagesSent > 0
      ? (totalDelivered / totalMessagesSent) * 100
      : 0;

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalMessagesSent,
      averageDeliveryRate: Math.round(averageDeliveryRate * 100) / 100,
      recentCampaigns: recentCampaigns.map(c => this.formatCampaign(c))
    };
  }

  /**
   * Process campaign (send messages)
   */
  private async processCampaign(campaignId: string): Promise<void> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { instance: true }
    });

    if (!campaign || campaign.status !== 'RUNNING') {
      return;
    }

    const messagesPerMinute = campaign.rateLimit;
    const intervalMs = (60 * 1000) / messagesPerMinute; // milliseconds between messages

    const timer = setInterval(async () => {
      try {
        // Get next pending message
        const message = await prisma.campaignMessage.findFirst({
          where: {
            campaignId,
            status: 'PENDING'
          },
          orderBy: { createdAt: 'asc' }
        });

        if (!message) {
          // No more pending messages, campaign completed
          clearInterval(timer);
          this.runningCampaigns.delete(campaignId);

          await prisma.campaign.update({
            where: { id: campaignId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date()
            }
          });

          this.emit('campaign:completed', { campaignId });
          return;
        }

        // Send message
        await this.sendCampaignMessage(message.id, campaign);

      } catch (error) {
        console.error(`Error processing campaign ${campaignId}:`, error);
      }
    }, intervalMs);

    this.runningCampaigns.set(campaignId, timer);
  }

  /**
   * Send a single campaign message
   */
  private async sendCampaignMessage(messageId: string, campaign: any): Promise<void> {
    const message = await prisma.campaignMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) return;

    console.log(`[CAMPAIGN] 📤 Enviando mensagem ${messageId} para ${message.recipient}`);

    try {
      // Render message with variables
      let finalMessage = message.message;
      if (message.variables) {
        const vars = JSON.parse(message.variables);
        finalMessage = templateService.renderTemplate(message.message, vars);
      }

      console.log(`[CAMPAIGN] 📝 Mensagem renderizada:`, finalMessage);

      // TODO: Send via Evolution API
      // For now, just simulate success
      console.warn(`[CAMPAIGN] ⚠️  SIMULANDO ENVIO - Evolution API não implementada ainda`);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update message status
      await prisma.campaignMessage.update({
        where: { id: messageId },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      });

      // Update campaign counters
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          sentCount: { increment: 1 },
          pendingCount: { decrement: 1 }
        }
      });

      this.emit('message:sent', { messageId, campaignId: campaign.id });

    } catch (error) {
      console.error(`Error sending message ${messageId}:`, error);

      // Update message status
      await prisma.campaignMessage.update({
        where: { id: messageId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: { increment: 1 }
        }
      });

      // Update campaign counters
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          failedCount: { increment: 1 },
          pendingCount: { decrement: 1 }
        }
      });

      this.emit('message:failed', { messageId, campaignId: campaign.id, error });
    }
  }

  /**
   * Format campaign from database to API format
   */
  private formatCampaign(campaign: any): Campaign {
    return {
      id: campaign.id,
      userId: campaign.userId,
      name: campaign.name,
      status: campaign.status,
      instanceId: campaign.instanceId,
      templateId: campaign.templateId || undefined,
      message: campaign.message,
      mediaUrl: campaign.mediaUrl || undefined,
      mediaType: campaign.mediaType || undefined,
      scheduledFor: campaign.scheduledFor || undefined,
      startedAt: campaign.startedAt || undefined,
      completedAt: campaign.completedAt || undefined,
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
      deliveredCount: campaign.deliveredCount,
      failedCount: campaign.failedCount,
      pendingCount: campaign.pendingCount,
      rateLimit: campaign.rateLimit,
      recipientsData: campaign.recipientsData ? JSON.parse(campaign.recipientsData) : undefined,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt
    };
  }
}

export const campaignService = new CampaignService();
