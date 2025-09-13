# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.8.0] - 2025-09-13

### Added

- Complete mixin system for modular development
  - MiddlewareMixin for easy middleware setup
  - EnvironmentMixin for auto-configuration based on NODE_ENV
  - RoutingMixin for RESTful resources and API versioning
  - DevUtilitiesMixin for debug tools and profiling
- Pre-configured enhanced classes (SwiftHTTPEssential, SwiftHTTPDev, SwiftHTTPProduction)
- Comprehensive error handling system with custom error types
  - HTTP-specific error classes (BadRequestError, UnauthorisedError, etc.)
  - Error reporting with ConsoleErrorReporter and FileErrorReporter
  - Error recovery patterns and circuit breakers
- Enhanced response helpers
  - Cookie management (res.cookie, res.clearCookie)
  - File downloads and attachments
  - Template rendering and caching
  - Zero-dependency compression (gzip/deflate)
  - Security headers application
- RESTful resource routing with automatic CRUD generation
- API versioning and route namespacing
- Route caching with TTL support
- Health check endpoints with system information
- Auto-generated API documentation
- Development debug routes (/\_debug/\*)
- Memory profiling and performance monitoring
- Request tracing with unique request IDs
- British spelling throughout codebase (normalise, serialise, etc.)

### Changed

- Enhanced SwiftHTTP core class with comprehensive error handling
- Improved middleware execution with proper error boundaries
- Optimised request/response enhancement pipeline
- Consolidated utility functions into organised modules
- Updated documentation with complete feature showcase

### Removed

- Removed individual utility files in favour of organised modules
  - src/utils/helpers.ts
  - src/utils/logger.ts
  - src/utils/validation.ts
- Consolidated functionality into main utility modules

### Fixed

- Fixed TypeScript compilation issues with mixin system
- Resolved import/export inconsistencies
- Corrected British spelling throughout codebase
- Fixed Buffer.slice() deprecation warnings (replaced with Buffer.subarray())

### Security

- Added comprehensive security headers (CSP, HSTS, X-Frame-Options)
- Implemented request rate limiting
- Added request size validation and limits
- Enhanced error handling to prevent information leakage

## [0.6.0] - 2025-08-14

### Added

- Enhanced request parsing with multipart support
- File upload handling with metadata
- Comprehensive body parsing (JSON, form-data, URL-encoded, text, binary)
- Request size limits and content-type validation
- Field validation framework with schema support
- Common validation schemas and sanitisation utilities
- Request validation middleware with custom rules

### Fixed

- Replace deprecated Buffer.slice() with Buffer.subarray()
- Proper error handling for parsing failures
- Reuse parseLimit utility to avoid code duplication

## [0.5.0] - 2025-08-14

### Added

- Advanced routing system
- Wildcard route matching (_, /api/_)
- Optional parameter support (/users/:id?)
- Regex route matching with named captures
- Router class for better route organisation
- Route mounting and sub-router support
- Parameter validation framework
- Route debugging utilities (listRoutes)

### Changed

- Enhanced route matching with all pattern types

## [0.4.0] - 2025-08-14

### Added

- Comprehensive middleware system
- Built-in middleware (CORS, body parser, logger, static files)
- Middleware composition and error handling
- Route groups with shared middleware
- Middleware factory pattern and helper functions
- Middleware-specific TypeScript interfaces

### Changed

- Improved middleware execution pipeline with proper next() handling

## [0.3.0] - 2025-08-13

### Added

- Core request/response handling and routing
- Request parsing utilities for JSON body and URL parameters
- Response helper methods (json, status, send)
- Route matching with URL parameter extraction (:id syntax)
- Middleware execution pipeline for global and route middleware
- Complete request processing with enhanced req/res objects
- 404 handling for unmatched routes

## [0.2.0] - 2025-08-13

### Added

- Core SwiftHTTP class and type definitions
- Enhanced TypeScript interfaces (SwiftRequest, SwiftResponse)
- HTTP method types and route structures
- Basic HTTP method routing (get, post, put, delete, patch)
- Middleware system foundation
- Custom error handling with SwiftError class
- Server lifecycle management (listen/close)

### Fixed

- TypeScript compilation issues
- Error handling improvements

## [0.1.0] - 2025-08-13

### Added

- Initial project setup with TypeScript configuration
- Basic project structure and build system
- MIT licence and package configuration
- Comprehensive .gitignore for Node.js projects
- README with project overview and quick start
- CHANGELOG following Keep a Changelog format

---

**Note:** Version 1.0.0 tag was applied prematurely during initial development. The project has been restructured to follow proper semantic versioning, with v0.8.0 representing the current feature-complete state approaching v1.0.0 stability.

## Version Links

[Unreleased]: https://github.com/NotKeira/swifthttp/compare/v0.8.0...HEAD
[0.8.0]: https://github.com/NotKeira/swifthttp/compare/v0.6.0...v0.8.0
[0.6.0]: https://github.com/NotKeira/swifthttp/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/NotKeira/swifthttp/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/NotKeira/swifthttp/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/NotKeira/swifthttp/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/NotKeira/swifthttp/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/NotKeira/swifthttp/releases/tag/v0.1.0
