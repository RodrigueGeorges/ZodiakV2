import type { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-11-20.acacia' });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

// Mapping price_id → pack info (one-time purchases)
const PACK_MAPPING: Record<string, { size: number; name: string }> = {
  [process.env.STRIPE_PRICE_FILANTE ?? '']: { size: 10, name: 'filante' },
  [process.env.STRIPE_PRICE_LUNE ?? '']: { size: 30, name: 'lune' },
  [process.env.STRIPE_PRICE_CONSTELLATION ?? '']: { size: 100, name: 'constellation' },
  [process.env.STRIPE_PRICE_GALAXIE ?? '']: { size: 300, name: 'galaxie' },
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const sig = event.headers['stripe-signature'];
  if (!sig) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing stripe-signature header' }) };
  }

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body ?? '',
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook signature verification failed';
    console.error('[stripe-webhook] signature error:', msg);
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: msg }) };
  }

  console.info(`[stripe-webhook] event=${stripeEvent.type} id=${stripeEvent.id}`);

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoiceSucceeded(stripeEvent.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoiceFailed(stripeEvent.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        console.info('[stripe-webhook] trial_will_end:', (stripeEvent.data.object as Stripe.Subscription).id);
        break;

      default:
        console.info(`[stripe-webhook] unhandled event type: ${stripeEvent.type}`);
    }

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ received: true }) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal handler error';
    console.error(`[stripe-webhook] handler error for ${stripeEvent.type}:`, msg);
    // Retourner 500 pour que Stripe retente le webhook
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: msg }) };
  }
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.warn('[stripe-webhook] checkout.session.completed sans user_id dans metadata');
    return;
  }

  if (session.mode === 'subscription') {
    // Activation abonnement Premium
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

    await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        stripe_customer_id: session.customer as string,
        period_resets_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        messages_included_per_period: 100,
        messages_used_this_period: 0,
      })
      .eq('id', userId);

    console.info(`[stripe-webhook] subscription activated: user=${userId.slice(0, 8)} sub=${subscriptionId}`);

  } else if (session.mode === 'payment') {
    // Achat pack extra — on récupère les line items pour identifier le pack
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
    const priceId = lineItems.data[0]?.price?.id ?? '';
    const pack = PACK_MAPPING[priceId];

    if (!pack) {
      console.warn(`[stripe-webhook] pack inconnu pour price_id=${priceId}`);
      return;
    }

    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? '';

    const amountEur = (session.amount_total ?? 0) / 100;
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // Idempotent: UNIQUE(stripe_payment_intent_id)
    const { error: insertError } = await supabase
      .from('extra_purchases')
      .insert({
        user_id: userId,
        pack_size: pack.size,
        pack_name: pack.name,
        amount_paid_eur: amountEur,
        stripe_payment_intent_id: paymentIntentId,
        messages_remaining: pack.size,
        expires_at: expiresAt,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        // Doublon idempotent — webhook reçu deux fois, rien à faire
        console.info(`[stripe-webhook] pack déjà crédité (idempotent): pi=${paymentIntentId}`);
        return;
      }
      throw new Error(`insert extra_purchase failed: ${insertError.message}`);
    }

    // Incrémente extra_balance
    await supabase.rpc('add_extra_balance', { p_user_id: userId, p_amount: pack.size });

    console.info(`[stripe-webhook] pack credited: user=${userId.slice(0, 8)} pack=${pack.name} +${pack.size} msgs`);
  }
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription): Promise<void> {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const status = stripeStatusToAppStatus(subscription.status);
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: status,
      ...(trialEnd ? { trial_ends_at: trialEnd } : {}),
    })
    .eq('stripe_customer_id', customerId);

  if (error) throw new Error(`subscription upsert failed: ${error.message}`);

  console.info(`[stripe-webhook] subscription status: customer=${customerId.slice(0, 12)} → ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_status: 'cancelled' })
    .eq('stripe_customer_id', customerId);

  if (error) throw new Error(`subscription delete sync failed: ${error.message}`);

  console.info(`[stripe-webhook] subscription cancelled: customer=${customerId.slice(0, 12)}`);
}

async function handleInvoiceSucceeded(invoice: Stripe.Invoice): Promise<void> {
  // Uniquement pour les renouvellements (pas le premier paiement du checkout)
  if (invoice.billing_reason !== 'subscription_cycle') return;

  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id ?? '';

  if (!customerId) return;

  // Reset du compteur de messages + mise à jour period_resets_at (anniversaire)
  const nextPeriodEnd = invoice.lines.data[0]?.period?.end;
  const periodResetsAt = nextPeriodEnd
    ? new Date(nextPeriodEnd * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      messages_used_this_period: 0,
      period_resets_at: periodResetsAt,
    })
    .eq('stripe_customer_id', customerId);

  if (error) throw new Error(`invoice succeeded reset failed: ${error.message}`);

  console.info(`[stripe-webhook] period reset: customer=${customerId.slice(0, 12)} next=${periodResetsAt}`);
}

async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id ?? '';

  if (!customerId) return;

  // 3 jours de grâce : Stripe retente automatiquement selon la config Smart Retries.
  // On passe en 'past_due' d'abord — Stripe enverra subscription.updated avec status=past_due.
  // On passe en 'expired' seulement si subscription.deleted est reçu.
  // Ici on se contente de logguer ; handleSubscriptionUpsert gère le statut.
  console.warn(`[stripe-webhook] invoice payment failed: customer=${customerId.slice(0, 12)} invoice=${invoice.id}`);
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function stripeStatusToAppStatus(
  stripeStatus: Stripe.Subscription.Status
): 'trial' | 'active' | 'expired' | 'cancelled' {
  switch (stripeStatus) {
    case 'trialing':           return 'trial';
    case 'active':             return 'active';
    case 'canceled':           return 'cancelled';
    case 'past_due':
    case 'unpaid':
    case 'incomplete_expired': return 'expired';
    default:                   return 'expired';
  }
}
