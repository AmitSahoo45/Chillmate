const buckets = new Map<string, number[]>();

export function allowRequest(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const next = (buckets.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (next.length >= max) return false;
  next.push(now);
  buckets.set(key, next);
  return true;
}
