import { Template, CreateTemplateRequest, UpdateTemplateRequest } from '../types/templates';

class TemplatesService {
  private baseUrl = '/api/templates';

  /**
   * Get all templates for the current user
   */
  async getTemplates(token: string, params?: {
    category?: string;
    search?: string;
    isFavorite?: boolean;
  }): Promise<Template[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isFavorite !== undefined) queryParams.append('isFavorite', String(params.isFavorite));

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get a specific template by ID
   */
  async getTemplateById(token: string, id: string): Promise<Template> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch template');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Create a new template
   */
  async createTemplate(token: string, template: CreateTemplateRequest): Promise<Template> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(template)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create template');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Update an existing template
   */
  async updateTemplate(token: string, id: string, updates: UpdateTemplateRequest): Promise<Template> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update template');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(token: string, id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete template');
    }
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(token: string, id: string): Promise<Template> {
    const response = await fetch(`${this.baseUrl}/${id}/duplicate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to duplicate template');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Render a template with variables
   */
  async renderTemplate(token: string, id: string, variables: Record<string, string>): Promise<{ content: string }> {
    const response = await fetch(`${this.baseUrl}/${id}/render`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ variables })
    });

    if (!response.ok) {
      throw new Error('Failed to render template');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Extract variables from template content
   */
  extractVariables(content: string): string[] {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * Get usage statistics (top N templates by usage)
   */
  async getUsageStats(token: string, limit: number = 10): Promise<Template[]> {
    const response = await fetch(`${this.baseUrl}/stats?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch usage stats');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get templates grouped by category
   */
  async getTemplatesByCategory(token: string): Promise<Record<string, number>> {
    const response = await fetch(`${this.baseUrl}/by-category`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch templates by category');
    }

    const data = await response.json();
    return data.data;
  }
}

export const templatesService = new TemplatesService();
