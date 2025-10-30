import { Router, Request, Response } from 'express';
import { campaignService } from '../../services/campaign-service';
import { 
  createCampaignSchema, 
  updateCampaignSchema, 
  listCampaignsQuerySchema,
  campaignActionSchema 
} from '../../schemas/campaign-schemas';
import { authMiddleware } from '../middlewares/auth-middleware';
import { checkCampaignLimit } from '../../middleware/check-limits';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/campaigns
 * Create a new campaign
 */
router.post('/', checkCampaignLimit, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = createCampaignSchema.parse(req.body);
    
    const campaign = await campaignService.createCampaign(userId, data);
    
    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/campaigns
 * List campaigns with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const query = listCampaignsQuerySchema.parse(req.query);
    
    const result = await campaignService.listCampaigns(userId, query);
    
    res.json({
      success: true,
      data: result.campaigns,
      meta: {
        total: result.total,
        limit: query.limit || 50,
        offset: query.offset || 0
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/campaigns/stats
 * Get campaign statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await campaignService.getCampaignStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/campaigns/:id
 * Get campaign by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const campaignId = req.params.id;
    
    const campaign = await campaignService.getCampaignById(campaignId, userId);
    
    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/campaigns/:id
 * Update campaign
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const campaignId = req.params.id;
    const data = updateCampaignSchema.parse(req.body);
    
    const campaign = await campaignService.updateCampaign(campaignId, userId, data);
    
    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * DELETE /api/campaigns/:id
 * Delete campaign
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const campaignId = req.params.id;
    
    const deleted = await campaignService.deleteCampaign(campaignId, userId);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * POST /api/campaigns/:id/actions
 * Perform campaign actions (start, pause, resume, cancel)
 */
router.post('/:id/actions', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const campaignId = req.params.id;
    const { action } = campaignActionSchema.parse(req.body);
    
    let campaign;
    
    switch (action) {
      case 'start':
        campaign = await campaignService.startCampaign(campaignId, userId);
        break;
      case 'pause':
        campaign = await campaignService.pauseCampaign(campaignId, userId);
        break;
      case 'resume':
        campaign = await campaignService.startCampaign(campaignId, userId);
        break;
      case 'cancel':
        campaign = await campaignService.cancelCampaign(campaignId, userId);
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
        return;
    }
    
    res.json({
      success: true,
      data: campaign,
      message: `Campaign ${action}ed successfully`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/campaigns/:id/progress
 * Get campaign progress
 */
router.get('/:id/progress', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const campaignId = req.params.id;
    
    const progress = await campaignService.getCampaignProgress(campaignId, userId);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

export default router;
