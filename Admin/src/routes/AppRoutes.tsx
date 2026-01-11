import { useCallback, useEffect, useMemo, useState } from "react";
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
import SettingsPage from "../pages/SettingsPage";
import BuildDetailPage from "../pages/BuildDetailPage";
import AppBuildsPage from "../pages/AppBuildsPage";
import {
  activity,
  buildQueue,
  metrics,
  apps as overviewApps,
  pipelineAlerts,
  pipelineStages,
  securityAudits,
  securityPolicies,
} from "../data/mock";
import { apiFetch, apiUpload } from "../lib/api";
import { buildFeatureFlagMap, getDefaultFeatureFlags } from "../lib/featureFlags";
import {
  pickPrimaryIcon,
  type ApiApp,
  type ApiBuild,
  type ApiBuildIconResponse,
  type ApiBuildMetadata,
} from "../lib/apps";
import { enableAnalytics, trackPageView } from "../lib/analytics";
import { useSessionState } from "../lib/session";
import RequireAuth from "./RequireAuth";
import { navItems, pageConfig, type RouteConfig } from "./config";
import { adminFeatureFlagDefinitions } from "../data/featureFlagDefinitions";
import type { StorageUsageResponse, StorageUsageUser } from "../types/usage";
import type { AnalyticsSettings } from "../types/settings";
import {
  privateNavItems,
  privatePageConfig,
  privateRoutes,
} from "../private/routes.generated";

const AppRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [featureFlags, setFeatureFlags] = useState(getDefaultFeatureFlags());
  const [apps, setApps] = useState<ApiApp[]>([]);
  const [appIcons, setAppIcons] = useState<Record<string, string>>({});
  const [ingestNonce, setIngestNonce] = useState(0);
  const [storageUsage, setStorageUsage] = useState<StorageUsageUser[]>([]);
  const [storageUsageTotalBytes, setStorageUsageTotalBytes] = useState(0);
  const [isLoadingStorageUsage, setIsLoadingStorageUsage] = useState(false);
  const [analyticsKey, setAnalyticsKey] = useState<string | null>(null);
  const {
    hasToken,
    isSuperUser,
    teams,
    activeTeamId,
    teamMembers,
    isAdmin,
    selectTeam,
    createTeam,
    badges,
    me,
  } = useSessionState(location.pathname);
  const isSaas = import.meta.env.VITE_SAAS === "true";

  const loadApps = useCallback(async () => {
    if (!activeTeamId) {
      setApps([]);
      return;
    }
    try {
      const payload = await apiFetch<ApiApp[]>("/apps?limit=200", {
        headers: { "x-team-id": activeTeamId },
      });
      setApps(Array.isArray(payload) ? payload : []);
    } catch {
      setApps([]);
    }
  }, [activeTeamId]);

  useEffect(() => {
    let isMounted = true;
    if (!hasToken) {
      setFeatureFlags(getDefaultFeatureFlags());
      return () => undefined;
    }
    apiFetch("/feature-flags/discover", {
      method: "POST",
      body: JSON.stringify({ flags: adminFeatureFlagDefinitions }),
    })
      .catch(() => undefined)
      .finally(() => {
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
      });
    return () => {
      isMounted = false;
    };
  }, [activeTeamId, hasToken]);

  useEffect(() => {
    let isMounted = true;
    if (!hasToken) {
      setAnalyticsKey(null);
      return () => {
        isMounted = false;
      };
    }
    apiFetch<AnalyticsSettings>("/settings/analytics")
      .then((payload) => {
        if (!isMounted) return;
        const key = payload?.gaMeasurementId ?? null;
        setAnalyticsKey(key);
        if (key) {
          enableAnalytics(key);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAnalyticsKey(null);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [hasToken]);

  useEffect(() => {
    let isMounted = true;
    if (!hasToken || !activeTeamId) {
      setStorageUsage([]);
      setStorageUsageTotalBytes(0);
      setIsLoadingStorageUsage(false);
      return () => {
        isMounted = false;
      };
    }
    setIsLoadingStorageUsage(true);
    apiFetch<StorageUsageResponse>("/usage/storage/users", {
      headers: {
        "x-team-id": activeTeamId,
      },
    })
      .then((payload) => {
        if (!isMounted) return;
        const users = Array.isArray(payload?.users) ? payload.users : [];
        setStorageUsage(users);
        setStorageUsageTotalBytes(
          users.reduce((sum, user) => sum + (user.totalBytes ?? 0), 0)
        );
      })
      .catch(() => {
        if (isMounted) {
          setStorageUsage([]);
          setStorageUsageTotalBytes(0);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingStorageUsage(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [activeTeamId, hasToken, ingestNonce]);

  useEffect(() => {
    if (analyticsKey) {
      enableAnalytics(analyticsKey);
      trackPageView(location.pathname + location.search);
    }
  }, [analyticsKey, location.pathname, location.search]);

  useEffect(() => {
    if (!hasToken || !activeTeamId) {
      setApps([]);
      return;
    }
    void loadApps();
  }, [loadApps, ingestNonce, hasToken, activeTeamId]);

  useEffect(() => {
    let isMounted = true;
    if (!hasToken || !apps.length || !activeTeamId) {
      setAppIcons({});
      return () => {
        isMounted = false;
      };
    }

    setAppIcons({});
    const queue = [...apps];
    const results: [string, string][] = [];

    const worker = async () => {
      while (queue.length) {
        const app = queue.shift();
        if (!app) continue;
        try {
          const builds = await apiFetch<ApiBuild[]>(`/builds?appId=${app.id}&limit=1`, {
            headers: { "x-team-id": activeTeamId },
          });
          const latestBuild = Array.isArray(builds) ? builds[0] : null;
          if (!latestBuild) continue;
          const iconResponse = await apiFetch<ApiBuildIconResponse>(
            `/builds/${latestBuild.id}/icons`,
            {
              headers: { "x-team-id": activeTeamId },
            }
          );
          const icon = pickPrimaryIcon(iconResponse?.items);
          const iconPath = icon?.dataUrl ?? icon?.url;
          if (iconPath) {
            results.push([app.id, iconPath]);
          }
        } catch {
          // Ignore icon lookup errors to avoid blocking the page
        }
      }
    };

    const workers = Array.from({ length: Math.min(4, queue.length) }, () => worker());

    void Promise.all(workers).then(() => {
      if (isMounted) {
        setAppIcons(Object.fromEntries(results));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [apps, hasToken, activeTeamId]);


  const coreRoutes: RouteConfig[] = [
    {
      id: "overview",
      path: "/overview",
      element: (
        <OverviewPage
          metrics={metrics}
          apps={overviewApps}
          buildQueue={buildQueue}
          activity={activity}
          storageUsage={storageUsage}
          storageTotalBytes={storageUsageTotalBytes}
          isStorageLoading={isLoadingStorageUsage}
          showMetrics={featureFlags["admin.overview_metrics"]}
          showActivity
          showStorage
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
          appIcons={appIcons}
          onSelectApp={(appId) => navigate(`/apps/${appId}/builds`)}
        />
      ),
      navId: "apps",
    },
    {
      id: "builds",
      path: "/builds",
      element: <LatestBuildsRoute ingestNonce={ingestNonce} activeTeamId={activeTeamId} />,
      navId: "builds",
    },
    {
      id: "builds",
      path: "/apps/:appId/builds",
      element: (
        <AppBuildsRoute
          apps={apps}
          appIcons={appIcons}
          ingestNonce={ingestNonce}
          activeTeamId={activeTeamId}
        />
      ),
    },
    {
      id: "build-detail",
      path: "/builds/:buildId",
      element: <BuildDetailRoute activeTeamId={activeTeamId} />,
      navId: "builds",
    },
    {
      id: "build-detail",
      path: "/apps/:appId/builds/:buildId",
      element: <BuildDetailRoute activeTeamId={activeTeamId} />,
      navId: "builds",
    },
    {
      id: "flags",
      path: "/flags",
      element: <FutureFlagsPage />,
      navId: "flags",
      superOnly: true,
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
          isSuperUser={isSuperUser}
          onAnalyticsKeySaved={setAnalyticsKey}
        />
      ),
      navId: "settings",
      adminOnly: true,
    },
    {
      id: "api-keys",
      path: "/api-keys",
      element: (
        <SettingsPage
          teams={teams}
          activeTeamId={activeTeamId}
          teamMembers={teamMembers}
          isSaas={isSaas}
          isSuperUser={isSuperUser}
          onAnalyticsKeySaved={setAnalyticsKey}
          initialTab="api-keys"
        />
      ),
      navId: "api-keys",
      adminOnly: true,
    },
  ];

  const routes: RouteConfig[] = [...coreRoutes, ...privateRoutes];

  const visibleNavItems = useMemo(() => {
    const sortedPrivate = [...privateNavItems].sort((a, b) => a.label.localeCompare(b.label));
    const settingsIndex = navItems.findIndex((item) => item.id === "settings");
    const beforeSettings = settingsIndex >= 0 ? navItems.slice(0, settingsIndex) : navItems;
    const afterSettings = settingsIndex >= 0 ? navItems.slice(settingsIndex) : [];
    const merged = [...beforeSettings, ...sortedPrivate, ...afterSettings];

    const withBadges = merged.map((item) => {
      if (item.id === "apps") {
        return { ...item, badge: badges.apps ? String(badges.apps) : undefined };
      }
      if (item.id === "builds") {
        return { ...item, badge: badges.builds ? String(badges.builds) : undefined };
      }
      return item;
    });
    return withBadges.filter((item) => {
      if (item.featureFlag && !featureFlags[item.featureFlag]) {
        return false;
      }
      if (item.superOnly && !isSuperUser) {
        return false;
      }
      if (item.adminOnly && !isAdmin) {
        return false;
      }
      if ((item.id === "settings" || item.id === "api-keys") && !isAdmin) {
        return false;
      }
      return true;
    });
  }, [featureFlags, isAdmin, isSuperUser, badges.apps, badges.builds]);

  const activeRoute = useMemo(() => {
    const match = routes.find((route) =>
      matchPath({ path: route.path, end: true }, location.pathname)
    );
    return match ?? routes[0];
  }, [routes, location.pathname]);

  const page =
    pageConfig[activeRoute.id as keyof typeof pageConfig] ??
    privatePageConfig[activeRoute.id] ??
    pageConfig.overview;

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
              onTeamChange={selectTeam}
              onCreateTeam={createTeam}
              activeTeamId={activeTeamId}
              teams={teams}
              onUpload={handleIngest}
              user={me}
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
  appIcons,
  onSelectApp,
}: {
  apps: ApiApp[];
  appIcons: Record<string, string>;
  onSelectApp: (appId: string) => void;
}) => {
  return (
    <AppsPage
      apps={apps}
      appIcons={appIcons}
      onSelectApp={(app) => onSelectApp(app.id)}
    />
  );
};

const BuildDetailRoute = ({ activeTeamId }: { activeTeamId: string }) => {
  const { buildId } = useParams();
  const [build, setBuild] = useState<ApiBuildMetadata | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setBuild(null);
    setError(null);
    if (!buildId) {
      setIsLoading(false);
      setError("Build not found.");
      return () => {
        isMounted = false;
      };
    }
    setIsLoading(true);
    apiFetch<ApiBuildMetadata>(`/builds/${buildId}/metadata`, {
      headers: { "x-team-id": activeTeamId },
    })
      .then((payload) => {
        if (!isMounted) return;
        setBuild(payload ?? null);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Unable to load build details.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [buildId]);

  useEffect(() => {
    let isMounted = true;
    if (!buildId) {
      setIconUrl(null);
      return () => {
        isMounted = false;
      };
    }
    apiFetch<ApiBuildIconResponse>(`/builds/${buildId}/icons`, {
      headers: { "x-team-id": activeTeamId },
    })
      .then((payload) => {
        if (!isMounted) return;
        const primary = pickPrimaryIcon(payload?.items);
        const iconPath = primary?.dataUrl ?? primary?.url ?? null;
        setIconUrl(iconPath);
      })
      .catch(() => {
        if (isMounted) {
          setIconUrl(null);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [buildId]);

  return <BuildDetailPage build={build} iconUrl={iconUrl} isLoading={isLoading} error={error} />;
};

const LatestBuildsRoute = ({
  ingestNonce,
  activeTeamId,
}: {
  ingestNonce: number;
  activeTeamId: string;
}) => {
  const navigate = useNavigate();
  const [builds, setBuilds] = useState<ApiBuild[]>([]);
  const [buildIcons, setBuildIcons] = useState<Record<string, string>>({});
  const [buildPlatforms, setBuildPlatforms] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    if (!activeTeamId) {
      setBuilds([]);
      return () => {
        isMounted = false;
      };
    }
    apiFetch<ApiBuild[]>("/builds", { headers: { "x-team-id": activeTeamId } })
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
  }, [ingestNonce, activeTeamId]);

  useEffect(() => {
    let isMounted = true;
    if (!builds.length) {
      setBuildIcons({});
      return () => {
        isMounted = false;
      };
    }
    const loadIcons = async () => {
      const entries = await Promise.all(
        builds.map(async (build) => {
          try {
            const icons = await apiFetch<ApiBuildIconResponse>(`/builds/${build.id}/icons`, {
              headers: { "x-team-id": activeTeamId },
            });
            const primary = pickPrimaryIcon(icons?.items);
            const iconPath = primary?.dataUrl ?? primary?.url;
            const platform = primary?.platform;
            if (iconPath || platform) {
              return { id: build.id, iconPath, platform };
            }
          } catch {
            return null;
          }
          return null;
        })
      );
      if (isMounted) {
        const iconEntries = entries
          .filter((entry): entry is { id: string; iconPath: string; platform?: string } => Boolean(entry?.iconPath))
          .map((entry) => [entry.id, entry.iconPath]);
        setBuildIcons(Object.fromEntries(iconEntries));
        const platformEntries = entries
          .filter((entry): entry is { id: string; platform: string } => Boolean(entry?.platform))
          .map((entry) => [entry.id, entry.platform]);
        setBuildPlatforms(Object.fromEntries(platformEntries));
      }
    };

    void loadIcons();

    return () => {
      isMounted = false;
    };
  }, [builds, activeTeamId]);

  return (
    <BuildsPage
      builds={builds}
      buildIcons={buildIcons}
      buildPlatforms={buildPlatforms}
      onSelectBuild={(id) => navigate(`/builds/${id}`)}
    />
  );
};

const AppBuildsRoute = ({
  apps,
  appIcons,
  ingestNonce,
  activeTeamId,
}: {
  apps: ApiApp[];
  appIcons: Record<string, string>;
  ingestNonce: number;
  activeTeamId: string;
}) => {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [builds, setBuilds] = useState<ApiBuild[]>([]);
  const [buildIcons, setBuildIcons] = useState<Record<string, string>>({});
  const selectedApp = apps.find((app) => app.id === appId) ?? null;
  const appIcon = appId ? appIcons[appId] : undefined;

  useEffect(() => {
    let isMounted = true;
    if (!appId) {
      setBuilds([]);
      return () => {
        isMounted = false;
      };
    }
    apiFetch<ApiBuild[]>(`/builds?appId=${appId}`, {
      headers: { "x-team-id": activeTeamId },
    })
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
  }, [appId, ingestNonce, activeTeamId]);

  useEffect(() => {
    let isMounted = true;
    if (!builds.length) {
      setBuildIcons({});
      return () => {
        isMounted = false;
      };
    }

    const loadIcons = async () => {
      const entries = await Promise.all(
        builds.map(async (build) => {
          try {
            const icons = await apiFetch<ApiBuildIconResponse>(`/builds/${build.id}/icons`, {
              headers: { "x-team-id": activeTeamId },
            });
            const primary = pickPrimaryIcon(icons?.items);
            const iconPath = primary?.dataUrl ?? primary?.url;
            const platform = primary?.platform;
            if (iconPath || platform) {
              return { id: build.id, iconPath, platform };
            }
          } catch {
            return null;
          }
          return null;
        })
      );
      if (isMounted) {
        const iconEntries = entries
          .filter((entry): entry is { id: string; iconPath: string; platform?: string } => Boolean(entry?.iconPath))
          .map((entry) => [entry.id, entry.iconPath]);
        setBuildIcons(Object.fromEntries(iconEntries));
        const platformEntries = entries
          .filter((entry): entry is { id: string; platform: string } => Boolean(entry?.platform))
          .map((entry) => [entry.id, entry.platform]);
        setBuildPlatforms(Object.fromEntries(platformEntries));
      }
    };

    void loadIcons();

    return () => {
      isMounted = false;
    };
  }, [builds]);

  return (
    <AppBuildsPage
      app={selectedApp ?? null}
      appIcon={appIcon}
      builds={builds}
      buildIcons={buildIcons}
      buildPlatforms={buildPlatforms}
      onSelectBuild={(id) => navigate(appId ? `/apps/${appId}/builds/${id}` : `/builds/${id}`)}
    />
  );
};

export default AppRoutes;
