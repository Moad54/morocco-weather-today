"use client";
import { Droplets } from "lucide-react";
import { Dict, Lang } from "@/lib/i18n";
import { hhmm, num, weekday } from "@/lib/format";
import { compass, Forecast, kind } from "@/lib/weather";
import { WeatherIcon } from "./WeatherIcon";

/** "week" = whole-week view; a number is the day index (0 = today) shown in the rain chart. */
export type DaySel = number | "week";
interface Props { f: Forecast; lang: Lang; t: Dict; sel: DaySel; onSel: (s: DaySel) => void }

export function WeeklyForecast({ f, lang, t, sel, onSel }: Props) {
  const d = f.daily, c = f.current;
  const days = d.time.slice(0, 7);
  const tabs: [DaySel, string][] = [[0, t.today], [1, t.tomorrow], ["week", t.next7]];
  const pop = (i: number) => (d.precipitation_probability_max[i] == null ? "–" : `${num(lang, d.precipitation_probability_max[i])}%`);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2" role="group" aria-label={t.daily}>
        {tabs.map(([k, label]) => (
          <button key={String(k)} type="button" className="tab" data-on={sel === k} aria-pressed={sel === k} onClick={() => onSel(k)}>{label}</button>
        ))}
      </div>

      <div className="scroll-x snap-x flex items-stretch gap-3 pb-1">
        {days.map((day, i) => {
          const k = kind(d.weather_code[i] ?? 3);
          if (i === 0) {
            const ck = kind(c.weather_code);
            return (
              <button key={day} type="button" onClick={() => onSel(0)} aria-pressed={sel === 0} data-sel={sel === 0}
                className="day-hi w-[272px] shrink-0 snap-start text-start">
                <span className="flex items-center justify-between text-[15px] font-medium"><span>{weekday(lang, day, "long")}</span><span dir="ltr">{hhmm(lang, c.time)}</span></span>
                <span className="mt-3 flex items-center justify-between">
                  <span>
                    <span className="block text-6xl font-semibold leading-none tracking-tight" dir="ltr">{num(lang, c.temperature_2m)}°</span>
                    <span className="mt-1 block text-sm font-medium opacity-70">{t.wc[ck]}</span>
                  </span>
                  <WeatherIcon kind={ck} night={!c.is_day} size={66} />
                </span>
                <span className="mt-2 flex items-center gap-3 text-xs font-medium" dir="ltr">
                  <span>{t.high} {num(lang, d.temperature_2m_max[0])}°</span><span>{t.low} {num(lang, d.temperature_2m_min[0])}°</span>
                  <span className="flex items-center gap-1"><Droplets size={12} />{pop(0)}</span>
                </span>
                <span className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11.5px] opacity-80">
                  <span>{t.realFeel} <b dir="ltr">{num(lang, c.apparent_temperature)}°</b></span>
                  <span>{t.wind} <b dir="ltr">{t.dir[compass(c.wind_direction_10m)]}, {num(lang, c.wind_speed_10m)} {t.kmh}</b></span>
                  <span>{t.pressure} <b dir="ltr">{num(lang, c.pressure_msl)} hPa</b></span>
                  <span>{t.humidity} <b dir="ltr">{num(lang, c.relative_humidity_2m)}%</b></span>
                  <span>{t.sunrise} <b dir="ltr">{hhmm(lang, d.sunrise[0])}</b></span>
                  <span>{t.sunset} <b dir="ltr">{hhmm(lang, d.sunset[0])}</b></span>
                </span>
              </button>
            );
          }
          return (
            <button key={day} type="button" onClick={() => onSel(i)} aria-pressed={sel === i} data-sel={sel === i} className="day snap-start">
              <span className="text-[15px] font-medium">{weekday(lang, day, "short")}</span>
              <span className="day-sep" aria-hidden />
              <WeatherIcon kind={k} size={46} />
              <span className="mt-auto flex flex-col items-center">
                <span className="text-3xl font-semibold leading-none" dir="ltr">{num(lang, d.temperature_2m_max[i])}°</span>
                <span className="mt-1 text-sm text-white/50" dir="ltr">{num(lang, d.temperature_2m_min[i])}°</span>
                <span className="mt-2 flex items-center gap-1 text-xs text-ice" dir="ltr"><Droplets size={11} />{pop(i)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
