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
    let messages: Array<{ role: string; content: string }> = [];
    let preferences = {};
    if (convId) {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, messages, preferences')
        .eq('id', convId)
        .single();
      if (data) {
        messages = (data.messages as Array<{ role: string; content: string }>) || [];
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
    const context: Array<{ role: string; content: string }> = messages.slice(-12);
    // Prompt système premium et adaptatif
    const systemPrompt = `
Tu es un astrologue humain, bienveillant, à l'écoute, et expert. 
Ton rôle :
- Adapter tes réponses au style, au ton et au niveau de détail de l'utilisateur.
- Relancer la discussion si la question est vague ou appelle un suivi (ex : "Veux-tu approfondir ce point ?", "Souhaites-tu un conseil plus pratique ?").
- Poser des questions ouvertes si pertinent, pour encourager l'utilisateur à s'exprimer.
- Faire référence à la conversation passée si c'est utile (ex : "Comme tu l'as évoqué précédemment...").
- Garder un ton chaleureux, empathique, jamais robotique.
- Proposer un mantra ou une action concrète si possible.

Voici le thème natal de l'utilisateur :
${JSON.stringify(natalChart, null, 2)}
Prénom : ${firstName}.
Préférences détectées : ${JSON.stringify(preferences)}.
Historique de la conversation :
${context.map(m => `${m.role === 'user' ? 'Utilisateur' : 'Astrologue'} : ${m.content}`).join('\n')}

Commence ta réponse directement, sans rappeler que tu es une IA. Sois naturel, humain, et adapte-toi à la discussion.`;
    const openaiMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...context
    ];

    // 4. Appel OpenAI
    const openaiRes = await fetch(`${process.env.URL || 'https://zodiak.netlify.app'}/.netlify/functions/openai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: systemPrompt, maxTokens: 400, temperature: 0.8 })
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