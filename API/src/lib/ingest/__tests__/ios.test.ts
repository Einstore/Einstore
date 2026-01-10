import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  app: { upsert: vi.fn() },
  version: { upsert: vi.fn() },
  build: { create: vi.fn() },
  target: { create: vi.fn() },
  complianceArtifact: { create: vi.fn() },
};

vi.mock("../../prisma.js", () => ({
  prisma: prismaMock,
}));

const { ingestIosIpa } = await import("../ios.js");

const ipaPath =
  "/System/Volumes/Data/.internal/projects/Projects/GPTeen/ios/build_simulator/PocketPal-sim.ipa";

const isPng = (filePath: string) => {
  const buffer = fs.readFileSync(filePath);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return buffer.subarray(0, 8).equals(signature);
};

describe("ingestIosIpa", () => {
  beforeEach(() => {
    prismaMock.app.upsert.mockResolvedValue({ id: "app-ios" });
    prismaMock.version.upsert.mockResolvedValue({ id: "version-ios" });
    prismaMock.build.create.mockResolvedValue({ id: "build-ios" });
    prismaMock.target.create.mockResolvedValue({ id: "target-ios" });
    prismaMock.complianceArtifact.create.mockResolvedValue({ id: "artifact-ios" });
  });

  afterEach(() => {
    vi.clearAllMocks();
    const storageDir = path.resolve(process.cwd(), "storage", "ingest", "ai.pocketpal");
    if (fs.existsSync(storageDir)) {
      fs.rmSync(storageDir, { recursive: true, force: true });
    }
  });

  it("extracts ios metadata and icon bitmap", async () => {
    const result = await ingestIosIpa(ipaPath);
    expect(result.appName).toBe("GPTeen");
    expect(result.identifier).toBe("ai.pocketpal");
    expect(result.version).toBe("1.11.12");
    expect(result.buildNumber).toBe("121");
    expect(result.targets.length).toBeGreaterThan(0);
    const mainTarget = result.targets[0];
    expect(mainTarget.supportedDevices).toContain("iphone");
    expect(mainTarget.supportedDevices).toContain("ipad");
    expect(mainTarget.orientations.length).toBeGreaterThan(0);
    expect(mainTarget.iconBitmap?.path).toBeTruthy();
    expect(isPng(mainTarget.iconBitmap!.path)).toBe(true);
  });
});
