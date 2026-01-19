import { useEffect, useMemo, useState } from "react";

import ActionButton from "./ActionButton";
import FormField from "./FormField";
import Panel from "./Panel";
import Pagination from "./Pagination";
import SectionHeader from "./SectionHeader";
import TextInput from "./TextInput";
import { apiFetch } from "../lib/api";
import { formatBytes } from "../lib/apps";
import type { PaginatedResponse, PaginationMeta } from "../lib/pagination";
import { useI18n } from "../lib/i18n";

type TariffOverrideLimits = {
  maxUsers: number | null;
  maxApps: number | null;
  storageLimitBytes: number | null;
  transferLimitBytes: number | null;
};

type TariffOverrideTeam = {
  id: string;
  name: string;
  slug: string;
  limits: TariffOverrideLimits;
};

type TariffOverrideDialogProps = {
  isOpen: boolean;
  team: TariffOverrideTeam | null;
  onClose: () => void;
  onSaved: (team: TariffOverrideTeam) => void;
};

const GB_BYTES = 1024 * 1024 * 1024;

const formatLimit = (value: number | null, locale: string) => {
  if (value === null) return null;
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
};

const toGbInput = (bytes: number | null) => {
  if (bytes === null) return "";
  const gb = bytes / GB_BYTES;
  const rounded = Math.round(gb * 100) / 100;
  return String(rounded);
};

