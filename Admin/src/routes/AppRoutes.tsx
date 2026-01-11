import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
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
import LoginPage from "../pages/LoginPage";
import OverviewPage from "../pages/OverviewPage";
import PipelinesPage from "../pages/PipelinesPage";
import SecurityPage from "../pages/SecurityPage";
import SettingsPage from "../pages/SettingsPage";
import {
  activity,
  buildQueue,
  metrics,
  apps as overviewApps,
  pipelineAlerts,
  pipelineStages,
  securityAudits,
  securityPolicies,
  storageBuckets,
} from "../data/mock";
import { apiFetch, apiUpload } from "../lib/api";
import {
  buildFeatureFlagMap,
  getDefaultFeatureFlags,
  type FeatureFlagKey,
} from "../lib/featureFlags";
import type { ApiApp, ApiBuild } from "../lib/apps";
import { isTeamAdmin, type TeamMember, type TeamSummary } from "../lib/teams";
import type { NavItem } from "../components/Sidebar";
import RequireAuth from "./RequireAuth";

type NavItemConfig = NavItem & { superOnly?: boolean };

const navItems: NavItemConfig[] = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "apps", label: "Apps", icon: "apps", badge: "5" },
  { id: "builds", label: "Builds", icon: "builds", badge: "2" },
  {
    id: "flags",
    label: "Future flags",
    icon: "flags",
    featureFlag: "admin.future_flags",
    superOnly: true,
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
  superOnly?: boolean;
};

const AppRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [featureFlags, setFeatureFlags] = useState(getDefaultFeatureFlags());
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [activeTeamId, setActiveTeamId] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [apps, setApps] = useState<ApiApp[]>([]);
  const [ingestNonce, setIngestNonce] = useState(0);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [hasToken, setHasToken] = useState(Boolean(localStorage.getItem("accessToken")));

  const activeTeam = useMemo(
    () => (activeTeamId ? teams.find((team) => team.id === activeTeamId) || null : null),
    [teams, activeTeamId]
  );
  const isAdmin = isTeamAdmin(activeTeam?.memberRole);
  const isSaas = import.meta.env.VITE_SAAS === "true";

  useEffect(() => {
    setHasToken(Boolean(localStorage.getItem("accessToken")));
  }, [location.pathname]);

  useEffect(() => {
    if (!hasToken) {
      setIsSuperUser(false);
      return;
    }
    let isMounted = true;
    apiFetch<{ isSuperUser?: boolean }>("/auth/session")
      .then((payload) => {
        if (isMounted) {
          setIsSuperUser(Boolean(payload?.isSuperUser));
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsSuperUser(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [hasToken, location.pathname]);

  const loadApps = useCallback(async () => {
    try {
      const payload = await apiFetch<ApiApp[]>("/apps?limit=200");
      setApps(Array.isArray(payload) ? payload : []);
    } catch {
      setApps([]);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!hasToken) {
      setFeatureFlags(getDefaultFeatureFlags());
      return () => undefined;
    }
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
  }, [hasToken]);

  useEffect(() => {
    if (!hasToken) {
      setApps([]);
      return;
    }
    void loadApps();
  }, [loadApps, ingestNonce, hasToken]);

  useEffect(() => {
    let isMounted = true;
    if (!hasToken) {
      setTeams([]);
      setActiveTeamId("");
      return () => undefined;
    }
    apiFetch<{ teams: TeamSummary[] }>("/teams")
      .then((payload) => {
        if (!isMounted) return;
        const list = Array.isArray(payload?.teams) ? payload.teams : [];
        setTeams(list);
        setActiveTeamId((current) => {
          if (list.length === 0) {
            return "";
          }
          if (current && list.some((team) => team.id === current)) {
            return current;
          }
          return list[0].id;
        });
      })
      .catch(() => {
        if (isMounted) {
          setTeams([]);
          setActiveTeamId("");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [hasToken]);

  useEffect(() => {
    if (!activeTeam?.id || !isAdmin || !hasToken) {
      setTeamMembers([]);
      return;
    }
    let isMounted = true;
    apiFetch<{ users: TeamMember[] }>(`/teams/${activeTeam.id}/users`, {
      headers: {
        "x-team-id": activeTeam.id,
      },
    })
      .then((payload) => {
        if (isMounted) {
          setTeamMembers(Array.isArray(payload?.users) ? payload.users : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTeamMembers([]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [activeTeam?.id, isAdmin]);

  const routes: RouteConfig[] = [
    {
      id: "overview",
      path: "/overview",
      element: (
        <OverviewPage
          metrics={metrics}
          pipelineStages={pipelineStages}
          apps={overviewApps}
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
          apps={apps}
          onSelectApp={(appId) => navigate(`/apps/${appId}/builds`)}
        />
      ),
      navId: "apps",
    },
    {
      id: "builds",
      path: "/builds",
      element: <BuildsRoute apps={apps} ingestNonce={ingestNonce} />,
      navId: "builds",
    },
    {
      id: "builds",
      path: "/apps/:appId/builds",
      element: <BuildsRoute apps={apps} ingestNonce={ingestNonce} />,
    },
    {
      id: "flags",
      path: "/flags",
      element: <FutureFlagsPage />,
      navId: "flags",
      featureFlag: "admin.future_flags",
      superOnly: true,
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
          teamMembers={teamMembers}
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
        if (item.superOnly && !isSuperUser) {
          return false;
        }
        if (item.id === "settings" && !isAdmin) {
          return false;
        }
        return !item.featureFlag || featureFlags[item.featureFlag];
      }),
    [featureFlags, isAdmin, isSuperUser]
  );

  const activeRoute = useMemo(() => {
    const match = routes.find((route) => matchPath(route.path, location.pathname));
    return match ?? routes[0];
  }, [routes, location.pathname]);

  const page = pageConfig[activeRoute.id];
  const handleTeamChange = (teamId: string) => {
    setActiveTeamId(teamId);
    if (!teamId) {
      return;
    }
    apiFetch<{ activeTeamId: string }>(`/teams/${teamId}/select`, {
      method: "POST",
      headers: {
        "x-team-id": teamId,
      },
    }).catch(() => undefined);
  };

  const handleIngest = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      await apiUpload("/ingest/upload", formData);
      await loadApps();
      setIngestNonce((current) => current + 1);
    },
    [loadApps]
  );

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AdminLayout
              navItems={visibleNavItems}
              activeNavId={activeRoute.navId ?? activeRoute.id}
              breadcrumbs={page.breadcrumbs}
              title={page.title}
              actions={page.actions}
              onTeamChange={handleTeamChange}
              activeTeamId={activeTeamId}
              teams={teams}
              onUpload={handleIngest}
            />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/overview" replace />} />
        {routes.map((route) => {
          const shouldHide =
            (route.featureFlag && !featureFlags[route.featureFlag]) ||
            (route.adminOnly && !isAdmin) ||
            (route.superOnly && !isSuperUser);

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

const AppsRoute = ({
  apps,
  onSelectApp,
}: {
  apps: ApiApp[];
  onSelectApp: (appId: string) => void;
}) => {
  return <AppsPage apps={apps} onSelectApp={(app) => onSelectApp(app.id)} />;
};

const BuildsRoute = ({
  apps,
  ingestNonce,
}: {
  apps: ApiApp[];
  ingestNonce: number;
}) => {
  const { appId } = useParams();
  const [builds, setBuilds] = useState<ApiBuild[]>([]);
  const selectedApp = apps.find((app) => app.id === appId) ?? null;

  useEffect(() => {
    let isMounted = true;
    const query = appId ? `/builds?appId=${appId}` : "/builds";
    apiFetch<ApiBuild[]>(query)
      .then((payload) => {
        if (isMounted) {
          setBuilds(Array.isArray(payload) ? payload : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBuilds([]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [appId, ingestNonce]);

  return <BuildsPage builds={builds} selectedAppName={selectedApp?.name ?? null} />;
};

export default AppRoutes;
