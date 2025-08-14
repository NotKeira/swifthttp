// Built-in middleware utilities, wooho
import { Middleware, SwiftRequest, SwiftResponse } from "../types";
import { parseLimit } from "../utils/helpers";
import { logRequest } from "../utils/logger";

/**
 * CORS middleware
 */
export function cors(
  options: {
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
  } = {}
): Middleware {
  const {
    origin = "*",
    methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders = ["Content-Type", "Authorization"],
    credentials = false,
  } = options;

  return (req: SwiftRequest, res: SwiftResponse, next: () => void) => {
    /// Set CORS headers:
    res.setHeader(
      "Access-Control-Allow-Origin",
      Array.isArray(origin) ? origin.join(",") : origin
    );
    res.setHeader("Access-Control-Allow-Methods", methods.join(","));
    res.setHeader("Access-Control-Allow-Headers", allowedHeaders.join(","));

    if (credentials) {
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    /// Handle preflight requests:
    if (req.method === "OPTIONS") {
      res.status(200).send("");
      return;
    }
    next();
  };
}

/**
 * Body parsing middleware for form data and URL-encoded
 */
export function bodyParser(
  options: {
    urlencoded?: boolean;
    limit?: string;
  } = {}
): Middleware {
  const { urlencoded = true, limit = "1mb" } = options;
  const limitBytes = parseLimit(limit);
  return async (req: SwiftRequest, res: SwiftResponse, next: () => void) => {
    const contentType = req.headers["content-type"] || "";

    if (
      urlencoded &&
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      /// Parse the URL-encoded body with a size limit included
      let body = "";
      let totalSize = 0;
      req.on("data", (chunk) => {
        totalSize += chunk.length;

        if (totalSize > limitBytes) {
          res.status(413).json({ error: "Request entity too large" });
          return;
        }

        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const params = new URLSearchParams(body);
          req.body = Object.fromEntries(params.entries());
          next();
        } catch (error) {
          res.status(400).json({ error: "Invalid URL-encoded data" });
          console.error(error);
        }
      });
    } else {
      next();
    }
  };
}

/**
 * Logging middleware
 */
export function logger(format: "dev" | "combined" = "dev"): Middleware {
  return (req: SwiftRequest, res: SwiftResponse, next: () => void) => {
    const start = Date.now();

    // Store the original end method
    const originalEnd = res.end;

    // Override res.end with proper overload handling
    res.end = function (
      this: SwiftResponse,
      ...args: Parameters<typeof originalEnd>
    ) {
      const duration = Date.now() - start;
      const userAgent = req.headers["user-agent"];

      const { devLog, combinedLog } = logRequest(
        req.method || "UNKNOWN",
        req.path || req.url || "/",
        this.statusCode || 200,
        duration,
        userAgent
      );

      if (format === "dev") {
        console.log(devLog);
      } else {
        console.log(combinedLog);
      }

      // Call original end with exact same arguments
      return originalEnd.apply(this, args);
    } as typeof originalEnd;

    next();
  };
}

/**
 * Static file serving middleware
 */
export function serveStatic(
  root: string,
  options: {
    index?: string;
    dotfiles?: "allow" | "deny" | "ignore";
  } = {}
): Middleware {
  const { index = "index.html", dotfiles = "ignore" } = options;

  return async (req: SwiftRequest, res: SwiftResponse, next: () => void) => {
    // basic static file serving, we'll use fs.readFile, handle MIME types etc in future
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    // For now we just pass through until we implement file serving
    next();
  };
}

/**
 * Middleware composition helper
 */
export function compose(...middlewares: Middleware[]): Middleware {
  return async (req: SwiftRequest, res: SwiftResponse, next: () => void) => {
    let index = 0;

    async function dispatch(i: number): Promise<void> {
      if (i <= index)
        return Promise.reject(new Error("next() called multiple times"));
      index = i;

      let fn = middlewares[i];
      if (i === middlewares.length) fn = next as any;
      if (!fn) return;

      try {
        await fn(req, res, dispatch.bind(null, i + 1));
      } catch (err) {
        if (err instanceof Error) return Promise.reject(err);
      }
    }
    return dispatch(0);
  };
}
