"use client";
import { useState } from "react";
import { Droplets } from "lucide-react";
import { Dict, Lang } from "@/lib/i18n";
import { LOCALE } from "@/lib/format";
import { Forecast, kind } from "@/lib/weather";
import { Glass, H } from "./Glass";
import { WeatherIcon } from "./WeatherIcon";

export function DailyCard({ f, lang, t }: { f: Forecast; lang: Lang; t: Dict }) {
  const [n, setN] = useState<7 | 14>(7);
  const d = f.daily, lo = Math.min(...d.temperature_2m_min.slice(0, n)), hi = Math.max(...d.temperature_2m_max.slice(0, n));
  const fmt = new Intl.DateTimeFormat(LOCALE[lang], { weekday: "short", day: "numeric", month: "short" });
  return (
    <Glass delay={160}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white/90">{t.daily}</h2>
        <div className="flex gap-1">
          {([7, 14] as const).map((v) => (
            <button key={v} data-on={n === v} onClick={() => setN(v)} className="chip px-3 py-1 text-xs">{v === 7 ? t.d7 : t.d14}</button>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-white/10">
        {d.time.slice(0, n).map((day, i) => (
          <li key={day} className="grid grid-cols-[84px_28px_64px_1fr] items-center gap-3 py-2.5 text-sm sm:grid-cols-[110px_28px_72px_1fr]">
            <span className="truncate">{i === 0 ? t.today : fmt.format(new Date(day + "T12:00"))}</span>
            <WeatherIcon kind={kind(d.weather_code[i])} size={22} />
            <span className="flex items-center gap-1 text-xs text-ice" dir="ltr"><Droplets size={12} />{(d.precipitation_sum[i] ?? 0).toFixed(1)} {t.mm}</span>
            <div className="flex items-center gap-2" dir="ltr">
              <span className="w-7 text-end text-white/60">{Math.round(d.temperature_2m_min[i])}°</span>
              <div className="relative h-1.5 flex-1 rounded-full bg-white/10">
                <div className="absolute h-full rounded-full bg-gradient-to-r from-sky-300 to-volt"
                  style={{ left: `${((d.temperature_2m_min[i] - lo) / (hi - lo || 1)) * 100}%`, right: `${100 - ((d.temperature_2m_max[i] - lo) / (hi - lo || 1)) * 100}%` }} />
              </div>
              <span className="w-7 font-semibold">{Math.round(d.temperature_2m_max[i])}°</span>
            </div>
          </li>
        ))}
      </ul>
    </Glass>
  );
}
