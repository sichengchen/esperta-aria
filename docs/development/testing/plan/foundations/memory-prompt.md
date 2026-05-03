# Memory And Prompt

Spec sources:

- [../../../../architecture/runtime/prompt-engine.md](../../../../architecture/runtime/prompt-engine.md)
- [../../../../architecture/runtime/runtime.md](../../../../architecture/runtime/runtime.md)
- [../../../../architecture/surfaces/server.md](../../../../architecture/surfaces/server.md)

| Case ID   | Feature path                        | Scenario                                                                 | Expected result                                                              | Lane          | Status    | Target suite                                                            |
| --------- | ----------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------- | --------- | ----------------------------------------------------------------------- |
| `MEM-001` | `memory.layered-load`               | Load profile, project, operational, and journal memory                   | Correct layers are available with stable semantics                           | `integration` | `covered` | `tests/memory.test.ts`                                                  |
| `MEM-002` | `memory.search`                     | Search text and semantic memory across restart                           | Relevant records are returned with persistence intact                        | `integration` | `covered` | `tests/memory.test.ts`, `tests/memory-integration.test.ts`              |
| `MEM-003` | `prompt.base`                       | Build base prompt from identity, user, workspace docs, tools, and memory | Prompt includes the documented components in the correct precedence          | `integration` | `covered` | `packages/runtime/src/prompt-engine.test.ts`                            |
| `MEM-004` | `prompt.session`                    | Build session prompt with rolling summary and recent replay              | Summary and recent transcript are included with durable summary writes       | `integration` | `covered` | `packages/runtime/src/prompt-engine.test.ts`                            |
| `MEM-005` | `prompt.cache`                      | Rebuild base prompt on repeated access                                   | Stable prompt prefix is cached durably                                       | `integration` | `covered` | `packages/runtime/src/prompt-engine.test.ts`                            |
| `MEM-006` | `skills.refresh`                    | Skill mutation updates prompt-visible state                              | Skill add or patch invalidates stale prompt state and refreshes prompt build | `workflow`    | `covered` | `tests/server/memory-prompt-e2e.test.ts`                                |
| `MEM-007` | `memory.isolation.project-boundary` | Remote project worker flow runs without implicit Aria memory inheritance | Project workers do not silently gain Aria memory or automation context       | `workflow`    | `covered` | `tests/procedures.test.ts`, `tests/server/project-workflow-e2e.test.ts` |
| `MEM-008` | `context.file-precedence`           | `.aria.md`, `AGENTS.md`, `CLAUDE.md` coexist in workspace                | Prompt engine respects documented precedence and metadata capture            | `integration` | `covered` | `tests/server/memory-prompt-e2e.test.ts`                                |

## Notes

- Memory and prompt internals are comparatively strong.
- `tests/server/memory-prompt-e2e.test.ts` covers real server runtime prompt
  assembly for context-file precedence and verifies `skill_manage` mutations
  refresh prompt-visible skill catalog and attached skill content.
- Project execution now suppresses automatic Aria memory-context injection when
  it enters the worker path; project workflow coverage asserts that Aria
  orchestration memory is not inherited by the worker dispatch prompt.
