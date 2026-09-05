export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of input.split(",")) {
    const tag = part.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

export function formatTags(tags: string[]): string {
  return tags.join(", ");
}

export function matchesQuery(
  query: string,
  fields: Array<string | string[] | null | undefined>,
) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => {
    if (!field) return false;
    if (Array.isArray(field)) {
      return field.some((item) => item.toLowerCase().includes(q));
    }
    return field.toLowerCase().includes(q);
  });
}
