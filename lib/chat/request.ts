export class ChatRequestError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ChatRequestError";
    this.status = status;
  }
}

export function hasExpectedOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new ChatRequestError("Expected application/json", 415);
  }
  const length = request.headers.get("content-length");
  if (length && /^\d+$/.test(length) && Number(length) > maxBytes) {
    throw new ChatRequestError("Payload too large", 413);
  }
  if (!request.body) throw new ChatRequestError("Invalid JSON");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ChatRequestError("Request timed out", 408)), 10_000);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new ChatRequestError("Payload too large", 413);
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    try {
      return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    } catch {
      throw new ChatRequestError("Invalid JSON");
    }
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}

export function extractUserText(parsed: unknown, maxText: number, maxMessages: number) {
  if (typeof parsed !== "object" || parsed === null) throw new ChatRequestError("Invalid body");
  const body = parsed as { message?: unknown; messages?: unknown };
  if (Array.isArray(body.messages) && body.messages.length > maxMessages) {
    throw new ChatRequestError("Too many messages");
  }
  const message = body.message ?? (Array.isArray(body.messages)
    ? [...body.messages].reverse().find((item) => item?.role === "user")
    : undefined);
  if (typeof message !== "object" || message === null) throw new ChatRequestError("Invalid message");
  const candidate = message as { role?: unknown; parts?: unknown };
  if (candidate.role !== "user" || !Array.isArray(candidate.parts) || !candidate.parts.length || candidate.parts.length > 10) {
    throw new ChatRequestError("Invalid message");
  }
  const parts = candidate.parts.map((part: unknown) => {
    if (typeof part !== "object" || part === null) throw new ChatRequestError("Text messages only");
    const item = part as { type?: unknown; text?: unknown };
    if (item.type !== "text" || typeof item.text !== "string") throw new ChatRequestError("Text messages only");
    return item.text;
  });
  const text = parts.join("\n");
  if (!text.trim()) throw new ChatRequestError("Message is empty");
  if (text.length > maxText) throw new ChatRequestError("Message too long");
  return text;
}
