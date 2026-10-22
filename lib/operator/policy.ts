import { createHash, timingSafeEqual } from "node:crypto";

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function istDay(date = new Date()) {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function istDayWindow(date = new Date()) {
  const day = istDay(date);
  const start = new Date(`${day}T00:00:00+05:30`);
  return {
    day,
    start,
    end: new Date(start.getTime() + DAY_MS),
    yesterday: istDay(new Date(start.getTime() - 1)),
  };
}

export function isDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

type MorningTask = {
  id: string;
  text: string;
  dueDate: string | null;
  createdAt: Date;
};

export function createMorningPlan<T extends MorningTask>(tasks: readonly T[]) {
  const selected = [...tasks].sort((a, b) => {
    if (a.dueDate !== b.dueDate) {
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    return a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id);
  }).slice(0, 3);
  const carriedOver = tasks.length - selected.length;
  return {
    selected,
    carriedOver,
    bodyMarkdown: [
      ...selected.map((task) => task.text.replace(/\s+/g, " ").trim() || "Untitled task"),
      `Carried over: ${carriedOver}`,
    ].join("\n"),
  };
}

/** Reserve before awaiting: parallel tool batches cannot overrun this budget. */
export function createExecutionBudget(limit = 40) {
  let used = 0;
  let failure: Error | undefined;
  return {
    get used() { return used; },
    async execute<T>(operation: () => Promise<T>): Promise<T> {
      if (failure) throw failure;
      if (used >= limit) {
        failure = new Error(`Operator tool call limit (${limit}) reached`);
        throw failure;
      }
      used += 1;
      try {
        return await operation();
      } catch (error) {
        failure ??= error instanceof Error ? error : new Error("Operator tool failed");
        throw failure;
      }
    },
    assertHealthy() {
      if (failure) throw failure;
    },
  };
}

export type DumpOutput = {
  id: string;
  kind: "task" | "note";
  label: string;
  subjectId?: string;
};

export function createDumpTracker(dumpIds: readonly string[]) {
  const outputs = new Map(dumpIds.map((id) => [id, [] as DumpOutput[]]));
  const outputIds = new Set<string>();
  const finished = new Set<string>();
  function assertEligible(id: string) {
    if (!outputs.has(id)) throw new Error("Dump is not eligible for this user and run");
  }
  return {
    assertEligible,
    recordOutput(dumpId: string, output: DumpOutput) {
      assertEligible(dumpId);
      if (finished.has(dumpId)) throw new Error("Dump is already finished");
      if (!output.id || outputIds.has(output.id)) throw new Error("Output is missing or already assigned to a dump");
      outputs.get(dumpId)!.push(output);
      outputIds.add(output.id);
    },
    finish(dumpId: string) {
      assertEligible(dumpId);
      if (!outputs.get(dumpId)!.length) throw new Error("Dump has no created output");
      finished.add(dumpId);
    },
    assertComplete() {
      const incomplete = dumpIds.filter((id) => !finished.has(id));
      if (incomplete.length) throw new Error(`Unfinished dumps: ${incomplete.join(", ")}`);
    },
    entries() {
      return [...outputs.entries()];
    },
  };
}

export function isOperatorAuthorized(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false;
  return timingSafeEqual(
    createHash("sha256").update(received).digest(),
    createHash("sha256").update(expected).digest(),
  );
}
