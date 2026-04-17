import type { BrowserWindow } from "electron";
import type { DesktopProjectsService } from "./desktop-projects-service.js";

type BrowserWindowLookup = {
  getAllWindows(): Array<BrowserWindow | null | undefined>;
  getFocusedWindow(): BrowserWindow | null | undefined;
};

export function getDesktopOwnerWindow(
  browserWindows: BrowserWindowLookup,
): BrowserWindow | null | undefined {
  return browserWindows.getFocusedWindow() ?? browserWindows.getAllWindows()[0];
}

export function importLocalProjectThroughDesktopService(
  projectsService: Pick<DesktopProjectsService, "importLocalProjectFromDialog">,
  browserWindows: BrowserWindowLookup,
) {
  return projectsService.importLocalProjectFromDialog(getDesktopOwnerWindow(browserWindows));
}
