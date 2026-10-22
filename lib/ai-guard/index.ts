import { anthropic } from "@ai-sdk/anthropic";
import { wrapLanguageModel } from "ai";

import { getGuardDatabase } from "./database";
import { createGuardMiddleware } from "./middleware";
import { AI_MODEL_ID, resolveAiAccess, type AiContext, type AiKind } from "./policy";
import { createQuotaStore } from "./store";

export { AiGuardError } from "./policy";

export function assertAiAccess(userId: string, kind: AiKind) {
  return resolveAiAccess({ userId, kind }, {
    AI_OWNER_USER_ID: process.env.AI_OWNER_USER_ID,
    AI_GUEST_ACCESS_ENABLED: process.env.AI_GUEST_ACCESS_ENABLED,
  });
}

export async function reserveAiRequest(context: AiContext) {
  const access = assertAiAccess(context.userId, context.kind);
  await createQuotaStore(getGuardDatabase()).reserveRequest(access);
}

export function createGuardedHaikuModel(context: AiContext) {
  assertAiAccess(context.userId, context.kind);
  return wrapLanguageModel({
    model: anthropic(AI_MODEL_ID),
    middleware: createGuardMiddleware(context,
      ({ userId, kind }) => assertAiAccess(userId, kind),
      async (access, reservation) => createQuotaStore(getGuardDatabase()).reserveModelCall(access, reservation)),
  });
}
