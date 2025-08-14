import { createServer, Server } from "http";
import {
  HttpMethod,
  SwiftRequest,
  SwiftResponse,
  RouteHandler,
  Middleware,
  Route,
  ServerOptions,
  ErrorHandler,
  SwiftError,
  ParamValidator,
  RouteInfo,
} from "./types";
import { enhanceRequest, enhancedMatchRoute } from "./utils/request";
import { enhanceResponse } from "./utils/response";
import { Router } from "./router";

/**
 * SwiftHTTP - A lightweight, high-performance HTTP server
 */
export class SwiftHTTP {
  private readonly server: Server;
  private readonly routes: Route[] = [];
  private middleware: Middleware[] = [];
  private errorHandler: ErrorHandler | null = null;

  constructor(private readonly options: ServerOptions = {}) {
    this.server = createServer((req, res) => {
      this.handleRequest(req as SwiftRequest, res as SwiftResponse);
    });
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
   * Add middleware with error handling
   */
  useWithErrorHandling(middleware: Middleware): void {
    const wrappedMiddleware: Middleware = async (req, res, next) => {
      try {
        await middleware(req, res, next);
      } catch (error) {
        await this.handleError(error as Error, req, res);
      }
    };
    this.middleware.push(wrappedMiddleware);
  }

  /**
   * Create a router instance
   */
  router(prefix: string = ""): Router {
    return new Router(prefix);
  }

  /**
   * Mount a router
   */
  mount(path: string, router: Router): void {
    const routes = router.getRoutes();
    routes.forEach((route) => {
      const mountedRoute = { ...route };
      mountedRoute.path =
        path +
        (typeof route.path === "string" ? route.path : route.path.source);
      this.routes.push(mountedRoute);
    });
  }

  /**
   * Add GET route
   */
  get(path: string, handler: RouteHandler): void {
    this.addRoute("GET", path, handler);
  }

  /**
   * Add POST route
   */
  post(path: string, handler: RouteHandler): void {
    this.addRoute("POST", path, handler);
  }

  /**
   * Add PUT route
   */
  put(path: string, handler: RouteHandler): void {
    this.addRoute("PUT", path, handler);
  }

  /**
   * Add DELETE route
   */
  delete(path: string, handler: RouteHandler): void {
    this.addRoute("DELETE", path, handler);
  }

  /**
   * Add PATCH route
   */
  patch(path: string, handler: RouteHandler): void {
    this.addRoute("PATCH", path, handler);
  }

  /**
   * Add route for any HTTP method
   */
  addRoute(method: HttpMethod, path: string, handler: RouteHandler): void {
    this.routes.push({ method, path, handler });
  }

  /**
   * Add regex route
   */
  addRegexRoute(
    method: HttpMethod,
    pattern: RegExp,
    handler: RouteHandler
  ): void {
    this.routes.push({ method, path: pattern, handler });
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
    this.routes.push({ method, path, handler, middleware });
  }

  /**
   * Create a route group with shared middleware
   */
  group(prefix: string, middleware: Middleware[], routes: () => void): void {
    const originalRoutes = [...this.routes];

    // Temporarily store current middleware
    const originalMiddleware = [...this.middleware];

    // Add group middleware
    this.middleware.push(...middleware);

    // Execute route definitions
    routes();

    // Add prefix to new routes and attach group middleware
    const newRoutes = this.routes.slice(originalRoutes.length);
    newRoutes.forEach((route) => {
      if (typeof route.path === "string") {
        route.path = prefix + route.path;
      }
      route.middleware = [...middleware, ...(route.middleware || [])];
    });

    // Restore original middleware
    this.middleware = originalMiddleware;
  }

  /**
   * Parameter validation
   */
  param(name: string, validator: ParamValidator): void {
    // Add parameter validation to routes that have this parameter
    this.routes.forEach((route) => {
      if (typeof route.path === "string" && route.path.includes(`:${name}`)) {
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
      hasParams: typeof route.path === "string" && route.path.includes(":"),
      paramNames:
        typeof route.path === "string"
          ? route.path
              .split("/")
              .filter((segment) => segment.startsWith(":"))
              .map((param) => param.slice(1))
          : [],
    }));
  }

  /**
   * Set custom error handler
   */
  setErrorHandler(handler: ErrorHandler): void {
    this.errorHandler = handler;
  }

  /**
   * Start the server
   */
  listen(port?: number, hostname?: string, callback?: () => void): Server {
    const finalPort = port ?? this.options.port ?? 3000;
    const finalHostname = hostname ?? this.options.hostname ?? "localhost";

    if (this.options.maxConnections) {
      this.server.maxConnections = this.options.maxConnections;
    }

    if (this.options.timeout) {
      this.server.timeout = this.options.timeout;
    }

    return this.server.listen(finalPort, finalHostname, callback);
  }

  /**
   * Stop the server
   */
  close(callback?: (err?: Error) => void): void {
    this.server.close(callback);
  }

  /**
   * Main request handler
   */
  private async handleRequest(
    req: SwiftRequest,
    res: SwiftResponse
  ): Promise<void> {
    try {
      // Enhance request and response objects
      const enhancedReq = await enhanceRequest(req);
      const enhancedRes = enhanceResponse(res);

      // Find matching route
      const route = this.findRoute(
        enhancedReq.method as HttpMethod,
        enhancedReq.path
      );

      if (!route) {
        enhancedRes.status(404).json({ error: "Not Found" });
        return;
      }

      // Set route parameters and validate them
      const { params } = enhancedMatchRoute(route.path, enhancedReq.path);
      enhancedReq.params = params;

      // Validate parameters if validators exist
      if (route.params) {
        for (const [paramName, validator] of Object.entries(route.params)) {
          const paramValue = params[paramName];
          if (paramValue !== undefined) {
            const isValid = await validator(paramValue);
            if (!isValid) {
              enhancedRes
                .status(400)
                .json({ error: `Invalid parameter: ${paramName}` });
              return;
            }
          }
        }
      }

      // Execute global middleware first
      await this.executeMiddleware(this.middleware, enhancedReq, enhancedRes);

      // Execute route-specific middleware if any
      if (route.middleware) {
        await this.executeMiddleware(
          route.middleware,
          enhancedReq,
          enhancedRes
        );
      }

      // Execute route handler
      await route.handler(enhancedReq, enhancedRes);
    } catch (error) {
      await this.handleError(error as Error, req, res);
    }
  }

  /**
   * Find matching route for method and path
   */
  private findRoute(method: HttpMethod, path: string): Route | null {
    for (const route of this.routes) {
      if (route.method === method) {
        const { matches } = enhancedMatchRoute(route.path, path);
        if (matches) {
          return route;
        }
      }
    }
    return null;
  }

  /**
   * Execute middleware chain
   */
  private async executeMiddleware(
    middlewares: Middleware[],
    req: SwiftRequest,
    res: SwiftResponse
  ): Promise<void> {
    let index = 0;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;

      if (i >= middlewares.length) {
        return; // All middleware executed
      }

      const middleware = middlewares[i];
      let nextCalled = false;

      const next = () => {
        if (nextCalled) {
          throw new Error("next() called multiple times");
        }
        nextCalled = true;
        return dispatch(i + 1);
      };

      await middleware(req, res, next);

      // If next() wasn't called and response isn't sent, stop the chain
      if (!nextCalled && !res.headersSent) {
        return;
      }
    };

    await dispatch(0);
  }

  /**
   * Error handler
   */
  private async handleError(
    error: Error,
    req: SwiftRequest,
    res: SwiftResponse
  ): Promise<void> {
    if (this.errorHandler) {
      this.errorHandler(error, req, res, () => {});
      return;
    }

    // Default error handling
    const statusCode = error instanceof SwiftError ? error.statusCode : 500;
    const message = error.message || "Internal Server Error";

    if (!res.headersSent) {
      res.writeHead(statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: message }));
    }
  }
}

// Export types for users
export * from "./types";

// Default export
export default SwiftHTTP;
