# Aria Node Transition Plan

This document records the proposed transition from external coding-agent
workers toward an Aria-native execution model where `Aria Agent` handles coding
work directly, `Aria Desktop` can run as a local server-capable node, and
headless deployments use the same runtime without the desktop UI.

## Target Outcome

Esperta Aria should present one visible agent and one runtime model.

- `Aria Agent` is the only user-facing agent.
- `Aria Desktop` includes a local Aria node with agent, runtime, store, gateway,
  and optional connector hosting.
- Headless Aria runs the same node capabilities without the desktop UI.
- IM connectors, Desktop, and future Mobile surfaces all communicate through the
  shared interaction protocol.
- Project work runs through Aria-native coding runs instead of exposed external
  coding-agent products.
- Users can run work on the current Mac, hand it off to another Aria node, or
  continue it remotely when the selected node is always on.

The product model should become:

```text
Aria Node
  -> Aria Runtime
  -> Aria Agent
  -> Store
  -> Policy + Approvals + Audit
  -> Tools
  -> Gateway
  -> optional IM connectors
  -> optional project job execution

Aria Desktop = Aria Node + desktop UI
Headless Aria = Aria Node without desktop UI
Aria Mobile = thin client over an Aria Node
```

## Product Decisions

### 1. Remove External Coding Agents As A Product Concept

External coding agents should no longer be a visible product surface.

Current user-facing ideas such as separate local or remote coding workers
should be replaced by:

- `Run with Aria`
- `Run on This Mac`
- `Run on <server name>`
- `Hand off to <server name>`

The implementation may retain backend abstraction internally, but the product
should not ask users to pick a separate coding agent as the primary worker.

### 2. Expand Aria Agent Into Coding Execution

`Aria Agent` should handle coding tasks by using Aria Runtime toolsets:

- files
- terminal
- git and worktree operations
- project search and indexing
- patch application
- test and build execution
- browser and app inspection later
- MCP tools when policy allows

An Aria coding run is a normal runtime execution with durable run identity,
policy checks, approvals, audit records, resumable events, and project
environment metadata.

### 3. Make Desktop A Local Aria Node

`Aria Desktop` should not be a special local-only execution plane. It should
start or connect to a local Aria node and use the same gateway protocol used for
remote nodes.

Desktop should include:

- desktop UI shell
- embedded local node supervisor
- local `Aria Runtime`
- local `Aria Agent`
- local gateway, loopback-first by default
- local store under `~/.aria/` or `ARIA_HOME`
- local project/workspace execution
- optional IM connector hosting

The Desktop UI should treat `This Mac` as one node target alongside remote
servers.

### 4. Keep Headless Aria As The Always-On Server Form

Headless Aria should be the same node composition without the desktop shell.

It is better suited for:

- always-on IM connectors
- remote jobs
- automation
- mobile continuation
- remote approvals and artifact review

### 5. Keep Mobile Thin

Aria Mobile should never host `Aria Agent`, connectors, or coding execution.

Mobile should support:

- viewing threads and jobs
- continuing server-hosted conversations
- answering questions
- approving or rejecting actions
- inspecting job state, diffs, summaries, and artifacts
- redirecting or handing off work later

## Architecture Changes

### New Core Term: Aria Node

Add `Aria Node` as the deployable host boundary.

| Node mode     | UI  | Agent | Gateway | IM connectors | Project execution       |
| ------------- | --- | ----- | ------- | ------------- | ----------------------- |
| Desktop node  | yes | yes   | yes     | optional      | local now, remote later |
| Headless node | no  | yes   | yes     | yes           | yes                     |
| Mobile client | yes | no    | no      | no            | no                      |

This replaces the current hard rule that `Aria Agent` only runs on
`Aria Server`. The revised rule should be:

```text
Aria Agent runs on Aria Nodes.
Clients attach to Aria Nodes.
Mobile is always a client.
```

### Project Thread Execution

Replace the old split:

```text
local_project -> desktop-local worker
remote_project -> remote worker
```

with:

```text
project_thread -> Aria coding run on selected Aria node
```

Runs should record:

- `nodeId`
- `workspaceId`
- `projectId`
- `environmentId`
- `threadId`
- `sessionId`
- `runId`
- `jobId`, when long-running
- `actorId`
- execution policy and approval state

### Handoff Model

Handoff should be explicit, durable, and auditable.

A handoff changes a project thread's active environment from one node to
another. It should record:

- source node and environment
- target node and environment
- actor
- reason
- timestamp
- transfer mechanism
- resulting thread/environment binding

Preferred transfer mechanisms:

1. Git branch pushed to a shared remote.
2. Patch bundle.
3. Workspace archive.
4. Direct filesystem sync later, only with explicit policy.

If the selected node is already `This Mac`, no handoff is needed.

## Implementation Phases

### Phase 1: Document The Pivot

Update the canonical architecture docs to introduce `Aria Node` and remove the
server-only agent rule.

Primary files:

- `docs/architecture/core/overview.md`
- `docs/architecture/core/deployment.md`
- `docs/architecture/core/domain-model.md`
- `docs/architecture/core/packages.md`
- `docs/architecture/surfaces/server.md`
- `docs/architecture/surfaces/desktop-and-mobile.md`
- `docs/architecture/runtime/runtime.md`
- `docs/architecture/runtime/tool-runtime.md`

