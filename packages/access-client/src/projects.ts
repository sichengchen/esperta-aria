import type { ProjectRecord, ThreadRecord, ThreadStatus } from "@aria/projects";

export type {
  ProjectRecord,
  TaskRecord,
  TaskStatus,
  ThreadRecord,
  ThreadStatus,
} from "@aria/projects";

export interface ClientProjectThreadSummary {
  projectId: string;
  projectName: string;
  threadId: string;
  threadTitle: string;
  threadStatus: ThreadStatus;
}

export function buildClientProjectThreadSummary(
  project: Pick<ProjectRecord, "projectId" | "name">,
  thread: Pick<ThreadRecord, "threadId" | "title" | "status">,
): ClientProjectThreadSummary {
  return {
    projectId: project.projectId,
    projectName: project.name,
    threadId: thread.threadId,
    threadTitle: thread.title,
    threadStatus: thread.status,
  };
}
