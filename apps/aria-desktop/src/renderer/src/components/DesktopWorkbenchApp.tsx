import { ChevronDown, ChevronRight, FolderPlus, MessageSquarePlus, Settings2 } from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import type {
  AriaDesktopProjectGroup,
  AriaDesktopProjectShellState,
  AriaDesktopProjectThreadItem,
} from "../../../shared/api.js";
import { DesktopBaseLayout, type DesktopBaseLayoutToolbarItem } from "./DesktopBaseLayout.js";
import { DesktopCollapsibleSection } from "./DesktopCollapsibleSection.js";
import { DesktopIconButton } from "./DesktopIconButton.js";
import { DesktopSidebarButton } from "./DesktopSidebarButton.js";

type ActiveScreen = "projects" | "settings";

const EMPTY_SHELL_STATE: AriaDesktopProjectShellState = {
  collapsedProjectIds: [],
  projects: [],
  selectedProjectId: null,
  selectedThreadId: null,
};

function formatRelativeUpdatedAt(updatedAt: number): string {
  const differenceMs = Date.now() - updatedAt;

  if (differenceMs < 60_000) {
    return "now";
  }

  const differenceMinutes = Math.floor(differenceMs / 60_000);

  if (differenceMinutes < 60) {
    return `${differenceMinutes}m`;
  }

  const differenceHours = Math.floor(differenceMinutes / 60);

  if (differenceHours < 24) {
    return `${differenceHours}h`;
  }

  return `${Math.floor(differenceHours / 24)}d`;
}

type ThreadViewProps = {
  onImportProject: () => void;
  selectedProject: AriaDesktopProjectGroup | null;
  selectedThread: AriaDesktopProjectThreadItem | null;
};

function ThreadView({ onImportProject, selectedProject, selectedThread }: ThreadViewProps) {
  if (!selectedProject) {
    return (
      <div className="thread-design-canvas thread-empty-state">
        <button type="button" className="thread-empty-state-action" onClick={onImportProject}>
          <FolderPlus aria-hidden="true" />
          <span>Import project</span>
        </button>
      </div>
    );
  }

  if (!selectedThread) {
    return (
      <div className="thread-design-canvas thread-empty-state">
        <div className="thread-empty-state-content">
          <h2 className="thread-empty-state-title">{selectedProject.name}</h2>
          <p className="thread-empty-state-copy">
            Create a thread from the project row to start work.
          </p>
        </div>
      </div>
    );
  }

  return <div className="thread-design-canvas" />;
}

function SettingsView() {
  return <div className="settings-design-canvas" />;
}

function ThreadInspectorSurface() {
  return <div className="thread-inspector-surface" />;
}

function ThreadTerminalSurface() {
  return <div className="thread-terminal-surface" />;
}

type ProjectSidebarProps = {
  activeScreen: ActiveScreen;
  collapsedProjectIds: string[];
  onCreateThread: (projectId: string) => void;
  onOpenSettings: () => void;
  onSelectProject: (projectId: string) => void;
  onSelectThread: (projectId: string, threadId: string) => void;
  onToggleProject: (projectId: string, collapsed: boolean) => void;
  projects: AriaDesktopProjectGroup[];
  selectedProjectId: string | null;
  selectedThreadId: string | null;
};

function ProjectSidebar({
  activeScreen,
  collapsedProjectIds,
  onCreateThread,
  onOpenSettings,
  onSelectProject,
  onSelectThread,
  onToggleProject,
  projects,
  selectedProjectId,
  selectedThreadId,
}: ProjectSidebarProps) {
  const collapsedProjectIdSet = new Set(collapsedProjectIds);

  return (
    <div className="desktop-sidebar">
      <div className="desktop-sidebar-primary">
        {projects.map((project) => {
          const isCollapsed = collapsedProjectIdSet.has(project.projectId);
          const isSelectedProject = project.projectId === selectedProjectId;
          const threadListId = `project-thread-list-${project.projectId}`;

          return (
            <section key={project.projectId} className="project-group">
              <div className="project-group-header">
                <button
                  type="button"
                  className={`project-group-name${isSelectedProject ? " is-active" : ""}`}
                  onClick={() => onSelectProject(project.projectId)}
                >
                  {project.name}
                </button>
                <div className="project-group-actions">
                  <DesktopIconButton
                    controlsId={threadListId}
                    expanded={!isCollapsed}
                    icon={
                      isCollapsed ? (
                        <ChevronRight aria-hidden="true" />
                      ) : (
                        <ChevronDown aria-hidden="true" />
                      )
                    }
                    label={
                      isCollapsed
                        ? `Expand ${project.name} threads`
                        : `Collapse ${project.name} threads`
                    }
                    onClick={() => onToggleProject(project.projectId, !isCollapsed)}
                  />
                  <DesktopIconButton
                    icon={<MessageSquarePlus aria-hidden="true" />}
                    label={`Create thread in ${project.name}`}
                    onClick={() => onCreateThread(project.projectId)}
                  />
                </div>
              </div>

              <DesktopCollapsibleSection
                className="thread-list-disclosure"
                collapsed={isCollapsed}
                id={threadListId}
              >
                <div className="thread-list" role="list">
                  {project.threads.map((thread) => (
                    <ThreadListItem
                      key={thread.threadId}
                      isActive={thread.threadId === selectedThreadId}
                      onSelect={() => onSelectThread(project.projectId, thread.threadId)}
                      thread={thread}
                    />
                  ))}
                </div>
              </DesktopCollapsibleSection>
            </section>
          );
        })}
      </div>

      <div className="desktop-sidebar-footer">
        <DesktopSidebarButton
          active={activeScreen === "settings"}
          icon={<Settings2 aria-hidden="true" />}
          label="Settings"
          onClick={onOpenSettings}
        />
      </div>
    </div>
  );
}

