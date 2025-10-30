export interface Template {
  id: string;
  userId: string;
  name: string;
  content: string;
  category?: TemplateCategory;
  variables: string[];
  usageCount: number;
  mediaUrl?: string;
  mediaType?: string;
  tags?: string[];
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  content: string;
  category?: TemplateCategory;
  mediaUrl?: string;
  mediaType?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  content?: string;
  category?: TemplateCategory;
  mediaUrl?: string;
  mediaType?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface RenderTemplateRequest {
  variables: Record<string, string>;
}

export type TemplateCategory = 
  | 'greeting'
  | 'farewell'
  | 'follow_up'
  | 'promotional'
  | 'support'
  | 'custom';

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'greeting', label: 'Saudação' },
  { value: 'farewell', label: 'Despedida' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'promotional', label: 'Promocional' },
  { value: 'support', label: 'Suporte' },
  { value: 'custom', label: 'Personalizado' }
];
