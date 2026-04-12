import type { ProjectRecord, TaskStatus, ThreadRecord, ThreadStatus } from "@aria/projects";

export type {
  ProjectRecord,
  TaskRecord,
  TaskStatus,
  ThreadRecord,
  ThreadStatus,
} from "@aria/projects";

export interface ProjectThreadListItem {
  id: string;
  title: string;
  projectLabel: string;
  status: string;
}

function formatStatusLabel(status: TaskStatus | ThreadStatus): string {
  return status
    .split(/[-_]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function createProjectThreadListItem(
  project: Pick<ProjectRecord, "name">,
  thread: Pick<ThreadRecord, "threadId" | "title" | "status">,
): ProjectThreadListItem {
  return {
    id: thread.threadId,
    title: thread.title,
    projectLabel: project.name,
    status: formatStatusLabel(thread.status),
  };
}

export function createStatusBadgeLabel(status: TaskStatus | ThreadStatus): string {
  return formatStatusLabel(status);
}
