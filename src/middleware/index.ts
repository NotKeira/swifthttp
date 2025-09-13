import { Middleware, SwiftRequest, SwiftResponse } from '../types';
import { parseLimit } from '../utils/request';

/**
 * Color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

function getStatusColor(statusCode: number): string {
  if (statusCode >= 500) return colors.red;
  if (statusCode >= 400) return colors.yellow;
  if (statusCode >= 300) return colors.cyan;
  if (statusCode >= 200) return colors.green;
  return colors.white;
}

function getMethodColor(method: string): string {
  const methodColors: Record<string, string> = {
    GET: colors.blue,
    POST: colors.green,
    PUT: colors.yellow,
    DELETE: colors.red,
    PATCH: colors.magenta,
    HEAD: colors.cyan,
    OPTIONS: colors.gray
  };
  return methodColors[method] || colors.white;
}

function formatDuration(duration: number): string {
  const color = duration > 1000 ? colors.red : 
                duration > 500 ? colors.yellow : 
                duration > 100 ? colors.cyan : colors.green;
  return `${color}${duration}ms${colors.reset}`;
}

function logRequest(method: string, path: string, statusCode: number, duration: number, userAgent?: string): { devLog: string; combinedLog: string } {
  const timestamp = colors.gray + new Date().toISOString() + colors.reset;
  const coloredMethod = getMethodColor(method) + colors.bright + method.padEnd(7) + colors.reset;
  const coloredStatus = getStatusColor(statusCode) + colors.bright + statusCode + colors.reset;
  const coloredPath = colors.white + path + colors.reset;
  const coloredDuration = formatDuration(duration);
  
  const devLog = `${timestamp} ${coloredMethod} ${coloredPath} ${coloredStatus} ${coloredDuration}`;
  const combinedLog = `${timestamp} ${coloredMethod} ${coloredPath} ${coloredStatus} ${coloredDuration} ${colors.dim}"${userAgent || 'Unknown'}"${colors.reset}`;
  
  return { devLog, combinedLog };
}

/**
 * CORS middleware
 */
export function cors(options: {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
} = {}): Middleware {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    credentials = false
  } = options;

  return (req: SwiftRequest, res: SwiftResponse, next: () => void) => {
    res.setHeader('Access-Control-Allow-Origin', Array.isArray(origin) ? origin.join(',') : origin);
    res.setHeader('Access-Control-Allow-Methods', methods.join(','));
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(','));
    
    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (req.method === 'OPTIONS') {
      res.status(200).send('');
      return;
    }

    next();
  };
}

/**
 * Body parsing middleware
 */
export function bodyParser(options: {
  urlencoded?: boolean;
  limit?: string;
} = {}): Middleware {
  const { urlencoded = true, limit = '1mb' } = options;
  const limitBytes = parseLimit(limit);

  return async (req: SwiftRequest, res: SwiftResponse, next: () => void) => {
    const contentType = req.headers['content-type'] || '';
    
    if (urlencoded && contentType.includes('application/x-www-form-urlencoded')) {
      let body = '';
      let totalSize = 0;
      
      req.on('data', chunk => {
        totalSize += chunk.length;
        
        if (totalSize > limitBytes) {
          res.status(413).json({ error: 'Request entity too large' });
          return;
        }
        
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const params = new URLSearchParams(body);
          req.body = Object.fromEntries(params.entries());
          next();
        } catch (error) {
          res.status(400).json({ error: 'Invalid URL-encoded data' });
        }
      });
      
      req.on('error', () => {
        res.status(400).json({ error: 'Request parsing error' });
      });
    } else {
      next();
    }
  };
}

/**
 * Logging middleware
 */
export function logger(format: 'dev' | 'combined' = 'dev'): Middleware {
  return (req: SwiftRequest, res: SwiftResponse, next: () => void) => {
    const start = Date.now();
    
    const originalEnd = res.end;
    res.end = function(this: SwiftResponse, ...args: Parameters<typeof originalEnd>) {
      const duration = Date.now() - start;
      const userAgent = req.headers['user-agent'];
      
      const { devLog, combinedLog } = logRequest(
        req.method || 'UNKNOWN',
        req.path || req.url || '/',
        this.statusCode || 200,
        duration,
        userAgent
      );
      
      if (format === 'dev') {
        console.log(devLog);
      } else {
        console.log(combinedLog);
      }
      
      return originalEnd.apply(this, args);
    } as typeof originalEnd;
    
    next();
  };
}

/**
 * Static file serving middleware
 */
export function serveStatic(root: string, options: {
  index?: string;
  dotfiles?: 'allow' | 'deny' | 'ignore';
} = {}): Middleware {
  const { index = 'index.html', dotfiles = 'ignore' } = options;

  return async (req: SwiftRequest, res: SwiftResponse, next: () => void) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    // Basic implementation - would use fs in real scenario
    next();
  };
}

/**
 * Content negotiation middleware
 */
export function negotiate(): Middleware {
  return (req: SwiftRequest, res: SwiftResponse, next: () => void) => {
    const acceptHeader = req.headers.accept || '*/*';
    const acceptTypes = acceptHeader.split(',').map(type => {
      const [mediaType, ...params] = type.trim().split(';');
      const quality = params.find(p => p.trim().startsWith('q='));
      const q = quality ? parseFloat(quality.split('=')[1]) : 1.0;
      return { type: mediaType.trim(), quality: q };
    }).sort((a, b) => b.quality - a.quality);

    (req as any).accepts = (types: string[]) => {
      for (const acceptType of acceptTypes) {
        for (const type of types) {
          if (acceptType.type === type || acceptType.type === '*/*' || acceptType.type.startsWith(type.split('/')[0] + '/*')) {
            return type;
          }
        }
      }
      return null;
    };

    next();
  };
}

/**
 * ETag generation middleware
 */
export function etag(): Middleware {
  return (req: SwiftRequest, res: SwiftResponse, next: () => void) => {
    const originalEnd = res.end;
    
    res.end = function(chunk?: any, encoding?: any) {
      if (chunk && req.method === 'GET') {
        const content = typeof chunk === 'string' ? chunk : chunk?.toString() || '';
        const hash = simpleHash(content);
        const etag = `"${hash}"`;
        
        const clientEtag = req.headers['if-none-match'];
        if (clientEtag === etag) {
          this.statusCode = 304;
          this.removeHeader('Content-Length');
          this.removeHeader('Content-Type');
          originalEnd.call(this);
          return this;
        }
        
        this.setHeader('ETag', etag);
      }
      
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Middleware composition helper
 */
export function compose(...middlewares: Middleware[]): Middleware {
  return async (req: SwiftRequest, res: SwiftResponse, next: () => void) => {
    let index = 0;
    
    async function dispatch(i: number): Promise<void> {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'));
      index = i;
      
      let fn = middlewares[i];
      if (i === middlewares.length) fn = next as any;
      if (!fn) return;
      
      try {
        await fn(req, res, dispatch.bind(null, i + 1));
      } catch (err) {
        return Promise.reject(err as Error);
      }
    }
    
    return dispatch(0);
  };
}