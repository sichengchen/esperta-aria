import {
  buildAccessClientConfig,
  type AccessClientTarget,
} from "@aria/access-client";
import {
  createProjectThreadListItem,
  type ProjectThreadListItem,
} from "@aria/ui";
import {
  describeThreadType,
  resolveThreadType,
  type ProjectRecord,
  type ThreadRecord,
  type ThreadType,
} from "@aria/projects";

export const ariaMobileApp = {
  id: "aria-mobile",
  displayName: "Aria Mobile",
  surface: "mobile",
  sharedPackages: [
    "@aria/access-client",
    "@aria/ui",
    "@aria/projects",
    "@aria/protocol",
  ],
  capabilities: ["server-access", "project-threads", "remote-review"],
} as const;

export const ariaMobileTabs = [
  { id: "aria", label: "Aria" },
  { id: "projects", label: "Projects" },
] as const;

export const ariaMobileDetailPresentations = [
  "bottom-sheet",
  "push-screen",
  "segmented-detail-view",
] as const;

export const ariaMobileActionSections = [
  { id: "approvals", label: "Approvals" },
  { id: "automation", label: "Automations" },
  { id: "remote-review", label: "Remote Review" },
  { id: "job-status", label: "Job Status" },
] as const;

export type AriaMobileTab = (typeof ariaMobileTabs)[number];
export type AriaMobileDetailPresentation = (typeof ariaMobileDetailPresentations)[number];
export type AriaMobileActionSection = (typeof ariaMobileActionSections)[number];

export interface AriaMobileProjectThreads {
  projectLabel: string;
  threads: ProjectThreadListItem[];
}

export interface AriaMobileBootstrap {
  app: typeof ariaMobileApp;
  access: ReturnType<typeof buildAccessClientConfig>;
  initialThread?: ProjectThreadListItem;
}

export interface AriaMobileThreadContext {
  threadId: string;
  threadType: ThreadType;
  threadTypeLabel: string;
  remoteStatusLabel?: string;
  sections: typeof ariaMobileActionSections;
}

export interface AriaMobileShellProjectInput {
  project: Pick<ProjectRecord, "name">;
  threads: Array<Pick<ThreadRecord, "threadId" | "title" | "status" | "threadType" | "environmentId" | "agentId">>;
}

export interface AriaMobileShellInitialThread {
  project: Pick<ProjectRecord, "name">;
  thread: Pick<ThreadRecord, "threadId" | "title" | "status" | "threadType" | "environmentId" | "agentId">;
}

export interface CreateAriaMobileShellOptions {
  target: AccessClientTarget;
  projects?: AriaMobileShellProjectInput[];
  initialThread?: AriaMobileShellInitialThread;
  activeThreadContext?: {
    thread: Pick<ThreadRecord, "threadId" | "threadType">;
    remoteStatusLabel?: string;
  };
}

export interface AriaMobileShell {
  app: typeof ariaMobileApp;
  tabs: typeof ariaMobileTabs;
  detailPresentations: typeof ariaMobileDetailPresentations;
  actionSections: typeof ariaMobileActionSections;
  access: ReturnType<typeof buildAccessClientConfig>;
  projectThreads: AriaMobileProjectThreads[];
  initialThread?: ProjectThreadListItem;
  activeThreadContext?: AriaMobileThreadContext;
}

export function createAriaMobileProjectThreads(
  projects: Array<{
    project: Pick<ProjectRecord, "name">;
    threads: Array<Pick<ThreadRecord, "threadId" | "title" | "status" | "threadType" | "environmentId" | "agentId">>;
  }>,
): AriaMobileProjectThreads[] {
  return projects.map(({ project, threads }) => ({
    projectLabel: project.name,
    threads: threads.map((thread) => createProjectThreadListItem(project, thread)),
  }));
}

export function createAriaMobileThreadContext(input: {
  thread: Pick<ThreadRecord, "threadId" | "threadType">;
  remoteStatusLabel?: string;
}): AriaMobileThreadContext {
  const threadType = resolveThreadType(input.thread);
  return {
    threadId: input.thread.threadId,
    threadType,
    threadTypeLabel: describeThreadType(threadType),
    remoteStatusLabel: input.remoteStatusLabel,
    sections: ariaMobileActionSections,
  };
}

export function createAriaMobileBootstrap(
  target: AccessClientTarget,
  initialThread?: {
    project: Pick<ProjectRecord, "name">;
    thread: Pick<ThreadRecord, "threadId" | "title" | "status" | "threadType" | "environmentId" | "agentId">;
  },
): AriaMobileBootstrap {
  return {
    app: ariaMobileApp,
    access: buildAccessClientConfig(target),
    initialThread: initialThread
      ? createProjectThreadListItem(initialThread.project, initialThread.thread)
      : undefined,
  };
}

export function createAriaMobileShell(
  options: CreateAriaMobileShellOptions,
): AriaMobileShell {
  const bootstrap = createAriaMobileBootstrap(options.target, options.initialThread);

  return {
    app: bootstrap.app,
    tabs: ariaMobileTabs,
    detailPresentations: ariaMobileDetailPresentations,
    actionSections: ariaMobileActionSections,
    access: bootstrap.access,
    projectThreads: createAriaMobileProjectThreads(options.projects ?? []),
    initialThread: bootstrap.initialThread,
    activeThreadContext: options.activeThreadContext
      ? createAriaMobileThreadContext(options.activeThreadContext)
      : undefined,
  };
}
