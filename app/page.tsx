"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { Lang, T } from "@/lib/i18n";
import { Forecast, fetchAll } from "@/lib/weather";
import { AlertsCard } from "@/components/AlertsCard";
import { CurrentCard } from "@/components/CurrentCard";
import { DailyCard } from "@/components/DailyCard";
import { Glass } from "@/components/Glass";
import { Header } from "@/components/Header";
import { HourlyCard } from "@/components/HourlyCard";
import { MetricsGrid } from "@/components/MetricsGrid";
import { Overview } from "@/components/Overview";
import { ThunderCard } from "@/components/ThunderCard";

const WeatherMap = dynamic(() => import("@/components/WeatherMap"), { ssr: false, loading: () => <div className="skeleton h-[520px]" /> });

export default function Page() {
  const [lang, setLang] = useState<Lang>("en");
  const [all, setAll] = useState<Forecast[] | null>(null);
  const [error, setError] = useState(false);
  const [sel, setSel] = useState("casablanca");
  const t = T[lang];

  const load = useCallback(async () => {
    try { setAll(await fetchAll()); setError(false); } catch { setError(true); }
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 10 * 60 * 1000); return () => clearInterval(id); }, [load]);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; }, [lang]);

  const idx = Math.max(0, CITIES.findIndex((c) => c.id === sel));
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 sm:py-10">
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
          <div className="grid gap-5 lg:grid-cols-2">
            <ThunderCard all={all} lang={lang} t={t} onPick={setSel} />
            <AlertsCard all={all} lang={lang} t={t} />
          </div>
          <WeatherMap all={all} sel={sel} lang={lang} t={t} onPick={setSel} />
        </>
      )}
    </main>
  );
}
