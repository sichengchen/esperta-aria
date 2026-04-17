import { contextBridge, ipcRenderer } from "electron";
import { ariaDesktopChannels, type AriaDesktopApi } from "../shared/api.js";

const ariaDesktopApi: AriaDesktopApi = {
  createThread: (projectId) => ipcRenderer.invoke(ariaDesktopChannels.createThread, projectId),
  getProjectShellState: () => ipcRenderer.invoke(ariaDesktopChannels.getProjectShellState),
  ping: () => ipcRenderer.invoke(ariaDesktopChannels.ping),
  getRuntimeInfo: () => ipcRenderer.invoke(ariaDesktopChannels.getRuntimeInfo),
  importLocalProjectFromDialog: () =>
    ipcRenderer.invoke(ariaDesktopChannels.importLocalProjectFromDialog),
  selectProject: (projectId) => ipcRenderer.invoke(ariaDesktopChannels.selectProject, projectId),
  selectThread: (projectId, threadId) =>
    ipcRenderer.invoke(ariaDesktopChannels.selectThread, projectId, threadId),
  setProjectCollapsed: (projectId, collapsed) =>
    ipcRenderer.invoke(ariaDesktopChannels.setProjectCollapsed, projectId, collapsed),
};

contextBridge.exposeInMainWorld("ariaDesktop", ariaDesktopApi);
