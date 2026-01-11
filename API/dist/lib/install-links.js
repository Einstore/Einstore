import crypto from "node:crypto";
const resolveSecret = () => process.env.INSTALL_LINK_SECRET ||
    process.env.AUTH_JWT_SECRET ||
    "change-me-install-secret";
const base64Url = (input) => Buffer.from(input).toString("base64url");
const signPayload = (payload) => {
    const encoded = base64Url(JSON.stringify(payload));
    const signature = crypto
        .createHmac("sha256", resolveSecret())
        .update(encoded)
        .digest("base64url");
    return `${encoded}.${signature}`;
};
const verifySignature = (encoded, signature) => {
    const expected = crypto
        .createHmac("sha256", resolveSecret())
        .update(encoded)
        .digest("base64url");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};
export const generateInstallToken = (input, ttlSeconds) => {
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
    return signPayload({ ...input, exp });
};
export const verifyInstallToken = (token, action) => {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) {
        return null;
    }
    if (!verifySignature(encoded, signature)) {
        return null;
    }
    const raw = Buffer.from(encoded, "base64url").toString("utf8");
    let payload;
    try {
        payload = JSON.parse(raw);
    }
    catch {
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