Acceptance criteria:

- docs define Desktop node, headless node, and mobile client
- docs describe Aria-native coding runs
- docs no longer present external coding agents as the target execution model
- existing external-agent docs are marked legacy or transitional

### Phase 2: Extract Reusable Node Bootstrap

Factor server composition so both `apps/aria-server` and `apps/aria-desktop`
can start the same Aria node stack.

Likely areas:

- `packages/server`
- `apps/aria-server`
- `apps/aria-desktop`
- `packages/access-client`
- `packages/gateway`

Acceptance criteria:

- headless server still starts normally
- desktop can start or attach to a local node
- desktop talks to the local node through gateway/client contracts
- local node state uses `~/.aria/` or `ARIA_HOME`

### Phase 3: Route Desktop Aria Through The Local Node

Make Desktop's default Aria space use the embedded local node.

Acceptance criteria:

- Desktop can create or resume Aria threads on `This Mac`
- runtime events stream through the shared protocol
- approvals and questions use normal runtime state
- Desktop can also connect to a remote node without changing UI concepts

### Phase 4: Build Aria-Native Coding Runs

Implement project coding execution as Aria Runtime runs driven by `Aria Agent`
and toolsets, not external coding-agent subprocesses.

Likely areas:

- `packages/agent`
- `packages/runtime`
- `packages/tools`
- `packages/work`
- `packages/jobs`
- `packages/workspaces`
- `packages/policy`
- `packages/audit`

Acceptance criteria:

- Aria can inspect, edit, test, and summarize a local project
- file, shell, git, and patch operations are policy-governed
- runs are persisted with project, environment, node, and audit identity
- project thread UI can show job/run state without knowing about backend agents

### Phase 5: Remove External Coding-Agent Adapters

Remove external coding-agent adapters from runtime, jobs, tools, docs, and
default skill assets.

Acceptance criteria:

- no default prompt path recommends delegating coding work to external agents
- tool descriptions no longer present external agents as normal coding flow
- runtime bundled skills do not expose coding-agent delegation
- `packages/jobs` no longer depends on external coding-agent adapters

### Phase 6: Ship IM Connectors On Desktop And Headless Nodes

Make IM connectors node-hosted surfaces over the same runtime and agent.

Acceptance criteria:

- headless Aria can run configured IM connectors
- Desktop can enable connector hosting for the local node
- connector threads route into `Aria Agent`
- connector credentials live in the node secrets store
- connector runs produce normal thread, run, approval, and audit records

### Phase 7: Add Handoff MVP

Allow a project thread to move from one node to another.

Acceptance criteria:

- Desktop can hand off a project thread to a remote node
- Git branch handoff works first
- patch bundle handoff works when a branch remote is unavailable
- handoff creates a durable binding-change event
- target node can continue the same thread identity
- source node retains readable history

### Phase 8: Add Durable Remote Jobs

Promote long-running project execution on headless nodes.

Acceptance criteria:

- remote jobs survive client disconnect
- jobs can be cancelled
- jobs can stream logs and status after reconnect
- approvals can be answered from Desktop, IM, or future Mobile
- artifacts, summaries, and diffs are durable

### Phase 9: Remove Legacy External-Agent Product Surface

After Aria-native coding runs and remote jobs are stable, remove the legacy
product surface.

Acceptance criteria:

- UX no longer references external coding agents
- canonical docs no longer describe external coding agents as target-state
  components
- reference docs either remove or archive `coding-agents`
- package dependencies on external coding-agent adapters are gone from runtime
  execution paths

## Package Direction

The likely end state is:

| Package               | Direction                                               |
| --------------------- | ------------------------------------------------------- |
| `@aria/server`        | reusable Aria node composition root                     |
| `@aria/agent`         | assistant and coding execution logic                    |
| `@aria/runtime`       | durable run, policy, approval, and orchestration kernel |
| `@aria/tools`         | native toolsets for coding and system interaction       |
| `@aria/work`          | project thread and environment routing                  |
| `@aria/jobs`          | durable Aria-native project job lifecycle               |
| `@aria/workspaces`    | repo, worktree, sandbox, and environment mechanics      |
| `@aria/connectors`    | node-hosted IM surfaces                                 |
| `@aria/access-client` | shared client protocol for Desktop and Mobile           |

## Risks

- Desktop node supervision must avoid duplicating server behavior in a second
  path.
- Local node connector hosting must make Mac sleep/offline behavior explicit.
- Handoff must not silently transfer secrets, local files, or uncommitted work
  without policy and user approval.
- Aria-native coding runs need enough tool capability to replace external
  worker subprocesses without reducing effectiveness.
- Remote jobs need durable logs, cancellation, and recovery before they are
  exposed through Mobile.
- Docs and generated embedded skill copies must be kept in sync when the
  canonical architecture changes.

## Suggested First Pull Requests

1. Architecture pivot docs: introduce `Aria Node` and mark external coding
   agents transitional.
2. Node bootstrap extraction: make server composition reusable by Desktop.
3. Desktop local node MVP: Desktop starts and connects to `This Mac`.
4. Aria coding run MVP: one local project thread can execute through Aria tools.
5. Connector hosting MVP: Desktop and headless nodes share connector runtime.
6. Handoff MVP: Git branch handoff between `This Mac` and one remote node.
