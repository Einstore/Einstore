import crypto from "node:crypto";

type InstallTokenPayload = {
  buildId: string;
  teamId: string;
  userId?: string;
  action: "manifest" | "download" | "install";
  exp: number;
};

const resolveSecret = () =>
  process.env.INSTALL_LINK_SECRET ||
  process.env.AUTH_JWT_SECRET ||
  "change-me-install-secret";

const base64Url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64url");

const signPayload = (payload: InstallTokenPayload) => {
  const encoded = base64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", resolveSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
};

const verifySignature = (encoded: string, signature: string) => {
  const expected = crypto
    .createHmac("sha256", resolveSecret())
    .update(encoded)
    .digest("base64url");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};

export const generateInstallToken = (
  input: Omit<InstallTokenPayload, "exp">,
  ttlSeconds: number,
) => {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return signPayload({ ...input, exp });
};

export const verifyInstallToken = (
  token: string,
  action: InstallTokenPayload["action"],
): InstallTokenPayload | null => {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }
  if (!verifySignature(encoded, signature)) {
    return null;
  }
  const raw = Buffer.from(encoded, "base64url").toString("utf8");
  let payload: InstallTokenPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!payload || payload.action !== action) {
    return null;
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
};
