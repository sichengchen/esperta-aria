import {
  ariaDesktopApp as ariaDesktopShell,
  ariaDesktopContextPanels,
  ariaDesktopNavigation,
  ariaDesktopSpaces,
  createAriaDesktopBootstrap,
  type AriaDesktopBootstrap,
} from "@aria/desktop";
import type { AccessClientTarget } from "@aria/access-client";
import { ariaDesktopHost, createAriaDesktopHostBootstrap } from "./host.js";

export const ariaDesktopLaunchModes = [
  {
    id: "server-connected",
    label: "Server-connected",
    description:
      "Open Aria, inbox, automations, and project threads against a live Aria Server.",
  },
  {
    id: "local-project",
    label: "Local project",
    description:
      "Attach the active thread to a local worktree and use the desktop bridge for execution.",
  },
] as const;

export const ariaDesktopAppFrame = {
  kind: "three-pane-workbench",
  sidebar: {
    label: "Projects",
    mode: "unified-project-thread-tree",
    navigation: ariaDesktopNavigation,
  },
  center: {
    defaultSpaceId: "projects",
    defaultScreenId: "thread-list",
    activeScreenId: "thread",
    threadListMode: "unified-project-thread-list",
  },
  rightRail: {
    defaultContextPanelId: "review",
    panels: ariaDesktopContextPanels,
  },
  composer: {
    placement: "bottom-docked",
    scope: "active-thread",
  },
  statusStrip: {
    threadEnvironmentPlacement: "thread-header",
    connectionPlacement: "top-chrome",
  },
} as const;

export const ariaDesktopApplication = {
  id: "aria-desktop",
  packageName: "aria-desktop",
  displayName: "Aria Desktop",
  surface: "desktop",
  shellPackage: "@aria/desktop",
  host: ariaDesktopHost,
  shell: ariaDesktopShell,
  sharedPackages: ariaDesktopShell.sharedPackages,
  capabilities: ariaDesktopShell.capabilities,
  spaces: ariaDesktopSpaces,
  navigation: ariaDesktopNavigation,
  contextPanels: ariaDesktopContextPanels,
  launchModes: ariaDesktopLaunchModes,
  frame: ariaDesktopAppFrame,
  startup: {
    defaultSpaceId: "projects",
    defaultScreenId: "thread-list",
    defaultContextPanelId: "review",
    landingDescription:
      "Unified project threads land in the Projects space while Aria owns inbox, approvals, and automations.",
  },
  createBootstrap: createAriaDesktopHostBootstrap,
  createShellBootstrap: createAriaDesktopBootstrap,
} as const;

export interface AriaDesktopApplicationBootstrap {
  application: typeof ariaDesktopApplication;
  host: typeof ariaDesktopHost;
  shell: typeof ariaDesktopShell;
  bootstrap: AriaDesktopBootstrap;
}

export function createAriaDesktopApplicationBootstrap(
  target: AccessClientTarget,
  initialThread?: Parameters<typeof createAriaDesktopBootstrap>[1],
): AriaDesktopApplicationBootstrap {
  const hostBootstrap = createAriaDesktopHostBootstrap(target, initialThread);

  return {
    application: ariaDesktopApplication,
    host: hostBootstrap.host,
    shell: hostBootstrap.shell,
    bootstrap: hostBootstrap.bootstrap,
  };
}
