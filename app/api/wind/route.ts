// Server-side cached wind grid over Morocco (Open-Meteo). One upstream request per 30 min is shared by all visitors.
// Rendered per request (never at build time, so a build never depends on Open-Meteo being reachable). The upstream response is held in
// Next's data cache for 30 min, and successful responses are also cacheable by the Vercel CDN for the same period.
export const dynamic = "force-dynamic";

const G = { lat0: 27, lat1: 36, lon0: -14, lon1: -1, nLat: 7, nLon: 9 };

export async function GET() {
  const lats: string[] = [], lons: string[] = [];
  for (let r = 0; r < G.nLat; r++)
    for (let c = 0; c < G.nLon; c++) {
      lats.push((G.lat1 - ((G.lat1 - G.lat0) * r) / (G.nLat - 1)).toFixed(3));
      lons.push((G.lon0 + ((G.lon1 - G.lon0) * c) / (G.nLon - 1)).toFixed(3));
    }
  const p = new URLSearchParams({ latitude: lats.join(","), longitude: lons.join(","), current: "wind_speed_10m,wind_direction_10m", wind_speed_unit: "ms", timezone: "Africa/Casablanca" });
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?${p}`, { next: { revalidate: 1800 } });
    if (!r.ok) throw new Error("upstream");
    const j = await r.json();
    const a: { current: { time: string; wind_speed_10m: number; wind_direction_10m: number } }[] = Array.isArray(j) ? j : [j];
    if (a.length !== lats.length) throw new Error("shape");
    return Response.json({ ...G, time: a[0].current.time, speed: a.map((x) => x.current.wind_speed_10m), dir: a.map((x) => x.current.wind_direction_10m) },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
  } catch {
    return Response.json({ error: "upstream" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
