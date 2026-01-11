const collapse = (value: string, char: string) => {
  const escaped = char.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const re = new RegExp(`${escaped}{2,}`, "g");
  return value.replace(re, char);
};

export const slugify = (value: string) => {
  if (!value) return "";
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return collapse(cleaned, "-");
};

export const sanitizeLocalPart = (value: string) => {
  if (!value) return "";
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, ".")
    .replace(/^[.-]+|[.-]+$/g, "");
  return collapse(collapse(cleaned, "."), "-");
};
