import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { csMessages } from "../locales/cs";
import { deMessages } from "../locales/de";
import { enMessages } from "../locales/en";
import { enGBMessages } from "../locales/en-GB";
import { esMessages } from "../locales/es";
import { frMessages } from "../locales/fr";
import { itMessages } from "../locales/it";
import { jaMessages } from "../locales/ja";
import { koMessages } from "../locales/ko";
import { nlMessages } from "../locales/nl";
import { pirateMessages } from "../locales/pirate";
import { poMessages } from "../locales/po";
import { ptMessages } from "../locales/pt";
import { ruMessages } from "../locales/ru";
import { zhMessages } from "../locales/zh-CN";

export type Locale =
  | "en-US"
  | "en-GB"
  | "cs"
  | "de"
  | "es"
  | "fr"
  | "it"
  | "ja"
  | "ko"
  | "nl"
  | "pl"
  | "pt"
  | "ru"
  | "zh-CN"
  | "pirate";
export type MessageValue = string | { [key: string]: string };
export type MessageParams = Record<string, string | number>;

const SUPPORTED_LOCALES: Locale[] = [
  "en-US",
  "en-GB",
  "cs",
  "de",
  "es",
  "fr",
  "it",
  "ja",
  "ko",
  "nl",
  "pl",
  "pt",
  "ru",
  "zh-CN",
  "pirate",
];
const DEFAULT_LOCALE: Locale = "en-US";
const LOCALE_COOKIE = "einstore.locale";

const messagesByLocale: Record<Locale, Record<string, MessageValue>> = {
  "en-US": enMessages,
  "en-GB": enGBMessages,
  cs: csMessages,
  de: deMessages,
  es: esMessages,
  fr: frMessages,
  it: itMessages,
  ja: jaMessages,
  ko: koMessages,
  nl: nlMessages,
  pl: poMessages,
  pt: ptMessages,
  ru: ruMessages,
  "zh-CN": zhMessages,
  pirate: pirateMessages,
};

let activeLocale: Locale = DEFAULT_LOCALE;

const resolveLocale = (candidate?: string | null): Locale => {
  if (!candidate) return DEFAULT_LOCALE;
  const normalized = candidate.toLowerCase().replace("_", "-");
  if (normalized.startsWith("cs")) return "cs";
  if (normalized.startsWith("de")) return "de";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("fr")) return "fr";
  if (normalized.startsWith("it")) return "it";
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("ko")) return "ko";
  if (normalized.startsWith("nl")) return "nl";
  if (normalized.startsWith("pt")) return "pt";
  if (normalized.startsWith("ru")) return "ru";
  if (normalized.startsWith("pl") || normalized.startsWith("po")) return "pl";
  if (normalized.startsWith("zh-cn") || normalized.startsWith("zh-hans")) return "zh-CN";
  if (normalized.startsWith("pirate") || normalized.includes("pirate")) return "pirate";
  if (normalized.startsWith("en-gb")) return "en-GB";
  if (normalized.startsWith("en")) return "en-US";
  return DEFAULT_LOCALE;
};

const detectLocale = (): Locale => {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = resolveLocale(params.get("lang"));
  if (SUPPORTED_LOCALES.includes(fromQuery)) return fromQuery;

  const cookieMatch = window.document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`));
  if (cookieMatch) {
    const value = cookieMatch.split("=")[1];
    const stored = resolveLocale(decodeURIComponent(value || ""));
    if (SUPPORTED_LOCALES.includes(stored)) return stored;
  }

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
      window.document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=31536000; samesite=lax`;
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
