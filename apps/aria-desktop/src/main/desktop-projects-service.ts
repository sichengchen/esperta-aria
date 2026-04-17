import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { realpath } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";
import type { BrowserWindow } from "electron";
import { getRuntimeHome } from "../../../../packages/server/src/brand.js";
import { ProjectsThreadEnvironmentService } from "../../../../packages/projects/src/thread-environments.js";
import type { ProjectsEngineRepository } from "../../../../packages/projects/src/repository.js";
import type {
  EnvironmentRecord,
  ProjectRecord,
  RepoRecord,
  ThreadEnvironmentBindingRecord,
  ThreadRecord,
  WorkspaceRecord,
} from "../../../../packages/projects/src/types.js";
import type { AriaDesktopProjectShellState } from "../shared/api.js";
import {
  buildDesktopProjectShellState,
  DESKTOP_LOCAL_WORKSPACE_ID,
  DESKTOP_LOCAL_WORKSPACE_LABEL,
  DESKTOP_SHELL_STATE_ID,
  type DesktopShellStateRow,
} from "./desktop-projects-shell.js";
import { DesktopProjectsStore } from "./desktop-projects-store.js";

const execFileAsync = promisify(execFile);

type GitMetadata = {
  defaultBranch: string;
  remoteUrl: string;
  repoName: string;
};

type DesktopProjectsServiceOptions = {
  dbPath?: string;
  now?: () => number;
  pickDirectory?: (ownerWindow?: BrowserWindow | null) => Promise<string | null>;
  readGitMetadata?: (directoryPath: string) => Promise<GitMetadata | null>;
};

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "project";
}

async function normalizeDirectoryPath(directoryPath: string): Promise<string> {
  return realpath(directoryPath).catch(() => resolve(directoryPath));
}

async function defaultPickDirectory(ownerWindow?: BrowserWindow | null): Promise<string | null> {
  const { dialog } = await import("electron");
  const result = ownerWindow
    ? await dialog.showOpenDialog(ownerWindow, {
        properties: ["openDirectory"],
      })
    : await dialog.showOpenDialog({
        properties: ["openDirectory"],
      });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0] ?? null;
}

async function defaultReadGitMetadata(directoryPath: string): Promise<GitMetadata | null> {
  try {
    const [{ stdout: repoRootStdout }, { stdout: remoteUrlStdout }, { stdout: branchStdout }] =
      await Promise.all([
        execFileAsync("git", ["-C", directoryPath, "rev-parse", "--show-toplevel"]),
        execFileAsync("git", ["-C", directoryPath, "config", "--get", "remote.origin.url"]),
        execFileAsync("git", ["-C", directoryPath, "symbolic-ref", "--short", "HEAD"]),
      ]);
    const repoRoot = repoRootStdout.trim();
    const remoteUrl = remoteUrlStdout.trim();
    const defaultBranch = branchStdout.trim();

    if (!repoRoot || !remoteUrl || !defaultBranch) {
      return null;
    }

    return {
      defaultBranch,
      remoteUrl,
      repoName: basename(repoRoot),
    };
  } catch {
    return null;
  }
}

export class DesktopProjectsService {
  private readonly store: DesktopProjectsStore;
  private readonly now: () => number;
  private readonly pickDirectory: (ownerWindow?: BrowserWindow | null) => Promise<string | null>;
  private readonly readGitMetadata: (directoryPath: string) => Promise<GitMetadata | null>;
  private readonly threadEnvironmentService: ProjectsThreadEnvironmentService;

  constructor(options: DesktopProjectsServiceOptions = {}) {
    this.store = new DesktopProjectsStore(
      options.dbPath ?? join(getRuntimeHome(), "desktop", "aria-desktop.db"),
    );
    this.now = options.now ?? (() => Date.now());
    this.pickDirectory = options.pickDirectory ?? defaultPickDirectory;
    this.readGitMetadata = options.readGitMetadata ?? defaultReadGitMetadata;
    this.threadEnvironmentService = new ProjectsThreadEnvironmentService(
      this.createRepositoryAdapter() as unknown as ProjectsEngineRepository,
    );
  }

