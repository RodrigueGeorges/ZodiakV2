import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const { question, firstName, natalChart, userId, conversationId } = JSON.parse(event.body || '{}');
    if (!question || !firstName || !natalChart || !userId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Données manquantes (question, prénom, thème natal, userId)' }) };
    }

    // 1. Charger ou créer la conversation
    let convId = conversationId;
    let messages = [];
    let preferences = {};
    if (convId) {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, messages, preferences')
        .eq('id', convId)
        .single();
      if (data) {
        messages = data.messages || [];
        preferences = data.preferences || {};
      }
    } else {
      // Nouvelle conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({ user_id: userId, messages: [], preferences: {} })
        .select('id')
        .single();
      convId = data?.id;
    }

    // 2. Ajouter le nouveau message utilisateur
    messages.push({ role: 'user', content: question });

    // 3. Préparer le contexte pour OpenAI (limité aux 12 derniers messages)
    const context = messages.slice(-12);
    // Prompt système personnalisé
    const systemPrompt = `Tu es un astrologue bienveillant et moderne. Voici le thème natal de l'utilisateur :\n${JSON.stringify(natalChart, null, 2)}\nPrénom : ${firstName}.\nPréférences : ${JSON.stringify(preferences)}.\nSois personnalisé, clair, inspirant, et propose un mantra ou une action concrète si possible.`;
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...context
    ];

    // 4. Appel OpenAI
    const openaiRes = await fetch(`${process.env.URL || 'https://zodiak.netlify.app'}/.netlify/functions/openai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: openaiMessages, maxTokens: 400, temperature: 0.8 })
    });
    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erreur OpenAI', details: err }) };
    }
    const data = await openaiRes.json();
    const answer = data.choices?.[0]?.message?.content || 'Je suis désolé, je n\'ai pas pu générer de réponse pour le moment.';

    // 5. Ajouter la réponse de l'agent à l'historique
    messages.push({ role: 'assistant', content: answer });

    // 6. Mettre à jour la conversation en base
    await supabase
      .from('conversations')
      .update({ messages, updated_at: new Date().toISOString() })
      .eq('id', convId);

    return { statusCode: 200, headers, body: JSON.stringify({ answer, conversationId: convId, messages }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur serveur' }) };
  }
}; 