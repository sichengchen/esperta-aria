# Connectors

Spec sources:

- [../../../../architecture/surfaces/server.md](../../../../architecture/surfaces/server.md)
- [../../../../architecture/core/overview.md](../../../../architecture/core/overview.md)
- [../../../../architecture/runtime/interaction-protocol.md](../../../../architecture/runtime/interaction-protocol.md)

| Case ID   | Feature path                       | Scenario                                                            | Expected result                                                                    | Lane          | Status    | Target suite                                                                               |
| --------- | ---------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------- | --------- | ------------------------------------------------------------------------------------------ |
| `CON-001` | `connectors.session-scope`         | Connector token creates and accesses only its own sessions          | Cross-connector access is rejected                                                 | `workflow`    | `covered` | `tests/procedures.test.ts`                                                                 |
| `CON-002` | `connectors.inbound-normalization` | Inbound IM message becomes connector-owned Aria thread input        | Session prefix, connector type, and ownership are preserved                        | `server-e2e`  | `covered` | `tests/server/connector-flow.test.ts`                                                      |
| `CON-003` | `connectors.output-filtering`      | Same Aria run is viewed through IM surface                          | IM surface receives filtered or reformatted events without semantic drift          | `workflow`    | `covered` | `tests/chat-sdk-adapter.test.ts`, `tests/server/connector-flow.test.ts`                    |
| `CON-004` | `connectors.approval-reply`        | Connector replies to pending approval through short command path    | Approval is resolved against the correct tool call and session                     | `workflow`    | `covered` | `tests/chat-sdk-adapter.test.ts`, `tests/server/connector-flow.test.ts`                    |
| `CON-005` | `connectors.question-reply`        | Connector answers pending question with numbered or free-text reply | Correct answer is bound to the right pending question and session                  | `workflow`    | `covered` | `tests/chat-sdk-adapter.test.ts`, `tests/server/connector-flow.test.ts`                    |
| `CON-006` | `connectors.chunking-formatting`   | Connector formats long streamed output and tool results             | Output stays within platform limits and remains readable                           | `integration` | `covered` | `tests/chat-sdk-adapter.test.ts`, `tests/telegram.test.ts`, `tests/stream-handler.test.ts` |
| `CON-007` | `connectors.delivery`              | Automation or notify tool delivers to connector target              | Delivery reaches target connector and reports delivery status back to server state | `workflow`    | `covered` | `tests/server/connector-flow.test.ts`                                                      |
| `CON-008` | `connectors.boundary-rule`         | IM connector attempts to bind to local project thread               | Binding is rejected because connectors are server-owned Aria flows only            | `contract`    | `covered` | `tests/server/connector-flow.test.ts`                                                      |

## Notes

- Adapter-level tests cover command handling.
- Black-box server coverage now proves Chat SDK ingress through the gateway,
  connector-owned session normalization, cross-connector session isolation, and
  filtered streamed output for an IM surface.
- Black-box server coverage also proves connector text replies resolve pending
  approvals and questions through the owning gateway session boundary.
- Adapter-level stream coverage proves long connector responses are chunked
  within platform limits without truncating final output.
- The same server coverage proves IM connector tokens cannot enter project
  control or project working-directory binding paths.
- Connector delivery is covered through the automation delivery path with a
  fake connector notify tool and durable delivery status assertion.
