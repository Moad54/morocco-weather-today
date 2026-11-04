"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { ArrowLeft, LocateFixed, Minus, Plus, Search, Wind } from "lucide-react";
import { Dict, Lang } from "@/lib/i18n";
import { Field, toField, WindGrid } from "@/lib/windField";
import { startParticles } from "@/lib/windParticles";
import { LangSwitch } from "./LangSwitch";
import { LocationPanel, Pt } from "./LocationPanel";

interface Hit { name: string; sub?: string; lat: number; lon: number }
const Btn = ({ children, label, on, onClick }: { children: ReactNode; label: string; on?: boolean; onClick: () => void }) => (
  <button type="button" aria-label={label} title={label} data-on={on} onClick={onClick} className="chip grid h-12 w-12 place-items-center">{children}</button>
);

export default function FullMap({ lang, t, onLang }: { lang: Lang; t: Dict; onLang: (l: Lang) => void }) {
  const el = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null), weatherCv = useRef<HTMLCanvasElement>(null);
  const [mapLayer, setMapLayer] = useState<"wind" | "temp" | "rain" | "cloud" | "humidity" | "pressure" | "snow" | "fog" | "air" | "waves" | "radar">("wind");
  const [weatherGrid, setWeatherGrid] = useState<{ points: { lat: number; lon: number; temperature_2m: number; precipitation: number; cloud_cover: number; relative_humidity_2m: number; pressure_msl: number; snowfall: number; visibility: number }[] } | null>(null);
  const [gridError, setGridError] = useState(false);
  const [airGrid, setAirGrid] = useState<{points: {lat:number; lon:number; european_aqi?:number; pm2_5?:number}[]} | null>(null);
  const [marineGrid, setMarineGrid] = useState<{points: {lat:number; lon:number; wave_height?:number}[]} | null>(null);
  const [extraError, setExtraError] = useState(false);
  const map = useRef<L.Map | null>(null), mk = useRef<L.CircleMarker | null>(null), radarLayer = useRef<L.TileLayer | null>(null);
  const [field, setField] = useState<Field | null>(null);
  const [wErr, setWErr] = useState(false), [wOn, setWOn] = useState(true);
  const [tileMsg, setTileMsg] = useState<"" | "basemap" | "tiles">(""), [qErr, setQErr] = useState(false);
  const [pt, setPt] = useState<Pt | null>(null);
  const [q, setQ] = useState(""), [hits, setHits] = useState<Hit[]>([]), [open, setOpen] = useState(false), [msg, setMsg] = useState("");

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: [31.8, -7.1], zoom: 6, minZoom: 4, maxZoom: 11, zoomControl: false, maxBounds: [[15, -25], [42, 8]], maxBoundsViscosity: 0.7 });
    // Base map with fallback: CARTO dark -> OpenStreetMap. Tiles failing before any tile loads switch provider; markers/wind still work with no tiles.
    const specs = [
      { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: "© OpenStreetMap, © CARTO" },
      { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "© OpenStreetMap contributors" },
    ];
    let step = 0, errors = 0, loaded = false, cur: L.TileLayer | null = null;
    const mount = () => {
      cur?.remove();
      const tl = L.tileLayer(specs[step].url, { attribution: specs[step].attribution, maxZoom: 11 });
      tl.on("tileload", () => { loaded = true; });
      tl.on("tileerror", () => {
        if (loaded || ++errors < 4) return;
        errors = 0; step += 1;
        if (step < specs.length) { setTileMsg("basemap"); mount(); } else { cur?.remove(); cur = null; setTileMsg("tiles"); }
      });
      tl.addTo(m); cur = tl;
    };
    mount();
    m.on("click", (e: L.LeafletMouseEvent) => setPt({ lat: e.latlng.lat, lon: e.latlng.lng }));
    map.current = m;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setWOn(false);
    return () => { m.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/map-weather", { signal: ac.signal })
      .then((r) => { if (!r.ok) throw new Error("grid"); return r.json(); })
      .then((j) => { if (!Array.isArray(j?.points) || !j.points.length) throw new Error("shape"); setWeatherGrid(j); setGridError(false); })
      .catch(() => { if (!ac.signal.aborted) setGridError(true); });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    Promise.all([
      fetch("/api/map-air", { signal: ac.signal }).then(r => { if (!r.ok) throw new Error("air"); return r.json(); }),
      fetch("/api/map-marine", { signal: ac.signal }).then(r => { if (!r.ok) throw new Error("marine"); return r.json(); }),
    ]).then(([air, marine]) => { setAirGrid(air); setMarineGrid(marine); setExtraError(false); })
      .catch(() => { if (!ac.signal.aborted) setExtraError(true); });
    return () => ac.abort();
  }, []);

  // RainViewer radar tiles are a separate observational layer; availability depends on regional coverage.
  useEffect(() => {
    setExtraError(false);
    const m = map.current;
    if (!m) return;
    radarLayer.current?.remove(); radarLayer.current = null;
    if (mapLayer !== "radar") return;
    const ac = new AbortController();
    fetch("https://api.rainviewer.com/public/weather-maps.json", { signal: ac.signal })
      .then(r => { if (!r.ok) throw new Error("radar"); return r.json(); })
      .then((j: any) => {
        const nowcast = j?.radar?.nowcast ?? []; const past = j?.radar?.past ?? [];
        const frame = nowcast[nowcast.length - 1] ?? past[past.length - 1];
        const activeMap = map.current;
        if (!frame?.path || ac.signal.aborted || !activeMap) throw new Error("no radar frame");
        const layer = L.tileLayer(`https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, { opacity: 0.72, attribution: "Radar © RainViewer", maxZoom: 11 });
        layer.addTo(activeMap); radarLayer.current = layer;
      }).catch(() => { if (!ac.signal.aborted) setExtraError(true); });
    return () => { ac.abort(); radarLayer.current?.remove(); radarLayer.current = null; };
  }, [mapLayer]);

  useEffect(() => {
    const m = map.current, canvas = weatherCv.current;
    if (!m || !canvas || !weatherGrid) return;
    const draw = () => {
      const size = m.getSize(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size.x * dpr; canvas.height = size.y * dpr;
      canvas.style.width = `${size.x}px`; canvas.style.height = `${size.y}px`;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size.x, size.y);
      if (mapLayer === "wind" || mapLayer === "radar") return;
      const cfg: Record<string, { key: string; min: number; max: number; colors: [number, number, number][] }> = {
        temp: { key: "temperature_2m", min: -5, max: 45, colors: [[35,90,220],[35,190,220],[70,190,100],[245,205,55],[225,65,45]] },
        rain: { key: "precipitation", min: 0, max: 12, colors: [[90,150,220],[40,190,220],[35,145,100],[245,205,50],[210,55,55]] },
        cloud: { key: "cloud_cover", min: 0, max: 100, colors: [[240,190,70],[170,190,205],[90,110,145],[55,65,95]] },
        humidity: { key: "relative_humidity_2m", min: 0, max: 100, colors: [[230,175,70],[100,190,160],[45,135,210],[80,80,190]] },
        pressure: { key: "pressure_msl", min: 980, max: 1040, colors: [[75,100,205],[50,175,205],[90,180,110],[230,190,65],[205,75,65]] },
        snow: { key: "snowfall", min: 0, max: 5, colors: [[160,190,220],[100,180,225],[235,245,255]] },
        fog: { key: "visibility", min: 0, max: 24000, colors: [[65,75,95],[130,145,155],[205,215,220]] },
        air: { key: "european_aqi", min: 0, max: 150, colors: [[65,170,95],[205,205,65],[235,145,45],[205,65,55]] },
        waves: { key: "wave_height", min: 0, max: 5, colors: [[70,150,210],[35,190,195],[245,195,75],[210,65,65]] },
      };
      const c = cfg[mapLayer]; if (!c) return;
      const sourcePoints = mapLayer === "air" ? airGrid?.points : mapLayer === "waves" ? marineGrid?.points : weatherGrid?.points;
      if (!sourcePoints) return;
      const radius = Math.max(34, Math.min(110, 72 * Math.pow(1.18, m.getZoom() - 6)));
      sourcePoints.forEach((p: any) => {
        const value = (p as any)[c.key]; if (typeof value !== "number" || !Number.isFinite(value)) return;
        const ratio = Math.max(0, Math.min(0.999, (value - c.min) / (c.max - c.min)));
        const idx = Math.min(c.colors.length - 2, Math.floor(ratio * (c.colors.length - 1)));
        const mix = ratio * (c.colors.length - 1) - idx, a = c.colors[idx], b = c.colors[idx + 1];
        const rgb = a.map((v, i) => Math.round(v + (b[i] - v) * mix));
        const pt = m.latLngToContainerPoint([p.lat, p.lon]);
        const g = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, radius);
        g.addColorStop(0, `rgba(${rgb.join(",")},0.48)`); g.addColorStop(1, `rgba(${rgb.join(",")},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2); ctx.fill();
      });
    };
    draw(); m.on("move zoom resize", draw);
    return () => { m.off("move zoom resize", draw); };
  }, [weatherGrid, airGrid, marineGrid, mapLayer]);

  useEffect(() => {
    let off = false;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 15000);
    fetch("/api/wind", { signal: ac.signal })
      .then((r) => { if (!r.ok) throw new Error("http"); return r.json() as Promise<WindGrid>; })
      .then((g) => {
        const n = g?.nLat * g?.nLon;
        if (!Array.isArray(g?.speed) || !Array.isArray(g?.dir) || !(n > 0) || g.speed.length !== n || g.dir.length !== n) throw new Error("shape");
        if (!off) setField(toField(g));
      })
      .catch(() => { if (!off) setWErr(true); })
      .finally(() => clearTimeout(timer));
    return () => { off = true; clearTimeout(timer); ac.abort(); };
  }, []);

  useEffect(() => {
    const m = map.current, c = cv.current;
    if (!m || !c || !field || !wOn || mapLayer !== "wind") return;
    return startParticles(m, c, field, window.innerWidth < 640 ? 900 : 1800);
  }, [field, wOn, mapLayer]);

  useEffect(() => {
    const m = map.current; if (!m) return;
    mk.current?.remove(); mk.current = null;
    if (pt) mk.current = L.circleMarker([pt.lat, pt.lon], { radius: 8, color: "#8ec5ff", weight: 2, fillColor: "#2f8bff", fillOpacity: 0.9 }).addTo(m);
  }, [pt]);

  useEffect(() => {
    const s = q.trim();
    if (s.length < 2) { setHits([]); setQErr(false); return; }
    const ac = new AbortController();
    const id = setTimeout(() => {
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(s)}&count=6&language=${lang}&countryCode=MA&format=json`, { signal: ac.signal })
        .then((r) => { if (!r.ok) throw new Error("http"); return r.json(); })
        .then((j: { results?: { name: string; admin1?: string; latitude: number; longitude: number }[] }) => {
          setQErr(false);
          setHits((j.results ?? []).map((x) => ({ name: x.name, sub: x.admin1, lat: x.latitude, lon: x.longitude })));
        })
        .catch((e: unknown) => { if ((e as Error)?.name !== "AbortError") { setHits([]); setQErr(true); } });
    }, 300);
    return () => { clearTimeout(id); ac.abort(); };
  }, [q, lang]);

  const go = (lat: number, lon: number, label?: string) => { map.current?.flyTo([lat, lon], 9, { duration: 1.2 }); setPt({ lat, lon, label }); setOpen(false); setQ(""); };
  const locate = () => {
    if (!navigator.geolocation) { setMsg(t.locateUnsupported); return; }
    setMsg("");
    navigator.geolocation.getCurrentPosition((p) => go(p.coords.latitude, p.coords.longitude, t.you), () => setMsg(t.locateDenied), { timeout: 10000 });
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div ref={el} className="absolute inset-0" dir="ltr" />
      <canvas ref={weatherCv} className="pointer-events-none absolute inset-0 z-[430]" aria-hidden />
      <canvas ref={cv} className="pointer-events-none absolute inset-0 z-[450]" aria-hidden />

      <div className="absolute inset-x-3 top-[calc(env(safe-area-inset-top,0px)+12px)] z-[1000] flex items-center gap-2 lg:start-24">
        <Link href="/" aria-label={t.back} className="glass grid h-12 w-12 shrink-0 place-items-center !rounded-full"><ArrowLeft size={18} className="rtl:rotate-180" /></Link>
        <div className="relative max-w-md flex-1">
          <Search size={16} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-white/50" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={t.searchPlace} aria-label={t.searchPlace}
            className="glass h-12 w-full !rounded-full pe-4 ps-10 text-sm outline-none placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-volt" />
          {open && q.trim().length >= 2 && (
            <ul className="glass absolute mt-2 max-h-72 w-full overflow-auto !rounded-2xl p-1">
              {hits.length === 0 && <li className={`px-4 py-3 text-sm ${qErr ? "text-orange-300" : "text-white/60"}`} role={qErr ? "alert" : undefined}>{qErr ? t.errBody : t.noMatch}</li>}
              {hits.map((h) => (
                <li key={`${h.lat},${h.lon}`}><button type="button" onClick={() => go(h.lat, h.lon, h.sub ? `${h.name}, ${h.sub}` : h.name)} className="w-full rounded-xl px-3 py-2 text-start text-sm hover:bg-white/10">
                  {h.name}{h.sub && <span className="text-white/50"> · {h.sub}</span>}</button></li>
              ))}
            </ul>
          )}
        </div>
        <LangSwitch lang={lang} onLang={onLang} label={t.language} />
      </div>

      <div className="glass absolute start-3 top-[calc(env(safe-area-inset-top,0px)+72px)] z-[1000] max-w-[calc(100%-1.5rem)] !rounded-full px-4 py-1.5 text-[11px] text-white/75 lg:start-24" role="status">
        {mapLayer === "wind" ? (wErr ? t.windErr : !field ? t.loading : `${t.windLayer} · ${t.source}: Open-Meteo · ${field.grid.time.slice(11, 16)}`) : (gridError ? t.noData : `${({temp:"Temperature",rain:"Precipitation",cloud:"Cloud cover",humidity:"Humidity",pressure:"Pressure",snow:"Snowfall",fog:"Visibility / fog",air:"Air quality · European AQI",waves:"Wave height",radar:"Rain radar · RainViewer"} as Record<string,string>)[mapLayer]} · {mapLayer === "air" ? "Open-Meteo Air Quality" : mapLayer === "waves" ? "Open-Meteo Marine" : mapLayer === "radar" ? "RainViewer" : "Open-Meteo"}`)}
        {!pt && !wErr && <span className="hidden sm:inline"> · {t.tapMap}</span>}
      </div>
      {extraError && (mapLayer === "air" || mapLayer === "waves" || mapLayer === "radar") && <div className="glass absolute inset-x-3 top-[calc(env(safe-area-inset-top,0px)+144px)] z-[1000] mx-auto w-fit max-w-[calc(100%-1.5rem)] !rounded-full px-4 py-2 text-center text-xs text-orange-300" role="status">{lang === "ar" ? "تعذر تحميل هذه الطبقة حالياً أو لا تتوفر تغطية كافية." : lang === "fr" ? "Cette couche est momentanément indisponible ou sans couverture." : "This layer is temporarily unavailable or has limited coverage."}</div>}
      {tileMsg && <div className="glass absolute inset-x-3 top-[calc(env(safe-area-inset-top,0px)+144px)] z-[1000] mx-auto w-fit max-w-[calc(100%-1.5rem)] !rounded-full px-4 py-2 text-center text-xs text-orange-300 lg:start-24 lg:inset-x-auto lg:mx-0" role="status">{tileMsg === "tiles" ? t.tilesErr : t.basemapFb}</div>}
      {msg && <div className="glass absolute inset-x-3 top-[calc(env(safe-area-inset-top,0px)+108px)] z-[1000] mx-auto w-fit !rounded-full px-4 py-2 text-xs text-orange-300 lg:start-24 lg:mx-0" role="alert">{msg}</div>}

      <div className="glass absolute inset-x-3 top-[calc(env(safe-area-inset-top,0px)+180px)] z-[1000] flex max-w-[calc(100%-1.5rem)] gap-1.5 overflow-x-auto !rounded-2xl p-2 lg:inset-x-auto lg:top-auto lg:bottom-5 lg:start-24 lg:max-w-[calc(100%-8rem)]" role="group" aria-label="Weather layers">
        {([
          ["wind", lang === "ar" ? "الرياح" : lang === "fr" ? "Vent" : "Wind"],
          ["temp", lang === "ar" ? "الحرارة" : lang === "fr" ? "Température" : "Temperature"],
          ["rain", lang === "ar" ? "الأمطار" : lang === "fr" ? "Pluie" : "Rain"],
          ["cloud", lang === "ar" ? "السحب" : lang === "fr" ? "Nuages" : "Clouds"],
          ["humidity", lang === "ar" ? "الرطوبة" : lang === "fr" ? "Humidité" : "Humidity"],
          ["pressure", lang === "ar" ? "الضغط" : lang === "fr" ? "Pression" : "Pressure"],
          ["snow", lang === "ar" ? "الثلوج" : lang === "fr" ? "Neige" : "Snow"],
          ["fog", lang === "ar" ? "الضباب" : lang === "fr" ? "Brouillard" : "Fog"],
          ["air", lang === "ar" ? "جودة الهواء" : lang === "fr" ? "Qualité air" : "Air quality"],
          ["waves", lang === "ar" ? "الأمواج" : lang === "fr" ? "Vagues" : "Waves"],
          ["radar", lang === "ar" ? "الرادار" : lang === "fr" ? "Radar" : "Radar"],
        ] as const).map(([key, label]) => <button key={key} type="button" data-on={mapLayer === key} aria-pressed={mapLayer === key} onClick={() => setMapLayer(key)} className="chip shrink-0 px-3 py-2 text-xs">{label}</button>)}
      </div>

      <div className="glass absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] z-[1000] mx-auto flex w-fit gap-2 !rounded-full p-2 lg:inset-x-auto lg:bottom-auto lg:start-5 lg:top-1/2 lg:mx-0 lg:-translate-y-1/2 lg:flex-col lg:!rounded-[2rem]">
        <Btn label={t.zoomIn} onClick={() => map.current?.zoomIn()}><Plus size={20} /></Btn>
        <Btn label={t.zoomOut} onClick={() => map.current?.zoomOut()}><Minus size={20} /></Btn>
        <Btn label={t.locate} onClick={locate}><LocateFixed size={20} /></Btn>
        <Btn label={t.toggleWind} on={mapLayer === "wind" && wOn} onClick={() => {
          if (mapLayer !== "wind") { setMapLayer("wind"); setWOn(true); } else setWOn((v) => !v);
        }}><Wind size={20} /></Btn>
      </div>

      {pt && (
        <div className="absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+88px)] z-[1000] lg:inset-x-auto lg:bottom-5 lg:end-5 lg:top-24 lg:w-96">
          <LocationPanel pt={pt} lang={lang} t={t} onClose={() => setPt(null)} />
        </div>
      )}
    </div>
  );
}
