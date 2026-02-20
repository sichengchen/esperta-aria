---
id: 018
title: tRPC router & Engine scaffolding
status: pending
type: feature
priority: 1
phase: phase-2
branch: feature/phase-2
created: 2026-02-19
---

# tRPC router & Engine scaffolding

## Context
SA is currently a monolithic process (`src/index.ts`) that directly instantiates Agent, Router, Memory, Tools, TUI, and Telegram. Phase 2 splits this into an Engine (backend daemon) and thin Connectors (frontends). This plan creates the Engine entry point and defines the tRPC router with all procedure signatures.

The Engine will be a standalone Bun process that starts a tRPC server (HTTP + WebSocket for subscriptions). Connectors connect to it as tRPC clients.

## Approach
1. Install dependencies: `@trpc/server`, `@trpc/client`, `ws` (for WebSocket subscriptions), `superjson` (for serialization)
2. Create `src/engine/` directory structure:
   - `src/engine/server.ts` — HTTP + WS server setup using Bun's native `Bun.serve()`
   - `src/engine/router.ts` — tRPC router definition with all procedures
   - `src/engine/context.ts` — tRPC context factory (auth, session resolution)
   - `src/engine/index.ts` — Engine entry point (bootstrap and start)
3. Define tRPC procedures (signatures only, stubs for now):
   - `chat.send` (mutation) — send a user message, returns session ID
   - `chat.stream` (subscription) — stream AgentEvents for a session
   - `chat.history` (query) — get conversation history for a session
   - `session.create` (mutation) — create a new session for a Connector
   - `session.list` (query) — list active sessions
   - `tool.approve` (mutation) — approve/reject a pending tool execution
   - `skill.list` (query) — list loaded skills
   - `skill.activate` (mutation) — manually activate a skill
   - `health.ping` (query) — health check
   - `auth.pair` (mutation) — device-flow pairing
4. Create `src/engine/trpc.ts` — shared tRPC initialization (router factory, middleware)
5. Create `src/shared/types.ts` — shared types between Engine and Connectors (AgentEvent, Session, etc.)
6. Add `engine:dev` script to `package.json`

## Files to change
- `package.json` (modify — add tRPC dependencies and engine script)
- `src/engine/trpc.ts` (create — tRPC initialization, middleware)
- `src/engine/router.ts` (create — tRPC router with all procedure definitions)
- `src/engine/context.ts` (create — context factory)
- `src/engine/server.ts` (create — HTTP + WS server)
- `src/engine/index.ts` (create — Engine entry point)
- `src/shared/types.ts` (create — shared types for Engine ↔ Connector)

## Verification
- Run: `bun run src/engine/index.ts` starts the tRPC server on a default port
- Run: `bun test`
- Expected: Server starts, health.ping responds, all stubs return placeholder values
- Edge cases: Port already in use, graceful shutdown on SIGTERM
