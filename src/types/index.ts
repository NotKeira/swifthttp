import { IncomingMessage, ServerResponse } from "http";

/**
 * HTTP method types
 */
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

/**
 * Enhanced request object with parsed data
 */
export interface SwiftRequest extends IncomingMessage {
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  path: string;
}

/**
 * Enhanced response object with helper methods
 */
export interface SwiftResponse extends ServerResponse {
  json: (data: any) => void;
  status: (code: number) => SwiftResponse;
  send: (data: string | Buffer) => void;
}

/**
 * Route handler function type
 */
export type RouteHandler = (
  req: SwiftRequest,
  res: SwiftResponse
) => void | Promise<void>;

/**
 * Middleware function type
 */
export type Middleware = (
  req: SwiftRequest,
  res: SwiftResponse,
  next: () => void
) => void | Promise<void>;

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
}

/**
 * Error handler function type
 */
export type ErrorHandler = (
  error: Error,
  req: SwiftRequest,
  res: SwiftResponse,
  next: () => void
) => void;

/**
 * Middleware options for different types
 */
export interface MiddlewareOptions {
  cors?: {
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
  };
  bodyParser?: {
    urlencoded?: boolean;
    limit?: string;
  };
  logger?: {
    format?: "dev" | "combined";
  };
  static?: {
    root: string;
    index?: string;
    dotfiles?: "allow" | "deny" | "ignore";
  };
}

/**
 * Middleware factory type
 */
export type MiddlewareFactory<T = any> = (options?: T) => Middleware;

/**
 * Custom SwiftHTTP error class
 */
export class SwiftError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "SwiftError";
    Error.captureStackTrace?.(this, SwiftError);
  }
}
