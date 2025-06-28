import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Vremenski prozor u milisekundama
  maxRequests: number; // Maksimalan broj zahtjeva u prozoru
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private _config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this._config = config;
  }

  public get config(): RateLimitConfig {
    return this._config;
  }

  private getClientId(req: NextRequest): string {
    // Koristi IP adresu kao identifikator klijenta
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    return ip;
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.requests.entries());
    for (const [key, value] of entries) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  public check(req: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    this.cleanup();
    
    const clientId = this.getClientId(req);
    const now = Date.now();
    
    const clientRequests = this.requests.get(clientId);
    
    if (!clientRequests || now > clientRequests.resetTime) {
      // Prvi zahtjev ili reset vremena
      this.requests.set(clientId, {
        count: 1,
        resetTime: now + this._config.windowMs
      });
      
      return {
        allowed: true,
        remaining: this._config.maxRequests - 1,
        resetTime: now + this._config.windowMs
      };
    }
    
    if (clientRequests.count >= this._config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: clientRequests.resetTime
      };
    }
    
    // Povećaj brojač
    clientRequests.count++;
    this.requests.set(clientId, clientRequests);
    
    return {
      allowed: true,
      remaining: this._config.maxRequests - clientRequests.count,
      resetTime: clientRequests.resetTime
    };
  }
}

// Kreiraj instance za različite tipove endpointa
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minuta
  maxRequests: 100 // 100 zahtjeva po 15 minuta
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minuta
  maxRequests: 5 // 5 pokušaja prijave po 15 minuta
});

export const uploadRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 sat
  maxRequests: 10 // 10 upload-a po satu
});

// Middleware funkcija za rate limiting
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limiter: RateLimiter = apiRateLimiter
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const result = limiter.check(req);
    
    if (!result.allowed) {
      return NextResponse.json(
        { 
          error: 'Previše zahtjeva. Molimo pokušajte kasnije.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limiter.config.maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
    // Dodaj rate limit header-e
    const response = await handler(req);
    response.headers.set('X-RateLimit-Limit', limiter.config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    return response;
  };
} 