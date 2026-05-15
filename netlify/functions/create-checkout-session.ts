import type { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-11-20.acacia' });

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { priceId, mode, userId, userEmail, successUrl, cancelUrl } = JSON.parse(event.body ?? '{}') as {
      priceId: string;
      mode: 'payment' | 'subscription';
      userId: string;
      userEmail: string;
      successUrl: string;
      cancelUrl: string;
    };

    if (!priceId || !mode || !userId || !successUrl || !cancelUrl) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Paramètres manquants' }) };
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: userId },
      ...(userEmail ? { customer_email: userEmail } : {}),
    };

    // Abonnement : trial 7 jours avec CB obligatoire
    if (mode === 'subscription') {
      sessionParams.subscription_data = {
        trial_period_days: 7,
        metadata: { user_id: userId },
      };
      // CB obligatoire même pendant le trial
      sessionParams.payment_method_collection = 'always';
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    console.error('[create-checkout-session]', msg);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: msg }) };
  }
};
