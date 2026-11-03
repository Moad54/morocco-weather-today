# Morocco Weather Today — طقس المغرب اليوم

Next.js 14 · React 18 · TypeScript · Tailwind CSS · Lucide · Open-Meteo (no API key).

## Run locally
    npm install
    npm run dev        # http://localhost:3000

## Production
    npm run build && npm start

## Deploy (recommended: Vercel)
1. Push this folder to a GitHub repo.
2. vercel.com → Add New Project → import the repo → Deploy (no env vars, no settings to change).
Netlify / Cloudflare Pages / any Node 18+ host also work (`npm run build`, then `npm start`).

## Structure
    app/         layout, page, global styles, icon
    components/Dock.tsx  floating bottom navigation (Liquid Glass)
    components/  Header, CurrentCard, HourlyCard, DailyCard, MetricsGrid, ThunderCard, AlertsCard, Overview, WeatherMap, Glass, WeatherIcon
    lib/         cities.ts, i18n.ts (EN/AR), weather.ts (Open-Meteo + alert logic)

All 14 cities load in one Open-Meteo request, refreshed every 10 minutes. No data is mocked.
Alerts are derived from forecast thresholds, not official warnings (see marocmeteo.ma).
Sunrise/sunset card (SunCard) and weather-themed backgrounds come from the same Open-Meteo data.
Map layers: map, satellite, precipitation, clouds, wind, temperature (wind/temperature use live Open-Meteo city values).
Map: CARTO dark tiles, Esri satellite, RainViewer radar/cloud overlays.

## Troubleshooting Vercel
- Build error mentioning `lib/components/app/page.tsx`: that is a stray copy of page.tsx inside your repo (the real one is `app/page.tsx`).
  Delete the `lib/components/` folder on GitHub (press `t` in the repo and search `page.tsx` to find every copy).
- Vercel → Settings → General → Root Directory must be empty (or the folder that contains `package.json`).
- Redeploy without the build cache.
