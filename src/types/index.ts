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
 * Route definition
 */
export interface Route {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
  middleware?: Middleware[];
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
