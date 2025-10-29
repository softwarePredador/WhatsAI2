import { z } from 'zod';

// Template categories
export const templateCategories = [
  'greeting',
  'farewell',
  'follow_up',
  'promotional',
  'support',
  'custom'
] as const;

export const templateCategorySchema = z.enum(templateCategories).optional();

// Media types
export const mediaTypes = ['image', 'video', 'audio', 'document'] as const;
export const mediaTypeSchema = z.enum(mediaTypes).optional();

// Create Template Schema
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  content: z.string().min(1, 'Conteúdo é obrigatório').max(4096, 'Conteúdo muito longo'),
  category: templateCategorySchema,
  mediaUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  mediaType: mediaTypeSchema,
  tags: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional()
});

// Update Template Schema
export const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').optional(),
  content: z.string().min(1, 'Conteúdo é obrigatório').max(4096, 'Conteúdo muito longo').optional(),
  category: templateCategorySchema,
  mediaUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  mediaType: mediaTypeSchema,
  tags: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional()
});

// Render Template Schema
export const renderTemplateSchema = z.object({
  templateId: z.string().cuid('ID de template inválido'),
  variables: z.record(z.string(), z.string())
});

// Query params for listing templates
export const listTemplatesQuerySchema = z.object({
  category: templateCategorySchema,
  search: z.string().optional(),
  isFavorite: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
  sortBy: z.enum(['name', 'usageCount', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type RenderTemplateInput = z.infer<typeof renderTemplateSchema>;
export type ListTemplatesQuery = z.infer<typeof listTemplatesQuerySchema>;
