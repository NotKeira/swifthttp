import { IncomingMessage } from "http";
import { parse as parseUrl } from "url";
import { SwiftRequest } from "../types";

/**
 * Parse request body as JSON
 */
export async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        if (!body.trim()) {
          resolve(null);
          return;
        }

        const contentType = req.headers["content-type"] || "";
        if (contentType.includes("application/json")) {
          resolve(JSON.parse(body));
        } else {
          resolve(body);
        }
      } catch {
        reject(new Error("Invalid JSON in request body"));
      }
    });

    req.on("error", reject);
  });
}

/**
 * Parse URL and extract path and query parameters
 */
export function parseRequest(req: IncomingMessage): {
  path: string;
  query: Record<string, string>;
} {
  const parsed = parseUrl(req.url || "/", true);
  const path = parsed.pathname || "/";
  const query: Record<string, string> = {};

  // Convert query parameters to string record
  for (const [key, value] of Object.entries(parsed.query)) {
    if (typeof value === "string") {
      query[key] = value;
    } else if (Array.isArray(value)) {
      query[key] = value[0] || "";
    }
  }

  return { path, query };
}

/**
 * Match route path with request path and extract parameters
 */
export function matchRoute(
  routePath: string,
  requestPath: string
): { matches: boolean; params: Record<string, string> } {
  const routeSegments = routePath.split("/").filter(Boolean);
  const requestSegments = requestPath.split("/").filter(Boolean);

  if (routeSegments.length !== requestSegments.length) {
    return { matches: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < routeSegments.length; i++) {
    const routeSegment = routeSegments[i];
    const requestSegment = requestSegments[i];

    if (routeSegment.startsWith(":")) {
      // Parameter segment
      const paramName = routeSegment.slice(1);
      params[paramName] = decodeURIComponent(requestSegment);
    } else if (routeSegment !== requestSegment) {
      // Literal segment doesn't match
      return { matches: false, params: {} };
    }
  }

  return { matches: true, params };
}

/**
 * Enhance the native request object with SwiftHTTP features
 */
export async function enhanceRequest(
  req: IncomingMessage
): Promise<SwiftRequest> {
  const { path, query } = parseRequest(req);
  const body = await parseJsonBody(req);

  // Cast and enhance the request object
  const swiftReq = req as SwiftRequest;
  swiftReq.path = path;
  swiftReq.query = query;
  swiftReq.body = body;
  swiftReq.params = {}; // Will be set during routing dont you worry :smirk:

  return swiftReq;
}
