# Architecture

This folder defines the canonical architecture for Esperta Aria.

It is the architecture the repo should keep aligned to:

- `Aria Node` hosts `Aria Agent`
- `Aria Agent` is the only user-facing agent and owns Aria-managed memory, context, IM connectors, automation, and coding execution on its node
- `Aria Agent` can manage and execute projects through a dedicated project control layer
- `Aria Desktop` is a multi-surface client for:
  - `Projects` with attached local and remote environments
  - `Chat` without an attached working directory
- `Aria Mobile` is a thin client for node-hosted chat and remote project work
- `Aria Gateway` is the built-in secure entrypoint, while LAN/VPN/tunnel reachability stays outside Aria's product boundary

## Document Groups

- [core/README.md](./core/README.md)
- [runtime/README.md](./runtime/README.md)
- [surfaces/README.md](./surfaces/README.md)

## Canonical Names

| Surface                  | Canonical Name |
| ------------------------ | -------------- |
| Product                  | `Esperta Aria` |
| Node host                | `Aria Node`    |
| Server product           | `Aria Server`  |
| Personal assistant       | `Aria Agent`   |
| Desktop client           | `Aria Desktop` |
| Mobile client            | `Aria Mobile`  |
| Secure access layer      | `Aria Gateway` |
| Server-local terminal UI | `Aria Console` |
| CLI binary               | `aria`         |

## Core Boundary

`Aria Agent` runs on Aria nodes.

That implies:

- IM connectors are node-hosted
- Aria-managed memory and context are node-owned
- heartbeat, cron, and webhook automation are node-hosted
- the node-local terminal UI chats only with `Aria Agent`
- `Chat` threads do not carry an attached working directory
- `Projects` threads carry explicit workspace and environment identity

## Reader Guide

- Start with [core/README.md](./core/README.md) for the system map, deployment model, and durable object model
- Read [runtime/README.md](./runtime/README.md) for runtime execution, prompt assembly, tool runtime, automation, protocol, and handoff contracts
- Read [surfaces/README.md](./surfaces/README.md) for the server, gateway, desktop, and mobile ownership model
