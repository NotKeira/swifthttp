import { IncomingMessage } from "http";
import { parse as parseUrl } from "url";
import { SwiftRequest } from "../types";
import { parseLimit } from "./helpers";

/**
 * Parse request body with size limits and content type detection
 */
export async function parseRequestBody(
  req: IncomingMessage,
  options: {
    limit?: string;
    json?: boolean;
    urlencoded?: boolean;
    text?: boolean;
    raw?: boolean;
  } = {}
): Promise<any> {
  const {
    limit = "1mb",
    json = true,
    urlencoded = true,
    text = true,
    raw = false,
  } = options;

  const limitBytes = parseLimit(limit);
  const contentType = req.headers["content-type"] || "";
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);

  // Check content length against limit
  if (contentLength > limitBytes) {
    throw new Error(
      `Request entity too large. Content-Length: ${contentLength}, Limit: ${limitBytes}`
    );
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;

    req.on("data", (chunk: Buffer) => {
      totalSize += chunk.length;

      // Check size limit
      if (totalSize > limitBytes) {
        reject(
          new Error(
            `Request entity too large. Size: ${totalSize}, Limit: ${limitBytes}`
          )
        );
        return;
      }

      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        if (chunks.length === 0) {
          resolve(null);
          return;
        }

        const buffer = Buffer.concat(chunks);

        // Return raw buffer if requested
        if (raw) {
          resolve(buffer);
          return;
        }

        const bodyString = buffer.toString("utf8");

        // Parse based on content type
        if (json && contentType.includes("application/json")) {
          resolve(JSON.parse(bodyString));
        } else if (
          urlencoded &&
          contentType.includes("application/x-www-form-urlencoded")
        ) {
          const params = new URLSearchParams(bodyString);
          resolve(Object.fromEntries(params.entries()));
        } else if (text && contentType.startsWith("text/")) {
          resolve(bodyString);
        } else if (contentType.includes("multipart/form-data")) {
          // Will be handled by parseMultipartData
          resolve(buffer);
        } else {
          // Default to string for unknown types
          resolve(bodyString);
        }
      } catch (error) {
        reject(new Error(`Body parsing error: ${(error as Error).message}`));
      }
    });

    req.on("error", (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });

    // Set timeout for slow requests
    const timeout = setTimeout(() => {
      reject(new Error("Request timeout"));
    }, 30000); // 30 second timeout

    req.on("end", () => clearTimeout(timeout));
    req.on("error", () => clearTimeout(timeout));
  });
}

/**
 * Split buffer by boundary
 */
function splitBufferByBoundary(buffer: Buffer, boundary: string): Buffer[] {
  const boundaryBuffer = Buffer.from("--" + boundary);
  const parts = [];
  let start = 0;

  while (true) {
    const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
    if (boundaryIndex === -1) break;

    if (start !== 0) {
      parts.push(buffer.subarray(start, boundaryIndex));
    }
    start = boundaryIndex + boundaryBuffer.length;
  }

  return parts;
}

/**
 * Parse Content-Disposition header
 */
function parseContentDisposition(
  headerString: string
): { fieldName: string; filename?: string } | null {
  const dispositionMatch = RegExp(
    /Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i
  ).exec(headerString);

  if (!dispositionMatch) return null;

  return {
    fieldName: dispositionMatch[1],
    filename: dispositionMatch[2],
  };
}

/**
 * Parse Content-Type header
 */
function parseContentType(headerString: string): string {
  const contentTypeMatch = RegExp(/Content-Type:\s*([^\r\n]+)/i).exec(
    headerString
  );
  return contentTypeMatch
    ? contentTypeMatch[1].trim()
    : "application/octet-stream";
}

/**
 * Process a single multipart part
 */
function processPart(
  part: Buffer,
  fields: Record<string, string>,
  files: Array<{
    name: string;
    filename?: string;
    mimetype?: string;
    data: Buffer;
  }>
): void {
  const headerEnd = part.indexOf("\r\n\r\n");
  if (headerEnd === -1) return;

  const headerString = part.subarray(0, headerEnd).toString();
  const bodyBuffer = part.subarray(headerEnd + 4);

  const disposition = parseContentDisposition(headerString);
  if (!disposition) return;

  const { fieldName, filename } = disposition;

  if (filename !== undefined) {
    const mimetype = parseContentType(headerString);
    files.push({
      name: fieldName,
      filename: filename,
      mimetype: mimetype,
      data: bodyBuffer,
    });
  } else {
    fields[fieldName] = bodyBuffer.toString("utf8");
  }
}

/**
 * Parse multipart/form-data (simplified implementation)
 */
export function parseMultipartData(
  buffer: Buffer,
  boundary: string
): {
  fields: Record<string, string>;
  files: Array<{
    name: string;
    filename?: string;
    mimetype?: string;
    data: Buffer;
  }>;
} {
  const fields: Record<string, string> = {};
  const files: Array<{
    name: string;
    filename?: string;
    mimetype?: string;
    data: Buffer;
  }> = [];

  const parts = splitBufferByBoundary(buffer, boundary);

  for (const part of parts) {
    if (part.length > 0) {
      processPart(part, fields, files);
    }
  }

  return { fields, files };
}

