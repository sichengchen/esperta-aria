# Configuration

SA stores config in a local directory (default: `~/.sa/`). Override with `SA_HOME`.

## Environment variables

You can set values in your shell or a project `.env` file.

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | If using Anthropic | Provider API key |
| `OPENAI_API_KEY` | If using OpenAI | Provider API key |
| `GOOGLE_AI_API_KEY` | If using Google | Provider API key |
| `OPENROUTER_API_KEY` | If using OpenRouter | Provider API key |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram bot token (enables Telegram connector) |
| `DISCORD_TOKEN` | Optional | Discord bot token (enables Discord connector) |
| `DISCORD_GUILD_ID` | Optional | Restrict Discord bot to a guild |
| `SA_HOME` | Optional | Override config directory |
| `SA_ENGINE_PORT` | Optional | Override Engine HTTP port (default `7420`; WS uses `+1`) |

API keys are resolved as: environment variable first, then `secrets.enc`.

## Config directory layout

```text
~/.sa/
  IDENTITY.md        # agent name/personality/system prompt
  USER.md            # user profile and preferences
  config.json        # v3 config (runtime + providers + models)
  secrets.enc        # encrypted secrets payload
  .salt              # salt used for encryption key derivation
  memory/            # memory files
    MEMORY.md
    topics/
  skills/            # local + ClawHub-installed skills
  engine.url         # daemon discovery URL
  engine.pid         # daemon PID
  engine.token       # daemon auth token
  engine.log         # daemon logs
  engine.heartbeat   # heartbeat metadata from scheduler
```

## `config.json` (v3)

Single source of truth for runtime, providers, and models.

```json
{
  "version": 3,
  "runtime": {
    "activeModel": "sonnet",
    "telegramBotTokenEnvVar": "TELEGRAM_BOT_TOKEN",
    "memory": {
      "enabled": true,
      "directory": "memory"
    }
  },
  "providers": [
    {
      "id": "anthropic",
      "type": "anthropic",
      "apiKeyEnvVar": "ANTHROPIC_API_KEY"
    }
  ],
  "models": [
    {
      "name": "sonnet",
      "provider": "anthropic",
      "model": "claude-sonnet-4-5-20250514",
      "temperature": 0.7,
      "maxTokens": 8192
    }
  ],
  "defaultModel": "sonnet"
}
```

### Runtime fields

| Field | Type | Description |
|---|---|---|
| `runtime.activeModel` | string | Last active model name persisted by runtime updates |
| `runtime.telegramBotTokenEnvVar` | string | Legacy runtime field for Telegram env-var name |
| `runtime.memory.enabled` | boolean | Enable/disable memory subsystem |
| `runtime.memory.directory` | string | Memory directory path relative to `SA_HOME` |

### Provider fields (`providers[]`)

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique provider ID referenced by models |
| `type` | string | Yes | Provider type (`anthropic`, `openai`, `google`, `openrouter`, `openai-compat`, etc.) |
| `apiKeyEnvVar` | string | Yes | Env var used to resolve API key |
| `baseUrl` | string | No | Custom endpoint (commonly with `openai-compat`) |

### Model fields (`models[]`)

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Display name used by UI/API |
| `provider` | string | Yes | Provider ID (must exist in `providers[]`) |
| `model` | string | Yes | Provider model ID |
| `temperature` | number | No | Sampling temperature |
| `maxTokens` | number | No | Max output tokens |

### Top-level model selector

| Field | Type | Description |
|---|---|---|
| `defaultModel` | string | Model used as initial router model at startup |

### Migration note

Legacy setups with `models.json` are auto-migrated into `config.json` (v3). `models.json` is removed after migration.

## `IDENTITY.md`

Defines agent identity and base system prompt.

```markdown
# Agent Name

## Personality
How the agent should behave.

## System Prompt
Literal prompt text injected into every session.
```

## `USER.md`

Optional user profile loaded into the system prompt.

```markdown
# User Profile

Name: Alice
Timezone: America/Los_Angeles

Short profile text.

## Preferences

Communication style: concise
```

## `secrets.enc`

Encrypted JSON payload (AES-256-GCM). Key is derived locally from hostname + `.salt`.

```json
{
  "apiKeys": {
    "ANTHROPIC_API_KEY": "sk-ant-..."
  },
  "botToken": "123456:ABC...",
  "pairedChatId": 12345678,
  "pairingCode": "A1B2C3",
  "discordToken": "...",
  "discordGuildId": "..."
}
```

## Skills directory

User and ClawHub skills live under `~/.sa/skills/`:

```text
~/.sa/skills/
  some-skill/
    SKILL.md
  .registry.json   # ClawHub install metadata
```

Bundled skills ship in `src/engine/skills/bundled/` and are loaded alongside user skills.
