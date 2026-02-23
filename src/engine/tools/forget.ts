import { Type } from "@mariozechner/pi-ai";
import type { ToolImpl } from "../agent/types.js";
import type { MemoryManager } from "../memory/index.js";

export function createForgetTool(memory: MemoryManager): ToolImpl {
  return {
    name: "forget",
    description:
      "Delete a memory entry by key. Permanently removes the stored information.",
    summary:
      "Delete a memory entry by key. Use when information is no longer needed or the user asks to forget something.",
    dangerLevel: "safe",
    parameters: Type.Object({
      key: Type.String({
        description: "The memory key to delete",
      }),
    }),
    async execute(args) {
      const key = args.key as string;
      try {
        const deleted = await memory.delete(key);
        if (!deleted) {
          return { content: `No memory found for key: ${key}` };
        }
        return { content: `Deleted memory: ${key}` };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: `Error deleting memory: ${msg}`, isError: true };
      }
    },
  };
}
