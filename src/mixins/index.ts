/**
 * SwiftHTTP Mixins - Modular functionality for easy development
 */

// Core mixin utilities
export type Constructor<T = {}> = new (...args: any[]) => T;
export type Mixin<T extends Constructor, R = {}> = (Base: T) => Constructor<R> & T;

export interface BaseMixin {
  readonly mixinName: string;
  readonly mixinVersion: string;
}

/**
 * Mixin registry for tracking applied mixins
 */
export class MixinRegistry {
  private static instance: MixinRegistry;
  private appliedMixins = new Map<string, Set<string>>();

  static getInstance(): MixinRegistry {
    if (!MixinRegistry.instance) {
      MixinRegistry.instance = new MixinRegistry();
    }
    return MixinRegistry.instance;
  }

  register(className: string, mixinName: string): void {
    if (!this.appliedMixins.has(className)) {
      this.appliedMixins.set(className, new Set());
    }
    this.appliedMixins.get(className)!.add(mixinName);
  }

  isApplied(className: string, mixinName: string): boolean {
    return this.appliedMixins.get(className)?.has(mixinName) ?? false;
  }

  getMixins(className: string): string[] {
    return Array.from(this.appliedMixins.get(className) ?? []);
  }
}

/**
 * Apply mixins with proper typing
 */
export function applyMixins<T extends Constructor>(
  Base: T,
  ...mixins: Array<(base: any) => any>
): T {
  let result = Base;
  const registry = MixinRegistry.getInstance();
  
  for (const mixin of mixins) {
    const previous = result;
    result = mixin(previous);
    
    if (result.prototype?.mixinName) {
      registry.register(Base.name, result.prototype.mixinName);
    }
  }
  
  return result;
}

/**
 * Create a mixin with metadata
 */
export function createMixin<TBase extends Constructor, TReturn = {}>(
  name: string,
  version: string = '1.0.0',
  mixinFunction: (Base: TBase) => Constructor<TReturn> & TBase
): Mixin<TBase, TReturn & BaseMixin> {
  return (Base: TBase) => {
    const Mixed = mixinFunction(Base);
    Mixed.prototype.mixinName = name;
    Mixed.prototype.mixinVersion = version;
    return Mixed as Constructor<TReturn & BaseMixin> & TBase;
  };
}

// Import middleware and utilities
import { cors, logger, bodyParser } from '../middleware';
import { Middleware, SwiftRequest, SwiftResponse, HttpMethod, RouteHandler } from '../types';

/**
 * Middleware management mixin
 */
export interface MiddlewareMixin {
  enableCors(options?: Parameters<typeof cors>[0]): this;
  enableLogging(format?: 'dev' | 'combined'): this;
  enableBodyParser(options?: Parameters<typeof bodyParser>[0]): this;
  useWhen(condition: (req: SwiftRequest) => boolean, middleware: Middleware): this;
  useUnless(condition: (req: SwiftRequest) => boolean, middleware: Middleware): this;
  useProduction(): this;
  useDevelopment(): this;
  useBasic(): this;
}

export const MiddlewareMixin = createMixin<Constructor<any>, MiddlewareMixin>(
  'MiddlewareMixin',
  '1.0.0',
  (Base) => {
    return class extends Base implements MiddlewareMixin {
      enableCors(options?: Parameters<typeof cors>[0]): this {
        this.use(cors(options));
        return this;
      }

      enableLogging(format: 'dev' | 'combined' = 'dev'): this {
        this.use(logger(format));
        return this;
      }

      enableBodyParser(options?: Parameters<typeof bodyParser>[0]): this {
        this.use(bodyParser(options));
        return this;
      }

      useWhen(condition: (req: SwiftRequest) => boolean, middleware: Middleware): this {
        this.use((req: SwiftRequest, res: SwiftResponse, next: () => void) => {
          if (condition(req)) {
            middleware(req, res, next);
          } else {
            next();
          }
        });
        return this;
      }

      useUnless(condition: (req: SwiftRequest) => boolean, middleware: Middleware): this {
        return this.useWhen((req) => !condition(req), middleware);
      }

      useProduction(): this {
        return this
          .enableLogging('combined')
          .enableBodyParser();
      }

      useDevelopment(): this {
        return this
          .enableCors()
          .enableLogging('dev')
          .enableBodyParser();
      }

      useBasic(): this {
        return this
          .enableLogging()
          .enableBodyParser();
      }
    };
  }
);

/**
 * Environment-based middleware configuration mixin
 */
export interface EnvironmentMixin {
  configureForEnvironment(env?: string): this;
  isProduction(): boolean;
  isDevelopment(): boolean;
  isTest(): boolean;
}

