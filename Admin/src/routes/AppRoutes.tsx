import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  Navigate,
  Route,
  Routes,
  matchPath,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";
import AppsPage from "../pages/AppsPage";
import BuildsPage from "../pages/BuildsPage";
import FutureFlagsPage from "../pages/FutureFlagsPage";
import OverviewPage from "../pages/OverviewPage";
import PipelinesPage from "../pages/PipelinesPage";
import SecurityPage from "../pages/SecurityPage";
import SettingsPage from "../pages/SettingsPage";
import {
  activity,
  apps,
  buildQueue,
  currentUser,
  metrics,
  pipelineAlerts,
  pipelineStages,
  securityAudits,
  securityPolicies,
  storageBuckets,
  teamMembers,
  teams,
} from "../data/mock";
import { apiFetch } from "../lib/api";
import {
  buildFeatureFlagMap,
  getDefaultFeatureFlags,
  type FeatureFlagKey,
} from "../lib/featureFlags";

const navItems = [
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
] as const;

const pageConfig = {
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
    title: "Team settings",
    breadcrumbs: [{ label: "Workspace" }, { label: "Settings" }],
    actions: [{ id: "save-settings", label: "Save changes", variant: "primary" }],
  },
};

type PageKey = keyof typeof pageConfig;

type RouteConfig = {
  id: PageKey;
  path: string;
  element: ReactElement;
  navId?: string;
  featureFlag?: FeatureFlagKey;
  adminOnly?: boolean;
};

const AppRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [featureFlags, setFeatureFlags] = useState(getDefaultFeatureFlags());
  const [activeTeamId, setActiveTeamId] = useState("team-all");

  const isAdmin = currentUser.role === "admin";
  const isSaas = import.meta.env.VITE_SAAS === "true";

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

  const routes: RouteConfig[] = [
    {
      id: "overview",
      path: "/overview",
      element: (
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
      ),
      navId: "overview",
    },
    {
      id: "apps",
      path: "/apps",
      element: (
        <AppsRoute
          onSelectApp={(appId) => navigate(`/apps/${appId}/builds`)}
        />
      ),
      navId: "apps",
    },
    {
      id: "builds",
      path: "/builds",
      element: <BuildsRoute />,
      navId: "builds",
    },
    {
      id: "builds",
      path: "/apps/:appId/builds",
      element: <BuildsRoute />,
    },
    {
      id: "flags",
      path: "/flags",
      element: <FutureFlagsPage />,
      navId: "flags",
      featureFlag: "admin.future_flags",
    },
    {
      id: "pipelines",
      path: "/pipelines",
      element: <PipelinesPage stages={pipelineStages} alerts={pipelineAlerts} />,
      navId: "pipelines",
      featureFlag: "admin.pipeline_health",
    },
    {
      id: "security",
      path: "/security",
      element: <SecurityPage policies={securityPolicies} audits={securityAudits} />,
      navId: "security",
      featureFlag: "admin.security_posture",
    },
    {
      id: "settings",
      path: "/settings",
      element: (
        <SettingsPage
          teams={teams}
          activeTeamId={activeTeamId}
          teamMembers={teamMembers[activeTeamId] ?? []}
          isSaas={isSaas}
        />
      ),
      navId: "settings",
      featureFlag: "admin.workspace_settings",
      adminOnly: true,
    },
  ];

  const visibleNavItems = useMemo(
    () =>
      navItems.filter((item) => {
        if (item.id === "settings" && !isAdmin) {
          return false;
        }
        return !item.featureFlag || featureFlags[item.featureFlag];
      }),
    [featureFlags, isAdmin]
  );

  const activeRoute = useMemo(() => {
    const match = routes.find((route) => matchPath(route.path, location.pathname));
    return match ?? routes[0];
  }, [routes, location.pathname]);

  const page = pageConfig[activeRoute.id];

  return (
    <Routes>
      <Route
        element={
          <AdminLayout
            navItems={visibleNavItems}
            activeNavId={activeRoute.navId ?? activeRoute.id}
            breadcrumbs={page.breadcrumbs}
            title={page.title}
            actions={page.actions}
            onTeamChange={setActiveTeamId}
            activeTeamId={activeTeamId}
          />
        }
      >
        <Route path="/" element={<Navigate to="/overview" replace />} />
        {routes.map((route) => {
          const shouldHide =
            (route.featureFlag && !featureFlags[route.featureFlag]) ||
            (route.adminOnly && !isAdmin);

          return (
            <Route
              key={route.path}
              path={route.path}
              element={shouldHide ? <Navigate to="/overview" replace /> : route.element}
            />
          );
        })}
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  );
};

const AppsRoute = ({ onSelectApp }: { onSelectApp: (appId: string) => void }) => {
  return <AppsPage apps={apps} onSelectApp={(app) => onSelectApp(app.id)} />;
};

const BuildsRoute = () => {
  const { appId } = useParams();
  const selectedApp = apps.find((app) => app.id === appId) ?? null;

  return (
    <BuildsPage
      builds={buildQueue}
      selectedAppId={appId ?? null}
      selectedAppName={selectedApp?.name ?? null}
    />
  );
};

export default AppRoutes;
