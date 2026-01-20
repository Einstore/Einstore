export type ClientPlatform = "android" | "ios" | "web";

export const getClientPlatform = (): ClientPlatform => {
  if (typeof navigator === "undefined") return "web";
  const uaDataPlatform = (navigator as { userAgentData?: { platform?: string } }).userAgentData
    ?.platform?.toLowerCase?.();
  if (uaDataPlatform?.includes("mac")) return "web";
  const ua = navigator.userAgent.toLowerCase();
  const isMac = ua.includes("macintosh");
  const hasTouch = (navigator as { maxTouchPoints?: number }).maxTouchPoints ?? 0;
  if (ua.includes("android")) return "android";
  if (ua.includes("iphone") || ua.includes("ipod")) return "ios";
  if (ua.includes("ipad")) return "ios";
  if (isMac) {
    // Distinguish iPadOS Safari (reports Macintosh with touch) from desktop Safari
    return hasTouch > 2 ? "ios" : "web";
  }
  return "web";
};

export const shouldShowInstall = (buildPlatform?: string | null) => {
  const client = getClientPlatform();
  const platform = (buildPlatform ?? "").toLowerCase();
  if (client !== "ios") return false;
  return (
    platform.includes("ios") ||
    platform.includes("tvos") ||
    platform.includes("watchos") ||
    platform.includes("visionos")
  );
};
