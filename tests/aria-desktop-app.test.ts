import { describe, expect, test } from "bun:test";

import {
  ariaDesktopApplication,
  ariaDesktopHost,
  createAriaDesktopApplicationBootstrap,
} from "../apps/aria-desktop/src/index.js";

describe("aria-desktop app assembly", () => {
  test("assembles the desktop app as a product-shaped surface", () => {
    expect(ariaDesktopApplication).toMatchObject({
      id: "aria-desktop",
      packageName: "aria-desktop",
      displayName: "Aria Desktop",
      surface: "desktop",
      shellPackage: "@aria/desktop",
      startup: {
        defaultSpaceId: "projects",
        defaultScreenId: "thread-list",
        defaultContextPanelId: "review",
      },
    });
    expect(ariaDesktopApplication.host).toBe(ariaDesktopHost);
    expect(ariaDesktopApplication.frame).toMatchObject({
      kind: "three-pane-workbench",
      sidebar: {
        label: "Projects",
        mode: "unified-project-thread-tree",
      },
      center: {
        defaultSpaceId: "projects",
        defaultScreenId: "thread-list",
        activeScreenId: "thread",
        threadListMode: "unified-project-thread-list",
      },
      rightRail: {
        defaultContextPanelId: "review",
      },
      composer: {
        placement: "bottom-docked",
        scope: "active-thread",
      },
    });
    expect(ariaDesktopApplication.launchModes.map((mode) => mode.id)).toEqual([
      "server-connected",
      "local-project",
    ]);
    expect(ariaDesktopApplication.sharedPackages).toContain("@aria/desktop-bridge");
    expect(ariaDesktopApplication.capabilities).toContain("local-bridge");
  });

  test("creates app bootstraps with the same host and shell assembly", () => {
    const bootstrap = createAriaDesktopApplicationBootstrap(
      { serverId: "desktop", baseUrl: "http://127.0.0.1:7420/" },
      {
        project: { name: "Aria" },
        thread: {
          threadId: "thread-1",
          title: "Desktop thread",
          status: "running",
          threadType: "local_project",
          environmentId: "desktop-main",
          agentId: "codex",
        },
      },
    );

    expect(bootstrap.application).toBe(ariaDesktopApplication);
    expect(bootstrap.host).toBe(ariaDesktopHost);
    expect(bootstrap.shell.sharedPackages).toContain("@aria/ui");
    expect(bootstrap.bootstrap.access).toMatchObject({
      serverId: "desktop",
      httpUrl: "http://127.0.0.1:7420",
      wsUrl: "ws://127.0.0.1:7420",
    });
    expect(bootstrap.bootstrap.initialThread).toMatchObject({
      id: "thread-1",
      projectLabel: "Aria",
      threadType: "local_project",
    });
  });
});
