import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createEngineClient } from "@aria/access-client";
import { startServer, type EngineServer } from "@aria/gateway/server";
import {
  describeLive,
  getLiveTestLabel,
  resolveLiveProviderSelection,
} from "../helpers/live-model.js";
import { createLiveRuntime } from "../helpers/live-runtime.js";
import { getAvailableGatewayPortPair } from "../helpers/server-runtime.js";

const liveSelection = resolveLiveProviderSelection();
let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(`${tmpdir()}/aria-live-automation-`);
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describeLive("automation and webhooks — live LLM tests", () => {
  test("live cron run executes through automation and persists durable records", async () => {
    const runtime = await createLiveRuntime(testDir, {
      systemPrompt: "Reply briefly to automation tasks. Do not use tools.",
    });
    const port = await getAvailableGatewayPortPair();
    let server: EngineServer | undefined;

    try {
      server = await startServer(runtime, { hostname: "127.0.0.1", port });
      const client = createEngineClient({
        httpUrl: `http://127.0.0.1:${port}`,
        wsUrl: `ws://127.0.0.1:${port + 1}`,
        token: runtime.auth.getMasterToken(),
      });

      await client.cron.add.mutate({
        name: "live-digest",
        schedule: "every 5m",
        prompt: "Write one short status sentence for the LIVE_CRON automation check.",
      });
      await expect(client.cron.run.mutate({ name: "live-digest" })).resolves.toEqual({
        triggered: true,
      });

      const task = runtime.store.getAutomationTaskByName("cron", "live-digest");
      expect(task).toMatchObject({
        taskType: "cron",
        name: "live-digest",
        lastStatus: "success",
      });
      const runs = runtime.store.listAutomationRuns(task!.taskId, 1);
      expect(runs).toEqual([
        expect.objectContaining({
          taskType: "cron",
          trigger: "cron",
          status: "success",
          promptText: "Write one short status sentence for the LIVE_CRON automation check.",
          deliveryStatus: "not_requested",
        }),
      ]);
      expect(runs[0]?.responseText).toBeTruthy();
      expect(runs[0]?.sessionId).toStartWith("cron:live-digest:");
      expect(getLiveTestLabel(liveSelection)).not.toBe("no-live-provider");
    } finally {
      await server?.stop();
      await runtime.close();
    }
  }, 90_000);

  test("live webhook task handles HTTP payload and persists framed prompt result", async () => {
    const runtime = await createLiveRuntime(testDir, {
      systemPrompt: "Reply briefly to webhook payloads. Do not use tools.",
    });
    const port = await getAvailableGatewayPortPair();
    let server: EngineServer | undefined;

    try {
      server = await startServer(runtime, { hostname: "127.0.0.1", port });
      const client = createEngineClient({
        httpUrl: `http://127.0.0.1:${port}`,
        wsUrl: `ws://127.0.0.1:${port + 1}`,
        token: runtime.auth.getMasterToken(),
      });

      await client.webhookTask.add.mutate({
        name: "Live deploy event",
        slug: "live-deploy",
        prompt: "Summarize this deployment payload in one sentence:\n{{payload}}",
        enabled: true,
      });

      const response = await fetch(`http://127.0.0.1:${port}/webhook/tasks/live-deploy`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${runtime.auth.getWebhookToken()}`,
        },
        body: JSON.stringify({
          deployment: "live-webhook",
          status: "queued",
        }),
      });

      expect(response.status).toBe(200);
      const json = (await response.json()) as { response?: string };
      expect(json).toMatchObject({
        task: "Live deploy event",
        slug: "live-deploy",
        attempt: 1,
        maxAttempts: 1,
        deliveryStatus: "not_requested",
      });
      expect(json.response).toBeTruthy();

      const task = runtime.store.getAutomationTaskBySlug("live-deploy");
      expect(task).toMatchObject({
        taskType: "webhook",
        name: "Live deploy event",
        lastStatus: "success",
      });
      const runs = runtime.store.listAutomationRuns(task!.taskId, 1);
      expect(runs).toEqual([
        expect.objectContaining({
          taskType: "webhook",
          trigger: "webhook",
          status: "success",
          deliveryStatus: "not_requested",
        }),
      ]);
      expect(runs[0]?.promptText).toContain("<data-webhook>");
      expect(runs[0]?.promptText).toContain('"deployment":"live-webhook"');
      expect(runs[0]?.responseText).toBe(json.response);
      expect(runs[0]?.sessionId).toStartWith("webhook:live-deploy:");
    } finally {
      await server?.stop();
      await runtime.close();
    }
  }, 90_000);
});
