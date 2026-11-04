import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Moon, Sun } from "lucide-react";
import { Kind } from "@/lib/weather";

export function WeatherIcon({ kind, night = false, size = 28 }: { kind: Kind; night?: boolean; size?: number }) {
  const p = { size, strokeWidth: 1.5, style: { filter: "drop-shadow(0 2px 8px rgba(120,190,255,.35))" } };
  switch (kind) {
    case "clear": return night ? <Moon {...p} className="text-ice" /> : <Sun {...p} className="text-amber-300" />;
    case "partly": return <CloudSun {...p} className="text-sky-200" />;
    case "fog": return <CloudFog {...p} className="text-slate-300" />;
    case "drizzle": return <CloudDrizzle {...p} className="text-sky-300" />;
    case "rain": return <CloudRain {...p} className="text-volt" />;
    case "snow": return <CloudSnow {...p} className="text-white" />;
    case "storm": return <CloudLightning {...p} className="text-yellow-300" />;
    default: return <Cloud {...p} className="text-slate-300" />;
  }
}
