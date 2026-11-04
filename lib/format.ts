import type { Lang } from "./i18n";

export const LOCALE: Record<Lang, string> = { en: "en-GB", fr: "fr-FR", ar: "ar-MA" };

/** Locale-aware number; "–" for missing / non-finite values (never a made-up number). */
export function num(lang: Lang, n: number | null | undefined, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return "–";
  return new Intl.NumberFormat(LOCALE[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false }).format(n);
}

/** Weekday name for an ISO date such as "2026-11-04". */
export function weekday(lang: Lang, isoDate: string, style: "short" | "long" = "short"): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { weekday: style }).format(new Date(isoDate.slice(0, 10) + "T12:00"));
}

/** "HH:mm" (24 h) for an Open-Meteo local timestamp such as "2026-11-04T19:42". */
export function hhmm(lang: Lang, iso: string): string {
  const d = new Date(iso.length === 16 ? iso : iso.slice(0, 16));
  if (Number.isNaN(d.getTime())) return iso.slice(11, 16);
  return new Intl.DateTimeFormat(LOCALE[lang], { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
}
