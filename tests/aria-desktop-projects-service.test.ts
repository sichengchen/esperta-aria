import { existsSync } from "node:fs";
import { mkdtemp, mkdir, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

let testDir = "";

async function createProjectDirectory(relativePath: string): Promise<string> {
  const directoryPath = join(testDir, relativePath);
  await mkdir(directoryPath, { recursive: true });
  return directoryPath;
}

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "aria-desktop-projects-service-"));
});

afterEach(async () => {
  if (testDir) {
    await rm(testDir, { force: true, recursive: true });
  }
});

describe("DesktopProjectsService", () => {
  test("bootstraps the desktop database and shared local workspace", async () => {
    const { DesktopProjectsService } =
      await import("../apps/aria-desktop/src/main/desktop-projects-service.js");
    const dbPath = join(testDir, "desktop", "aria-desktop.db");
    const service = new DesktopProjectsService({ dbPath });

    service.init();

    expect(existsSync(dbPath)).toBe(true);

    const db = new Database(dbPath, { readonly: true });
    const workspace = db
      .prepare(
        `
          SELECT workspace_id, host, label
          FROM projects_workspaces
          WHERE workspace_id = 'desktop-local-workspace'
        `,
      )
      .get() as { host: string; label: string; workspace_id: string } | undefined;

    expect(workspace).toEqual({
      host: "desktop_local",
      label: "This Device",
      workspace_id: "desktop-local-workspace",
    });

    db.close();
    service.close();
  });

  test("imports a local folder as a project, creates a default thread, and selects it", async () => {
    const { DesktopProjectsService } =
      await import("../apps/aria-desktop/src/main/desktop-projects-service.js");
    const dbPath = join(testDir, "desktop", "aria-desktop.db");
    const projectPath = await createProjectDirectory("projects/atlas-app");
    const service = new DesktopProjectsService({
      dbPath,
      now: () => 1_000,
      readGitMetadata: async () => null,
    });
    const normalizedProjectPath = await realpath(projectPath);

    service.init();
    const shellState = await service.importLocalProjectFromPath(projectPath);

    expect(shellState.projects).toHaveLength(1);
    expect(shellState.projects[0]).toMatchObject({
      name: "atlas-app",
      rootPath: normalizedProjectPath,
    });
    expect(shellState.selectedProjectId).toBe(shellState.projects[0]?.projectId);
    expect(shellState.selectedThreadId).toBeTruthy();
    expect(shellState.projects[0]?.threads).toHaveLength(1);

    const db = new Database(dbPath, { readonly: true });
    const environmentCount = db
      .prepare(`SELECT COUNT(*) AS count FROM projects_environments WHERE project_id = ?`)
      .get(shellState.projects[0]?.projectId) as { count: number };
    const repoCount = db
      .prepare(`SELECT COUNT(*) AS count FROM projects_repos WHERE project_id = ?`)
      .get(shellState.projects[0]?.projectId) as { count: number };
    const threadCount = db
      .prepare(`SELECT COUNT(*) AS count FROM projects_threads WHERE project_id = ?`)
      .get(shellState.projects[0]?.projectId) as { count: number };

    expect(environmentCount.count).toBe(1);
    expect(repoCount.count).toBe(0);
    expect(threadCount.count).toBe(1);

    db.close();
    service.close();
  });

  test("imports a local project through the dialog-backed flow when the picker returns a folder", async () => {
    const { DesktopProjectsService } =
      await import("../apps/aria-desktop/src/main/desktop-projects-service.js");
    const dbPath = join(testDir, "desktop", "aria-desktop.db");
    const projectPath = await createProjectDirectory("projects/dialog-project");
    const normalizedProjectPath = await realpath(projectPath);
    const service = new DesktopProjectsService({
      dbPath,
      pickDirectory: async () => projectPath,
      readGitMetadata: async () => null,
    });

    service.init();
    const shellState = await service.importLocalProjectFromDialog();

    expect(shellState.projects).toHaveLength(1);
    expect(shellState.projects[0]).toMatchObject({
      name: "dialog-project",
      rootPath: normalizedProjectPath,
    });
    expect(shellState.selectedThreadId).toBeTruthy();

    service.close();
  });

  test("re-importing the same folder re-selects the existing project instead of duplicating it", async () => {
    const { DesktopProjectsService } =
      await import("../apps/aria-desktop/src/main/desktop-projects-service.js");
    const dbPath = join(testDir, "desktop", "aria-desktop.db");
    const projectPath = await createProjectDirectory("projects/atlas-app");
    const service = new DesktopProjectsService({
      dbPath,
      readGitMetadata: async () => null,
    });

    service.init();
    const first = await service.importLocalProjectFromPath(projectPath);
    const second = await service.importLocalProjectFromPath(projectPath);

    expect(first.projects).toHaveLength(1);
    expect(second.projects).toHaveLength(1);
    expect(second.selectedProjectId).toBe(first.selectedProjectId);
    expect(second.selectedThreadId).toBe(first.selectedThreadId);

    const db = new Database(dbPath, { readonly: true });
    const projectCount = db.prepare(`SELECT COUNT(*) AS count FROM projects_projects`).get() as {
      count: number;
    };
    const threadCount = db.prepare(`SELECT COUNT(*) AS count FROM projects_threads`).get() as {
      count: number;
    };

    expect(projectCount.count).toBe(1);
    expect(threadCount.count).toBe(1);

    db.close();
    service.close();
  });

  test("slug collisions are suffixed deterministically across folders with the same basename", async () => {
    const { DesktopProjectsService } =
      await import("../apps/aria-desktop/src/main/desktop-projects-service.js");
    const dbPath = join(testDir, "desktop", "aria-desktop.db");
    const firstPath = await createProjectDirectory("one/shared-name");
    const secondPath = await createProjectDirectory("two/shared-name");
    const service = new DesktopProjectsService({
      dbPath,
      readGitMetadata: async () => null,
    });

    service.init();
    await service.importLocalProjectFromPath(firstPath);
    await service.importLocalProjectFromPath(secondPath);

    const db = new Database(dbPath, { readonly: true });
    const slugs = db
      .prepare(
        `
          SELECT slug
          FROM projects_projects
          ORDER BY created_at ASC
        `,
      )
      .all() as Array<{ slug: string }>;

    expect(slugs.map((row) => row.slug)).toEqual(["shared-name", "shared-name-2"]);

    db.close();
    service.close();
  });

  test("creating a thread persists a thread and an active environment binding", async () => {
    const { DesktopProjectsService } =
      await import("../apps/aria-desktop/src/main/desktop-projects-service.js");
    const dbPath = join(testDir, "desktop", "aria-desktop.db");
    const projectPath = await createProjectDirectory("projects/atlas-app");
    const service = new DesktopProjectsService({
      dbPath,
      now: () => 2_000,
      readGitMetadata: async () => null,
    });

    service.init();
    const imported = await service.importLocalProjectFromPath(projectPath);
    const projectId = imported.selectedProjectId;
    expect(projectId).toBeTruthy();

    const shellState = service.createThread(projectId!);
    const threadId = shellState.selectedThreadId;
    expect(threadId).toBeTruthy();

    const db = new Database(dbPath, { readonly: true });
    const thread = db
      .prepare(
        `
          SELECT thread_id, environment_binding_id, environment_id, thread_type
          FROM projects_threads
          WHERE thread_id = ?
        `,
      )
      .get(threadId) as
      | {
          environment_binding_id: string;
          environment_id: string;
          thread_id: string;
          thread_type: string;
        }
      | undefined;
    const binding = db
      .prepare(
        `
          SELECT binding_id, is_active
          FROM projects_thread_environment_bindings
          WHERE thread_id = ?
        `,
      )
      .get(threadId) as { binding_id: string; is_active: number } | undefined;

    expect(thread).toMatchObject({
      thread_id: threadId,
      thread_type: "local_project",
    });
    expect(thread?.environment_binding_id).toBeTruthy();
    expect(thread?.environment_id).toBeTruthy();
    expect(binding).toMatchObject({
      binding_id: thread?.environment_binding_id,
      is_active: 1,
    });

    db.close();
    service.close();
  });

  test("selection and collapsed groups persist across service restarts", async () => {
    const { DesktopProjectsService } =
      await import("../apps/aria-desktop/src/main/desktop-projects-service.js");
    const dbPath = join(testDir, "desktop", "aria-desktop.db");
    const firstPath = await createProjectDirectory("projects/atlas-app");
    const secondPath = await createProjectDirectory("projects/mercury-api");
    const service = new DesktopProjectsService({
      dbPath,
      now: () => 3_000,
      readGitMetadata: async () => null,
    });

    service.init();
    const first = await service.importLocalProjectFromPath(firstPath);
    const second = await service.importLocalProjectFromPath(secondPath);
    const firstProjectId = first.projects[0]?.projectId;
    const secondProjectId = second.selectedProjectId;
    expect(firstProjectId).toBeTruthy();
    expect(secondProjectId).toBeTruthy();

    const threadState = service.createThread(firstProjectId!);
    expect(threadState.selectedThreadId).toBeTruthy();

    service.selectThread(firstProjectId!, threadState.selectedThreadId!);
    service.setProjectCollapsed(secondProjectId!, true);
    service.close();

    const reopened = new DesktopProjectsService({
      dbPath,
      readGitMetadata: async () => null,
    });
    reopened.init();

    const restored = reopened.getProjectShellState();

    expect(restored.selectedProjectId).toBe(firstProjectId);
    expect(restored.selectedThreadId).toBe(threadState.selectedThreadId);
    expect(restored.collapsedProjectIds).toEqual([secondProjectId!]);

    reopened.close();
  });
});
