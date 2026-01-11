import { parseExportPresetInput } from "./exportPresets.js";
import { sanitizeLocalPart, slugify } from "./strings.js";

const teamRoles = new Set(["owner", "admin", "member"]);
const overviewStatsPeriods = new Set(["rolling_30_days", "calendar_month"]);

export const parseCurrencyInput = (value: unknown) => {
  if (value === undefined) return { value: undefined as string | null | undefined };
  if (value === null) return { value: null as string | null };
  if (typeof value !== "string") return { error: "invalid_currency" } as const;
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return { value: null as string | null };
  if (!/^[A-Z]{3}$/.test(trimmed)) return { error: "invalid_currency" } as const;
  return { value: trimmed } as const;
};

export const parseVatRegisteredInput = (value: unknown) => {
  if (value === undefined) return { value: undefined as boolean | undefined };
  if (typeof value !== "boolean") return { error: "invalid_vat_registered" } as const;
  return { value } as const;
};

export const parseVatNumberRequiredInput = (value: unknown) => {
  if (value === undefined) return { value: undefined as boolean | undefined };
  if (typeof value !== "boolean") return { error: "invalid_vat_required" } as const;
  return { value } as const;
};

export const parseCategoryRequiredInput = (value: unknown) => {
  if (value === undefined) return { value: undefined as boolean | undefined };
  if (typeof value !== "boolean") return { error: "invalid_category_required" } as const;
  return { value } as const;
};

export const parseVatThresholdInput = (value: unknown) => {
  if (value === undefined) return { value: undefined as number | null | undefined };
  if (value === null || value === "") return { value: null as number | null };
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    return { error: "invalid_vat_threshold" } as const;
  }
  return { value: parsed } as const;
};

export const parseTeamRoleInput = (value: unknown) => {
  if (value === undefined) return { value: undefined as string | undefined };
  if (typeof value !== "string") return { error: "invalid_role" } as const;
  const trimmed = value.trim().toLowerCase();
  if (!teamRoles.has(trimmed)) return { error: "invalid_role" } as const;
  return { value: trimmed } as const;
};

export const parseOverviewStatsPeriodInput = (value: unknown) => {
  if (value === undefined) return { value: undefined as string | undefined };
  if (typeof value !== "string") return { error: "invalid_overview_stats_period" } as const;
  const trimmed = value.trim();
  if (!overviewStatsPeriods.has(trimmed)) return { error: "invalid_overview_stats_period" } as const;
  return { value: trimmed } as const;
};

export const deriveInboxBaseForUser = (
  user: { email: string | null; fullName: string | null; username: string },
  existingBase?: string | null,
) => {
  if (existingBase) return existingBase;
  const emailLocal = sanitizeLocalPart(user.email?.split("@")[0] || "");
  if (emailLocal) return emailLocal;
  const nameSlug = sanitizeLocalPart(user.fullName || "");
  if (nameSlug) return nameSlug;
  return sanitizeLocalPart(user.username) || "team";
};

export const serializeTeam = (team: { storageLimitBytes: bigint | number | null }) => ({
  ...team,
  storageLimitBytes:
    team.storageLimitBytes === null || team.storageLimitBytes === undefined
      ? null
      : Number(team.storageLimitBytes),
});

export const serializeTeamUser = (member: {
  user: { id: string; email: string | null; fullName: string | null; avatarUrl: string | null; username: string | null };
  role: string;
  createdAt: Date;
}) => {
  const user = member.user;
  return {
    id: user.id,
    email: user.email ?? null,
    fullName: user.fullName ?? null,
    name: user.fullName ?? user.username ?? user.email ?? null,
    avatarUrl: user.avatarUrl ?? null,
    username: user.username ?? null,
    role: member.role,
    createdAt: member.createdAt,
  };
};

export const normalizeTeamSlug = (value: string) => slugify(value) || "team";

export const parseExportPreset = parseExportPresetInput;
