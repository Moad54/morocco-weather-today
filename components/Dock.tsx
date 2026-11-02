"use client";
import { Cloud, CloudRain, Satellite, Thermometer, Wind } from "lucide-react";
import { Dict } from "@/lib/i18n";

export type DockKey = "clouds" | "wind" | "satellite" | "temp" | "rain";
const ITEMS = [
  { k: "clouds", Icon: Cloud },
  { k: "wind", Icon: Wind },
  { k: "satellite", Icon: Satellite },
  { k: "temp", Icon: Thermometer },
  { k: "rain", Icon: CloudRain },
] as const;

/** Floating Liquid Glass dock. Order follows the reading direction automatically (flex + dir). */
export function Dock({ active, t, onSelect }: { active: DockKey | null; t: Dict; onSelect: (k: DockKey) => void }) {
  return (
    <nav className="dock" aria-label={t.nav.label}>
      {ITEMS.map(({ k, Icon }) => (
        <button key={k} type="button" className="dock-btn" data-on={active === k} aria-label={t.nav[k]} title={t.nav[k]}
          aria-current={active === k ? "true" : undefined} onClick={() => onSelect(k)}>
          <Icon size={24} strokeWidth={1.7} />
        </button>
      ))}
    </nav>
  );
}
