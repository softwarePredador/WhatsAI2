import React, { useState, useEffect } from 'react';
import { X, Info, Sparkles } from 'lucide-react';
import { Template, CreateTemplateRequest, TEMPLATE_CATEGORIES } from '../types/templates';
import { templatesService } from '../services/templatesService';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (template: Template) => void;
  editTemplate?: Template | null;
}

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editTemplate
}) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!editTemplate;

  // Load template data when editing
  useEffect(() => {
    if (editTemplate) {
      setName(editTemplate.name);
      setContent(editTemplate.content);
      setCategory(editTemplate.category || '');
      setIsActive(editTemplate.isActive);
      setDetectedVariables(editTemplate.variables);
    } else {
      resetForm();
    }
  }, [editTemplate, isOpen]);

  // Detect variables in content
  useEffect(() => {
    const variables = templatesService.extractVariables(content);
    setDetectedVariables(variables);
  }, [content]);

  const resetForm = () => {
    setName('');
    setContent('');
    setCategory('');
    setIsActive(true);
    setDetectedVariables([]);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !content.trim()) {
      setError('Nome e conteúdo são obrigatórios');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const templateData: CreateTemplateRequest = {
        name: name.trim(),
        content: content.trim(),
        category: category || undefined,
        isActive
      };

      let result: Template;
      if (isEditMode && editTemplate) {
        result = await templatesService.updateTemplate(token, editTemplate.id, templateData);
      } else {
        result = await templatesService.createTemplate(token, templateData);
      }

      onSuccess(result);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Error saving template:', err);
      setError(err.message || 'Erro ao salvar template');
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + `{{${variable}}}` + content.substring(end);
    
    setContent(newContent);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variable.length + 4; // 4 for {{}}
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const commonVariables = ['nome', 'empresa', 'produto', 'data', 'hora', 'valor', 'telefone', 'email'];

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            {isEditMode ? 'Editar Template' : 'Criar Novo Template'}
          </h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Nome do Template *</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Ex: Boas-vindas, Follow-up, Confirmação de Pedido"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Category */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Categoria</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
              >
                <option value="">Selecione uma categoria</option>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Conteúdo *</span>
                <span className="label-text-alt text-info">
                  Use {'{{variavel}}'} para variáveis dinâmicas
                </span>
              </label>
              <textarea
                id="template-content"
                className="textarea textarea-bordered h-40 font-mono text-sm"
                placeholder="Ex: Olá {{nome}}, bem-vindo(a) à {{empresa}}!"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Quick Insert Variables */}
            <div className="bg-base-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-info" />
                <span className="text-sm font-semibold">Variáveis Comuns</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {commonVariables.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="btn btn-xs btn-outline"
                    disabled={loading}
                  >
                    + {variable}
                  </button>
                ))}
              </div>
            </div>

            {/* Detected Variables */}
            {detectedVariables.length > 0 && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-4">
                <p className="text-sm font-semibold mb-2 text-success">
                  Variáveis Detectadas ({detectedVariables.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {detectedVariables.map((variable) => (
                    <code key={variable} className="badge badge-success badge-outline">
                      {`{{${variable}}}`}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {/* Active Toggle */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="toggle toggle-success"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={loading}
                />
                <span className="label-text font-semibold">
                  {isActive ? 'Template Ativo' : 'Template Inativo'}
                </span>
              </label>
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Templates inativos não aparecem na lista de campanhas
                </span>
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-base-300">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                isEditMode ? 'Salvar Alterações' : 'Criar Template'
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};
