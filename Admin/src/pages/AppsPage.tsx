import AppsTable from "../components/AppsTable";
import FilterPill from "../components/FilterPill";
import Panel from "../components/Panel";
import SearchField from "../components/SearchField";
import SectionHeader from "../components/SectionHeader";
import SelectField from "../components/SelectField";
import type { ApiApp } from "../lib/apps";

type AppsPageProps = {
  apps: ApiApp[];
  onSelectApp?: (app: ApiApp) => void;
};

const AppsPage = ({ apps, onSelectApp }: AppsPageProps) => {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Catalog filters"
        description="Track approved builds, ownership, and current release status."
      />
      <Panel className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-6 xl:col-span-4">
            <SearchField
              id="app-search"
              label="Search apps"
              placeholder="Search by name or team"
            />
          </div>
          <div className="col-span-12 md:col-span-6 xl:col-span-4">
            <SelectField
              id="platform-filter"
              label="Platform"
              options={[
                { value: "all", label: "All platforms" },
                { value: "ios", label: "iOS" },
                { value: "android", label: "Android" },
              ]}
              value="all"
            />
          </div>
          <div className="col-span-12 md:col-span-6 xl:col-span-4">
            <SelectField
              id="status-filter"
              label="Status"
              options={[
                { value: "all", label: "All statuses" },
                { value: "live", label: "Live" },
                { value: "review", label: "In review" },
                { value: "paused", label: "Paused" },
              ]}
              value="all"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <FilterPill label="All" active />
          <FilterPill label="Needs review" />
          <FilterPill label="Expiring certs" />
          <FilterPill label="Pending rollout" />
        </div>
      </Panel>
      <AppsTable apps={apps} onSelectApp={onSelectApp} />
    </div>
  );
};

export default AppsPage;
