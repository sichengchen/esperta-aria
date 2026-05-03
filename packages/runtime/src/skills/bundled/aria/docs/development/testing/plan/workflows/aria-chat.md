# Workflow: Aria Chat

Primary spec:

- [../../../../architecture/surfaces/server.md](../../../../architecture/surfaces/server.md)
- [../../../../architecture/runtime/interaction-protocol.md](../../../../architecture/runtime/interaction-protocol.md)

| Case ID    | Workflow path                                        | Scenario                                                       | Expected result                                                                                          | Lane         | Status    | Target suite                                                          |
| ---------- | ---------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------ | --------- | --------------------------------------------------------------------- |
| `CHAT-001` | `desktop/mobile -> gateway -> runtime -> aria-agent` | Start a new Aria chat thread                                   | Auth succeeds, session is created or resolved, streamed output completes, durable records are written    | `server-e2e` | `covered` | `tests/server/aria-chat-e2e.test.ts`                                  |
| `CHAT-002` | `desktop/mobile -> gateway -> runtime -> aria-agent` | Resume the latest Aria chat thread                             | Existing thread/session is resumed and transcript hydration works                                        | `workflow`   | `covered` | `tests/client-surfaces.test.ts`, `tests/server/aria-chat-e2e.test.ts` |
| `CHAT-003` | `gateway -> runtime -> approval/question`            | Dangerous tool request or ask-user interruption occurs mid-run | Stream surfaces approval or question event with durable IDs and later continues correctly after response | `server-e2e` | `covered` | `tests/server/aria-chat-e2e.test.ts`                                  |
| `CHAT-004` | `client -> gateway -> runtime.stop`                  | User stops an active chat run                                  | Run is cancelled or interrupted and pending interaction state is cleared                                 | `workflow`   | `covered` | `tests/client-surfaces.test.ts`, `tests/server/aria-chat-e2e.test.ts` |
| `CHAT-005` | `client disconnect -> reconnect -> gateway`          | Reconnect during or after stream                               | Client reattaches to canonical thread and run state without shadow state drift                           | `server-e2e` | `covered` | `tests/server/gateway-ws.test.ts`                                     |
| `CHAT-006` | `runtime -> archive -> search/history`               | Reopen chat after agent is gone or server restarts             | Search and history still work via archive-backed state                                                   | `recovery`   | `covered` | `tests/procedures.test.ts`, `tests/server/recovery-restart.test.ts`   |
| `CHAT-007` | `console -> local auth -> runtime -> aria-agent`     | Use server-local console as a chat surface                     | Console behaves as local UI for the same server-owned Aria threads, not as a second runtime              | `server-e2e` | `covered` | `tests/server/console-e2e.test.ts`                                    |

## Shipping Rule

This workflow is not done until at least one black-box server test proves the flow from client-facing gateway call to durable stored result.

`tests/server/aria-chat-e2e.test.ts` now starts real gateway servers and uses
deterministic session agents to prove streamed chat persistence, approval
resolution, question answering, and active-run stop behavior over client-facing
HTTP/WS calls. `tests/server/gateway-ws.test.ts` proves fresh-client
reattachment to canonical session/history state after a completed stream.
`tests/client-surfaces.test.ts` covers latest-session resume and transcript
hydration from the access client surface.
`tests/server/recovery-restart.test.ts` proves archive-backed history and search
after server restart and session teardown.
`tests/server/console-e2e.test.ts` proves the server-local console client reads
local gateway discovery/auth files, creates a `tui` session, streams through the
same gateway/runtime path, and persists chat state in the server store.
