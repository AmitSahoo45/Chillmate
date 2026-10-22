import type { LanguageModelMiddleware } from "ai";
import type { LanguageModelV4CallOptions } from "@ai-sdk/provider";

import { AI_MODEL_CALL_LIMIT, AiGuardError, prepareBoundedModelParams, type AiAccess, type AiContext } from "./policy";
import type { Reservation } from "./store";

export function createGuardMiddleware(
  context: AiContext,
  resolveAccess: (context: AiContext) => AiAccess,
  reserve: (access: AiAccess, reservation: Reservation) => Promise<void>,
): LanguageModelMiddleware {
  let calls = 0;
  async function beforeCall(params: LanguageModelV4CallOptions) {
    const access = resolveAccess(context);
    if (++calls > AI_MODEL_CALL_LIMIT[context.kind]) {
      throw new AiGuardError("call_limit", 429, "AI model call limit reached.");
    }
    if (params.abortSignal?.aborted) {
      throw new AiGuardError("cancelled", 499, "AI request was cancelled.");
    }
    const bounded = prepareBoundedModelParams(params);
    await reserve(access, bounded);
    // A cancelled or failed provider call still burns the committed reservation.
    if (params.abortSignal?.aborted) {
      throw new AiGuardError("cancelled", 499, "AI request was cancelled.");
    }
  }
  return {
    transformParams: async ({ params }) => prepareBoundedModelParams(params).params,
    wrapGenerate: async ({ params, doGenerate }) => { await beforeCall(params); return doGenerate(); },
    wrapStream: async ({ params, doStream }) => { await beforeCall(params); return doStream(); },
  };
}
