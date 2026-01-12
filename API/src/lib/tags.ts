export const cleanTagName = (value: string) => value.trim().replace(/\s+/g, " ");

export const normalizeTagName = (value: string) => cleanTagName(value).toLowerCase();
