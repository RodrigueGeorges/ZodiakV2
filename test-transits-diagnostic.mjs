// Script de diagnostic pour les transits et la guidance
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

// Mock des données de test
const mockNatalChart = {
  planets: [
    { name: 'Sun', sign: 'Leo', house: 5, longitude: 120 },
    { name: 'Moon', sign: 'Cancer', house: 4, longitude: 90 },
    { name: 'Mercury', sign: 'Virgo', house: 6, longitude: 150 },
    { name: 'Venus', sign: 'Libra', house: 7, longitude: 180 },
    { name: 'Mars', sign: 'Scorpio', house: 8, longitude: 210 }
  ],
  houses: [
    { number: 1, sign: 'Aries', degree: 0 },
    { number: 2, sign: 'Taurus', degree: 30 },
    { number: 3, sign: 'Gemini', degree: 60 }
  ],
  ascendant: { sign: 'Aries', degree: 0 }
};

async function testTransitsDiagnostic() {
  console.log('🔍 Diagnostic des transits et guidance...');
  
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  
  console.log(`📅 Test pour les dates: ${today} et ${yesterday}`);
  
  try {
    // 1. Test de l'API Prokerala
    console.log('\n1️⃣ Test de l\'API Prokerala...');
    
    const clientId = process.env.PROKERALA_CLIENT_ID;
    const clientSecret = process.env.PROKERALA_CLIENT_SECRET;
    const baseUrl = process.env.PROKERALA_BASE_URL;
    
    if (!clientId || !clientSecret || !baseUrl) {
      console.log('❌ Configuration Prokerala manquante');
      console.log('Client ID:', !!clientId);
      console.log('Client Secret:', !!clientSecret);
      console.log('Base URL:', baseUrl);
    } else {
      console.log('✅ Configuration Prokerala présente');
      
      // Test d'authentification
      try {
        const authResponse = await fetch('https://api.prokerala.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            client_id: clientId, 
            client_secret: clientSecret, 
            grant_type: 'client_credentials' 
          })
        });
        
        if (authResponse.ok) {
          const authData = await authResponse.json();
          console.log('✅ Authentification Prokerala réussie');
          
          // Test de l'API de transits
          const accessToken = authData.access_token;
          const datetime = `${today}T12:00:00Z`;
          const parisLatitude = 48.8566;
          const parisLongitude = 2.3522;
          
          console.log('🔄 Test de l\'API de transits...');
          
          // Test avec l'API correcte pour les transits
          const transitResponse = await fetch(`${baseUrl}/v2/astrology/transit`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${accessToken}`, 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
              datetime, 
              latitude: parisLatitude, 
              longitude: parisLongitude,
              house_system: 'placidus',
              chart_type: 'western'
            })
          });
          
          if (transitResponse.ok) {
            const transitData = await transitResponse.json();
            console.log('✅ API de transits fonctionne');
            console.log('📊 Données de transits reçues:', Object.keys(transitData));
            
            if (transitData.planets && Array.isArray(transitData.planets)) {
              console.log('🌍 Planètes trouvées:', transitData.planets.length);
              transitData.planets.slice(0, 3).forEach(planet => {
                console.log(`  - ${planet.name}: ${planet.sign} ${planet.longitude}°`);
              });
            }
          } else {
            console.log('❌ Erreur API de transits:', transitResponse.status);
            const errorText = await transitResponse.text();
            console.log('Détails:', errorText);
          }
        } else {
          console.log('❌ Échec de l\'authentification Prokerala');
        }
      } catch (authError) {
        console.log('❌ Erreur lors du test Prokerala:', authError.message);
      }
    }
    
    // 2. Test des transits simulés
    console.log('\n2️⃣ Test des transits simulés...');
    
    function getSimulatedTransits(date) {
      const dateObj = new Date(date);
      const dayOfYear = Math.floor((dateObj.getTime() - new Date(dateObj.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      const baseAngle = (dayOfYear / 365) * 360;
      
      return {
        sun: { 
          sign: getSignFromDegree(baseAngle), 
          degree: baseAngle % 30,
          house: Math.floor(baseAngle / 30) % 12 + 1,
          retrograde: false
        },
        moon: { 
          sign: getSignFromDegree(baseAngle * 13.2),
          degree: (baseAngle * 13.2) % 30,
          house: Math.floor((baseAngle * 13.2) / 30) % 12 + 1,
          retrograde: false
        },
        mercury: { 
          sign: getSignFromDegree(baseAngle * 1.2), 
          degree: (baseAngle * 1.2) % 30,
          house: Math.floor((baseAngle * 1.2) / 30) % 12 + 1,
          retrograde: Math.random() > 0.8
        },
        venus: { 
          sign: getSignFromDegree(baseAngle * 0.8), 
          degree: (baseAngle * 0.8) % 30,
          house: Math.floor((baseAngle * 0.8) / 30) % 12 + 1,
          retrograde: Math.random() > 0.9
        },
        mars: { 
          sign: getSignFromDegree(baseAngle * 0.5), 
          degree: (baseAngle * 0.5) % 30,
          house: Math.floor((baseAngle * 0.5) / 30) % 12 + 1,
          retrograde: Math.random() > 0.85
        }
      };
    }
    
    function getSignFromDegree(degree) {
      const signs = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
      ];
      const normalizedDegree = ((degree % 360) + 360) % 360;
      const signIndex = Math.floor(normalizedDegree / 30);
      return signs[signIndex];
    }
    
    const transitsToday = getSimulatedTransits(today);
    const transitsYesterday = getSimulatedTransits(yesterday);
    
    console.log('📅 Transits aujourd\'hui:', Object.keys(transitsToday));
    console.log('📅 Transits hier:', Object.keys(transitsYesterday));
    
    // Vérifier si les transits varient
    const sunToday = transitsToday.sun;
    const sunYesterday = transitsYesterday.sun;
    
    console.log(`☀️ Soleil aujourd'hui: ${sunToday.sign} ${sunToday.degree.toFixed(1)}°`);
    console.log(`☀️ Soleil hier: ${sunYesterday.sign} ${sunYesterday.degree.toFixed(1)}°`);
    
    if (sunToday.sign !== sunYesterday.sign || Math.abs(sunToday.degree - sunYesterday.degree) > 1) {
      console.log('✅ Les transits varient correctement');
    } else {
      console.log('❌ Les transits ne varient pas');
    }
    
    // 3. Test de génération de guidance
    console.log('\n3️⃣ Test de génération de guidance...');
    
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.log('❌ OPENAI_API_KEY non configurée');
    } else {
      console.log('✅ OpenAI configuré');
      
      // Test avec les transits d'aujourd'hui
      const prompt = `
Tu es un astrologue expert. Génère une guidance simple au format JSON.

Données :
- Thème natal : ${JSON.stringify(mockNatalChart, null, 2)}
- Transits du jour : ${JSON.stringify(transitsToday, null, 2)}

Format JSON attendu :
{
  "summary": "Résumé du jour",
  "love": { "text": "Conseil amour", "score": 75 },
  "work": { "text": "Conseil travail", "score": 80 },
  "energy": { "text": "Conseil énergie", "score": 70 },
  "mantra": "Mantra du jour"
}`;

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
              { role: 'user', content: prompt }
            ],
            max_tokens: 300,
            temperature: 0.7,
            response_format: { type: 'json_object' },
          })
        });

        if (response.ok) {
          const data = await response.json();
          const guidance = JSON.parse(data.choices[0].message.content);
          console.log('✅ Guidance générée avec succès');
          console.log('📝 Résumé:', guidance.summary?.substring(0, 100) + '...');
          console.log('💖 Amour score:', guidance.love?.score);
          console.log('💼 Travail score:', guidance.work?.score);
          console.log('⚡ Énergie score:', guidance.energy?.score);
        } else {
          console.log('❌ Erreur OpenAI:', response.status);
        }
      } catch (openaiError) {
        console.log('❌ Erreur OpenAI:', openaiError.message);
      }
    }
    
    // 4. Test du cache
    console.log('\n4️⃣ Test du cache...');
    
    try {
      const { data: cachedTransits, error: cacheError } = await supabase
        .from('daily_transits')
        .select('*')
        .eq('date', today)
        .maybeSingle();
      
      if (cacheError) {
        console.log('❌ Erreur cache:', cacheError.message);
      } else if (cachedTransits) {
        console.log('✅ Transits trouvés en cache pour aujourd\'hui');
        console.log('📊 Données:', Object.keys(cachedTransits.transit_data || {}));
      } else {
        console.log('⚠️ Aucun transit en cache pour aujourd\'hui');
      }
    } catch (cacheError) {
      console.log('❌ Erreur lors du test du cache:', cacheError.message);
    }
    
  } catch (error) {
    console.log('❌ Erreur générale:', error.message);
  }
}

testTransitsDiagnostic(); 