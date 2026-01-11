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
import type { TeamSummary } from "../lib/teams";

type AdminLayoutProps = {
  navItems: readonly NavItem[];
  activeNavId: string;
  title: string;
  breadcrumbs: { label: string }[];
  actions: { id: string; label: string; variant?: "primary" | "outline" }[];
  onTeamChange: (teamId: string) => void;
  activeTeamId: string;
  teams: TeamSummary[];
  onUpload: (file: File) => Promise<void>;
};

const AdminLayout = ({
  navItems,
  activeNavId,
  title,
  breadcrumbs,
  actions,
  onTeamChange,
  activeTeamId,
  teams,
  onUpload,
}: AdminLayoutProps) => {
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [quickUploadStatus, setQuickUploadStatus] = useState("");
  const [quickUploadBusy, setQuickUploadBusy] = useState(false);
  const navigate = useNavigate();

  const handleAction = (actionId: string) => {
    if (actionId === "add-app") {
      setIsAddAppOpen(true);
    }
  };

  const handleQuickUpload = async (file: File | null) => {
    if (!file || quickUploadBusy) {
      return;
    }
    setQuickUploadBusy(true);
    setQuickUploadStatus("Uploading build...");
    try {
      await onUpload(file);
      setQuickUploadStatus("Build ingested.");
    } catch (err) {
      setQuickUploadStatus(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setQuickUploadBusy(false);
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
              onFileSelect={handleQuickUpload}
              disabled={quickUploadBusy}
              statusMessage={quickUploadStatus || undefined}
            />
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
