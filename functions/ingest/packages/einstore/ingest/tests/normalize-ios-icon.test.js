const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { __test } = require("../index.js");

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const readFixtureBase64 = (fileName) => {
  const filePath = path.join(__dirname, "fixtures", fileName);
  let text = fs.readFileSync(filePath, "utf8").trim();
  if (text.startsWith("data:")) {
    text = text.slice(text.indexOf(",") + 1);
  }
  return Buffer.from(text, "base64");
};

const hasChunk = (buffer, type) => {
  const chunks = __test.parsePngChunks(buffer);
  if (!chunks) return false;
  return chunks.some((chunk) => chunk.type === type);
};

const assertValidPng = (buffer) => {
  assert.ok(buffer.subarray(0, 8).equals(PNG_SIGNATURE), "PNG signature missing");
  assert.ok(hasChunk(buffer, "IHDR"), "IHDR chunk missing");
  assert.ok(hasChunk(buffer, "IEND"), "IEND chunk missing");
};

const assertDimensions = (buffer, width, height) => {
  const dims = __test.readPngDimensions(buffer);
  assert.ok(dims, "Missing PNG dimensions");
  assert.equal(dims.width, width);
  assert.equal(dims.height, height);
};

const assertNoCgbi = (buffer) => {
  assert.equal(hasChunk(buffer, "CgBI"), false, "CgBI chunk still present");
};

const run = async () => {
  // CgBI input: should parse dimensions and normalize without CgBI.
  const cgbiBuffer = readFixtureBase64("broken-img.base64.txt");
  assertDimensions(cgbiBuffer, 180, 180);
  assert.equal(hasChunk(cgbiBuffer, "CgBI"), true, "Expected CgBI chunk");

  const normalized = await __test.normalizeIosIconPng(cgbiBuffer);
  assert.ok(Buffer.isBuffer(normalized), "Expected buffer output");
  assertValidPng(normalized);
  assertNoCgbi(normalized);
  assertDimensions(normalized, 180, 180);

  // Standard PNG: should remain valid and keep dimensions.
  const tinyPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAOaX2zQAAAAASUVORK5CYII=",
    "base64",
  );
  assertDimensions(tinyPng, 1, 1);
  assert.equal(hasChunk(tinyPng, "CgBI"), false, "Unexpected CgBI chunk");

  const normalizedTiny = await __test.normalizeIosIconPng(tinyPng);
  assertValidPng(normalizedTiny);
  assertNoCgbi(normalizedTiny);
  assertDimensions(normalizedTiny, 1, 1);

  // Invalid buffer should not report dimensions.
  const junk = Buffer.from("not-a-png");
  assert.equal(__test.readPngDimensions(junk), null);

  console.log("normalize-ios-icon.test.js: ok");
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
