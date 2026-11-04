import { CITIES } from "./cities";

export interface Forecast {
  current: { time: string; temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; pressure_msl: number;
    wind_speed_10m: number; wind_direction_10m: number; wind_gusts_10m: number; precipitation: number; weather_code: number; is_day: number };
  hourly: { time: string[]; temperature_2m: number[]; precipitation: number[]; weather_code: number[]; wind_gusts_10m: number[]; precipitation_probability: number[] };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[];
    wind_gusts_10m_max: number[]; precipitation_probability_max: number[]; sunrise: string[]; sunset: string[] };
}
export type MapLayer = "map" | "sat" | "rain" | "cloud" | "wind" | "temp";
export type Kind = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";

export class WeatherError extends Error {
  constructor(public reason: "rate" | "network" | "data", message: string) { super(message); this.name = "WeatherError"; }
}

const isForecast = (x: unknown): x is Forecast => {
  const f = x as Partial<Forecast> | null;
  return !!f && typeof f.current === "object" && f.current !== null && typeof f.current.temperature_2m === "number" && typeof f.current.weather_code === "number"
    && !!f.hourly && Array.isArray(f.hourly.time) && Array.isArray(f.hourly.temperature_2m) && Array.isArray(f.hourly.weather_code) && Array.isArray(f.hourly.precipitation_probability)
    && !!f.daily && Array.isArray(f.daily.time) && f.daily.time.length >= 7 && Array.isArray(f.daily.temperature_2m_max) && Array.isArray(f.daily.temperature_2m_min)
    && Array.isArray(f.daily.weather_code) && Array.isArray(f.daily.precipitation_probability_max) && Array.isArray(f.daily.sunrise) && Array.isArray(f.daily.sunset);
};

/** One Open-Meteo request for every city in CITIES. Throws WeatherError — never returns substitute data. */
export async function fetchAll(): Promise<Forecast[]> {
  const p = new URLSearchParams({
    latitude: CITIES.map((c) => c.lat).join(","), longitude: CITIES.map((c) => c.lon).join(","),
    timezone: "Africa/Casablanca", forecast_days: "14", wind_speed_unit: "kmh",
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,weather_code,is_day",
    hourly: "temperature_2m,precipitation,weather_code,wind_gusts_10m,precipitation_probability",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max,precipitation_probability_max,sunrise,sunset",
  });
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 25000);
  let r: Response;
  try { r = await fetch(`https://api.open-meteo.com/v1/forecast?${p}`, { signal: ac.signal }); }
  catch { throw new WeatherError("network", "Network error or timeout"); }
  finally { clearTimeout(timer); }
  if (r.status === 429) throw new WeatherError("rate", "Open-Meteo rate limit");
  if (!r.ok) throw new WeatherError("network", `Open-Meteo ${r.status}`);
  let j: unknown;
  try { j = await r.json(); } catch { throw new WeatherError("data", "Invalid JSON"); }
  const list: unknown[] = Array.isArray(j) ? j : [j];
  if (list.length !== CITIES.length || !list.every(isForecast)) throw new WeatherError("data", "Unexpected Open-Meteo response shape");
  return list as Forecast[];
}

export function kind(code: number): Kind {
  if (code === 0) return "clear";
  if (code <= 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "cloudy";
}

/** Index of the first hourly slot at or after the current local hour. */
export const startIdx = (f: Forecast) => Math.max(0, f.hourly.time.findIndex((t) => t >= f.current.time.slice(0, 13) + ":00"));

export const compass = (deg: number) => Math.round(deg / 45) % 8;

export type Level = "yellow" | "orange" | "red";
export interface Alert { city: number; type: "wind" | "rain" | "heat" | "storm"; level: Level; when: string }
const rank: Record<Level, number> = { yellow: 1, orange: 2, red: 3 };

export function deriveAlerts(all: Forecast[]): Alert[] {
  const out: Alert[] = [];
  all.forEach((f, city) => {
    const push = (type: Alert["type"], level: Level, when: string) => out.push({ city, type, level, when });
    for (let d = 0; d < 3; d++) {
      const g = f.daily.wind_gusts_10m_max[d], r = f.daily.precipitation_sum[d], h = f.daily.temperature_2m_max[d], day = f.daily.time[d];
      if (g >= 90) push("wind", "red", day); else if (g >= 70) push("wind", "orange", day); else if (g >= 55) push("wind", "yellow", day);
      if (r >= 60) push("rain", "red", day); else if (r >= 40) push("rain", "orange", day); else if (r >= 20) push("rain", "yellow", day);
      if (h >= 46) push("heat", "red", day); else if (h >= 43) push("heat", "orange", day); else if (h >= 40) push("heat", "yellow", day);
    }
    const s = stormHour(f);
    if (s) push("storm", "orange", s);
  });
  const seen = new Set<string>();
  return out.sort((a, b) => rank[b.level] - rank[a.level]).filter((a) => { const k = a.city + a.type; return seen.has(k) ? false : (seen.add(k), true); });
}

/** First hour with a thunderstorm weather code in the next 48 h, or null. */
export function stormHour(f: Forecast): string | null {
  const i = startIdx(f);
  for (let k = i; k < i + 48 && k < f.hourly.time.length; k++) if (f.hourly.weather_code[k] >= 95) return f.hourly.time[k];
  return null;
}
