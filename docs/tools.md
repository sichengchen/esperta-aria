# Built-in Tools

SA currently exposes nine runtime tools to the agent.

| Tool | Purpose |
|---|---|
| `read` | Read file contents |
| `write` | Create/overwrite files |
| `edit` | Exact single-occurrence string replacement |
| `bash` | Execute shell commands |
| `clawhub_search` | Search ClawHub skills |
| `remember` | Save memory entry by key |
| `read_skill` | Load + activate a skill by name |
| `clawhub_install` | Install a skill from ClawHub |
| `clawhub_update` | Update one/all installed ClawHub skills |

## `read`

Read file contents as text.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `file_path` | string | Yes | Absolute file path |
| `offset` | number | No | Start line (1-based, default `1`) |
| `limit` | number | No | Max lines to return |

## `write`

Write full content to a file (creates parent directories, overwrites existing file).

| Parameter | Type | Required | Description |
|---|---|---|---|
| `file_path` | string | Yes | Absolute file path |
| `content` | string | Yes | Full file content |

## `edit`

Exact string replacement. `old_string` must appear exactly once.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `file_path` | string | Yes | Absolute file path |
| `old_string` | string | Yes | Exact string to replace |
| `new_string` | string | Yes | Replacement string |

## `bash`

Run shell command (`sh -c`). Returns stdout/stderr and marks non-zero exits as errors.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `command` | string | Yes | Shell command |
| `cwd` | string | No | Working directory |
| `timeout` | number | No | Timeout in ms (default `30000`) |

## `clawhub_search`

Search ClawHub (`clawhub.ai`) for skills.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | Yes | Search query |

## `remember`

Save a memory topic entry under the configured memory directory.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `key` | string | Yes | Memory key (sanitized to filename-safe form) |
| `content` | string | Yes | Content to save |

## `read_skill`

Load and activate a skill from the discovered skill list.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Skill name from `<available_skills>` |

## `clawhub_install`

Install a skill by ClawHub slug.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `slug` | string | Yes | Skill slug (example: `steipete/apple-notes`) |
| `version` | string | No | Specific version (defaults to latest) |

## `clawhub_update`

Update installed ClawHub skills.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `slug` | string | No | Skill slug to update; omit to check all installed skills |
