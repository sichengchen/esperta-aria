import {
  buildAccessClientConfig,
  type AccessClientTarget,
} from "@aria/access-client";
import {
  createProjectThreadListItem,
  type ProjectThreadListItem,
} from "@aria/ui";
import type { ProjectRecord, ThreadRecord } from "@aria/projects";

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

export type AriaDesktopSpace = (typeof ariaDesktopSpaces)[number];

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

export function createAriaDesktopSidebarProjects(
  projects: Array<{
    project: Pick<ProjectRecord, "name">;
    threads: Array<Pick<ThreadRecord, "threadId" | "title" | "status">>;
  }>,
): AriaDesktopSidebarProject[] {
  return projects.map(({ project, threads }) => ({
    projectLabel: project.name,
    threads: threads.map((thread) => createProjectThreadListItem(project, thread)),
  }));
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
    thread: Pick<ThreadRecord, "threadId" | "title" | "status">;
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
