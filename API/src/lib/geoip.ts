import geoip from "geoip-lite";
import type { FastifyRequest } from "fastify";

const getClientIp = (req: FastifyRequest) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const candidate = String(value).split(",")[0]?.trim();
    if (candidate) {
      return candidate;
    }
  }
  const direct = req.headers["x-real-ip"] || req.ip || req.socket?.remoteAddress || "";
  return String(direct);
};

const normalizeIp = (value: string) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("::ffff:")) {
    return trimmed.slice(7);
  }
  const hasV4 = trimmed.includes(".");
  const lastColon = trimmed.lastIndexOf(":");
  if (hasV4 && lastColon > -1) {
    const maybePort = trimmed.slice(lastColon + 1);
    if (/^\d+$/.test(maybePort)) {
      return trimmed.slice(0, lastColon);
    }
  }
  return trimmed;
};

export const lookupGeoip = (req: FastifyRequest) => {
  const ip = normalizeIp(getClientIp(req));
  return ip ? geoip.lookup(ip) : null;
};

export const resolveCountryCode = (value: unknown) => {
  if (value === undefined) {
    return { value: undefined as string | null | undefined };
  }
  if (value === null || value === "") {
    return { value: null as string | null };
  }
  if (typeof value !== "string") {
    return { error: "invalid_country" } as const;
  }
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) {
    return { value: null as string | null };
  }
  if (!/^[A-Z]{2}$/.test(trimmed)) {
    return { error: "invalid_country" } as const;
  }
  return { value: trimmed } as const;
};

export const resolveTimezoneInput = (value: unknown) => {
  if (value === undefined) {
    return { value: undefined as string | null | undefined };
  }
  if (value === null || value === "") {
    return { value: null as string | null };
  }
  if (typeof value !== "string") {
    return { error: "invalid_timezone" } as const;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: null as string | null };
  }
  try {
    Intl.DateTimeFormat("en-US", { timeZone: trimmed }).format(new Date());
  } catch {
    return { error: "invalid_timezone" } as const;
  }
  return { value: trimmed } as const;
};

export const resolveGeoipDefaults = (req: FastifyRequest) => {
  const lookup = lookupGeoip(req);
  const country = lookup?.country ? String(lookup.country).toUpperCase() : null;
  const timezone = lookup?.timezone ? String(lookup.timezone) : null;
  return { country, timezone };
};
