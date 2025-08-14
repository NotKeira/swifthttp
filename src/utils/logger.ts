/**
 * Colour codes for terminal output
 */
const colours = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

/**
 * Get colour based on the HTTP status code
 */
function getStatusColour(statusCode: number): string {
  if (statusCode >= 500) return colours.red;
  if (statusCode >= 400) return colours.yellow;
  if (statusCode >= 300) return colours.cyan;
  if (statusCode >= 200) return colours.green;
  return colours.white;
}

/**
 * Get colour based on HTTP method
 */
function getMethodColour(method: string): string {
  const methodColours: Record<string, string> = {
    GET: colours.blue,
    POST: colours.green,
    PUT: colours.yellow,
    DELETE: colours.red,
    PATCH: colours.magenta,
    HEAD: colours.cyan,
    OPTIONS: colours.gray,
  };
  return methodColours[method] || colours.white;
}

/**
 * Format duration with appropriate colour
 */

function formatDuration(duration: number): string {
  let colour: string;
  if (duration > 1000) {
    colour = colours.red;
  } else if (duration > 500) {
    colour = colours.yellow;
  } else if (duration > 100) {
    colour = colours.cyan;
  } else {
    colour = colours.green;
  }
  return `${colour}${duration}ms${colours.reset}`;
}

/**
 * Custom coloured logger function
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userAgent?: string
): { [key: string]: string } {
  const timestamp = colours.gray + new Date().toISOString() + colours.reset;
  const colouredMethod =
    getMethodColour(method) + colours.bright + method.padEnd(7) + colours.reset;
  const colouredStatus =
    getStatusColour(statusCode) + colours.bright + statusCode + colours.reset;
  const colouredPath = colours.white + path + colours.reset;
  const colouredDuration = formatDuration(duration);

  // Dev format (concise and colourful)
  const devLog = `${timestamp} ${colouredMethod} ${colouredPath} ${colouredStatus} ${colouredDuration}`;

  // Combined format (more detailed)
  const combinedLog = `${timestamp} | [${colouredMethod}] ${colouredPath} ${colouredStatus} ${colouredDuration} ${
    colours.dim
  }"${userAgent || "Unknown"}"${colours.reset}`;

  return { devLog, combinedLog };
}
