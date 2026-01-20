import { useMemo, useState } from "react";

import CodeBlock from "./CodeBlock";
import Tabs from "./Tabs";
import { useAlerts } from "../lib/alerts";
import { useI18n } from "../lib/i18n";

type IntegrationInstructionsProps = {
  apiBaseUrl: string;
  scriptUrl: string;
  apiKeyToken?: string | null;
  selectedKeyName?: string | null;
  selectedKeyType?: string | null;
};

const IntegrationInstructions = ({
  apiBaseUrl,
  scriptUrl,
  apiKeyToken,
  selectedKeyName,
  selectedKeyType,
}: IntegrationInstructionsProps) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("github-actions");
  const { pushAlert } = useAlerts();

  const tokenValue = apiKeyToken || "YOUR_API_KEY";
  const fileValue = "/path/to/app.ipa";
  const isUpdatesKey = selectedKeyType === "updates";
  const updatePayload = useMemo(
    () =>
      JSON.stringify(
        {
          bundleId: "com.example.app",
          version: "1.2.3",
          build: "42",
          lastUpdated: "2025-01-10T12:00:00Z",
        },
        null,
        2
      ),
    []
  );
  const updateCurl = useMemo(
    () =>
      [
        `curl -X POST "${apiBaseUrl}/updates/check" \\`,
        `  -H "x-api-key: ${tokenValue}" \\`,
        `  -H "Content-Type: application/json" \\`,
        `  -d '${updatePayload.replace(/\n/g, " ")}'`,
      ].join("\n"),
    [apiBaseUrl, tokenValue, updatePayload]
  );
  const command = useMemo(
    () =>
      [
        `EINSTORE_API_KEY="${tokenValue}"`,
        `EINSTORE_API_BASE_URL="${apiBaseUrl}"`,
        `EINSTORE_FILE="${fileValue}"`,
        `/bin/bash -c "$(curl -fsSL ${scriptUrl})"`,
      ].join(" \\\n  "),
    [apiBaseUrl, scriptUrl, tokenValue]
  );

  const githubActionsSnippet = useMemo(
    () =>
      `- name: Upload build to Einstore
  env:
    EINSTORE_API_KEY: ${tokenValue === "YOUR_API_KEY" ? "${{ secrets.EINSTORE_API_KEY }}" : tokenValue}
    EINSTORE_API_BASE_URL: ${apiBaseUrl}
    EINSTORE_FILE: ${fileValue}
  run: |
    curl -fsSL ${scriptUrl} | bash`,
    [apiBaseUrl, scriptUrl, tokenValue]
  );

  const genericSnippet = useMemo(
    () =>
      `export EINSTORE_API_KEY="${tokenValue}"
export EINSTORE_API_BASE_URL="${apiBaseUrl}"
export EINSTORE_FILE="${fileValue}"
curl -fsSL ${scriptUrl} | bash`,
    [apiBaseUrl, scriptUrl, tokenValue]
  );

  const tabs = [
    {
      id: "github-actions",
      label: t("integrations.tabs.githubActions", "GitHub Actions"),
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("integrations.githubActions.helpPrefix", "Store the API key as a secret named")}{" "}
            <span className="font-semibold">EINSTORE_API_KEY</span>.
          </p>
          <CodeBlock
            code={githubActionsSnippet}
            onCopy={() =>
              pushAlert({
                kind: "ok",
                message: t("integrations.githubActions.copied", "GitHub Actions snippet copied."),
              })
            }
          />
        </div>
      ),
    },
    {
      id: "generic-ci",
      label: t("integrations.tabs.genericCi", "Generic CI"),
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("integrations.generic.help", "Export the required environment variables, then run the script.")}
          </p>
          <CodeBlock
            code={genericSnippet}
            onCopy={() =>
              pushAlert({ kind: "ok", message: t("integrations.generic.copied", "CI snippet copied.") })
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {isUpdatesKey
            ? t("integrations.updateChecks.title", "Update checks")
            : t("integrations.title", "CI integrations")}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {selectedKeyName
            ? t("integrations.selectedKey", "Selected key: {name}", { name: selectedKeyName })
            : t("integrations.noKey", "Select an API key to generate a ready-to-run script.")}
        </p>
      </div>
      {isUpdatesKey ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            {t("integrations.updateChecks.endpoint", "Endpoint:")}{" "}
            <span className="break-all font-mono">{apiBaseUrl}/updates/check</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t(
              "integrations.updateChecks.help",
              "Send bundleId (required) with optional version, build, and lastUpdated to check for updates."
            )}
          </p>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t("integrations.updateChecks.payload", "Request payload")}
            </p>
            <CodeBlock
              code={updatePayload}
              onCopy={() =>
                pushAlert({
                  kind: "ok",
                  message: t("integrations.updateChecks.payloadCopied", "Payload copied."),
                })
              }
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t("integrations.updateChecks.example", "Example request")}
            </p>
            <CodeBlock
              code={updateCurl}
              onCopy={() =>
                pushAlert({
                  kind: "ok",
                  message: t("integrations.updateChecks.exampleCopied", "Request snippet copied."),
                })
              }
            />
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            {t("integrations.scriptUrl", "Script URL:")}{" "}
            <span className="break-all font-mono">{scriptUrl}</span>
          </div>
          {!apiKeyToken ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t(
                "integrations.tokenNotice",
                "API key tokens are shown once. Create a new key to get a script-ready token."
              )}
            </p>
          ) : null}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t("integrations.quickCommand", "Quick command")}
            </p>
            <CodeBlock
              code={command}
              onCopy={() =>
                pushAlert({ kind: "ok", message: t("integrations.command.copied", "Command copied.") })
              }
            />
          </div>
          <Tabs items={tabs} activeId={activeTab} onChange={setActiveTab} />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t(
              "integrations.footerPrefix",
              "The script uploads binaries directly to Spaces using a presigned URL (no binary hits the API). Set"
            )}{" "}
            <span className="font-mono">EINSTORE_KIND</span>{" "}
            {t("integrations.footerSuffix", "if your file extension is non-standard.")}
          </p>
        </>
      )}
    </div>
  );
};

export default IntegrationInstructions;
