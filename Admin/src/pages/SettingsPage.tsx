import { useMemo, useState, useEffect } from "react";

import ActionButton from "../components/ActionButton";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import InviteUserDialog from "../components/InviteUserDialog";
import Tabs from "../components/Tabs";
import TeamMembersTable from "../components/TeamMembersTable";
import TextInput from "../components/TextInput";
import { apiFetch } from "../lib/api";
import type { TeamMember, TeamSummary } from "../lib/teams";
import type { AnalyticsSettings } from "../types/settings";
import { useRef } from "react";
import { useI18n } from "../lib/i18n";

const GA_KEY_PATTERN = /^G-[A-Z0-9]{8,}$/i;

type SettingsPageProps = {
  teams: TeamSummary[];
  activeTeamId: string;
  teamMembers: TeamMember[];
  isSaas: boolean;
  isSuperUser: boolean;
  initialTab?: string;
  onAnalyticsKeySaved?: (key: string | null) => void;
};

const SettingsPage = ({
  teams,
  activeTeamId,
  teamMembers,
  isSaas,
  isSuperUser,
  initialTab,
  onAnalyticsKeySaved,
}: SettingsPageProps) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(initialTab ?? "team");
  const [gaKey, setGaKey] = useState("");
  const [isSavingAnalytics, setIsSavingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsMessage, setAnalyticsMessage] = useState("");
  const envAnalyticsKey = import.meta.env.VITE_ANALYTICS_KEY ?? "";
  const [logoMessage, setLogoMessage] = useState("");
  const [logoError, setLogoError] = useState("");
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const activeTeam = useMemo(
    () => teams.find((team) => team.id === activeTeamId) || teams[0],
    [teams, activeTeamId]
  );
  const hasTeam = Boolean(activeTeam);

  useEffect(() => {
    if (!isSuperUser) {
      setGaKey("");
      return;
    }
    let isMounted = true;
    if (envAnalyticsKey) {
      setGaKey(envAnalyticsKey);
      setAnalyticsMessage(t("settings.analytics.managed", "Managed via environment (VITE_ANALYTICS_KEY)."));
      return () => {
        isMounted = false;
      };
    }
    apiFetch<AnalyticsSettings>("/settings/analytics")
      .then((payload) => {
        if (isMounted) {
          setGaKey(payload?.gaMeasurementId ?? "");
        }
      })
      .catch(() => {
        if (isMounted) {
          setGaKey("");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [isSuperUser, envAnalyticsKey, t]);

  const handleSaveAnalytics = async () => {
    const trimmed = gaKey.trim();
    const nextValue = trimmed === "" ? null : trimmed;
    if (nextValue && !GA_KEY_PATTERN.test(nextValue)) {
      setAnalyticsError(t("settings.analytics.error.invalid", "Enter a valid GA4 measurement ID (e.g., G-XXXXXXXX)."));
      setAnalyticsMessage("");
      return;
    }
    setIsSavingAnalytics(true);
    setAnalyticsError("");
    setAnalyticsMessage("");
    try {
      const payload = await apiFetch<AnalyticsSettings>("/settings/analytics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gaMeasurementId: nextValue }),
      });
      const savedKey = payload?.gaMeasurementId ?? "";
      setGaKey(savedKey ?? "");
      setAnalyticsMessage(
        savedKey ? t("settings.analytics.saved", "Analytics key saved.") : t("settings.analytics.disabled", "Analytics tracking disabled.")
      );
      onAnalyticsKeySaved?.(payload?.gaMeasurementId ?? null);
    } catch {
      setAnalyticsError(t("settings.analytics.error.save", "Unable to save analytics key."));
    } finally {
      setIsSavingAnalytics(false);
    }
  };

  const tabs = [
    {
      id: "team",
      label: t("settings.tabs.team", "Team"),
      content: hasTeam ? (
        <Panel className="space-y-6">
          <TextInput
            id="team-name"
            label={t("settings.team.name.label", "Team name")}
            value={activeTeam?.name ?? ""}
            placeholder={t("settings.team.name.placeholder", "Team name")}
          />
          <TextInput
            id="team-slug"
            label={t("settings.team.slug.label", "Team slug")}
            value={activeTeam?.slug ?? ""}
            placeholder={t("settings.team.slug.placeholder", "team-slug")}
          />
          <div className="space-y-2">
            <SectionHeader
              title={t("settings.team.logo.title", "Team logo")}
              description={t("settings.team.logo.subtitle", "Upload a 180x180 logo (max 2MB). Shown in the team switcher.")}
            />
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                {activeTeam?.logoUrl ? (
                  <img src={activeTeam.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                    —
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setLogoError("");
                    setLogoMessage("");
                    if (file.size > 2 * 1024 * 1024) {
                      setLogoError(t("settings.team.logo.error.size", "Max size is 2MB."));
                      return;
                    }
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      await apiFetch<{ url: string }>("/teams/logo", {
                        method: "POST",
                        headers: { "x-team-id": activeTeamId },
                        body: formData,
                      });
                      setLogoMessage(
                        t("settings.team.logo.success", "Logo updated. If it doesn't show, refresh.")
                      );
                    } catch (err) {
                      setLogoError(
                        err instanceof Error ? err.message : t("settings.team.logo.error.upload", "Unable to upload logo. Try again.")
                      );
                    } finally {
                      if (logoInputRef.current) {
                        logoInputRef.current.value = "";
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {t("settings.team.logo.cta", "Upload logo")}
                </button>
                {logoMessage ? <p className="text-xs text-green-600">{logoMessage}</p> : null}
                {logoError ? <p className="text-xs text-red-500">{logoError}</p> : null}
              </div>
            </div>
          </div>
        </Panel>
      ) : (
        <Panel>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("settings.team.empty", "No team is available yet.")}
          </p>
        </Panel>
      ),
    },
    {
      id: "users",
      label: t("settings.tabs.users", "Users"),
      content: hasTeam ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeader
              title={t("settings.users.title", "Team members")}
              description={t("settings.users.subtitle", "Users can be admins or standard users.")}
            />
            <button
              type="button"
              className="h-11 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              onClick={() => setIsInviteOpen(true)}
            >
              {t("settings.users.invite", "Invite user")}
            </button>
          </div>
          <TeamMembersTable members={teamMembers} />
        </div>
      ) : (
        <Panel>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("settings.users.empty", "Invite teammates once you have a team.")}
          </p>
        </Panel>
      ),
    },
  ];

  if (isSuperUser) {
    tabs.push({
      id: "analytics",
      label: t("settings.tabs.analytics", "Analytics"),
      content: (
        <Panel className="space-y-4">
          <SectionHeader
            title={t("settings.analytics.title", "Google Analytics")}
            description={t(
              "settings.analytics.subtitle",
              "Provide a GA4 measurement ID to enable analytics across the admin. Only super users can manage this."
            )}
          />
          <div className="space-y-3">
            <TextInput
              id="ga-key"
              label={t("settings.analytics.label", "Measurement ID")}
              value={gaKey}
              onChange={setGaKey}
              placeholder={t("settings.analytics.placeholder", "G-XXXXXXXXXX")}
              hint={t("settings.analytics.hint", "Only GA4 measurement IDs are allowed. Leave empty to disable analytics.")}
              disabled={Boolean(envAnalyticsKey)}
            />
            {envAnalyticsKey ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t(
                  "settings.analytics.envNotice",
                  "This value is managed via VITE_ANALYTICS_KEY and cannot be edited here."
                )}
              </p>
            ) : null}
            {analyticsError ? (
              <p className="text-xs text-red-500">{analyticsError}</p>
            ) : null}
            {analyticsMessage ? (
              <p className="text-xs text-green-600">{analyticsMessage}</p>
            ) : null}
            <ActionButton
              label={
                isSavingAnalytics
                  ? t("settings.analytics.saving", "Saving...")
                  : gaKey.trim()
                  ? t("settings.analytics.save", "Save analytics key")
                  : t("settings.analytics.disable", "Disable analytics")
              }
              variant="primary"
              onClick={handleSaveAnalytics}
              disabled={isSavingAnalytics || Boolean(envAnalyticsKey)}
            />
          </div>
        </Panel>
      ),
    });
  }

  if (isSaas) {
    tabs.push({
      id: "billing",
      label: t("settings.tabs.billing", "Billing"),
      content: (
        <Panel>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("settings.billing.notice", "Billing settings are available only in the SaaS version.")}
          </p>
        </Panel>
      ),
    });
  }

  useEffect(() => {
    if (
      initialTab &&
      initialTab !== activeTab &&
      tabs.some((tab) => tab.id === initialTab)
    ) {
      setActiveTab(initialTab);
    }
  }, [activeTab, initialTab, tabs]);

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0]?.id ?? "team");
    }
  }, [activeTab, tabs]);

  return (
    <div className="space-y-6">
      <Tabs items={tabs} activeId={activeTab} onChange={setActiveTab} />
      <InviteUserDialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        teamId={activeTeam?.id ?? ""}
      />
    </div>
  );
};

export default SettingsPage;
