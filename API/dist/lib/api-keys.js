import crypto from "node:crypto";
import { loadConfig } from "./config.js";
const KEY_PREFIX = "ei_";
const KEY_BYTES = 32;
const PREFIX_LENGTH = 12;
const resolveApiKeySecret = () => {
    const config = loadConfig();
    return config.API_KEY_SECRET ?? process.env.AUTH_JWT_SECRET ?? "dev-api-key-secret";
};
export const hashApiKey = (token) => {
    const secret = resolveApiKeySecret();
    return crypto.createHmac("sha256", secret).update(token).digest("hex");
};
export const generateApiKey = () => {
    const raw = crypto.randomBytes(KEY_BYTES).toString("base64url");
    const token = `${KEY_PREFIX}${raw}`;
    return {
        token,
        tokenHash: hashApiKey(token),
        tokenPrefix: token.slice(0, PREFIX_LENGTH),
    };
};
