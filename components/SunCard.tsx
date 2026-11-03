import { Sunrise, Sunset } from "lucide-react";
import { Dict } from "@/lib/i18n";
import { Forecast } from "@/lib/weather";
import { Glass, H } from "./Glass";

/** Sunrise/sunset from Open-Meteo daily data, with the sun's live position on the daylight arc. */
export function SunCard({ f, t }: { f: Forecast; t: Dict }) {
  const sr = f.daily.sunrise[0], ss = f.daily.sunset[0];
  const a = Date.parse(sr), b = Date.parse(ss), n = Date.parse(f.current.time);
  const p = Math.min(1, Math.max(0, (n - a) / (b - a)));
  const ang = Math.PI * (1 - p), x = 50 + 40 * Math.cos(ang), y = 52 - 40 * Math.sin(ang);
  const mins = Math.round((b - a) / 60000);
  return (
    <Glass delay={220}>
      <H>{t.sun}</H>
      <div dir="ltr">
        <svg viewBox="0 0 100 60" className="w-full" aria-hidden>
          <path d="M10 52A40 40 0 0 1 90 52" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1.2" strokeDasharray="2 3" />
          <path d={`M10 52A40 40 0 0 1 ${x} ${y}`} fill="none" stroke="#ffc766" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="4" y1="52" x2="96" y2="52" stroke="rgba(255,255,255,.2)" strokeWidth=".6" />
          <circle cx={x} cy={y} r="4.5" fill="#ffd45e" style={{ filter: "drop-shadow(0 0 5px #ffb83d)" }} />
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm" dir="ltr">
        <div><Sunrise size={18} className="mx-auto text-amber-300" /><b className="mt-1 block">{sr.slice(11, 16)}</b><span className="text-xs text-white/55">{t.sunrise}</span></div>
        <div><span className="text-lg font-medium">{Math.floor(mins / 60)}:{String(mins % 60).padStart(2, "0")}</span><span className="block pt-1 text-xs text-white/55">{t.daylight}</span></div>
        <div><Sunset size={18} className="mx-auto text-orange-300" /><b className="mt-1 block">{ss.slice(11, 16)}</b><span className="text-xs text-white/55">{t.sunset}</span></div>
      </div>
    </Glass>
  );
}
