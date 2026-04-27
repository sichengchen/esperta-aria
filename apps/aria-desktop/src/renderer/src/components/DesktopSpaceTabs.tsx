export type DesktopSpace = "aria" | "projects";

type DesktopSpaceTabsProps = {
  activeSpace: DesktopSpace;
  onSelectSpace: (space: DesktopSpace) => void;
};

const SPACES: ReadonlyArray<{ id: DesktopSpace; label: string }> = [
  { id: "aria", label: "Chat" },
  { id: "projects", label: "Projects" },
];

export function DesktopSpaceTabs({ activeSpace, onSelectSpace }: DesktopSpaceTabsProps) {
  return (
    <div className="desktop-space-tabs" role="tablist" aria-label="Workspace space">
      {SPACES.map((space) => (
        <button
          key={space.id}
          type="button"
          role="tab"
          aria-selected={space.id === activeSpace}
          className={`desktop-space-tab${space.id === activeSpace ? " is-active" : ""}`}
          onClick={() => onSelectSpace(space.id)}
        >
          {space.label}
        </button>
      ))}
    </div>
  );
}
