import { app, BrowserWindow, ipcMain } from "electron";
import { DesktopProjectsService } from "./desktop-projects-service.js";
import { ariaDesktopChannels, type AriaDesktopRuntimeInfo } from "../shared/api.js";
import { importLocalProjectThroughDesktopService } from "./desktop-ipc-handlers.js";

let registered = false;

function getRuntimeInfo(): AriaDesktopRuntimeInfo {
  return {
    productName: app.getName(),
    platform: process.platform,
    versions: {
      chrome: process.versions.chrome ?? "",
      electron: process.versions.electron ?? "",
      node: process.versions.node ?? "",
    },
  };
}

export function registerDesktopIpc(projectsService: DesktopProjectsService): void {
  if (registered) {
    return;
  }

  ipcMain.handle(ariaDesktopChannels.ping, () => "pong");
  ipcMain.handle(ariaDesktopChannels.getRuntimeInfo, () => getRuntimeInfo());
  ipcMain.handle(ariaDesktopChannels.getProjectShellState, () =>
    projectsService.getProjectShellState(),
  );
  ipcMain.handle(ariaDesktopChannels.importLocalProjectFromDialog, () =>
    importLocalProjectThroughDesktopService(projectsService, BrowserWindow),
  );
  ipcMain.handle(ariaDesktopChannels.createThread, (_event, projectId: string) =>
    projectsService.createThread(projectId),
  );
  ipcMain.handle(ariaDesktopChannels.selectProject, (_event, projectId: string) =>
    projectsService.selectProject(projectId),
  );
  ipcMain.handle(ariaDesktopChannels.selectThread, (_event, projectId: string, threadId: string) =>
    projectsService.selectThread(projectId, threadId),
  );
  ipcMain.handle(
    ariaDesktopChannels.setProjectCollapsed,
    (_event, projectId: string, collapsed: boolean) =>
      projectsService.setProjectCollapsed(projectId, collapsed),
  );

  registered = true;
}
