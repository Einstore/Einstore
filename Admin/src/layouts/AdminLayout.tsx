import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import ActionButton from "../components/ActionButton";
import AddAppDialog from "../components/AddAppDialog";
import AppShell from "../components/AppShell";
import FileDropzone from "../components/FileDropzone";
import Sidebar from "../components/Sidebar";
import TeamSwitcher from "../components/TeamSwitcher";
import Topbar from "../components/Topbar";
import type { NavItem } from "../components/Sidebar";
import { teams } from "../data/mock";

type AdminLayoutProps = {
  navItems: readonly NavItem[];
  activeNavId: string;
  title: string;
  breadcrumbs: { label: string }[];
  actions: { id: string; label: string; variant?: "primary" | "outline" }[];
  onTeamChange: (teamId: string) => void;
  activeTeamId: string;
};

const AdminLayout = ({
  navItems,
  activeNavId,
  title,
  breadcrumbs,
  actions,
  onTeamChange,
  activeTeamId,
}: AdminLayoutProps) => {
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (actionId: string) => {
    if (actionId === "add-app") {
      setIsAddAppOpen(true);
    }
  };

  return (
    <AppShell
      sidebar={
        <Sidebar
          items={navItems as NavItem[]}
          activeId={activeNavId}
          onSelect={(id) => navigate(`/${id}`)}
          teamSwitcher={
            <TeamSwitcher
              teams={teams}
              activeTeamId={activeTeamId}
              onChange={onTeamChange}
            />
          }
          dropzone={
            <FileDropzone
              label="Quick upload"
              helper="Drop a build to start ingestion."
              onFileSelect={() => undefined}
            />
          }
          footer={
            <div className="rounded-2xl border border-ink/10 bg-sand p-4 text-sm text-ink/70">
              Next checkpoint: SOC2 evidence export due in 2 days.
            </div>
          }
        />
      }
    >
      <Topbar
        title={title}
        breadcrumbs={breadcrumbs}
        actions={
          <>
            {actions.map((action) => (
              <ActionButton
                key={action.label}
                label={action.label}
                variant={action.variant ?? "outline"}
                onClick={() => handleAction(action.id)}
              />
            ))}
          </>
        }
      />
      <Outlet />
      <AddAppDialog isOpen={isAddAppOpen} onClose={() => setIsAddAppOpen(false)} />
    </AppShell>
  );
};

export default AdminLayout;
