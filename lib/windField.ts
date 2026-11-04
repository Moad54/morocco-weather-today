export interface WindGrid { time: string; nLat: number; nLon: number; lat0: number; lat1: number; lon0: number; lon1: number; speed: number[]; dir: number[] }
export interface Field { grid: WindGrid; u: Float32Array; v: Float32Array }

/** Convert meteorological wind (speed m/s, direction it blows FROM) to east/north components. */
export function toField(g: WindGrid): Field {
  const u = new Float32Array(g.speed.length), v = new Float32Array(g.speed.length);
  g.speed.forEach((s, i) => { const r = (g.dir[i] * Math.PI) / 180; u[i] = -s * Math.sin(r); v[i] = -s * Math.cos(r); });
  return { grid: g, u, v };
}

/** Bilinear interpolation of the real grid; null outside the covered area. Rows run north to south. */
export function sample(f: Field, lat: number, lon: number): [number, number] | null {
  const g = f.grid;
  const y = ((g.lat1 - lat) / (g.lat1 - g.lat0)) * (g.nLat - 1), x = ((lon - g.lon0) / (g.lon1 - g.lon0)) * (g.nLon - 1);
  if (x < 0 || y < 0 || x > g.nLon - 1 || y > g.nLat - 1) return null;
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(x0 + 1, g.nLon - 1), y1 = Math.min(y0 + 1, g.nLat - 1), fx = x - x0, fy = y - y0;
  const mix = (a: Float32Array) =>
    (a[y0 * g.nLon + x0] * (1 - fx) + a[y0 * g.nLon + x1] * fx) * (1 - fy) + (a[y1 * g.nLon + x0] * (1 - fx) + a[y1 * g.nLon + x1] * fx) * fy;
  return [mix(f.u), mix(f.v)];
}
