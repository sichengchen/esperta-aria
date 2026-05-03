# Workflow: Remote Project Thread

Primary spec:

- [../../../../architecture/surfaces/server.md](../../../../architecture/surfaces/server.md)
- [../../../../architecture/core/domain-model.md](../../../../architecture/core/domain-model.md)

| Case ID     | Workflow path                                 | Scenario                                                    | Expected result                                                  | Lane          | Status    | Target suite                                                                                                     |
| ----------- | --------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- | ------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| `PFLOW-001` | `client -> gateway -> projects control`       | Open remote project thread                                  | Active environment and thread metadata resolve correctly         | `server-e2e`  | `covered` | `tests/procedures.test.ts`, `tests/server/project-workflow-e2e.test.ts`                                          |
| `PFLOW-002` | `projects control -> remote job orchestrator` | Dispatch remote work to coding adapter                      | Job, run, session, and thread identities remain correlated       | `server-e2e`  | `covered` | `tests/server/project-workflow-e2e.test.ts`                                                                      |
| `PFLOW-003` | `remote job -> project status stream`         | Worker reports running, waiting approval, completed, failed | State transitions surface correctly to callers and persistence   | `integration` | `covered` | `tests/dispatch-runner.test.ts`, `tests/server/project-workflow-e2e.test.ts`                                     |
| `PFLOW-004` | `client -> cancel remote work`                | Cancel remote project run                                   | Cancellation is durable and reflected back into project state    | `server-e2e`  | `covered` | `tests/procedures.test.ts`, `tests/server/project-workflow-e2e.test.ts`                                          |
| `PFLOW-005` | `disconnect -> reconnect`                     | Reconnect to existing remote thread and job                 | Client sees canonical state without creating a new thread or job | `recovery`    | `covered` | `tests/procedures.test.ts`, `tests/server/recovery-restart.test.ts`, `tests/server/project-workflow-e2e.test.ts` |

## Shipping Rule

Project workflow services alone are not enough. The remote project thread must be proven at the server boundary.

Gateway procedure coverage proves server-owned open, queue, cancel, and
reconnect state. Black-box server transport coverage now proves remote thread
open, queued dispatch state, backend dispatch execution, cancel state,
reconnect state, and a WebSocket subscription smoke path. Dispatch-runner
coverage supplies the waiting-approval and failed variants, while server
transport coverage supplies running, completed, cancelled, and reconnect state.
