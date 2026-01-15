import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { csMessages } from "../locales/cs";
import { enMessages } from "../locales/en";

export type Locale = "en" | "cs";
export type MessageValue = string | { [key: string]: string };
export type MessageParams = Record<string, string | number>;

const SUPPORTED_LOCALES: Locale[] = ["en", "cs"];
const DEFAULT_LOCALE: Locale = "en";
const STORAGE_KEY = "einstore.locale";

const messagesByLocale: Record<Locale, Record<string, MessageValue>> = {
  en: enMessages,
  cs: csMessages,
};

let activeLocale: Locale = DEFAULT_LOCALE;

const resolveLocale = (candidate?: string | null): Locale => {
  if (!candidate) return DEFAULT_LOCALE;
  const normalized = candidate.toLowerCase();
  if (normalized.startsWith("cs")) return "cs";
  return "en";
};

const detectLocale = (): Locale => {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = resolveLocale(params.get("lang"));
  if (SUPPORTED_LOCALES.includes(fromQuery)) return fromQuery;

  const stored = resolveLocale(window.localStorage.getItem(STORAGE_KEY));
  if (SUPPORTED_LOCALES.includes(stored)) return stored;

  return resolveLocale(window.navigator.language);
};

const interpolate = (template: string, params?: MessageParams) => {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? "" : String(value);
  });
};

const formatMessage = (locale: Locale, value: MessageValue, params?: MessageParams) => {
  if (typeof value === "string") {
    return interpolate(value, params);
  }
  const countParam = params?.count;
  const count = typeof countParam === "number" ? countParam : Number(countParam);
  const rule = Number.isFinite(count) ? new Intl.PluralRules(locale).select(count) : "other";
  const template = value[rule] ?? value.other ?? "";
  return interpolate(template, params);
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, fallback: MessageValue, params?: MessageParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>(() => detectLocale());

  useEffect(() => {
    activeLocale = locale;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale]);

  const t = useCallback(
    (key: string, fallback: MessageValue, params?: MessageParams) => {
      const message = messagesByLocale[locale][key] ?? fallback;
      return formatMessage(locale, message, params);
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
};

export const getLocale = () => activeLocale;

export const translate = (key: string, fallback: MessageValue, params?: MessageParams) => {
  const message = messagesByLocale[activeLocale][key] ?? fallback;
  return formatMessage(activeLocale, message, params);
};
