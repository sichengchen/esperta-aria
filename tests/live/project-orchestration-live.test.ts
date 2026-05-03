import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createEngineClient } from "@aria/access-client";
import { startServer, type EngineServer } from "@aria/gateway/server";
import { createAriaRuntimeBackendAdapter } from "@aria/jobs/runtime-backend";
import type { RuntimeBackendExecutionRequest } from "@aria/jobs/runtime-backend";
import { runDispatchExecution } from "@aria/jobs/dispatch-runner";
import { createProjectsControlTool } from "@aria/server/projects-control-tool";
import { ProjectsEngineRepository, ProjectsEngineStore } from "@aria/work";
import {
  describeLive,
  getLiveTestLabel,
  resolveLiveProviderSelection,
} from "../helpers/live-model.js";
import { collectSubscription, createLiveRuntime } from "../helpers/live-runtime.js";
import { getAvailableGatewayPortPair } from "../helpers/server-runtime.js";

const liveSelection = resolveLiveProviderSelection();
let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(`${tmpdir()}/aria-live-project-orchestration-`);
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

async function seedProject(runtimeHome: string): Promise<ProjectsEngineRepository> {
  const store = new ProjectsEngineStore(join(runtimeHome, "aria.db"));
  await store.init();
  const repository = new ProjectsEngineRepository(store);
  const now = Date.now();

  repository.upsertProject({
    projectId: "project-live",
    name: "Live Transport Project",
    slug: "live-transport",
    description: null,
    createdAt: now,
    updatedAt: now,
  });
  repository.upsertServer({
    serverId: "server-live",
    label: "Live Server",
    primaryBaseUrl: "http://127.0.0.1:7420",
    secondaryBaseUrl: null,
    createdAt: now,
    updatedAt: now,
  });
  repository.upsertWorkspace({
    workspaceId: "workspace-live",
    host: "aria_server",
    serverId: "server-live",
    label: "Live Workspace",
    createdAt: now,
    updatedAt: now,
  });
  repository.upsertEnvironment({
    environmentId: "environment-live",
    workspaceId: "workspace-live",
    projectId: "project-live",
    label: "Live / main",
    mode: "remote",
    kind: "main",
    locator: "/srv/live-transport",
    createdAt: now,
    updatedAt: now,
  });
  repository.upsertThread({
    threadId: "thread-live",
    projectId: "project-live",
    taskId: null,
    repoId: null,
    title: "Live remote project thread",
    status: "queued",
    threadType: "remote_project",
    workspaceId: "workspace-live",
    environmentId: "environment-live",
    environmentBindingId: "binding-live",
    agentId: "aria-agent",
    createdAt: now,
    updatedAt: now,
  });
  repository.upsertThreadEnvironmentBinding({
    bindingId: "binding-live",
    threadId: "thread-live",
    projectId: "project-live",
    workspaceId: "workspace-live",
    environmentId: "environment-live",
    attachedAt: now,
    detachedAt: null,
    isActive: true,
    reason: "Live project orchestration test",
  });

  return repository;
}

describeLive("Aria-managed project orchestration — live LLM tests", () => {
  test("live Aria chat selects projects_control and drives deterministic worker backend", async () => {
    const runtime = await createLiveRuntime(testDir, {
      systemPrompt:
        "When asked to manage the Live Transport Project, call the projects_control tool with action queue_and_run, projectId project-live, threadId thread-live, dispatchId dispatch-live-chat, and jobBody 'Implement the live project handoff'. After the tool completes, summarize the project run briefly.",
      maxTokens: 384,
    });
    runtime.memory.getMemoryContext = async () => "Private Aria orchestration memory";

    const repository = await seedProject(testDir);
    const backendRequests: RuntimeBackendExecutionRequest[] = [];
    const backendRegistry = new Map([
      [
        "aria",
        createAriaRuntimeBackendAdapter({
          driver: {
            async execute(request, observer) {
              backendRequests.push(request);
              await observer?.onEvent?.({
                type: "execution.started",
                backend: "aria",
                executionId: request.executionId,
                timestamp: Date.now(),
                metadata: request.metadata,
              });
              await observer?.onEvent?.({
                type: "execution.completed",
                backend: "aria",
                executionId: request.executionId,
                timestamp: Date.now(),
                status: "succeeded",
                summary: "live worker completed",
                metadata: request.metadata,
              });
              return {
                backend: "aria",
                executionId: request.executionId,
                status: "succeeded",
                exitCode: 0,
                stdout: "live worker completed",
                stderr: "",
                summary: "live worker completed",
                filesChanged: ["src/live-project.ts"],
                metadata: request.metadata,
              };
            },
            async cancel() {},
          },
        }),
      ],
    ]);
    const tool = createProjectsControlTool({
      getRepository: () => repository,
      runDispatch: (repo, dispatchId) =>
        runDispatchExecution(runtime, repo, dispatchId, { backendRegistry }),
    });
    runtime.tools.push(tool);

    const port = await getAvailableGatewayPortPair();
    let server: EngineServer | undefined;

    try {
      server = await startServer(runtime, { hostname: "127.0.0.1", port });
      const client = createEngineClient({
        httpUrl: `http://127.0.0.1:${port}`,
        wsUrl: `ws://127.0.0.1:${port + 1}`,
        token: runtime.auth.getMasterToken(),
      });
      const { session } = await client.session.create.mutate({
        connectorType: "tui",
        prefix: "tui:live-projects",
      });

      const events = await collectSubscription<any>((handlers) =>
        client.chat.stream.subscribe(
          {
            sessionId: session.id,
            message: "Please manage the Live Transport Project remotely.",
          },
          handlers,
        ),
      );

      expect(events.map((event) => event.type)).toContain("tool_start");
      expect(events.map((event) => event.type)).toContain("tool_end");
      expect(events.at(-1)).toMatchObject({ type: "done", sessionId: session.id });
      expect(repository.getDispatch("dispatch-live-chat")).toMatchObject({
        dispatchId: "dispatch-live-chat",
        status: "completed",
        requestedBackend: "aria",
        summary: "live worker completed",
      });
      expect(repository.listJobs("thread-live")).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            author: "agent",
            body: "Implement the live project handoff",
          }),
        ]),
      );
      expect(backendRequests).toHaveLength(1);
      expect(backendRequests[0]).toMatchObject({
        threadId: "thread-live",
        metadata: {
          dispatchId: "dispatch-live-chat",
          projectId: "project-live",
          threadId: "thread-live",
          agentId: "aria-agent",
        },
      });
      expect(backendRequests[0]!.prompt).not.toContain("Private Aria orchestration memory");
      expect(getLiveTestLabel(liveSelection)).not.toBe("no-live-provider");
    } finally {
      await server?.stop();
      repository.close();
      await runtime.close();
    }
  }, 120_000);
});
