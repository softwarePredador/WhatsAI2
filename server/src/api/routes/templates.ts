import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth-middleware';
import { templateService } from '../../services/template-service';
import {
  createTemplateSchema,
  updateTemplateSchema,
  renderTemplateSchema,
  listTemplatesQuerySchema
} from '../../schemas/template-schemas';

const router = Router();

// All template routes require authentication
router.use(authMiddleware);

// GET /api/templates - List all templates
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate query params
    const queryResult = listTemplatesQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: queryResult.error.errors
      });
      return;
    }

    const { templates, total } = await templateService.listTemplates(userId, queryResult.data);

    res.json({
      success: true,
      data: templates,
      pagination: {
        total,
        limit: queryResult.data.limit || 50,
        offset: queryResult.data.offset || 0
      }
    });
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar templates'
    });
  }
});

// GET /api/templates/stats - Get usage statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const limit = parseInt(req.query['limit'] as string) || 10;
    const stats = await templateService.getUsageStats(userId, limit);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting template stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
});

// GET /api/templates/by-category - Get templates grouped by category
router.get('/by-category', async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const categories = await templateService.getTemplatesByCategory(userId);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting templates by category:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar templates por categoria'
    });
  }
});

// GET /api/templates/:id - Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const template = await templateService.getTemplateById(id, userId);

    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar template'
    });
  }
});

// POST /api/templates - Create new template
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate request body
    const validationResult = createTemplateSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationResult.error.errors
      });
      return;
    }

    const template = await templateService.createTemplate(userId, validationResult.data);

    res.status(201).json({
      success: true,
      message: 'Template criado com sucesso',
      data: template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar template'
    });
  }
});

// PUT /api/templates/:id - Update template
router.put('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate request body
    const validationResult = updateTemplateSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationResult.error.errors
      });
      return;
    }

    const template = await templateService.updateTemplate(id, userId, validationResult.data);

    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Template atualizado com sucesso',
      data: template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar template'
    });
  }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const deleted = await templateService.deleteTemplate(id, userId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Template excluído com sucesso'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir template'
    });
  }
});

// POST /api/templates/:id/render - Render template with variables
router.post('/:id/render', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate request body
    const validationResult = renderTemplateSchema.safeParse({
      templateId: id,
      variables: req.body.variables || {}
    });

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationResult.error.errors
      });
      return;
    }

    const rendered = await templateService.renderTemplateById(
      id,
      userId,
      validationResult.data.variables
    );

    if (!rendered) {
      res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: rendered
    });
  } catch (error) {
    console.error('Error rendering template:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao renderizar template'
    });
  }
});

// POST /api/templates/:id/duplicate - Duplicate template
router.post('/:id/duplicate', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const duplicated = await templateService.duplicateTemplate(id, userId);

    if (!duplicated) {
      res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Template duplicado com sucesso',
      data: duplicated
    });
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao duplicar template'
    });
  }
});

export { router as templateRoutes };
