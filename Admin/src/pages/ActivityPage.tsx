import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppAvatar from "../components/AppAvatar";
import FormField from "../components/FormField";
import Icon from "../components/Icon";
import Panel from "../components/Panel";
import Pagination from "../components/Pagination";
import { apiFetch } from "../lib/api";
import type { ApiApp, ApiBuildEvent } from "../lib/apps";
import { formatDateTime } from "../lib/apps";
import type { PaginatedResponse } from "../lib/pagination";
import type { TeamMember } from "../lib/teams";

type ActivityPageProps = {
  apps: ApiApp[];
  appIcons: Record<string, string>;
  teamMembers: TeamMember[];
  activeTeamId: string;
};

const ActivityPage = ({ apps, appIcons, teamMembers, activeTeamId }: ActivityPageProps) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [events, setEvents] = useState<PaginatedResponse<ApiBuildEvent>>({
    items: [],
    page: 1,
    perPage: 25,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);

  const appOptions = useMemo(
    () =>
      [
        { value: "", label: "All apps" },
        ...[...apps]
          .sort((a, b) => (a.name || a.identifier || "").localeCompare(b.name || b.identifier || ""))
          .map((app) => ({
            value: app.id,
            label: app.name || app.identifier || "App",
          })),
      ],
    [apps]
  );

  const userOptions = useMemo(
    () =>
      [
        { value: "", label: "All users" },
        ...[...teamMembers]
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
          .map((member) => ({
            value: member.id,
            label: member.name || member.fullName || member.username || member.email || "User",
          })),
      ],
    [teamMembers]
  );

  useEffect(() => {
    setPage(1);
  }, [selectedAppId, selectedUserId]);

  useEffect(() => {
    if (!activeTeamId) {
      setEvents((current) => ({ ...current, items: [], total: 0, totalPages: 1 }));
      return;
    }
    setIsLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      kinds: "download,install",
    });
    if (selectedAppId) {
      params.set("appId", selectedAppId);
    }
    if (selectedUserId) {
      params.set("userId", selectedUserId);
    }
    apiFetch<PaginatedResponse<ApiBuildEvent>>(`/builds/events?${params.toString()}`, {
      headers: { "x-team-id": activeTeamId },
    })
      .then((payload) => {
        setEvents(payload ?? { items: [], page, perPage, total: 0, totalPages: 1 });
        if (payload?.page && payload.page !== page) {
          setPage(payload.page);
        }
        if (payload?.perPage && payload.perPage !== perPage) {
          setPerPage(payload.perPage);
        }
      })
      .catch(() => {
        setEvents((current) => ({ ...current, items: [], total: 0, totalPages: 1 }));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [activeTeamId, page, perPage, selectedAppId, selectedUserId]);

  const handleEventSelect = (event: ApiBuildEvent) => {
    if (!event.buildId) return;
    const appId = event.build?.version?.app?.id;
    if (appId) {
      navigate(`/apps/${appId}/builds/${event.buildId}`);
      return;
    }
    navigate(`/builds/${event.buildId}`);
  };

  return (
    <div className="space-y-6">
      <Panel className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Activity</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review all install and download events for your team.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Filter by app" htmlFor="activity-app">
            <select
              id="activity-app"
              value={selectedAppId}
              onChange={(event) => setSelectedAppId(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {appOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Filter by user" htmlFor="activity-user">
            <select
              id="activity-user"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {userOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </Panel>
      <Panel className="overflow-hidden p-0">
        <div className="grid grid-cols-[auto_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.6fr)_auto] items-center gap-3 border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <span className="text-left"> </span>
          <span>What</span>
          <span>Who</span>
          <span>When</span>
          <span className="text-right"> </span>
        </div>
        {events.items.length ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {events.items.map((event) => {
              const app = event.build?.version?.app;
              const buildName = app?.name || event.build?.displayName || "Build";
              const versionLabel = event.build?.version?.version;
              const buildNumber = event.build?.buildNumber;
              const title = [buildName, versionLabel, buildNumber ? `(${buildNumber})` : null]
                .filter(Boolean)
                .join(" ");
              const actor =
                event.user?.fullName ||
                event.user?.username ||
                event.user?.email ||
                "Unknown user";
              const iconUrl = app?.id ? appIcons[app.id] : null;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => handleEventSelect(event)}
                  disabled={!event.buildId}
                  className="group grid h-11 w-full grid-cols-[auto_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.6fr)_auto] items-center gap-3 px-4 text-left text-xs text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-default disabled:opacity-70 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <AppAvatar name={buildName} iconUrl={iconUrl} size="xs" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
                        {title}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                        {event.kind === "install" ? "Install" : "Download"}
                      </span>
                    </div>
                  </div>
                  <span className="truncate text-slate-500 dark:text-slate-400">{actor}</span>
                  <span className="truncate text-slate-400 dark:text-slate-500">
                    {formatDateTime(event.createdAt)}
                  </span>
                  <span className="text-slate-400 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400">
                    <Icon name="chevronRight" />
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-8 text-sm text-slate-500 dark:text-slate-400">
            {isLoading ? "Loading events..." : "No install or download events yet."}
          </div>
        )}
        <div className="px-4 pb-4">
          <Pagination
            page={events.page}
            totalPages={events.totalPages}
            perPage={events.perPage}
            total={events.total}
            onPageChange={setPage}
            onPerPageChange={(next) => {
              setPerPage(next);
              setPage(1);
            }}
          />
        </div>
      </Panel>
    </div>
  );
};

export default ActivityPage;
