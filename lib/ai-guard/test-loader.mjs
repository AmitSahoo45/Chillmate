import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cache = new Map();
export function loadTs(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file);
  const source = readFileSync(file, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  }}).outputText;
  const loadedModule = { exports: {} };
  cache.set(file, loadedModule.exports);
  const nativeRequire = createRequire(file);
  const require = (specifier) => {
    if (specifier.startsWith("@/")) return loadTs(`${specifier.slice(2)}.ts`);
    if (specifier.startsWith(".")) return loadTs(`${path.resolve(path.dirname(file), specifier)}.ts`);
    return nativeRequire(specifier);
  };
  new Script(`(function(require,module,exports){${compiled}\n})`, { filename: file })
    .runInThisContext()(require, loadedModule, loadedModule.exports);
  cache.set(file, loadedModule.exports);
  return loadedModule.exports;
}
