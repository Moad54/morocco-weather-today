import type { Map as LMap } from "leaflet";
import { Field, sample } from "./windField";

interface P { x: number; y: number; age: number; max: number }

/** Animated particles advected by the interpolated real wind field. Returns a stop function. */
export function startParticles(map: LMap, canvas: HTMLCanvasElement, field: Field, count: number): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  let w = 0, h = 0, raf = 0;
  const ps: P[] = Array.from({ length: count }, () => ({ x: 0, y: 0, age: 0, max: 0 }));
  const clear = () => ctx.clearRect(0, 0, w, h);
  const size = () => { const r = map.getContainer().getBoundingClientRect(); w = canvas.width = r.width; h = canvas.height = r.height; ps.forEach(respawn); };
  const respawn = (p: P) => { p.x = Math.random() * w; p.y = Math.random() * h; p.age = 0; p.max = 50 + Math.random() * 90; };

  const frame = () => {
    const b = map.getBounds(), n = b.getNorth(), s = b.getSouth(), we = b.getWest(), ea = b.getEast();
    const k = 0.12 * Math.pow(2, (map.getZoom() - 5) * 0.6);
    ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = "rgba(0,0,0,.07)"; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over"; ctx.lineWidth = 1.3; ctx.lineCap = "round";
    for (const p of ps) {
      const v = sample(field, n - (p.y / h) * (n - s), we + (p.x / w) * (ea - we));
      if (!v || ++p.age > p.max) { respawn(p); continue; }
      const sp = Math.hypot(v[0], v[1]), nx = p.x + v[0] * k, ny = p.y - v[1] * k;
      ctx.strokeStyle = sp > 12 ? "rgba(255,200,120,.9)" : sp > 7 ? "rgba(255,255,255,.85)" : "rgba(142,197,255,.8)";
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
      p.x = nx; p.y = ny;
    }
    raf = requestAnimationFrame(frame);
  };
  size();
  map.on("resize", size); map.on("moveend zoomend", clear);
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); map.off("resize", size); map.off("moveend zoomend", clear); clear(); };
}
