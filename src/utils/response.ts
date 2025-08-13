import { ServerResponse } from "http";
import { SwiftResponse } from "../types";

/**
 * Enhance the native response object with SwiftHTTP helper methods
 */
export function enhanceResponse(res: ServerResponse): SwiftResponse {
  const swiftRes = res as SwiftResponse;

  // Add JSON response helper
  swiftRes.json = function (data: any): void {
    if (!this.headersSent) {
      this.setHeader("Content-Type", "application/json");
    }
    this.end(JSON.stringify(data));
  };

  // Add status code helper (its chainable!!!)
  swiftRes.status = function (code: number): SwiftResponse {
    this.statusCode = code;
    return this;
  };

  // Add send helper for strings/buffers
  swiftRes.send = function (data: string | Buffer): void {
    if (typeof data === "string") {
      if (!this.headersSent && !this.getHeader("Content-Type")) {
        this.setHeader("Content-Type", "text/plain");
      }
    }
    this.end(data);
  };

  return swiftRes;
}
