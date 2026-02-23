import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MemoryManager } from "../../src/engine/memory/manager.js";
import { createRecallTool } from "../../src/engine/tools/recall.js";
import { createListMemoriesTool } from "../../src/engine/tools/list-memories.js";
import { createSearchMemoriesTool } from "../../src/engine/tools/search-memories.js";
import { createForgetTool } from "../../src/engine/tools/forget.js";

let tmpDir: string;
let memory: MemoryManager;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "sa-memory-test-"));
  memory = new MemoryManager(tmpDir);
  await memory.init();
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe("recall tool", () => {
  it("returns content for existing key", async () => {
    await memory.save("greeting", "Hello world");
    const tool = createRecallTool(memory);
    const result = await tool.execute({ key: "greeting" });
    expect(result.content).toBe("Hello world");
    expect(result.isError).toBeUndefined();
  });

  it("returns not-found message for missing key", async () => {
    const tool = createRecallTool(memory);
    const result = await tool.execute({ key: "nonexistent" });
    expect(result.content).toBe("No memory found for key: nonexistent");
    expect(result.isError).toBeUndefined();
  });
});

describe("list_memories tool", () => {
  it("returns empty message when no memories", async () => {
    const tool = createListMemoriesTool(memory);
    const result = await tool.execute({});
    expect(result.content).toBe("No memories stored yet.");
  });

  it("returns list of keys", async () => {
    await memory.save("alpha", "content a");
    await memory.save("beta", "content b");
    const tool = createListMemoriesTool(memory);
    const result = await tool.execute({});
    expect(result.content).toContain("- alpha");
    expect(result.content).toContain("- beta");
  });
});

describe("search_memories tool", () => {
  it("returns no-match message when nothing found", async () => {
    const tool = createSearchMemoriesTool(memory);
    const result = await tool.execute({ query: "xyz" });
    expect(result.content).toBe("No memories matching: xyz");
  });

  it("returns matching entries", async () => {
    await memory.save("project", "SA is a personal AI assistant");
    await memory.save("unrelated", "weather forecast today");
    const tool = createSearchMemoriesTool(memory);
    const result = await tool.execute({ query: "personal AI" });
    expect(result.content).toContain("### project");
    expect(result.content).toContain("SA is a personal AI assistant");
    expect(result.content).not.toContain("### unrelated");
  });
});

describe("forget tool", () => {
  it("deletes existing key", async () => {
    await memory.save("temp", "temporary data");
    const tool = createForgetTool(memory);
    const result = await tool.execute({ key: "temp" });
    expect(result.content).toBe("Deleted memory: temp");
    // Verify it's gone
    const got = await memory.get("temp");
    expect(got).toBeNull();
  });

  it("returns not-found message for missing key", async () => {
    const tool = createForgetTool(memory);
    const result = await tool.execute({ key: "ghost" });
    expect(result.content).toBe("No memory found for key: ghost");
  });
});
