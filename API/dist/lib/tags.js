export const cleanTagName = (value) => value.trim().replace(/\s+/g, " ");
export const normalizeTagName = (value) => cleanTagName(value).toLowerCase();
