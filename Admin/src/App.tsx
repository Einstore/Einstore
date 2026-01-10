import { useEffect, useMemo, useState } from "react";

import ActionButton from "./components/ActionButton";
import AppShell from "./components/AppShell";
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
    subtitle: string;
    actions: { label: string; variant?: "primary" | "outline" }[];
  }
> = {
  overview: {
    title: "Release operations",
    subtitle:
      "Control distribution, pipelines, and compliance from a single workspace.",
    actions: [
      { label: "New release" },
      { label: "Invite team" },
      { label: "Audit policies" },
    ],
  },
  apps: {
    title: "Apps catalog",
    subtitle: "Manage app inventory, owners, and distribution readiness.",
    actions: [{ label: "Add app", variant: "primary" }],
  },
  builds: {
    title: "Build operations",
    subtitle: "Track jobs, failures, and release readiness signals.",
    actions: [{ label: "Trigger build", variant: "primary" }],
  },
  flags: {
    title: "Future flags",
    subtitle: "Create and manage flags before the next rollout window.",
    actions: [{ label: "Create flag", variant: "primary" }],
  },
  pipelines: {
    title: "Pipeline health",
    subtitle: "Monitor delivery throughput and escalation timelines.",
    actions: [{ label: "Run checks", variant: "primary" }],
  },
  security: {
    title: "Security posture",
    subtitle: "Review policy coverage and access review timelines.",
    actions: [{ label: "Download report", variant: "primary" }],
  },
  settings: {
    title: "Workspace settings",
    subtitle: "Control defaults, alerts, and review cadence.",
    actions: [{ label: "Save changes", variant: "primary" }],
  },
};

const App = () => {
  const [activePage, setActivePage] = useState<PageKey>("overview");
  const [featureFlags, setFeatureFlags] = useState(getDefaultFeatureFlags());
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
        return <AppsPage apps={apps} />;
      case "builds":
        return <BuildsPage builds={buildQueue} />;
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

  return (
    <AppShell
      sidebar={
        <Sidebar
          items={visibleNavItems}
          activeId={activePage}
          onSelect={(id) => setActivePage(id as PageKey)}
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
        subtitle={config.subtitle}
        actions={
          <>
            {config.actions.map((action) => (
              <ActionButton
                key={action.label}
                label={action.label}
                variant={action.variant ?? "outline"}
              />
            ))}
          </>
        }
      />
      {pageContent}
    </AppShell>
  );
};

export default App;
