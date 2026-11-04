import { Droplets, MapPin, Thermometer } from "lucide-react";
import { City, cityName } from "@/lib/cities";
import { Dict, Lang } from "@/lib/i18n";
import { num } from "@/lib/format";
import { Forecast, kind } from "@/lib/weather";
import { Glass } from "./Glass";
import { WeatherIcon } from "./WeatherIcon";

export function CurrentCard({ city, f, lang, t }: { city: City; f: Forecast; lang: Lang; t: Dict }) {
  const c = f.current, k = kind(c.weather_code);
  return (
    <Glass className="flex flex-col justify-between gap-6 bg-gradient-to-br from-volt/20 to-transparent">
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-lg font-medium"><MapPin size={18} className="text-volt" />{cityName(city, lang)}</p>
          <p className="mt-1 text-sm text-white/60">{t.updated} <span dir="ltr">{c.time.slice(11, 16)}</span></p>
        </div>
        <WeatherIcon kind={k} night={!c.is_day} size={56} />
      </div>
      <div>
        <p className="text-8xl font-extralight leading-none tracking-tighter" dir="ltr">{num(lang, c.temperature_2m)}°</p>
        <p className="mt-3 text-xl">{t.wc[k]}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75">
          <span className="flex items-center gap-1.5"><Thermometer size={15} />{t.feels} <b dir="ltr">{num(lang, c.apparent_temperature)}°</b></span>
          <span className="flex items-center gap-1.5"><Droplets size={15} />{c.relative_humidity_2m}%</span>
        </div>
      </div>
    </Glass>
  );
}
