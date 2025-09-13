import { SwiftRequest, SwiftResponse } from '../types';

/**
 * Base SwiftHTTP error class
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
 * HTTP-specific error classes
 */
export class BadRequestError extends SwiftError {
  constructor(message: string = 'Bad Request', details?: any) {
    super(message, 400, 'BAD_REQUEST', details);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends SwiftError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, 'UNAUTHORIZED', details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends SwiftError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, 403, 'FORBIDDEN', details);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends SwiftError {
  constructor(message: string = 'Not Found', details?: any) {
    super(message, 404, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

export class MethodNotAllowedError extends SwiftError {
  constructor(message: string = 'Method Not Allowed', allowedMethods?: string[]) {
    super(message, 405, 'METHOD_NOT_ALLOWED', { allowedMethods });
    this.name = 'MethodNotAllowedError';
  }
}

export class ConflictError extends SwiftError {
  constructor(message: string = 'Conflict', details?: any) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class UnprocessableEntityError extends SwiftError {
  constructor(message: string = 'Unprocessable Entity', details?: any) {
    super(message, 422, 'UNPROCESSABLE_ENTITY', details);
    this.name = 'UnprocessableEntityError';
  }
}

export class TooManyRequestsError extends SwiftError {
  constructor(message: string = 'Too Many Requests', retryAfter?: number) {
    super(message, 429, 'TOO_MANY_REQUESTS', { retryAfter });
    this.name = 'TooManyRequestsError';
  }
}

export class InternalServerError extends SwiftError {
  constructor(message: string = 'Internal Server Error', details?: any) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details);
    this.name = 'InternalServerError';
  }
}

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

export class RequestParsingError extends SwiftError {
  constructor(
    public override message: string,
    public parseType: string
  ) {
    super(message, 400, 'PARSING_ERROR', { parseType });
    this.name = 'RequestParsingError';
  }
}

export class TimeoutError extends SwiftError {
  constructor(message: string = 'Request Timeout', timeout?: number) {
    super(message, 408, 'TIMEOUT', { timeout });
    this.name = 'TimeoutError';
  }
}

/**
 * Error factory functions
 */
export const createError = {
  badRequest: (message?: string, details?: any) => new BadRequestError(message, details),
  unauthorized: (message?: string, details?: any) => new UnauthorizedError(message, details),
  forbidden: (message?: string, details?: any) => new ForbiddenError(message, details),
  notFound: (message?: string, details?: any) => new NotFoundError(message, details),
  methodNotAllowed: (message?: string, allowedMethods?: string[]) => new MethodNotAllowedError(message, allowedMethods),
  conflict: (message?: string, details?: any) => new ConflictError(message, details),
  unprocessableEntity: (message?: string, details?: any) => new UnprocessableEntityError(message, details),
  tooManyRequests: (message?: string, retryAfter?: number) => new TooManyRequestsError(message, retryAfter),
  internalServer: (message?: string, details?: any) => new InternalServerError(message, details),
  validation: (message: string, errors: string[], field?: string) => new ValidationError(message, errors, field),
  parsing: (message: string, parseType: string) => new RequestParsingError(message, parseType),
  timeout: (message?: string, timeout?: number) => new TimeoutError(message, timeout)
};

/**
 * Error reporting interface
 */
export interface ErrorReporter {
  report: (error: SwiftError, context: { req: SwiftRequest; res: SwiftResponse }) => void | Promise<void>;
}

/**
 * Console error reporter
 */
export class ConsoleErrorReporter implements ErrorReporter {
  constructor(private includeStack: boolean = true) {}

  report(error: SwiftError, context: { req: SwiftRequest; res: SwiftResponse }): void {
    const { req } = context;
    const timestamp = new Date().toISOString();
    
    console.error(`[${timestamp}] SwiftHTTP Error:`);
    console.error(`  Method: ${req.method}`);
    console.error(`  Path: ${req.path || req.url}`);
    console.error(`  Status: ${error.statusCode}`);
    console.error(`  Message: ${error.message}`);
    console.error(`  Code: ${error.code || 'UNKNOWN'}`);
    
    if (error.details) {
      console.error(`  Details:`, error.details);
    }
    
    if (this.includeStack && error.stack) {
      console.error(`  Stack:`, error.stack);
    }
    
    console.error('---');
  }
}

/**
 * File error reporter
 */
export class FileErrorReporter implements ErrorReporter {
  private logQueue: string[] = [];
  private isWriting = false;

  constructor(private logFilePath: string = './error.log') {}

  async report(error: SwiftError, context: { req: SwiftRequest; res: SwiftResponse }): Promise<void> {
    const { req } = context;
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      method: req.method,
      path: req.path || req.url,
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details,
      userAgent: req.headers['user-agent'],
      ip: req.socket.remoteAddress,
      stack: error.stack
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    this.logQueue.push(logLine);
    
    if (!this.isWriting) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.isWriting = true;
    
    while (this.logQueue.length > 0) {
      const logLine = this.logQueue.shift()!;
      console.log(`Would write to ${this.logFilePath}:`, logLine.trim());
    }
    
    this.isWriting = false;
  }
}

/**
 * Composite error reporter
 */
export class CompositeErrorReporter implements ErrorReporter {
  constructor(private readonly reporters: ErrorReporter[]) {}

  async report(error: SwiftError, context: { req: SwiftRequest; res: SwiftResponse }): Promise<void> {
    await Promise.all(
      this.reporters.map(reporter => 
        Promise.resolve(reporter.report(error, context)).catch(reportError => {
          console.error('Error in error reporter:', reportError);
        })
      )
    );
  }
}

/**
 * Check if error is a SwiftHTTP error
 */
export function isSwiftError(error: any): error is SwiftError {
  return error instanceof SwiftError;
}

/**
 * Convert any error to SwiftError
 */
export function normaliseError(error: any): SwiftError {
  if (isSwiftError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return new InternalServerError(error.message, { originalError: error.name });
  }
  
  return new InternalServerError('Unknown error occurred', { originalError: error });
}