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
    components/  Header, CurrentCard, HourlyCard, DailyCard, MetricsGrid, ThunderCard, AlertsCard, Overview, WeatherMap, Glass, WeatherIcon
    lib/         cities.ts, i18n.ts (EN/AR), weather.ts (Open-Meteo + alert logic)

All 14 cities load in one Open-Meteo request, refreshed every 10 minutes. No data is mocked.
Alerts are derived from forecast thresholds, not official warnings (see marocmeteo.ma).
Map: CARTO dark tiles, Esri satellite, RainViewer radar/cloud overlays.
