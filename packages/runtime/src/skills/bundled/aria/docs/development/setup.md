# Setup

## Prerequisites

- [Bun](https://bun.sh)
- Git
- provider API keys for any live-model testing

## Install

```bash
git clone <repo-url> aria
cd aria
bun install
```

## Local Run

```bash
bun run dev:server
```

App-specific dev commands:

```bash
bun run dev:server
bun run dev:desktop
```

Use `ARIA_HOME=/tmp/aria-dev` when you want an isolated runtime home.

## Main Commands

```bash
vp run repo:check
vp run repo:test
vp run repo:build
bun run test:live
```

`bun run test:live` requires one of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
`GOOGLE_AI_API_KEY`, or `MINIMAX_API_KEY`. Use `ARIA_LIVE_PROVIDER` and
`ARIA_LIVE_MODEL` to select a specific provider or model when multiple keys are
available.

## Repo Shape

The repo is package-first:

- `packages/runtime`
- `packages/handoff`
- `packages/gateway`
- `packages/connectors`
- `packages/cli`

Import through the package aliases rather than deep relative paths.
