"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type Locale,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  t as translate,
  detectLocale,
  getDirection,
  formatNumber as fmtNumber,
  formatDate as fmtDate,
} from "@/lib/i18n";

const STORAGE_KEY = "aaas-locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
  formatNumber: (n: number) => string;
  formatDate: (date: string | Date, style?: "short" | "medium" | "long") => string;
  direction: "ltr" | "rtl";
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.some((l) => l.code === stored)) {
      return stored as Locale;
    }
    return detectLocale(navigator.language);
  }
  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale;
      document.documentElement.dir = getDirection(locale);
    }
  }, [locale, mounted]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLocale);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => {
      return translate(key, locale, params);
    },
    [locale]
  );

  const formatNumber = useCallback(
    (n: number) => fmtNumber(n, locale),
    [locale]
  );

  const formatDate = useCallback(
    (date: string | Date, style?: "short" | "medium" | "long") =>
      fmtDate(date, locale, style),
    [locale]
  );

  const direction = getDirection(locale);

  const value: LocaleContextValue = {
    locale: mounted ? locale : DEFAULT_LOCALE,
    setLocale,
    t,
    formatNumber,
    formatDate,
    direction,
  };

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

/** Hook to access the current locale and translation function */
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a <LocaleProvider>");
  }
  return context;
}
