import { NextRequest, NextResponse } from 'next/server';

interface CorsConfig {
  origin: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}

const defaultConfig: CorsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://pilana-app.vercel.app', 'https://your-domain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

export function withCors(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: Partial<CorsConfig> = {}
) {
  const corsConfig = { ...defaultConfig, ...config };
  
  return async (req: NextRequest): Promise<NextResponse> => {
    const origin = req.headers.get('origin');
    const isAllowedOrigin = Array.isArray(corsConfig.origin)
      ? corsConfig.origin.includes(origin || '')
      : corsConfig.origin === origin;

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      
      if (isAllowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin || '');
      }
      
      if (corsConfig.methods) {
        response.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
      }
      
      if (corsConfig.allowedHeaders) {
        response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
      }
      
      if (corsConfig.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
      
      return response;
    }

    // Handle actual requests
    const response = await handler(req);
    
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin || '');
    }
    
    if (corsConfig.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    return response;
  };
}

// Helper funkcija za provjeru CORS-a
export function isCorsAllowed(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const allowedOrigins = Array.isArray(defaultConfig.origin) 
    ? defaultConfig.origin 
    : [defaultConfig.origin];
  
  return allowedOrigins.includes(origin || '');
} 