/**
 * Default configuration constants
 *
 * @description Default values used throughout the server for configuration,
 * timeouts, limits, and other operational parameters.
 */

/**
 * Default server port
 */
export const DEFAULT_PORT = 3000;

/**
 * Default server hostname
 */
export const DEFAULT_HOSTNAME = 'localhost';

/**
 * Default request timeout in milliseconds (2 minutes)
 */
export const DEFAULT_TIMEOUT = 120_000;

/**
 * Default maximum connections
 */
export const DEFAULT_MAX_CONNECTIONS = 1000;

/**
 * Default body size limit (10MB)
 */
export const DEFAULT_BODY_SIZE_LIMIT = 10 * 1024 * 1024;

/**
 * Default JSON indentation for development
 */
export const DEFAULT_JSON_INDENT = 2;

/**
 * Default request ID length
 */
export const DEFAULT_REQUEST_ID_LENGTH = 9;

/**
 * HTTP protocol version strings
 */
export const HTTP_PROTOCOL = {
  HTTP_1_0: 'HTTP/1.0',
  HTTP_1_1: 'HTTP/1.1',
  HTTP_2: 'HTTP/2.0',
} as const;

/**
 * Common HTTP response strings
 */
export const HTTP_RESPONSES = {
  BAD_REQUEST: 'HTTP/1.1 400 Bad Request\r\n\r\n',
  UNAUTHORIZED: 'HTTP/1.1 401 Unauthorized\r\n\r\n',
  FORBIDDEN: 'HTTP/1.1 403 Forbidden\r\n\r\n',
  NOT_FOUND: 'HTTP/1.1 404 Not Found\r\n\r\n',
  INTERNAL_ERROR: 'HTTP/1.1 500 Internal Server Error\r\n\r\n',
} as const;
