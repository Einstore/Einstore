export const extractInviteToken = (input: string) => {
  const value = input?.trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    const queryToken = url.searchParams.get("token");
    if (queryToken) {
      return queryToken.trim();
    }
    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) {
      return last.trim();
    }
  } catch {
    return value;
  }
  return value;
};

export const buildInviteAcceptPath = (token: string) =>
  `/accept-invite?token=${encodeURIComponent(token)}`;
