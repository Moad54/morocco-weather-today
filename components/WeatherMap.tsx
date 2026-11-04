"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { CITIES, cityName } from "@/lib/cities";
import { Dict, Lang } from "@/lib/i18n";
import { num } from "@/lib/format";
import { Forecast, Kind, MapLayer as Layer, compass, kind, startIdx } from "@/lib/weather";
import { Glass } from "@/components/Glass";

interface Frames { host: string; radar?: { past: { path: string }[] }; satellite?: { infrared: { path: string }[] } }

const EMOJI: Record<Kind, string> = { clear: "☀️", partly: "⛅", cloudy: "☁️", fog: "🌫️", drizzle: "🌦️", rain: "🌧️", snow: "❄️", storm: "⛈️" };

interface Props { all: Forecast[]; sel: string; lang: Lang; t: Dict; onPick: (id: string) => void; layer: Layer; onLayer: (l: Layer) => void }

export default function WeatherMap({ all, sel, lang, t, onPick, layer, onLayer }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const base = useRef<L.TileLayer | null>(null);
  const over = useRef<L.TileLayer | null>(null);
  const pins = useRef<L.LayerGroup | null>(null);
  const markers = useRef(new Map<string, L.Marker>());
  const selRef = useRef(sel);
  selRef.current = sel;
  const [rv, setRv] = useState<Frames | null>(null);
  const [rvFail, setRvFail] = useState(false);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: [30.8, -8], zoom: 5, minZoom: 4, maxZoom: 10, maxBounds: [[15, -25], [42, 8]], maxBoundsViscosity: 0.7 });
    const syncZoom = () => m.getContainer().classList.toggle("map-lo", m.getZoom() < 6);
    m.on("zoomend", syncZoom); syncZoom();
    map.current = m;
    pins.current = L.layerGroup().addTo(m);
    fetch("https://api.rainviewer.com/public/weather-maps.json").then((r) => { if (!r.ok) throw new Error("http"); return r.json() as Promise<Frames>; })
      .then((j) => { setRv(j); setRvFail(false); }).catch(() => { setRv(null); setRvFail(true); });
    return () => { m.remove(); map.current = null; pins.current = null; markers.current.clear(); };
  }, []);

  useEffect(() => {
    const m = map.current; if (!m) return;
    base.current?.remove(); over.current?.remove();
    base.current = (layer === "sat"
      ? L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Esri, Maxar" })
      : L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { attribution: "© OpenStreetMap, © CARTO" })).addTo(m);
    if (rv && layer === "rain" && rv.radar?.past.length)
      over.current = L.tileLayer(`${rv.host}${rv.radar.past.at(-1)!.path}/256/{z}/{x}/{y}/2/1_1.png`, { opacity: 0.75, maxNativeZoom: 7, attribution: "RainViewer" }).addTo(m);
    if (rv && layer === "cloud" && rv.satellite?.infrared.length)
      over.current = L.tileLayer(`${rv.host}${rv.satellite.infrared.at(-1)!.path}/256/{z}/{x}/{y}/0/0_0.png`, { opacity: 0.7, maxNativeZoom: 6, attribution: "RainViewer" }).addTo(m);
  }, [layer, rv]);

  // Weather markers: condition icon + live temperature, with a popup of details. Rebuilt only when data / language / layer change.
  useEffect(() => {
    pins.current?.clearLayers(); markers.current.clear();
    CITIES.forEach((c, i) => {
      const f = all[i], w = f.current, k = kind(w.weather_code), name = cityName(c, lang);
      const icon0 = !w.is_day && k === "clear" ? "🌙" : EMOJI[k];
      const hue = Math.max(0, Math.min(220, 220 - (w.temperature_2m + 5) * 4.4));
      const temp = `${num(lang, w.temperature_2m)}°`;
      const body = layer === "wind"
        ? `<b dir="ltr"><span style="display:inline-block;transform:rotate(${w.wind_direction_10m + 180}deg)">↑</span> ${num(lang, w.wind_speed_10m)} ${t.kmh}</b>`
        : `<b dir="ltr">${temp}</b>`;
      const style = layer === "temp" ? ` style="background:hsl(${hue} 85% 42% / .92)"` : "";
      const html = `<div class="pin" data-on="${c.id === selRef.current}"${style}><span class="pin-ic">${icon0}</span>${body}<span class="pin-name">${name}</span></div>`;
      const pop = `<div class="wx-pop" dir="${lang === "ar" ? "rtl" : "ltr"}"><b>${name}</b><div class="wx-big"><span>${icon0}</span><span dir="ltr">${temp}</span></div>`
        + `<div>${t.wc[k]}</div><div class="wx-sub">${t.feels} <span dir="ltr">${num(lang, w.apparent_temperature)}°</span> · ${t.wind} <span dir="ltr">${t.dir[compass(w.wind_direction_10m)]} ${num(lang, w.wind_speed_10m)} ${t.kmh}</span></div>`
        + `<div class="wx-sub">${t.prob} <span dir="ltr">${num(lang, f.hourly.precipitation_probability[startIdx(f)])}%</span> · ${t.humidity} <span dir="ltr">${num(lang, w.relative_humidity_2m)}%</span></div></div>`;
      const mk = L.marker([c.lat, c.lon], { icon: L.divIcon({ className: "", html, iconSize: [0, 0] }), keyboard: false, title: name })
        .bindPopup(pop, { className: "wx-popup", closeButton: true, offset: [0, -14] })
        .on("click", () => onPick(c.id)).addTo(pins.current!);
      markers.current.set(c.id, mk);
    });
  }, [all, lang, onPick, layer, t]);

  // Highlight the selected city's marker.
  useEffect(() => {
    markers.current.forEach((mk, id) => mk.getElement()?.querySelector(".pin")?.setAttribute("data-on", String(id === sel)));
  }, [sel, all, lang, onPick, layer, t]);

  useEffect(() => {
    const c = CITIES.find((x) => x.id === sel); const m = map.current;
    if (c && m) m.flyTo([c.lat, c.lon], Math.max(m.getZoom(), 6), { duration: 1.2 });
  }, [sel]);

  const tabs: [Layer, string][] = [["map", t.lMap], ["sat", t.lSat], ["rain", t.lRain], ["cloud", t.lCloud], ["wind", t.nav.wind], ["temp", t.nav.temp]];
  return (
    <Glass id="map" delay={280} className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t.map}</h2>
        <Link href="/map" className="chip inline-flex items-center gap-2 px-4 py-2 text-sm">{t.viewWide}<Sparkles size={14} className="text-amber-300" /></Link>
      </div>
      <div className="scroll-x mb-3 flex gap-1.5 pb-1" role="group" aria-label={t.map}>
        {tabs.map(([k, l]) => <button key={k} type="button" data-on={layer === k} aria-pressed={layer === k} onClick={() => onLayer(k)} className="chip shrink-0 px-3 py-1.5 text-xs">{l}</button>)}
      </div>
      <div ref={el} className="min-h-[360px] flex-1 overflow-hidden rounded-3xl sm:min-h-[460px] lg:min-h-[520px]" dir="ltr" />
      <p className="mt-3 text-xs text-white/45">{t.radarNote}{rvFail && (layer === "rain" || layer === "cloud") ? ` ${t.radarErr}` : ""}</p>
    </Glass>
  );
}
