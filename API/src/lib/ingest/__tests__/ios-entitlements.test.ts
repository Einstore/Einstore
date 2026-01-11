import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractIosEntitlements } from "../ios-entitlements.js";
import { readZipEntries } from "../../zip.js";

vi.mock("../../zip.js", () => ({
  readZipEntries: vi.fn(),
}));

const readZipEntriesMock = vi.mocked(readZipEntries);

const buildProvisioningProfileBuffer = (plistBody: string) =>
  Buffer.from(`CMS-${plistBody}-END`, "utf8");

describe("extractIosEntitlements", () => {
  beforeEach(() => {
    readZipEntriesMock.mockReset();
  });

  it("classifies enterprise profiles and falls back to profile entitlements", async () => {
    const profileXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>ProvisionsAllDevices</key>
  <true/>
  <key>TeamName</key>
  <string>Example Team</string>
  <key>Entitlements</key>
  <dict>
    <key>aps-environment</key>
    <string>production</string>
  </dict>
</dict>
</plist>`;
    const entryName = "Payload/App.app/embedded.mobileprovision";
    readZipEntriesMock.mockResolvedValue(new Map([[entryName, buildProvisioningProfileBuffer(profileXml)]]));

    const result = await extractIosEntitlements("fake.ipa", [entryName], "Payload/App.app/");
    expect(result.distribution.kind).toBe("enterprise");
    expect(result.entitlements).toEqual({ "aps-environment": "production" });
    expect(result.entitlementsSource).toBe(`${entryName}:Entitlements`);
    expect(result.provisioningProfile?.teamName).toBe("Example Team");
  });

  it("classifies adhoc profiles when provisioned devices are present", async () => {
    const profileXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>ProvisionedDevices</key>
  <array>
    <string>device-1</string>
  </array>
</dict>
</plist>`;
    const entryName = "Payload/App.app/embedded.mobileprovision";
    readZipEntriesMock.mockResolvedValue(new Map([[entryName, buildProvisioningProfileBuffer(profileXml)]]));

    const result = await extractIosEntitlements("fake.ipa", [entryName], "Payload/App.app/");
    expect(result.distribution.kind).toBe("adhoc");
  });

  it("prefers xcent entitlements for aps-environment", async () => {
    const profileXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>ProvisionedDevices</key>
  <array>
    <string>device-1</string>
  </array>
  <key>Entitlements</key>
  <dict>
    <key>aps-environment</key>
    <string>development</string>
  </dict>
</dict>
</plist>`;
    const xcentXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>aps-environment</key>
  <string>production</string>
</dict>
</plist>`;
    const profileEntry = "Payload/App.app/embedded.mobileprovision";
    const xcentEntry = "Payload/App.app/archived-expanded-entitlements.xcent";
    readZipEntriesMock.mockResolvedValue(
      new Map([
        [profileEntry, buildProvisioningProfileBuffer(profileXml)],
        [xcentEntry, Buffer.from(xcentXml, "utf8")],
      ]),
    );

    const result = await extractIosEntitlements(
      "fake.ipa",
      [profileEntry, xcentEntry],
      "Payload/App.app/",
    );
    expect(result.distribution.kind).toBe("adhoc");
    expect(result.entitlements).toEqual({ "aps-environment": "production" });
    expect(result.entitlementsSource).toBe(xcentEntry);
  });

  it("returns none when no provisioning profile entry exists", async () => {
    const result = await extractIosEntitlements("fake.ipa", [], "Payload/App.app/");
    expect(result.distribution.kind).toBe("none");
    expect(readZipEntriesMock).not.toHaveBeenCalled();
  });
});
