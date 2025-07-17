import { ApiErrorHandler, type ApiResponse } from '../errors/ApiErrorHandler';
import { ApiCache } from '../cache/CacheManager';
import { ApiMonitor } from '../monitoring/ApiMonitor';
import type { NatalChart } from '../astrology';
import { detectGender } from '../utils';

class OpenAIService {
  private static readonly config = {
    maxTokens: 1000
  };

  private static readonly DEFAULT_GUIDANCE = {
    summary: "Les aspects planétaires du jour vous invitent à l'action réfléchie. Restez à l'écoute de votre intuition tout en avançant avec détermination vers vos objectifs.",
    love: "Vénus forme des aspects harmonieux qui favorisent les échanges authentiques. C'est le moment d'exprimer vos sentiments avec sincérité et d'ouvrir votre coeur à de nouvelles connexions.",
    work: "Mercure soutient vos projets professionnels. Votre clarté d'esprit est un atout majeur aujourd'hui. Profitez de cette énergie pour communiquer vos idées et prendre des initiatives constructives.",
    energy: "L'alignement des planètes vous apporte une belle vitalité. C'est une excellente journée pour démarrer de nouvelles activités physiques ou pour vous consacrer à des projets qui vous passionnent et rechargent vos batteries."
  };

  private static async callOpenAI(prompt: string): Promise<string> {
    try {
      const response = await fetch('/.netlify/functions/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, maxTokens: this.config.maxTokens, temperature: 0.7 }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur lors de l\'appel à la fonction OpenAI:', errorText);
        return JSON.stringify(this.DEFAULT_GUIDANCE);
      }
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
      }
      console.error('Réponse inattendue de la fonction OpenAI:', data);
      return JSON.stringify(this.DEFAULT_GUIDANCE);
    } catch (err) {
      console.error('Exception lors de l\'appel à la fonction OpenAI:', err);
      return JSON.stringify(this.DEFAULT_GUIDANCE);
    }
  }

  static async generateGuidance(natalChart: NatalChart, transits: Record<string, unknown>, userId?: string): Promise<ApiResponse<typeof this.DEFAULT_GUIDANCE>> {
    try {
      // const cacheKey = `guidance_${JSON.stringify(natalChart)}_${JSON.stringify(transits)}`; // supprimé car non utilisé
      // Utiliser le cache centralisé
      const guidance = await ApiCache.getCachedApiResponse(
        'openai-guidance',
        { natalChart, transits, userId },
        async () => {
          const prompt = this.buildPrompt(natalChart, transits);
          const response = await this.callOpenAI(prompt);
          
          try {
            return JSON.parse(response);
          } catch (error) {
            console.error('Error parsing OpenAI response:', error);
            return this.DEFAULT_GUIDANCE;
          }
        },
        24 * 60 * 60 * 1000 // Cache 24h
      );

      return ApiErrorHandler.createSuccessResponse(guidance);
    } catch (error) {
      console.error('Error generating guidance:', error);
      return ApiErrorHandler.handleApiError(error);
    }
  }

  private static buildPrompt(natalChart: NatalChart, transits: Record<string, unknown>): string {
    return `
      Analyse les positions planétaires suivantes et génère une guidance quotidienne au format JSON.
      - summary: un résumé général de 2-3 phrases de l'énergie du jour.
      - love: un paragraphe de 3-4 phrases sur les opportunités et défis dans la vie amoureuse.
      - work: un paragraphe de 3-4 phrases sur les dynamiques professionnelles et financières.
      - energy: un paragraphe de 3-4 phrases sur la vitalité, le bien-être et les activités conseillées.
      
      IMPORTANT: Dans chaque champ, mets les mots-clés les plus importants entre astérisques. Par exemple: "Aujourd'hui, la *communication* sera essentielle. Faites preuve de *prudence*."
      Le ton doit être encourageant, clair et personnalisé pour la personne recevant la guidance.

      Thème natal:
      ${JSON.stringify(natalChart, null, 2)}

      Transits du jour:
      ${JSON.stringify(transits, null, 2)}

      Format de réponse attendu (uniquement du JSON valide):
      {
        "summary": "résumé général...",
        "love": "conseils amour...",
        "work": "conseils travail...",
        "energy": "conseils énergie..."
      }
    `;
  }

  private static buildNatalChartInterpretationPrompt(natalChart: NatalChart, firstName?: string): string {
    let intro = 'Cher(e) ami(e)';
    if (firstName) {
      const gender = detectGender(firstName);
      if (gender === 'female') {
        intro = `Chère ${firstName}`;
      } else if (gender === 'male') {
        intro = `Cher ${firstName}`;
      } else {
        intro = `Cher(e) ${firstName}`;
      }
    }
    return `
      Tu es un astrologue expérimenté et bienveillant. En te basant sur le thème natal suivant, rédige une interprétation astrologique complète, riche et personnalisée en plusieurs paragraphes. Adresse-toi directement à la personne en commençant par "${intro},".

      Le texte doit être structuré, facile à lire et couvrir les points suivants :
      1.  **Introduction** : Une brève présentation de la "signature astrale" (Soleil, Lune, Ascendant) et ce qu'elle révèle de la personnalité centrale.
      2.  **Forces et Talents** : Analyse des positions planétaires (notamment le Soleil, Mercure, Vénus, Mars) pour mettre en lumière les forces, les talents naturels et les domaines où la personne peut briller.
      3.  **Défis et Axes de Croissance** : Identification des aspects plus complexes ou des positions (comme Saturne ou les nœuds lunaires) qui représentent des défis à surmonter ou des leçons de vie importantes pour son développement personnel.
      4.  **Conclusion** : Un paragraphe de conclusion encourageant qui résume le potentiel global du thème et donne un conseil pour naviguer la vie en harmonie avec sa nature astrale.

      Utilise un ton chaleureux, inspirant et positif, même en abordant les défis. L'objectif est de fournir un aperçu puissant et utile qui aide la personne à mieux se comprendre.

      Voici les données du thème natal :
      ${JSON.stringify(natalChart, null, 2)}

      Rédige uniquement l'interprétation textuelle, sans aucun autre formatage.
    `;
  }

  private static buildNatalSummaryPrompt(natalChart: NatalChart, firstName: string): string {
    return `
      Tu es un astrologue visionnaire et conteur. En te basant sur le thème natal suivant, écris une "Signature Astrale" immersive et poétique pour ${firstName}, structurée ainsi :

      1. Accroche cosmique : Commence par une phrase qui transporte ${firstName} dans l'univers, évoquant la magie de sa naissance sous les étoiles (1 phrase, style poétique, avec un emoji d'étoile ou de galaxie).
      2. Portrait en 3 astres : Pour chaque élément clé, écris une phrase personnalisée :
         - ☀️ Soleil en {Soleil} : décris l'énergie centrale, la force de caractère ou la mission de vie.
         - 🌙 Lune en {Lune} : décris la sensibilité, le monde intérieur, la façon d'aimer ou de ressentir.
         - ✨ Ascendant en {Ascendant} : décris la première impression, le style, la façon d'avancer dans la vie.
         (Chaque phrase commence par l'emoji correspondant, puis le nom du signe, puis la description.)
      3. Mantra astral : Termine par une citation ou un mantra inspirant, unique à ce thème, à méditer chaque jour (entouré d'emojis, ex : "🌟 Je rayonne ma lumière unique 🌟").

      Le ton doit être chaleureux, poétique, valorisant, et en français.
      N'utilise pas de balises Markdown ni de formatage HTML.

      Voici les données du thème natal :
      ${JSON.stringify(natalChart, null, 2)}
    `;
  }

  static async generateNatalChartInterpretation(natalChart: NatalChart, firstName?: string, userId?: string): Promise<ApiResponse<string>> {
    if (!natalChart) {
      return ApiErrorHandler.createErrorResponse('VALIDATION_ERROR', 'Les données du thème natal sont requises.');
    }

    try {
      const interpretation = await ApiCache.getCachedApiResponse(
        'openai-interpretation',
        { natalChart, firstName, userId },
        async () => {
          const prompt = this.buildNatalChartInterpretationPrompt(natalChart, firstName);
          return await this.callOpenAI(prompt);
        },
        7 * 24 * 60 * 60 * 1000 // Cache 7 jours
      );

      return ApiErrorHandler.createSuccessResponse(interpretation);
    } catch (error) {
      console.error('Erreur lors de la génération de l\'interprétation du thème natal:', error);
      return ApiErrorHandler.handleApiError(error);
    }
  }

  static async generateNatalSummary(natalChart: NatalChart, firstName: string, userId?: string): Promise<ApiResponse<string>> {
    if (!natalChart) {
      return ApiErrorHandler.createErrorResponse('VALIDATION_ERROR', 'Les données du thème natal sont requises.');
    }

    try {
      const summary = await ApiCache.getCachedApiResponse(
        'openai-summary',
        { natalChart, firstName, userId },
        async () => {
          const prompt = this.buildNatalSummaryPrompt(natalChart, firstName);
          return await this.callOpenAI(prompt);
        },
        7 * 24 * 60 * 60 * 1000 // Cache 7 jours
      );

      return ApiErrorHandler.createSuccessResponse(summary);
    } catch (error) {
      console.error('Erreur lors de la génération du résumé astrologique:', error);
      return ApiErrorHandler.handleApiError(error);
    }
  }

  // Méthodes utilitaires pour la gestion du cache et du monitoring
  static invalidateCache(pattern: string): void {
    ApiCache.invalidateApiCache(pattern);
  }

  static getServiceMetrics(): ReturnType<typeof ApiMonitor.prototype.getServiceMetrics> {
    return ApiMonitor.getInstance().getServiceMetrics('openai');
  }

  static getHealthStatus(): ReturnType<typeof ApiMonitor.prototype.getHealthStatus> {
    return ApiMonitor.getInstance().getHealthStatus('openai');
  }
}

export default OpenAIService;