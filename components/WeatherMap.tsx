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

interface Frames { host: string; radar?: { past?: { path: string }[] }; satellite?: { infrared?: { path: string }[] } }
const isFrames = (j: unknown): j is Frames => !!j && typeof (j as Frames).host === "string" && (j as Frames).host.startsWith("https://");

interface TileSpec { url: string; opts: Record<string, unknown> }
const DARK: TileSpec = { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", opts: { attribution: "© OpenStreetMap, © CARTO", maxZoom: 10 } };
const OSM: TileSpec = { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", opts: { attribution: "© OpenStreetMap contributors", maxZoom: 10 } };
const SAT: TileSpec = { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", opts: { attribution: "Esri, Maxar", maxZoom: 10 } };
/** Providers tried in order when tiles keep failing before a single tile has loaded. */
const CHAIN: Record<"sat" | "other", TileSpec[]> = { sat: [SAT, DARK, OSM], other: [DARK, OSM] };
const TILE_ERRORS_BEFORE_FALLBACK = 4;

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
  const [rvTry, setRvTry] = useState(0);
  const [baseMsg, setBaseMsg] = useState<"" | "basemap" | "tiles">("");
  const [ovMsg, setOvMsg] = useState<"" | "radar" | "cloud">("");

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: [30.8, -8], zoom: 5, minZoom: 4, maxZoom: 10, maxBounds: [[15, -25], [42, 8]], maxBoundsViscosity: 0.7 });
    const syncZoom = () => m.getContainer().classList.toggle("map-lo", m.getZoom() < 6);
    m.on("zoomend", syncZoom); syncZoom();
    map.current = m;
    pins.current = L.layerGroup().addTo(m);
    return () => { m.remove(); map.current = null; pins.current = null; markers.current.clear(); };
  }, []);

  // RainViewer frame index: timeout + shape validation. A failure only affects the radar overlay, never the dashboard.
  useEffect(() => {
    const ac = new AbortController();
    let stale = false;
    const timer = setTimeout(() => ac.abort(), 10000); // a timeout aborts the request and is reported as a failure
    setRvFail(false);
    fetch("https://api.rainviewer.com/public/weather-maps.json", { signal: ac.signal })
      .then((r) => { if (!r.ok) throw new Error("http"); return r.json() as Promise<unknown>; })
      .then((j) => { if (!isFrames(j)) throw new Error("shape"); if (!stale) setRv(j); })
      .catch(() => { if (!stale) { setRv(null); setRvFail(true); } })
      .finally(() => clearTimeout(timer));
    return () => { stale = true; clearTimeout(timer); ac.abort(); };
  }, [rvTry]);

  // Base map with a provider fallback chain. Tiles that fail before any tile has loaded trigger the next provider; if all fail, markers still work.
  useEffect(() => {
    const m = map.current; if (!m) return;
    let dead = false, loaded = false, errors = 0, step = 0;
    const chain = CHAIN[layer === "sat" ? "sat" : "other"];
    setBaseMsg("");
    const mount = () => {
      base.current?.remove();
      const spec = chain[step];
      const tl = L.tileLayer(spec.url, spec.opts);
      tl.on("tileload", () => { loaded = true; });
      tl.on("tileerror", () => {
        if (dead || loaded || ++errors < TILE_ERRORS_BEFORE_FALLBACK) return;
        errors = 0; step += 1;
        if (step < chain.length) { setBaseMsg("basemap"); mount(); } else { base.current?.remove(); base.current = null; setBaseMsg("tiles"); }
      });
      tl.addTo(m);
      base.current = tl;
    };
    mount();
    return () => { dead = true; base.current?.remove(); base.current = null; };
  }, [layer]);

  // Radar overlay. RainViewer retired its satellite/infrared data on 1 Jan 2026, so the cloud layer is used only if the API still advertises frames.
  useEffect(() => {
    const m = map.current; if (!m) return;
    over.current?.remove(); over.current = null; setOvMsg("");
    if (layer !== "rain" && layer !== "cloud") return;
    if (!rv) { if (rvFail) setOvMsg(layer === "rain" ? "radar" : "cloud"); return; }
    const frames = layer === "rain" ? rv.radar?.past : rv.satellite?.infrared;
    const path = frames?.length ? frames[frames.length - 1]?.path : undefined;
    if (!path) { setOvMsg(layer === "rain" ? "radar" : "cloud"); return; }
    let loaded = false, errors = 0;
    const tl = layer === "rain"
      ? L.tileLayer(`${rv.host}${path}/256/{z}/{x}/{y}/2/1_1.png`, { opacity: 0.75, maxNativeZoom: 7, attribution: "RainViewer" })
      : L.tileLayer(`${rv.host}${path}/256/{z}/{x}/{y}/0/0_0.png`, { opacity: 0.7, maxNativeZoom: 6, attribution: "RainViewer" });
    tl.on("tileload", () => { loaded = true; setOvMsg(""); });
    tl.on("tileerror", () => { if (!loaded && ++errors >= TILE_ERRORS_BEFORE_FALLBACK) setOvMsg(layer === "rain" ? "radar" : "cloud"); });
    tl.addTo(m); over.current = tl;
    return () => { tl.remove(); if (over.current === tl) over.current = null; };
  }, [layer, rv, rvFail]);

  // Weather markers: condition icon + live temperature, with a popup of details. Rebuilt only when data / language / layer change.
  useEffect(() => {
    pins.current?.clearLayers(); markers.current.clear();
    CITIES.forEach((c, i) => {
      const f = all[i]; if (!f) return;
      const w = f.current, k = kind(w.weather_code), name = cityName(c, lang);
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
      <div className="mt-3 space-y-1 text-xs" aria-live="polite">
        {baseMsg && <p className="text-orange-300" role="status">{baseMsg === "tiles" ? t.tilesErr : t.basemapFb}</p>}
        {ovMsg && (
          <p className="flex flex-wrap items-center gap-2 text-orange-300" role="status">
            <span>{ovMsg === "cloud" ? t.cloudErr : t.radarErr}</span>
            {rvFail && <button type="button" onClick={() => setRvTry((n) => n + 1)} className="chip px-3 py-1 text-xs">{t.retry}</button>}
          </p>
        )}
        <p className="text-white/45">{t.radarNote}</p>
      </div>
    </Glass>
  );
}
