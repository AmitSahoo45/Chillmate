const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for well-formed UUIDs. Guards uuid-column queries against 500s on junk input. */
export function isUuid(value: string) {
  return UUID_RE.test(value);
}
