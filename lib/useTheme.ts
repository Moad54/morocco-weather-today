"use client";
import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

/** Light/dark theme, remembered in localStorage and applied as <html data-theme>. Dark is the default. */
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, set] = useState<Theme>("dark");
  useEffect(() => {
    try { const s = localStorage.getItem("theme"); if (s === "light" || s === "dark") set(s); } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const update = useCallback((t: Theme) => { set(t); try { localStorage.setItem("theme", t); } catch { /* ignore */ } }, []);
  return [theme, update];
}
