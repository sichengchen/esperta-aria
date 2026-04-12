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

export const ariaDesktopApp = {
  id: "aria-desktop",
  displayName: "Aria Desktop",
  surface: "desktop",
  sharedPackages: [
    "@aria/access-client",
    "@aria/desktop-bridge",
    "@aria/ui",
    "@aria/projects",
    "@aria/agents-coding",
    "@aria/protocol",
  ],
  capabilities: ["server-access", "project-threads", "local-bridge"],
} as const;

export const ariaDesktopSpaces = [
  { id: "aria", label: "Aria" },
  { id: "projects", label: "Projects" },
] as const;

export const ariaDesktopContextPanels = [
  { id: "review", label: "Review" },
  { id: "changes", label: "Changes" },
  { id: "environment", label: "Environment" },
  { id: "job", label: "Job State" },
  { id: "approvals", label: "Approvals" },
  { id: "artifacts", label: "Artifacts" },
] as const;

export type AriaDesktopSpace = (typeof ariaDesktopSpaces)[number];
export type AriaDesktopContextPanel = (typeof ariaDesktopContextPanels)[number];

export interface AriaDesktopSidebarProject {
  projectLabel: string;
  threads: ProjectThreadListItem[];
}

export interface AriaDesktopEnvironmentOption {
  id: string;
  label: string;
  mode: "local" | "remote";
  access: ReturnType<typeof buildAccessClientConfig>;
}

export interface AriaDesktopBootstrap {
  app: typeof ariaDesktopApp;
  access: ReturnType<typeof buildAccessClientConfig>;
  initialThread?: ProjectThreadListItem;
}

export interface AriaDesktopThreadContext {
  threadId: string;
  threadType: ThreadType;
  threadTypeLabel: string;
  environmentLabel?: string;
  agentLabel?: string;
  panels: typeof ariaDesktopContextPanels;
}

export interface AriaDesktopShellProjectInput {
  project: Pick<ProjectRecord, "name">;
  threads: Array<Pick<ThreadRecord, "threadId" | "title" | "status" | "threadType" | "environmentId" | "agentId">>;
}

export interface AriaDesktopShellInitialThread {
  project: Pick<ProjectRecord, "name">;
  thread: Pick<ThreadRecord, "threadId" | "title" | "status" | "threadType" | "environmentId" | "agentId">;
}

export interface CreateAriaDesktopShellOptions {
  target: AccessClientTarget;
  projects?: AriaDesktopShellProjectInput[];
  environments?: Array<{
    hostLabel: string;
    environmentLabel: string;
    mode: "local" | "remote";
    target: AccessClientTarget;
  }>;
  initialThread?: AriaDesktopShellInitialThread;
  activeThreadContext?: {
    thread: Pick<ThreadRecord, "threadId" | "threadType">;
    environmentLabel?: string;
    agentLabel?: string;
  };
}

export interface AriaDesktopShell {
  app: typeof ariaDesktopApp;
  spaces: typeof ariaDesktopSpaces;
  contextPanels: typeof ariaDesktopContextPanels;
  composerPlacement: "bottom-docked";
  access: ReturnType<typeof buildAccessClientConfig>;
  environments: AriaDesktopEnvironmentOption[];
  sidebarProjects: AriaDesktopSidebarProject[];
  initialThread?: ProjectThreadListItem;
  activeThreadContext?: AriaDesktopThreadContext;
}

export function createAriaDesktopSidebarProjects(
  projects: Array<{
    project: Pick<ProjectRecord, "name">;
    threads: Array<Pick<ThreadRecord, "threadId" | "title" | "status" | "threadType" | "environmentId" | "agentId">>;
  }>,
): AriaDesktopSidebarProject[] {
  return projects.map(({ project, threads }) => ({
    projectLabel: project.name,
    threads: threads.map((thread) => createProjectThreadListItem(project, thread)),
  }));
}

export function createAriaDesktopThreadContext(input: {
  thread: Pick<ThreadRecord, "threadId" | "threadType">;
  environmentLabel?: string;
  agentLabel?: string;
}): AriaDesktopThreadContext {
  const threadType = resolveThreadType(input.thread);
  return {
    threadId: input.thread.threadId,
    threadType,
    threadTypeLabel: describeThreadType(threadType),
    environmentLabel: input.environmentLabel,
    agentLabel: input.agentLabel,
    panels: ariaDesktopContextPanels,
  };
}

export function createAriaDesktopEnvironmentOption(input: {
  hostLabel: string;
  environmentLabel: string;
  mode: "local" | "remote";
  target: AccessClientTarget;
}): AriaDesktopEnvironmentOption {
  return {
    id: `${input.target.serverId}:${input.environmentLabel}`,
    label: `${input.hostLabel} / ${input.environmentLabel}`,
    mode: input.mode,
    access: buildAccessClientConfig(input.target),
  };
}

export function createAriaDesktopBootstrap(
  target: AccessClientTarget,
  initialThread?: {
    project: Pick<ProjectRecord, "name">;
    thread: Pick<ThreadRecord, "threadId" | "title" | "status" | "threadType" | "environmentId" | "agentId">;
  },
): AriaDesktopBootstrap {
  return {
    app: ariaDesktopApp,
    access: buildAccessClientConfig(target),
    initialThread: initialThread
      ? createProjectThreadListItem(initialThread.project, initialThread.thread)
      : undefined,
  };
}

export function createAriaDesktopShell(
  options: CreateAriaDesktopShellOptions,
): AriaDesktopShell {
  const bootstrap = createAriaDesktopBootstrap(options.target, options.initialThread);

  return {
    app: bootstrap.app,
    spaces: ariaDesktopSpaces,
    contextPanels: ariaDesktopContextPanels,
    composerPlacement: "bottom-docked",
    access: bootstrap.access,
    environments: (options.environments ?? []).map((environment) =>
      createAriaDesktopEnvironmentOption(environment),
    ),
    sidebarProjects: createAriaDesktopSidebarProjects(options.projects ?? []),
    initialThread: bootstrap.initialThread,
    activeThreadContext: options.activeThreadContext
      ? createAriaDesktopThreadContext(options.activeThreadContext)
      : undefined,
  };
}
