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

    let convId = conversationId;
    let messages: Array<{ role: string; content: string }> = [];
    let preferences: any = {};
    if (convId) {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, messages, preferences')
        .eq('id', convId)
        .single();
      if (data) {
        messages = (data.messages as Array<{ role: string; content: string }>) || [];
        if (data.preferences) {
          preferences = data.preferences;
        }
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

    messages.push({ role: 'user', content: question });

    // 1. Détection d'intention, style, ton
    try {
      const analysisPrompt = `Analyse le message suivant et réponds sous forme d’un objet JSON strict :\n{\n  "intention": "amour | travail | bien-être | guidance générale | autre",\n  "style": "court | détaillé | mantra | conseil pratique | inspiration | autre",\n  "ton": "direct | empathique | spirituel | neutre | autre"\n}\nMessage utilisateur : "${question}"\nHistorique récent : ${messages.slice(-4).map(m => m.content).join(' | ')}`;
      const analysisRes = await fetch(`${process.env.URL || 'https://zodiak.netlify.app'}/.netlify/functions/openai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: analysisPrompt, maxTokens: 120, temperature: 0.2 })
      });
      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        let parsed = null;
        try {
          parsed = JSON.parse(analysisData.choices?.[0]?.message?.content || '{}');
        } catch {}
        if (parsed && typeof parsed === 'object') {
          preferences = parsed;
        }
      }
    } catch (e) {
      // Si l'analyse échoue, on continue sans bloquer
      preferences = {};
    }
    // 2. Stockage des préférences (optionnel : en base si conversationId)
    if (convId) {
      await supabase.from('conversations').update({ preferences }).eq('id', convId);
    }
    // 3. Préparer le contexte pour OpenAI (limité aux 12 derniers messages)
    const context: Array<{ role: string; content: string }> = messages.slice(-12);
    // Prompt système conversationnel avancé avec personnalisation
    const systemPrompt = `
Tu es un astrologue humain, bienveillant, à l'écoute, expert, créatif et très interactif.
Ta mission :
- Adapter tes réponses au style, au ton et au niveau de détail de l'utilisateur.
- Utilise un langage riche, imagé, parfois poétique, philosophique, humoristique ou inspirant.
- N’hésite pas à utiliser des métaphores, des références à la mythologie, à la littérature, à la culture populaire ou à l’astrologie pour illustrer tes conseils.
- Propose des conseils nuancés, profonds, originaux, et évite la simplicité ou la banalité.
- Relance la discussion si la question est vague ou appelle un suivi (ex : "Veux-tu approfondir ce point ?", "Souhaites-tu un conseil plus pratique ?", "Peux-tu préciser ta situation ?").
- Propose des choix, des exercices, des rituels, ou des questions ouvertes pour encourager l'utilisateur à s'exprimer ou à expérimenter.
- Fais référence à la conversation passée si c'est utile (ex : "Comme tu l'as évoqué précédemment...").
- Garde un ton chaleureux, empathique, jamais robotique.
- Propose un mantra, une citation, une inspiration, ou une action concrète si possible.
- Si l'utilisateur semble hésitant, propose-lui des exemples de questions ou de sujets à explorer.
- Si l'utilisateur revient sur un sujet déjà abordé, approfondis ou propose une nouvelle perspective.
- Si l'utilisateur pose une question très générale, propose-lui de préciser (ex : "Sur quel aspect de ta vie veux-tu qu'on se concentre aujourd'hui ?").
- Si la discussion s'essouffle, propose une relance ou une question inspirante.
- Varie le style de tes réponses pour surprendre et inspirer l'utilisateur.

Préférences détectées (à respecter dans ta réponse) :
- Intention : ${(preferences as any).intention || 'non détectée'}
- Style préféré : ${(preferences as any).style || 'non détecté'}
- Ton préféré : ${(preferences as any).ton || 'non détecté'}

Voici le thème natal de l'utilisateur :
${JSON.stringify(natalChart, null, 2)}
Prénom : ${firstName}.
Historique de la conversation :
${context.map(m => `${m.role === 'user' ? 'Utilisateur' : 'Astrologue'} : ${m.content}`).join('\n')}

Commence ta réponse directement, sois naturel, humain, et adapte-toi à la discussion. Termine si possible par une question, une invitation à poursuivre l'échange, ou une inspiration originale.`;
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