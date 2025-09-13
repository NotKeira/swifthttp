import { IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import { SwiftRequest, SwiftResponse } from '../types';

/**
 * Parse limit strings like '1mb', '500kb', etc.
 */
export function parseLimit(limit: string): number {
    const units: Record<string, number> = {
        b: 1,
        kb: 1024,
        mb: 1024 * 1024,
        gb: 1024 * 1024 * 1024
    };

    const match = limit.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)?$/);
    if (!match) {
        throw new Error(`Invalid limit format: ${limit}
How to use Parse Limit:
1 Megabyte: 1mb/1MB/1mB/1Mb
10 Gigabytes: 10gb/10GB/10Gb/10gB
100 bytes: 100b/100B`);
    }

    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';

    return Math.floor(value * units[unit]);
}

/**
 * Parse request body with size limits and content type detection
 */
export async function parseRequestBody(req: IncomingMessage, options: {
    limit?: string;
    json?: boolean;
    urlencoded?: boolean;
    text?: boolean;
    raw?: boolean;
} = {}): Promise<any> {
    const {
        limit = '1mb',
        json = true,
        urlencoded = true,
        text = true,
        raw = false
    } = options;

    const limitBytes = parseLimit(limit);
    const contentType = req.headers['content-type'] || '';
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    if (contentLength > limitBytes) {
        throw new Error(`Request entity too large. Content-Length: ${contentLength}, Limit: ${limitBytes}`);
    }

    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let totalSize = 0;

        req.on('data', (chunk: Buffer) => {
            totalSize += chunk.length;

            if (totalSize > limitBytes) {
                reject(new Error(`Request entity too large. Size: ${totalSize}, Limit: ${limitBytes}`));
                return;
            }

            chunks.push(chunk);
        });

        req.on('end', () => {
            try {
                if (chunks.length === 0) {
                    resolve(null);
                    return;
                }

                const buffer = Buffer.concat(chunks);

                if (raw) {
                    resolve(buffer);
                    return;
                }

                const bodyString = buffer.toString('utf8');

                if (json && contentType.includes('application/json')) {
                    resolve(JSON.parse(bodyString));
                } else if (urlencoded && contentType.includes('application/x-www-form-urlencoded')) {
                    const params = new URLSearchParams(bodyString);
                    resolve(Object.fromEntries(params.entries()));
                } else if (text && contentType.startsWith('text/')) {
                    resolve(bodyString);
                } else if (contentType.includes('multipart/form-data')) {
                    resolve(buffer);
                } else {
                    resolve(bodyString);
                }
            } catch (error) {
                reject(new Error(`Body parsing error: ${(error as Error).message}`));
            }
        });

        req.on('error', (error) => {
            reject(new Error(`Request error: ${error.message}`));
        });

        const timeout = setTimeout(() => {
            reject(new Error('Request timeout'));
        }, 30000);

        req.on('end', () => clearTimeout(timeout));
        req.on('error', () => clearTimeout(timeout));
    });
}

/**
 * Parse multipart/form-data
 */
export function parseMultipartData(buffer: Buffer, boundary: string): {
    fields: Record<string, string>;
    files: Array<{ name: string; filename?: string; mimetype?: string; data: Buffer }>;
} {
    const fields: Record<string, string> = {};
    const files: Array<{ name: string; filename?: string; mimetype?: string; data: Buffer }> = [];

    const boundaryBuffer = Buffer.from('--' + boundary);
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

    for (const part of parts) {
        if (part.length === 0) continue;

        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;

        const headerString = part.subarray(0, headerEnd).toString();
        const bodyBuffer = part.subarray(headerEnd + 4);

        const dispositionMatch = headerString.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i);
        if (!dispositionMatch) continue;

        const fieldName = dispositionMatch[1];
        const filename = dispositionMatch[2];

        if (filename !== undefined) {
            const contentTypeMatch = headerString.match(/Content-Type:\s*([^\r\n]+)/i);
            const mimetype = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';

            files.push({
                name: fieldName,
                filename: filename,
                mimetype: mimetype,
                data: bodyBuffer
            });
        } else {
            fields[fieldName] = bodyBuffer.toString('utf8');
        }
    }

    return { fields, files };
}

/**
 * Parse URL and extract path and query parameters
 */
export function parseRequest(req: IncomingMessage): { path: string; query: Record<string, string> } {
    const parsed = parseUrl(req.url || '/', true);
    const path = parsed.pathname || '/';
    const query: Record<string, string> = {};

    for (const [key, value] of Object.entries(parsed.query)) {
        if (typeof value === 'string') {
            query[key] = value;
        } else if (Array.isArray(value)) {
            query[key] = value[0] || '';
        }
    }

    return { path, query };
}

/**
 * Basic route matching
 */
