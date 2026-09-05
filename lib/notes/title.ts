export const INBOX_NAME = "Inbox";

export function isInboxName(name: string) {
  return name.trim().toLowerCase() === "inbox";
}

export function titleFromBody(body: string) {
  const line = body
    .split(/\r?\n/)
    .map((item) =>
      item
        .replace(/^#{1,6}\s*/, "")
        .replace(/^[-*+]\s+/, "")
        .replace(/^\[[ xX]\]\s*/, "")
        .trim(),
    )
    .find(Boolean);
  if (!line) return "";
  return line.length > 72 ? `${line.slice(0, 69).trimEnd()}…` : line;
}

export function dumpTitle(now = new Date()) {
  return `Dump · ${now.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function noteTitle(title: string, body: string) {
  const named = title.trim();
  if (named) return named;
  return titleFromBody(body) || dumpTitle();
}

export function notePreview(body: string, max = 120) {
  const text = body.replace(/[#>*`_[\]()\-]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
