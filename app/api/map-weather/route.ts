// Cached, keyless Open-Meteo grid for visual weather overlays over Morocco.
export const dynamic = "force-dynamic";

const G = { lat0: 27, lat1: 36, lon0: -14, lon1: -1, nLat: 9, nLon: 11 };
const VARIABLES = "temperature_2m,precipitation,cloud_cover,relative_humidity_2m,pressure_msl,snowfall,wind_speed_10m,visibility";

export async function GET() {
  const latitude: string[] = [], longitude: string[] = [];
  for (let r = 0; r < G.nLat; r++) for (let c = 0; c < G.nLon; c++) {
    latitude.push((G.lat1 - ((G.lat1 - G.lat0) * r) / (G.nLat - 1)).toFixed(3));
    longitude.push((G.lon0 + ((G.lon1 - G.lon0) * c) / (G.nLon - 1)).toFixed(3));
  }
  const params = new URLSearchParams({
    latitude: latitude.join(","), longitude: longitude.join(","),
    current: VARIABLES, timezone: "Africa/Casablanca", wind_speed_unit: "kmh",
  });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { next: { revalidate: 1800 } });
    if (!response.ok) throw new Error("upstream");
    const json: unknown = await response.json();
    const rows = Array.isArray(json) ? json : [json];
    if (rows.length !== latitude.length || !rows.every((row: any) =>
      row?.current && typeof row.current.temperature_2m === "number" &&
      typeof row.current.precipitation === "number" && typeof row.current.cloud_cover === "number")) {
      throw new Error("shape");
    }
    const points = rows.map((row: any, i: number) => ({
      lat: Number(latitude[i]), lon: Number(longitude[i]), ...row.current,
    }));
    return Response.json({ ...G, points, updated: rows[0].current.time }, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch {
    return Response.json({ error: "weather-grid-unavailable" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
