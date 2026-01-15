import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import AppAvatar from "../components/AppAvatar";
import Icon from "../components/Icon";
import Panel from "../components/Panel";
import Pagination from "../components/Pagination";
import { apiFetch } from "../lib/api";
import type { ApiApp } from "../lib/apps";
import { formatDateTime } from "../lib/apps";
import type { PaginatedResponse } from "../lib/pagination";
import type { SearchBuildResult, SearchResponse } from "../lib/search";
import { useI18n } from "../lib/i18n";

type SearchPageProps = {
  apps: ApiApp[];
  appIcons: Record<string, string>;
  activeTeamId: string;
};

const MIN_QUERY_LENGTH = 2;

const SearchPage = ({ apps, appIcons, activeTeamId }: SearchPageProps) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [selectedAppId, setSelectedAppId] = useState(
    () => searchParams.get("appId") ?? ""
  );
  const [results, setResults] = useState<PaginatedResponse<SearchBuildResult>>({
    items: [],
    page: 1,
    perPage: 25,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const sortedApps = useMemo(
    () => [...apps].sort((a, b) => a.name.localeCompare(b.name)),
    [apps]
  );

  const selectedApp = sortedApps.find((app) => app.id === selectedAppId) ?? null;
  const selectedIcon = selectedApp ? appIcons[selectedApp.id] : null;

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isDropdownOpen]);

  useEffect(() => {
    setPage(1);
  }, [query, selectedAppId]);

  useEffect(() => {
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      params.set("q", trimmed);
    }
    if (selectedAppId) {
      params.set("appId", selectedAppId);
    }
    setSearchParams(params, { replace: true });
  }, [query, selectedAppId, setSearchParams]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!activeTeamId || trimmed.length < MIN_QUERY_LENGTH) {
      setResults((current) => ({ ...current, items: [], total: 0, totalPages: 1 }));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams();
      params.set("q", trimmed);
      params.set("buildPage", String(page));
      params.set("buildPerPage", String(perPage));
      if (selectedAppId) {
        params.set("appId", selectedAppId);
      }
      apiFetch<SearchResponse>(`/search?${params.toString()}`, {
        headers: { "x-team-id": activeTeamId },
      })
        .then((payload) => {
          const deduped = new Map(
            (payload?.builds?.items ?? []).map((build) => [build.id, build])
          );
          const items = Array.from(deduped.values());
          if (payload?.builds) {
            setResults({ ...payload.builds, items });
            if (payload.builds.page !== page) {
              setPage(payload.builds.page);
            }
            if (payload.builds.perPage !== perPage) {
              setPerPage(payload.builds.perPage);
            }
          } else {
            setResults((current) => ({ ...current, items: [] }));
          }
        })
        .catch(() => {
          setResults((current) => ({ ...current, items: [] }));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [activeTeamId, query, selectedAppId, page, perPage]);

  return (
    <div className="space-y-6">
      <Panel className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-11 min-w-[220px] flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <Icon name="search" className="h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder={t(
                "search.placeholder",
                "Search builds by name, version, build number, or tag"
              )}
              aria-label={t("search.label", "Search builds")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-full w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </div>
          <div ref={dropdownRef} className="relative w-full max-w-[280px]">
            <button
              type="button"
              className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              onClick={() => setIsDropdownOpen((current) => !current)}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <span className="flex items-center gap-3">
                {selectedApp ? (
                  <AppAvatar
                    name={selectedApp.name}
                    iconUrl={selectedIcon}
                    platform={selectedApp.platform}
                    size="sm"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    <Icon name="apps" className="h-4 w-4" />
                  </span>
                )}
                <span className="font-medium">
                  {selectedApp ? selectedApp.name : t("search.apps.all", "All apps")}
                </span>
              </span>
              <Icon name="chevronDown" className="h-3 w-3 text-slate-400" />
            </button>
            {isDropdownOpen ? (
              <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="max-h-72 overflow-y-auto">
                  <button
                    type="button"
                    role="option"
                    aria-selected={!selectedAppId}
                    onClick={() => {
                      setSelectedAppId("");
                      setIsDropdownOpen(false);
                    }}
                    className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors ${
                      !selectedAppId
                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                      <Icon name="apps" className="h-4 w-4" />
                    </span>
                    {t("search.apps.all", "All apps")}
                  </button>
                  {sortedApps.map((app) => {
                    const isActive = app.id === selectedAppId;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onClick={() => {
                          setSelectedAppId(app.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors ${
                          isActive
                            ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                            : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                        }`}
                      >
                        <AppAvatar
                          name={app.name}
                          iconUrl={appIcons[app.id]}
                          platform={app.platform}
                          size="sm"
                        />
                        {app.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Panel>
      <Panel className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("search.results", "Results")}
          </p>
          {isLoading ? (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {t("search.loading", "Searching...")}
            </span>
          ) : null}
        </div>
        {results.items.length ? (
          <div className="-mx-5 divide-y divide-slate-200 dark:divide-slate-700">
            {results.items.map((build) => (
              <button
                key={build.id}
                type="button"
                onClick={() => navigate(`/apps/${build.appId}/builds/${build.id}`)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:hover:bg-slate-700"
              >
                <div className="flex items-center gap-3">
                  <AppAvatar
                    name={build.appName}
                    iconUrl={appIcons[build.appId]}
                    size="sm"
                  />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {build.displayName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {build.appName} • {build.appIdentifier}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t("build.row.number", "Build #{number}", { number: build.buildNumber })}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    v{build.version} • {formatDateTime(build.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {query.trim().length < MIN_QUERY_LENGTH
              ? t("search.prompt", "Start typing to search builds.")
              : t("search.empty", "No builds found.")}
          </p>
        )}
        <Pagination
          page={results.page}
          totalPages={results.totalPages}
          perPage={results.perPage}
          total={results.total}
          onPageChange={setPage}
          onPerPageChange={(next) => {
            setPerPage(next);
            setPage(1);
          }}
        />
      </Panel>
    </div>
  );
};

export default SearchPage;
