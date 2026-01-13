import BuildQueueList from "../components/BuildQueueList";
import EmptyUploadDropzone from "../components/EmptyUploadDropzone";
import Panel from "../components/Panel";
import Pagination from "../components/Pagination";
import type { ApiBuild } from "../lib/apps";
import type { PaginationMeta } from "../lib/pagination";

type BuildsPageProps = {
  builds: ApiBuild[];
  buildIcons?: Record<string, string>;
  buildPlatforms?: Record<string, string>;
  onSelectBuild?: (id: string) => void;
  onInstallBuild?: (id: string) => void;
  onDownloadBuild?: (id: string) => void;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onUpload: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
};

const BuildsPage = ({
  builds,
  buildIcons,
  buildPlatforms,
  onSelectBuild,
  onInstallBuild,
  onDownloadBuild,
  pagination,
  onPageChange,
  onPerPageChange,
  onUpload,
}: BuildsPageProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <Panel className="flex h-full items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Total builds
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {builds.length}
              </p>
            </div>
          </Panel>
        </div>
      </div>
      {builds.length ? (
        <>
          <BuildQueueList
            jobs={builds}
            icons={buildIcons}
            platforms={buildPlatforms}
            onSelect={onSelectBuild}
            onInstall={onInstallBuild}
            onDownload={onDownloadBuild}
          />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            perPage={pagination.perPage}
            total={pagination.total}
            onPageChange={onPageChange}
            onPerPageChange={onPerPageChange}
          />
        </>
      ) : (
        <EmptyUploadDropzone onUpload={onUpload} />
      )}
    </div>
  );
};

export default BuildsPage;
