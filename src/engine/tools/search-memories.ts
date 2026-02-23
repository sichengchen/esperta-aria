import { Type } from "@mariozechner/pi-ai";
import type { ToolImpl } from "../agent/types.js";
import type { MemoryManager } from "../memory/index.js";

export function createSearchMemoriesTool(memory: MemoryManager): ToolImpl {
  return {
    name: "search_memories",
    description:
      "Search across all memory entries for a keyword or phrase. Returns matching entries with their keys and content snippets.",
    summary:
      "Search memories by keyword. Use to find relevant information across all saved memories.",
    dangerLevel: "safe",
    parameters: Type.Object({
      query: Type.String({
        description: "The search term to look for across all memory entries",
      }),
    }),
    async execute(args) {
      const query = args.query as string;
      try {
        const results = await memory.search(query);
        if (results.length === 0) {
          return { content: `No memories matching: ${query}` };
        }
        const formatted = results.map((entry) => {
          const snippet = entry.content.length > 200
            ? entry.content.slice(0, 200) + "..."
            : entry.content;
          return `### ${entry.key}\n${snippet}`;
        });
        return { content: formatted.join("\n\n") };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: `Error searching memories: ${msg}`, isError: true };
      }
    },
  };
}
