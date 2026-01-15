import ActionButton from "./ActionButton";
import Panel from "./Panel";
import ToggleSwitch from "./ToggleSwitch";
import type { FeatureFlag } from "../data/mock";
import { useI18n } from "../lib/i18n";

type FeatureFlagsTableProps = {
  flags: FeatureFlag[];
  isLoading?: boolean;
  onEdit: (flag: FeatureFlag) => void;
  onToggle: (flag: FeatureFlag) => void;
  onDelete: (flag: FeatureFlag) => void;
};

const FeatureFlagsTable = ({
  flags,
  isLoading,
  onEdit,
  onToggle,
  onDelete,
}: FeatureFlagsTableProps) => {
  const { t } = useI18n();
  return (
    <Panel className="p-0">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("flags.table.title", "Future flags")}
        </h2>
        {isLoading ? (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t("common.loading", "Loading…")}
          </span>
        ) : null}
      </div>
      {!flags.length && !isLoading ? (
        <p className="px-6 py-6 text-sm text-slate-500 dark:text-slate-400">
          {t("flags.table.empty", "No flags yet. Add one to prepare upcoming rollouts.")}
        </p>
      ) : null}
      {flags.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">{t("flags.table.header.key", "Key")}</th>
                <th className="px-6 py-3">{t("flags.table.header.description", "Description")}</th>
                <th className="px-6 py-3">{t("flags.table.header.enabled", "Enabled")}</th>
                <th className="px-6 py-3">{t("common.actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {flags.map((flag) => (
                <tr key={flag.id}>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                    {flag.key}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {flag.description || t("common.emptyDash", "—")}
                  </td>
                  <td className="px-6 py-4">
                    <ToggleSwitch
                      checked={flag.defaultEnabled}
                      onToggle={() => onToggle(flag)}
                      label={t("flags.table.toggle", "Toggle {key}", { key: flag.key })}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        label={t("common.edit", "Edit")}
                        variant="outline"
                        onClick={() => onEdit(flag)}
                      />
                      <ActionButton
                        label={t("common.delete", "Delete")}
                        variant="danger"
                        onClick={() => onDelete(flag)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Panel>
  );
};

export default FeatureFlagsTable;
