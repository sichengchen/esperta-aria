# Durability And Operations

Spec sources:

- [../../../../architecture/runtime/runtime.md](../../../../architecture/runtime/runtime.md)
- [../../../../architecture/surfaces/server.md](../../../../architecture/surfaces/server.md)
- [../../../../security/access/audit-log.md](../../../../security/access/audit-log.md)

| Case ID   | Feature path               | Scenario                                                                  | Expected result                                                                         | Lane          | Status    | Target suite                                     |
| --------- | -------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------- | --------- | ------------------------------------------------ |
| `OPS-001` | `store.persistence`        | Persist sessions and messages across restart                              | Durable session state survives store reopen and server restart                          | `integration` | `covered` | `packages/runtime/src/operational-store.test.ts` |
| `OPS-002` | `store.restart-interrupt`  | Restart while run, tool call, and approval are pending                    | Records become interrupted with correct durable error state                             | `integration` | `covered` | `packages/runtime/src/operational-store.test.ts` |
| `OPS-003` | `server.restart-reconnect` | Start server, create state, stop, restart, then reconnect through gateway | Canonical runtime state is restored through the public boundary                         | `recovery`    | `covered` | `tests/server/recovery-restart.test.ts`          |
| `OPS-004` | `archive.sync`             | Active session is flushed and searchable after teardown                   | Transcript archive remains queryable after agent detaches or server stops               | `recovery`    | `covered` | `tests/server/recovery-restart.test.ts`          |
| `OPS-005` | `audit.log`                | Write, rotate, and query audit entries                                    | Audit log remains append-only, filtered queries work, rotation preserves recent history | `integration` | `covered` | `packages/runtime/src/audit.test.ts`             |
| `OPS-006` | `checkpoints`              | Create, diff, and restore checkpoint for workdir                          | Checkpoint operations behave safely inside allowed path boundary                        | `workflow`    | `covered` | `tests/server/checkpoints-e2e.test.ts`           |
| `OPS-007` | `daemon.lifecycle`         | Start, stop, status, restart daemon                                       | Discovery files and lifecycle logs stay correct                                         | `integration` | `covered` | `tests/server-daemon.test.ts`                    |
| `OPS-008` | `server.host`              | Thin server app bootstrap and host package seam                           | Public package shell starts and stops cleanly                                           | `integration` | `covered` | `tests/server-host.test.ts`                      |

## Notes

- Store and daemon foundations are solid.
- `tests/server/recovery-restart.test.ts` proves restart/reconnect through real
  gateway servers, archive-backed history/search after teardown, persisted
  session-token hydration, and restored automation task configuration.
- `tests/server/checkpoints-e2e.test.ts` proves list, diff, restore, master-only
  workdir override, and path-escape rejection against a real checkpoint shadow
  repository.
