"use client";
import { useEffect, useState } from "react";
import { Droplets, Gauge, Navigation, RefreshCw, Thermometer, Cloud, CloudRain, Wind, X } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { Dict, Lang } from "@/lib/i18n";
import { compass, kind } from "@/lib/weather";
import { WeatherIcon } from "./WeatherIcon";

export interface Pt { lat: number; lon: number; label?: string }
interface Cur { time: string; temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; pressure_msl: number; wind_speed_10m: number;
  wind_direction_10m: number; wind_gusts_10m: number; precipitation: number; cloud_cover: number; weather_code: number; is_day: number }

const km = (a: Pt, b: { lat: number; lon: number }) => {
  const r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

export function LocationPanel({ pt, lang, t, onClose }: { pt: Pt; lang: Lang; t: Dict; onClose: () => void }) {
  const [d, setD] = useState<Cur | null>(null);
  const [st, setSt] = useState<"load" | "err" | "ok">("load");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const ac = new AbortController();
    setSt("load");
    const p = new URLSearchParams({ latitude: String(pt.lat), longitude: String(pt.lon), timezone: "auto", wind_speed_unit: "kmh",
      current: "temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,cloud_cover,weather_code,is_day" });
    fetch(`https://api.open-meteo.com/v1/forecast?${p}`, { signal: ac.signal })
      .then((r) => { if (!r.ok) throw new Error("http"); return r.json(); })
      .then((j: { current: Cur }) => { setD(j.current); setSt("ok"); })
      .catch((e: unknown) => { if ((e as Error)?.name !== "AbortError") setSt("err"); });
    return () => ac.abort();
  }, [pt.lat, pt.lon, retry]);

  const near = CITIES.map((c) => ({ c, d: km(pt, c) })).sort((a, b) => a.d - b.d)[0];
  const title = pt.label ?? `${t.nearest} ${lang === "ar" ? near.c.ar : near.c.en} · ${Math.round(near.d)} km`;
  const k = d ? kind(d.weather_code) : "clear";
  const Tile = ({ icon, label, v }: { icon: React.ReactNode; label: string; v: string }) => (
    <div className="chip !rounded-2xl p-3"><p className="flex items-center gap-1.5 text-xs text-white/60">{icon}{label}</p><p className="mt-1 text-lg font-medium" dir="ltr">{v}</p></div>
  );

  return (
    <div className="glass rise max-h-[55dvh] overflow-y-auto p-5 lg:max-h-full">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0"><h2 className="truncate text-base font-semibold">{title}</h2><p className="text-xs text-white/50" dir="ltr">{pt.lat.toFixed(2)}, {pt.lon.toFixed(2)}</p></div>
        <button onClick={onClose} aria-label={t.close} className="chip grid h-9 w-9 shrink-0 place-items-center"><X size={16} /></button>
      </div>
      {st === "load" && <div className="skeleton h-40" role="status" aria-label={t.loading} />}
      {st === "err" && (
        <div className="py-6 text-center text-sm text-white/70"><p>{t.errBody}</p>
          <button onClick={() => setRetry((n) => n + 1)} className="chip mt-3 inline-flex items-center gap-2 px-4 py-2"><RefreshCw size={14} />{t.retry}</button></div>
      )}
      {st === "ok" && d && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div><p className="text-6xl font-extralight leading-none" dir="ltr">{Math.round(d.temperature_2m)}°</p><p className="mt-2">{t.wc[k]}</p></div>
            <WeatherIcon kind={k} night={!d.is_day} size={52} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Tile icon={<Thermometer size={13} />} label={t.feels} v={`${Math.round(d.apparent_temperature)}°`} />
            <Tile icon={<Wind size={13} />} label={t.wind} v={`${Math.round(d.wind_speed_10m)} ${t.kmh}`} />
            <Tile icon={<Navigation size={13} style={{ transform: `rotate(${d.wind_direction_10m + 180}deg)` }} />} label={t.dir[compass(d.wind_direction_10m)]} v={`${Math.round(d.wind_direction_10m)}°`} />
            <Tile icon={<Wind size={13} />} label={t.gusts} v={`${Math.round(d.wind_gusts_10m)} ${t.kmh}`} />
            <Tile icon={<Droplets size={13} />} label={t.humidity} v={`${d.relative_humidity_2m}%`} />
            <Tile icon={<Gauge size={13} />} label={t.pressure} v={`${Math.round(d.pressure_msl)} hPa`} />
            <Tile icon={<CloudRain size={13} />} label={t.rainNow} v={`${d.precipitation.toFixed(1)} ${t.mm}`} />
            <Tile icon={<Cloud size={13} />} label={t.cloud} v={`${d.cloud_cover}%`} />
          </div>
          <p className="mt-3 text-[11px] text-white/45" dir="ltr">{t.source}: Open-Meteo · {d.time.replace("T", " ")}</p>
        </>
      )}
    </div>
  );
}
