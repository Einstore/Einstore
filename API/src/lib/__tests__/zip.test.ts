import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ensureZipReadable, isInvalidArchiveError } from "../zip.js";

const VALID_ZIP_BASE64 =
  "UEsDBBQAAAAIAMl6K1ysKpPYBAAAAAIAAAAIAAAAdGVzdC50eHTLyAQAUEsBAhQDFAAAAAgAyXorXKwqk9gEAAAAAgAAAAgAAAAAAAAAAAAAAIABAAAAAHRlc3QudHh0UEsFBgAAAAABAAEANgAAACoAAAAAAA==";

const writeTempFile = (name: string, buffer: Buffer) => {
  const filePath = path.join(os.tmpdir(), `einstore-${name}-${Date.now()}`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

describe("zip helpers", () => {
  it("detects invalid archive signature errors", () => {
    const error = new Error("end of central directory record signature not found");
    expect(isInvalidArchiveError(error)).toBe(true);
  });

  it("accepts valid zip archives", async () => {
    const filePath = writeTempFile("valid.zip", Buffer.from(VALID_ZIP_BASE64, "base64"));
    try {
      await ensureZipReadable(filePath, { retries: 0 });
    } finally {
      fs.rmSync(filePath, { force: true });
    }
  });

  it("rejects invalid zip archives", async () => {
    const filePath = writeTempFile("invalid.zip", Buffer.from("not-a-zip", "utf8"));
    let caught: unknown;
    try {
      await ensureZipReadable(filePath, { retries: 0 });
    } catch (error) {
      caught = error;
    } finally {
      fs.rmSync(filePath, { force: true });
    }
    expect(caught).toBeTruthy();
    expect(isInvalidArchiveError(caught)).toBe(true);
  });
});
