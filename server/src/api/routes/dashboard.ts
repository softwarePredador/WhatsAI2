import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth-middleware';
import { MessageChartData, InstanceStatusData, CostData, UserActivityData, ActivityLog } from '../../types';
import { prisma } from '../../database/prisma';

const router = Router();

// All dashboard routes require authentication
router.use(authMiddleware);

// GET /api/dashboard/metrics - Get dashboard metrics
router.get('/metrics', async (req, res) => {
  try {
    // Get user from auth middleware
    const userId = req.userId;
    const userRole = req.userRole;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Get user's instances first
    const userInstances = await prisma.whatsAppInstance.findMany({
      where: { userId: userId },
      select: { id: true }
    });

    const instanceIds = userInstances.map(inst => inst.id);

    // Calculate real metrics
    const [
      totalMessages,
      activeInstances,
      totalUsers,
      totalConversations,
      storageStats
    ] = await Promise.all([
      // Total messages sent by user's instances
      prisma.message.count({
        where: { instanceId: { in: instanceIds } }
      }),

      // Active instances (connected status)
      prisma.whatsAppInstance.count({
        where: {
          userId: userId,
          status: 'CONNECTED'
        }
      }),

      // Total users (for admin, or just current user)
      userRole === 'ADMIN'
        ? prisma.user.count()
        : prisma.user.count({ where: { id: userId } }),

      // Total conversations
      prisma.conversation.count({
        where: { instanceId: { in: instanceIds } }
      }),

      // Storage stats (messages with media)
      prisma.message.count({
        where: {
          instanceId: { in: instanceIds },
          mediaUrl: { not: null }
        }
      })
    ]);

    // Calculate delivery rate (messages delivered / total messages)
    const deliveredMessages = await prisma.message.count({
      where: {
        instanceId: { in: instanceIds },
        status: 'DELIVERED'
      }
    });

    const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;

    // Calculate costs (mock for now - TODO: implement real cost calculation)
    const costs = {
      evolutionApi: activeInstances * 10, // $10 per active instance per month
      storage: storageStats * 0.01, // $0.01 per media message
      total: activeInstances * 10 + storageStats * 0.01
    };

    const metrics = {
      totalMessages,
      activeInstances,
      totalUsers: userRole === 'ADMIN' ? totalUsers : 1,
      deliveryRate: Math.round(deliveryRate * 100) / 100, // Round to 2 decimal places
      storageUsed: storageStats * 1024 * 1024, // Assume 1MB per media message
      costs
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/dashboard/messages/chart - Get message chart data
router.get('/messages/chart', async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Get user's instances
    const userInstances = await prisma.whatsAppInstance.findMany({
      where: { userId: userId },
      select: { id: true }
    });

    const instanceIds = userInstances.map(inst => inst.id);

    console.log('User instances:', instanceIds);

    // Get message data for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let messageData: Array<{ date: string; total: bigint; delivered: bigint; failed: bigint }>;

    if (instanceIds.length === 0) {
      // If no instances, return empty array
      messageData = [];
    } else {
      try {
        // Use Prisma's built-in aggregation instead of raw SQL
        const messages = await prisma.message.findMany({
          where: {
            instanceId: { in: instanceIds },
            createdAt: { gte: sevenDaysAgo }
          },
          select: {
            createdAt: true,
            status: true
          }
        });

        console.log('Found messages:', messages.length);

        // Group by date manually
        const groupedData = new Map<string, { total: number; delivered: number; failed: number }>();

        messages.forEach(message => {
          const dateStr = message.createdAt.toISOString().split('T')[0];
          if (!dateStr) return; // Skip if date parsing fails

          const date = dateStr;
          const current = groupedData.get(date) || { total: 0, delivered: 0, failed: 0 };

          current.total++;
          if (message.status === 'DELIVERED') current.delivered++;
          if (message.status === 'FAILED') current.failed++;

          groupedData.set(date, current);
        });

        messageData = Array.from(groupedData.entries()).map(([date, counts]) => ({
          date,
          total: BigInt(counts.total),
          delivered: BigInt(counts.delivered),
          failed: BigInt(counts.failed)
        }));

      } catch (queryError) {
        console.error('Query error:', queryError);
        throw queryError;
      }
    }

    // Format data for chart
    const chartData: MessageChartData[] = messageData.map(row => ({
      date: row.date,
      messages: Number(row.total),
      delivered: Number(row.delivered),
      failed: Number(row.failed)
    }));

    // Fill missing dates with 0
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0] || '';

      if (!chartData.find(d => d.date === dateStr)) {
        chartData.push({ date: dateStr, messages: 0, delivered: 0, failed: 0 });
      }
    }

    // Sort by date
    chartData.sort((a, b) => a.date.localeCompare(b.date));

    res.json(chartData);
  } catch (error) {
    console.error('Error fetching message chart data:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/dashboard/instances/status - Get instance status data
router.get('/instances/status', async (req, res) => {
  try {
    // TODO: Implement actual instance status data
    const statusData: InstanceStatusData[] = [];

    res.json(statusData);
  } catch (error) {
    console.error('Error fetching instance status data:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/dashboard/costs - Get cost data
router.get('/costs', async (req, res) => {
  try {
    // TODO: Implement actual cost data
    const costData: CostData[] = [];

    res.json(costData);
  } catch (error) {
    console.error('Error fetching cost data:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/dashboard/users/activity - Get user activity data
router.get('/users/activity', async (req, res) => {
  try {
    // TODO: Implement actual user activity data
    const activityData: UserActivityData[] = [];

    res.json(activityData);
  } catch (error) {
    console.error('Error fetching user activity data:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/dashboard/activity - Get activity log
router.get('/activity', async (req, res) => {
  try {
    // TODO: Implement actual activity log
    const activityLog: ActivityLog[] = [];

    res.json(activityLog);
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export { router as dashboardRoutes };