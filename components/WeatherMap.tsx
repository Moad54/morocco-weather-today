"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CITIES } from "@/lib/cities";
import { Dict, Lang } from "@/lib/i18n";
import { Forecast, MapLayer as Layer } from "@/lib/weather";
import { Glass, H } from "@/components/Glass";

interface Frames { host: string; radar?: { past: { path: string }[] }; satellite?: { infrared: { path: string }[] } }

export default function WeatherMap({ all, sel, lang, t, onPick, layer, onLayer }: { all: Forecast[]; sel: string; lang: Lang; t: Dict; onPick: (id: string) => void; layer: Layer; onLayer: (l: Layer) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const base = useRef<L.TileLayer | null>(null);
  const over = useRef<L.TileLayer | null>(null);
  const pins = useRef<L.LayerGroup | null>(null);
  const [rv, setRv] = useState<Frames | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { center: [30.8, -8], zoom: 5, minZoom: 4, maxZoom: 10 });
    pins.current = L.layerGroup().addTo(map.current);
    fetch("https://api.rainviewer.com/public/weather-maps.json").then((r) => r.json()).then(setRv).catch(() => setRv(null));
    return () => { map.current?.remove(); map.current = null; };
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

  useEffect(() => {
    pins.current?.clearLayers();
    CITIES.forEach((c, i) => {
      const icon = L.divIcon({ className: "", html: `<div class="pin" data-on="${c.id === sel}">${Math.round(all[i].current.temperature_2m)}° ${lang === "ar" ? c.ar : c.en}</div>`, iconSize: [0, 0] });
      L.marker([c.lat, c.lon], { icon }).on("click", () => onPick(c.id)).addTo(pins.current!);
    });
  }, [all, sel, lang, onPick]);

  useEffect(() => {
    const c = CITIES.find((x) => x.id === sel); if (c) map.current?.flyTo([c.lat, c.lon], Math.max(map.current.getZoom(), 6), { duration: 1.2 });
  }, [sel]);

  const tabs: [Layer, string][] = [["map", t.lMap], ["sat", t.lSat], ["rain", t.lRain], ["cloud", t.lCloud]];
  return (
    <Glass id="map" delay={280}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white/90">{t.map}</h2>
        <div className="flex flex-wrap gap-1">{tabs.map(([k, l]) => <button key={k} data-on={layer === k} onClick={() => onLayer(k)} className="chip px-3 py-1 text-xs">{l}</button>)}</div>
      </div>
      <div ref={el} className="h-[380px] overflow-hidden rounded-2xl sm:h-[480px]" dir="ltr" />
      <p className="mt-3 text-xs text-white/45">{t.radarNote}</p>
    </Glass>
  );
}
