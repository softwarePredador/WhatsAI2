import { z } from 'zod';

// Campaign Status
export const campaignStatuses = [
  'DRAFT',
  'SCHEDULED',
  'RUNNING',
  'PAUSED',
  'COMPLETED',
  'FAILED'
] as const;

export const campaignStatusSchema = z.enum(campaignStatuses);

// Media Types
export const mediaTypes = ['image', 'video', 'audio', 'document'] as const;
export const mediaTypeSchema = z.enum(mediaTypes).optional();

// Recipient Schema
export const recipientSchema = z.object({
  phone: z.string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos')
    .regex(/^\d+$/, 'Telefone deve conter apenas números'),
  variables: z.record(z.string(), z.string()).optional()
});

// Create Campaign Schema
export const createCampaignSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo'),
  instanceId: z.string().cuid('ID de instância inválido'),
  templateId: z.string().cuid('ID de template inválido').optional(),
  message: z.string()
    .min(1, 'Mensagem é obrigatória')
    .max(4096, 'Mensagem muito longa'),
  mediaUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  mediaType: mediaTypeSchema,
  recipients: z.array(recipientSchema)
    .min(1, 'Pelo menos 1 destinatário é necessário')
    .max(10000, 'Máximo de 10.000 destinatários por campanha'),
  scheduledFor: z.string().datetime().optional().or(z.date().optional()),
  rateLimit: z.number()
    .int('Limite deve ser um número inteiro')
    .min(1, 'Mínimo 1 mensagem por minuto')
    .max(60, 'Máximo 60 mensagens por minuto')
    .optional()
    .default(10)
});

// Update Campaign Schema
export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  message: z.string().min(1).max(4096).optional(),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  mediaType: mediaTypeSchema,
  scheduledFor: z.string().datetime().optional().or(z.date().optional()),
  rateLimit: z.number().int().min(1).max(60).optional()
});

// CSV Upload Schema
export const csvUploadSchema = z.object({
  campaignId: z.string().cuid('ID de campanha inválido').optional(),
  hasHeader: z.boolean().optional().default(true),
  phoneColumn: z.string().optional().default('phone'),
  variableColumns: z.array(z.string()).optional()
});

// Campaign Action Schema
export const campaignActionSchema = z.object({
  action: z.enum(['start', 'pause', 'resume', 'cancel'])
});

// Query params for listing campaigns
export const listCampaignsQuerySchema = z.object({
  status: campaignStatusSchema.optional(),
  instanceId: z.string().cuid().optional(),
  search: z.string().optional(),
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
  sortBy: z.enum(['name', 'createdAt', 'startedAt', 'completedAt', 'totalRecipients']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type CsvUploadInput = z.infer<typeof csvUploadSchema>;
export type CampaignActionInput = z.infer<typeof campaignActionSchema>;
export type ListCampaignsQuery = z.infer<typeof listCampaignsQuerySchema>;
