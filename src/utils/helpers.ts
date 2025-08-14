/**
 * Helper function to parse limit strings like '1mb', '500kb', etc.
 */
export function parseLimit(limit: string): number {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = RegExp(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)?$/).exec(
    limit.toLowerCase()
  );
  if (!match) {
    throw new Error(`Invalid limit format: ${limit}

How to use Parse Limit:
1 Megabyte: 1mb/1MB/1mB/1Mb
10 Gigabytes: 10gb/10GB/10Gb/10gB
100 bytes: 100b/100B`);
  }

  const value = parseFloat(match[1]);
  const unit = match[2] || "b";

  return Math.floor(value * units[unit]);
}
