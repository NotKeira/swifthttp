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
 * Match wildcard routes (*)
 */
export function matchWildcardRoute(
  routePath: string,
  requestPath: string
): { matches: boolean; params: Record<string, string> } {
  // Handle exact wildcard
  if (routePath === "*") {
    return { matches: true, params: {} };
  }

  // handle wildcard at end: /api/*
  if (routePath.endsWith("/*")) {
    const prefix = routePath.slice(0, -2);
    if (requestPath.startsWith(prefix)) {
      return {
        matches: true,
        params: { wildcard: requestPath.slice(prefix.length) },
      };
    }
  }

  return { matches: false, params: {} };
}

/**
 * Match optional parameters (/users/:id?)
 */
export function matchOptionalRoute(
  routePath: string,
  requestPath: string
): { matches: boolean; params: Record<string, string> } {
  const routeSegments = routePath.split("/").filter(Boolean);
  const requestSegments = requestPath.split("/").filter(Boolean);

  const params: Record<string, string> = {};
  let routeIndex = 0;
  let requestIndex = 0;

  while (routeIndex < routeSegments.length) {
    const routeSegment = routeSegments[routeIndex];

    if (routeSegment.startsWith(":") && routeSegment.endsWith("?")) {
      // Optional param
      const paramName = routeSegment.slice(1, -1);

      if (requestIndex < requestSegments.length) {
        // param provided
        params[paramName] = decodeURIComponent(requestSegments[requestIndex]);
        requestIndex++;
      }
      // If not provided, that's okay! (it's optional...)
    } else if (routeSegment.startsWith(":")) {
      // required param
      if (requestIndex >= requestSegments.length) {
        return { matches: false, params: {} };
      }
      const paramName = routeSegment.slice(1);
      params[paramName] = decodeURIComponent(requestSegments[requestIndex]);
      requestIndex++;
    } else {
      // literal segment
      if (
        requestIndex >= requestSegments.length ||
        routeSegment !== requestSegments[requestIndex]
      ) {
        return { matches: false, params: {} };
      }
      requestIndex++;
    }
    routeIndex++;
    // all route segments matched, check if all request segments consumed
  }
  return {
    matches: requestIndex === requestSegments.length,
    params,
  };
}

/**
 * Match regex routes
 */
export function matchRegexRoute(
  routePattern: RegExp,
  requestPath: string
): { matches: boolean; params: Record<string, string> } {
  // I'd just like to say, I hate regex, so please never make use of this router because regex is a pain in the behind and i dont like doing this please send help oh my god i have mental issues this router is making me hate my life already, ill be back guys i need another monster.
  const match = RegExp(routePattern).exec(requestPath);
  if (!match) {
    return { matches: false, params: {} };
  }
  const params: Record<string, string> = {};
  // add numbered captures as params (im back btw guys, and i got a monster! its the pink one)
  match.slice(1).forEach((capture, index) => {
    if (capture !== undefined) {
      params[`$${index + 1}`] = capture;
    }
  });
  return { matches: true, params };
}

/**
 * Enhanced route matching with all pattern types
 */
export function enhancedMatchRoute(
  routePath: string | RegExp,
  requestPath: string
): { matches: boolean; params: Record<string, string> } {
  // regex route (i hate you if you use this)
  if (routePath instanceof RegExp) {
    return matchRegexRoute(routePath, requestPath);
  }
  // string routes
  const routeStr: string = routePath;

  // wildcard route
  if (routeStr.includes("*")) {
    return matchWildcardRoute(routeStr, requestPath);
  }

  // optional params routes
  if (routeStr.includes("?")) {
    return matchOptionalRoute(routeStr, requestPath);
  }

  // standard route
  return matchRoute(routeStr, requestPath);
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

// if you're reading this, please donate to me so I can buy more monsters so I don't lose my mind with regex again :')