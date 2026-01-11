declare module "bplist-parser" {
  export function parseBuffer(buffer: Buffer): unknown[];
  const api: { parseBuffer: typeof parseBuffer };
  export default api;
}
