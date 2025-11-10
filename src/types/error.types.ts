/**
 * Error type definitions
 *
 * @description Custom error classes and error handling types.
 */

import type {Request} from './request.types';
import type {Response} from './response.types';

/**
 * Error context for error handlers
 */
export interface ErrorContext {
    /**
     * Request object
     */
    req: Request;

    /**
     * Response object
     */
    res: Response;

    /**
     * Error timestamp
     */
    timestamp: Date;

    /**
     * User agent string
     */
    userAgent?: string | undefined;

    /**
     * Client IP address
     */
    ip?: string | undefined;
}

/**
 * HTTP error class
 *
 * @description Base error class for all HTTP errors with status codes
 * and structured error information.
 */
export class HttpError extends Error {
    /**
     * Creates a new HttpError
     *
     * @param message - Error message
     * @param statusCode - HTTP status code (default: 500)
     * @param code - Error code for programmatic handling
     * @param details - Additional error details
     */
    constructor(
        public override message: string,
        public statusCode: number = 500,
        public code?: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'HttpError';
        Error.captureStackTrace?.(this, HttpError);
    }

    /**
     * Convert error to JSON representation
     *
     * @returns JSON object with error details
     */
    toJSON(): Record<string, unknown> {
        return {
            error: this.message,
            status: this.statusCode,
            code: this.code,
            details: this.details,
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * Validation error class for request validation failures
 */
export class ValidationError extends HttpError {
    /**
     * Creates a new ValidationError
     *
     * @param message - Error message
     * @param errors - Array of validation error messages
     * @param field - Field name that failed validation
     */
    constructor(
        public override message: string,
        public errors: string[],
        public field?: string
    ) {
        super(message, 400, 'VALIDATION_ERROR', {errors, field});
        this.name = 'ValidationError';
    }
}

/**
 * Request parsing error class
 */
export class RequestParsingError extends HttpError {
    /**
     * Creates a new RequestParsingError
     *
     * @param message - Error message
     * @param parseType - Type of parsing that failed (e.g., 'json', 'multipart')
     */
    constructor(
        public override message: string,
        public parseType: string
    ) {
        super(message, 400, 'PARSING_ERROR', {parseType});
        this.name = 'RequestParsingError';
    }
}