import AuditRow from "../components/AuditRow";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import SecurityPolicyCard from "../components/SecurityPolicyCard";
import type { SecurityAudit, SecurityPolicy } from "../data/mock";

type SecurityPageProps = {
  policies: SecurityPolicy[];
  audits: SecurityAudit[];
};

const SecurityPage = ({ policies, audits }: SecurityPageProps) => {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Security posture"
        description="Track compliance controls and scheduled access reviews."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {policies.map((policy) => (
          <SecurityPolicyCard key={policy.id} {...policy} />
        ))}
      </div>
      <SectionHeader
        title="Access reviews"
        description="Upcoming audits across distribution teams."
      />
      <Panel>
        {audits.map((audit) => (
          <AuditRow key={audit.id} {...audit} />
        ))}
      </Panel>
    </div>
  );
};

export default SecurityPage;
