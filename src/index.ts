import type {Server} from 'http';
import {createServer} from 'http';
import type {
    ErrorContext,
    ErrorHandler,
    Middleware,
    ParamValidator,
    Request,
    Response,
    Route,
    RouteHandler,
    RouteInfo,
    ServerOptions,
} from './types';
import {HttpMethod, DEFAULT_HOSTNAME, DEFAULT_PORT, DEFAULT_REQUEST_ID_LENGTH} from './constants';
import type {ErrorReporter, HttpError} from './utils';
import {
    ConsoleErrorReporter,
    createError,
    enhancedMatchRoute,
    enhanceRequest,
    enhanceResponse,
    logger,
    normalizeError,
} from './utils';
// Pre-configured enhanced classes
import {createSwiftHTTPWithDev, createSwiftHTTPWithEssentials, createSwiftHTTPWithProduction,} from './mixins';

/**
 * SwiftHTTP - A lightweight, high-performance HTTP server with mixin support
 */
export class SwiftHTTP {
    private readonly server: Server;
    private routes: Route[] = [];
    private middleware: Middleware[] = [];
    private errorHandlers: ErrorHandler[] = [];
    private errorReporter: ErrorReporter;
    private globalErrorHandler: ErrorHandler | null = null;

    constructor(private options: ServerOptions = {}) {
        this.server = createServer((req, res) => {
            void this.handleRequest(req as Request, res as Response);
        });

        this.errorReporter = new ConsoleErrorReporter(
            this.options.errorReporting?.includeStack ?? true
        );

        if (this.options.maxConnections) {
            this.server.maxConnections = this.options.maxConnections;
        }
        if (this.options.timeout) {
            this.server.timeout = this.options.timeout;
        }

        this.addDefaultErrorHandling();
    }

    /**
     * Add global middleware
     */
    use(middleware: Middleware): void {
        this.middleware.push(middleware);
    }

    /**
     * Add multiple middleware at once
     */
    useMany(middlewares: Middleware[]): void {
        this.middleware.push(...middlewares);
    }

    /**
     * Add error handler
     */
    addErrorHandler(handler: ErrorHandler): void {
        this.errorHandlers.push(handler);
    }

    /**
     * Set global error handler (legacy method)
     */
    setErrorHandler(handler: ErrorHandler): void {
        this.globalErrorHandler = handler;
    }

    /**
     * Set error reporter
     */
    setErrorReporter(reporter: ErrorReporter): void {
        this.errorReporter = reporter;
    }

    /**
     * Add GET route
     */
    get(path: string, handler: RouteHandler): void;

    get(path: string, middleware: Middleware[], handler: RouteHandler): void;

    get(
        path: string,
        middlewareOrHandler: Middleware[] | RouteHandler,
        handler?: RouteHandler
    ): void {
        if (Array.isArray(middlewareOrHandler)) {
            this.addRouteWithMiddleware('GET', path, middlewareOrHandler, handler!);
        } else {
            this.addRoute('GET', path, middlewareOrHandler);
        }
    }

    /**
     * Add POST route
     */
    post(path: string, handler: RouteHandler): void;

    post(path: string, middleware: Middleware[], handler: RouteHandler): void;

    post(
        path: string,
        middlewareOrHandler: Middleware[] | RouteHandler,
        handler?: RouteHandler
    ): void {
        if (Array.isArray(middlewareOrHandler)) {
            this.addRouteWithMiddleware('POST', path, middlewareOrHandler, handler!);
        } else {
            this.addRoute('POST', path, middlewareOrHandler);
        }
    }

    /**
     * Add PUT route
     */
    put(path: string, handler: RouteHandler): void;

    put(path: string, middleware: Middleware[], handler: RouteHandler): void;

    put(
        path: string,
        middlewareOrHandler: Middleware[] | RouteHandler,
        handler?: RouteHandler
    ): void {
        if (Array.isArray(middlewareOrHandler)) {
            this.addRouteWithMiddleware('PUT', path, middlewareOrHandler, handler!);
        } else {
            this.addRoute('PUT', path, middlewareOrHandler);
        }
    }

    /**
     * Add DELETE route
     */
    delete(path: string, handler: RouteHandler): void;

    delete(path: string, middleware: Middleware[], handler: RouteHandler): void;

    delete(
        path: string,
        middlewareOrHandler: Middleware[] | RouteHandler,
        handler?: RouteHandler
    ): void {
        if (Array.isArray(middlewareOrHandler)) {
            this.addRouteWithMiddleware('DELETE', path, middlewareOrHandler, handler!);
        } else {
            this.addRoute('DELETE', path, middlewareOrHandler);
        }
    }

    /**
     * Add PATCH route
     */
    patch(path: string, handler: RouteHandler): void;

    patch(path: string, middleware: Middleware[], handler: RouteHandler): void;

