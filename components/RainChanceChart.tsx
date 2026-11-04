"use client";
import { useState } from "react";
import { Dict, Lang } from "@/lib/i18n";
import { num, weekday } from "@/lib/format";
import { Forecast } from "@/lib/weather";
import type { DaySel } from "./WeeklyForecast";

interface Bar { label: string; full: string; p: number | null; mm: number | null; now: boolean; tick: boolean }

const W = 400, H = 214, PL = 38, PR = 8, PT = 16, PB = 28;

/** Real precipitation-probability chart: hourly for one day, or the daily maximum for the next 7 days. Values come straight from Open-Meteo. */
export function RainChanceChart({ f, lang, t, sel }: { f: Forecast; lang: Lang; t: Dict; sel: DaySel }) {
  const [hover, setHover] = useState<number | null>(null);
  const week = sel === "week";
  const bars: Bar[] = [];
  if (week) {
    f.daily.time.slice(0, 7).forEach((day, i) => bars.push({
      label: weekday(lang, day, "short"), full: weekday(lang, day, "long"), p: f.daily.precipitation_probability_max[i] ?? null,
      mm: f.daily.precipitation_sum[i] ?? null, now: i === 0, tick: true,
    }));
  } else {
    const day = f.daily.time[sel];
    const nowHour = f.current.time.slice(0, 13);
    f.hourly.time.forEach((tm, i) => {
      if (!day || !tm.startsWith(day)) return;
      const h = +tm.slice(11, 13);
      const label = `${num(lang, h)}:00`;
      bars.push({ label, full: `${weekday(lang, day, "long")} ${label}`, p: f.hourly.precipitation_probability[i] ?? null, mm: f.hourly.precipitation[i] ?? null, now: tm.slice(0, 13) === nowHour, tick: h % 3 === 0 });
    });
  }

  const n = bars.length;
  const slot = n ? (W - PL - PR) / n : 0;
  const bw = Math.min(week ? 14 : 8, slot * 0.56);
  const plotH = H - PT - PB;
  const y = (p: number) => PT + plotH * (1 - p / 100);
  const hv = hover !== null && hover < n ? hover : null;
  const known = bars.filter((b) => b.p !== null);
  const peak = known.length ? known.reduce((a, b) => ((b.p ?? 0) > (a.p ?? 0) ? b : a)) : null;
  const shown = hv !== null ? bars[hv] : peak;

  return (
    <div className="flex h-full flex-col">
      <h2 className="text-lg font-semibold tracking-tight">{t.chanceRain}</h2>
      <p className="mt-0.5 text-xs text-white/50">{week ? t.chanceDaily : weekday(lang, f.daily.time[sel] ?? f.daily.time[0], "long")}</p>

      {n === 0 ? (
        <p className="mt-6 text-sm text-white/60">{t.noData}</p>
      ) : (
        <div dir="ltr" className="mt-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full touch-manipulation select-none" role="img" aria-label={t.chanceRain} onMouseLeave={() => setHover(null)}>
          {[0, 50, 100].map((v) => (
            <g key={v}>
              <line x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity={0.12} strokeDasharray="3 4" />
              <text x={PL - 8} y={y(v) + 3.5} textAnchor="end" className="fill-current text-white/50" fontSize="10">{num(lang, v)}%</text>
            </g>
          ))}
          {bars.map((b, i) => {
            const cx = PL + (i + 0.5) * slot, x = cx - bw / 2;
            const h = b.p === null ? 0 : Math.max(b.p > 0 ? 3 : 1.5, (plotH * b.p) / 100);
            return (
              <g key={i}>
                <rect x={x} y={PT} width={bw} height={plotH} rx={bw / 2} className="chart-track" />
                {b.p !== null && <rect x={x} y={PT + plotH - h} width={bw} height={h} rx={bw / 2} className="chart-bar" data-now={b.now} data-hover={hv === i} opacity={b.p === 0 ? 0.4 : 1} />}
                {b.tick && <text x={cx} y={H - 8} textAnchor="middle" className="fill-current text-white/50" fontSize="9.5">{b.label}</text>}
                <rect x={cx - slot / 2} y={PT} width={slot} height={plotH + PB} fill="transparent" onMouseEnter={() => setHover(i)} onMouseMove={() => setHover(i)} onClick={() => setHover(i)} onTouchStart={() => setHover(i)} />
              </g>
            );
          })}
          {hv !== null && (() => {
            const b = bars[hv], cx = PL + (hv + 0.5) * slot, w = 92, x = Math.min(Math.max(cx - w / 2, 2), W - w - 2);
            const ty = Math.max(2, (b.p === null ? PT + plotH : y(b.p)) - 46);
            return (
              <g pointerEvents="none">
                <rect x={x} y={ty} width={w} height={38} rx={9} className="chart-tip" />
                <text x={x + w / 2} y={ty + 15} textAnchor="middle" fontSize="10" className="fill-current text-white/60">{b.label}</text>
                <text x={x + w / 2} y={ty + 30} textAnchor="middle" fontSize="11.5" fontWeight="600" className="fill-current">{b.p === null ? "–" : `${num(lang, b.p)}%`}{b.mm !== null ? ` · ${num(lang, b.mm, 1)} ${t.mm}` : ""}</text>
              </g>
            );
          })()}
        </svg>
        </div>
      )}

      <p className="mt-auto pt-3 text-sm text-white/70" aria-live="polite">
        {shown ? <><span className="text-white/50">{hv !== null ? shown.full : t.peak}: </span><b dir="ltr">{shown.p === null ? "–" : `${num(lang, shown.p)}%`}</b>{hv === null && <span className="text-white/50"> · {shown.label}</span>}</> : null}
      </p>
    </div>
  );
}
