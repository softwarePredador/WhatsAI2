export interface Template {
  id: string;
  userId: string;
  name: string;
  content: string;
  category?: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  content: string;
  category?: string;
  isActive?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  content?: string;
  category?: string;
  isActive?: boolean;
}

export interface RenderTemplateRequest {
  variables: Record<string, string>;
}

export type TemplateCategory = 
  | 'marketing' 
  | 'support' 
  | 'sales' 
  | 'notification' 
  | 'other';

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'support', label: 'Suporte' },
  { value: 'sales', label: 'Vendas' },
  { value: 'notification', label: 'Notificação' },
  { value: 'other', label: 'Outro' }
];
