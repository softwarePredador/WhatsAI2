import { prisma } from '../database/prisma';
import { MessageChartData, InstanceStatusData, CostData, UserActivityData, ActivityLog } from '../types';

export class DashboardService {
  /**
   * Get comprehensive dashboard metrics for a user
   */
  async getMetrics(userId: string, userRole: string) {
    // Get user's instances
    const userInstances = await prisma.whatsAppInstance.findMany({
      where: { userId },
      select: { id: true }
    });

    const instanceIds = userInstances.map(inst => inst.id);

    // Parallel queries for better performance
    const [
      totalMessages,
      activeInstances,
      totalUsers,
      totalConversations,
      mediaMessages,
      deliveredMessages
    ] = await Promise.all([
      // Total messages sent by user's instances
      prisma.message.count({
        where: { instanceId: { in: instanceIds } }
      }),

      // Active instances (connected status)
      prisma.whatsAppInstance.count({
        where: {
          userId,
          status: 'CONNECTED'
        }
      }),

      // Total users (for admin, or just current user)
      userRole === 'ADMIN'
        ? prisma.user.count()
        : 1,

      // Total conversations
      prisma.conversation.count({
        where: { instanceId: { in: instanceIds } }
      }),

      // Messages with media
      prisma.message.count({
        where: {
          instanceId: { in: instanceIds },
          mediaUrl: { not: null }
        }
      }),

      // Delivered messages
      prisma.message.count({
        where: {
          instanceId: { in: instanceIds },
          status: 'DELIVERED'
        }
      })
    ]);

    // Calculate delivery rate
    const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;

    // Calculate costs (Evolution API + Storage)
    const costs = {
      evolutionApi: activeInstances * 10, // $10 per instance/month
      storage: mediaMessages * 0.01, // $0.01 per media message
      total: activeInstances * 10 + mediaMessages * 0.01
    };

    return {
      totalMessages,
      activeInstances,
      totalUsers,
      totalConversations,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      storageUsed: mediaMessages * 1024 * 1024, // ~1MB per media
      costs
    };
  }

