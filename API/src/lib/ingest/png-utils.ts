import zlib from "node:zlib";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export type PngChunk = {
  type: string;
  data: Buffer;
};

const buildCrcTable = () => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
};

const CRC_TABLE = buildCrcTable();

const crc32 = (buffer: Buffer) => {
  let crc = 0xffffffff;
  for (const value of buffer) {
    crc = CRC_TABLE[(crc ^ value) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const encodeChunk = (type: string, data: Buffer) => {
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);
  const crcInput = Buffer.concat([Buffer.from(type, "ascii"), data]);
  chunk.writeUInt32BE(crc32(crcInput), 8 + data.length);
  return chunk;
};

export const parsePngChunks = (buffer: Buffer) => {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  const chunks: PngChunk[] = [];
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

export const readPngDimensions = (buffer: Buffer) => {
  const chunks = parsePngChunks(buffer);
  if (!chunks) return null;
  const ihdr = chunks.find((chunk) => chunk.type === "IHDR");
  if (!ihdr || ihdr.data.length < 8) return null;
  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  if (!width || !height) return null;
  return { width, height };
};

export const isCgbiPng = (buffer: Buffer) => {
  const chunks = parsePngChunks(buffer);
  if (!chunks) return false;
  return chunks.some((chunk) => chunk.type === "CgBI");
};

const paethPredictor = (a: number, b: number, c: number) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
};

const unfilterPngData = (data: Buffer, width: number, height: number, bytesPerPixel: number) => {
  const rowLength = width * bytesPerPixel;
  const result = Buffer.alloc(height * rowLength);
  let inOffset = 0;
  let outOffset = 0;
  let previousRow = Buffer.alloc(rowLength);

  for (let row = 0; row < height; row += 1) {
    const filterType = data[inOffset];
    inOffset += 1;
    const rowData = data.subarray(inOffset, inOffset + rowLength);
    inOffset += rowLength;
    const recon = Buffer.alloc(rowLength);

    for (let i = 0; i < rowLength; i += 1) {
      const raw = rowData[i];
      const left = i >= bytesPerPixel ? recon[i - bytesPerPixel] : 0;
      const up = previousRow[i];
      const upLeft = i >= bytesPerPixel ? previousRow[i - bytesPerPixel] : 0;
      let value = raw;
      switch (filterType) {
        case 0:
          value = raw;
          break;
        case 1:
          value = (raw + left) & 0xff;
          break;
        case 2:
          value = (raw + up) & 0xff;
          break;
        case 3:
          value = (raw + Math.floor((left + up) / 2)) & 0xff;
          break;
        case 4:
          value = (raw + paethPredictor(left, up, upLeft)) & 0xff;
          break;
        default:
          return null;
      }
      recon[i] = value;
    }

    recon.copy(result, outOffset);
    outOffset += rowLength;
    previousRow = recon;
  }

  return result;
};

const applyNoFilter = (data: Buffer, width: number, height: number, bytesPerPixel: number) => {
  const rowLength = width * bytesPerPixel;
  const output = Buffer.alloc(height * (rowLength + 1));
  let outOffset = 0;
  let inOffset = 0;
  for (let row = 0; row < height; row += 1) {
    output[outOffset] = 0;
    data.copy(output, outOffset + 1, inOffset, inOffset + rowLength);
    outOffset += rowLength + 1;
    inOffset += rowLength;
  }
  return output;
};

export const convertCgbiPng = (buffer: Buffer) => {
  const chunks = parsePngChunks(buffer);
  if (!chunks || !chunks.some((chunk) => chunk.type === "CgBI")) return null;
  const ihdr = chunks.find((chunk) => chunk.type === "IHDR");
  if (!ihdr || ihdr.data.length < 13) return null;
  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  const bitDepth = ihdr.data.readUInt8(8);
  const colorType = ihdr.data.readUInt8(9);
  const compression = ihdr.data.readUInt8(10);
  const filter = ihdr.data.readUInt8(11);
  const interlace = ihdr.data.readUInt8(12);
  if (
    !width ||
    !height ||
    bitDepth !== 8 ||
    colorType !== 6 ||
    compression !== 0 ||
    filter !== 0 ||
    interlace !== 0
  ) {
    return null;
  }

  const idatChunks = chunks.filter((chunk) => chunk.type === "IDAT");
  if (!idatChunks.length) return null;
  const idatData = Buffer.concat(idatChunks.map((chunk) => chunk.data));
  let inflated: Buffer;
  try {
    inflated = zlib.inflateSync(idatData);
  } catch (error) {
    try {
      inflated = zlib.inflateRawSync(idatData);
    } catch (rawError) {
      return null;
    }
  }
  const bytesPerPixel = 4;
  const rowLength = width * bytesPerPixel;
  const expectedLength = height * (rowLength + 1);
  if (inflated.length < expectedLength) return null;

  const unfiltered = unfilterPngData(inflated, width, height, bytesPerPixel);
  if (!unfiltered) return null;

  for (let i = 0; i < unfiltered.length; i += 4) {
    const rawR = unfiltered[i];
    const rawG = unfiltered[i + 1];
    const rawB = unfiltered[i + 2];
    const alpha = unfiltered[i + 3];
    let r = 0;
    let g = 0;
    let b = 0;
    if (alpha > 0) {
      const scale = 255 / alpha;
      r = Math.min(255, Math.round(rawR * scale));
      g = Math.min(255, Math.round(rawG * scale));
      b = Math.min(255, Math.round(rawB * scale));
    }
    unfiltered[i] = b;
    unfiltered[i + 1] = g;
    unfiltered[i + 2] = r;
    unfiltered[i + 3] = alpha;
  }

  const filtered = applyNoFilter(unfiltered, width, height, bytesPerPixel);
  const compressed = zlib.deflateSync(filtered);

  const outputChunks: Buffer[] = [];
  let idatWritten = false;
  for (const chunk of chunks) {
    if (chunk.type === "CgBI") continue;
    if (chunk.type === "IDAT") {
      if (!idatWritten) {
        outputChunks.push(encodeChunk("IDAT", compressed));
        idatWritten = true;
      }
      continue;
    }
    outputChunks.push(encodeChunk(chunk.type, chunk.data));
  }

  if (!idatWritten) return null;
  return Buffer.concat([PNG_SIGNATURE, ...outputChunks]);
};
