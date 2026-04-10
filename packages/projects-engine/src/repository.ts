import type {
  ExternalRefRecord,
  JobRecord,
  ProjectRecord,
  RepoRecord,
  TaskRecord,
  ThreadRecord,
} from "./types.js";
import { ProjectsEngineStore } from "./store.js";

export class ProjectsEngineRepository {
  constructor(private readonly store: ProjectsEngineStore) {}

  async init(): Promise<void> {
    await this.store.init();
  }

  close(): void {
    this.store.close();
  }

  upsertProject(project: ProjectRecord): void {
    this.store.upsertProject(project);
  }

  listProjects(): ProjectRecord[] {
    return this.store.listProjects();
  }

  upsertRepo(repo: RepoRecord): void {
    this.store.upsertRepo(repo);
  }

  listRepos(projectId?: string): RepoRecord[] {
    return this.store.listRepos(projectId);
  }

  upsertTask(task: TaskRecord): void {
    this.store.upsertTask(task);
  }

  listTasks(projectId?: string, repoId?: string): TaskRecord[] {
    return this.store.listTasks(projectId, repoId);
  }

  upsertThread(thread: ThreadRecord): void {
    this.store.upsertThread(thread);
  }

  listThreads(projectId?: string, taskId?: string): ThreadRecord[] {
    return this.store.listThreads(projectId, taskId);
  }

  upsertJob(job: JobRecord): void {
    this.store.upsertJob(job);
  }

  listJobs(threadId?: string): JobRecord[] {
    return this.store.listJobs(threadId);
  }

  upsertExternalRef(externalRef: ExternalRefRecord): void {
    this.store.upsertExternalRef(externalRef);
  }

  listExternalRefs(ownerType?: ExternalRefRecord["ownerType"], ownerId?: string): ExternalRefRecord[] {
    return this.store.listExternalRefs(ownerType, ownerId);
  }
}
