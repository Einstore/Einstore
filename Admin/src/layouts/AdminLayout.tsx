import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import ActionButton from "../components/ActionButton";
import AddAppDialog from "../components/AddAppDialog";
import AppShell from "../components/AppShell";
import Sidebar from "../components/Sidebar";
import TeamSwitcher from "../components/TeamSwitcher";
import Topbar from "../components/Topbar";
import type { NavItem } from "../components/Sidebar";
import { apiFetch } from "../lib/api";
import type { TeamSummary } from "../lib/teams";
import type { SessionUser } from "../lib/session";
import SidebarUploadDropzone from "../components/SidebarUploadDropzone";

type AdminLayoutProps = {
  navItems: readonly NavItem[];
  activeNavId: string;
  title: string;
  breadcrumbs: { label: string }[];
  actions: { id: string; label: string; variant?: "primary" | "outline" }[];
  onTeamChange: (teamId: string) => void;
  onCreateTeam?: (name: string) => Promise<void>;
  activeTeamId: string;
  teams: TeamSummary[];
  onUpload: (file: File) => Promise<void>;
  user?: SessionUser | null;
};

const AdminLayout = ({
  navItems,
  activeNavId,
  title,
  breadcrumbs,
  actions,
  onTeamChange,
  onCreateTeam,
  activeTeamId,
  teams,
  onUpload,
  user,
}: AdminLayoutProps) => {
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (actionId: string) => {
    if (actionId === "add-app" || actionId === "upload-build") {
      setIsAddAppOpen(true);
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      await apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  const handleNavSelect = (id: string) => {
    navigate(`/${id}`);
    setIsSidebarOpen(false);
  };

  return (
    <AppShell
      sidebar={
        <Sidebar
          items={navItems as NavItem[]}
          activeId={activeNavId}
          onSelect={handleNavSelect}
          teamSwitcher={
            <TeamSwitcher
              teams={teams}
              activeTeamId={activeTeamId}
              onChange={onTeamChange}
              onCreateTeam={onCreateTeam}
            />
          }
          dropzone={<SidebarUploadDropzone onUpload={onUpload} />}
        />
      }
      isSidebarOpen={isSidebarOpen}
      onSidebarClose={() => setIsSidebarOpen(false)}
    >
      <Topbar
        title={title}
        breadcrumbs={breadcrumbs}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        onLogout={handleLogout}
        user={user}
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
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
      <AddAppDialog
        isOpen={isAddAppOpen}
        onClose={() => setIsAddAppOpen(false)}
        onUpload={onUpload}
      />
    </AppShell>
  );
};

export default AdminLayout;
