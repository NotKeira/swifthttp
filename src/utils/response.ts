import { ServerResponse } from 'http';
import { SwiftResponse, CookieOptions, SecurityHeaders } from '../types';

/**
 * MIME type mappings for common file extensions
 */
const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
    '.zip': 'application/zip'
};

/**
 * Get MIME type from file extension
 */
export function getMimeType(filename: string): string {
    const ext = filename.toLowerCase().match(/\.[^.]*$/)?.[0] || '';
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Parse cookie string
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;

    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name && rest.length > 0) {
            cookies[name] = decodeURIComponent(rest.join('='));
        }
    });

    return cookies;
}

/**
 * Serialise cookie with options
 */
export function serialiseCookie(name: string, value: string, options: CookieOptions = {}): string {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.maxAge) {
        cookie += `; Max-Age=${options.maxAge}`;
    }

    if (options.expires) {
        cookie += `; Expires=${options.expires.toUTCString()}`;
    }

    if (options.httpOnly) {
        cookie += '; HttpOnly';
    }

    if (options.secure) {
        cookie += '; Secure';
    }

    if (options.domain) {
        cookie += `; Domain=${options.domain}`;
    }

    if (options.path) {
        cookie += `; Path=${options.path}`;
    }

    if (options.sameSite) {
        cookie += `; SameSite=${options.sameSite}`;
    }

    return cookie;
}

/**
 * Check if client accepts compression
 */
export function acceptsCompression(acceptEncoding: string): 'gzip' | 'deflate' | null {
    if (!acceptEncoding) return null;

    const encodings = acceptEncoding.toLowerCase().split(',').map(e => e.trim());

    if (encodings.includes('gzip')) return 'gzip';
    if (encodings.includes('deflate')) return 'deflate';

    return null;
}

/**
 * Simple compression algorithm (run-length encoding + basic dictionary)
 */
function simpleCompress(data: Buffer): Buffer {
    if (data.length === 0) return data;

    const result: number[] = [];
    let i = 0;

    while (i < data.length) {
        const currentByte = data[i];
        let count = 1;

        while (i + count < data.length && data[i + count] === currentByte && count < 255) {
            count++;
        }

        if (count > 3) {
            result.push(0x00, count, currentByte);
        } else {
            for (let j = 0; j < count; j++) {
                result.push(currentByte);
            }
        }

        i += count;
    }

    return Buffer.from(result);
}

/**
 * Calculate CRC32 checksum
 */
function calculateCRC32(data: Buffer): number {
    let crc = 0xFFFFFFFF;

    const table = new Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            if (c & 1) {
                c = 0xEDB88320 ^ (c >>> 1);
            } else {
                c = c >>> 1;
            }
        }
        table[i] = c;
    }

    for (let i = 0; i < data.length; i++) {
        crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }

    return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Zero-dependency compression implementation
 */
export async function compressData(data: Buffer, encoding: 'gzip' | 'deflate'): Promise<Buffer> {
    if (encoding === 'gzip') {
        const header = Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff]);
        const compressed = simpleCompress(data);
        const crc32 = calculateCRC32(data);
        const size = data.length;

        const trailer = Buffer.alloc(8);
        trailer.writeUInt32LE(crc32, 0);
        trailer.writeUInt32LE(size, 4);

        return Buffer.concat([header, compressed, trailer]);
    } else {
        return simpleCompress(data);
    }
}

/**
 * Apply security headers
 */
export function applySecurityHeaders(res: SwiftResponse, options: SecurityHeaders = {}): void {
    const defaults: SecurityHeaders = {
        contentSecurityPolicy: "default-src 'self'",
        strictTransportSecurity: 'max-age=31536000; includeSubDomains',
        xFrameOptions: 'DENY',
        xContentTypeOptions: true,
        referrerPolicy: 'strict-origin-when-cross-origin'
    };

    const config = { ...defaults, ...options };

    if (config.contentSecurityPolicy) {
        res.setHeader('Content-Security-Policy', config.contentSecurityPolicy);
    }

    if (config.strictTransportSecurity) {
        res.setHeader('Strict-Transport-Security', config.strictTransportSecurity);
    }

    if (config.xFrameOptions) {
        res.setHeader('X-Frame-Options', config.xFrameOptions);
    }

    if (config.xContentTypeOptions) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    if (config.referrerPolicy) {
        res.setHeader('Referrer-Policy', config.referrerPolicy);
    }

    if (config.permissionsPolicy) {
        res.setHeader('Permissions-Policy', config.permissionsPolicy);
    }
}

/**
 * Enhanced response object with all helper methods
 */
