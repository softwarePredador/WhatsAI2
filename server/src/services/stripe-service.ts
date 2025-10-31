import Stripe from 'stripe';
import { prisma } from '../database/prisma';

// Initialize Stripe
const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] || '', {
  apiVersion: '2025-10-29.clover'
});

export class StripeService {
  /**
   * Create or retrieve Stripe customer for user
   */
  async createOrGetCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        email: true,
        stripeCustomerId: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Return existing customer ID if found
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id
      }
    });

    // Save customer ID to user
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id }
    });

    return customer.id;
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(params: {
    userId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    trialDays?: number;
  }): Promise<Stripe.Checkout.Session> {
    const customerId = await this.createOrGetCustomer(params.userId);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1
        }
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId
      }
    };

    // Add trial period if specified
    if (params.trialDays && params.trialDays > 0) {
      sessionParams.subscription_data = {
        trial_period_days: params.trialDays
      };
    }

    return await stripe.checkout.sessions.create(sessionParams);
  }

  /**
   * Create subscription directly (without checkout)
   */
  async createSubscription(params: {
    userId: string;
    priceId: string;
    paymentMethodId?: string;
    trialDays?: number;
  }): Promise<Stripe.Subscription> {
    const customerId = await this.createOrGetCustomer(params.userId);

    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: params.priceId }],
      metadata: {
        userId: params.userId
      }
    };

    // Add payment method if provided
    if (params.paymentMethodId) {
      subscriptionParams.default_payment_method = params.paymentMethodId;
    }

    // Add trial period
    if (params.trialDays && params.trialDays > 0) {
      subscriptionParams.trial_period_days = params.trialDays;
    }

    return await stripe.subscriptions.create(subscriptionParams);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Stripe.Subscription> {
    if (cancelAtPeriodEnd) {
      // Cancel at end of billing period
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    } else {
      // Cancel immediately
      return await stripe.subscriptions.cancel(subscriptionId);
    }
  }

  /**
   * Reactivate canceled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });
  }

  /**
   * Update subscription (change plan)
   */
  async updateSubscription(subscriptionId: string, newPriceId: string): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const firstItem = subscription.items.data[0];
    if (!firstItem) {
      throw new Error('Subscription has no items');
    }

    return await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: firstItem.id,
          price: newPriceId
        }
      ],
      proration_behavior: 'create_prorations' // Charge/credit for the difference
    });
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(userId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    const customerId = await this.createOrGetCustomer(userId);

    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
  }

  /**
   * List all invoices for a customer
   */
  async listInvoices(userId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
    const customerId = await this.createOrGetCustomer(userId);

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit
    });

    return invoices.data;
  }

  /**
   * Get upcoming invoice
   */
  async getUpcomingInvoice(userId: string): Promise<Stripe.Invoice | null> {
    try {
      const customerId = await this.createOrGetCustomer(userId);
      const upcomingInvoice = await stripe.invoices.list({
        customer: customerId,
        limit: 1,
        status: 'draft'
      });
      return upcomingInvoice.data[0] || null;
    } catch (error) {
      // No upcoming invoice
      return null;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionChanged(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.['userId'];
    if (!userId) {
      console.error('No userId in session metadata');
      return;
    }

    // Subscription will be handled by subscription.created event
    console.log(`Checkout completed for user ${userId}`);
  }

  /**
   * Handle subscription created/updated
   */
  private async handleSubscriptionChanged(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.['userId'];
    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    const price = subscription.items.data[0]?.price;
    if (!price) {
      console.error('No price in subscription');
      return;
    }

    // Determine plan based on price ID
    let plan = 'FREE';
    if (price.id.includes('starter')) plan = 'STARTER';
    else if (price.id.includes('pro')) plan = 'PRO';
    else if (price.id.includes('business')) plan = 'BUSINESS';

    // Upsert subscription in database
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        userId,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: price.id,
        plan,
        status: subscription.status,
        amount: (price.unit_amount || 0) / 100, // Convert from cents to currency units
        currency: price.currency,
        interval: price.recurring?.interval || 'month',
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
      },
      update: {
        status: subscription.status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
      }
    });

    // Update user plan
    await prisma.user.update({
      where: { id: userId },
      data: { plan }
    });

    console.log(`Subscription ${subscription.status} for user ${userId} - Plan: ${plan}`);
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.['userId'];
    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'canceled',
        canceledAt: new Date()
      }
    });

    // Downgrade user to FREE plan
    await prisma.user.update({
      where: { id: userId },
      data: { plan: 'FREE' }
    });

    console.log(`Subscription canceled for user ${userId}`);
  }

  /**
   * Handle invoice paid
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    // Try to get userId from customer metadata
    const customer = await stripe.customers.retrieve(invoice.customer as string);
    if (customer.deleted || !customer.metadata?.['userId']) {
      console.error('No userId found for invoice');
      return;
    }
    
    const userId = customer.metadata['userId'];

    // Store invoice in database
    await prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      create: {
        userId: userId!,
        stripeInvoiceId: invoice.id,
        stripeCustomerId: invoice.customer as string,
        amount: invoice.amount_paid / 100, // Convert from cents to currency units
        currency: invoice.currency,
        status: invoice.status || 'paid',
        paid: true,
        paidAt: invoice.status_transitions.paid_at 
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : new Date(),
        invoiceNumber: invoice.number || undefined,
        invoicePdfUrl: invoice.invoice_pdf || undefined,
        hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
        periodStart: invoice.period_start 
          ? new Date(invoice.period_start * 1000)
          : new Date(),
        periodEnd: invoice.period_end 
          ? new Date(invoice.period_end * 1000)
          : new Date(),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null
      },
      update: {
        status: invoice.status || 'paid',
        paid: true,
        paidAt: invoice.status_transitions.paid_at 
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : new Date(),
        invoicePdfUrl: invoice.invoice_pdf || undefined,
        hostedInvoiceUrl: invoice.hosted_invoice_url || undefined
      }
    });

    console.log(`Invoice paid: ${invoice.id}`);
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    // Update invoice status
    await prisma.invoice.update({
      where: { stripeInvoiceId: invoice.id },
      data: {
        status: 'unpaid',
        paid: false
      }
    });

    console.log(`Invoice payment failed: ${invoice.id}`);
  }

  /**
   * Construct webhook event from raw body and signature
   */
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

export const stripeService = new StripeService();
