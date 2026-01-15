const { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const yauzl = require("yauzl");
const plist = require("plist");
const ManifestParser = require("@devicefarmer/adbkit-apkreader/lib/apkreader/parser/manifest");
const { PassThrough } = require("stream");
const sharp = require("sharp");
const { convert: convertCgbi, isCgbiPng } = require("cgbi");

const REQUIRED_ENV = ["SPACES_ENDPOINT", "SPACES_REGION", "SPACES_KEY", "SPACES_SECRET", "SPACES_BUCKET"];

const parsePngChunks = (buffer) => {
  if (!buffer || buffer.length < 8) return null;
  const signature = buffer.subarray(0, 8);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!signature.equals(pngSignature)) return null;
  const chunks = [];
  let offset = 8;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const crcEnd = dataEnd + 4;
    if (crcEnd > buffer.length) break;
    chunks.push({ type, data: buffer.subarray(dataStart, dataEnd) });
    offset = crcEnd;
    if (type === "IEND") break;
  }
  return chunks;
};

const readPngDimensions = (buffer) => {
  const chunks = parsePngChunks(buffer);
  if (!chunks) return null;
  const ihdr = chunks.find((chunk) => chunk.type === "IHDR");
  if (!ihdr || ihdr.data.length < 8) return null;
  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  if (!width || !height) return null;
  return { width, height };
};

const mapDeviceFamily = (family) => {
  if (!Array.isArray(family)) return [];
  return family.map((value) => {
    switch (value) {
      case 1:
        return "iphone";
      case 2:
        return "ipad";
      case 3:
        return "appletv";
      case 4:
        return "watch";
      case 6:
        return "carplay";
      default:
        return `unknown-${value}`;
    }
  });
};

const resolveRole = (extensionPoint) => {
  if (!extensionPoint) return "app";
  const lower = extensionPoint.toLowerCase();
  if (lower.includes("widget")) return "widget";
  if (lower.includes("clip")) return "clip";
  return "extension";
};

const resolveTargetRoots = (entryNames) => {
  const roots = new Set();
  for (const entry of entryNames) {
    if (/^Payload\/[^/]+\.app\/Info\.plist$/.test(entry)) {
      roots.add(entry.replace(/Info\.plist$/, ""));
    }
    if (/^Payload\/[^/]+\.app\/PlugIns\/[^/]+\.appex\/Info\.plist$/.test(entry)) {
      roots.add(entry.replace(/Info\.plist$/, ""));
    }
    if (/^Payload\/[^/]+\.app\/Watch\/[^/]+\.app\/Info\.plist$/.test(entry)) {
      roots.add(entry.replace(/Info\.plist$/, ""));
    }
  }
  return Array.from(roots);
};

let pngValidatorPromise = null;

const getPngValidator = async () => {
  if (!pngValidatorPromise) {
    pngValidatorPromise = import("png-validator")
      .then((mod) => mod.pngValidator || mod.default || mod)
      .catch((error) => {
        console.warn("Failed to load png-validator.", error);
        return null;
      });
  }
  return pngValidatorPromise;
};

const normalizeIosIconPng = async (buffer) => {
  let working = buffer;

  if (isCgbiPng(buffer)) {
    console.log("normalizeIosIconPng: detected CgBI PNG, converting.");
    try {
      const converted = await convertCgbi(buffer);
      working = Buffer.from(converted);
    } catch (error) {
      console.warn("CgBI conversion failed, using raw icon PNG.", error);
      working = buffer;
    }
  }

  try {
    working = await sharp(working)
      .ensureAlpha()
      .toColorspace("srgb")
      .png({ force: true })
      .toBuffer();
  } catch (error) {
    console.warn("PNG normalization failed, using existing icon PNG.", error);
  }

  const pngValidator = await getPngValidator();
  if (pngValidator) {
    try {
      pngValidator(working);
    } catch (error) {
      console.warn("PNG validation reported issues.", error);
    }
  }

  return working;
};

