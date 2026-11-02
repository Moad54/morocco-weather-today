import { AlertTriangle, ShieldCheck } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { Dict, Lang } from "@/lib/i18n";
import { Alert, deriveAlerts, Forecast } from "@/lib/weather";
import { Glass, H } from "./Glass";

const tone = { yellow: "border-yellow-300/50 text-yellow-200", orange: "border-orange-400/60 text-orange-300", red: "border-red-400/70 text-red-300" };

export function AlertsCard({ all, lang, t }: { all: Forecast[]; lang: Lang; t: Dict }) {
  const list: Alert[] = deriveAlerts(all).slice(0, 8);
  return (
    <Glass delay={240}>
      <H>{t.alerts}</H>
      {list.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-white/65"><ShieldCheck size={18} className="text-emerald-300" />{t.alertsNone}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((a) => (
            <li key={a.city + a.type} className={`flex items-center justify-between gap-3 rounded-2xl border bg-white/5 px-4 py-3 text-sm ${tone[a.level]}`}>
              <span className="flex items-center gap-2"><AlertTriangle size={18} />{t.at[a.type]} — <b className="text-white">{lang === "ar" ? CITIES[a.city].ar : CITIES[a.city].en}</b></span>
              <span className="text-xs" dir="ltr">{t.lvl[a.level]} · {a.when.slice(5, 10)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs leading-relaxed text-white/45">{t.alertsNote}</p>
    </Glass>
  );
}
