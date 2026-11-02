import { CITIES } from "@/lib/cities";
import { Dict, Lang } from "@/lib/i18n";
import { Forecast, kind } from "@/lib/weather";
import { Glass, H } from "./Glass";
import { WeatherIcon } from "./WeatherIcon";

export function Overview({ all, sel, lang, t, onPick }: { all: Forecast[]; sel: string; lang: Lang; t: Dict; onPick: (id: string) => void }) {
  return (
    <Glass delay={40}>
      <H>{t.overview}</H>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {CITIES.map((c, i) => (
          <button key={c.id} data-on={c.id === sel} onClick={() => onPick(c.id)} className="chip !rounded-2xl flex items-center justify-between gap-2 px-3 py-3 text-start text-sm">
            <span className="min-w-0"><span className="block truncate">{lang === "ar" ? c.ar : c.en}</span>
              <b className="text-lg font-semibold" dir="ltr">{Math.round(all[i].current.temperature_2m)}°</b></span>
            <WeatherIcon kind={kind(all[i].current.weather_code)} night={!all[i].current.is_day} size={22} />
          </button>
        ))}
      </div>
    </Glass>
  );
}
