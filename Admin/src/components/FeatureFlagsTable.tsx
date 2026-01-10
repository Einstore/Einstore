import ActionButton from "./ActionButton";
import Panel from "./Panel";
import ToggleSwitch from "./ToggleSwitch";
import type { FeatureFlag } from "../data/mock";

type FeatureFlagsTableProps = {
  flags: FeatureFlag[];
  isLoading?: boolean;
  onEdit: (flag: FeatureFlag) => void;
  onToggle: (flag: FeatureFlag) => void;
};

const FeatureFlagsTable = ({
  flags,
  isLoading,
  onEdit,
  onToggle,
}: FeatureFlagsTableProps) => {
  return (
    <Panel className="p-0">
      <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <h2 className="text-lg font-semibold text-ink">Future flags</h2>
        {isLoading ? <span className="text-sm text-ink/60">Loading…</span> : null}
      </div>
      {!flags.length && !isLoading ? (
        <p className="px-6 py-6 text-sm text-ink/60">
          No flags yet. Add one to prepare upcoming rollouts.
        </p>
      ) : null}
      {flags.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-6 py-3">Key</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Enabled</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {flags.map((flag) => (
                <tr key={flag.id} className="bg-white">
                  <td className="px-6 py-4 font-semibold text-ink">
                    {flag.key}
                  </td>
                  <td className="px-6 py-4 text-ink/60">
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
                    <ActionButton
                      label="Edit"
                      variant="outline"
                      onClick={() => onEdit(flag)}
                    />
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
