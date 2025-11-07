/**
 * HTTP method constants
 *
 * @description Standard HTTP methods as defined in RFC 7231.
 * Used for route registration and request handling.
 *
 * @see https://tools.ietf.org/html/rfc7231#section-4
 */

/**
 * HTTP methods enum
 */
export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    PATCH = 'PATCH',
    HEAD = 'HEAD',
    OPTIONS = 'OPTIONS',
    TRACE = 'TRACE',
    CONNECT = 'CONNECT'
}

/**
 * HTTP methods that typically have request bodies
 */
export const METHODS_WITH_BODY: readonly HttpMethod[] = [
    HttpMethod.POST,
    HttpMethod.PUT,
    HttpMethod.PATCH,
] as const;

/**
 * HTTP methods that are considered safe (read-only)
 */
export const SAFE_METHODS: readonly HttpMethod[] = [
    HttpMethod.GET,
    HttpMethod.HEAD,
    HttpMethod.OPTIONS
] as const;

/**
 * HTTP methods that are idempotent
 */
export const IDEMPOTENT_METHODS: readonly HttpMethod[] = [
    HttpMethod.GET,
    HttpMethod.HEAD,
    HttpMethod.PUT,
    HttpMethod.DELETE,
    HttpMethod.OPTIONS,
    HttpMethod.TRACE,
] as const;