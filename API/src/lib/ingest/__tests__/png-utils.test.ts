import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { convertCgbiPng, isCgbiPng, parsePngChunks, readPngDimensions } from "../png-utils.js";

const readTestPng = () => {
  const filePath = path.resolve(
    process.cwd(),
    "src",
    "lib",
    "ingest",
    "__tests__",
    "fixtures",
    "broken-img.base64.txt",
  );
  let text = fs.readFileSync(filePath, "utf8").trim();
  if (text.startsWith("data:")) {
    text = text.slice(text.indexOf(",") + 1);
  }
  return Buffer.from(text, "base64");
};

const hasChunk = (buffer: Buffer, type: string) => {
  const chunks = parsePngChunks(buffer);
  if (!chunks) return false;
  return chunks.some((chunk) => chunk.type === type);
};

describe("png-utils", () => {
  it("reads dimensions from CgBI PNG", () => {
    const buffer = readTestPng();
    expect(isCgbiPng(buffer)).toBe(true);
    expect(readPngDimensions(buffer)).toEqual({ width: 180, height: 180 });
  });

  it("converts CgBI PNG to standard PNG", () => {
    const buffer = readTestPng();
    const converted = convertCgbiPng(buffer);
    expect(converted).toBeTruthy();
    expect(isCgbiPng(converted!)).toBe(false);
    expect(hasChunk(converted!, "IHDR")).toBe(true);
    expect(hasChunk(converted!, "IDAT")).toBe(true);
    expect(hasChunk(converted!, "CgBI")).toBe(false);
    expect(readPngDimensions(converted!)).toEqual({ width: 180, height: 180 });
  });
});
