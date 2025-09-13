# SwiftHTTP

A lightweight, high-performance HTTP server for Node.js. Built for speed and simplicity without sacrificing advanced features. TypeScript-first with zero dependencies.

## Features

- ⚡ **Blazing Fast** - Optimised for performance with zero overhead
- 🪶 **Lightweight** - Zero dependencies, minimal footprint (~50KB)
- 🔒 **Type Safe** - Built with TypeScript, full type definitions
- 🎯 **Simple API** - Intuitive and developer-friendly
- 🧩 **Modular** - Mixin system for easy extensibility
- 🔧 **Extensible** - Comprehensive middleware support
- 📦 **Modern** - ES2020+ features, async/await support
- 🛡️ **Secure** - Built-in security headers and rate limiting
- 🎨 **Developer Experience** - Debug tools, auto-docs, coloured logging

## Installation

```bash
pnpm add swifthttp
# or
npm install swifthttp
# or
yarn add swifthttp
```

## Quick Start

### Basic Server

```typescript
import SwiftHTTP from "swifthttp";

const app = new SwiftHTTP();

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

### Enhanced with Mixins

```typescript
import { SwiftHTTPEssential } from "swifthttp";

const app = new SwiftHTTPEssential();

app
  .enableLogging()
  .enableCors()
  .configureForEnvironment() // Auto-configures based on NODE_ENV
  .resource("users", {
    index: (req, res) => res.json({ users: [] }),
    show: (req, res) => res.json({ user: { id: req.params.id } }),
    create: (req, res) => res.json({ created: true }),
    update: (req, res) => res.json({ updated: true }),
    destroy: (req, res) => res.json({ deleted: true }),
  })
  .addHealthCheck("/health")
  .listen(3000);
```

### Development Setup

```typescript
import { SwiftHTTPDev } from "swifthttp";

const app = new SwiftHTTPDev();

app
  .enableDevMode() // Development headers & detailed logging
  .addDebugRoutes() // /_debug/* endpoints for inspection
  .useDevelopment() // Dev-optimised middleware stack
  .listen(3000);
```

### Production Setup

```typescript
import { SwiftHTTPProduction } from "swifthttp";

const app = new SwiftHTTPProduction();

app
  .useProduction() // Security + compression + rate limiting
  .addHealthCheck("/status")
  .listen(process.env.PORT || 3000);
```

## Core Features

### Routing

```typescript
// Basic routes
app.get("/users", getUsersHandler);
app.post("/users", createUserHandler);
app.put("/users/:id", updateUserHandler);
app.delete("/users/:id", deleteUserHandler);

// Route parameters with validation
app.param("id", (value) => /^\d+$/.test(value));

// Wildcards and optional parameters
app.get("/api/*", wildcardHandler);
app.get("/users/:id?", optionalParamHandler);

// Regex routes
app.addRegexRoute("GET", /^\/files\/(.+)\.pdf$/, pdfHandler);

// Route groups with middleware
app.group("/api/v1", [authMiddleware, rateLimitMiddleware], () => {
  app.get("/profile", getProfile);
  app.post("/logout", postLogout);
});
```

### RESTful Resources

```typescript
// Automatically creates all CRUD routes
app.resource("posts", {
  index: (req, res) => res.json({ posts: [] }), // GET /posts
  show: (req, res) => res.json({ post: {} }), // GET /posts/:id
  create: (req, res) => res.json({ created: true }), // POST /posts
  update: (req, res) => res.json({ updated: true }), // PUT /posts/:id
  destroy: (req, res) => res.json({ deleted: true }), // DELETE /posts/:id
});
```

### Middleware

```typescript
// Built-in middleware
app
  .enableCors({ origin: "https://example.com" })
  .enableLogging("combined")
  .enableBodyParser({ limit: "10mb" });

// Custom middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Conditional middleware
app.useWhen((req) => req.path.startsWith("/api"), rateLimitMiddleware);
```

### Request & Response Enhancements

```typescript
app.post("/upload", (req, res) => {
  // Enhanced request object
  console.log(req.body); // Parsed JSON/form data
  console.log(req.files); // Uploaded files
  console.log(req.params); // URL parameters
  console.log(req.query); // Query string

  // Enhanced response methods
  res
    .status(201)
    .cookie("session", "abc123", { httpOnly: true })
    .json({ success: true });
});

app.get("/download/:file", (req, res) => {
  res.download(`./uploads/${req.params.file}`);
});

app.get("/redirect", (req, res) => {
  res.redirect("/new-location", 301);
});
```

### Error Handling

```typescript
import { createError } from "swifthttp";

app.get("/protected", (req, res) => {
  if (!req.headers.authorization) {
    throw createError.unauthorised("Token required");
  }

  if (!isValidToken(req.headers.authorization)) {
    throw createError.forbidden("Invalid token");
  }

  res.json({ data: "secret" });
});

