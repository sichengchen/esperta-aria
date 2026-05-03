# projects_control Tool

`projects_control` lets Aria manage project execution through server-owned
project state instead of collapsing orchestration into a worker runtime.

## Actions

| Action           | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `queue_dispatch` | Create a durable Aria project dispatch      |
| `queue_and_run`  | Create a dispatch and run it through `aria` |

## Inputs

| Field        | Required | Purpose                                       |
| ------------ | -------- | --------------------------------------------- |
| `projectId`  | Yes      | Project that owns the target thread           |
| `threadId`   | Yes      | Project thread to dispatch into               |
| `dispatchId` | No       | Stable caller-provided dispatch id            |
| `jobId`      | No       | Existing project job to dispatch              |
| `jobBody`    | No       | Body for a new project job                    |
| `taskId`     | No       | Task override                                 |
| `repoId`     | No       | Repository override                           |
| `worktreeId` | No       | Worktree to use for execution                 |
| `jobAuthor`  | No       | Author for a created job, defaults to `agent` |

## Boundary Rules

- The tool uses the runtime-owned Projects repository.
- Dispatch execution always requests the Aria runtime backend.
- Local project execution requires an active thread environment binding.
- Connectors still do not invoke project procedures directly; Aria owns the
  orchestration thread and returns the worker dispatch summary.