export const EnvironmentMixin = createMixin<Constructor<any>, EnvironmentMixin>(
  'EnvironmentMixin',
  '1.0.0',
  (Base) => {
    return class extends Base implements EnvironmentMixin {
      configureForEnvironment(env: string = process.env.NODE_ENV || 'development'): this {
        switch (env.toLowerCase()) {
          case 'production':
            if (this.useProduction) {
              this.useProduction();
            }
            break;
          case 'development':
            if (this.useDevelopment) {
              this.useDevelopment();
            }
            break;
          case 'test':
            if (this.useBasic) {
              this.useBasic();
            }
            break;
          default:
            if (this.useBasic) {
              this.useBasic();
            }
        }
        return this;
      }

      isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
      }

      isDevelopment(): boolean {
        return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
      }

      isTest(): boolean {
        return process.env.NODE_ENV === 'test';
      }
    };
  }
);

/**
 * Advanced routing mixin
 */
export interface RoutingMixin {
  resource(name: string, controller: ResourceController): this;
  namespace(prefix: string, middleware: Middleware[], callback: (router: any) => void): this;
  version(version: string, callback: (router: any) => void): this;
  cached(path: string, handler: RouteHandler, ttl?: number): this;
  alias(from: string, to: string): this;
  redirect(from: string, to: string, statusCode?: number): this;
  addHealthCheck(path?: string): this;
  docs(path?: string): this;
}

export interface ResourceController {
  index?: RouteHandler;
  show?: RouteHandler;
  create?: RouteHandler;
  update?: RouteHandler;
  destroy?: RouteHandler;
  edit?: RouteHandler;
  new?: RouteHandler;
}

class RouteCache {
  private cache = new Map<string, { data: any; expires: number }>();

  set(key: string, data: any, ttl: number): void {
    const expires = Date.now() + ttl;
    this.cache.set(key, { data, expires });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  size(): number {
    return this.cache.size;
  }
}

export const RoutingMixin = createMixin<Constructor<any>, RoutingMixin>(
  'RoutingMixin',
  '1.0.0',
  (Base) => {
    return class extends Base implements RoutingMixin {
      private routeCache = new RouteCache();
      private routeAliases = new Map<string, string>();

      resource(name: string, controller: ResourceController): this {
        const basePath = `/${name}`;
        
        if (controller.index) {
          this.get(basePath, controller.index);
        }
        if (controller.show) {
          this.get(`${basePath}/:id`, controller.show);
        }
        if (controller.create) {
          this.post(basePath, controller.create);
        }
        if (controller.update) {
          this.put(`${basePath}/:id`, controller.update);
        }
        if (controller.destroy) {
          this.delete(`${basePath}/:id`, controller.destroy);
        }
        if (controller.edit) {
          this.get(`${basePath}/:id/edit`, controller.edit);
        }
        if (controller.new) {
          this.get(`${basePath}/new`, controller.new);
        }
        
        return this;
      }

      namespace(prefix: string, middleware: Middleware[], callback: (router: any) => void): this {
        this.group(prefix, middleware, callback);
        return this;
      }

      version(version: string, callback: (router: any) => void): this {
        const versionPrefix = `/v${version}`;
        this.group(versionPrefix, [], callback);
        return this;
      }

      cached(path: string, handler: RouteHandler, ttl: number = 300000): this {
        const cachedHandler: RouteHandler = async (req, res) => {
          const cacheKey = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
          const cached = this.routeCache.get(cacheKey);
          
          if (cached) {
            res.setHeader('X-Cache', 'HIT');
            res.json(cached);
            return;
          }
          
          const originalJson = res.json.bind(res);
          res.json = (data: any) => {
            this.routeCache.set(cacheKey, data, ttl);
            res.setHeader('X-Cache', 'MISS');
            return originalJson(data);
          };
          
          await handler(req, res);
        };
        
        this.get(path, cachedHandler);
        return this;
      }

      alias(from: string, to: string): this {
        this.routeAliases.set(from, to);
        this.get(from, (req: SwiftRequest, res: SwiftResponse) => {
          res.redirect(to, 301);
        });
        return this;
      }

      redirect(from: string, to: string, statusCode: number = 302): this {
        this.get(from, (req: SwiftRequest, res: SwiftResponse) => {
          res.redirect(to, statusCode);
        });
        return this;
      }

      addHealthCheck(path: string = '/health'): this {
        this.get(path, (req: SwiftRequest, res: SwiftResponse) => {
          const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version,
            environment: process.env.NODE_ENV || 'development',
            routeCache: {
              size: this.routeCache.size(),
              aliases: this.routeAliases.size
            }
          };
          
          res.json(healthData);
        });
        return this;
      }

      docs(path: string = '/docs'): this {
        this.get(path, (req: SwiftRequest, res: SwiftResponse) => {
          const routes = this.listRoutes();
          const documentation = {
            title: 'SwiftHTTP API Documentation',
            version: '1.0.0',
            generatedAt: new Date().toISOString(),
            routes: routes.map((route: { method: any; path: any; hasParams: any; paramNames: any; middlewareCount: any; }) => ({
              method: route.method,
              path: route.path,
              hasParams: route.hasParams,
              paramNames: route.paramNames,
              middlewareCount: route.middlewareCount
            })),
            aliases: Object.fromEntries(this.routeAliases),
            cacheSize: this.routeCache.size()
          };
          
          res.json(documentation);
        });
        return this;
      }
    };
  }
);