  init(): void {
    this.store.init();
    this.ensureLocalWorkspace();
  }

  close(): void {
    this.store.close();
  }

  getProjectShellState(): AriaDesktopProjectShellState {
    return buildDesktopProjectShellState({
      environments: this.store.listEnvironments(),
      projects: this.store.listProjects(),
      repos: this.store.listRepos(),
      shellState: this.store.getShellState(),
      threads: this.store.listThreads(),
    });
  }

  async importLocalProjectFromDialog(
    ownerWindow?: BrowserWindow | null,
  ): Promise<AriaDesktopProjectShellState> {
    const directoryPath = await this.pickDirectory(ownerWindow);

    if (!directoryPath) {
      return this.getProjectShellState();
    }

    return this.importLocalProjectFromPath(directoryPath);
  }

  async importLocalProjectFromPath(directoryPath: string): Promise<AriaDesktopProjectShellState> {
    const normalizedPath = await normalizeDirectoryPath(directoryPath);
    const existingEnvironment = this.store.findEnvironmentByLocator(normalizedPath);

    if (existingEnvironment) {
      return this.openProjectAfterImport(existingEnvironment.projectId);
    }

    const now = this.now();
    const projectName = basename(normalizedPath) || normalizedPath;
    const projectId = randomUUID();
    const projectSlug = this.createUniqueProjectSlug(projectName);

    const project: ProjectRecord = {
      createdAt: now,
      description: null,
      name: projectName,
      projectId,
      slug: projectSlug,
      updatedAt: now,
    };

    this.store.upsertProject(project);

    const defaultEnvironment: EnvironmentRecord = {
      createdAt: now,
      environmentId: randomUUID(),
      kind: "main",
      label: `${DESKTOP_LOCAL_WORKSPACE_LABEL} / main`,
      locator: normalizedPath,
      mode: "local",
      projectId,
      updatedAt: now,
      workspaceId: DESKTOP_LOCAL_WORKSPACE_ID,
    };
    this.store.upsertEnvironment(defaultEnvironment);

    const gitMetadata = await this.readGitMetadata(normalizedPath);

    if (gitMetadata) {
      const repo: RepoRecord = {
        createdAt: now,
        defaultBranch: gitMetadata.defaultBranch,
        name: gitMetadata.repoName,
        projectId,
        remoteUrl: gitMetadata.remoteUrl,
        repoId: randomUUID(),
        updatedAt: now,
      };
      this.store.upsertRepo(repo);
    }

    return this.openProjectAfterImport(projectId);
  }

  createThread(projectId: string): AriaDesktopProjectShellState {
    const project = this.store.getProject(projectId);

    if (!project) {
      return this.getProjectShellState();
    }

    const now = this.now();
    const threads = this.store.listThreads(projectId);
    const repo = this.store.listRepos(projectId)[0];
    const threadId = randomUUID();

    this.store.upsertThread({
      agentId: "codex",
      createdAt: now,
      environmentBindingId: null,
      environmentId: null,
      projectId,
      repoId: repo?.repoId ?? null,
      status: "idle",
      taskId: null,
      threadId,
      threadType: "local_project",
      title: `Thread ${threads.length + 1}`,
      updatedAt: now,
      workspaceId: null,
    });

    const defaultEnvironment = this.getDefaultEnvironment(projectId);

    this.threadEnvironmentService.switchThreadEnvironment(
      {
        bindingId: randomUUID(),
        environmentId: defaultEnvironment.environmentId,
        reason: "Initial desktop-local environment binding",
        threadId,
      },
      now,
    );

    this.writeShellState((currentState) => ({
      ...currentState,
      collapsedProjectIds: currentState.collapsedProjectIds.filter((id) => id !== projectId),
      selectedProjectId: projectId,
      selectedThreadId: threadId,
    }));

    return this.getProjectShellState();
  }

