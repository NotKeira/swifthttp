/**
 * Router type definitions
 *
 * @description Type definitions for routing, route handlers, and route configuration.
 */

import type { HttpMethod } from '../constants';
import type { Request } from './request.types';
import type { Response } from './response.types';
import type { Middleware } from './middleware.types';

/**
 * Route handler function type
 *
 * @param req - Enhanced request object
 * @param res - Enhanced response object
 */
export type RouteHandler = (
    req: Request,
    res: Response
) => void | Promise<void>;

/**
 * Parameter validator function
 *
 * @param value - Parameter value to validate
 * @returns Whether the parameter is valid
 */
export type ParamValidator = (value: string) => boolean | Promise<boolean>;

/**
 * Enhanced route definition with regex support
 */
export interface Route {
    /**
     * HTTP method for this route
     */
    method: HttpMethod;

    /**
     * Route path pattern (string or regex)
     */
    path: string | RegExp;

    /**
     * Route handler function
     */
    handler: RouteHandler;

    /**
     * Route-specific middleware
     */
    middleware?: Middleware[];

    /**
     * Parameter validators
     */
    params?: Record<string, ParamValidator>;
}

/**
 * Route group configuration
 */
export interface RouteGroup {
    /**
     * Path prefix for all routes in group
     */
    prefix: string;

    /**
     * Middleware applied to all routes in group
     */
    middleware: Middleware[];

    /**
     * Routes in this group
     */
    routes: Route[];
}

/**
 * Route debugging information
 */
export interface RouteInfo {
    /**
     * HTTP method
     */
    method: HttpMethod;

    /**
     * Route path pattern
     */
    path: string | RegExp;

    /**
     * Number of middleware functions
     */
    middlewareCount: number;

    /**
     * Whether route has parameters
     */
    hasParams: boolean;

    /**
     * List of parameter names
     */
    paramNames: string[];
}