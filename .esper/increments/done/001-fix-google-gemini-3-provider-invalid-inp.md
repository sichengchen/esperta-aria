---
id: 1
title: Fix Google Gemini 3 provider Invalid Input error
status: done
type: fix
lane: atomic
priority: 1
created: 2026-03-01
spec: specs/overview.md
finished_at: 2026-03-01
---
# Fix Google Gemini 3 provider Invalid Input error

## Context

SA uses pi-ai (`@mariozechner/pi-ai`) for model routing, which delegates to the `@google/genai` SDK for Google models. When using Gemini 3 models (`gemini-3-flash-preview`), the Google API returns a 400 "Invalid Input" error: **"Function call is missing a thought_signature in functionCall parts."**

Gemini 3 models require `thoughtSignature` on all `functionCall` parts in the conversation history. This is a hard API requirement — replaying a `functionCall` without a valid `thoughtSignature` is a 400 error.

**Root cause**: SA's `ModelRouter.getStreamOptions()` only returns `{ temperature, maxTokens, apiKey }`. It does NOT pass `thinking` configuration to pi-ai. While pi-ai's `streamGoogle` handles the basic flow correctly (the model generates signatures even without explicit config), there are edge cases where signatures may be missing or invalid, and SA has no defensive handling:

1. **No thinking config passed**: pi-ai's `buildParams()` only sets `thinkingConfig` when `options.thinking?.enabled` is true. Without it, the model still thinks (Gemini 3 thinks by default), but the behavior is less deterministic.

2. **No retry on provider errors**: SA's `Agent.chat()` immediately stops on any error event (line 273-279 in agent.ts). A transient or fixable error from Google kills the entire turn.

3. **No error diagnostics**: When the error occurs, there's no logging of the request payload or conversation state, making it impossible to debug in production.

## Scope

### 1. Enable thinking for Gemini 3 models in stream options

Modify `ModelRouter.getStreamOptions()` to detect Gemini 3 models and include `thinking: { enabled: true }` in the returned options. This ensures pi-ai explicitly enables `thinkingConfig` in the Google API request, which makes thought signature generation reliable and consistent.

### 2. Add provider-aware retry logic in the Agent

When the agent receives an `error` event from the stream, check if the error is retryable (e.g., 429 rate limit, 500/503 server error) and retry with exponential backoff. For 400 "Invalid Input" errors specifically related to thought signatures, sanitize the message history (convert affected function calls to text) and retry once.

### 3. Add error logging for Google provider failures

When a stream error occurs, log the error details (model, provider, error message, message count, tool count) to help diagnose future issues. This does NOT log the full payload (which could contain sensitive data) but logs enough metadata to identify the failure pattern.

## Files Affected

- `src/engine/router/router.ts` (modify — add thinking config to `getStreamOptions()` for Gemini 3 models)
- `src/engine/router/types.ts` (modify — extend `StreamOptions` type if needed)
- `src/engine/agent/agent.ts` (modify — add retry logic on error events, add error logging)
- `src/engine/agent/agent.test.ts` (create — unit tests for retry behavior)

## Verification

- Run: `bun test src/engine/agent/agent.test.ts`
- Expected: Tests pass for retry logic and Gemini 3 thinking config

- Run: `bun run typecheck`
- Expected: No type errors

- Run: `bun run lint`
- Expected: No lint errors

- Manual: Start engine with Gemini 3 model, send messages that trigger tool use, verify no "Invalid Input" errors

## Spec Impact

- None — this is a bug fix in the model router and agent error handling. No spec changes needed.

## Progress
- [x] Scope 1: `getStreamOptions()` now detects Gemini 3 models and adds `thinking: { enabled: true }`
- [x] Scope 2: Agent retry logic — `isRetryableError()` detects 429/500/503/thought_signature errors, retries with exponential backoff (max 2 retries), sanitizes history on retry
- [x] Scope 3: `logStreamError()` logs model, message count, tool count, and error on each failure
- [x] Verification: typecheck clean (pre-existing telegram module issue only), lint clean, 709/709 tests pass
