"use client";
import { useCallback, useEffect, useState } from "react";
import type { Lang } from "./i18n";

const isLang = (s: string | null): s is Lang => s === "en" || s === "fr" || s === "ar";

/** Language state shared between pages (remembered in localStorage); also sets <html lang/dir>. Switching never reloads the page. */
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, set] = useState<Lang>("en");
  useEffect(() => {
    try {
      const s = localStorage.getItem("lang");
      if (isLang(s)) { set(s); return; }
      const nav = (navigator.language || "en").slice(0, 2);
      if (isLang(nav)) set(nav);
    } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; }, [lang]);
  const update = useCallback((l: Lang) => { set(l); try { localStorage.setItem("lang", l); } catch { /* ignore */ } }, []);
  return [lang, update];
}
