# Gateway And Auth

Spec sources:

- [../../../../architecture/surfaces/server.md](../../../../architecture/surfaces/server.md)
- [../../../../architecture/surfaces/gateway-access.md](../../../../architecture/surfaces/gateway-access.md)
- [../../../../architecture/runtime/interaction-protocol.md](../../../../architecture/runtime/interaction-protocol.md)
- [../../../../security/access/auth.md](../../../../security/access/auth.md)

| Case ID   | Feature path                      | Scenario                                                          | Expected result                                                                          | Lane          | Status    | Target suite                             |
| --------- | --------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------- | --------- | ---------------------------------------- |
| `GTW-001` | `gateway.health`                  | Unauthenticated health probe                                      | Returns healthy server status without creating user session state                        | `server-e2e`  | `covered` | `tests/server/gateway-http.test.ts`      |
| `GTW-002` | `gateway.auth.master`             | Master token calls protected API                                  | Protected procedures succeed and are tagged with master scope                            | `server-e2e`  | `covered` | `tests/server/gateway-http.test.ts`      |
| `GTW-003` | `gateway.auth.session-scope`      | Session token accesses only its own connector prefix and sessions | Foreign session access is rejected with authorization error                              | `workflow`    | `covered` | `tests/procedures.test.ts`               |
| `GTW-004` | `gateway.auth.webhook-scope`      | Webhook token attempts to call tRPC                               | Request is rejected; webhook token is HTTP-webhook-only                                  | `workflow`    | `covered` | `tests/server/gateway-http.test.ts`      |
| `GTW-005` | `gateway.pairing-code.issue`      | Pairing code issuance from local or admin path only               | Public unauthenticated network path cannot mint pairing codes                            | `server-e2e`  | `covered` | `tests/server/gateway-http.test.ts`      |
| `GTW-006` | `gateway.pairing-code.consume`    | Pairing code used once inside TTL                                 | First use returns session token; reuse or expiry fails                                   | `integration` | `covered` | `packages/runtime/src/auth.test.ts`      |
| `GTW-007` | `gateway.session-token.lifecycle` | Session token persists across restart until TTL or revoke         | Token survives restart inside TTL, expires by policy, and revokes immediately            | `recovery`    | `covered` | `tests/server/recovery-restart.test.ts`  |
| `GTW-008` | `/webhook/agent` SSE              | Authenticated SSE call to webhook agent endpoint                  | Emits valid event stream, terminates on done or error, preserves session identity        | `server-e2e`  | `covered` | `tests/server/webhook-endpoints.test.ts` |
| `GTW-009` | `gateway.realtime.ws`             | Authenticated WebSocket streaming and reconnect                   | WS auth works, events stream with durable IDs, reconnect resumes against canonical state | `server-e2e`  | `covered` | `tests/server/gateway-ws.test.ts`        |
| `GTW-010` | `gateway.bind-mode`               | Default loopback bind and explicit LAN/public bind                | Default is loopback-first; explicit bind changes reachability but not auth semantics     | `server-e2e`  | `covered` | `tests/server/gateway-http.test.ts`      |

## Notes

- `createCaller()` coverage is useful, but it does not satisfy the gateway contract by itself.
- `Aria Server Gateway` is the only Aria-owned entrypoint, so transport coverage is release-critical.
- `tests/server/gateway-http.test.ts` proves HTTP health, master-protected
  tRPC, webhook-token tRPC rejection, protected pairing-code issuance,
  single-use pairing consumption, default loopback discovery, and explicit bind
  discovery over real server ports.
- `tests/server/webhook-endpoints.test.ts` proves authenticated
  `/webhook/agent` SSE streaming over the real HTTP endpoint. Webhook task
  automation remains tracked under automation workflow coverage.
- `tests/server/gateway-ws.test.ts` proves session-token WebSocket auth,
  streamed event identity, unauthenticated WS rejection, and reattachment to
  canonical session/history state with a fresh client.
- `tests/server/recovery-restart.test.ts` proves persisted session tokens
  hydrate after server restart; `packages/runtime/src/auth.test.ts` covers
  session-token expiry and revoke behavior at the auth store layer.
