import { Dict } from "@/lib/i18n";
import { Forecast, kind, startIdx } from "@/lib/weather";
import { Glass, H } from "./Glass";
import { WeatherIcon } from "./WeatherIcon";

export function HourlyCard({ f, t }: { f: Forecast; t: Dict }) {
  const s = startIdx(f), h = f.hourly;
  return (
    <Glass delay={80}>
      <H>{t.hourly}</H>
      <div className="scroll-x -mx-2 flex gap-2 px-2 pb-1">
        {h.time.slice(s, s + 24).map((time, n) => {
          const i = s + n, mm = h.precipitation[i], isDay = +time.slice(11, 13) >= 7 && +time.slice(11, 13) < 19;
          return (
            <div key={time} className="chip flex min-w-[68px] flex-col items-center gap-2 px-2 py-3 text-sm" dir="ltr">
              <span className="text-white/60">{n === 0 ? "Now" : time.slice(11, 16)}</span>
              <WeatherIcon kind={kind(h.weather_code[i])} night={!isDay} size={24} />
              <b className="text-base">{Math.round(h.temperature_2m[i])}°</b>
              <span className={`text-xs ${mm > 0 ? "text-ice" : "text-white/30"}`}>{mm.toFixed(1)} {t.mm}</span>
              <span className="text-[11px] text-white/45">{h.precipitation_probability[i] ?? 0}%</span>
            </div>
          );
        })}
      </div>
    </Glass>
  );
}
