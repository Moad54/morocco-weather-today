// Keyless Open-Meteo Marine grid. Ocean-only cells may be missing near the coast.
export const dynamic = "force-dynamic";
const G = { lat0: 27, lat1: 36, lon0: -14, lon1: -1, nLat: 7, nLon: 9 };
export async function GET() {
  const latitude: string[] = [], longitude: string[] = [];
  for (let r = 0; r < G.nLat; r++) for (let c = 0; c < G.nLon; c++) {
    latitude.push((G.lat1 - ((G.lat1 - G.lat0) * r) / (G.nLat - 1)).toFixed(3));
    longitude.push((G.lon0 + ((G.lon1 - G.lon0) * c) / (G.nLon - 1)).toFixed(3));
  }
  const p = new URLSearchParams({ latitude: latitude.join(","), longitude: longitude.join(","), current: "wave_height,wave_direction,wave_period", timezone: "Africa/Casablanca" });
  try {
    const r = await fetch(`https://marine-api.open-meteo.com/v1/marine?${p}`, { next: { revalidate: 3600 } });
    if (!r.ok) throw new Error("upstream");
    const raw: any = await r.json(); const rows = Array.isArray(raw) ? raw : [raw];
    if (rows.length !== latitude.length) throw new Error("shape");
    const points = rows.map((x: any, i: number) => ({ lat: Number(latitude[i]), lon: Number(longitude[i]), ...(x.current ?? {}) }));
    return Response.json({ points, updated: rows[0]?.current?.time ?? null }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } });
  } catch { return Response.json({ error: "marine-unavailable" }, { status: 502, headers: { "Cache-Control": "no-store" } }); }
}