class S3RandomAccessReader extends yauzl.RandomAccessReader {
  constructor(client, bucket, key) {
    super();
    this.client = client;
    this.bucket = bucket;
    this.key = key;
  }

  _readStreamForRange(start, end) {
    const pass = new PassThrough();
    const range = `bytes=${start}-${end - 1}`;
    this.client
      .send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: this.key,
          Range: range,
        }),
      )
      .then((response) => {
        if (!response.Body) {
          pass.emit("error", new Error("Missing S3 body"));
          return;
        }
        response.Body.on("error", (err) => pass.emit("error", err));
        response.Body.pipe(pass);
      })
      .catch((err) => pass.emit("error", err));
    return pass;
  }
}

const openZipFromSpaces = async (client, bucket, key) => {
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  const size = Number(head.ContentLength || 0);
  if (!size) {
    throw new Error("Unable to determine object size");
  }
  const reader = new S3RandomAccessReader(client, bucket, key);
  return new Promise((resolve, reject) => {
    yauzl.fromRandomAccessReader(reader, size, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        reject(err || new Error("Unable to open zip"));
        return;
      }
      resolve(zipfile);
    });
  });
};

const listZipEntries = (zipfile) =>
  new Promise((resolve, reject) => {
    const entries = [];
    zipfile.readEntry();
    zipfile.on("entry", (entry) => {
      entries.push(entry.fileName);
      zipfile.readEntry();
    });
    zipfile.on("end", () => resolve(entries));
    zipfile.on("error", reject);
  });

const readEntryBuffer = (zipfile, entryName) =>
  new Promise((resolve, reject) => {
    let found = false;
    zipfile.readEntry();
    zipfile.on("entry", (entry) => {
      if (entry.fileName === entryName) {
        found = true;
        zipfile.openReadStream(entry, (err, stream) => {
          if (err || !stream) {
            reject(err || new Error("Unable to read entry"));
            return;
          }
          const chunks = [];
          stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });
      } else {
        zipfile.readEntry();
      }
    });
    zipfile.on("end", () => {
      if (!found) reject(new Error(`Missing entry ${entryName}`));
    });
    zipfile.on("error", reject);
  });

const readEntryBuffers = async (zipfile, entryNames) => {
  const buffers = new Map();
  for (const entryName of entryNames) {
    try {
      const buffer = await readEntryBuffer(zipfile, entryName);
      buffers.set(entryName, buffer);
    } catch {
      // Ignore missing entry
    }
  }
  return buffers;
};

const extractBestIcon = async (zipfile, entryNames, rootPrefix) => {
  const candidates = entryNames
    .filter((name) => name.startsWith(rootPrefix) && name.endsWith(".png"))
    .map((name) => {
      const lower = name.toLowerCase();
      const filename = lower.split("/").pop() || "";
      const score =
        (lower.includes("appicon") ? 10 : 0) +
        (filename.includes("ic_launcher") || filename.includes("app_icon") ? 8 : 0) +
        (filename.includes("launcher") ? 4 : 0) +
        (filename.includes("icon") ? 2 : 0);
      return { name, score };
    });

  let best = null;
  const buffers = await readEntryBuffers(zipfile, candidates.map((c) => c.name));
  for (const candidate of candidates) {
    const buffer = buffers.get(candidate.name);
    if (!buffer) continue;
    const dimensions = readPngDimensions(buffer);
    if (!dimensions) continue;
    if (
      !best ||
      dimensions.width * dimensions.height > best.width * best.height ||
      (dimensions.width * dimensions.height === best.width * best.height &&
        candidate.score > best.score)
    ) {
      best = {
        name: candidate.name,
        buffer,
        width: dimensions.width,
        height: dimensions.height,
      };
    }
  }

  return best;
};

