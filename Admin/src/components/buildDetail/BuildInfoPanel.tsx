import Panel from "../Panel";
import SectionHeader from "../SectionHeader";
import type { ApiBuildMetadata } from "../../lib/apps";

type Translate = (key: string, fallback: string, params?: Record<string, string | number>) => string;

type BuildInfoPanelProps = {
  build: ApiBuildMetadata;
  appName: string;
  identifier: string;
  version: string;
  buildNumber: string;
  size: string;
  created: string;
  signingIssuer: string;
  signingSubject: string;
  t: Translate;
};

const BuildInfoPanel = ({
  build,
  appName,
  identifier,
  version,
  buildNumber,
  size,
  created,
  signingIssuer,
  signingSubject,
  t,
}: BuildInfoPanelProps) => {
  return (
    <Panel className="col-span-12 md:col-span-8 space-y-4">
      <SectionHeader title={t("build.info.title", "Build information")} />
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("common.app", "App")}
          </dt>
          <dd className="text-sm text-slate-900 dark:text-slate-100">{appName}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("build.info.identifier", "Identifier")}
          </dt>
          <dd className="text-sm text-slate-900 dark:text-slate-100">{identifier}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("common.version", "Version")}
          </dt>
          <dd className="text-sm text-slate-900 dark:text-slate-100">{version}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("build.info.buildNumber", "Build number")}
          </dt>
          <dd className="text-sm text-slate-900 dark:text-slate-100">{buildNumber}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("build.info.storage", "Storage")}
          </dt>
          <dd className="text-sm text-slate-900 dark:text-slate-100">
            {build.storageKind.toUpperCase()}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("build.info.size", "Size")}
          </dt>
          <dd className="text-sm text-slate-900 dark:text-slate-100">{size}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("build.info.created", "Created")}
          </dt>
          <dd className="text-sm text-slate-900 dark:text-slate-100">{created}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("build.info.buildId", "Build ID")}
          </dt>
          <dd className="text-sm text-slate-900 dark:text-slate-100">{build.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("build.info.signingIssuer", "Signing issuer")}
          </dt>
          <dd className="text-sm text-slate-900 dark:text-slate-100">
            {signingIssuer || t("common.emptyDash", "—")}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("build.info.signingSubject", "Signing subject")}
          </dt>
          <dd className="text-sm text-slate-900 dark:text-slate-100">
            {signingSubject || t("common.emptyDash", "—")}
          </dd>
        </div>
      </dl>
    </Panel>
  );
};

export default BuildInfoPanel;
