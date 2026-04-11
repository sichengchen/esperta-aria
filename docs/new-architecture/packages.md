# Package And Naming Model

This page defines the proposed package names, top-level repo layout, and naming rules for the new architecture.

## Naming Rules

### Public product names

- `Aria Server`
- `Aria Agent`
- `Aria Desktop`
- `Aria Mobile`
- `Aria Relay`
- `Aria Console`

### Internal package scope

Use `@aria/*`.

### Reserved terms

| Term | Use it for | Do not use it for |
| --- | --- | --- |
| `agent` | LLM-based assistants or coding-agent adapters | generic services or daemons |
| `runtime` | the shared runtime kernel | the deployed server product |
| `server` | the deployable server app | the runtime kernel |
| `relay` | secure access and hosted-runtime layer | direct assistant behavior |
| `connector` | IM/chat integrations | generic client integrations |
| `bridge` | desktop-local execution integration | server-side services |
| `workspace` | execution boundary | a casual synonym for repo or folder |

### Renames from older language

| Older term | New term |
| --- | --- |
| `engine` | `runtime` |
| `TUI connector` | `Aria Console` |
| generic `connectors` | `IM connectors` when referring to Slack/Telegram/etc. |
| top-level `session` UX | `thread` |

## Proposed Repo Layout

```text
apps/
  aria-server/
  aria-desktop/
  aria-mobile/

packages/
  runtime/
  protocol/
  gateway/
  projects/
  prompt/
  tools/
  policy/
  memory/
  automation/
  store/
  audit/
  workspaces/
  jobs/
  agent-aria/
  agents-coding/
  connectors-im/
  console/
  access-client/
  desktop-bridge/
  desktop-git/
  ui/

services/
  aria-relay/
```

## Package Ownership

| Package | Responsibility |
| --- | --- |
| `@aria/server` | Server app bootstrap, composition root, deployment runtime for `Aria Server` |
| `@aria/desktop` | Desktop app shell, navigation, thread views, project surfaces |
| `@aria/mobile` | Mobile app shell and mobile-specific UI |
| `@aria/runtime` | Shared runtime kernel for threads, runs, policy, and orchestration |
| `@aria/protocol` | Shared request, event, identity, and streaming contracts |
| `@aria/gateway` | Authenticated API surface and realtime transport handling |
| `@aria/projects` | Project registry, project-thread coordination, environment switching, and Aria-to-worker orchestration control |
| `@aria/prompt` | Prompt assembly pipeline and context overlays |
| `@aria/tools` | Tool runtime, built-in tool definitions, execution adapters |
| `@aria/policy` | Capability policy, approvals, execution restrictions, trust rules |
| `@aria/memory` | Aria memory layers, skills, context retrieval, assistant knowledge |
| `@aria/automation` | Heartbeat, cron, webhook, automation scheduling and execution |
| `@aria/store` | Durable database access, repositories, migrations, persistence services |
| `@aria/audit` | Audit event models, sinks, queries, policy logging hooks |
| `@aria/workspaces` | Workspace, project, environment, repo, worktree, sandbox models |
| `@aria/jobs` | Remote job orchestration and lifecycle management |
| `@aria/agent-aria` | The server-hosted Aria assistant agent implementation |
| `@aria/agents-coding` | Codex, Claude Code, OpenCode adapters and shared coding-agent contracts |
| `@aria/connectors-im` | Slack/Telegram/Discord/Teams style connector integrations |
| `@aria/console` | Server-local terminal UI for chatting with `Aria Agent` |
| `@aria/access-client` | Shared client transport for desktop and mobile |
| `@aria/desktop-bridge` | Local desktop execution bridge for local project mode |
| `@aria/desktop-git` | Local git and worktree integration helpers |
| `@aria/ui` | Shared UI primitives and cross-app presentation components |
| `@aria/relay` | Secure access broker and optional hosted runtime service |

## Dependency Direction

The package graph should stay layered.

### Lowest-level shared foundations

- `@aria/protocol`
- `@aria/store`
- `@aria/audit`

### Core execution layers

- `@aria/runtime`
- `@aria/prompt`
- `@aria/tools`
- `@aria/policy`
- `@aria/projects`
- `@aria/workspaces`
- `@aria/jobs`

### Assistant and integration layers

- `@aria/agent-aria`
- `@aria/automation`
- `@aria/connectors-im`

### Product shells

- `@aria/server`
- `@aria/desktop`
- `@aria/mobile`
- `@aria/console`
- `@aria/relay`

### Desktop-only local layers

- `@aria/desktop-bridge`
- `@aria/desktop-git`

## Package Boundaries That Matter

### `@aria/agent-aria`

This package should contain only the Aria assistant implementation and Aria-specific assistant logic. It should not become a general server runtime package.

### `@aria/jobs`

This package should not absorb Aria memory, automation, or connector ownership. It is for remote project execution.

### `@aria/projects`

This package is where Aria-managed project coordination should live. It should own:

- project registry models
- project-thread metadata
- environment-switch coordination
- dispatch to local or remote execution targets

It should not absorb low-level repo/worktree mechanics from `@aria/workspaces`, and it should not absorb worker execution from `@aria/jobs`.

### `@aria/connectors-im`

This package should be server-only. Do not make it a generic desktop plugin host.

### `@aria/desktop-bridge`

This package should be desktop-only. It should not be reused for server-hosted remote jobs.

## Recommended App Packaging

| App / service | Depends on |
| --- | --- |
| `aria-server` | runtime, gateway, projects, agent-aria, memory, automation, connectors-im, jobs, workspaces, store, audit, prompt, tools, policy |
| `aria-desktop` | access-client, projects, desktop-bridge, agents-coding, ui, protocol |
| `aria-mobile` | access-client, ui, protocol |
| `aria-relay` | protocol, gateway-compatible contracts, relay-specific transport/auth logic |
| `aria` console | console, access-client or a server-local transport shim, protocol |

## Directory Naming Guidance

Prefer short, stable names:

- `agent-aria`, not `personal-assistant-agent`
- `agents-coding`, not `coding-agent-runtime-service`
- `connectors-im`, not `chat-adapters-runtime`
- `desktop-bridge`, not `local-environment-integration-layer`

## Package Model Summary

The key design rule is this:

- `Aria Server` packages own the assistant platform
- `Aria Desktop` packages own local developer tooling and client UX
- `Aria Relay` packages own secure transport and access

That separation should stay visible in the repo layout.
