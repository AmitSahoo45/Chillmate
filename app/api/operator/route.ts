import { revalidatePath } from "next/cache";

import { AiGuardError } from "@/lib/ai-guard";
import { isAnthropicConfigured, isDatabaseConfigured } from "@/lib/env";
import { isOperatorAuthorized } from "@/lib/operator/policy";
import { runOperator } from "@/lib/operator/runner";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isOperatorAuthorized(request.headers.get("x-secret"), process.env.OPERATOR_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const run = new URL(request.url).searchParams.get("run");
  if (run !== "night" && run !== "morning") {
    return Response.json({ error: "run must be night or morning" }, { status: 400 });
  }
  if (!isDatabaseConfigured() || (run === "night" && !isAnthropicConfigured())) {
    return Response.json({ error: "Operator is not configured" }, { status: 503 });
  }
  try {
    const result = await runOperator(run, { signal: request.signal });
    if (result.completed) {
      revalidatePath("/app", "layout");
    }
    return Response.json(result, { status: result.failed ? 500 : result.busy ? 409 : 200 });
  } catch (error) {
    if (error instanceof AiGuardError) {
      return Response.json({ error: error.message }, { status: error.status, headers: error.status === 429 ? { "Retry-After": "60" } : undefined });
    }
    return Response.json({ error: "Operator failed; unfinished changes were rolled back" }, { status: 500 });
  }
}
