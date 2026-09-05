export function parseDateOnly(value: string) {
  const date = tryParseDateOnly(value);
  if (!date) {
    throw new Error("A valid applied date is required.");
  }
  return date;
}

/** Non-throwing variant for LLM-supplied input. Returns null unless YYYY-MM-DD. */
export function tryParseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}
