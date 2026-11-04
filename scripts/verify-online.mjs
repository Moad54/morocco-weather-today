// Run on a machine WITH internet:  npm run verify:online
// Checks every external service the app depends on, using the same URLs and response-shape rules as the app.
const T = 15000;
const get = async (url) => { const r = await fetch(url, { signal: AbortSignal.timeout(T) }); return r; };
let failed = 0;
const check = async (name, fn) => { try { const msg = await fn(); console.log(`PASS  ${name}${msg ? " — " + msg : ""}`); } catch (e) { failed++; console.log(`FAIL  ${name} — ${e.message}`); } };

const cities = [[33.5731, -7.5898], [34.0209, -6.8416], [35.7595, -5.834]];
await check("Open-Meteo forecast (multi-location, fields used by lib/weather.ts)", async () => {
  const p = new URLSearchParams({ latitude: cities.map((c) => c[0]).join(","), longitude: cities.map((c) => c[1]).join(","), timezone: "Africa/Casablanca", forecast_days: "14", wind_speed_unit: "kmh",
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,weather_code,is_day",
    hourly: "temperature_2m,precipitation,weather_code,wind_gusts_10m,precipitation_probability",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max,precipitation_probability_max,sunrise,sunset" });
  const r = await get(`https://api.open-meteo.com/v1/forecast?${p}`); if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json(); if (!Array.isArray(j) || j.length !== cities.length) throw new Error("expected an array with one entry per location");
  for (const f of j) { if (typeof f.current?.temperature_2m !== "number" || f.daily?.time?.length < 7 || !Array.isArray(f.hourly?.precipitation_probability)) throw new Error("unexpected shape"); }
  return `${j.length} locations, ${j[0].daily.time.length} days`;
});
await check("Open-Meteo wind grid (same query as app/api/wind/route.ts)", async () => {
  const lats = [], lons = []; for (let r = 0; r < 7; r++) for (let c = 0; c < 9; c++) { lats.push((36 - (9 * r) / 6).toFixed(3)); lons.push((-14 + (13 * c) / 8).toFixed(3)); }
  const p = new URLSearchParams({ latitude: lats.join(","), longitude: lons.join(","), current: "wind_speed_10m,wind_direction_10m", wind_speed_unit: "ms", timezone: "Africa/Casablanca" });
  const r = await get(`https://api.open-meteo.com/v1/forecast?${p}`); if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json(); const a = Array.isArray(j) ? j : [j]; if (a.length !== 63) throw new Error(`expected 63 points, got ${a.length}`); return "63 grid points";
});
await check("Open-Meteo geocoding (full-map search)", async () => {
  const r = await get("https://geocoding-api.open-meteo.com/v1/search?name=rabat&count=3&language=fr&countryCode=MA&format=json"); if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json(); if (!j.results?.length) throw new Error("no results"); return j.results[0].name;
});
await check("RainViewer frame index", async () => {
  const r = await get("https://api.rainviewer.com/public/weather-maps.json"); if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json(); if (!String(j.host).startsWith("https://")) throw new Error("no host"); const n = j.radar?.past?.length ?? 0; if (!n) throw new Error("no radar frames");
  const sat = j.satellite?.infrared?.length ?? 0; return `${n} radar frames; satellite frames: ${sat} (0 = Clouds layer shows its notice)`;
});
for (const [name, url] of [["CARTO dark tile", "https://a.basemaps.cartocdn.com/dark_all/5/15/12.png"], ["OpenStreetMap tile", "https://tile.openstreetmap.org/5/15/12.png"], ["Esri imagery tile", "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/12/15"]])
  await check(name, async () => { const r = await get(url); if (!r.ok) throw new Error("HTTP " + r.status); if (!(r.headers.get("content-type") || "").startsWith("image/")) throw new Error("not an image"); return "image OK"; });
console.log(failed ? `\n${failed} check(s) failed` : "\nAll external services reachable and in the expected shape");
process.exit(failed ? 1 : 0);