// Custom error handler
app.setErrorHandler((error, req, res, next) => {
  console.error("Application error:", error);

  if (error.statusCode === 401) {
    res.status(401).json({
      error: "Authentication required",
      loginUrl: "/login",
    });
  } else {
    next(); // Use default error handler
  }
});
```

## Mixin System

SwiftHTTP uses a powerful mixin system for modular functionality:

### Available Mixins

- **MiddlewareMixin** - Easy middleware setup and environment presets
- **EnvironmentMixin** - Auto-configuration based on NODE_ENV
- **RoutingMixin** - RESTful resources, API versioning, caching
- **DevUtilitiesMixin** - Debug routes, memory profiling, route inspection

### Custom Mixin Combinations

```typescript
import SwiftHTTP, {
  applyMixins,
  MiddlewareMixin,
  RoutingMixin,
} from "swifthttp";

const CustomSwiftHTTP = applyMixins(SwiftHTTP, MiddlewareMixin, RoutingMixin);

const app = new CustomSwiftHTTP();
```

### Pre-configured Classes

| Class                 | Includes                           | Best For          |
| --------------------- | ---------------------------------- | ----------------- |
| `SwiftHTTP`           | Base server only                   | Maximum control   |
| `SwiftHTTPEssential`  | Middleware + Environment + Routing | Most applications |
| `SwiftHTTPDev`        | Essential + Dev utilities          | Development       |
| `SwiftHTTPProduction` | Essential + Performance optimised  | Production        |

## Development Tools

### Debug Routes

```typescript
app.addDebugRoutes(); // Adds /_debug/* endpoints

// Available debug endpoints:
// GET /_debug/routes    - List all routes
// GET /_debug/memory    - Memory usage stats
// GET /_debug/server    - Server information
// GET /_debug/env       - Environment variables
```

### API Documentation

```typescript
app.docs("/api-docs"); // Auto-generated API documentation

// Visit /api-docs for interactive API explorer
```

### Health Checks

```typescript
app.addHealthCheck("/health");

// Returns:
// {
//   "status": "healthy",
//   "timestamp": "2025-01-14T10:30:45.123Z",
//   "uptime": 3600.5,
//   "memory": { ... },
//   "version": "v18.17.0"
// }
```

## Performance Features

- **Zero dependencies** - No bloat, fast startup
- **Custom compression** - Efficient gzip/deflate without external libs
- **Route caching** - Built-in response caching with TTL
- **Request pooling** - Optimised memory usage
- **Performance monitoring** - Built-in metrics and profiling

## Security Features

- **Security headers** - CSP, HSTS, X-Frame-Options, etc.
- **Rate limiting** - Configurable request throttling
- **Request validation** - Size limits and content-type checking
- **Error boundaries** - Prevents information leakage
- **CORS support** - Cross-origin resource sharing

## Browser & Node Support

- **Node.js** - v16.0.0 or higher
- **TypeScript** - v5.0.0 or higher
- **ES Modules** - Full ESM support
- **CommonJS** - Also supports CJS imports

## Examples

### REST API

```typescript
import { SwiftHTTPEssential, createError } from "swifthttp";

const app = new SwiftHTTPEssential();

app
  .enableLogging()
  .enableCors()
  .enableBodyParser()
  .resource("users", {
    index: async (req, res) => {
      const users = await db.users.findMany();
      res.json(users);
    },

    show: async (req, res) => {
      const user = await db.users.findById(req.params.id);
      if (!user) throw createError.notFound("User not found");
      res.json(user);
    },

    create: async (req, res) => {
      const user = await db.users.create(req.body);
      res.status(201).json(user);
    },
  })
  .addHealthCheck()
  .listen(3000);
```

### File Upload API

```typescript
app.post("/upload", (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw createError.badRequest("No files uploaded");
  }

  const uploadedFiles = req.files.map((file) => ({
    name: file.filename,
    size: file.data.length,
    type: file.mimetype,
  }));

  res.json({
    message: "Files uploaded successfully",
    files: uploadedFiles,
  });
});
```

## API Reference

### Core Classes

- **SwiftHTTP** - Base HTTP server class
- **Router** - Route organisation and mounting
- **SwiftRequest** - Enhanced request object
- **SwiftResponse** - Enhanced response object

### Error Classes

- **SwiftError** - Base error class
- **BadRequestError** - 400 errors
- **UnauthorisedError** - 401 errors (British spelling)
- **ForbiddenError** - 403 errors
- **NotFoundError** - 404 errors
- **ValidationError** - Request validation errors

### Utilities

- **createError** - Error factory functions
- **parseLimit** - Parse size limits (1mb, 500kb, etc.)
- **getMimeType** - File extension to MIME type
- **enhanceRequest/Response** - Object enhancement utilities

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/NotKeira/swifthttp.git
cd swifthttp
pnpm install
pnpm run build
pnpm run test
```

## Roadmap

- [ ] **Step 9**: Comprehensive test suite with Jest/Vitest
- [ ] **Step 10**: Performance benchmarks and optimisation
- [ ] **Step 11**: Real-world examples and tutorials
- [ ] **Step 12**: CI/CD pipeline and NPM publishing
- [ ] WebSocket support mixin
- [ ] Database integration mixins
- [ ] Template engine support
- [ ] Clustering and load balancing

## License

MIT © [Keira Hopkins](https://keirahopkins.co.uk)

---

**Built with ❤️ in TypeScript. Zero dependencies, maximum performance.** 🚀
