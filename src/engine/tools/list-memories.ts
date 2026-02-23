import { Type } from "@mariozechner/pi-ai";
import type { ToolImpl } from "../agent/types.js";
import type { MemoryManager } from "../memory/index.js";

export function createListMemoriesTool(memory: MemoryManager): ToolImpl {
  return {
    name: "list_memories",
    description:
      "List all stored memory keys. Returns a list of available memory entries.",
    summary:
      "List all memory keys. Use to discover what information has been saved.",
    dangerLevel: "safe",
    parameters: Type.Object({}),
    async execute() {
      try {
        const keys = await memory.list();
        if (keys.length === 0) {
          return { content: "No memories stored yet." };
        }
        return { content: keys.map((k) => `- ${k}`).join("\n") };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: `Error listing memories: ${msg}`, isError: true };
      }
    },
  };
}
