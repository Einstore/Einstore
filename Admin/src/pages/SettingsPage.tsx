import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import SelectField from "../components/SelectField";
import TextInput from "../components/TextInput";
import ToggleField from "../components/ToggleField";
import type { SettingsProfile } from "../data/mock";

type SettingsPageProps = {
  settings: SettingsProfile;
};

const SettingsPage = ({ settings }: SettingsPageProps) => {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Workspace settings"
        description="Configure default approvals, integrations, and alert routing."
      />
      <Panel className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            id="workspace-name"
            label="Workspace name"
            value={settings.workspaceName}
            placeholder="Einstore Operations"
          />
          <TextInput
            id="release-domain"
            label="Release domain"
            value={settings.releaseDomain}
            placeholder="releases.einstore.dev"
            type="url"
          />
          <SelectField
            id="approval-window"
            label="Default approval window"
            value={settings.approvalWindow}
            options={[
              { value: "24", label: "24 hours" },
              { value: "48", label: "48 hours" },
              { value: "72", label: "72 hours" },
            ]}
          />
          <TextInput
            id="alert-email"
            label="Alert email"
            value={settings.alertEmail}
            placeholder="ops@einstore.dev"
            type="email"
          />
        </div>
      </Panel>
      <Panel className="space-y-4">
        <ToggleField
          id="auto-promote"
          label="Auto-promote passing builds"
          description="Automatically move builds to staging after smoke tests."
          defaultChecked={settings.autoPromote}
        />
        <ToggleField
          id="policy-digest"
          label="Weekly policy digest"
          description="Send compliance summary to security leads every Friday."
          defaultChecked={settings.policyDigest}
        />
        <ToggleField
          id="signature-rotation"
          label="Certificate rotation reminders"
          description="Notify owners 30 days before certificate expiry."
          defaultChecked={settings.rotationReminders}
        />
      </Panel>
    </div>
  );
};

export default SettingsPage;
