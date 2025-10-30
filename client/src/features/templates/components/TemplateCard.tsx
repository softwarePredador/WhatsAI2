import React, { useState } from 'react';
import { FileText, Edit2, Trash2, Copy, Tag, BarChart3, Star } from 'lucide-react';
import { Template } from '../types/templates';

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite
}) => {
  const [showFullContent, setShowFullContent] = useState(false);

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      greeting: 'badge-success',
      farewell: 'badge-info',
      follow_up: 'badge-warning',
      promotional: 'badge-primary',
      support: 'badge-secondary',
      custom: 'badge-ghost'
    };
    return category ? colors[category] || 'badge-ghost' : 'badge-ghost';
  };

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      greeting: 'Saudação',
      farewell: 'Despedida',
      follow_up: 'Follow-up',
      promotional: 'Promocional',
      support: 'Suporte',
      custom: 'Personalizado'
    };
    return category ? labels[category] || category : 'Sem categoria';
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className={`
      card bg-base-100 shadow-lg hover:shadow-xl transition-all
      border-2 ${template.isFavorite ? 'border-warning/30' : 'border-base-300'}
    `}>
      <div className="card-body p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate" title={template.name}>
                {template.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {template.category && (
                  <span className={`badge badge-sm ${getCategoryColor(template.category)}`}>
                    <Tag className="w-3 h-3 mr-1" />
                    {getCategoryLabel(template.category)}
                  </span>
                )}
                <span className="badge badge-sm badge-ghost">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  {template.usageCount} usos
                </span>
                {template.tags && template.tags.length > 0 && (
                  <span className="badge badge-sm badge-outline">
                    {template.tags.length} tag(s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Favorite Badge */}
          <div className="flex-shrink-0">
            {template.isFavorite && (
              <div className="badge badge-warning gap-1">
                <Star className="w-3 h-3 fill-current" />
                Favorito
              </div>
            )}
          </div>
        </div>

        {/* Content Preview */}
        <div className="bg-base-200 rounded-lg p-3 mb-3">
          <p className="text-sm text-base-content/80 whitespace-pre-wrap break-words">
            {showFullContent ? template.content : truncateContent(template.content)}
          </p>
          {template.content.length > 150 && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-xs text-primary hover:underline mt-2"
            >
              {showFullContent ? 'Ver menos' : 'Ver mais'}
            </button>
          )}
        </div>

        {/* Variables */}
        {template.variables.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-base-content/60 mb-2">Variáveis:</p>
            <div className="flex flex-wrap gap-1">
              {template.variables.map((variable) => (
                <code key={variable} className="badge badge-sm badge-outline">
                  {`{{${variable}}}`}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* Footer with Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-base-300">
          <span className="text-xs text-base-content/50">
            Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}
          </span>
          
          <div className="flex gap-2">
            <button
              onClick={() => onToggleFavorite(template.id, !template.isFavorite)}
              className={`btn btn-sm btn-ghost ${template.isFavorite ? 'text-warning' : 'text-base-content/50'}`}
              title={template.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Star className={`w-4 h-4 ${template.isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => onDuplicate(template.id)}
              className="btn btn-sm btn-ghost text-info"
              title="Duplicar"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(template)}
              className="btn btn-sm btn-ghost text-primary"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Deseja realmente excluir o template "${template.name}"?`)) {
                  onDelete(template.id);
                }
              }}
              className="btn btn-sm btn-ghost text-error"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
