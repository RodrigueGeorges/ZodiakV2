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
    
    // Validation des données d'entrée
    console.log('🔍 Validation des données d\'entrée...');
    
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      console.log('❌ Question manquante ou invalide');
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ 
          error: 'Question manquante ou invalide' 
        }) 
      };
    }
    
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
      console.log('❌ Prénom manquant ou invalide');
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ 
          error: 'Prénom manquant ou invalide' 
        }) 
      };
    }
    
    if (!natalChart || typeof natalChart !== 'object') {
      console.log('❌ Thème natal manquant ou invalide');
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ 
          error: 'Thème natal manquant ou invalide' 
        }) 
      };
    }
    
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      console.log('❌ UserId manquant ou invalide');
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ 
          error: 'UserId manquant ou invalide' 
        }) 
      };
    }
    
    console.log('✅ Validation des données réussie');
    console.log('📝 Question:', question.substring(0, 50) + '...');
    console.log('👤 Prénom:', firstName);
    console.log('🆔 UserId:', userId);

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
Tu es un astrologue professionnel, humain, rassurant et empathique. 
Ta mission :
- Réponds de façon claire, directe, bienveillante et personnalisée, sans détour inutile.
- Sois chaleureux, rassurant, et montre de l’empathie, mais évite les envolées poétiques ou les métaphores trop complexes.
- Utilise un langage simple, naturel, accessible, comme un expert qui parle à un ami.
- Va droit au but : donne des conseils concrets, pratiques, et adaptés à la question de l’utilisateur.
- Si la question est vague, demande une précision de façon douce et encourageante.
- Si l’utilisateur exprime une émotion, commence par la reconnaître (« Je comprends que tu puisses ressentir cela… »).
- Si tu n’as pas assez d’informations, pose une question ouverte pour relancer la discussion.
- Ne répète pas la question de l’utilisateur, réponds directement.
- Termine si possible par une question simple ou une invitation à poursuivre l’échange.
- Ne fais jamais de morale, ne juge pas, reste toujours positif et constructif.
- Si tu proposes un mantra ou une inspiration, fais-le en une phrase courte, simple et adaptée à la situation.

Préférences détectées (à respecter dans ta réponse) :
- Intention : ${(preferences as any).intention || 'non détectée'}
- Style préféré : ${(preferences as any).style || 'non détecté'}
- Ton préféré : ${(preferences as any).ton || 'non détecté'}

Voici le thème natal de l'utilisateur :
${JSON.stringify(natalChart, null, 2)}
Prénom : ${firstName}.
Historique de la conversation :
${context.map(m => `${m.role === 'user' ? 'Utilisateur' : 'Astrologue'} : ${m.content}`).join('\n')}

Commence ta réponse directement, sois naturel, humain, et adapte-toi à la discussion. Termine si possible par une question ou une invitation à poursuivre l'échange.`;
    const openaiMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...context
    ];

    // 4. Appel OpenAI direct (plus simple et fiable)
    console.log('📤 Appel OpenAI pour le chat...');
    
    try {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: openaiMessages,
          max_tokens: 400,
          temperature: 0.7,
          stream: false // Pas de streaming pour simplifier
        })
      });
      
      if (!openaiRes.ok) {
        const errorText = await openaiRes.text();
        console.log('❌ Erreur OpenAI:', errorText);
        return { 
          statusCode: 500, 
          headers, 
          body: JSON.stringify({ 
            error: 'Erreur lors de la génération de la réponse',
            details: errorText 
          }) 
        };
      }
      
      const openaiData = await openaiRes.json();
      const answer = openaiData.choices?.[0]?.message?.content;
      
      if (!answer) {
        console.log('❌ Pas de réponse OpenAI');
        return { 
          statusCode: 500, 
          headers, 
          body: JSON.stringify({ 
            error: 'Aucune réponse générée' 
          }) 
        };
      }
      
      console.log('✅ Réponse OpenAI reçue:', answer.substring(0, 100) + '...');
      
      // 5. Sauvegarder la réponse
      messages.push({ role: 'assistant', content: answer });
      await supabase
        .from('conversations')
        .update({ 
          messages, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', convId);
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          answer, 
          conversationId: convId 
        }),
      };
      
    } catch (openaiError) {
      console.log('❌ Erreur OpenAI:', openaiError.message);
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ 
          error: 'Erreur de connexion OpenAI',
          details: openaiError.message 
        }) 
      };
    }
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur serveur' }) };
  }
}; 