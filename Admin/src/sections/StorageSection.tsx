import Panel from "../components/Panel";
import StorageCard from "../components/StorageCard";
import { formatBytes } from "../lib/apps";
import type { StorageUsageUser } from "../types/usage";

type StorageSectionProps = {
  users: StorageUsageUser[];
  totalBytes: number;
  isLoading?: boolean;
};

const StorageSection = ({ users, totalBytes, isLoading = false }: StorageSectionProps) => {
  const sortedUsers = [...users].sort((a, b) => b.totalBytes - a.totalBytes);
  const topUsers = sortedUsers.slice(0, 3);
  const aggregateTotal =
    totalBytes > 0
      ? totalBytes
      : topUsers.reduce((sum, user) => sum + user.totalBytes, 0);
  const emptyStateText = isLoading
    ? "Loading storage usage…"
    : "No storage usage yet.";

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        {topUsers.length ? (
          topUsers.map((user) => (
            <div key={user.userId} className="col-span-12">
              <StorageCard
                label={user.fullName || user.username}
                usedBytes={user.totalBytes}
                totalBytes={aggregateTotal}
                builds={user.buildCount}
              />
            </div>
          ))
        ) : (
          <Panel className="col-span-12">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {emptyStateText}
            </p>
            {!isLoading && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Usage will appear after builds are uploaded ({formatBytes(0)} used).
              </p>
            )}
          </Panel>
        )}
      </div>
    </section>
  );
};

export default StorageSection;