    patch(
        path: string,
        middlewareOrHandler: Middleware[] | RouteHandler,
        handler?: RouteHandler
    ): void {
        if (Array.isArray(middlewareOrHandler)) {
            this.addRouteWithMiddleware('PATCH', path, middlewareOrHandler, handler!);
        } else {
            this.addRoute('PATCH', path, middlewareOrHandler);
        }
    }

    /**
     * Add route for any HTTP method
     */
    addRoute(method: HttpMethod, path: string, handler: RouteHandler): void {
        this.routes.push({method, path, handler});
    }

    /**
     * Add route with specific middleware
     */
    addRouteWithMiddleware(
        method: HttpMethod,
        path: string,
        middleware: Middleware[],
        handler: RouteHandler
    ): void {
        this.routes.push({method, path, handler, middleware});
    }

    /**
     * Create a route group with shared middleware
     */
    group(prefix: string, middleware: Middleware[], routes: () => void): void {
        const originalRoutes = [...this.routes];
        const originalMiddleware = [...this.middleware];

        this.middleware.push(...middleware);
        routes();

        const newRoutes = this.routes.slice(originalRoutes.length);
        newRoutes.forEach((route) => {
            if (typeof route.path === 'string') {
                route.path = prefix + route.path;
            }
            route.middleware = [...middleware, ...(route.middleware || [])];
        });

        this.middleware = originalMiddleware;
    }

    /**
     * Parameter validation
     */
    param(name: string, validator: ParamValidator): void {
        this.routes.forEach((route) => {
            if (typeof route.path === 'string' && route.path.includes(`:${name}`)) {
                route.params = route.params || {};
                route.params[name] = validator;
            }
        });
    }

    /**
     * List all routes (debugging utility)
     */
    listRoutes(): RouteInfo[] {
        return this.routes.map((route) => ({
            method: route.method,
            path: route.path,
            middlewareCount: route.middleware?.length || 0,
            hasParams: typeof route.path === 'string' && route.path.includes(':'),
            paramNames:
                typeof route.path === 'string'
                    ? route.path
                        .split('/')
                        .filter((segment) => segment.startsWith(':'))
                        .map((param) => param.slice(1))
                    : [],
        }));
    }

    /**
     * Start the server
     */
    listen(port?: number, hostname?: string, callback?: () => void): Server {
        const finalPort = port ?? this.options.port ?? DEFAULT_PORT;
        const finalHostname = hostname ?? this.options.hostname ?? DEFAULT_HOSTNAME;

        return this.server.listen(finalPort, finalHostname, () => {
            logger.info('Server started', {
                hostname: finalHostname,
                port: finalPort,
                url: `http://${finalHostname}:${finalPort}`,
            });
            if (callback) {
                callback();
            }
        });
    }

    /**
     * Stop the server gracefully
     */
    close(callback?: (err?: Error) => void): void {
        logger.info('Shutting down server');
        this.server.close((err) => {
            if (err) {
                logger.error('Error during server shutdown', {error: err.message, stack: err.stack});
            } else {
                logger.info('Server shut down successfully');
            }
            if (callback) {
                callback(err);
            }
        });
    }

    /**
     * Get server instance for advanced configuration
     */
    getServer(): Server {
        return this.server;
    }

    private addDefaultErrorHandling(): void {
        this.server.on('clientError', (err, socket) => {
            logger.error('Client error', {error: err.message, stack: err.stack});
            if (!socket.destroyed) {
                socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            }
        });

        this.server.on('error', (err) => {
            logger.error('Server error', {error: err.message, stack: err.stack});
        });
    }

    /**
     * Main request handler with comprehensive error handling
     */
    private async handleRequest(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();

        try {
            const enhancedReq = await enhanceRequest(req);
            const enhancedRes = await enhanceResponse(res) as Response;

            enhancedRes.req = enhancedReq;
            enhancedReq.id = this.generateRequestId();

            const route = this.findRoute(enhancedReq.method as HttpMethod, enhancedReq.path);

            if (!route) {
                throw createError.notFound(`Cannot ${enhancedReq.method} ${enhancedReq.path}`);
            }

            const {params} = enhancedMatchRoute(route.path, enhancedReq.path);
            enhancedReq.params = params;

            if (route.params) {
                await this.validateRouteParams(route.params, params);
            }

            await this.executeMiddleware(this.middleware, enhancedReq, enhancedRes);

            if (enhancedRes.headersSent) {
                return;
            }

            if (route.middleware) {
                await this.executeMiddleware(route.middleware, enhancedReq, enhancedRes);

                if (enhancedRes.headersSent) {
                    return;
                }
            }

            await this.executeHandler(route.handler, enhancedReq, enhancedRes);
        } catch (error) {
            await this.handleError(error as Error, req, res, startTime);
        }
    }

    private async validateRouteParams(
        validators: Record<string, ParamValidator>,
        params: Record<string, string>
    ): Promise<void> {
        const errors: string[] = [];

        for (const [paramName, validator] of Object.entries(validators)) {
            const paramValue = params[paramName];
            if (paramValue !== undefined) {
                try {
                    const isValid = await validator(paramValue);
                    if (!isValid) {
                        errors.push(`Invalid parameter: ${paramName}`);
                    }
                } catch (error) {
                    errors.push(`Validation error for parameter ${paramName}: ${(error as Error).message}`);
                }
            }
        }

        if (errors.length > 0) {
            throw createError.validation('Parameter validation failed', errors);
        }
    }

