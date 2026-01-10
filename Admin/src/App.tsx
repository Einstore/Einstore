import { useMemo, useState } from "react";

import ActionButton from "./components/ActionButton";
import AppShell from "./components/AppShell";
import Sidebar, { type NavItem } from "./components/Sidebar";
import Topbar from "./components/Topbar";
import AppsPage from "./pages/AppsPage";
import BuildsPage from "./pages/BuildsPage";
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

type PageKey =
  | "overview"
  | "apps"
  | "builds"
  | "pipelines"
  | "security"
  | "settings";

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: "O" },
  { id: "apps", label: "Apps", icon: "#", badge: "5" },
  { id: "builds", label: "Builds", icon: "*", badge: "2" },
  { id: "pipelines", label: "Pipelines", icon: ">" },
  { id: "security", label: "Security", icon: "!" },
  { id: "settings", label: "Settings", icon: "=" },
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
  const config = pageConfig[activePage];

  const pageContent = useMemo(() => {
    switch (activePage) {
      case "apps":
        return <AppsPage apps={apps} />;
      case "builds":
        return <BuildsPage builds={buildQueue} />;
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
          />
        );
    }
  }, [activePage]);

  return (
    <AppShell
      sidebar={
        <Sidebar
          items={navItems}
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
