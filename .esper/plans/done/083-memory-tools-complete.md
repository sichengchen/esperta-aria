---
id: 83
title: fix: expose missing memory tools (recall, list, search, delete)
status: done
type: fix
priority: 1
phase: 006-full-stack-polish
branch: fix/memory-tools-complete
created: 2026-02-22
shipped_at: 2026-02-23
---
# fix: expose missing memory tools (recall, list, search, delete)

## Context

The `MemoryManager` already implements `get()`, `list()`, `search()`, and `delete()` methods, but only `remember` (write via `save()`) is exposed as an agent tool. This means Sasa can store memories but cannot recall, list, search, or delete them during a conversation. The agent's only access to stored memories is the truncated `MEMORY.md` injected into the system prompt at startup — individual topic files are write-only from the agent's perspective.

This is a p1 issue because memory is core functionality and the incomplete toolset makes it unreliable for daily use.

## Approach

1. **Create `recall` tool** (`src/engine/tools/recall.ts`)
   - Parameters: `key` (string) — the memory key to retrieve
   - Calls `memory.get(key)` → returns content or "No memory found for key: ..."
   - Danger level: `safe` (read-only, auto-approved)

2. **Create `list_memories` tool** (`src/engine/tools/list-memories.ts`)
   - No parameters (or optional `prefix` filter)
   - Calls `memory.list()` → returns formatted list of all memory keys
   - Danger level: `safe`

3. **Create `search_memories` tool** (`src/engine/tools/search-memories.ts`)
   - Parameters: `query` (string) — search term
   - Calls `memory.search(query)` → returns matching entries with key + content snippet
   - Danger level: `safe`

4. **Create `forget` tool** (`src/engine/tools/forget.ts`)
   - Parameters: `key` (string) — the memory key to delete
   - Calls `memory.delete(key)` → returns success/failure message
   - Danger level: `safe` (user's own data, reversible by re-remembering)

5. **Register all new tools** in `src/engine/runtime.ts` alongside `createRememberTool(memory)`

6. **Update documentation**
   - `src/engine/skills/bundled/sa/docs/tools.md` — add entries for all 4 new tools
   - `src/engine/skills/bundled/sa/SKILL.md` — update memory capabilities section

7. **Add tests** for each new tool in `tests/` or co-located test files

## Files to change

- `src/engine/tools/recall.ts` (create — recall tool)
- `src/engine/tools/list-memories.ts` (create — list tool)
- `src/engine/tools/search-memories.ts` (create — search tool)
- `src/engine/tools/forget.ts` (create — forget tool)
- `src/engine/tools/index.ts` (modify — export new tool factories)
- `src/engine/runtime.ts` (modify — register new tools)
- `src/engine/skills/bundled/sa/docs/tools.md` (modify — document new tools)
- `src/engine/skills/bundled/sa/SKILL.md` (modify — update memory capabilities)
- `tests/tools/memory-tools.test.ts` (create — tests for all 4 new tools)

## Verification

- Run: `bun test` — all existing + new tests pass
- Run: `bun run typecheck` — no type errors
- Run: `bun run lint` — no lint errors
- Manual: start engine, use each tool via TUI:
  - `remember("test-key", "test content")` → saves
  - `recall("test-key")` → returns "test content"
  - `list_memories()` → includes "test-key"
  - `search_memories("test")` → finds the entry
  - `forget("test-key")` → deletes it
  - `recall("test-key")` → returns "not found"
- Regression check: existing `remember` tool still works, MEMORY.md context injection unchanged
