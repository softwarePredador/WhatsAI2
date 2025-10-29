import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth-middleware';
import { dashboardService } from '../../services/dashboard-service';

const router = Router();

// All dashboard routes require authentication
router.use(authMiddleware);

// GET /api/dashboard/metrics - Get dashboard metrics
router.get('/metrics', async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const metrics = await dashboardService.getMetrics(userId, userRole || 'USER');
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

    const days = parseInt(req.query['days'] as string) || 7;
    const chartData = await dashboardService.getMessageChartData(userId, days);
    
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
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const statusData = await dashboardService.getInstanceStatusData(userId);
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
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const months = parseInt(req.query['months'] as string) || 6;
    const costData = await dashboardService.getCostData(userId, months);
    
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
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const days = parseInt(req.query['days'] as string) || 30;
    const activityData = await dashboardService.getUserActivityData(userId, days);
    
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
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const limit = parseInt(req.query['limit'] as string) || 50;
    const activityLog = await dashboardService.getActivityLog(userId, limit);
    
    res.json(activityLog);
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/dashboard/peak-hours - Get peak usage hours
router.get('/peak-hours', async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const peakHours = await dashboardService.getPeakUsageHours(userId);
    res.json(peakHours);
  } catch (error) {
    console.error('Error fetching peak hours:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/dashboard/response-time - Get response time stats
router.get('/response-time', async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const stats = await dashboardService.getResponseTimeStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching response time stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export { router as dashboardRoutes };