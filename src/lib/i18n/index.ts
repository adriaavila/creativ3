import "server-only";

import en from "@/messages/en.json";
import es from "@/messages/es.json";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export type Messages = typeof es;

export const isLocale = (value: string): value is Locale =>
  locales.includes(value as Locale);

export const getMessages = (locale: Locale): Messages =>
  locale === "en" ? en : es;

export const localePath = (locale: Locale, path = "") =>
  `/${locale}${path.startsWith("/") ? path : `/${path}`}`.replace(/\/$/, "");

export const alternateLanguages = (path = "") => ({
  es: localePath("es", path),
  en: localePath("en", path),
});
