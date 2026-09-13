import { isDatabaseConfigured } from "@/lib/env";

export async function withDb<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  if (!isDatabaseConfigured()) return fallback;
  try {
    return await fn();
  } catch (error) {
    console.error("withDb failed", { requestId: crypto.randomUUID(), error });
    throw error;
  }
}
