export const FIELD = {
  title: 200,
  name: 200,
  description: 2000,
  body: 50_000,
  mistake: 50_000,
  improvement: 50_000,
  url: 2000,
  company: 200,
  position: 200,
  task: 500,
  query: 200,
  tagsMax: 10,
  tagLen: 30,
} as const;

export const LIST_LIMIT = 50;

export const CHAT_BODY_MAX = 32 * 1024;
export const CHAT_MESSAGES_MAX = 20;
export const CHAT_USER_TEXT_MAX = 2000;
export const CHAT_RATE_PER_MIN = 10;
export const CHAT_MAX_OUTPUT_TOKENS = 2048;

export const POMODORO_MIN = 1;
export const POMODORO_MAX = 90;

export function clip(value: string, max: number) {
  return value.length <= max ? value : value.slice(0, max);
}

export function searchPattern(query: string) {
  const q = clip(query.trim().replace(/[%_\\]/g, ""), FIELD.query);
  return q ? `%${q}%` : null;
}
