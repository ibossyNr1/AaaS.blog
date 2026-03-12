/** Lightweight i18n engine for AaaS Knowledge Index */

export type Locale = "en" | "es" | "fr" | "de" | "ja" | "zh" | "ko" | "pt";

export type TranslationKey = string;

export type TranslationDict = Record<string, string | Record<string, string>>;

export const DEFAULT_LOCALE: Locale = "en";

export const SUPPORTED_LOCALES: {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
}[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
];

/** Cache loaded translations to avoid repeated imports */
const translationCache = new Map<Locale, TranslationDict>();

/** Lazy-load translation file for a given locale */
export function getTranslations(locale: Locale): TranslationDict {
  if (translationCache.has(locale)) {
    return translationCache.get(locale)!;
  }

  let dict: TranslationDict;

  try {
    // Dynamic require for synchronous loading in both server and client contexts
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    dict = require(`@/i18n/${locale}.json`) as TranslationDict;
  } catch {
    // Fallback to English if locale file not found
    if (locale !== DEFAULT_LOCALE) {
      return getTranslations(DEFAULT_LOCALE);
    }
    dict = {};
  }

  translationCache.set(locale, dict);
  return dict;
}

/**
 * Translate a key with optional parameter substitution.
 * Supports dot-notation keys and {{param}} placeholders.
 *
 * @example
 * t("common.greeting", "en", { name: "Alice" }) // "Hello, Alice!"
 * t("entity.count", "en", { count: "42" }) // "42 entities"
 */
export function t(
  key: string,
  locale: Locale,
  params?: Record<string, string>
): string {
  const dict = getTranslations(locale);

  // Try flat key first (e.g., "common.loading")
  let value = dict[key];

  // Try nested lookup (e.g., dict["common"]["loading"])
  if (value === undefined) {
    const parts = key.split(".");
    if (parts.length === 2) {
      const section = dict[parts[0]];
      if (section && typeof section === "object") {
        value = section[parts[1]];
      }
    }
  }

  // Fallback to English, then to the raw key
  if (value === undefined && locale !== DEFAULT_LOCALE) {
    return t(key, DEFAULT_LOCALE, params);
  }

  if (value === undefined || typeof value !== "string") {
    return key;
  }

  // Parameter substitution: {{param}}
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
      return params[paramKey] ?? `{{${paramKey}}}`;
    });
  }

  return value;
}

/**
 * Detect locale from Accept-Language header string.
 * Returns the best matching supported locale, or the default.
 */
export function detectLocale(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  // Parse Accept-Language: "en-US,en;q=0.9,es;q=0.8"
  const locales = acceptLanguage
    .split(",")
    .map((entry) => {
      const [lang, qValue] = entry.trim().split(";q=");
      return {
        lang: lang.trim().toLowerCase(),
        q: qValue ? parseFloat(qValue) : 1.0,
      };
    })
    .sort((a, b) => b.q - a.q);

  const supportedCodes = SUPPORTED_LOCALES.map((l) => l.code);

  for (const { lang } of locales) {
    // Exact match (e.g., "en")
    if (supportedCodes.includes(lang as Locale)) {
      return lang as Locale;
    }
    // Prefix match (e.g., "en-US" -> "en")
    const prefix = lang.split("-")[0];
    if (supportedCodes.includes(prefix as Locale)) {
      return prefix as Locale;
    }
  }

  return DEFAULT_LOCALE;
}

/** Locale-aware number formatting */
export function formatNumber(n: number, locale: Locale): string {
  const localeMap: Record<Locale, string> = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    ja: "ja-JP",
    zh: "zh-CN",
    ko: "ko-KR",
    pt: "pt-BR",
  };

  return new Intl.NumberFormat(localeMap[locale]).format(n);
}

/** Locale-aware date formatting */
export function formatDate(
  date: string | Date,
  locale: Locale,
  style: "short" | "medium" | "long" = "medium"
): string {
  const localeMap: Record<Locale, string> = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    ja: "ja-JP",
    zh: "zh-CN",
    ko: "ko-KR",
    pt: "pt-BR",
  };

  const dateObj = typeof date === "string" ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions =
    style === "short"
      ? { month: "numeric", day: "numeric", year: "2-digit" }
      : style === "long"
        ? { weekday: "long", month: "long", day: "numeric", year: "numeric" }
        : { month: "short", day: "numeric", year: "numeric" };

  return new Intl.DateTimeFormat(localeMap[locale], options).format(dateObj);
}

/** Get text direction for a locale (RTL support for future Arabic/Hebrew) */
export function getDirection(locale: Locale): "ltr" | "rtl" {
  // Currently all supported locales are LTR
  // Ready for future ar/he support
  const rtlLocales: string[] = [];
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}
