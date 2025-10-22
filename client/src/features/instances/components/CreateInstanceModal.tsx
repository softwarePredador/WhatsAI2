import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateInstancePayload } from "../types/instanceTypes";

const createInstanceSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  webhook: z.string().url("URL inválida").optional().or(z.literal(""))
});

type CreateInstanceForm = z.infer<typeof createInstanceSchema>;

interface CreateInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateInstancePayload) => Promise<void>;
  loading?: boolean;
}

export default function CreateInstanceModal({ 
  isOpen, 
  onClose, 
  onCreate, 
  loading = false 
}: CreateInstanceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateInstanceForm>({
    resolver: zodResolver(createInstanceSchema)
  });

  const onSubmit = async (data: CreateInstanceForm) => {
    setIsSubmitting(true);
    try {
      const payload: CreateInstancePayload = {
        name: data.name,
        webhook: data.webhook || undefined
      };
      
      await onCreate(payload);
      reset();
      onClose();
    } catch (error) {
      console.error("Failed to create instance:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Nova Instância WhatsApp</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Nome da Instância *</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Atendimento Principal"
              className={`input input-bordered w-full ${errors.name ? "input-error" : ""}`}
              {...register("name")}
              disabled={isSubmitting || loading}
            />
            {errors.name && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.name.message}</span>
              </label>
            )}
            <label className="label">
              <span className="label-text-alt">
                Nome para identificar sua instância
              </span>
            </label>
          </div>

          {/* Webhook Field */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Webhook URL (opcional)</span>
            </label>
            <input
              type="text"
              placeholder="https://seu-dominio.com/webhook"
              className={`input input-bordered w-full ${errors.webhook ? "input-error" : ""}`}
              {...register("webhook")}
              disabled={isSubmitting || loading}
            />
            {errors.webhook && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.webhook.message}</span>
              </label>
            )}
            <label className="label">
              <span className="label-text-alt">
                URL para receber eventos do WhatsApp
              </span>
            </label>
          </div>

          {/* Info Alert */}
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div className="text-sm">
              <p>Após criar a instância, você precisará conectá-la usando um QR Code.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
              disabled={isSubmitting || loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Criando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Criar Instância
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}
