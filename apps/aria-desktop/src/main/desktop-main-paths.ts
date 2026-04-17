import { join } from "node:path";

export function getDesktopPreloadPath(currentDir: string): string {
  return join(currentDir, "../preload/index.mjs");
}

export function getDesktopRendererHtmlPath(currentDir: string): string {
  return join(currentDir, "../renderer/index.html");
}
