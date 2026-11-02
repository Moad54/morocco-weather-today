import { CloudRain, Droplets, Gauge, Navigation, Umbrella, Wind } from "lucide-react";
import { ReactNode } from "react";
import { Dict } from "@/lib/i18n";
import { compass, Forecast, startIdx } from "@/lib/weather";
import { Glass, H } from "./Glass";

const Tile = ({ icon, label, value, extra }: { icon: ReactNode; label: string; value: string; extra?: ReactNode }) => (
  <div className="chip !rounded-2xl p-4">
    <p className="flex items-center gap-2 text-xs text-white/60">{icon}{label}</p>
    <p className="mt-2 flex items-center gap-2 text-2xl font-medium" dir="ltr">{value}{extra}</p>
  </div>
);

export function MetricsGrid({ f, t }: { f: Forecast; t: Dict }) {
  const c = f.current, ic = { size: 14, className: "text-volt" };
  return (
    <Glass id="wind" delay={120}>
      <H>{t.details}</H>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tile icon={<Wind {...ic} />} label={t.wind} value={`${Math.round(c.wind_speed_10m)} ${t.kmh}`}
          extra={<Navigation size={18} className="text-ice transition-transform duration-700" style={{ transform: `rotate(${c.wind_direction_10m + 180}deg)` }} />} />
        <Tile icon={<Navigation {...ic} />} label={t.wind} value={`${t.dir[compass(c.wind_direction_10m)]} ${Math.round(c.wind_direction_10m)}°`} />
        <Tile icon={<Wind {...ic} />} label={t.gusts} value={`${Math.round(c.wind_gusts_10m)} ${t.kmh}`} />
        <Tile icon={<Droplets {...ic} />} label={t.humidity} value={`${c.relative_humidity_2m}%`} />
        <Tile icon={<Gauge {...ic} />} label={t.pressure} value={`${Math.round(c.pressure_msl)} hPa`} />
        <Tile icon={<CloudRain {...ic} />} label={t.rainNow} value={`${c.precipitation.toFixed(1)} ${t.mm}`} />
        <Tile icon={<Umbrella {...ic} />} label={t.prob} value={`${f.hourly.precipitation_probability[startIdx(f)] ?? 0}%`} />
      </div>
    </Glass>
  );
}
