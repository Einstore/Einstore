const getUA = () => (typeof navigator !== "undefined" ? navigator.userAgent || navigator.vendor || "" : "");

export const getClientPlatform = () => {
  const ua = getUA();
  const isIOSDevice = /iPhone|iPad|iPod/i.test(ua);
  const isTouchMac =
    typeof navigator !== "undefined" &&
    navigator.platform === "MacIntel" &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;
  if (isIOSDevice || isTouchMac) return "ios" as const;
  if (/Android/i.test(ua)) return "android" as const;
  if (/Mac/i.test(ua)) return "mac" as const;
  if (/Windows/i.test(ua)) return "windows" as const;
  if (/Linux/i.test(ua)) return "linux" as const;
  return "unknown" as const;
};

export const canInstallForPlatforms = (platforms: (string | null | undefined)[]) => {
  const normalized = new Set(platforms.filter(Boolean).map((p) => String(p).toLowerCase()));
  if (!normalized.size) return false;
  const client = getClientPlatform();
  const allowsIos = client === "ios" || (client === "mac" && typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (normalized.has("ios") && allowsIos) return true;
  if (normalized.has("android") && client === "android") return true;
  // If build targets desktop, allow mac/windows users.
  if (normalized.has("macos") && client === "mac") return true;
  if (normalized.has("windows") && client === "windows") return true;
  return false;
};
