"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { T } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import { useTheme } from "@/lib/useTheme";
import { Forecast, MapLayer, WeatherError, deriveAlerts, fetchAll, kind } from "@/lib/weather";
import { AlertsCard } from "@/components/AlertsCard";
import { CitiesPanel } from "@/components/CitiesPanel";
import { CurrentCard } from "@/components/CurrentCard";
import { DailyCard } from "@/components/DailyCard";
import { Dock, DockKey } from "@/components/Dock";
import { Glass } from "@/components/Glass";
import { Header } from "@/components/Header";
import { HourlyCard } from "@/components/HourlyCard";
import { MapBoundary } from "@/components/MapBoundary";
import { MetricsGrid } from "@/components/MetricsGrid";
import { RainChanceChart } from "@/components/RainChanceChart";
import { SunCard } from "@/components/SunCard";
import { ThunderCard } from "@/components/ThunderCard";
import { DaySel, WeeklyForecast } from "@/components/WeeklyForecast";

const WeatherMap = dynamic(() => import("@/components/WeatherMap"), { ssr: false, loading: () => <div className="skeleton h-[560px]" /> });

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

type Problem = "network" | "rate" | "data";

export default function Page() {
  const [lang, setLang] = useLang();
  const [theme, setTheme] = useTheme();
  const [all, setAll] = useState<Forecast[] | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [sel, setSel] = useState("casablanca");
  const [day, setDay] = useState<DaySel>(0);
  const [layer, setLayer] = useState<MapLayer>("map");
  const [active, setActive] = useState<DockKey | null>(null);
  const layerRef = useRef<MapLayer>("map");
  const lockUntil = useRef(0);
  const t = T[lang];

  const load = useCallback(async () => {
    try { setAll(await fetchAll()); setProblem(null); }
    catch (e) { setProblem(e instanceof WeatherError ? e.reason : "network"); }
  }, []);
  useEffect(() => {
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    window.addEventListener("online", load);
    return () => { clearInterval(id); window.removeEventListener("online", load); };
  }, [load]);

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
  // Weather-themed ambience hook (kept from the original app) from the selected city's live conditions.
  useEffect(() => {
    if (!all) return;
    const c = all[idx].current;
    document.body.dataset.wx = c.is_day ? kind(c.weather_code) : "night";
  }, [all, idx]);

  const alerts = useMemo(() => (all ? deriveAlerts(all) : []), [all]);
  const message = problem === "rate" ? t.errRate : problem === "data" ? t.errData : t.errBody;

  return (
    <main className="mx-auto max-w-[1560px] px-3 pb-36 pt-[calc(env(safe-area-inset-top,0px)+12px)] sm:px-5 lg:pb-8 lg:pe-6 lg:ps-28">
      <div className="shell">
        <Header lang={lang} t={t} onLang={setLang} theme={theme} onTheme={setTheme} sel={sel} onPick={setSel} alerts={alerts} />

        {!all && problem && (
          <Glass className="mt-6 flex flex-col items-center gap-3 py-14 text-center">
            <AlertTriangle size={36} className="text-orange-300" />
            <h2 className="text-xl font-semibold">{t.errTitle}</h2>
            <p className="max-w-md text-sm text-white/65" role="alert">{message}</p>
            <button type="button" onClick={load} className="chip flex items-center gap-2 px-5 py-2 text-sm"><RefreshCw size={14} />{t.retry}</button>
          </Glass>
        )}
        {!all && !problem && (
          <div role="status" aria-label={t.loading} className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="skeleton h-80" /><div className="skeleton h-80" />
            <div className="skeleton h-[520px]" /><div className="skeleton h-[520px]" />
          </div>
        )}

        {all && (
          <div className="mt-6 space-y-5">
            {problem && <p className="text-center text-xs text-orange-300" role="alert">{typeof navigator !== "undefined" && !navigator.onLine ? t.offlineNote : t.stale}</p>}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <section id="temperature" aria-label={t.daily} className="min-w-0 pt-1">
                <WeeklyForecast f={all[idx]} lang={lang} t={t} sel={day} onSel={setDay} />
              </section>
              <section aria-label={t.chanceRain} className="min-w-0 pt-1 xl:ps-2">
                <RainChanceChart f={all[idx]} lang={lang} t={t} sel={day} />
              </section>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0"><MapBoundary t={t}><WeatherMap all={all} sel={sel} lang={lang} t={t} onPick={setSel} layer={layer} onLayer={changeLayer} /></MapBoundary></div>
              {/* Fixed height below xl so the inner list's h-full resolves and scrolls; on xl it stretches to the map's row height. */}
              <div className="relative h-[480px] xl:h-auto">
                <div className="h-full xl:absolute xl:inset-0"><CitiesPanel all={all} sel={sel} lang={lang} t={t} onPick={setSel} /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <CurrentCard city={CITIES[idx]} f={all[idx]} lang={lang} t={t} />
              <div className="space-y-5 lg:col-span-2">
                <HourlyCard f={all[idx]} t={t} />
                <MetricsGrid f={all[idx]} t={t} />
              </div>
            </div>
            <DailyCard f={all[idx]} lang={lang} t={t} />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
              <SunCard f={all[idx]} t={t} />
              <ThunderCard all={all} lang={lang} t={t} onPick={setSel} />
              <AlertsCard all={all} lang={lang} t={t} />
            </div>
            <Dock active={active} t={t} onSelect={go} />
          </div>
        )}
      </div>
    </main>
  );
}
