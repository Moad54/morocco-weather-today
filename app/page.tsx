"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { Lang, T } from "@/lib/i18n";
import { Forecast, MapLayer, fetchAll, kind } from "@/lib/weather";
import { AlertsCard } from "@/components/AlertsCard";
import { CurrentCard } from "@/components/CurrentCard";
import { DailyCard } from "@/components/DailyCard";
import { SunCard } from "@/components/SunCard";
import { Dock, DockKey } from "@/components/Dock";
import { Glass } from "@/components/Glass";
import { Header } from "@/components/Header";
import { HourlyCard } from "@/components/HourlyCard";
import { MetricsGrid } from "@/components/MetricsGrid";
import { Overview } from "@/components/Overview";
import { ThunderCard } from "@/components/ThunderCard";

const WeatherMap = dynamic(() => import("@/components/WeatherMap"), { ssr: false, loading: () => <div className="skeleton h-[520px]" /> });

// Exhaustive switch: every MapLayer is handled, and the `never` check fails the build if a new layer is added without a mapping.
const layerKey = (l: MapLayer): DockKey | null => {
  switch (l) {
    case "cloud": return "clouds";
    case "sat": return "satellite";
    case "rain": return "rain";
    case "wind": return "wind";
    case "temp": return "temp";
    case "map": return null;
    default: { const unreachable: never = l; return unreachable; }
  }
};

export default function Page() {
  const [lang, setLang] = useState<Lang>("en");
  const [all, setAll] = useState<Forecast[] | null>(null);
  const [error, setError] = useState(false);
  const [sel, setSel] = useState("casablanca");
  const [layer, setLayer] = useState<MapLayer>("map");
  const [active, setActive] = useState<DockKey | null>(null);
  const layerRef = useRef<MapLayer>("map");
  const lockUntil = useRef(0);
  const t = T[lang];

  const load = useCallback(async () => {
    try { setAll(await fetchAll()); setError(false); } catch { setError(true); }
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 10 * 60 * 1000); return () => clearInterval(id); }, [load]);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; }, [lang]);

  const changeLayer = useCallback((l: MapLayer) => { layerRef.current = l; setLayer(l); setActive(layerKey(l)); }, []);

  const go = useCallback((k: DockKey) => {
    const layerFor = { clouds: "cloud", satellite: "sat", rain: "rain" } as const;
    if (k in layerFor) { layerRef.current = layerFor[k as keyof typeof layerFor]; setLayer(layerRef.current); }
    setActive(k);
    lockUntil.current = Date.now() + 900;
    const target = k === "wind" ? "wind" : k === "temp" ? "temperature" : "map";
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Highlight the dock item for the section currently crossing the middle of the screen.
  useEffect(() => {
    if (!all) return;
    const io = new IntersectionObserver((entries) => {
      if (Date.now() < lockUntil.current) return;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        setActive(e.target.id === "wind" ? "wind" : e.target.id === "temperature" ? "temp" : layerKey(layerRef.current));
      }
    }, { rootMargin: "-45% 0px -45% 0px" });
    ["temperature", "wind", "map"].forEach((id) => { const n = document.getElementById(id); if (n) io.observe(n); });
    return () => io.disconnect();
  }, [all]);

  const idx = Math.max(0, CITIES.findIndex((c) => c.id === sel));
  // Weather-themed ambient background (clear / rain / storm / night ...) from the selected city's live conditions.
  useEffect(() => {
    if (!all) return;
    const c = all[idx].current;
    document.body.dataset.wx = c.is_day ? kind(c.weather_code) : "night";
  }, [all, idx]);
  return (
    <main className="mx-auto max-w-7xl space-y-5 max-w-[1500px] px-4 pb-40 pt-[calc(env(safe-area-inset-top,0px)+24px)] sm:px-6 sm:pb-44 lg:pb-14 lg:pe-8 lg:ps-28 lg:pt-10">
      <Header lang={lang} t={t} onLang={setLang} onPick={setSel} />
      {!all && error && (
        <Glass className="flex flex-col items-center gap-3 py-14 text-center" >
          <AlertTriangle size={36} className="text-orange-300" />
          <h2 className="text-xl font-semibold">{t.errTitle}</h2>
          <p className="max-w-md text-sm text-white/65">{t.errBody}</p>
          <button onClick={load} className="chip flex items-center gap-2 px-5 py-2 text-sm"><RefreshCw size={14} />{t.retry}</button>
        </Glass>
      )}
      {!all && !error && (
        <div role="status" aria-label={t.loading} className="grid gap-5 lg:grid-cols-3">
          <div className="skeleton h-96" /><div className="skeleton h-96 lg:col-span-2" />
        </div>
      )}
      {all && (
        <>
          {error && <p className="text-center text-xs text-orange-300">{t.errBody}</p>}
          <Overview all={all} sel={sel} lang={lang} t={t} onPick={setSel} />
          <div className="grid gap-5 lg:grid-cols-3">
            <CurrentCard city={CITIES[idx]} f={all[idx]} lang={lang} t={t} />
            <div className="space-y-5 lg:col-span-2">
              <HourlyCard f={all[idx]} t={t} />
              <MetricsGrid f={all[idx]} t={t} />
            </div>
          </div>
          <DailyCard f={all[idx]} lang={lang} t={t} />
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <SunCard f={all[idx]} t={t} />
            <ThunderCard all={all} lang={lang} t={t} onPick={setSel} />
            <AlertsCard all={all} lang={lang} t={t} />
          </div>
          <WeatherMap all={all} sel={sel} lang={lang} t={t} onPick={setSel} layer={layer} onLayer={changeLayer} />
          <Dock active={active} t={t} onSelect={go} />
        </>
      )}
    </main>
  );
}