  selectProject(projectId: string): AriaDesktopProjectShellState {
    if (!this.store.getProject(projectId)) {
      return this.getProjectShellState();
    }

    this.writeShellState((currentState) => ({
      ...currentState,
      selectedProjectId: projectId,
      selectedThreadId: null,
    }));

    return this.getProjectShellState();
  }

  selectThread(projectId: string, threadId: string): AriaDesktopProjectShellState {
    const thread = this.store.getThread(threadId);

    if (!thread || thread.projectId !== projectId) {
      return this.getProjectShellState();
    }

    this.writeShellState((currentState) => ({
      ...currentState,
      selectedProjectId: projectId,
      selectedThreadId: threadId,
    }));

    return this.getProjectShellState();
  }

  setProjectCollapsed(projectId: string, collapsed: boolean): AriaDesktopProjectShellState {
    if (!this.store.getProject(projectId)) {
      return this.getProjectShellState();
    }

    this.writeShellState((currentState) => ({
      ...currentState,
      collapsedProjectIds: collapsed
        ? Array.from(new Set([...currentState.collapsedProjectIds, projectId]))
        : currentState.collapsedProjectIds.filter(
            (currentProjectId) => currentProjectId !== projectId,
          ),
    }));

    return this.getProjectShellState();
  }

  private createRepositoryAdapter() {
    return {
      getActiveThreadEnvironmentBinding: (threadId: string) =>
        this.store.getActiveThreadEnvironmentBinding(threadId),
      getEnvironment: (environmentId: string) => this.store.getEnvironment(environmentId),
      getThread: (threadId: string) => this.store.getThread(threadId),
      listThreadEnvironmentBindings: (threadId?: string) =>
        this.store.listThreadEnvironmentBindings(threadId),
      upsertThread: (thread: ThreadRecord) => this.store.upsertThread(thread),
      upsertThreadEnvironmentBinding: (binding: ThreadEnvironmentBindingRecord) =>
        this.store.upsertThreadEnvironmentBinding(binding),
    };
  }

  private createUniqueProjectSlug(projectName: string): string {
    const baseSlug = slugify(projectName);
    let candidate = baseSlug;
    let suffix = 2;

    while (this.store.getProjectBySlug(candidate)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private ensureLocalWorkspace(): WorkspaceRecord {
    const existingWorkspace = this.store.getWorkspace(DESKTOP_LOCAL_WORKSPACE_ID);
    const now = this.now();
    const workspace: WorkspaceRecord = {
      createdAt: existingWorkspace?.createdAt ?? now,
      host: "desktop_local",
      label: DESKTOP_LOCAL_WORKSPACE_LABEL,
      serverId: null,
      updatedAt: now,
      workspaceId: DESKTOP_LOCAL_WORKSPACE_ID,
    };

    this.store.upsertWorkspace(workspace);

    return workspace;
  }

  private getDefaultEnvironment(projectId: string): EnvironmentRecord {
    const environment =
      this.store
        .listEnvironments(projectId)
        .find((candidate) => candidate.mode === "local" && candidate.kind === "main") ??
      this.store.listEnvironments(projectId)[0];

    if (!environment) {
      throw new Error(`Default environment not found for project ${projectId}`);
    }

    return environment;
  }

  private openProjectAfterImport(projectId: string): AriaDesktopProjectShellState {
    const existingThread = this.store.listThreads(projectId)[0];

    if (existingThread) {
      return this.selectThread(projectId, existingThread.threadId);
    }

    return this.createThread(projectId);
  }

  private writeShellState(
    updater: (currentState: DesktopShellStateRow) => DesktopShellStateRow,
  ): void {
    const now = this.now();
    const currentState = this.store.getShellState() ?? {
      collapsedProjectIds: [],
      selectedProjectId: null,
      selectedThreadId: null,
      shellId: DESKTOP_SHELL_STATE_ID,
      updatedAt: now,
    };

    this.store.upsertShellState({
      ...updater(currentState),
      shellId: DESKTOP_SHELL_STATE_ID,
      updatedAt: now,
    });
  }
}
