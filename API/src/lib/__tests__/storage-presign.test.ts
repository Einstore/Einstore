import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { presignPutObject } from "../storage-presign.js";

const BASE_ENV = { ...process.env };

const resetEnv = () => {
  process.env = { ...BASE_ENV };
};

const setupEnv = () => {
  process.env.SPACES_REGION = "us-east-1";
  process.env.SPACES_ENDPOINT = "https://nyc3.digitaloceanspaces.com";
  process.env.SPACES_KEY = "test-key";
  process.env.SPACES_SECRET = "test-secret";
};

const getSignedHeaders = (url: URL) => {
  const signedKey = Array.from(url.searchParams.keys()).find(
    (key) => key.toLowerCase() === "x-amz-signedheaders",
  );
  if (!signedKey) return null;
  const value = url.searchParams.get(signedKey);
  return value ? value.split(";").filter(Boolean).sort() : null;
};

describe("presignPutObject", () => {
  beforeEach(() => setupEnv());
  afterEach(() => resetEnv());

  it("signs only host when no content-type is provided", async () => {
    const signedUrl = await presignPutObject({
      bucket: "bucket",
      key: "ingest/sample.ipa",
      expiresIn: 900,
    });
    const parsed = new URL(signedUrl);
    const signedHeaders = getSignedHeaders(parsed);

    expect(signedHeaders).toEqual(expect.arrayContaining(["host"]));
    expect(signedHeaders).toHaveLength(1);
    expect(parsed.searchParams.get("x-id")).toBe("PutObject");

    const keys = Array.from(parsed.searchParams.keys()).map((key) => key.toLowerCase());
    expect(keys).not.toContain("x-amz-checksum-crc32");
    expect(keys).not.toContain("x-amz-checksum-sha256");
    expect(keys).not.toContain("x-amz-sdk-checksum-algorithm");
  });

  it("signs host and content-type when content-type is provided", async () => {
    const signedUrl = await presignPutObject({
      bucket: "bucket",
      key: "ingest/sample.ipa",
      contentType: "application/octet-stream",
      expiresIn: 900,
    });
    const parsed = new URL(signedUrl);
    const signedHeaders = getSignedHeaders(parsed);

    expect(signedHeaders).toEqual(expect.arrayContaining(["host"]));
    expect([1, 2]).toContain(signedHeaders?.length);
    if (signedHeaders?.length === 2) {
      expect(signedHeaders).toEqual(expect.arrayContaining(["content-type"]));
    }
    expect(parsed.searchParams.get("x-id")).toBe("PutObject");

    const keys = Array.from(parsed.searchParams.keys()).map((key) => key.toLowerCase());
    expect(keys).not.toContain("x-amz-checksum-crc32");
    expect(keys).not.toContain("x-amz-checksum-sha256");
    expect(keys).not.toContain("x-amz-sdk-checksum-algorithm");
  });
});
