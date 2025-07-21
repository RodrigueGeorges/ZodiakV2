import { Handler } from '@netlify/functions';

interface OpenAIRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export const handler: Handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    const body: OpenAIRequest = JSON.parse(event.body || '{}');
    const { prompt, maxTokens = 1000, temperature = 0.7 } = body;

    // Validate required fields
    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing prompt' }),
      };
    }

    // Get API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API key missing' }),
      };
    }

    // Make API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Tu es un astrologue professionnel qui fournit des conseils précis et personnalisés basés sur les positions planétaires.'
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        stream: true // Active le streaming
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API request failed: ${response.statusText} - ${errorText}`);
    }

    // Streaming: accumule les chunks pour réduire la latence côté OpenAI
    let openaiBody = '';
    if (response.body && typeof (response.body as any).on === 'function') {
      // Node.js stream (netlify-lambda utilise node-fetch)
      await new Promise<void>((resolve, reject) => {
        (response.body as any).on('data', (chunk: Buffer) => {
          openaiBody += chunk.toString();
        });
        (response.body as any).on('end', () => resolve());
        (response.body as any).on('error', (err: Error) => reject(err));
      });
    } else {
      // Fallback: pas de body (devrait être rare)
      openaiBody = await response.text();
    }
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      body: openaiBody,
    };

  } catch (error) {
    console.error('OpenAI function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}; 