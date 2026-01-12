import type { ReactElement } from "react";

import type { NavItem } from "../components/Sidebar";
import type { FeatureFlagKey } from "../lib/featureFlags";

export type NavItemConfig = NavItem & { superOnly?: boolean; adminOnly?: boolean };

export const navItems: NavItemConfig[] = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "search", label: "Search", icon: "search" },
  { id: "apps", label: "Apps", icon: "apps" },
  { id: "builds", label: "Latest builds", icon: "builds" },
  { id: "flags", label: "Future flags", icon: "flags", superOnly: true },
  {
    id: "settings",
    label: "Settings",
    icon: "settings",
  },
] as const;

export const pageConfig = {
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
    actions: [{ id: "upload-build", label: "Upload build", variant: "primary" }],
  },
  builds: {
    title: "Latest builds",
    breadcrumbs: [{ label: "Builds" }, { label: "Latest" }],
    actions: [{ id: "upload-build", label: "Upload build", variant: "primary" }],
  },
  "build-detail": {
    title: "Build detail",
    breadcrumbs: [{ label: "Builds" }, { label: "Detail" }],
    actions: [{ id: "upload-build", label: "Upload build", variant: "primary" }],
  },
  search: {
    title: "Search builds",
    breadcrumbs: [{ label: "Search" }],
    actions: [],
  },
  "accept-invite": {
    title: "Accept invitation",
    breadcrumbs: [{ label: "Invitations" }],
    actions: [],
  },
  flags: {
    title: "Future flags",
    breadcrumbs: [{ label: "Governance" }, { label: "Future flags" }],
    actions: [{ id: "create-flag", label: "Create flag", variant: "primary" }],
  },
  settings: {
    title: "Team settings",
    breadcrumbs: [{ label: "Workspace" }, { label: "Settings" }],
    actions: [{ id: "save-settings", label: "Save changes", variant: "primary" }],
  },
  "api-keys": {
    title: "API keys",
    breadcrumbs: [{ label: "Workspace" }, { label: "API keys" }],
    actions: [],
  },
};

export type PageKey = keyof typeof pageConfig;

export type PageConfigEntry = (typeof pageConfig)[PageKey];

export type RouteConfig = {
  id: PageKey | string;
  path: string;
  element: ReactElement;
  navId?: string;
  featureFlag?: FeatureFlagKey;
  adminOnly?: boolean;
  superOnly?: boolean;
};
