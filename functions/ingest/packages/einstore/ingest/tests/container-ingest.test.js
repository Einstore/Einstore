const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawnSync } = require("node:child_process");
const {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { __test } = require("../index.js");

const { parsePngChunks, readPngDimensions } = __test;

const ROOT_DIR = path.resolve(__dirname, "../../../../../..");
const COMPOSE_ROOT = path.resolve(__dirname, "../../../..");
const COMPOSE_FILE = path.join(COMPOSE_ROOT, "docker-compose.test.yml");

const FIXTURES = {
  ipa: path.join(ROOT_DIR, "API", "tests", "stenoch.ipa"),
  apk: path.join(ROOT_DIR, "API", "tests", "app-debug.apk"),
};

const MINIO_ENDPOINT = "http://localhost:9000";
const FUNCTION_URL = "http://localhost:8080";
const BUCKET = "ingest-test";
const ACCESS_KEY = "minio";
const SECRET_KEY = "minio123";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runCompose = (args) => {
  const result = spawnSync("docker", ["compose", "-f", COMPOSE_FILE, ...args], {
    cwd: COMPOSE_ROOT,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`docker compose ${args.join(" ")} failed`);
  }
};

const waitForHealth = async (url, attempts = 60) => {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await httpRequest("GET", `${url}/health`);
      if (response && response.ok) return;
    } catch (err) {
      // retry
    }
    await sleep(500);
  }
  throw new Error("Timed out waiting for ingest function health check");
};

const httpRequest = (method, url, payload) =>
  new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = payload ? JSON.stringify(payload) : null;
    const req = http.request(
      {
        method,
        hostname: parsed.hostname,
        port: parsed.port || 80,
        path: parsed.pathname,
        headers: body
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(body),
            }
          : undefined,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          try {
            resolve(text ? JSON.parse(text) : {});
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const streamToBuffer = async (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });

const parseSpacesPath = (value) => {
  assert(value.startsWith("spaces://"), `Invalid spaces path: ${value}`);
  const stripped = value.replace("spaces://", "");
  const [bucket, ...rest] = stripped.split("/");
  return { bucket, key: rest.join("/") };
};

const assertPng = (buffer, expectedWidth, expectedHeight) => {
  const chunks = parsePngChunks(buffer);
  assert(chunks && chunks.length > 0, "PNG chunks not parsed");
  assert(!chunks.some((chunk) => chunk.type === "CgBI"), "CgBI chunk still present");
  const dimensions = readPngDimensions(buffer);
  assert(dimensions, "PNG dimensions missing");
  if (expectedWidth != null) {
    assert(dimensions.width === expectedWidth, "PNG width mismatch");
  }
  if (expectedHeight != null) {
    assert(dimensions.height === expectedHeight, "PNG height mismatch");
  }
};

const createS3Client = () =>
  new S3Client({
    region: "us-east-1",
    endpoint: MINIO_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
    },
  });

const ensureBucketReady = async (client, attempts = 30) => {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await client.send(new CreateBucketCommand({ Bucket: BUCKET }));
      return;
    } catch (error) {
      if (
        error?.name === "BucketAlreadyExists" ||
        error?.name === "BucketAlreadyOwnedByYou"
      ) {
        return;
      }
    }
    await sleep(500);
  }
  throw new Error("Timed out waiting for MinIO bucket");
};

const uploadFixture = async (client, kind) => {
  const filePath = FIXTURES[kind];
  assert(fs.existsSync(filePath), `Fixture missing: ${filePath}`);
  const buffer = fs.readFileSync(filePath);
  const key = `fixtures/${path.basename(filePath)}`;
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "application/octet-stream",
    }),
  );
  return `spaces://${BUCKET}/${key}`;
};

