import { startTransition, useState } from "react";
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
  appIcons?: Record<string, string>;
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
  appIcons,
}: AdminLayoutProps) => {
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

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
    startTransition(() => {
      navigate(`/${id}`);
    });
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
        activeTeamId={activeTeamId}
        appIcons={appIcons}
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
        <div className="flex min-h-full flex-col">
          <Outlet />
          <p className="mt-10 text-center text-xs text-slate-500 dark:text-slate-400">
            Made with love in Scotland. © {currentYear}{" "}
            <a
              href="https://www.unlikeotherai.com"
              className="font-semibold text-slate-500 transition-colors hover:underline dark:text-slate-400"
              target="_blank"
              rel="noreferrer"
            >
              Unlike Other AI
            </a>
          </p>
        </div>
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