/**
 * Development utilities mixin
 */
export interface DevUtilitiesMixin {
  enableDevMode(): this;
  addDebugRoutes(): this;
  dumpRoutes(): void;
  profileMemory(): MemoryProfile;
}

export interface MemoryProfile {
  used: number;
  total: number;
  external: number;
  heapUsed: number;
  heapTotal: number;
  buffers: number;
}

export const DevUtilitiesMixin = createMixin<Constructor<any>, DevUtilitiesMixin>(
  'DevUtilitiesMixin',
  '1.0.0',
  (Base) => {
    return class extends Base implements DevUtilitiesMixin {
      private devMode = false;

      enableDevMode(): this {
        this.devMode = true;
        
        this.use((req: SwiftRequest, res: SwiftResponse, next: () => void) => {
          res.setHeader('X-Dev-Mode', 'true');
          res.setHeader('X-Request-ID', `dev_${Date.now()}`);
          
          console.log(`[DEV] ${req.method} ${req.path}`, {
            headers: req.headers,
            query: req.query,
            params: req.params
          });
          
          next();
        });
        
        return this;
      }

      addDebugRoutes(): this {
        this.get('/_debug/routes', (req: SwiftRequest, res: SwiftResponse) => {
          res.json({
            routes: this.listRoutes(),
            totalRoutes: this.listRoutes().length
          });
        });

        this.get('/_debug/memory', (req: SwiftRequest, res: SwiftResponse) => {
          res.json(this.profileMemory());
        });

        this.get('/_debug/server', (req: SwiftRequest, res: SwiftResponse) => {
          res.json({
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            uptime: process.uptime(),
            pid: process.pid,
            environment: process.env.NODE_ENV || 'development',
            devMode: this.devMode
          });
        });

        return this;
      }

      dumpRoutes(): void {
        const routes = this.listRoutes();
        console.log('\n=== SwiftHTTP Routes ===');
        routes.forEach((route: { method: string; path: any; hasParams: any; paramNames: any[]; middlewareCount: number; }) => {
          console.log(`${route.method.padEnd(7)} ${route.path}`);
          if (route.hasParams) {
            console.log(`         Params: ${route.paramNames.join(', ')}`);
          }
          if (route.middlewareCount > 0) {
            console.log(`         Middleware: ${route.middlewareCount}`);
          }
        });
        console.log(`\nTotal routes: ${routes.length}\n`);
      }

      profileMemory(): MemoryProfile {
        const memUsage = process.memoryUsage();
        return {
          used: memUsage.rss,
          total: memUsage.rss + memUsage.external,
          external: memUsage.external,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          buffers: memUsage.arrayBuffers
        };
      }
    };
  }
);

/**
 * Pre-configured mixin combinations
 */
export const EssentialMixins = [
  MiddlewareMixin,
  EnvironmentMixin,
  RoutingMixin
];

export const DevelopmentMixins = [
  ...EssentialMixins,
  DevUtilitiesMixin
];

export const ProductionMixins = [
  MiddlewareMixin,
  EnvironmentMixin,
  RoutingMixin
];

/**
 * Helper functions to create enhanced SwiftHTTP classes
 */
export function createSwiftHTTPWithEssentials<T>(BaseClass: T) {
  return applyMixins(BaseClass as any, ...EssentialMixins);
}

export function createSwiftHTTPWithDev<T>(BaseClass: T) {
  return applyMixins(BaseClass as any, ...DevelopmentMixins);
}

export function createSwiftHTTPWithProduction<T>(BaseClass: T) {
  return applyMixins(BaseClass as any, ...ProductionMixins);
}

/**
 * Type helpers for enhanced SwiftHTTP classes
 */
export type SwiftHTTPWithEssentials<T> = T & 
  InstanceType<ReturnType<typeof MiddlewareMixin>> &
  InstanceType<ReturnType<typeof EnvironmentMixin>> &
  InstanceType<ReturnType<typeof RoutingMixin>>;

export type SwiftHTTPWithDev<T> = SwiftHTTPWithEssentials<T> &
  InstanceType<ReturnType<typeof DevUtilitiesMixin>>;

export type SwiftHTTPWithProduction<T> = SwiftHTTPWithEssentials<T>;