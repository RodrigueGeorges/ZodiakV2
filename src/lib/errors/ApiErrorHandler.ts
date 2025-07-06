import { ApiError, AppError } from '../errors';

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiErrorHandler {
  private static readonly ERROR_CODES = {
    // Erreurs d'authentification
    UNAUTHORIZED: 'UNAUTHORIZED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    EXPIRED_TOKEN: 'EXPIRED_TOKEN',
    
    // Erreurs de validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    
    // Erreurs d'API tierces
    OPENAI_ERROR: 'OPENAI_ERROR',
    PROKERALA_ERROR: 'PROKERALA_ERROR',
    BREVO_ERROR: 'BREVO_ERROR',
    NOMINATIM_ERROR: 'NOMINATIM_ERROR',
    
    // Erreurs de réseau
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    
    // Erreurs de base de données
    DATABASE_ERROR: 'DATABASE_ERROR',
    QUERY_ERROR: 'QUERY_ERROR',
    
    // Erreurs génériques
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  } as const;

  static createErrorResponse(
    code: keyof typeof ApiErrorHandler.ERROR_CODES,
    message: string,
    details?: unknown
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: this.ERROR_CODES[code],
        message,
        details,
        timestamp: new Date().toISOString()
      }
    };
  }

  static createSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static handleApiError(error: unknown): ApiErrorResponse {
    console.error('API Error:', error);

    if (error instanceof ApiError) {
      return this.createErrorResponse(
        this.mapErrorCode(error.code),
        error.message,
        { originalError: error.code }
      );
    }

    if (error instanceof AppError) {
      return this.createErrorResponse(
        this.mapErrorCode(error.code),
        error.message
      );
    }

    if (error instanceof Error) {
      // Détecter le type d'erreur basé sur le message
      if (error.message.includes('fetch')) {
        return this.createErrorResponse('NETWORK_ERROR', 'Erreur de connexion réseau');
      }
      
      if (error.message.includes('timeout')) {
        return this.createErrorResponse('TIMEOUT_ERROR', 'Délai d\'attente dépassé');
      }
      
      if (error.message.includes('rate limit')) {
        return this.createErrorResponse('RATE_LIMIT_ERROR', 'Limite de requêtes dépassée');
      }
    }

    return this.createErrorResponse('UNKNOWN_ERROR', 'Une erreur inattendue s\'est produite');
  }

  private static mapErrorCode(code: string): keyof typeof ApiErrorHandler.ERROR_CODES {
    const codeMap: Record<string, keyof typeof ApiErrorHandler.ERROR_CODES> = {
      'AUTH_ERROR': 'UNAUTHORIZED',
      'VALIDATION_ERROR': 'VALIDATION_ERROR',
      'API_ERROR': 'INTERNAL_ERROR',
      'OPENAI_ERROR': 'OPENAI_ERROR',
      'PROKERALA_ERROR': 'PROKERALA_ERROR',
      'BREVO_ERROR': 'BREVO_ERROR',
      'NOMINATIM_ERROR': 'NOMINATIM_ERROR',
      'DATABASE_ERROR': 'DATABASE_ERROR'
    };

    return codeMap[code] || 'UNKNOWN_ERROR';
  }

  static isRetryableError(error: unknown): boolean {
    if (error instanceof ApiError) {
      const retryableCodes = [
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
        'RATE_LIMIT_ERROR'
      ];
      return retryableCodes.includes(this.mapErrorCode(error.code));
    }
    return false;
  }

  static getRetryDelay(attempt: number, baseDelay = 1000): number {
    // Stratégie de backoff exponentiel
    return Math.min(baseDelay * Math.pow(2, attempt), 30000);
  }
}

export { ApiErrorHandler as default }; 