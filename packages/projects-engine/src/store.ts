import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { Database } from "bun:sqlite";
import type { SQLQueryBindings } from "bun:sqlite";
import { PROJECTS_ENGINE_SCHEMA_SQL } from "./schema.js";
import type {
  ExternalRefRecord,
  JobRecord,
  ProjectRecord,
  RepoRecord,
  TaskRecord,
  ThreadRecord,
} from "./types.js";

type SqliteRow = Record<string, unknown>;

function asText(value: unknown): string {
  return typeof value === "string" ? value : String(value);
}

function asOptionalText(value: unknown): string | null {
  return value == null ? null : asText(value);
}

function normalizeProjectRow(row: SqliteRow | null | undefined): ProjectRecord | undefined {
  if (!row) return undefined;
  return {
    projectId: asText(row.project_id),
    name: asText(row.name),
    slug: asText(row.slug),
    description: asOptionalText(row.description),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

function normalizeRepoRow(row: SqliteRow | null | undefined): RepoRecord | undefined {
  if (!row) return undefined;
  return {
    repoId: asText(row.repo_id),
    projectId: asText(row.project_id),
    name: asText(row.name),
    remoteUrl: asText(row.remote_url),
    defaultBranch: asText(row.default_branch),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

function normalizeTaskRow(row: SqliteRow | null | undefined): TaskRecord | undefined {
  if (!row) return undefined;
  return {
    taskId: asText(row.task_id),
    projectId: asText(row.project_id),
    repoId: asOptionalText(row.repo_id),
    title: asText(row.title),
    description: asOptionalText(row.description),
    status: asText(row.status) as TaskRecord["status"],
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

function normalizeThreadRow(row: SqliteRow | null | undefined): ThreadRecord | undefined {
  if (!row) return undefined;
  return {
    threadId: asText(row.thread_id),
    projectId: asText(row.project_id),
    taskId: asOptionalText(row.task_id),
    repoId: asOptionalText(row.repo_id),
    title: asText(row.title),
    status: asText(row.status) as ThreadRecord["status"],
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

function normalizeJobRow(row: SqliteRow | null | undefined): JobRecord | undefined {
  if (!row) return undefined;
  return {
    jobId: asText(row.job_id),
    threadId: asText(row.thread_id),
    author: asText(row.author) as JobRecord["author"],
    body: asText(row.body),
    createdAt: Number(row.created_at),
  };
}

function normalizeExternalRefRow(row: SqliteRow | null | undefined): ExternalRefRecord | undefined {
  if (!row) return undefined;
  return {
    externalRefId: asText(row.external_ref_id),
    ownerType: asText(row.owner_type) as ExternalRefRecord["ownerType"],
    ownerId: asText(row.owner_id),
    system: asText(row.system) as ExternalRefRecord["system"],
    externalId: asText(row.external_id),
    externalKey: asOptionalText(row.external_key),
    sessionId: asOptionalText(row.session_id),
    metadataJson: asOptionalText(row.metadata_json),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export class ProjectsEngineStore {
  private readonly dbPath: string;
  private db: Database | null = null;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async init(): Promise<void> {
    if (this.db) return;

    await mkdir(dirname(this.dbPath), { recursive: true });
    this.db = new Database(this.dbPath);
    this.db.exec("PRAGMA journal_mode=WAL");
    this.db.exec("PRAGMA foreign_keys=ON");
    this.db.exec(PROJECTS_ENGINE_SCHEMA_SQL);
  }

  close(): void {
    this.db?.close(false);
    this.db = null;
  }

  private getDb(): Database {
    if (!this.db) {
      throw new Error("Projects engine store not initialized");
    }
    return this.db;
  }

  private all<T>(sql: string, ...params: SQLQueryBindings[]): T[] {
    return this.getDb().prepare(sql).all(...params) as T[];
  }

  private get<T>(sql: string, ...params: SQLQueryBindings[]): T | undefined {
    return this.getDb().prepare(sql).get(...params) as T | undefined;
  }

  private run(sql: string, ...params: SQLQueryBindings[]): void {
    this.getDb().prepare(sql).run(...params);
  }

  upsertProject(project: ProjectRecord): void {
    this.run(
      `
      INSERT INTO projects_projects (
        project_id, name, slug, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(project_id) DO UPDATE SET
        name = excluded.name,
        slug = excluded.slug,
        description = excluded.description,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
      `,
      project.projectId,
      project.name,
      project.slug,
      project.description ?? null,
      project.createdAt,
      project.updatedAt,
    );
  }

  listProjects(): ProjectRecord[] {
    return this.all<SqliteRow>(
      `
      SELECT project_id, name, slug, description, created_at, updated_at
      FROM projects_projects
      ORDER BY updated_at DESC, created_at DESC
      `,
    )
      .map((row) => normalizeProjectRow(row))
      .filter((row): row is ProjectRecord => Boolean(row));
  }

  upsertRepo(repo: RepoRecord): void {
    this.run(
      `
      INSERT INTO projects_repos (
        repo_id, project_id, name, remote_url, default_branch, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(repo_id) DO UPDATE SET
        project_id = excluded.project_id,
        name = excluded.name,
        remote_url = excluded.remote_url,
        default_branch = excluded.default_branch,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
      `,
      repo.repoId,
      repo.projectId,
      repo.name,
      repo.remoteUrl,
      repo.defaultBranch,
      repo.createdAt,
      repo.updatedAt,
    );
  }

  listRepos(projectId?: string): RepoRecord[] {
    const rows = projectId
      ? this.all<SqliteRow>(
          `
          SELECT repo_id, project_id, name, remote_url, default_branch, created_at, updated_at
          FROM projects_repos
          WHERE project_id = ?
          ORDER BY updated_at DESC, created_at DESC
          `,
          projectId,
        )
      : this.all<SqliteRow>(
          `
          SELECT repo_id, project_id, name, remote_url, default_branch, created_at, updated_at
          FROM projects_repos
          ORDER BY updated_at DESC, created_at DESC
          `,
        );

    return rows.map((row) => normalizeRepoRow(row)).filter((row): row is RepoRecord => Boolean(row));
  }

  upsertTask(task: TaskRecord): void {
    this.run(
      `
      INSERT INTO projects_tasks (
        task_id, project_id, repo_id, title, description, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(task_id) DO UPDATE SET
        project_id = excluded.project_id,
        repo_id = excluded.repo_id,
        title = excluded.title,
        description = excluded.description,
        status = excluded.status,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
      `,
      task.taskId,
      task.projectId,
      task.repoId ?? null,
      task.title,
      task.description ?? null,
      task.status,
      task.createdAt,
      task.updatedAt,
    );
  }

  listTasks(projectId?: string, repoId?: string): TaskRecord[] {
    let rows: SqliteRow[];
    if (projectId && repoId) {
      rows = this.all<SqliteRow>(
        `
        SELECT task_id, project_id, repo_id, title, description, status, created_at, updated_at
        FROM projects_tasks
        WHERE project_id = ? AND repo_id = ?
        ORDER BY updated_at DESC, created_at DESC
        `,
        projectId,
        repoId,
      );
    } else if (projectId) {
      rows = this.all<SqliteRow>(
        `
        SELECT task_id, project_id, repo_id, title, description, status, created_at, updated_at
        FROM projects_tasks
        WHERE project_id = ?
        ORDER BY updated_at DESC, created_at DESC
        `,
        projectId,
      );
    } else if (repoId) {
      rows = this.all<SqliteRow>(
        `
        SELECT task_id, project_id, repo_id, title, description, status, created_at, updated_at
        FROM projects_tasks
        WHERE repo_id = ?
        ORDER BY updated_at DESC, created_at DESC
        `,
        repoId,
      );
    } else {
      rows = this.all<SqliteRow>(
        `
        SELECT task_id, project_id, repo_id, title, description, status, created_at, updated_at
        FROM projects_tasks
        ORDER BY updated_at DESC, created_at DESC
        `,
      );
    }

    return rows.map((row) => normalizeTaskRow(row)).filter((row): row is TaskRecord => Boolean(row));
  }

  upsertThread(thread: ThreadRecord): void {
    this.run(
      `
      INSERT INTO projects_threads (
        thread_id, project_id, task_id, repo_id, title, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(thread_id) DO UPDATE SET
        project_id = excluded.project_id,
        task_id = excluded.task_id,
        repo_id = excluded.repo_id,
        title = excluded.title,
        status = excluded.status,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
      `,
      thread.threadId,
      thread.projectId,
      thread.taskId ?? null,
      thread.repoId ?? null,
      thread.title,
      thread.status,
      thread.createdAt,
      thread.updatedAt,
    );
  }

  listThreads(projectId?: string, taskId?: string): ThreadRecord[] {
    let rows: SqliteRow[];
    if (projectId && taskId) {
      rows = this.all<SqliteRow>(
        `
        SELECT thread_id, project_id, task_id, repo_id, title, status, created_at, updated_at
        FROM projects_threads
        WHERE project_id = ? AND task_id = ?
        ORDER BY updated_at DESC, created_at DESC
        `,
        projectId,
        taskId,
      );
    } else if (projectId) {
      rows = this.all<SqliteRow>(
        `
        SELECT thread_id, project_id, task_id, repo_id, title, status, created_at, updated_at
        FROM projects_threads
        WHERE project_id = ?
        ORDER BY updated_at DESC, created_at DESC
        `,
        projectId,
      );
    } else if (taskId) {
      rows = this.all<SqliteRow>(
        `
        SELECT thread_id, project_id, task_id, repo_id, title, status, created_at, updated_at
        FROM projects_threads
        WHERE task_id = ?
        ORDER BY updated_at DESC, created_at DESC
        `,
        taskId,
      );
    } else {
      rows = this.all<SqliteRow>(
        `
        SELECT thread_id, project_id, task_id, repo_id, title, status, created_at, updated_at
        FROM projects_threads
        ORDER BY updated_at DESC, created_at DESC
        `,
      );
    }

    return rows.map((row) => normalizeThreadRow(row)).filter((row): row is ThreadRecord => Boolean(row));
  }

  upsertJob(job: JobRecord): void {
    this.run(
      `
      INSERT INTO projects_jobs (
        job_id, thread_id, author, body, created_at
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(job_id) DO UPDATE SET
        thread_id = excluded.thread_id,
        author = excluded.author,
        body = excluded.body,
        created_at = excluded.created_at
      `,
      job.jobId,
      job.threadId,
      job.author,
      job.body,
      job.createdAt,
    );
  }

  listJobs(threadId?: string): JobRecord[] {
    const rows = threadId
      ? this.all<SqliteRow>(
          `
          SELECT job_id, thread_id, author, body, created_at
          FROM projects_jobs
          WHERE thread_id = ?
          ORDER BY created_at ASC
          `,
          threadId,
        )
      : this.all<SqliteRow>(
          `
          SELECT job_id, thread_id, author, body, created_at
          FROM projects_jobs
          ORDER BY created_at ASC
          `,
        );

    return rows.map((row) => normalizeJobRow(row)).filter((row): row is JobRecord => Boolean(row));
  }

  upsertExternalRef(externalRef: ExternalRefRecord): void {
    this.run(
      `
      INSERT INTO projects_external_refs (
        external_ref_id, owner_type, owner_id, system, external_id, external_key, session_id,
        metadata_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(external_ref_id) DO UPDATE SET
        owner_type = excluded.owner_type,
        owner_id = excluded.owner_id,
        system = excluded.system,
        external_id = excluded.external_id,
        external_key = excluded.external_key,
        session_id = excluded.session_id,
        metadata_json = excluded.metadata_json,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
      `,
      externalRef.externalRefId,
      externalRef.ownerType,
      externalRef.ownerId,
      externalRef.system,
      externalRef.externalId,
      externalRef.externalKey ?? null,
      externalRef.sessionId ?? null,
      externalRef.metadataJson ?? null,
      externalRef.createdAt,
      externalRef.updatedAt,
    );
  }

  listExternalRefs(ownerType?: ExternalRefRecord["ownerType"], ownerId?: string): ExternalRefRecord[] {
    let rows: SqliteRow[];
    if (ownerType && ownerId) {
      rows = this.all<SqliteRow>(
        `
        SELECT external_ref_id, owner_type, owner_id, system, external_id, external_key,
               session_id, metadata_json, created_at, updated_at
        FROM projects_external_refs
        WHERE owner_type = ? AND owner_id = ?
        ORDER BY updated_at DESC, created_at DESC
        `,
        ownerType,
        ownerId,
      );
    } else if (ownerType) {
      rows = this.all<SqliteRow>(
        `
        SELECT external_ref_id, owner_type, owner_id, system, external_id, external_key,
               session_id, metadata_json, created_at, updated_at
        FROM projects_external_refs
        WHERE owner_type = ?
        ORDER BY updated_at DESC, created_at DESC
        `,
        ownerType,
      );
    } else if (ownerId) {
      rows = this.all<SqliteRow>(
        `
        SELECT external_ref_id, owner_type, owner_id, system, external_id, external_key,
               session_id, metadata_json, created_at, updated_at
        FROM projects_external_refs
        WHERE owner_id = ?
        ORDER BY updated_at DESC, created_at DESC
        `,
        ownerId,
      );
    } else {
      rows = this.all<SqliteRow>(
        `
        SELECT external_ref_id, owner_type, owner_id, system, external_id, external_key,
               session_id, metadata_json, created_at, updated_at
        FROM projects_external_refs
        ORDER BY updated_at DESC, created_at DESC
        `,
      );
    }

    return rows
      .map((row) => normalizeExternalRefRow(row))
      .filter((row): row is ExternalRefRecord => Boolean(row));
  }

}
