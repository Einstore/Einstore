import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import Breadcrumbs from "./Breadcrumbs";
import AppAvatar from "./AppAvatar";
import Icon from "./Icon";
import { getInitialTheme, setTheme, type ThemeMode } from "../lib/theme";
import type { SessionUser } from "../lib/session";
import { apiFetch } from "../lib/api";
import type { SearchResponse } from "../lib/search";
import type { PaginatedResponse } from "../lib/pagination";
import { useI18n } from "../lib/i18n";

type TopbarProps = {
  title: string;
  breadcrumbs?: { label: string }[];
  actions?: ReactNode;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
  user?: SessionUser | null;
  activeTeamId?: string;
  appIcons?: Record<string, string>;
  onAcceptInvite?: () => void;
  processingBuildsCount?: number;
};

const Topbar = ({
  title,
  breadcrumbs,
  actions,
  onToggleSidebar,
  onLogout,
  user,
  activeTeamId,
  appIcons = {},
  onAcceptInvite,
  processingBuildsCount = 0,
}: TopbarProps) => {
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const [theme, setThemeState] = useState<ThemeMode>(() => getInitialTheme());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocaleMenuOpen, setIsLocaleMenuOpen] = useState(false);
  const emptyResults = useMemo(() => {
    const emptyPage = <T,>(): PaginatedResponse<T> => ({
      items: [],
      page: 1,
      perPage: 0,
      total: 0,
      totalPages: 1,
    });
    return { apps: emptyPage(), builds: emptyPage() };
  }, []);
  const [searchResults, setSearchResults] = useState<SearchResponse>(emptyResults);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const localeMenuRef = useRef<HTMLDivElement | null>(null);
  const avatarUrl = user?.avatarUrl ?? null;
  const userLabel = user?.name || user?.email || user?.username || t("common.user", "User");
  const trimmedQuery = searchValue.trim();

  const buildResults = useMemo(() => {
    const deduped = new Map(
      (searchResults.builds?.items ?? []).map((build) => [build.id, build])
    );
    return Array.from(deduped.values()).slice(0, 6);
  }, [searchResults.builds]);

  const appResults = useMemo(
    () => searchResults.apps?.items ?? [],
    [searchResults.apps]
  );

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isLocaleMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (localeMenuRef.current && !localeMenuRef.current.contains(target)) {
        setIsLocaleMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isLocaleMenuOpen]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (!activeTeamId || trimmedQuery.length < 2) {
      setSearchResults(emptyResults);
      setIsSearchOpen(false);
      setIsSearching(false);
      return;
    }
    setIsSearchOpen(true);
    setIsSearching(true);
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams();
      params.set("q", trimmedQuery);
      params.set("appPerPage", "6");
      params.set("buildPerPage", "6");
      apiFetch<SearchResponse>(`/search?${params.toString()}`, {
        headers: { "x-team-id": activeTeamId },
      })
        .then((payload) => {
          setSearchResults(payload ?? emptyResults);
        })
        .catch(() => {
          setSearchResults(emptyResults);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 200);
    return () => window.clearTimeout(handle);
  }, [activeTeamId, trimmedQuery]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    setTheme(next);
  };

  const localeOptions = useMemo(
    () => [
      { id: "en-US" as const, label: t("topbar.locale.enUS", "English (US)"), flag: "🇺🇸" },
      { id: "en-GB" as const, label: t("topbar.locale.enGB", "English (UK)"), flag: "🇬🇧" },
      { id: "cs" as const, label: t("topbar.locale.cs", "Czech"), flag: "🇨🇿" },
      { id: "de" as const, label: t("topbar.locale.de", "German"), flag: "🇩🇪" },
      { id: "es" as const, label: t("topbar.locale.es", "Spanish"), flag: "🇪🇸" },
      { id: "fr" as const, label: t("topbar.locale.fr", "French"), flag: "🇫🇷" },
      { id: "it" as const, label: t("topbar.locale.it", "Italian"), flag: "🇮🇹" },
      { id: "ja" as const, label: t("topbar.locale.ja", "Japanese"), flag: "🇯🇵" },
      { id: "ko" as const, label: t("topbar.locale.ko", "Korean"), flag: "🇰🇷" },
      { id: "nl" as const, label: t("topbar.locale.nl", "Dutch"), flag: "🇳🇱" },
      { id: "pl" as const, label: t("topbar.locale.pl", "Polish"), flag: "🇵🇱" },
      { id: "pt" as const, label: t("topbar.locale.pt", "Portuguese"), flag: "🇵🇹" },
      { id: "ru" as const, label: t("topbar.locale.ru", "Russian"), flag: "🇷🇺" },
      { id: "zh-CN" as const, label: t("topbar.locale.zhCN", "Chinese (Simplified)"), flag: "🇨🇳" },
      {
        id: "pirate" as const,
        label: t("topbar.locale.pirate", "Pirate English"),
        flag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
      },
    ],
    [t],
  );
  const activeLocale = localeOptions.find((option) => option.id === locale) ?? localeOptions[0];

  return (
    <header className="z-20 border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
      <div className="space-y-4 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 md:hidden dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              aria-label={t("topbar.menu", "Open menu")}
              onClick={onToggleSidebar}
            >
              <Icon name="menu" className="h-4 w-4" />
              {processingBuildsCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {processingBuildsCount}
                </span>
              ) : null}
            </button>
            <div ref={searchRef} className="relative flex-1">
              <div className="flex h-11 min-w-[180px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <Icon name="search" className="h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  placeholder={t("topbar.search.placeholder", "Search apps or builds")}
                  aria-label={t("topbar.search.label", "Search")}
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  onFocus={() => {
                    if (trimmedQuery.length >= 2) {
                      setIsSearchOpen(true);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && trimmedQuery.length >= 2) {
                      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
                      setIsSearchOpen(false);
                    }
                    if (event.key === "Escape") {
                      setIsSearchOpen(false);
                    }
                  }}
                  className="h-full w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
                />
              </div>
              {isSearchOpen ? (
                <div className="absolute left-0 right-0 z-30 mt-2 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <button
                    type="button"
                    className="flex h-11 w-full items-center justify-between border-b border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => {
                      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
                      setIsSearchOpen(false);
                    }}
                  >
                    {t("topbar.search.seeAll", "See all")} &gt;
                  </button>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {isSearching ? (
                      <p className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {t("topbar.search.searching", "Searching...")}
                      </p>
                    ) : null}
                    {!isSearching && !appResults.length && !buildResults.length ? (
                      <p className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {t("topbar.search.empty", "No results yet.")}
                      </p>
                    ) : null}
                    {appResults.length ? (
                      <div className="space-y-1">
                        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {t("common.apps", "Apps")}
                        </p>
                        {appResults.map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                            onClick={() => {
                              navigate(`/apps/${app.id}/builds`);
                              setIsSearchOpen(false);
                            }}
                          >
                            <span className="flex items-center gap-3">
                              <AppAvatar
                                name={app.name}
                                iconUrl={appIcons[app.id]}
                                size="sm"
                              />
                              <span className="font-medium">{app.name}</span>
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {app.identifier}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {buildResults.length ? (
                      <div className="mt-3 space-y-1">
                        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {t("common.builds", "Builds")}
                        </p>
                        {buildResults.map((build) => (
                          <button
                            key={build.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                            onClick={() => {
                              navigate(`/apps/${build.appId}/builds/${build.id}`);
                              setIsSearchOpen(false);
                            }}
                          >
                            <span className="flex items-center gap-3">
                              <AppAvatar
                                name={build.appName}
                                iconUrl={appIcons[build.appId]}
                                size="sm"
                              />
                              <span className="font-medium">{build.displayName}</span>
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              #{build.buildNumber} • v{build.version}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <div ref={localeMenuRef} className="relative">
                <button
                  type="button"
                  className="flex h-11 items-center gap-2 rounded-full px-3 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                  aria-label={t("topbar.language", "Language")}
                  aria-expanded={isLocaleMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsLocaleMenuOpen((current) => !current)}
                >
                  <span className="text-lg leading-none" aria-hidden="true">
                    {activeLocale.flag}
                  </span>
                  <Icon name="chevronDown" className="h-3 w-3" />
                </button>
                {isLocaleMenuOpen ? (
                  <div
                    className="absolute right-0 mt-2 max-h-[70vh] w-44 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                    role="menu"
                  >
                    {localeOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={[
                          "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors",
                          option.id === locale
                            ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100"
                            : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700",
                        ].join(" ")}
                        onClick={() => {
                          setLocale(option.id);
                          setIsLocaleMenuOpen(false);
                        }}
                        role="menuitem"
                      >
                        <span className="text-lg leading-none" aria-hidden="true">
                          {option.flag}
                        </span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                aria-label={t("topbar.userMenu", "User menu")}
                aria-expanded={isUserMenuOpen}
                onClick={() => setIsUserMenuOpen((current) => !current)}
              >
                {avatarUrl && !avatarFailed ? (
                  <img
                    src={avatarUrl}
                    alt={userLabel}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <Icon name="user" className="h-5 w-5" />
                )}
              </button>
              {isUserMenuOpen ? (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="md:hidden">
                    {localeOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                        onClick={() => {
                          setLocale(option.id);
                          setIsUserMenuOpen(false);
                        }}
                      >
                        <span className="text-lg leading-none" aria-hidden="true">
                          {option.flag}
                        </span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <button
                      type="button"
                      className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                      onClick={() => {
                        toggleTheme();
                        setIsUserMenuOpen(false);
                      }}
                    >
                      <Icon name={theme === "dark" ? "sun" : "moon"} className="h-4 w-4" />
                      {theme === "dark"
                        ? t("topbar.lightMode", "Light mode")
                        : t("topbar.darkMode", "Dark mode")}
                    </button>
                    <button
                      type="button"
                      className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onAcceptInvite?.();
                      }}
                    >
                      <Icon name="link" className="h-4 w-4" />
                      {t("invite.accept.title", "Accept invitation")}
                    </button>
                    <div className="border-t border-slate-200 pt-2 dark:border-slate-700" />
                    <button
                      type="button"
                      className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout?.();
                      }}
                    >
                      <Icon name="lock" className="h-4 w-4" />
                      {t("common.logout", "Logout")}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </p>
          </div>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
