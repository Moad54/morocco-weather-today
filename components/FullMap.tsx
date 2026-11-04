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
  const el = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null);
  const map = useRef<L.Map | null>(null), mk = useRef<L.CircleMarker | null>(null);
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
    if (!m || !c || !field || !wOn) return;
    return startParticles(m, c, field, window.innerWidth < 640 ? 900 : 1800);
  }, [field, wOn]);

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
        {wErr ? t.windErr : !field ? t.loading : `${t.windLayer} · ${t.source}: Open-Meteo · ${field.grid.time.slice(11, 16)}`}
        {!pt && !wErr && <span className="hidden sm:inline"> · {t.tapMap}</span>}
      </div>
      {tileMsg && <div className="glass absolute inset-x-3 top-[calc(env(safe-area-inset-top,0px)+144px)] z-[1000] mx-auto w-fit max-w-[calc(100%-1.5rem)] !rounded-full px-4 py-2 text-center text-xs text-orange-300 lg:start-24 lg:inset-x-auto lg:mx-0" role="status">{tileMsg === "tiles" ? t.tilesErr : t.basemapFb}</div>}
      {msg && <div className="glass absolute inset-x-3 top-[calc(env(safe-area-inset-top,0px)+108px)] z-[1000] mx-auto w-fit !rounded-full px-4 py-2 text-xs text-orange-300 lg:start-24 lg:mx-0" role="alert">{msg}</div>}

      <div className="glass absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] z-[1000] mx-auto flex w-fit gap-2 !rounded-full p-2 lg:inset-x-auto lg:bottom-auto lg:start-5 lg:top-1/2 lg:mx-0 lg:-translate-y-1/2 lg:flex-col lg:!rounded-[2rem]">
        <Btn label={t.zoomIn} onClick={() => map.current?.zoomIn()}><Plus size={20} /></Btn>
        <Btn label={t.zoomOut} onClick={() => map.current?.zoomOut()}><Minus size={20} /></Btn>
        <Btn label={t.locate} onClick={locate}><LocateFixed size={20} /></Btn>
        <Btn label={t.toggleWind} on={wOn} onClick={() => setWOn((v) => !v)}><Wind size={20} /></Btn>
      </div>

      {pt && (
        <div className="absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+88px)] z-[1000] lg:inset-x-auto lg:bottom-5 lg:end-5 lg:top-24 lg:w-96">
          <LocationPanel pt={pt} lang={lang} t={t} onClose={() => setPt(null)} />
        </div>
      )}
    </div>
  );
}