  /**
   * Get message chart data for the last N days
   */
  async getMessageChartData(userId: string, days: number = 7): Promise<MessageChartData[]> {
    // Get user's instances
    const userInstances = await prisma.whatsAppInstance.findMany({
      where: { userId },
      select: { id: true }
    });

    const instanceIds = userInstances.map(inst => inst.id);

    if (instanceIds.length === 0) {
      return this.fillMissingDates([], days);
    }

    // Get messages from the last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const messages = await prisma.message.findMany({
      where: {
        instanceId: { in: instanceIds },
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        status: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group by date
    const groupedData = new Map<string, { total: number; delivered: number; failed: number }>();

    messages.forEach(message => {
      const dateStr = message.createdAt.toISOString().split('T')[0];
      if (!dateStr) return;

      const current = groupedData.get(dateStr) || { total: 0, delivered: 0, failed: 0 };
      current.total++;
      
      if (message.status === 'DELIVERED') current.delivered++;
      if (message.status === 'FAILED') current.failed++;

      groupedData.set(dateStr, current);
    });

    // Convert to array
    const chartData: MessageChartData[] = Array.from(groupedData.entries()).map(([date, counts]) => ({
      date,
      messages: counts.total,
      delivered: counts.delivered,
      failed: counts.failed
    }));

    // Fill missing dates
    return this.fillMissingDates(chartData, days);
  }

  /**
   * Get instance status breakdown
   */
  async getInstanceStatusData(userId: string): Promise<InstanceStatusData[]> {
    const instances = await prisma.whatsAppInstance.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        status: true
      }
    });

    // Map and group by the mapped status
    const statusGroups = new Map<'online' | 'offline' | 'connecting', number>();
    
    instances.forEach(group => {
      const mappedStatus = this.mapInstanceStatus(group.status);
      const currentCount = statusGroups.get(mappedStatus) || 0;
      statusGroups.set(mappedStatus, currentCount + group._count.status);
    });

    const totalCount = Array.from(statusGroups.values()).reduce((sum, count) => sum + count, 0);

    return Array.from(statusGroups.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0
    }));
  }

  /**
   * Get cost breakdown by month
   */
  async getCostData(userId: string, months: number = 6): Promise<CostData[]> {
    const costData: CostData[] = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      
      const monthStr = monthDate.toISOString().substring(0, 7); // YYYY-MM

      // Get instances active during this month
      const instancesCount = await prisma.whatsAppInstance.count({
        where: {
          userId,
          createdAt: { lt: nextMonth }
        }
      });

      // Get media messages from this month
      const mediaCount = await prisma.message.count({
        where: {
          instance: { userId },
          mediaUrl: { not: null },
          createdAt: {
            gte: monthDate,
            lt: nextMonth
          }
        }
      });

      costData.push({
        month: monthStr,
        evolutionApi: instancesCount * 10,
        storage: mediaCount * 0.01,
        total: instancesCount * 10 + mediaCount * 0.01
      });
    }

    return costData;
  }

  /**
   * Get user activity over time
   */
  async getUserActivityData(userId: string, days: number = 30): Promise<UserActivityData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get unique users who sent messages (for admin view)
    const messagesWithUsers = await prisma.message.groupBy({
      by: ['createdAt'],
      where: {
        instance: { userId },
        createdAt: { gte: startDate }
      },
      _count: {
        id: true
      }
    });

    // Group by date
    const groupedData = new Map<string, { activeUsers: number; newUsers: number }>();

    messagesWithUsers.forEach(msg => {
      const dateStr = msg.createdAt.toISOString().split('T')[0];
      if (!dateStr) return;
      
      const current = groupedData.get(dateStr) || { activeUsers: 0, newUsers: 0 };
      current.activeUsers++; // Count unique activity
      groupedData.set(dateStr, current);
    });

    // Convert to array
    const activityData: UserActivityData[] = Array.from(groupedData.entries()).map(([date, counts]) => ({
      date,
      activeUsers: counts.activeUsers,
      newUsers: counts.newUsers
    }));

    // Fill missing dates
    return this.fillMissingActivityDates(activityData, days);
  }

  /**
   * Get recent activity log (last 50 events)
   */
  async getActivityLog(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    // Get recent messages
    const recentMessages = await prisma.message.findMany({
      where: {
        instance: { userId }
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        status: true,
        instance: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return recentMessages.map(msg => ({
      id: msg.id,
      type: 'message' as const,
      timestamp: msg.createdAt,
      description: `Mensagem ${msg.status?.toLowerCase() || 'enviada'} - ${msg.instance.name}`,
      instanceId: msg.instance.id,
      metadata: {
        status: msg.status,
        content: msg.content?.substring(0, 50)
      }
    }));
  }

  /**
   * Get peak usage hours for the last 7 days
   */
  async getPeakUsageHours(userId: string): Promise<{ hour: number; count: number }[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const messages = await prisma.message.findMany({
      where: {
        instance: { userId },
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        createdAt: true
      }
    });

    // Group by hour
    const hourCounts = new Map<number, number>();
    
    messages.forEach(msg => {
      const hour = msg.createdAt.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    return Array.from(hourCounts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Get conversation response time stats
   */
  async getResponseTimeStats(userId: string) {
    // Get conversations with messages
    const userInstances = await prisma.whatsAppInstance.findMany({
      where: { userId },
      select: { id: true }
    });

    const instanceIds = userInstances.map(inst => inst.id);

    const conversations = await prisma.conversation.findMany({
      where: {
        instanceId: { in: instanceIds }
      },
      select: {
        messages: {
          select: {
            createdAt: true,
            fromMe: true
          },
          orderBy: {
            createdAt: 'asc'
          },
          take: 100 // Limit for performance
        }
      },
      take: 50 // Analyze last 50 conversations
    });

    const responseTimes: number[] = [];

    conversations.forEach(conv => {
      for (let i = 1; i < conv.messages.length; i++) {
        const prevMsg = conv.messages[i - 1];
        const currMsg = conv.messages[i];

        // If previous was from customer and current is from us
        if (prevMsg && currMsg && !prevMsg.fromMe && currMsg.fromMe) {
          const diff = currMsg.createdAt.getTime() - prevMsg.createdAt.getTime();
          responseTimes.push(diff / 1000 / 60); // Convert to minutes
        }
      }
    });

    if (responseTimes.length === 0) {
      return { average: 0, median: 0, min: 0, max: 0 };
    }

    responseTimes.sort((a, b) => a - b);

    return {
      average: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      median: responseTimes[Math.floor(responseTimes.length / 2)],
      min: responseTimes[0],
      max: responseTimes[responseTimes.length - 1]
    };
  }

  // Helper methods

  private fillMissingDates(data: MessageChartData[], days: number): MessageChartData[] {
    const result = [...data];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0] || '';

      if (!result.find(d => d.date === dateStr)) {
        result.push({ date: dateStr, messages: 0, delivered: 0, failed: 0 });
      }
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  private fillMissingActivityDates(data: UserActivityData[], days: number): UserActivityData[] {
    const result = [...data];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0] || '';

      if (!result.find(d => d.date === dateStr)) {
        result.push({ date: dateStr, activeUsers: 0, newUsers: 0 });
      }
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  private mapInstanceStatus(status: string): 'online' | 'offline' | 'connecting' {
    const statusMap: Record<string, 'online' | 'offline' | 'connecting'> = {
      'CONNECTED': 'online',
      'CONNECTING': 'connecting',
      'DISCONNECTED': 'offline',
      'QRCODE': 'connecting'
    };
    return statusMap[status] || 'offline';
  }
}

export const dashboardService = new DashboardService();
