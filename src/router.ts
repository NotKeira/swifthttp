import { HttpMethod, Route, RouteHandler, Middleware } from "./types";

/**
 * Router class for better route organisation
 */
export class Router {
  private readonly routes: Route[] = [];
  private readonly prefix: string = "";
  private readonly middleware: Middleware[] = [];

  constructor(prefix: string = "") {
    this.prefix = prefix;
  }

  /**
   * Add middleware to the router
   */
  use(middleware: Middleware): this {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * Add GET route
   */
  get(path: string, handler: RouteHandler): this {
    this.addRoute("GET", path, handler);
    return this;
  }

  /**
   * Add POST route
   */
  post(path: string, handler: RouteHandler): this {
    this.addRoute("POST", path, handler);
    return this;
  }

  /**
   * Add DELETE route
   */
  delete(path: string, handler: RouteHandler): this {
    this.addRoute("DELETE", path, handler);
    return this;
  }

  /**
   * Add PATCH route
   */
  patch(path: string, handler: RouteHandler): this {
    this.addRoute("PATCH", path, handler);
    return this;
  }

  /**
   * Add route for any HTTP method
   */
  addRoute(method: HttpMethod, path: string, handler: RouteHandler): this {
    const fullPath = this.prefix + path;
    this.routes.push({
      method,
      path: fullPath,
      handler,
      middleware: [...this.middleware],
    });
    return this;
  }

  /**
   * Create a sub-router with an additional prefix
   */
  router(prefix: string): Router {
    return new Router(this.prefix + prefix);
  }

  /**
   * Get all routes from this router
   */
  getRoutes(): Route[] {
    return this.routes;
  }

  /**
   * Route parameter validation
   */
  param(
    name: string,
    validator: (value: string) => boolean | Promise<boolean>
  ): this {
    // Store parameter validators for later use
    // This would be implemented in the main SwiftHTTP class
    console.warn("Parameter validation not yet implemented");
    return this;
  }
}
