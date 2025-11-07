/**
 * Mock response objects for testing
 *
 * @description Provides factory functions for creating mock HTTP responses
 * with spy methods for assertions.
 */

import {ServerResponse} from 'http';

/**
 * Creates a mock HTTP response object with spy methods
 */
export function createMockResponse(): {
    response: Partial<ServerResponse>;
    sent: { status?: number; headers: Record<string, string>; body?: string };
} {
    const sent: { status?: number; headers: Record<string, string>; body?: string } = {
        headers: {},
    };

    const response = {
        statusCode: 200,
        headersSent: false,

        setHeader(name: string, value: string) {
            sent.headers[name] = value;
        },

        writeHead(statusCode: number) {
            sent.status = statusCode;
            this.statusCode = statusCode;
        },

        end(body?: string) {
            sent.body = body;
            this.headersSent = true;
        },
    };

    return {response, sent};
}