    private async executeHandler(handler: RouteHandler, req: Request, res: Response): Promise<void> {
        await handler(req, res);
    }

    /**
     * Generate unique request identifier for tracing
     *
     * @description Creates a unique ID combining timestamp and random string
     * for request tracing and debugging purposes.
     *
     * @returns Unique request ID in format: `req_<timestamp>_<random>`
     *
     * @example
     * ```typescript
     * generateRequestId(); // "req_1699368329123_a4f8k9d2x"
     * ```
     */
    private generateRequestId(): string {
        const random = Math.random().toString(36).substring(2, 2 + DEFAULT_REQUEST_ID_LENGTH);
        return `req_${Date.now()}_${random}`;
    }

    private findRoute(method: HttpMethod, path: string): Route | null {
        for (const route of this.routes) {
            if (route.method === method) {
                const {matches} = enhancedMatchRoute(route.path, path);
                if (matches) {
                    return route;
                }
            }
        }
        return null;
    }

    private async executeMiddleware(
        middlewares: Middleware[],
        req: Request,
        res: Response
    ): Promise<void> {
        let index = 0;

        const dispatch = async (i: number): Promise<void> => {
            if (i <= index) {
                throw new Error('next() called multiple times');
            }
            index = i;

            if (i >= middlewares.length) {
                return;
            }

            const middleware = middlewares[i];
            let nextCalled = false;

            const next = (): Promise<void> => {
                if (nextCalled) {
                    throw new Error('next() called multiple times');
                }
                nextCalled = true;
                return dispatch(i + 1);
            };

            await middleware(req, res, next);
        };

        await dispatch(0);
    }

    private async handleError(
        error: Error,
        req: Request,
        res: Response,
        startTime?: number
    ): Promise<void> {
        const httpError = normalizeError(error);
        const duration = startTime ? Date.now() - startTime : 0;

        const context: ErrorContext = {
            req,
            res,
            timestamp: new Date(),
            userAgent: req.headers['user-agent'],
            ip: req.socket.remoteAddress,
        };

        try {
            await this.errorReporter.report(httpError, context);
        } catch (reportError) {
            logger.error('Error in error reporter', {
                error: reportError instanceof Error ? reportError.message : String(reportError),
            });
        }

        try {
            if (this.errorHandlers.length > 0) {
                for (const handler of this.errorHandlers) {
                    await handler(httpError, req, res, () => {
                    });
                }
            }

            if (this.globalErrorHandler) {
                await this.globalErrorHandler(httpError, req, res, () => {
                });
            }
        } catch (handlerError) {
            logger.error('Error in custom error handlers', {
                error: handlerError instanceof Error ? handlerError.message : String(handlerError),
            });
        }

        if (!res.headersSent) {
            const isDevelopment = process.env.NODE_ENV !== 'production';
            const errorResponse = this.formatErrorResponse(httpError, req, isDevelopment);

            const enhancedReq = req as Request;
            errorResponse.requestId = enhancedReq.id;
            if (duration > 0) {
                errorResponse.duration = `${duration}ms`;
            }

            res.setHeader('Content-Type', 'application/json');

            if (httpError.statusCode === 429 && httpError.details?.retryAfter) {
                res.setHeader('Retry-After', httpError.details.retryAfter);
            }

            res.writeHead(httpError.statusCode);
            res.end(JSON.stringify(errorResponse, null, isDevelopment ? 2 : 0));
        }
    }

    private formatErrorResponse(
        error: HttpError,
        req: Request,
        isDevelopment: boolean
    ): Record<string, unknown> {
        const baseResponse = {
            error: error.message,
            status: error.statusCode,
            code: error.code,
            timestamp: new Date().toISOString(),
        };

        if (isDevelopment) {
            return {
                ...baseResponse,
                details: error.details,
                stack: error.stack,
                request: {
                    method: req.method,
                    path: req.path || req.url,
                    headers: req.headers,
                    params: req.params,
                    query: req.query,
                },
            };
        }

        const productionResponse: Record<string, unknown> = {
            error: error.statusCode >= 500 ? 'Internal Server Error' : error.message,
            status: error.statusCode,
            timestamp: baseResponse.timestamp,
        };

        if (error.statusCode < 500 && error.details) {
            productionResponse.details = error.details;
        }

        return productionResponse;
    }
}

// Export everything
export * from './types';
export * from './middleware';
export * from './mixins';
export * from './utils';



export const SwiftHTTPEssential = createSwiftHTTPWithEssentials(SwiftHTTP);
export const SwiftHTTPDev = createSwiftHTTPWithDev(SwiftHTTP);
export const SwiftHTTPProduction = createSwiftHTTPWithProduction(SwiftHTTP);

// Default export
export default SwiftHTTP;