const TariffOverrideDialog = ({ isOpen, team, onClose, onSaved }: TariffOverrideDialogProps) => {
  const { t, locale } = useI18n();
  const [userLimit, setUserLimit] = useState("");
  const [appLimit, setAppLimit] = useState("");
  const [storageLimitGb, setStorageLimitGb] = useState("");
  const [transferLimitGb, setTransferLimitGb] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen || !team) {
      setUserLimit("");
      setAppLimit("");
      setStorageLimitGb("");
      setTransferLimitGb("");
      setError("");
      setBusy(false);
      return;
    }
    setUserLimit(team.limits.maxUsers === null ? "" : String(team.limits.maxUsers));
    setAppLimit(team.limits.maxApps === null ? "" : String(team.limits.maxApps));
    setStorageLimitGb(toGbInput(team.limits.storageLimitBytes));
    setTransferLimitGb(toGbInput(team.limits.transferLimitBytes));
    setError("");
    setBusy(false);
  }, [isOpen, team]);

  if (!isOpen || !team) {
    return null;
  }

  const parseNullableInt = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      return "invalid";
    }
    return parsed;
  };

  const parseNullableGb = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return "invalid";
    }
    return Math.round(parsed * GB_BYTES);
  };

  const save = async () => {
    const nextUsers = parseNullableInt(userLimit);
    if (nextUsers === "invalid") {
      setError(t("settings.tariffOverrides.error.users", "User limit must be a whole number."));
      return;
    }
    const nextApps = parseNullableInt(appLimit);
    if (nextApps === "invalid") {
      setError(t("settings.tariffOverrides.error.apps", "App limit must be a whole number."));
      return;
    }
    const nextStorage = parseNullableGb(storageLimitGb);
    if (nextStorage === "invalid") {
      setError(t("settings.tariffOverrides.error.storage", "Storage limit must be a number in GB."));
      return;
    }
    const nextTransfer = parseNullableGb(transferLimitGb);
    if (nextTransfer === "invalid") {
      setError(t("settings.tariffOverrides.error.transfer", "Transfer limit must be a number in GB."));
      return;
    }

    setBusy(true);
    setError("");
    try {
      const payload = await apiFetch<TariffOverrideTeam>(`/settings/tariff-overrides/${team.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxUsers: nextUsers,
          maxApps: nextApps,
          storageLimitBytes: nextStorage,
          transferLimitBytes: nextTransfer,
        }),
      });
      onSaved(payload);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("settings.tariffOverrides.error.save", "Unable to save overrides.")
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <Panel className="w-full max-w-xl space-y-6 p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("settings.tariffOverrides.dialog.title", "Override limits")}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "settings.tariffOverrides.dialog.subtitle",
              "Overrides apply immediately and bypass plan caps. Leave fields empty to use plan defaults."
            )}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("settings.tariffOverrides.dialog.team", "Team")}: {team.name} ({team.slug})
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t("settings.tariffOverrides.field.users", "User limit")}
            htmlFor="tariff-users"
            hint={t("settings.tariffOverrides.field.users.hint", "Leave blank to inherit plan limits.")}
          >
            <input
              id="tariff-users"
              type="number"
              min={0}
              step={1}
              value={userLimit}
              onChange={(event) => setUserLimit(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </FormField>
          <FormField
            label={t("settings.tariffOverrides.field.apps", "App limit")}
            htmlFor="tariff-apps"
            hint={t("settings.tariffOverrides.field.apps.hint", "Leave blank to inherit plan limits.")}
          >
            <input
              id="tariff-apps"
              type="number"
              min={0}
              step={1}
              value={appLimit}
              onChange={(event) => setAppLimit(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </FormField>
          <FormField
            label={t("settings.tariffOverrides.field.storage", "Storage limit (GB)")}
            htmlFor="tariff-storage"
            hint={t("settings.tariffOverrides.field.storage.hint", "Leave blank to inherit plan limits.")}
          >
            <input
              id="tariff-storage"
              type="number"
              min={0}
              step={0.01}
              value={storageLimitGb}
              onChange={(event) => setStorageLimitGb(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </FormField>
          <FormField
            label={t("settings.tariffOverrides.field.transfer", "Transfer limit (GB)")}
            htmlFor="tariff-transfer"
            hint={t("settings.tariffOverrides.field.transfer.hint", "Leave blank to inherit plan limits.")}
          >
            <input
              id="tariff-transfer"
              type="number"
              min={0}
              step={0.01}
              value={transferLimitGb}
              onChange={(event) => setTransferLimitGb(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </FormField>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton label={t("common.cancel", "Cancel")} variant="outline" onClick={onClose} />
          <ActionButton
            label={
              busy
                ? t("settings.tariffOverrides.saving", "Saving...")
                : t("settings.tariffOverrides.save", "Save overrides")
            }
            variant="primary"
            disabled={busy}
            onClick={save}
          />
        </div>
      </Panel>
    </div>
  );
};

const TariffOverridesPanel = () => {
  const { t, locale } = useI18n();
  const [teams, setTeams] = useState<TariffOverrideTeam[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    perPage: 25,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TariffOverrideTeam | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(pagination.page),
      perPage: String(pagination.perPage),
    });
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }
    apiFetch<PaginatedResponse<TariffOverrideTeam>>(`/settings/tariff-overrides?${params.toString()}`)
      .then((payload) => {
        if (!isMounted) return;
        setTeams(payload?.items ?? []);
        setPagination({
          page: payload?.page ?? 1,
          perPage: payload?.perPage ?? pagination.perPage,
          total: payload?.total ?? 0,
          totalPages: payload?.totalPages ?? 1,
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        setTeams([]);
        setError(
          err instanceof Error ? err.message : t("settings.tariffOverrides.error.load", "Unable to load teams.")
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, pagination.page, pagination.perPage, t]);

  const handleSaved = (next: TariffOverrideTeam) => {
    setTeams((prev) => prev.map((team) => (team.id === next.id ? next : team)));
  };

  const emptyState = !isLoading && teams.length === 0;

  const headers = useMemo(
    () => [
      t("settings.tariffOverrides.table.team", "Team"),
      t("settings.tariffOverrides.table.users", "Users"),
      t("settings.tariffOverrides.table.apps", "Apps"),
      t("settings.tariffOverrides.table.storage", "Storage"),
      t("settings.tariffOverrides.table.transfer", "Transfer"),
      t("settings.tariffOverrides.table.action", "Action"),
    ],
    [t]
  );

  return (
    <>
      <Panel className="space-y-4">
        <SectionHeader
          title={t("settings.tariffOverrides.title", "Tariff overrides")}
          description={t(
            "settings.tariffOverrides.subtitle",
            "Override plan-based caps for specific teams. Superusers only."
          )}
        />
        <TextInput
          id="tariff-search"
          label={t("settings.tariffOverrides.search.label", "Search teams")}
          placeholder={t("settings.tariffOverrides.search.placeholder", "Search by team name or slug")}
          value={search}
          onChange={setSearch}
        />

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                {headers.map((label) => (
                  <th key={label} className="px-4 py-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {teams.map((team) => {
                const limits = team.limits;
                const users = formatLimit(limits.maxUsers, locale);
                const apps = formatLimit(limits.maxApps, locale);
                const storage = limits.storageLimitBytes === null ? null : formatBytes(limits.storageLimitBytes, locale);
                const transfer = limits.transferLimitBytes === null ? null : formatBytes(limits.transferLimitBytes, locale);
                return (
                  <tr key={team.id} className="text-slate-700 dark:text-slate-200">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{team.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{team.slug}</div>
                    </td>
                    <td className="px-4 py-3">{users ?? t("settings.tariffOverrides.value.default", "Default")}</td>
                    <td className="px-4 py-3">{apps ?? t("settings.tariffOverrides.value.default", "Default")}</td>
                    <td className="px-4 py-3">{storage ?? t("settings.tariffOverrides.value.default", "Default")}</td>
                    <td className="px-4 py-3">{transfer ?? t("settings.tariffOverrides.value.default", "Default")}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        onClick={() => {
                          setSelectedTeam(team);
                          setIsDialogOpen(true);
                        }}
                      >
                        {t("settings.tariffOverrides.edit", "Edit")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {isLoading ? (
            <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {t("settings.tariffOverrides.loading", "Loading teams...")}
            </div>
          ) : null}
          {emptyState ? (
            <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {t("settings.tariffOverrides.empty", "No teams match your search.")}
            </div>
          ) : null}
          {error ? (
            <div className="border-t border-slate-200 px-4 py-3 text-sm text-red-600 dark:border-slate-700">
              {error}
            </div>
          ) : null}
          <div className="px-4 pb-4">
            <Pagination
              page={pagination.page}
              perPage={pagination.perPage}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
              onPerPageChange={(perPage) => setPagination((prev) => ({ ...prev, perPage, page: 1 }))}
            />
          </div>
        </div>
      </Panel>
      <TariffOverrideDialog
        isOpen={isDialogOpen}
        team={selectedTeam}
        onClose={() => setIsDialogOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
};

export default TariffOverridesPanel;
