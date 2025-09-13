import { IncomingMessage, ServerResponse } from 'http';

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * File upload interface
 */
export interface UploadedFile {
  name: string;
  filename?: string;
  mimetype?: string;
  data: Buffer;
  size: number;
}

/**
 * Cookie options interface
 */
export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  domain?: string;
  path?: string;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Cache control options
 */
export interface CacheOptions {
  public?: boolean;
  private?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
}

/**
 * Security headers configuration
 */
export interface SecurityHeaders {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

/**
 * Enhanced request object with parsed data
 */
export interface SwiftRequest extends IncomingMessage {
  id?: string;
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  path: string;
  files?: UploadedFile[];
  raw?: Buffer;
  cookies?: Record<string, string>;
  accepts?: (types: string[]) => string | null;
}

/**
 * Enhanced response object with helper methods
 */
export interface SwiftResponse extends ServerResponse {
  // Basic response methods
  json: (data: any) => void;
  status: (code: number) => SwiftResponse;
  send: (data: string | Buffer) => void;
  
  // Navigation and redirects
  redirect: (url: string, statusCode?: number) => void;
  
  // Cookie management
  cookie: (name: string, value: string, options?: CookieOptions) => SwiftResponse;
  clearCookie: (name: string, options?: Omit<CookieOptions, 'maxAge' | 'expires'>) => SwiftResponse;
  
  // File operations
  download: (filePath: string, filename?: string) => void;
  attachment: (filename?: string) => SwiftResponse;
  
  // Template rendering
  render: (template: string, data?: any) => void;
  
  // Caching
  cache: (maxAge: number, options?: CacheOptions) => SwiftResponse;
  
  // Compression
  compress: (data: string | Buffer, force?: boolean) => Promise<void>;
  
  // Security
  security: (options?: SecurityHeaders) => SwiftResponse;
  
  // Content type
  type: (contentType: string) => SwiftResponse;
  
  // Vary header
  vary: (field: string) => SwiftResponse;
}

/**
 * Route handler function type
 */
export type RouteHandler = (req: SwiftRequest, res: SwiftResponse) => void | Promise<void>;

/**
 * Middleware function type
 */
export type Middleware = (req: SwiftRequest, res: SwiftResponse, next: () => void) => void | Promise<void>;

/**
 * Error handler function type
 */
export type ErrorHandler = (error: Error, req: SwiftRequest, res: SwiftResponse, next: () => void) => void | Promise<void>;

/**
 * Parameter validator function
 */
export type ParamValidator = (value: string) => boolean | Promise<boolean>;

/**
 * Enhanced route definition with regex support
 */
export interface Route {
  method: HttpMethod;
  path: string | RegExp;
  handler: RouteHandler;
  middleware?: Middleware[];
  params?: Record<string, ParamValidator>;
}

/**
 * Route group configuration
 */
export interface RouteGroup {
  prefix: string;
  middleware: Middleware[];
  routes: Route[];
}

/**
 * Route debugging information
 */
export interface RouteInfo {
  method: HttpMethod;
  path: string | RegExp;
  middlewareCount: number;
  hasParams: boolean;
  paramNames: string[];
}

/**
 * Server configuration options
 */
export interface ServerOptions {
  port?: number;
  hostname?: string;
  maxConnections?: number;
  timeout?: number;
  errorReporting?: {
    enabled?: boolean;
    includeStack?: boolean;
    logFile?: string;
  };
}

/**
 * Request parsing options
 */
export interface RequestParsingOptions {
  limit?: string;
  json?: boolean;
  urlencoded?: boolean;
  text?: boolean;
  raw?: boolean;
  multipart?: boolean;
}

/**
 * Content type validation options
 */
export interface ContentTypeOptions {
  allowedContentTypes?: string[];
  maxSize?: string;
  requireContentType?: boolean;
}

/**
 * Error context for error handlers
 */
export interface ErrorContext {
  req: SwiftRequest;
  res: SwiftResponse;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

/**
 * Circuit breaker state
 */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
  threshold?: number;
  timeout?: number;
  resetTimeout?: number;
  onStateChange?: (state: CircuitBreakerState) => void;
}

/**
 * Custom SwiftHTTP error class
 */
export class SwiftError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SwiftError';
    Error.captureStackTrace?.(this, SwiftError);
  }

  toJSON(): Record<string, any> {
    return {
      error: this.message,
      status: this.statusCode,
      code: this.code,
      details: this.details,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Validation error class
 */
export class ValidationError extends SwiftError {
  constructor(
    public override message: string,
    public errors: string[],
    public field?: string
  ) {
    super(message, 400, 'VALIDATION_ERROR', { errors, field });
    this.name = 'ValidationError';
  }
}

/**
 * Request parsing error class
 */
export class RequestParsingError extends SwiftError {
  constructor(
    public override message: string,
    public parseType: string
  ) {
    super(message, 400, 'PARSING_ERROR', { parseType });
    this.name = 'RequestParsingError';
  }
}