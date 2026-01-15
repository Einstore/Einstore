export const readCookie = (key: string) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${encodeURIComponent(key)}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1] ?? "");
};

export const writeCookie = (key: string, value: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=31536000; SameSite=Lax`;
};
