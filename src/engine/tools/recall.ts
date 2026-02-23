import { Type } from "@mariozechner/pi-ai";
import type { ToolImpl } from "../agent/types.js";
import type { MemoryManager } from "../memory/index.js";

export function createRecallTool(memory: MemoryManager): ToolImpl {
  return {
    name: "recall",
    description:
      "Retrieve a specific memory entry by key. Returns the content previously saved with remember.",
    summary:
      "Read a memory entry by key. Use when you need to retrieve previously saved information.",
    dangerLevel: "safe",
    parameters: Type.Object({
      key: Type.String({
        description: "The memory key to retrieve (e.g. 'user-preferences', 'project-context')",
      }),
    }),
    async execute(args) {
      const key = args.key as string;
      try {
        const content = await memory.get(key);
        if (content === null) {
          return { content: `No memory found for key: ${key}` };
        }
        return { content };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: `Error reading memory: ${msg}`, isError: true };
      }
    },
  };
}
