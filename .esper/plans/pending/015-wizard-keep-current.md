---
id: 015
title: Wizard re-run — keep or change per-section prompt
status: pending
type: feature
priority: 2
phase: phase-1
branch: feature/phase-1
created: 2026-02-19
---

# Wizard Re-run — Keep or Change Per-Section Prompt

## Context

The wizard is launched both on first run (no `config.json`) and when the user passes `--setup`. On first run, starting from hardcoded defaults is correct. On re-run (`forceSetup && !isFirstRun`), the wizard today also starts from hardcoded defaults, discarding all existing configuration — the user must re-type everything even if only one thing changed.

The wizard receives only `homeDir` and `onComplete` from `index.ts` — it has no access to the existing config. The `WizardData` state is initialized from hardcoded defaults in `Wizard.tsx`.

Three steps collect user data: `Identity`, `ModelSetup`, `TelegramSetup`. Each needs a "Keep / Change" gate when re-running setup.

The desired UX: each step shows the current value(s) and offers two options:
- **[K] Keep** — accept existing values and advance immediately
- **[C] Change** — proceed to the normal input form for that section

## Approach

### 1. Load existing config in `index.ts` before the wizard launch

When `forceSetup && !isFirstRun`, instantiate `ConfigManager`, call `config.load()` and `config.loadSecrets()`, then read `models.json` using `readFile(config.getModelsPath())` to extract the first model entry. Build an `existingConfig` object and pass it to `Wizard`.

```typescript
let existingConfig: WizardExistingConfig | undefined;
if (forceSetup && !isFirstRun) {
  try {
    const config = new ConfigManager(saHome);
    const saConfig = await config.load();
    const secrets = await config.loadSecrets();
    const modelsRaw = JSON.parse(await readFile(config.getModelsPath(), "utf8"));
    const defaultModel = modelsRaw.models?.[0];
    existingConfig = {
      name: saConfig.identity.name,
      personality: saConfig.identity.personality,
      provider: defaultModel?.provider ?? "anthropic",
      model: defaultModel?.model ?? "",
      apiKeyEnvVar: defaultModel?.apiKeyEnvVar ?? "ANTHROPIC_API_KEY",
      baseUrl: defaultModel?.baseUrl,
      apiKey: secrets?.apiKeys?.[defaultModel?.apiKeyEnvVar ?? ""] ?? "",
      botToken: secrets?.botToken ?? "",
      pairingCode: secrets?.pairingCode,
    };
  } catch {
    // If loading fails, start fresh (e.g. corrupted config)
  }
}
```

Export `WizardExistingConfig` type from `src/wizard/index.ts` or define it inline in `index.ts`.

### 2. Add `existingConfig` prop to `Wizard`

```typescript
interface WizardProps {
  homeDir: string;
  onComplete: () => void;
  existingConfig?: WizardExistingConfig;
}
```

When `existingConfig` is provided, initialize `data` state from it so `handleConfirm` always has the right values (whether kept or changed):

```typescript
const [data, setData] = useState<WizardData>(
  existingConfig
    ? { ...existingConfig }
    : { name: "Sasa", personality: "...", /* hardcoded defaults */ }
);
```

Pass `currentValues` to each relevant step:
- `<Identity currentValues={existingConfig ? { name: data.name, personality: data.personality } : undefined} />`
- `<ModelSetup currentValues={existingConfig ? { provider: data.provider, model: data.model, apiKeyEnvVar: data.apiKeyEnvVar, apiKey: data.apiKey, baseUrl: data.baseUrl } : undefined} />`
- `<TelegramSetup currentValues={existingConfig ? { botToken: data.botToken, pairingCode: data.pairingCode } : undefined} />`

### 3. Add "Keep or Change" gate to `Identity.tsx`

Add `currentValues?: { name: string; personality: string }` prop.

When provided, default to a `"keep-or-change"` phase before the normal input phase:

```
Identity
──────────────────────────────────────
Current configuration:
  Name: Sasa
  Personality: Helpful, concise...

[K] Keep current  [C] Change    Esc to go back
```

- `K` → `onNext(currentValues)` immediately
- `C` → switch to normal input phase (existing `name` → `personality` → Enter flow), but start with empty fields (no pre-fill — user chose "Change")
- `Esc` → `onBack()`

### 4. Add "Keep or Change" gate to `ModelSetup.tsx`

Add `currentValues?: ModelSetupData` prop.

Same pattern — new `"keep-or-change"` phase shown first when prop is provided:

```
Model Setup
──────────────────────────────────────
Current configuration:
  Provider: anthropic
  Model: claude-sonnet-4-5-20250514
  API Key: ••••••••  (ANTHROPIC_API_KEY)

[K] Keep current  [C] Change    Esc to go back
```

- `K` → `onNext(currentValues)` immediately
- `C` → proceed to existing 4-substep flow (provider picker → credentials → fetch → model select)
- `Esc` → `onBack()`

Note: Never display the raw API key — show `••••••••` if set, or `(not set)` if empty.

### 5. Add "Keep or Change" gate to `TelegramSetup.tsx`

Add `currentValues?: { botToken: string; pairingCode?: string }` prop.

```
Telegram Bot Setup
──────────────────────────────────────
Current configuration:
  Bot token: configured
  Pairing code: A3X9KQ

[K] Keep current  [C] Change    Esc to go back
```

- `K` → `onNext(currentValues)` immediately (preserves existing token and pairing code)
- `C` → proceed to existing two-phase flow (token entry → pairing code display), which will generate a new pairing code if a token is entered
- `Esc` → `onBack()`

### 6. `WizardExistingConfig` type

Define in `src/wizard/Wizard.tsx` (or `steps/Confirm.tsx`) and re-export from `src/wizard/index.ts`. It mirrors `WizardData` closely and can simply be `WizardData` itself.

## Files to change

- `src/index.ts` (modify — load existing config/secrets when `forceSetup && !isFirstRun`, pass as `existingConfig` to Wizard)
- `src/wizard/Wizard.tsx` (modify — accept `existingConfig` prop, initialize data from it, pass `currentValues` to each step)
- `src/wizard/steps/Identity.tsx` (modify — add `currentValues` prop, add "keep-or-change" phase)
- `src/wizard/steps/ModelSetup.tsx` (modify — add `currentValues` prop, add "keep-or-change" phase)
- `src/wizard/steps/TelegramSetup.tsx` (modify — add `currentValues` prop, add "keep-or-change" phase)
- `src/wizard/index.ts` (modify — re-export `WizardExistingConfig` or `WizardData` type)

## Verification

- Run: `bun test`
- Run: `bun run lint && bun run typecheck`
- Manual:
  1. Run the wizard fresh (first run) — all steps show normal input (no K/C gate)
  2. Complete setup, then run `bun run dev --setup` — all three steps show K/C gate with current values
  3. Choose [K] on all steps → confirm screen shows correct existing values → save → no data is lost
  4. Choose [C] on Identity only → identity input form appears → change name → other steps still show K/C
  5. Choose [C] on Telegram → two-phase flow runs → new pairing code is generated

- Edge cases:
  - `--setup` on first run (no config.json) → `existingConfig` remains undefined → wizard starts fresh as before
  - Corrupted config on re-run → catch block → `existingConfig` is undefined → wizard starts fresh
  - Model has no API key in secrets → show `(not set)` in the K/C summary
  - Telegram not configured (empty botToken) → still show K/C gate with "Not configured" summary
