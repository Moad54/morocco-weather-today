"use client";
import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, CloudSun, Map as MapIcon, MapPin, Moon, Search, ShieldCheck, Sun } from "lucide-react";
import { CITIES, City, cityName } from "@/lib/cities";
import { Dict, Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/useTheme";
import { Alert } from "@/lib/weather";
import { LangSwitch } from "./LangSwitch";

interface Props {
  lang: Lang; t: Dict; onLang: (l: Lang) => void;
  theme: Theme; onTheme: (t: Theme) => void;
  sel: string; onPick: (id: string) => void;
  alerts: Alert[];
}

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const tone = { yellow: "text-yellow-200", orange: "text-orange-300", red: "text-red-300" };

export function Header({ lang, t, onLang, theme, onTheme, sel, onPick, alerts }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [act, setAct] = useState(0);
  const [bell, setBell] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = CITIES.find((c) => c.id === sel) ?? CITIES[0];

  const hits = useMemo<City[]>(() => {
    const s = norm(q.trim());
    return CITIES.filter((c) => !s || [c.en, c.fr, c.ar, c.id].some((n) => norm(n).includes(s)));
  }, [q]);

  useEffect(() => {
    if (!bell) return;
    const close = (e: MouseEvent) => { if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBell(false); };
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") setBell(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [bell]);

  const pick = (c: City) => { onPick(c.id); setQ(""); setOpen(false); setAct(0); };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setAct((i) => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAct((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { const c = hits[act]; if (c) { e.preventDefault(); pick(c); } }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <header className="nav">
      <div className="nav-left flex min-w-0 items-center gap-2">
        <Link href="/" aria-label={t.title} className="nav-btn !bg-gradient-to-br from-sky-300 to-volt !text-slate-900"><CloudSun size={20} /></Link>
        <h1 className="hidden text-base font-semibold tracking-tight xl:block">{t.title}</h1>
        <p className="nav-pill min-w-0" aria-live="polite">
          <MapPin size={15} className="shrink-0" />
          <span className="truncate"><b className="font-semibold">{cityName(current, lang)}</b><span className="text-white/60">, {t.morocco}</span></span>
        </p>
      </div>

      <div className="relative order-last w-full lg:order-none lg:w-auto lg:min-w-[260px] lg:max-w-xl lg:flex-1">
        <Search size={17} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-white/50" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); setAct(0); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onKeyDown={onKey}
          role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={open && hits[act] ? `${listId}-${hits[act].id}` : undefined}
          placeholder={t.search} aria-label={t.search} autoComplete="off"
          className="search h-12 w-full rounded-full ps-11 pe-4 text-sm outline-none placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-volt" />
        {open && (
          <ul id={listId} role="listbox" className="pop absolute inset-x-0 top-full z-[1100] mt-2 max-h-72 overflow-auto p-1">
            {hits.length === 0 && <li className="px-4 py-3 text-sm text-white/60">{t.noMatch}</li>}
            {hits.map((c, i) => (
              <li key={c.id} id={`${listId}-${c.id}`} role="option" aria-selected={i === act}>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); pick(c); }} onMouseEnter={() => setAct(i)} data-on={i === act}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-sm data-[on=true]:bg-white/10">
                  <MapPin size={14} className="text-volt" />{cityName(c, lang)}
                  {lang !== "en" && <span className="ms-auto text-xs text-white/40">{c.en}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="nav-right flex items-center gap-2">
        <div ref={bellRef} className="sm:relative">
          <button type="button" onClick={() => setBell((v) => !v)} aria-label={t.notifications} aria-haspopup="true" aria-expanded={bell} className="nav-btn relative">
            <Bell size={18} />
            {alerts.length > 0 && <span className="absolute end-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-red-400 ring-2 ring-[var(--shell)]" aria-hidden />}
          </button>
          {bell && (
            <div role="dialog" aria-label={t.notifications} className="pop fixed inset-x-3 top-24 z-[1100] max-h-[70dvh] overflow-auto p-3 sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-80">
              <p className="mb-2 px-1 text-sm font-semibold">{t.notifications}</p>
              {alerts.length === 0 ? (
                <p className="flex items-center gap-2 px-1 py-2 text-sm text-white/65"><ShieldCheck size={18} className="text-emerald-300" />{t.notifNone}</p>
              ) : (
                <ul className="space-y-1.5">
                  {alerts.slice(0, 8).map((a) => (
                    <li key={a.city + a.type}>
                      <button type="button" onClick={() => { onPick(CITIES[a.city].id); setBell(false); }} className="flex w-full items-start gap-2 rounded-xl px-2 py-2 text-start text-sm hover:bg-white/10">
                        <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${tone[a.level]}`} />
                        <span><b>{t.at[a.type]}</b> — {cityName(CITIES[a.city], lang)}<span className="block text-xs text-white/55" dir="ltr">{t.lvl[a.level]} · {a.when.slice(5, 10)}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="seg" role="group" aria-label={t.theme} dir="ltr">
          <button type="button" aria-label={t.themeLight} title={t.themeLight} aria-pressed={theme === "light"} data-on={theme === "light"} onClick={() => onTheme("light")}><Sun size={16} /></button>
          <button type="button" aria-label={t.themeDark} title={t.themeDark} aria-pressed={theme === "dark"} data-on={theme === "dark"} onClick={() => onTheme("dark")}><Moon size={16} /></button>
        </div>

        <LangSwitch lang={lang} onLang={onLang} label={t.language} />

        <Link href="/map" aria-label={t.fullMap} title={t.fullMap} className="nav-btn"><MapIcon size={18} /></Link>
      </div>
    </header>
  );
}