const parseIosTargets = async (zipfile, entryNames) => {
  const targets = [];
  const targetRoots = resolveTargetRoots(entryNames);
  const plistEntries = targetRoots.map((root) => `${root}Info.plist`);
  const buffers = await readEntryBuffers(zipfile, plistEntries);
  for (const root of targetRoots) {
    const entryName = `${root}Info.plist`;
    const buffer = buffers.get(entryName);
    if (!buffer) continue;
    const info = plist.parse(buffer.toString("utf8"));
    const bundleId = String(info.CFBundleIdentifier || "");
    if (!bundleId) continue;
    const name = String(info.CFBundleDisplayName || info.CFBundleName || info.CFBundleExecutable || bundleId);
    const version = String(info.CFBundleShortVersionString || info.CFBundleVersion || "");
    const build = String(info.CFBundleVersion || "");
    const deviceFamily = Array.isArray(info.UIDeviceFamily) ? info.UIDeviceFamily : undefined;
    const supportedDevices = mapDeviceFamily(deviceFamily);
    const orientations = [
      ...(Array.isArray(info.UISupportedInterfaceOrientations) ? info.UISupportedInterfaceOrientations : []),
      ...(Array.isArray(info["UISupportedInterfaceOrientations~ipad"])
        ? info["UISupportedInterfaceOrientations~ipad"]
        : []),
    ];
    const minOsVersion = info.MinimumOSVersion ? String(info.MinimumOSVersion) : undefined;
    const extension = info.NSExtension || undefined;
    const extensionPoint =
      extension && typeof extension === "object" && extension.NSExtensionPointIdentifier
        ? String(extension.NSExtensionPointIdentifier)
        : undefined;
    const platform = supportedDevices.includes("watch") || info.WKWatchKitApp ? "watchos" : "ios";
    const role = resolveRole(extensionPoint);
    targets.push({
      entryName,
      root,
      bundleId,
      name,
      version,
      build,
      supportedDevices,
      orientations,
      minOsVersion,
      platform,
      role,
      info,
    });
  }
  return targets;
};

const tryParsePlist = (buffer) => {
  try {
    return plist.parse(buffer.toString("utf8"));
  } catch (error) {
    return null;
  }
};

const extractXmlPlist = (buffer) => {
  const xmlStart = buffer.indexOf("<?xml");
  const plistStart = buffer.indexOf("<plist");
  const start = xmlStart !== -1 ? xmlStart : plistStart;
  const end = buffer.indexOf("</plist>");
  if (start === -1 || end === -1 || end <= start) return null;
  return buffer.subarray(start, end + "</plist>".length).toString("utf8");
};

const parseEmbeddedMobileProvision = (buffer) => {
  const xml = extractXmlPlist(buffer);
  if (!xml) return null;
  try {
    return plist.parse(xml);
  } catch (error) {
    return null;
  }
};

const summarizeProvisioningProfile = (profile) => {
  const provisionedDevices = Array.isArray(profile.ProvisionedDevices)
    ? profile.ProvisionedDevices.filter((item) => typeof item === "string")
    : [];
  const teamIdentifier = Array.isArray(profile.TeamIdentifier)
    ? profile.TeamIdentifier.filter((item) => typeof item === "string")
    : undefined;
  return {
    name: typeof profile.Name === "string" ? profile.Name : undefined,
    uuid: typeof profile.UUID === "string" ? profile.UUID : undefined,
    teamIdentifier,
    teamName: typeof profile.TeamName === "string" ? profile.TeamName : undefined,
    appIdName: typeof profile.AppIDName === "string" ? profile.AppIDName : undefined,
    creationDate:
      profile.CreationDate instanceof Date || typeof profile.CreationDate === "string"
        ? profile.CreationDate
        : undefined,
    expirationDate:
      profile.ExpirationDate instanceof Date || typeof profile.ExpirationDate === "string"
        ? profile.ExpirationDate
        : undefined,
    provisionsAllDevices: profile.ProvisionsAllDevices === true,
    provisionedDevicesCount: provisionedDevices.length || undefined,
  };
};

