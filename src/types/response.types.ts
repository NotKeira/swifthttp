/**
 * Response type definitions
 *
 * @description Type definitions for HTTP response objects with enhanced
 * methods beyond the base Node.js ServerResponse.
 */
// @ts-ignore
import type { ServerResponse } from 'http';

/**
 * Cookie options for cookie handling
 */
export interface CookieOptions {
    /**
     * Maximum age in milliseconds
     */
    maxAge?: number;

    /**
     * Cookie expiration date
     */
    expires?: Date;

    /**
     * HttpOnly flag (not accessible via JavaScript)
     */
    httpOnly?: boolean;

    /**
     * Secure flag (HTTPS only)
     */
    secure?: boolean;

    /**
     * Cookie domain
     */
    domain?: string;

    /**
     * Cookie path
     */
    path?: string;

    /**
     * SameSite attribute
     */
    sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Cache control options
 */
export interface CacheOptions {
    /**
     * Public cache directive
     */
    public?: boolean;

    /**
     * Private cache directive
     */
    private?: boolean;

    /**
     * No-cache directive
     */
    noCache?: boolean;

    /**
     * No-store directive
     */
    noStore?: boolean;

    /**
     * Must-revalidate directive
     */
    mustRevalidate?: boolean;
}

/**
 * Security headers configuration
 */
export interface SecurityHeaders {
    /**
     * Content-Security-Policy header value
     */
    contentSecurityPolicy?: string;

    /**
     * Strict-Transport-Security header value
     */
    strictTransportSecurity?: string;

    /**
     * X-Frame-Options header value
     */
    xFrameOptions?: string;

    /**
     * Enable X-Content-Type-Options: nosniff
     */
    xContentTypeOptions?: boolean;

    /**
     * Referrer-Policy header value
     */
    referrerPolicy?: string;

    /**
     * Permissions-Policy header value
     */
    permissionsPolicy?: string;
}

/**
 * Enhanced response interface with additional methods
 *
 * @extends ServerResponse
 */
export interface Response extends ServerResponse {
    /**
     * Send JSON response
     *
     * @param data - Data to serialize as JSON
     */
    json(data: unknown): void;

    /**
     * Set response status code
     *
     * @param code - HTTP status code
     * @returns This response object for chaining
     */
    status(code: number): Response;

    /**
     * Send text or buffer response
     *
     * @param data - Text data to send
     */
    send(data: string | Buffer): void;

    /**
     * Redirect to URL
     *
     * @param url - URL to redirect to
     * @param statusCode - HTTP status code (default: 302)
     */
    redirect(url: string, statusCode?: number): void;

    /**
     * Set cookie
     *
     * @param name - Cookie name
     * @param value - Cookie value
     * @param options - Cookie options
     * @returns This response object for chaining
     */
    cookie(name: string, value: string, options?: CookieOptions): Response;

    /**
     * Clear cookie
     *
     * @param name - Cookie name
     * @param options - Cookie options (without maxAge/expires)
     * @returns This response object for chaining
     */
    clearCookie(name: string, options?: Omit<CookieOptions, 'maxAge' | 'expires'>): Response;

    /**
     * Download file
     *
     * @param filePath - File path
     * @param filename - Optional filename for download
     */
    download(filePath: string, filename?: string): void;

    /**
     * Set Content-Disposition header for attachment
     *
     * @param filename - Optional filename
     * @returns This response object for chaining
     */
    attachment(filename?: string): Response;

    /**
     * Render template with data
     *
     * @param template - Template name or path
     * @param data - Template data
     */
    render(template: string, data?: unknown): void;

    /**
     * Set cache control headers
     *
     * @param maxAge - Maximum age in seconds
     * @param options - Additional cache options
     * @returns This response object for chaining
     */
    cache(maxAge: number, options?: CacheOptions): Response;

    /**
     * Compress response data
     *
     * @param data - Data to compress
     * @param force - Force compression even for small payloads
     */
    compress(data: string | Buffer, force?: boolean): Promise<void>;

    /**
     * Set security headers
     *
     * @param options - Security header options
     * @returns This response object for chaining
     */
    security(options?: SecurityHeaders): Response;

    /**
     * Set Content-Type header
     *
     * @param contentType - Content type value
     * @returns This response object for chaining
     */
    type(contentType: string): Response;

    /**
     * Add Vary header
     *
     * @param field - Field name
     * @returns This response object for chaining
     */
    vary(field: string): Response;
}