type ThreadListItemProps = {
  isActive: boolean;
  onSelect: () => void;
  thread: AriaDesktopProjectThreadItem;
};

function ThreadListItem({ isActive, onSelect, thread }: ThreadListItemProps) {
  return (
    <button
      type="button"
      className={`thread-list-item${isActive ? " is-active" : ""}`}
      onClick={onSelect}
    >
      <span className="thread-list-item-name">{thread.title}</span>
      <span className="thread-list-item-meta">{formatRelativeUpdatedAt(thread.updatedAt)}</span>
    </button>
  );
}

function getSelectedProject(
  shellState: AriaDesktopProjectShellState,
): AriaDesktopProjectGroup | null {
  return (
    shellState.projects.find((project) => project.projectId === shellState.selectedProjectId) ??
    null
  );
}

function getSelectedThread(
  project: AriaDesktopProjectGroup | null,
  shellState: AriaDesktopProjectShellState,
): AriaDesktopProjectThreadItem | null {
  if (!project) {
    return null;
  }

  return project.threads.find((thread) => thread.threadId === shellState.selectedThreadId) ?? null;
}

export function DesktopWorkbenchApp() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("projects");
  const [shellState, setShellState] = useState<AriaDesktopProjectShellState>(EMPTY_SHELL_STATE);

  const selectedProject = getSelectedProject(shellState);
  const selectedThread = getSelectedThread(selectedProject, shellState);

  useEffect(() => {
    let isDisposed = false;

    async function loadProjectShellState(): Promise<void> {
      if (!window.ariaDesktop) {
        return;
      }

      const nextShellState = await window.ariaDesktop.getProjectShellState();

      if (isDisposed) {
        return;
      }

      startTransition(() => {
        setShellState(nextShellState);
      });
    }

    void loadProjectShellState();

    return () => {
      isDisposed = true;
    };
  }, []);

  async function applyShellState(
    loader: () => Promise<AriaDesktopProjectShellState>,
    nextScreen: ActiveScreen = "projects",
  ): Promise<void> {
    if (!window.ariaDesktop) {
      return;
    }

    try {
      const nextShellState = await loader();

      startTransition(() => {
        setActiveScreen(nextScreen);
        setShellState(nextShellState);
      });
    } catch (error) {
      console.error(error);
    }
  }

  function openSettings(): void {
    startTransition(() => {
      setActiveScreen("settings");
    });
  }

  function importProject(): void {
    void applyShellState(() => window.ariaDesktop.importLocalProjectFromDialog());
  }

  function createThread(projectId: string): void {
    void applyShellState(() => window.ariaDesktop.createThread(projectId));
  }

  function selectProject(projectId: string): void {
    void applyShellState(() => window.ariaDesktop.selectProject(projectId));
  }

  function selectThread(projectId: string, threadId: string): void {
    void applyShellState(() => window.ariaDesktop.selectThread(projectId, threadId));
  }

  function toggleProject(projectId: string, collapsed: boolean): void {
    void applyShellState(
      () => window.ariaDesktop.setProjectCollapsed(projectId, collapsed),
      activeScreen,
    );
  }

  const leftSidebarToolbarItems: DesktopBaseLayoutToolbarItem[] = [
    {
      content: (
        <DesktopIconButton
          icon={<FolderPlus aria-hidden="true" />}
          label="Import project"
          onClick={importProject}
        />
      ),
      id: "import-project",
    },
  ];

  const toolbarItems: DesktopBaseLayoutToolbarItem[] =
    activeScreen === "projects" && selectedProject
      ? [
          {
            content: <span className="desktop-toolbar-context">{selectedProject.name}</span>,
            id: "project-context",
          },
        ]
      : [];

  return (
    <DesktopBaseLayout
      bottomBar={
        activeScreen === "projects" && selectedThread ? <ThreadTerminalSurface /> : undefined
      }
      bottomBarTitle="Terminal"
      center={
        activeScreen === "settings" ? (
          <SettingsView />
        ) : (
          <ThreadView
            onImportProject={importProject}
            selectedProject={selectedProject}
            selectedThread={selectedThread}
          />
        )
      }
      leftSidebar={
        <ProjectSidebar
          activeScreen={activeScreen}
          collapsedProjectIds={shellState.collapsedProjectIds}
          onCreateThread={createThread}
          onOpenSettings={openSettings}
          onSelectProject={selectProject}
          onSelectThread={selectThread}
          onToggleProject={toggleProject}
          projects={shellState.projects}
          selectedProjectId={shellState.selectedProjectId}
          selectedThreadId={shellState.selectedThreadId}
        />
      }
      leftSidebarTitle="Projects"
      leftSidebarToolbarItems={leftSidebarToolbarItems}
      rightSidebar={
        activeScreen === "projects" && selectedThread ? <ThreadInspectorSurface /> : undefined
      }
      rightSidebarTitle={
        activeScreen === "projects" && selectedThread ? selectedThread.title : undefined
      }
      showMainTopbar={activeScreen !== "settings"}
      title={
        activeScreen === "projects"
          ? (selectedThread?.title ?? selectedProject?.name ?? "Projects")
          : "Projects"
      }
      toolbarItems={toolbarItems}
    />
  );
}
