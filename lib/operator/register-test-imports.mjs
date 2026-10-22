import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

// Resolve the application's aliases for native Node tests without a transpiler.
const root = new URL("../../", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    const target = specifier.startsWith("@/")
      ? new URL(specifier.slice(2), root).href
      : specifier;
    try {
      return nextResolve(target, context);
    } catch (error) {
      if (error.code !== "ERR_MODULE_NOT_FOUND" && error.code !== "ERR_UNSUPPORTED_DIR_IMPORT") throw error;
      if (!target.startsWith("file:") && !target.startsWith(".")) throw error;
      const path = fileURLToPath(new URL(target, context.parentURL));
      for (const candidate of [`${path}.ts`, `${path}/index.ts`]) {
        if (existsSync(candidate)) return nextResolve(pathToFileURL(candidate).href, context);
      }
      throw error;
    }
  },
});
