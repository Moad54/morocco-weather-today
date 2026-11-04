"use client";
import { useCallback, useEffect, useState } from "react";
import type { Lang } from "./i18n";

/** Language state shared between pages (remembered in localStorage); also sets <html lang/dir>. */
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, set] = useState<Lang>("en");
  useEffect(() => {
    try { const s = localStorage.getItem("lang"); if (s === "ar" || s === "en") set(s); } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; }, [lang]);
  const update = useCallback((l: Lang) => { set(l); try { localStorage.setItem("lang", l); } catch { /* ignore */ } }, []);
  return [lang, update];
}
