# Automation

Spec sources:

- [../../../../architecture/runtime/automation.md](../../../../architecture/runtime/automation.md)
- [../../../../architecture/surfaces/server.md](../../../../architecture/surfaces/server.md)
- [../../../../operator/operations/automation.md](../../../../operator/operations/automation.md)

| Case ID   | Feature path                    | Scenario                                                                     | Expected result                                                            | Lane          | Status    | Target suite                                                      |
| --------- | ------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------- | --------- | ----------------------------------------------------------------- |
| `AUT-001` | `automation.heartbeat.schedule` | Heartbeat registers with correct cadence and writes health state             | Built-in heartbeat exists, writes health file, and tracks last result      | `integration` | `covered` | `tests/heartbeat.test.ts`                                         |
| `AUT-002` | `automation.heartbeat.suppress` | Heartbeat agent returns suppress token                                       | Notification is suppressed and result is still logged durably              | `integration` | `covered` | `tests/heartbeat.test.ts`                                         |
| `AUT-003` | `automation.heartbeat.trigger`  | Trigger heartbeat through procedure and webhook path                         | Same runtime-owned automation path runs and returns durable metadata       | `server-e2e`  | `covered` | `tests/server/automation-e2e.test.ts`                             |
| `AUT-004` | `automation.cron.lifecycle`     | Add, list, update, pause, resume, remove cron task                           | Config and scheduler stay in sync and builtin tasks remain protected       | `workflow`    | `covered` | `tests/procedures.test.ts`, `tests/server/automation-e2e.test.ts` |
| `AUT-005` | `automation.cron.run`           | Run cron task immediately                                                    | Fresh isolated automation session is created and run metadata is persisted | `workflow`    | `covered` | `tests/server/automation-e2e.test.ts`                             |
| `AUT-006` | `automation.retry`              | Automation fails then retries under retry policy                             | Attempt numbers, delays, and terminal status are persisted correctly       | `workflow`    | `covered` | `tests/server/automation-e2e.test.ts`                             |
| `AUT-007` | `automation.webhook.config`     | Add, update, remove webhook task                                             | Task registry and config updates stay durable                              | `workflow`    | `covered` | `tests/procedures.test.ts`                                        |
| `AUT-008` | `automation.webhook.http`       | Trigger `/webhook/tasks/:slug` with payload, auth, and truncation edge cases | Auth is enforced, payload is framed, task executes, metadata updates       | `server-e2e`  | `covered` | `tests/server/webhook-endpoints.test.ts`                          |
| `AUT-009` | `automation.delivery`           | Automation delivers final response to connector target                       | Delivery status and error metadata are persisted                           | `workflow`    | `covered` | `tests/server/connector-flow.test.ts`                             |
| `AUT-010` | `automation.restore`            | Restart server with cron and webhook tasks configured                        | Tasks are restored and re-registered without losing metadata               | `recovery`    | `covered` | `tests/server/recovery-restart.test.ts`                           |

## Notes

- `tests/server/automation-e2e.test.ts` covers heartbeat procedure and webhook triggers, cron lifecycle, immediate cron runs, isolated retry attempts, and persisted run metadata.
- `tests/server/webhook-endpoints.test.ts` covers both direct `/webhook/agent` streaming and routed `/webhook/tasks/:slug` execution with auth, framed payloads, truncation, and durable metadata updates.
- `tests/server/recovery-restart.test.ts` covers cron and webhook task restoration across a server restart using the same runtime home.
