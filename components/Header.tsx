"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Languages, Map as MapIcon, MapPin, Search } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { Dict, Lang } from "@/lib/i18n";

interface Props { lang: Lang; t: Dict; onLang: (l: Lang) => void; onPick: (id: string) => void }

export function Header({ lang, t, onLang, onPick }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    return CITIES.filter((c) => !s || c.en.toLowerCase().includes(s) || c.ar.includes(s));
  }, [q]);

  return (
    <header className="rise flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h1>
        <p className="mt-1 text-sm text-ice/80">{t.sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 sm:w-72">
          <Search size={16} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-white/50" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={t.search} aria-label={t.search}
            className="glass w-full !rounded-full py-3 pe-4 ps-10 text-sm outline-none placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-volt" />
          {open && (
            <ul className="glass absolute z-[1000] mt-2 max-h-72 w-full overflow-auto !rounded-2xl p-1">
              {hits.length === 0 && <li className="px-4 py-3 text-sm text-white/60">{t.noMatch}</li>}
              {hits.map((c) => (
                <li key={c.id}>
                  <button onMouseDown={() => { onPick(c.id); setQ(""); setOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm hover:bg-white/10">
                    <MapPin size={14} className="text-volt" />{lang === "ar" ? c.ar : c.en}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link href="/map" aria-label={t.fullMap} className="glass flex items-center gap-2 !rounded-full px-4 py-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-volt">
          <MapIcon size={16} /><span className="hidden sm:inline">{t.fullMap}</span>
        </Link>
        <button onClick={() => onLang(lang === "en" ? "ar" : "en")} aria-label="Switch language"
          className="glass flex items-center gap-2 !rounded-full px-4 py-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-volt">
          <Languages size={16} />{lang === "en" ? "العربية" : "English"}
        </button>
      </div>
    </header>
  );
}
