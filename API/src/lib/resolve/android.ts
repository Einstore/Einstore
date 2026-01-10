import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const execFileAsync = promisify(execFile);

type AndroidDeviceSpec = {
  sdkVersion?: number;
  supportedAbis?: string[];
  supportedLocales?: string[];
  screenDensity?: number;
};

type AndroidDeviceInput = {
  osVersion: string;
  abi?: string;
  density?: string;
  language?: string;
};

type ResolveInput = {
  buildId: string;
  storageKind: string;
  storagePath: string;
  device: AndroidDeviceInput;
};

const MAX_APK_SET_BYTES = 4 * 1024 * 1024 * 1024;

function toDeviceSpec(device: AndroidDeviceInput): AndroidDeviceSpec {
  const spec: AndroidDeviceSpec = {};
  const sdk = Number.parseInt(device.osVersion, 10);
  if (Number.isFinite(sdk)) {
    spec.sdkVersion = sdk;
  }
  if (device.abi) {
    spec.supportedAbis = [device.abi];
  }
  if (device.language) {
    spec.supportedLocales = [device.language];
  }
  if (device.density) {
    const density = Number.parseInt(device.density, 10);
    if (Number.isFinite(density)) {
      spec.screenDensity = density;
    }
  }
  return spec;
}

async function runBundletool(args: string[]) {
  await execFileAsync("bundletool", args);
}

async function listApkFiles(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listApkFiles(full)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".apk")) {
      files.push(full);
    }
  }
  return files;
}

async function ensureApkSet(bundlePath: string, deviceSpecPath: string, workDir: string) {
  const apksPath = path.join(workDir, "bundle.apks");
  await runBundletool([
    "build-apks",
    `--bundle=${bundlePath}`,
    `--output=${apksPath}`,
    `--device-spec=${deviceSpecPath}`,
    "--overwrite",
  ]);
  return apksPath;
}

async function extractApks(apksPath: string, deviceSpecPath: string, workDir: string) {
  const outputDir = path.join(workDir, "apks");
  await fs.mkdir(outputDir, { recursive: true });
  await runBundletool([
    "extract-apks",
    `--apks=${apksPath}`,
    `--device-spec=${deviceSpecPath}`,
    `--output-dir=${outputDir}`,
    "--overwrite",
  ]);
  return outputDir;
}

export async function resolveAndroidInstall(input: ResolveInput) {
  if (input.storageKind !== "local") {
    return {
      buildId: input.buildId,
      status: "resolver-not-implemented",
      reason: "storage-not-supported",
    } as const;
  }

  const ext = path.extname(input.storagePath).toLowerCase();
  const deviceSpec = toDeviceSpec(input.device);
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "einstore-android-"));
  const deviceSpecPath = path.join(workDir, "device.json");
  await fs.writeFile(deviceSpecPath, JSON.stringify(deviceSpec, null, 2));

  let apkFiles: string[] = [];
  if (ext === ".apk") {
    apkFiles = [input.storagePath];
  } else {
    const apksPath = ext === ".apks"
      ? input.storagePath
      : await ensureApkSet(input.storagePath, deviceSpecPath, workDir);
    const outputDir = await extractApks(apksPath, deviceSpecPath, workDir);
    apkFiles = await listApkFiles(outputDir);
  }

  let totalBytes = 0;
  const files = [] as { path: string; sizeBytes: number }[];
  for (const file of apkFiles) {
    const stat = await fs.stat(file);
    totalBytes += stat.size;
    files.push({ path: file, sizeBytes: stat.size });
  }

  if (totalBytes > MAX_APK_SET_BYTES) {
    return {
      buildId: input.buildId,
      status: "apk-set-too-large",
      maxBytes: MAX_APK_SET_BYTES,
      totalBytes,
    } as const;
  }

  return {
    buildId: input.buildId,
    status: "resolved",
    files,
    totalBytes,
  } as const;
}
