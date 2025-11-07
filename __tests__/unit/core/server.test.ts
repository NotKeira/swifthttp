/**
 * Unit tests for the Server class (formerly SwiftHTTP)
 *
 * @description Tests the core server functionality including instantiation,
 * route registration, middleware handling, and lifecycle management.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import SwiftHTTP from '../../../src';

describe('Server (SwiftHTTP)', () => {
  let server: SwiftHTTP;

  beforeEach(() => {
    server = new SwiftHTTP();
  });
  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  describe('Instantiation', () => {
    it('should create a server instance', () => {
      expect(server).toBeInstanceOf(SwiftHTTP);
    });

    it('should accept configuration options', () => {
      const configuredServer = new SwiftHTTP({
        port: 4000,
        hostname: '0.0.0.0',
      });

      expect(configuredServer).toBeInstanceOf(SwiftHTTP);
    });
  });

  describe('Route Registration', () => {
    it('should register GET route', () => {
      const handler = () => {};
      expect(() => {
        server.get('/test', handler);
      }).not.toThrow();
    });

    it('should register POST route', () => {
      const handler = () => {};

      expect(() => {
        server.post('/test', handler);
      }).not.toThrow();
    });
  });

  describe('Server Lifecycle', () => {
    it('should have getServer method', () => {
      expect(typeof server.getServer).toBe('function');
    });

    it('should have close method', () => {
      expect(typeof server.close).toBe('function');
    });
  });
});
