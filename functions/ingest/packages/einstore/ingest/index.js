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
  const plistEntries = entryNames.filter((name) => name.endsWith("Info.plist"));
  const buffers = await readEntryBuffers(zipfile, plistEntries);
  for (const entryName of plistEntries) {
    if (!entryName.includes("Payload/") || !entryName.includes(".app/")) continue;
    const buffer = buffers.get(entryName);
    if (!buffer) continue;
    const info = plist.parse(buffer.toString("utf8"));
    const bundleId = String(info.CFBundleIdentifier || "");
    if (!bundleId) continue;
    const name = String(info.CFBundleDisplayName || info.CFBundleName || info.CFBundleExecutable || bundleId);
    const version = String(info.CFBundleShortVersionString || info.CFBundleVersion || "");
    const build = String(info.CFBundleVersion || "");
    const root = entryName.replace(/Info\.plist$/, "");
    targets.push({ entryName, root, bundleId, name, version, build, info });
  }
  return targets;
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
    const icon = await extractBestIcon(zipfile, entryNames, mainTarget.root);
    let iconPath = null;
    if (icon) {
      const normalized = await normalizeIosIconPng(icon.buffer);
      const dimensions = readPngDimensions(normalized) || { width: icon.width, height: icon.height };
      const iconKey = `extracted/${key}/icon-${dimensions.width}x${dimensions.height}.png`;
      iconPath = await uploadToSpaces(client, bucket, iconKey, normalized, "image/png");
    }
    return {
      ok: true,
      kind,
      appName: mainTarget.name,
      identifier: mainTarget.bundleId,
      version: mainTarget.version,
      buildNumber: mainTarget.build,
      iconPath,
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
    if (icon) {
      const iconKey = `extracted/${key}/icon-${icon.width}x${icon.height}.png`;
      iconPath = await uploadToSpaces(client, bucket, iconKey, icon.buffer, "image/png");
    }
    return {
      ok: true,
      kind,
      packageName: manifest.package,
      versionName: manifest.versionName,
      versionCode: manifest.versionCode,
      iconPath,
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