const resolveDistributionFromProfile = (profile) => {
  if (!profile) {
    return { kind: "broken", reason: "provisioning_profile_unreadable" };
  }
  if (profile.ProvisionsAllDevices === true) {
    return { kind: "enterprise", reason: "provisions_all_devices" };
  }
  const provisionedDevices = Array.isArray(profile.ProvisionedDevices)
    ? profile.ProvisionedDevices
    : [];
  if (provisionedDevices.length) {
    return { kind: "adhoc", reason: "provisioned_devices_present" };
  }
  return { kind: "appstore", reason: "no_provisioned_devices" };
};

const extractIosEntitlements = async (zipfile, entryNames, targetRoot) => {
  const provisioningProfileEntry = entryNames.find(
    (entry) => entry === `${targetRoot}embedded.mobileprovision`,
  );
  const explicitXcentEntry =
    entryNames.find((entry) => entry === `${targetRoot}archived-expanded-entitlements.xcent`) ??
    entryNames.find(
      (entry) => entry.startsWith(targetRoot) && entry.toLowerCase().endsWith(".xcent"),
    );
  const wantedEntries = [];
  if (provisioningProfileEntry) {
    wantedEntries.push(provisioningProfileEntry);
  }
  if (explicitXcentEntry) {
    wantedEntries.push(explicitXcentEntry);
  }
  const buffers = wantedEntries.length > 0 ? await readEntryBuffers(zipfile, wantedEntries) : new Map();

  let entitlements = null;
  let entitlementsSource;
  if (explicitXcentEntry) {
    const entitlementsBuffer = buffers.get(explicitXcentEntry);
    if (entitlementsBuffer) {
      entitlements = tryParsePlist(entitlementsBuffer);
      entitlementsSource = entitlements ? explicitXcentEntry : `${explicitXcentEntry} (unreadable)`;
    }
  }

  let provisioningProfile = null;
  let provisioningProfileSource;
  let distribution = {
    kind: "none",
    reason: "provisioning_profile_missing",
  };

  if (provisioningProfileEntry) {
    const profileBuffer = buffers.get(provisioningProfileEntry);
    provisioningProfileSource = provisioningProfileEntry;
    if (!profileBuffer) {
      distribution = { kind: "broken", reason: "provisioning_profile_unreadable" };
    } else {
      provisioningProfile = parseEmbeddedMobileProvision(profileBuffer);
      distribution = resolveDistributionFromProfile(provisioningProfile);
    }
  }

  if (!entitlements && provisioningProfile && provisioningProfile.Entitlements) {
    entitlements = provisioningProfile.Entitlements;
    entitlementsSource = `${provisioningProfileEntry}:Entitlements`;
  }

  return {
    distribution,
    entitlements,
    entitlementsSource,
    provisioningProfile: provisioningProfile ? summarizeProvisioningProfile(provisioningProfile) : null,
    provisioningProfileSource,
  };
};

const parseAndroidManifest = (buffer) => {
  const parser = new ManifestParser(buffer, {});
  return parser.parse();
};

const uploadToSpaces = async (client, bucket, key, buffer, contentType) => {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "private",
    }),
  );
  return `spaces://${bucket}/${key}`;
};

const resolveBucketKey = (storagePath) => {
  if (!storagePath.startsWith("spaces://")) {
    throw new Error("Expected storagePath in spaces://bucket/key format");
  }
  const stripped = storagePath.replace("spaces://", "");
  const [bucket, ...rest] = stripped.split("/");
  return { bucket, key: rest.join("/") };
};

