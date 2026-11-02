import { CloudLightning } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { Dict, Lang } from "@/lib/i18n";
import { Forecast, stormHour } from "@/lib/weather";
import { Glass, H } from "./Glass";

export function ThunderCard({ all, lang, t, onPick }: { all: Forecast[]; lang: Lang; t: Dict; onPick: (id: string) => void }) {
  const hits = all.map((f, i) => ({ i, at: stormHour(f) })).filter((x) => x.at).sort((a, b) => a.at!.localeCompare(b.at!));
  return (
    <Glass delay={200}>
      <H>{t.thunder}</H>
      {hits.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-white/65"><CloudLightning size={18} className="text-white/40" />{t.thunderNone}</p>
      ) : (
        <ul className="space-y-2">
          {hits.map(({ i, at }) => (
            <li key={i}>
              <button onClick={() => onPick(CITIES[i].id)} className="chip flex w-full items-center justify-between !rounded-2xl px-4 py-3 text-sm">
                <span className="flex items-center gap-2"><CloudLightning size={18} className="text-yellow-300" />{lang === "ar" ? CITIES[i].ar : CITIES[i].en}</span>
                <span className="text-white/65" dir="ltr">{t.thunderAt} {at!.slice(5, 10)} {at!.slice(11, 16)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Glass>
  );
}
