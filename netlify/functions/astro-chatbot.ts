import { Handler } from '@netlify/functions';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const { question, firstName, natalChart } = JSON.parse(event.body || '{}');
    if (!question || !firstName || !natalChart) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Données manquantes (question, prénom, thème natal)' }) };
    }
    // Prompt IA contextuel
    const prompt = `Tu es un astrologue bienveillant et moderne. Voici le thème natal de l'utilisateur :\n${JSON.stringify(natalChart, null, 2)}\nPrénom : ${firstName}.\nQuestion : ${question}.\nRéponds de façon personnalisée, claire, inspirante, et propose un mantra ou une action concrète si possible.`;
    // Appel OpenAI via la fonction openai.ts existante
    const openaiRes = await fetch(`${process.env.URL || 'https://zodiak.netlify.app'}/.netlify/functions/openai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, maxTokens: 400, temperature: 0.8 })
    });
    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erreur OpenAI', details: err }) };
    }
    const data = await openaiRes.json();
    // Extraction de la réponse textuelle
    const answer = data.choices?.[0]?.message?.content || 'Je suis désolé, je n\'ai pas pu générer de réponse pour le moment.';
    return { statusCode: 200, headers, body: JSON.stringify({ answer }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur serveur' }) };
  }
}; 