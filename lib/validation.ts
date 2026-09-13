import { FIELD } from "@/lib/limits";

export function parseHttpUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length > FIELD.url) {
    throw new Error("Link must be an http or https URL.");
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Link must be an http or https URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Link must be an http or https URL.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Link must be an http or https URL.");
  }
  return parsed.href;
}

export function safeHttpHref(value: string): string | null {
  try {
    const href = parseHttpUrl(value);
    return href || null;
  } catch {
    return null;
  }
}
