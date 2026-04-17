import { DesktopBaseLayout } from "./components/DesktopBaseLayout.js";

export function App() {
  return (
    <main className="app-shell">
      <DesktopBaseLayout
        bottomBar={<div className="pane-copy">Bottom bar</div>}
        bottomBarTitle="Terminal"
        title="Desktop"
        leftSidebarTitle="Left Sidebar"
        rightSidebarTitle="Right Sidebar"
        leftSidebar={<div className="pane-copy">Left sidebar</div>}
        rightSidebar={<div className="pane-copy">Right sidebar</div>}
        center={<div className="pane-copy">Center pane</div>}
      />
    </main>
  );
}
