import { isDatabaseConfigured } from "@/lib/env";

export async function withDb<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  if (!isDatabaseConfigured()) return fallback;
  try {
    return await fn();
  } catch (error) {
    console.error("withDb falling back to degraded state:", error);
    return fallback;
  }
}
