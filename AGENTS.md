# AGENTS

Use this file to bootstrap any coding agent into the current Esperta Aria workflow.

## Required Reads

1. Read `README.md` for the public product surface and operator entrypoints.
2. Read this file before making changes.
3. Read `DESIGN.md` before making any design or UI decision.
4. Read the canonical Aria docs in `docs/` that match the area you are changing.
5. Start with these platform docs unless the task is narrowly scoped elsewhere:
   - `docs/product/aria-platform.md`
   - `docs/architecture/core/overview.md`
   - `docs/architecture/runtime/runtime.md`
   - `docs/architecture/runtime/prompt-engine.md`
   - `docs/architecture/runtime/tool-runtime.md`
   - `docs/architecture/runtime/automation.md`
   - `docs/architecture/runtime/interaction-protocol.md`
   - `docs/architecture/surfaces/server.md`

## Source Of Truth

- `docs/` is the authoritative architecture and behavior tree.
- `src/` is the live implementation.
- `DESIGN.md` is the authoritative design decision log for shared UI and interaction rules.
- When docs and implementation diverge, move the code toward the Aria architecture and update the docs as part of the shipped change.

## Working Rules

- Public identity is `Esperta Aria`.
- Runtime identity is `Aria Runtime`.
- CLI identity is `aria`.
- Runtime home is `~/.aria/` or `ARIA_HOME`.
- Do not carry `SA` or `Esperta Base` forward in user-facing names, paths, logs, docs, or connector surfaces.
- Prefer durable runtime state, structured toolsets, shared interaction contracts, and policy-driven execution over legacy compatibility.
- Every design decision must be written into `DESIGN.md`.
- Agents must follow `DESIGN.md` when making design, UI, layout, spacing, typography, iconography, color, and interaction decisions.
- If a new design rule becomes clear during implementation, record it in `DESIGN.md` in the same change.

## Verification

- Run `bun run check` before closing substantial changes.
- Run `bun run test` before closing substantial changes.
- Run `bun run build` before closing substantial changes.
- If a task is docs-only or otherwise exempt, state that explicitly in the handoff.
