/**
 * Billing API Service
 * Serviço para gerenciar assinaturas e pagamentos via Stripe
 */

import { api } from './api';

export interface Plan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
}

export interface Subscription {
  id: string;
  plan: string;
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'unpaid';
  amount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string;
  canceledAt?: string;
  cancelAtPeriodEnd?: boolean;
  trialStart?: string;
  trialEnd?: string;
}

export interface Invoice {
  id: string;
  number?: string;
  amount: number;
  currency: string;
  status: string;
  paid: boolean;
  invoicePdf?: string;
  hostedUrl?: string;
  created: string;
  createdAt: string;
}

export interface CheckoutResponse {
  url: string;
}

export interface PortalResponse {
  url: string;
}

class BillingService {
  /**
   * Criar sessão de checkout
   */
  async createCheckout(
    priceId: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<CheckoutResponse> {
    const response = await api.post<CheckoutResponse>('/billing/checkout', {
      priceId,
      successUrl: successUrl || `${window.location.origin}/success`,
      cancelUrl: cancelUrl || `${window.location.origin}/pricing`,
    });
    return response.data;
  }

  /**
   * Buscar assinatura atual do usuário
   */
  async getSubscription(): Promise<Subscription | null> {
    try {
      const response = await api.get<{ subscription: Subscription }>('/billing/subscription');
      return response.data.subscription;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Listar faturas do usuário
   */
  async getInvoices(limit = 10): Promise<Invoice[]> {
    const response = await api.get<{ invoices: Invoice[] }>('/billing/invoices', {
      params: { limit },
    });
    return response.data.invoices;
  }

  /**
   * Preview da próxima fatura
   */
  async getUpcomingInvoice(): Promise<any> {
    try {
      const response = await api.get('/billing/upcoming-invoice');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(immediately = false): Promise<void> {
    await api.post('/billing/cancel', { immediately });
  }

  /**
   * Reativar assinatura cancelada
   */
  async reactivateSubscription(): Promise<void> {
    await api.post('/billing/reactivate');
  }

  /**
   * Trocar de plano
   */
  async changePlan(newPriceId: string): Promise<void> {
    await api.post('/billing/change-plan', { newPriceId });
  }

  /**
   * Acessar portal do Stripe
   */
  async getPortalUrl(returnUrl?: string): Promise<string> {
    const response = await api.get<PortalResponse>('/billing/portal', {
      params: { returnUrl: returnUrl || window.location.href },
    });
    return response.data.url;
  }

  /**
   * Redirecionar para checkout
   */
  async redirectToCheckout(priceId: string): Promise<void> {
    const { url } = await this.createCheckout(priceId);
    window.location.href = url;
  }

  /**
   * Redirecionar para portal do Stripe
   */
  async redirectToPortal(): Promise<void> {
    const url = await this.getPortalUrl();
    window.location.href = url;
  }
}

export const billingService = new BillingService();

/**
 * Planos disponíveis
 */
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: '',
    interval: 'month',
    features: [
      '1 instância WhatsApp',
      '100 mensagens/dia',
      '500MB de armazenamento',
      'Suporte por email',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 47,
    priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER || 'price_1SOMIYBIx243ARlEdJ8bSkkh',
    interval: 'month',
    features: [
      '3 instâncias WhatsApp',
      '1.000 mensagens/dia',
      '5GB de armazenamento',
      'Templates de mensagem',
      'Campanhas básicas',
      'Suporte prioritário',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 97,
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO || 'price_1SOMIlBIx243ARlEDcb62AVI',
    interval: 'month',
    popular: true,
    features: [
      '10 instâncias WhatsApp',
      '5.000 mensagens/dia',
      '20GB de armazenamento',
      'Templates ilimitados',
      'Campanhas avançadas',
      'Webhooks personalizados',
      'Analytics avançado',
      'Suporte 24/7',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 297,
    priceId: import.meta.env.VITE_STRIPE_PRICE_BUSINESS || 'price_1SOMIuBIx243ARlEXOkFTJdg',
    interval: 'month',
    features: [
      'Instâncias ilimitadas',
      'Mensagens ilimitadas',
      'Armazenamento ilimitado',
      'Tudo do Pro +',
      'API dedicada',
      'SLA garantido',
      'Gerente de conta dedicado',
      'Treinamento personalizado',
    ],
  },
];
