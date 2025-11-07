/**
 * Server type definitions
 *
 * @description Type definitions for server configuration and options.
 */

/**
 * Server configuration options
 */
export interface ServerOptions {
    /**
     * Port number to listen on
     */
    port?: number;

    /**
     * Hostname to bind to
     */
    hostname?: string;

    /**
     * Maximum number of concurrent connections
     */
    maxConnections?: number;

    /**
     * Request timeout in milliseconds
     */
    timeout?: number;

    /**
     * Error reporting configuration
     */
    errorReporting?: {
        /**
         * Enable error reporting
         */
        enabled?: boolean;

        /**
         * Include stack traces in error reports
         */
        includeStack?: boolean;

        /**
         * Log file path for error logs
         */
        logFile?: string;
    };
}

/**
 * Circuit breaker state
 */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
    /**
     * Error threshold before opening circuit
     */
    threshold?: number;

    /**
     * Request timeout in milliseconds
     */
    timeout?: number;

    /**
     * Time before attempting to close circuit again
     */
    resetTimeout?: number;

    /**
     * Callback when circuit breaker state changes
     *
     * @param state - New circuit breaker state
     */
    onStateChange?: (state: CircuitBreakerState) => void;
}