/**
 * Parse request body as JSON (legacy function, kept for compatibility)
 */
export async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return parseRequestBody(req, {
    json: true,
    urlencoded: false,
    text: false,
    raw: false,
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
 * Validate request based on content type and size
 */
export function validateRequest(
  req: IncomingMessage,
  options: {
    allowedContentTypes?: string[];
    maxSize?: string;
    requireContentType?: boolean;
  } = {}
): { valid: boolean; error?: string } {
  const {
    allowedContentTypes = [
      "application/json",
      "application/x-www-form-urlencoded",
      "text/plain",
      "multipart/form-data",
    ],
    maxSize = "10mb",
    requireContentType = false,
  } = options;

  const contentType = req.headers["content-type"] || "";
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);

  // Check if content type is required
  if (requireContentType && !contentType) {
    return { valid: false, error: "Content-Type header is required" };
  }

  // Check allowed content types
  if (
    contentType &&
    !allowedContentTypes.some((allowed) => contentType.includes(allowed))
  ) {
    return { valid: false, error: `Content-Type '${contentType}' not allowed` };
  }

  // Check content length
  const maxSizeBytes = parseLimit(maxSize);
  if (contentLength > maxSizeBytes) {
    return {
      valid: false,
      error: `Content-Length exceeds maximum size of ${maxSize}`,
    };
  }

  return { valid: true };
}

/**
 * Enhanced request object enhancement with comprehensive body parsing
 */
export async function enhanceRequest(
  req: IncomingMessage,
  parsingOptions?: {
    limit?: string;
    json?: boolean;
    urlencoded?: boolean;
    text?: boolean;
    raw?: boolean;
    multipart?: boolean;
  }
): Promise<SwiftRequest> {
  const { path, query } = parseRequest(req);

  let body: any = null;
  let files: any[] = [];

  // Only parse body for methods that typically have bodies
  const methodsWithBody = ["POST", "PUT", "PATCH"];
  if (methodsWithBody.includes(req.method || "")) {
    const contentType = req.headers["content-type"] || "";

    if (
      parsingOptions?.multipart &&
      contentType.includes("multipart/form-data")
    ) {
      const boundaryMatch = RegExp(/boundary=([^;]+)/).exec(contentType);
      if (boundaryMatch) {
        const buffer = (await parseRequestBody(req, { raw: true })) as Buffer;
        const parsed = parseMultipartData(buffer, boundaryMatch[1]);
        body = parsed.fields;
        files = parsed.files;
      }
    } else {
      body = await parseRequestBody(req, parsingOptions);
    }
  }

  // Cast and enhance the request object
  const swiftReq = req as SwiftRequest;
  swiftReq.path = path;
  swiftReq.query = query;
  swiftReq.body = body;
  swiftReq.params = {}; // Will be set during routing

  // Add files if multipart parsing was used
  if (files.length > 0) {
    (swiftReq as any).files = files;
  }

  return swiftReq;
}

// Re-export existing route matching functions (from Step 5)
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
      const paramName = routeSegment.slice(1);
      params[paramName] = decodeURIComponent(requestSegment);
    } else if (routeSegment !== requestSegment) {
      return { matches: false, params: {} };
    }
  }

  return { matches: true, params };
}

export function matchWildcardRoute(
  routePath: string,
  requestPath: string
): { matches: boolean; params: Record<string, string> } {
  if (routePath === "*") {
    return { matches: true, params: {} };
  }

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
      const paramName = routeSegment.slice(1, -1);

      if (requestIndex < requestSegments.length) {
        params[paramName] = decodeURIComponent(requestSegments[requestIndex]);
        requestIndex++;
      }
    } else if (routeSegment.startsWith(":")) {
      if (requestIndex >= requestSegments.length) {
        return { matches: false, params: {} };
      }
      const paramName = routeSegment.slice(1);
      params[paramName] = decodeURIComponent(requestSegments[requestIndex]);
      requestIndex++;
    } else {
      if (
        requestIndex >= requestSegments.length ||
        routeSegment !== requestSegments[requestIndex]
      ) {
        return { matches: false, params: {} };
      }
      requestIndex++;
    }

    routeIndex++;
  }

  return {
    matches: requestIndex === requestSegments.length,
    params,
  };
}

export function matchRegexRoute(
  routePattern: RegExp,
  requestPath: string
): { matches: boolean; params: Record<string, string> } {
  const match = RegExp(routePattern).exec(requestPath);
  if (!match) {
    return { matches: false, params: {} };
  }

  const params: Record<string, string> = {};
  match.slice(1).forEach((capture, index) => {
    if (capture !== undefined) {
      params[`$${index + 1}`] = capture;
    }
  });

  return { matches: true, params };
}

export function enhancedMatchRoute(
  routePath: string | RegExp,
  requestPath: string
): { matches: boolean; params: Record<string, string> } {
  if (routePath instanceof RegExp) {
    return matchRegexRoute(routePath, requestPath);
  }

  const routeStr: string = routePath;

  if (routeStr.includes("*")) {
    return matchWildcardRoute(routeStr, requestPath);
  }

  if (routeStr.includes("?")) {
    return matchOptionalRoute(routeStr, requestPath);
  }

  return matchRoute(routeStr, requestPath);
}
