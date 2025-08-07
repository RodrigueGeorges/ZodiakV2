// Test rapide pour vérifier OpenAI
async function quickOpenAITest() {
  console.log('🧪 Test rapide OpenAI...');
  
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.log('❌ OPENAI_API_KEY non configurée');
    return;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'Tu es un astrologue expert.' },
          { role: 'user', content: 'Génère une guidance simple au format JSON avec summary, love, work, energy et mantra.' }
        ],
        max_tokens: 200,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur OpenAI (${response.status}):`, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ OpenAI fonctionne correctement');
    console.log('📝 Réponse:', data.choices[0].message.content);
    
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
}

quickOpenAITest(); 