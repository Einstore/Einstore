import type { ReactElement } from "react";

import type { NavItem } from "../components/Sidebar";
import type { FeatureFlagKey } from "../lib/featureFlags";

export type NavItemConfig = NavItem & { superOnly?: boolean; adminOnly?: boolean };

export type Translator = (key: string, fallback: string) => string;

export const createNavItems = (t: Translator): NavItemConfig[] => [
  { id: "overview", label: t("nav.overview", "Overview"), icon: "overview" },
  { id: "search", label: t("nav.search", "Search"), icon: "search" },
  { id: "apps", label: t("nav.apps", "Apps"), icon: "apps" },
  { id: "builds", label: t("nav.builds.latest", "Latest builds"), icon: "builds" },
  { id: "flags", label: t("nav.flags", "Future flags"), icon: "flags", superOnly: true },
  { id: "integrations", label: t("nav.integrations", "Integrations"), icon: "link", adminOnly: true },
  {
    id: "settings",
    label: t("nav.settings", "Settings"),
    icon: "settings",
  },
];

export const pageKeys = [
  "overview",
  "activity",
  "apps",
  "builds",
  "build-detail",
  "search",
  "accept-invite",
  "flags",
  "integrations",
  "settings",
  "api-keys",
] as const;

export type PageKey = (typeof pageKeys)[number];

export type PageConfigEntry = {
  title: string;
  breadcrumbs: { label: string }[];
  actions: { id: string; label: string; variant?: "primary" | "outline" }[];
};

export const createPageConfig = (t: Translator): Record<PageKey, PageConfigEntry> => ({
  overview: {
    title: t("page.overview.title", "Release operations"),
    breadcrumbs: [{ label: t("breadcrumb.home", "Home") }, { label: t("breadcrumb.overview", "Overview") }],
    actions: [{ id: "upload-build", label: t("actions.uploadBuild", "Upload build"), variant: "primary" }],
  },
  activity: {
    title: t("page.activity.title", "Activity"),
    breadcrumbs: [{ label: t("breadcrumb.home", "Home") }, { label: t("breadcrumb.activity", "Activity") }],
    actions: [],
  },
  apps: {
    title: t("page.apps.title", "Apps"),
    breadcrumbs: [{ label: t("breadcrumb.apps", "Apps") }, { label: t("breadcrumb.catalog", "Catalog") }],
    actions: [{ id: "upload-build", label: t("actions.uploadBuild", "Upload build"), variant: "primary" }],
  },
  builds: {
    title: t("page.builds.title", "Latest builds"),
    breadcrumbs: [{ label: t("breadcrumb.builds", "Builds") }, { label: t("breadcrumb.latest", "Latest") }],
    actions: [{ id: "upload-build", label: t("actions.uploadBuild", "Upload build"), variant: "primary" }],
  },
  "build-detail": {
    title: t("page.buildDetail.title", "Build detail"),
    breadcrumbs: [{ label: t("breadcrumb.builds", "Builds") }, { label: t("breadcrumb.detail", "Detail") }],
    actions: [{ id: "upload-build", label: t("actions.uploadBuild", "Upload build"), variant: "primary" }],
  },
  search: {
    title: t("page.search.title", "Search builds"),
    breadcrumbs: [{ label: t("breadcrumb.search", "Search") }],
    actions: [{ id: "upload-build", label: t("actions.uploadBuild", "Upload build"), variant: "primary" }],
  },
  "accept-invite": {
    title: t("page.acceptInvite.title", "Accept invitation"),
    breadcrumbs: [{ label: t("breadcrumb.invitations", "Invitations") }],
    actions: [],
  },
  flags: {
    title: t("page.flags.title", "Future flags"),
    breadcrumbs: [{ label: t("breadcrumb.governance", "Governance") }, { label: t("breadcrumb.flags", "Future flags") }],
    actions: [],
  },
  integrations: {
    title: t("page.integrations.title", "Integrations"),
    breadcrumbs: [{ label: t("breadcrumb.workspace", "Workspace") }, { label: t("breadcrumb.integrations", "Integrations") }],
    actions: [],
  },
  settings: {
    title: t("page.settings.title", "Team settings"),
    breadcrumbs: [{ label: t("breadcrumb.workspace", "Workspace") }, { label: t("breadcrumb.settings", "Settings") }],
    actions: [{ id: "save-settings", label: t("actions.saveChanges", "Save changes"), variant: "primary" }],
  },
  "api-keys": {
    title: t("page.apiKeys.title", "API keys"),
    breadcrumbs: [{ label: t("breadcrumb.workspace", "Workspace") }, { label: t("breadcrumb.apiKeys", "API keys") }],
    actions: [],
  },
});

export type RouteConfig = {
  id: PageKey | string;
  path: string;
  element: ReactElement;
  navId?: string;
  featureFlag?: FeatureFlagKey;
  adminOnly?: boolean;
  superOnly?: boolean;
};