const verifyIconOutput = async (client, response) => {
  assert(typeof response.iconBase64 === "string", "iconBase64 missing");
  assert(response.iconBase64.length > 0, "iconBase64 empty");
  assert(typeof response.iconPath === "string", "iconPath missing");
  assert(typeof response.iconSourcePath === "string", "iconSourcePath missing");
  assert(Number.isInteger(response.iconWidth) && response.iconWidth > 0, "iconWidth invalid");
  assert(Number.isInteger(response.iconHeight) && response.iconHeight > 0, "iconHeight invalid");
  assert(Number.isInteger(response.iconBytes) && response.iconBytes > 0, "iconBytes invalid");

  const iconBuffer = Buffer.from(response.iconBase64, "base64");
  assert(iconBuffer.length === response.iconBytes, "iconBytes mismatch");
  assertPng(iconBuffer, response.iconWidth, response.iconHeight);

  const { bucket, key } = parseSpacesPath(response.iconPath);
  const s3Object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const storedBuffer = await streamToBuffer(s3Object.Body);
  assert(storedBuffer.equals(iconBuffer), "Stored icon does not match response");
};

const verifyIpaResponse = async (client, response) => {
  assert(response.ok === true, `IPA response not ok: ${JSON.stringify(response)}`);
  assert(response.kind === "ipa", "IPA kind mismatch");
  assert(typeof response.appName === "string" && response.appName, "IPA appName missing");
  assert(typeof response.identifier === "string" && response.identifier, "IPA identifier missing");
  assert(typeof response.version === "string" && response.version, "IPA version missing");
  assert(typeof response.buildNumber === "string" && response.buildNumber, "IPA buildNumber missing");
  assert(Array.isArray(response.targets) && response.targets.length > 0, "IPA targets missing");
  response.targets.forEach((target) => {
    assert(typeof target.name === "string" && target.name, "Target name missing");
    assert(typeof target.bundleId === "string" && target.bundleId, "Target bundleId missing");
    assert(typeof target.version === "string" && target.version, "Target version missing");
    assert(typeof target.build === "string" && target.build, "Target build missing");
    assert(typeof target.root === "string" && target.root, "Target root missing");
    assert(typeof target.role === "string" && target.role, "Target role missing");
  });
  assert("entitlements" in response, "IPA entitlements field missing");
  await verifyIconOutput(client, response);
};

const verifyApkResponse = async (client, response) => {
  assert(response.ok === true, `APK response not ok: ${JSON.stringify(response)}`);
  assert(response.kind === "apk", "APK kind mismatch");
  assert(typeof response.packageName === "string" && response.packageName, "APK packageName missing");
  assert(typeof response.versionName === "string" && response.versionName, "APK versionName missing");
  const versionCode = response.versionCode;
  assert(Number.isFinite(Number(versionCode)), "APK versionCode missing");
  assert(typeof response.appName === "string", "APK appName missing");
  assert(typeof response.manifest === "object" && response.manifest, "APK manifest missing");
  assert(response.manifest.packageName === response.packageName, "Manifest packageName mismatch");
  assert(response.manifest.versionName === response.versionName, "Manifest versionName mismatch");
  assert(
    String(response.manifest.versionCode) === String(response.versionCode),
    "Manifest versionCode mismatch",
  );
  assert(Array.isArray(response.permissions), "APK permissions missing");
  await verifyIconOutput(client, response);
};

const main = async () => {
  console.log("container-ingest.test.js: starting containers");
  runCompose(["up", "-d", "--build"]);
  try {
    console.log("container-ingest.test.js: waiting for health");
    await waitForHealth(FUNCTION_URL);
    console.log("container-ingest.test.js: setting up MinIO");
    const s3Client = createS3Client();
    await ensureBucketReady(s3Client);

    console.log("container-ingest.test.js: uploading fixtures");
    const ipaStoragePath = await uploadFixture(s3Client, "ipa");
    const apkStoragePath = await uploadFixture(s3Client, "apk");

    console.log("container-ingest.test.js: ingesting IPA");
    const ipaResponse = await httpRequest("POST", FUNCTION_URL, {
      kind: "ipa",
      storagePath: ipaStoragePath,
    });
    await verifyIpaResponse(s3Client, ipaResponse);

    console.log("container-ingest.test.js: ingesting APK");
    const apkResponse = await httpRequest("POST", FUNCTION_URL, {
      kind: "apk",
      storagePath: apkStoragePath,
    });
    await verifyApkResponse(s3Client, apkResponse);

    console.log("container-ingest.test.js: ok");
  } finally {
    runCompose(["down", "-v"]);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
