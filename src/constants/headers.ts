/**
 * HTTP header name constants
 *
 * @description Standardised HTTP header names to prevent typos and ensure
 * consistency across the codebase.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
 */

/**
 * Common HTTP request headers
 */
export const REQUEST_HEADERS = {
  ACCEPT: 'Accept',
  ACCEPT_ENCODING: 'Accept-Encoding',
  ACCEPT_LANGUAGE: 'Accept-Language',
  AUTHORIZATION: 'Authorization',
  CACHE_CONTROL: 'Cache-Control',
  CONNECTION: 'Connection',
  CONTENT_LENGTH: 'Content-Length',
  CONTENT_TYPE: 'Content-Type',
  COOKIE: 'Cookie',
  HOST: 'Host',
  IF_MODIFIED_SINCE: 'If-Modified-Since',
  IF_NONE_MATCH: 'If-None-Match',
  ORIGIN: 'Origin',
  REFERER: 'Referer',
  USER_AGENT: 'User-Agent',
} as const;

/**
 * Common HTTP response headers
 */
export const RESPONSE_HEADERS = {
  ACCESS_CONTROL_ALLOW_CREDENTIALS: 'Access-Control-Allow-Credentials',
  ACCESS_CONTROL_ALLOW_HEADERS: 'Access-Control-Allow-Headers',
  ACCESS_CONTROL_ALLOW_METHODS: 'Access-Control-Allow-Methods',
  ACCESS_CONTROL_ALLOW_ORIGIN: 'Access-Control-Allow-Origin',
  ACCESS_CONTROL_EXPOSE_HEADERS: 'Access-Control-Expose-Headers',
  ACCESS_CONTROL_MAX_AGE: 'Access-Control-Max-Age',
  CACHE_CONTROL: 'Cache-Control',
  CONTENT_DISPOSITION: 'Content-Disposition',
  CONTENT_ENCODING: 'Content-Encoding',
  CONTENT_LENGTH: 'Content-Length',
  CONTENT_TYPE: 'Content-Type',
  ETAG: 'ETag',
  EXPIRES: 'Expires',
  LAST_MODIFIED: 'Last-Modified',
  LOCATION: 'Location',
  RETRY_AFTER: 'Retry-After',
  SET_COOKIE: 'Set-Cookie',
  VARY: 'Vary',
  X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
  X_FRAME_OPTIONS: 'X-Frame-Options',
  X_XSS_PROTECTION: 'X-XSS-Protection',
} as const;

/**
 * Security-related headers
 */
export const SECURITY_HEADERS = {
  CONTENT_SECURITY_POLICY: 'Content-Security-Policy',
  STRICT_TRANSPORT_SECURITY: 'Strict-Transport-Security',
  X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
  X_FRAME_OPTIONS: 'X-Frame-Options',
  X_XSS_PROTECTION: 'X-XSS-Protection',
  REFERRER_POLICY: 'Referrer-Policy',
  PERMISSIONS_POLICY: 'Permissions-Policy',
} as const;
