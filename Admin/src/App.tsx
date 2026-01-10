import { useEffect, useMemo, useState } from "react";

import ActionButton from "./components/ActionButton";
import AddAppDialog from "./components/AddAppDialog";
import AppShell from "./components/AppShell";
import FileDropzone from "./components/FileDropzone";
import Sidebar, { type NavItem } from "./components/Sidebar";
import Topbar from "./components/Topbar";
import AppsPage from "./pages/AppsPage";
import BuildsPage from "./pages/BuildsPage";
import FutureFlagsPage from "./pages/FutureFlagsPage";
import OverviewPage from "./pages/OverviewPage";
import PipelinesPage from "./pages/PipelinesPage";
import SecurityPage from "./pages/SecurityPage";
import SettingsPage from "./pages/SettingsPage";
import {
  activity,
  apps,
  buildQueue,
  metrics,
  pipelineAlerts,
  pipelineStages,
  securityAudits,
  securityPolicies,
  settingsProfile,
  storageBuckets,
} from "./data/mock";
import { apiFetch } from "./lib/api";
import {
  buildFeatureFlagMap,
  getDefaultFeatureFlags,
} from "./lib/featureFlags";

type PageKey =
  | "overview"
  | "apps"
  | "builds"
  | "flags"
  | "pipelines"
  | "security"
  | "settings";

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "apps", label: "Apps", icon: "apps", badge: "5" },
  { id: "builds", label: "Builds", icon: "builds", badge: "2" },
  {
    id: "flags",
    label: "Future flags",
    icon: "flags",
    featureFlag: "admin.future_flags",
  },
  {
    id: "pipelines",
    label: "Pipelines",
    icon: "pipelines",
    featureFlag: "admin.pipeline_health",
  },
  {
    id: "security",
    label: "Security",
    icon: "security",
    featureFlag: "admin.security_posture",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "settings",
    featureFlag: "admin.workspace_settings",
  },
];

const pageConfig: Record<
  PageKey,
  {
    title: string;
    breadcrumbs: { label: string }[];
    actions: { id: string; label: string; variant?: "primary" | "outline" }[];
  }
> = {
  overview: {
    title: "Release operations",
    breadcrumbs: [{ label: "Home" }, { label: "Overview" }],
    actions: [
      { id: "new-release", label: "New release" },
      { id: "invite-team", label: "Invite team" },
      { id: "audit-policies", label: "Audit policies" },
    ],
  },
  apps: {
    title: "Apps",
    breadcrumbs: [{ label: "Apps" }, { label: "Catalog" }],
    actions: [{ id: "add-app", label: "Add app", variant: "primary" }],
  },
  builds: {
    title: "Latest builds",
    breadcrumbs: [{ label: "Builds" }, { label: "Latest" }],
    actions: [{ id: "trigger-build", label: "Trigger build", variant: "primary" }],
  },
  flags: {
    title: "Future flags",
    breadcrumbs: [{ label: "Governance" }, { label: "Future flags" }],
    actions: [{ id: "create-flag", label: "Create flag", variant: "primary" }],
  },
  pipelines: {
    title: "Pipeline health",
    breadcrumbs: [{ label: "Operations" }, { label: "Pipelines" }],
    actions: [{ id: "run-checks", label: "Run checks", variant: "primary" }],
  },
  security: {
    title: "Security posture",
    breadcrumbs: [{ label: "Governance" }, { label: "Security" }],
    actions: [{ id: "download-report", label: "Download report", variant: "primary" }],
  },
  settings: {
    title: "Workspace settings",
    breadcrumbs: [{ label: "Workspace" }, { label: "Settings" }],
    actions: [{ id: "save-settings", label: "Save changes", variant: "primary" }],
  },
};

const App = () => {
  const [activePage, setActivePage] = useState<PageKey>("overview");
  const [featureFlags, setFeatureFlags] = useState(getDefaultFeatureFlags());
  const [selectedAppName, setSelectedAppName] = useState<string | null>(null);
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const config = pageConfig[activePage];

  useEffect(() => {
    let isMounted = true;
    apiFetch<{ key: string; defaultEnabled?: boolean }[]>("/feature-flags")
      .then((flags) => {
        if (isMounted) {
          setFeatureFlags(buildFeatureFlagMap(Array.isArray(flags) ? flags : []));
        }
      })
      .catch(() => {
        if (isMounted) {
          setFeatureFlags(getDefaultFeatureFlags());
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const visibleNavItems = useMemo(
    () =>
      navItems.filter(
        (item) => !item.featureFlag || featureFlags[item.featureFlag]
      ),
    [featureFlags]
  );

  useEffect(() => {
    const allowed = new Set(visibleNavItems.map((item) => item.id));
    if (!allowed.has(activePage)) {
      const next = visibleNavItems[0]?.id ?? "overview";
      setActivePage(next as PageKey);
    }
  }, [activePage, visibleNavItems]);

  const pageContent = useMemo(() => {
    switch (activePage) {
      case "apps":
        return (
          <AppsPage
            apps={apps}
            onSelectApp={(app) => {
              setSelectedAppName(app.name);
              setActivePage("builds");
            }}
          />
        );
      case "builds":
        return <BuildsPage builds={buildQueue} selectedAppName={selectedAppName} />;
      case "flags":
        return <FutureFlagsPage />;
      case "pipelines":
        return <PipelinesPage stages={pipelineStages} alerts={pipelineAlerts} />;
      case "security":
        return <SecurityPage policies={securityPolicies} audits={securityAudits} />;
      case "settings":
        return <SettingsPage settings={settingsProfile} />;
      case "overview":
      default:
        return (
          <OverviewPage
            metrics={metrics}
            pipelineStages={pipelineStages}
            apps={apps}
            buildQueue={buildQueue}
            activity={activity}
            storageBuckets={storageBuckets}
            showMetrics={featureFlags["admin.overview_metrics"]}
            showPipeline={featureFlags["admin.pipeline_health"]}
            showActivity={featureFlags["admin.activity_stream"]}
            showStorage={featureFlags["admin.storage_usage"]}
          />
        );
    }
  }, [activePage, featureFlags]);

  const handleAction = (actionId: string) => {
    if (actionId === "add-app") {
      setIsAddAppOpen(true);
    }
  };

  return (
    <AppShell
      sidebar={
        <Sidebar
          items={visibleNavItems}
          activeId={activePage}
          onSelect={(id) => setActivePage(id as PageKey)}
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
        title={config.title}
        breadcrumbs={config.breadcrumbs}
        actions={
          <>
            {config.actions.map((action) => (
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
      {pageContent}
      <AddAppDialog isOpen={isAddAppOpen} onClose={() => setIsAddAppOpen(false)} />
    </AppShell>
  );
};

export default App;
