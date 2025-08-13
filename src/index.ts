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
} from "./types";
import { enhanceRequest, matchRoute } from "./utils/request";
import { enhanceResponse } from "./utils/response";

/**
 * SwiftHTTP - A lightweight, high-performance HTTP server
 */
export class SwiftHTTP {
  private readonly server: Server;
  private readonly routes: Route[] = [];
  private readonly middleware: Middleware[] = [];
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

      // Set route parameters
      const { params } = matchRoute(route.path, enhancedReq.path);
      enhancedReq.params = params;

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
        const { matches } = matchRoute(route.path, path);
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
    for (const middleware of middlewares) {
      let nextCalled = false;

      const next = () => {
        nextCalled = true;
      };

      await middleware(req, res, next);

      // If next() wasn't called, stop the middleware chain
      if (!nextCalled) {
        break;
      }
    }
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
