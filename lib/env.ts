export function isAuthSecretConfigured() {
  return Boolean(process.env.AUTH_SECRET);
}

export function isGoogleAuthConfigured() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

export function isGeminiConfigured() {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
