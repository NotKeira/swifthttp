/**
 * Middleware type definitions
 *
 * @description Type definitions for middleware functions and configurations.
 */

import type {Request} from './request.types';
import type {Response} from './response.types';

/**
 * Next function type for middleware chain
 */
export type NextFunction = () => void;

/**
 * Middleware function type
 *
 * @param req - Enhanced request object
 * @param res - Enhanced response object
 * @param next - Function to call next middleware
 */
export type Middleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => void | Promise<void>;

/**
 * Error handler middleware function type
 *
 * @param error - Error object
 * @param req - Enhanced request object
 * @param res - Enhanced response object
 * @param next - Function to call next error handler
 */
export type ErrorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => void | Promise<void>;