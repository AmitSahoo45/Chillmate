import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";
import { getDb } from "@/lib/db";
import { isAuthSecretConfigured } from "@/lib/env";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/lib/db/schema";

if (process.env.NODE_ENV === "production" && !isAuthSecretConfigured()) {
  throw new Error("AUTH_SECRET is required in production");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: process.env.DATABASE_URL
    ? DrizzleAdapter(getDb(), {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      })
    : undefined,
});
