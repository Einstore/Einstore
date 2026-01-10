import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  app: { upsert: vi.fn() },
  version: { upsert: vi.fn() },
  build: { create: vi.fn() },
  target: { create: vi.fn() },
  capability: { createMany: vi.fn() },
  complianceArtifact: { create: vi.fn() },
};

vi.mock("../../prisma.js", () => ({
  prisma: prismaMock,
}));

const { ingestAndroidApk } = await import("../android.js");

const apkPath = path.resolve(process.cwd(), "tests", "app-debug.apk");

const isPng = (filePath: string) => {
  const buffer = fs.readFileSync(filePath);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return buffer.subarray(0, 8).equals(signature);
};

describe("ingestAndroidApk", () => {
  beforeEach(() => {
    prismaMock.app.upsert.mockResolvedValue({ id: "app-android" });
    prismaMock.version.upsert.mockResolvedValue({ id: "version-android" });
    prismaMock.build.create.mockResolvedValue({ id: "build-android" });
    prismaMock.target.create.mockResolvedValue({ id: "target-android" });
    prismaMock.capability.createMany.mockResolvedValue({ count: 0 });
    prismaMock.complianceArtifact.create.mockResolvedValue({ id: "artifact-android" });
  });

  afterEach(() => {
    vi.clearAllMocks();
    const storageDir = path.resolve(process.cwd(), "storage", "ingest", "build-android");
    if (fs.existsSync(storageDir)) {
      fs.rmSync(storageDir, { recursive: true, force: true });
    }
  });

  it("extracts android metadata and icon bitmap", async () => {
    const result = await ingestAndroidApk(apkPath);
    expect(result.appName).toBe("GPTeen");
    expect(result.packageName).toBe("ai.unlikeother.gpteen");
    expect(result.versionName).toBe("1.11.12");
    expect(result.versionCode).toBe("121");
    expect(result.iconBitmap?.path).toBeTruthy();
    expect(result.iconBitmap?.width).toBeGreaterThan(0);
    expect(result.iconBitmap?.height).toBeGreaterThan(0);
    expect(isPng(result.iconBitmap!.path)).toBe(true);
  });
});
