import { useEffect, useRef, useState, type ReactNode } from "react";

import Breadcrumbs from "./Breadcrumbs";
import Icon from "./Icon";
import { getInitialTheme, setTheme, type ThemeMode } from "../lib/theme";
import type { SessionUser } from "../lib/session";

type TopbarProps = {
  title: string;
  breadcrumbs?: { label: string }[];
  actions?: ReactNode;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
  user?: SessionUser | null;
};

const Topbar = ({
  title,
  breadcrumbs,
  actions,
  onToggleSidebar,
  onLogout,
  user,
}: TopbarProps) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => getInitialTheme());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const avatarUrl = user?.avatarUrl ?? null;
  const userLabel = user?.name || user?.email || user?.username || "User";

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
    setAvatarFailed(false);
  }, [avatarUrl]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    setTheme(next);
  };

  return (
    <header className="z-20 border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
      <div className="space-y-4 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 md:hidden dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              aria-label="Open menu"
              onClick={onToggleSidebar}
            >
              <Icon name="menu" className="h-4 w-4" />
            </button>
            <div className="flex h-11 min-w-[180px] flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <Icon name="search" className="h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search (Ctrl+/)"
                aria-label="Search"
                className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                aria-label="Language"
              >
                <Icon name="globe" className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                aria-label="Theme"
                aria-pressed={theme === "dark"}
                onClick={toggleTheme}
              >
                <Icon name={theme === "dark" ? "sun" : "moon"} className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                aria-label="Apps"
              >
                <Icon name="grid" className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                aria-label="Notifications"
              >
                <Icon name="bell" className="h-4 w-4" />
              </button>
            </div>
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                aria-label="User menu"
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
                    <button
                      type="button"
                      className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Icon name="globe" className="h-4 w-4" />
                      Language
                    </button>
                    <button
                      type="button"
                      className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                      onClick={() => {
                        toggleTheme();
                        setIsUserMenuOpen(false);
                      }}
                    >
                      <Icon name={theme === "dark" ? "sun" : "moon"} className="h-4 w-4" />
                      Theme
                    </button>
                    <button
                      type="button"
                      className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Icon name="grid" className="h-4 w-4" />
                      Apps
                    </button>
                    <button
                      type="button"
                      className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Icon name="bell" className="h-4 w-4" />
                      Notifications
                    </button>
                  </div>
                  <div className="border-t border-slate-200 pt-2 dark:border-slate-700">
                    <button
                      type="button"
                      className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout?.();
                      }}
                    >
                      <Icon name="lock" className="h-4 w-4" />
                      Logout
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
