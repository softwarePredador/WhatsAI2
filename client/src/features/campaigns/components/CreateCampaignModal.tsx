import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Campaign, CreateCampaignRequest } from '../types/campaigns';
import { campaignsService } from '../services/campaignsService';
import { templatesService } from '../../templates/services/templatesService';
import { Template } from '../../templates/types/templates';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (campaign: Campaign) => void;
  editCampaign?: Campaign | null;
  instances: Array<{ id: string; name: string }>;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editCampaign,
  instances
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [recipients, setRecipients] = useState<Array<{ phoneNumber: string; name?: string }>>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!editCampaign;

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editCampaign) {
      setName(editCampaign.name);
      setDescription(editCampaign.description || '');
      setTemplateId(editCampaign.templateId);
      setInstanceId(editCampaign.instanceId);
      setRecipients(editCampaign.recipients.map(r => ({ phoneNumber: r.phoneNumber, name: r.name })));
    } else {
      resetForm();
    }
  }, [editCampaign, isOpen]);

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const data = await templatesService.getTemplates(token);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setTemplateId('');
    setInstanceId('');
    setRecipients([]);
    setRecipientInput('');
    setError(null);
  };

  const addRecipient = () => {
    if (!recipientInput.trim()) return;

    // Parse format: "5511999999999,Nome" or just "5511999999999"
    const lines = recipientInput.split('\n').filter(line => line.trim());
    const newRecipients = lines.map(line => {
      const [phoneNumber, name] = line.split(',').map(s => s.trim());
      return { phoneNumber, name };
    });

    setRecipients([...recipients, ...newRecipients]);
    setRecipientInput('');
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !templateId || !instanceId || recipients.length === 0) {
      setError('Preencha todos os campos obrigatórios e adicione pelo menos um destinatário');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const campaignData: CreateCampaignRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        templateId,
        instanceId,
        recipients: recipients.map(r => ({
          phoneNumber: r.phoneNumber,
          name: r.name || undefined
        }))
      };

      let result: Campaign;
      if (isEditMode && editCampaign) {
        result = await campaignsService.updateCampaign(token, editCampaign.id, {
          name: campaignData.name,
          description: campaignData.description
        });
      } else {
        result = await campaignsService.createCampaign(token, campaignData);
      }

      onSuccess(result);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Error saving campaign:', err);
      setError(err.message || 'Erro ao salvar campanha');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold">
            {isEditMode ? 'Editar Campanha' : 'Nova Campanha'}
          </h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost" disabled={loading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Nome da Campanha *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Ex: Black Friday 2025"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Descrição</span>
              </label>
              <textarea
                className="textarea textarea-bordered"
                placeholder="Descrição opcional da campanha"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={2}
              />
            </div>

            {/* Template */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Template *</span>
              </label>
              <select
                className="select select-bordered"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                required
                disabled={loading || isEditMode}
              >
                <option value="">Selecione um template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Instance */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Instância WhatsApp *</span>
              </label>
              <select
                className="select select-bordered"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                required
                disabled={loading || isEditMode}
              >
                <option value="">Selecione uma instância</option>
                {instances.map((instance) => (
                  <option key={instance.id} value={instance.id}>
                    {instance.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipients */}
            {!isEditMode && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Destinatários *</span>
                </label>
                <div className="text-sm text-base-content/60 mb-2">
                  Formato: <code className="badge badge-sm badge-outline">5511999999999</code> ou{' '}
                  <code className="badge badge-sm badge-outline">5511999999999,Nome</code>
                </div>
                <div className="flex gap-2 items-start">
                  <textarea
                    className="textarea textarea-bordered flex-1 min-h-[100px]"
                    placeholder="5511999999999,João Silva&#10;5511888888888,Maria Santos&#10;5511777777777,Pedro Costa"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    disabled={loading}
                    rows={4}
                  />
                  <button
                    type="button"
                    onClick={addRecipient}
                    className="btn btn-primary btn-square"
                    disabled={loading}
                    title="Adicionar destinatários"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Recipients List */}
                {recipients.length > 0 && (
                  <div className="mt-3 bg-base-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <p className="text-sm font-semibold mb-2">
                      {recipients.length} destinatário(s) adicionado(s):
                    </p>
                    <div className="space-y-1">
                      {recipients.map((recipient, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-base-100 rounded px-3 py-2"
                        >
                          <span className="text-sm">
                            {recipient.phoneNumber}
                            {recipient.name && ` - ${recipient.name}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeRecipient(index)}
                            className="btn btn-xs btn-ghost text-error"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
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
                isEditMode ? 'Salvar Alterações' : 'Criar Campanha'
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};
