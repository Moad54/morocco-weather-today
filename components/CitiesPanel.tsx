"use client";
import { CITIES, cityName } from "@/lib/cities";
import { Dict, Lang } from "@/lib/i18n";
import { num } from "@/lib/format";
import { Forecast, kind } from "@/lib/weather";
import { WeatherIcon } from "./WeatherIcon";

/** Scrollable list of Moroccan cities with live Open-Meteo conditions. Selecting a city drives the whole dashboard. */
export function CitiesPanel({ all, sel, lang, t, onPick }: { all: Forecast[]; sel: string; lang: Lang; t: Dict; onPick: (id: string) => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold tracking-tight">{t.cities}</h2>
        <span className="text-xs text-white/50" dir="ltr">{num(lang, CITIES.length)}</span>
      </div>
      <ul className="city-scroll -me-2 min-h-0 flex-1 space-y-3 overflow-y-auto pe-2" aria-label={t.cities}>
        {CITIES.map((c, i) => {
          const cur = all[i].current, k = kind(cur.weather_code);
          return (
            <li key={c.id}>
              <button type="button" onClick={() => onPick(c.id)} aria-pressed={c.id === sel} data-on={c.id === sel} className="city-card">
                <span className="min-w-0 text-start">
                  <span className="block text-xs text-white/50">{t.morocco}</span>
                  <span className="block truncate text-lg font-medium leading-tight">{cityName(c, lang)}</span>
                  <span className="mt-2 block truncate text-sm text-white/70">{t.wc[k]}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <WeatherIcon kind={k} night={!cur.is_day} size={40} />
                  <b className="text-2xl font-semibold leading-none" dir="ltr">{num(lang, cur.temperature_2m)}°</b>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
