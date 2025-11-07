/**
 * Request type definitions
 *
 * @description Type definitions for HTTP request objects with 
 * properties beyond the base Node.js IncomingMessage.
 */
// @ts-ignore
import type { IncomingMessage } from 'http';

/**
 * File upload interface for multipart/form-data requests
 */
export interface UploadedFile {
    /**
     * Field name from the form
     */
    name: string;

    /**
     * Original filename
     */
    filename?: string;

    /**
     * MIME type of the uploaded file
     */
    mimetype?: string;

    /**
     * File data as Buffer
     */
    data: Buffer;

    /**
     * File size in bytes
     */
    size: number;
}

/**
 *  Enhanced request interface with additional properties
 *
 * @extends IncomingMessage
 */
export interface Request extends IncomingMessage {
    /**
     * Unique request identifier for tracing
     */
    id?: string;

    /**
     * Parsed request path (without query string)
     */
    path: string;

    /**
     * Parsed query string parameters
     */
    query: Record<string, string>;

    /**
     * Route parameters extracted from path
     */
    params: Record<string, string>;

    /**
     * Parsed request body
     */
    body: unknown;

    /**
     * Uploaded files (if multipart/form-data)
     */
    files?: UploadedFile[];

    /**
     * Raw request body buffer
     */
    raw?: Buffer;

    /**
     * Parsed cookies
     */
    cookies?: Record<string, string>;

    /**
     * Content type negotiation helper
     *
     * @param types - Array of acceptable content types
     * @returns Best matching type or null
     */
    accepts?: (types: string[]) => string | null;
}

/**
 * Request parsing options
 */
export interface RequestParsingOptions {
    /**
     * Maximum request body size (e.g., '10mb', '1gb')
     */
    limit?: string;

    /**
     * Enable JSON body parsing
     */
    json?: boolean;

    /**
     * Enable URL-encoded form parsing
     */
    urlencoded?: boolean;

    /**
     * Enable plain text parsing
     */
    text?: boolean;

    /**
     * Enable raw buffer parsing
     */
    raw?: boolean;

    /**
     * Enable multipart/form-data parsing
     */
    multipart?: boolean;
}

/**
 * Content type validation options
 */
export interface ContentTypeOptions {
    /**
     * List of allowed content types
     */
    allowedContentTypes?: string[];

    /**
     * Maximum allowed content size
     */
    maxSize?: string;

    /**
     * Require Content-Type header
     */
    requireContentType?: boolean;
}