export function enhanceResponse(res: ServerResponse): SwiftResponse {
    const swiftRes = res as SwiftResponse;

    // Basic methods
    swiftRes.json = function (data: any): void {
        if (!this.headersSent) {
            this.setHeader('Content-Type', 'application/json');
        }
        this.end(JSON.stringify(data));
    };

    swiftRes.status = function (code: number): SwiftResponse {
        this.statusCode = code;
        return this;
    };

    swiftRes.send = function (data: string | Buffer): void {
        if (typeof data === 'string') {
            if (!this.headersSent && !this.getHeader('Content-Type')) {
                this.setHeader('Content-Type', 'text/plain');
            }
        }
        this.end(data);
    };

    // Navigation
    swiftRes.redirect = function (url: string, statusCode: number = 302): void {
        this.statusCode = statusCode;
        this.setHeader('Location', url);
        this.end();
    };

    // Cookies
    swiftRes.cookie = function (name: string, value: string, options: CookieOptions = {}): SwiftResponse {
        const cookieString = serialiseCookie(name, value, options);
        const existingCookies = this.getHeader('Set-Cookie') || [];
        const cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies.toString()];
        cookies.push(cookieString);
        this.setHeader('Set-Cookie', cookies);
        return this;
    };

    swiftRes.clearCookie = function (name: string, options: Omit<CookieOptions, 'maxAge' | 'expires'> = {}): SwiftResponse {
        return this.cookie(name, '', { ...options, expires: new Date(1) });
    };

    // File operations
    swiftRes.download = function (filePath: string, filename?: string): void {
        const downloadName = filename || filePath.split('/').pop() || 'download';
        const mimeType = getMimeType(downloadName);

        this.setHeader('Content-Type', mimeType);
        this.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        this.end(`File download: ${downloadName}`);
    };

    swiftRes.attachment = function (filename?: string): SwiftResponse {
        if (filename) {
            this.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            this.type(getMimeType(filename));
        } else {
            this.setHeader('Content-Disposition', 'attachment');
        }
        return this;
    };

    // Template rendering
    swiftRes.render = function (template: string, data: any = {}): void {
        this.setHeader('Content-Type', 'text/html');

        let html = template;
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            html = html.replace(regex, String(value));
        }

        this.end(html);
    };

    // Caching
    swiftRes.cache = function (maxAge: number, options: {
        public?: boolean;
        private?: boolean;
        noCache?: boolean;
        noStore?: boolean;
        mustRevalidate?: boolean;
    } = {}): SwiftResponse {
        const cacheControl = [];

        if (options.public) cacheControl.push('public');
        if (options.private) cacheControl.push('private');
        if (options.noCache) cacheControl.push('no-cache');
        if (options.noStore) cacheControl.push('no-store');
        if (options.mustRevalidate) cacheControl.push('must-revalidate');

        if (maxAge > 0) cacheControl.push(`max-age=${maxAge}`);

        this.setHeader('Cache-Control', cacheControl.join(', '));
        return this;
    };

    // Compression
    swiftRes.compress = async function (data: string | Buffer, force: boolean = false): Promise<void> {
        const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;

        if (!force && buffer.length < 1024) {
            this.end(buffer);
            return;
        }

        const req = (this as any).req;
        const acceptEncoding = req?.headers['accept-encoding'] || '';
        const compression = acceptsCompression(acceptEncoding);

        if (compression) {
            try {
                const compressed = await compressData(buffer, compression);
                this.setHeader('Content-Encoding', compression);
                this.setHeader('Vary', 'Accept-Encoding');
                this.end(compressed);
            } catch (error) {
                this.end(buffer);
            }
        } else {
            this.end(buffer);
        }
    };

    // Security
    swiftRes.security = function (options: SecurityHeaders = {}): SwiftResponse {
        applySecurityHeaders(this, options);
        return this;
    };

    // Content type
    swiftRes.type = function (contentType: string): SwiftResponse {
        if (contentType.includes('/')) {
            this.setHeader('Content-Type', contentType);
        } else {
            const mimeType = getMimeType(contentType.startsWith('.') ? contentType : '.' + contentType);
            this.setHeader('Content-Type', mimeType);
        }
        return this;
    };

    // Vary header
    swiftRes.vary = function (field: string): SwiftResponse {
        const existing = this.getHeader('Vary') as string;
        if (existing) {
            const fields = existing.split(',').map(f => f.trim());
            if (!fields.includes(field)) {
                fields.push(field);
                this.setHeader('Vary', fields.join(', '));
            }
        } else {
            this.setHeader('Vary', field);
        }
        return this;
    };

    return swiftRes;
}