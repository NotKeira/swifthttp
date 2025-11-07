/**
 * Error message constants
 *
 * @description Standardised error messages used throughout the server.
 */

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
  // Middleware errors
  NEXT_CALLED_MULTIPLE_TIMES: 'next() called multiple times',
  MIDDLEWARE_ERROR: 'Error in middleware execution',

  // Routing errors
  ROUTE_NOT_FOUND: 'Route not found',
  METHOD_NOT_ALLOWED: 'Method not allowed',
  INVALID_ROUTE_PATTERN: 'Invalid route pattern',

  // Request errors
  BODY_PARSE_FAILED: 'Failed to parse request body',
  INVALID_JSON: 'Invalid JSON in request body',
  REQUEST_TIMEOUT: 'Request timeout',
  PAYLOAD_TOO_LARGE: 'Request payload too large',

  // Validation errors
  VALIDATION_FAILED: 'Validation failed',
  INVALID_PARAMETER: 'Invalid parameter',
  REQUIRED_PARAMETER_MISSING: 'Required parameter missing',

  // Server errors
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service unavailable',

  // Authentication/Authorization
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  INVALID_TOKEN: 'Invalid authentication token',
} as const;

/**
 * Error codes for programmatic handling
 */
export const ERROR_CODES = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
} as const;
