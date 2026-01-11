import ActionButton from "./ActionButton";
import Panel from "./Panel";
import ToggleSwitch from "./ToggleSwitch";
import type { FeatureFlag } from "../data/mock";

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
  return (
    <Panel className="p-0">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Future flags
        </h2>
        {isLoading ? (
          <span className="text-sm text-slate-500 dark:text-slate-400">Loading…</span>
        ) : null}
      </div>
      {!flags.length && !isLoading ? (
        <p className="px-6 py-6 text-sm text-slate-500 dark:text-slate-400">
          No flags yet. Add one to prepare upcoming rollouts.
        </p>
      ) : null}
      {flags.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Key</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Enabled</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {flags.map((flag) => (
                <tr key={flag.id}>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                    {flag.key}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {flag.description || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <ToggleSwitch
                      checked={flag.defaultEnabled}
                      onToggle={() => onToggle(flag)}
                      label={`Toggle ${flag.key}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        label="Edit"
                        variant="outline"
                        onClick={() => onEdit(flag)}
                      />
                      <ActionButton
                        label="Delete"
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
