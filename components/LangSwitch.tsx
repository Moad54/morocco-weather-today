"use client";
import { Lang } from "@/lib/i18n";

const OPTIONS: { l: Lang; short: string; name: string }[] = [
  { l: "en", short: "EN", name: "English" },
  { l: "fr", short: "FR", name: "Français" },
  { l: "ar", short: "ع", name: "العربية" },
];

/** Three-way language selector (EN / FR / AR). Changing it re-renders in place; no reload. */
export function LangSwitch({ lang, onLang, label }: { lang: Lang; onLang: (l: Lang) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label} dir="ltr">
      {OPTIONS.map((o) => (
        <button key={o.l} type="button" lang={o.l} title={o.name} aria-label={o.name} aria-pressed={lang === o.l} data-on={lang === o.l} onClick={() => onLang(o.l)}>
          {o.short}
        </button>
      ))}
    </div>
  );
}
