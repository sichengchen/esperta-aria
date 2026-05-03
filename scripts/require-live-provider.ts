#!/usr/bin/env bun

export const LIVE_PROVIDER_KEYS = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_AI_API_KEY",
  "MINIMAX_API_KEY",
] as const;

type LiveProviderKey = (typeof LIVE_PROVIDER_KEYS)[number];
type EnvMap = Record<string, string | undefined>;

export interface LiveProviderValidation {
  ok: boolean;
  available: LiveProviderKey[];
  message: string;
}

export function validateLiveProviderEnv(env: EnvMap = process.env): LiveProviderValidation {
  const available = LIVE_PROVIDER_KEYS.filter((key) => Boolean(env[key]?.trim()));

  if (available.length === 0) {
    return {
      ok: false,
      available,
      message: [
        "Live test provider is not configured.",
        "Set one of ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_AI_API_KEY, or MINIMAX_API_KEY before running bun run test:live.",
        "Optional selectors: ARIA_LIVE_PROVIDER and ARIA_LIVE_MODEL.",
      ].join("\n"),
    };
  }

  const selected = env.ARIA_LIVE_PROVIDER?.trim();
  if (selected) {
    const providerToKey: Record<string, LiveProviderKey> = {
      anthropic: "ANTHROPIC_API_KEY",
      openai: "OPENAI_API_KEY",
      google: "GOOGLE_AI_API_KEY",
      minimax: "MINIMAX_API_KEY",
    };
    const requiredKey = providerToKey[selected];
    if (!requiredKey) {
      return {
        ok: false,
        available,
        message: `Unsupported ARIA_LIVE_PROVIDER=${selected}. Expected anthropic, openai, google, or minimax.`,
      };
    }
    if (!env[requiredKey]?.trim()) {
      return {
        ok: false,
        available,
        message: `ARIA_LIVE_PROVIDER=${selected} requires ${requiredKey} to be set.`,
      };
    }
  }

  return {
    ok: true,
    available,
    message: `Live test provider configured via ${available.join(", ")}.`,
  };
}

if (import.meta.main) {
  const result = validateLiveProviderEnv();

  if (!result.ok) {
    console.error(result.message);
    process.exit(1);
  }

  console.log(result.message);
}