exports.main = async (args) => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    return { ok: false, error: `Missing env: ${missing.join(", ")}` };
  }

  const { kind, storagePath } = args || {};
  if (!kind || !storagePath) {
    return { ok: false, error: "Missing kind/storagePath" };
  }

  const spacesConfig = {
    region: process.env.SPACES_REGION,
    endpoint: process.env.SPACES_ENDPOINT,
    credentials: {
      accessKeyId: process.env.SPACES_KEY,
      secretAccessKey: process.env.SPACES_SECRET,
    },
  };

  const client = new S3Client(spacesConfig);
  const bucket = process.env.SPACES_BUCKET;
  const { bucket: inputBucket, key } = resolveBucketKey(storagePath);
  const objectBucket = inputBucket || bucket;

  const zipfile = await openZipFromSpaces(client, objectBucket, key);
  const entryNames = await listZipEntries(zipfile);

  if (kind === "ipa") {
    const targets = await parseIosTargets(zipfile, entryNames);
    if (!targets.length) {
      return { ok: false, error: "No targets found" };
    }
    const mainTarget = targets[0];
    const entitlements = await extractIosEntitlements(zipfile, entryNames, mainTarget.root);
    const icon = await extractBestIcon(zipfile, entryNames, mainTarget.root);
    let iconPath = null;
    let iconBase64 = null;
    let iconWidth = null;
    let iconHeight = null;
    let iconBytes = null;
    let iconSourcePath = null;
    if (icon) {
      const normalized = await normalizeIosIconPng(icon.buffer);
      const dimensions = readPngDimensions(normalized) || { width: icon.width, height: icon.height };
      const iconKey = `extracted/${key}/icon-${dimensions.width}x${dimensions.height}.png`;
      iconBase64 = normalized.toString("base64");
      iconWidth = dimensions.width;
      iconHeight = dimensions.height;
      iconBytes = normalized.length;
      iconSourcePath = icon.name;
      iconPath = await uploadToSpaces(client, bucket, iconKey, normalized, "image/png");
    }
    return {
      ok: true,
      kind,
      appName: mainTarget.name,
      identifier: mainTarget.bundleId,
      version: mainTarget.version,
      buildNumber: mainTarget.build,
      targets,
      entitlements,
      iconPath,
      iconBase64,
      iconWidth,
      iconHeight,
      iconBytes,
      iconSourcePath,
    };
  }

  if (kind === "apk") {
    const manifestEntry = entryNames.find((name) => name === "AndroidManifest.xml");
    if (!manifestEntry) {
      return { ok: false, error: "Missing AndroidManifest.xml" };
    }
    const manifestBuffer = await readEntryBuffer(zipfile, manifestEntry);
    const manifest = parseAndroidManifest(manifestBuffer);
    const icon = await extractBestIcon(zipfile, entryNames, "res/");
    let iconPath = null;
    let iconBase64 = null;
    let iconWidth = null;
    let iconHeight = null;
    let iconBytes = null;
    let iconSourcePath = null;
    if (icon) {
      const iconKey = `extracted/${key}/icon-${icon.width}x${icon.height}.png`;
      iconBase64 = icon.buffer.toString("base64");
      iconWidth = icon.width;
      iconHeight = icon.height;
      iconBytes = icon.buffer.length;
      iconSourcePath = icon.name;
      iconPath = await uploadToSpaces(client, bucket, iconKey, icon.buffer, "image/png");
    }
    return {
      ok: true,
      kind,
      packageName: manifest.package,
      versionName: manifest.versionName,
      versionCode: manifest.versionCode,
      appName: manifest.application?.label || "",
      minSdk: manifest.usesSdk?.minSdkVersion ? String(manifest.usesSdk.minSdkVersion) : undefined,
      targetSdk: manifest.usesSdk?.targetSdkVersion ? String(manifest.usesSdk.targetSdkVersion) : undefined,
      manifest: {
        packageName: manifest.package,
        versionName: manifest.versionName,
        versionCode: manifest.versionCode,
        minSdk: manifest.usesSdk?.minSdkVersion ? String(manifest.usesSdk.minSdkVersion) : undefined,
        targetSdk: manifest.usesSdk?.targetSdkVersion ? String(manifest.usesSdk.targetSdkVersion) : undefined,
        permissions: manifest.usesPermissions || [],
        icon: manifest.application?.icon || "",
      },
      iconPath,
      iconBase64,
      iconWidth,
      iconHeight,
      iconBytes,
      iconSourcePath,
      permissions: manifest.usesPermissions || [],
    };
  }

  return { ok: false, error: `Unsupported kind ${kind}` };
};

exports.__test = {
  normalizeIosIconPng,
  parsePngChunks,
  readPngDimensions,
};