export function matchRoute(routePath: string, requestPath: string): { matches: boolean; params: Record<string, string> } {
    const routeSegments = routePath.split('/').filter(Boolean);
    const requestSegments = requestPath.split('/').filter(Boolean);

    if (routeSegments.length !== requestSegments.length) {
        return { matches: false, params: {} };
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < routeSegments.length; i++) {
        const routeSegment = routeSegments[i];
        const requestSegment = requestSegments[i];

        if (routeSegment.startsWith(':')) {
            const paramName = routeSegment.slice(1);
            params[paramName] = decodeURIComponent(requestSegment);
        } else if (routeSegment !== requestSegment) {
            return { matches: false, params: {} };
        }
    }

    return { matches: true, params };
}

/**
 * Wildcard route matching
 */
export function matchWildcardRoute(routePath: string, requestPath: string): { matches: boolean; params: Record<string, string> } {
    if (routePath === '*') {
        return { matches: true, params: {} };
    }

    if (routePath.endsWith('/*')) {
        const prefix = routePath.slice(0, -2);
        if (requestPath.startsWith(prefix)) {
            return { matches: true, params: { wildcard: requestPath.slice(prefix.length) } };
        }
    }

    return { matches: false, params: {} };
}

/**
 * Optional parameter matching
 */
export function matchOptionalRoute(routePath: string, requestPath: string): { matches: boolean; params: Record<string, string> } {
    const routeSegments = routePath.split('/').filter(Boolean);
    const requestSegments = requestPath.split('/').filter(Boolean);

    const params: Record<string, string> = {};
    let routeIndex = 0;
    let requestIndex = 0;

    while (routeIndex < routeSegments.length) {
        const routeSegment = routeSegments[routeIndex];

        if (routeSegment.startsWith(':') && routeSegment.endsWith('?')) {
            const paramName = routeSegment.slice(1, -1);

            if (requestIndex < requestSegments.length) {
                params[paramName] = decodeURIComponent(requestSegments[requestIndex]);
                requestIndex++;
            }
        } else if (routeSegment.startsWith(':')) {
            if (requestIndex >= requestSegments.length) {
                return { matches: false, params: {} };
            }
            const paramName = routeSegment.slice(1);
            params[paramName] = decodeURIComponent(requestSegments[requestIndex]);
            requestIndex++;
        } else {
            if (requestIndex >= requestSegments.length || routeSegment !== requestSegments[requestIndex]) {
                return { matches: false, params: {} };
            }
            requestIndex++;
        }

        routeIndex++;
    }

    return {
        matches: requestIndex === requestSegments.length,
        params
    };
}

/**
 * Regex route matching
 */
export function matchRegexRoute(routePattern: RegExp, requestPath: string): { matches: boolean; params: Record<string, string> } {
    const match = requestPath.match(routePattern);
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

/**
 * Enhanced route matching with all pattern types
 */
export function enhancedMatchRoute(routePath: string | RegExp, requestPath: string): { matches: boolean; params: Record<string, string> } {
    if (routePath instanceof RegExp) {
        return matchRegexRoute(routePath, requestPath);
    }

    const routeStr = routePath as string;

    if (routeStr.includes('*')) {
        return matchWildcardRoute(routeStr, requestPath);
    }

    if (routeStr.includes('?')) {
        return matchOptionalRoute(routeStr, requestPath);
    }

    return matchRoute(routeStr, requestPath);
}

/**
 * Enhanced request object
 */
export async function enhanceRequest(req: IncomingMessage, parsingOptions?: {
    limit?: string;
    json?: boolean;
    urlencoded?: boolean;
    text?: boolean;
    raw?: boolean;
    multipart?: boolean;
}): Promise<SwiftRequest> {
    const { path, query } = parseRequest(req);

    let body: any = null;
    let files: any[] = [];

    const methodsWithBody = ['POST', 'PUT', 'PATCH'];
    if (methodsWithBody.includes(req.method || '')) {
        const contentType = req.headers['content-type'] || '';

        if (parsingOptions?.multipart && contentType.includes('multipart/form-data')) {
            const boundaryMatch = contentType.match(/boundary=([^;]+)/);
            if (boundaryMatch) {
                const buffer = await parseRequestBody(req, { raw: true }) as Buffer;
                const parsed = parseMultipartData(buffer, boundaryMatch[1]);
                body = parsed.fields;
                files = parsed.files;
            }
        } else {
            body = await parseRequestBody(req, parsingOptions);
        }
    }

    const swiftReq = req as SwiftRequest;
    swiftReq.path = path;
    swiftReq.query = query;
    swiftReq.body = body;
    swiftReq.params = {};

    if (files.length > 0) {
        (swiftReq as any).files = files;
    }

    return swiftReq;
}

/**
 * Enhanced response object 
 */
export async function enhanceResponse(res: ServerResponse): Promise<SwiftResponse> {
    const swiftRes = res as SwiftResponse;
    swiftRes.status = (statusCode: number) => {
        res.statusCode = statusCode;
        return swiftRes;
    };
    swiftRes.json = (data: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
        return swiftRes;
    };
    swiftRes.send = (data: any) => {
        res.end(data);
        return swiftRes;
    };
    return swiftRes;
}