import type { ThreadStatus, ThreadType } from "../../../../packages/projects/src/client.js";

export const ariaDesktopChannels = {
  ping: "aria-desktop:ping",
  getRuntimeInfo: "aria-desktop:get-runtime-info",
  getProjectShellState: "aria-desktop:get-project-shell-state",
  importLocalProjectFromDialog: "aria-desktop:import-local-project-from-dialog",
  createThread: "aria-desktop:create-thread",
  selectProject: "aria-desktop:select-project",
  selectThread: "aria-desktop:select-thread",
  setProjectCollapsed: "aria-desktop:set-project-collapsed",
} as const;

export interface AriaDesktopRuntimeInfo {
  productName: string;
  platform: NodeJS.Platform;
  versions: {
    chrome: string;
    electron: string;
    node: string;
  };
}

export type AriaDesktopThreadStatus = ThreadStatus;

export type AriaDesktopThreadType = ThreadType;

export interface AriaDesktopProjectThreadItem {
  threadId: string;
  title: string;
  status: AriaDesktopThreadStatus;
  statusLabel: string;
  threadType: AriaDesktopThreadType;
  threadTypeLabel: string;
  updatedAt: number;
  environmentId?: string | null;
  agentId?: string | null;
}

export interface AriaDesktopProjectGroup {
  projectId: string;
  name: string;
  repoName?: string | null;
  rootPath?: string | null;
  threads: AriaDesktopProjectThreadItem[];
}

export interface AriaDesktopProjectShellState {
  projects: AriaDesktopProjectGroup[];
  selectedProjectId: string | null;
  selectedThreadId: string | null;
  collapsedProjectIds: string[];
}

export interface AriaDesktopApi {
  ping: () => Promise<string>;
  getRuntimeInfo: () => Promise<AriaDesktopRuntimeInfo>;
  getProjectShellState: () => Promise<AriaDesktopProjectShellState>;
  importLocalProjectFromDialog: () => Promise<AriaDesktopProjectShellState>;
  createThread: (projectId: string) => Promise<AriaDesktopProjectShellState>;
  selectProject: (projectId: string) => Promise<AriaDesktopProjectShellState>;
  selectThread: (projectId: string, threadId: string) => Promise<AriaDesktopProjectShellState>;
  setProjectCollapsed: (
    projectId: string,
    collapsed: boolean,
  ) => Promise<AriaDesktopProjectShellState>;
}
