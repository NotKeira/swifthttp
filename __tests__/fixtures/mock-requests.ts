/**
 * Mock request objects for testing
 *
 * @description Provides factory functions for creating mock HTTP requests
 * with various configurations for testing purposes.
 */

import { IncomingMessage } from 'http';
import { Socket } from 'net';

/**
 * Creates a mock HTTP request object
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
}): Partial<IncomingMessage> {
  const socket = new Socket();

  return {
    method: options.method || 'GET',
    url: options.url || '/',
    headers: options.headers || {},
    socket,
  };
}
