import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
const execFileAsync = promisify(execFile);
const MAX_APK_SET_BYTES = 4 * 1024 * 1024 * 1024;
function toDeviceSpec(device) {
    const spec = {};
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
async function runBundletool(args) {
    await execFileAsync("bundletool", args);
}
async function listApkFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];
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
async function ensureApkSet(bundlePath, deviceSpecPath, workDir) {
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
async function extractApks(apksPath, deviceSpecPath, workDir) {
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
export async function resolveAndroidInstall(input) {
    if (input.storageKind !== "local") {
        return {
            buildId: input.buildId,
            status: "resolver-not-implemented",
            reason: "storage-not-supported",
        };
    }
    const ext = path.extname(input.storagePath).toLowerCase();
    const deviceSpec = toDeviceSpec(input.device);
    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "einstore-android-"));
    const deviceSpecPath = path.join(workDir, "device.json");
    await fs.writeFile(deviceSpecPath, JSON.stringify(deviceSpec, null, 2));
    let apkFiles = [];
    if (ext === ".apk") {
        apkFiles = [input.storagePath];
    }
    else {
        const apksPath = ext === ".apks"
            ? input.storagePath
            : await ensureApkSet(input.storagePath, deviceSpecPath, workDir);
        const outputDir = await extractApks(apksPath, deviceSpecPath, workDir);
        apkFiles = await listApkFiles(outputDir);
    }
    let totalBytes = 0;
    const files = [];
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
        };
    }
    return {
        buildId: input.buildId,
        status: "resolved",
        files,
        totalBytes,
    };
}
