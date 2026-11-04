# Morocco Weather Today — طقس المغرب اليوم — Météo Maroc Aujourd'hui

Next.js 14 · React 18 · TypeScript (strict) · Tailwind CSS · Leaflet · Lucide · Open-Meteo (no API key).

> **Verification status — please read.** This build was prepared in an environment whose network policy **blocked the npm registry (HTTP 403)**.
> `npm install`, `npm run build`, `next dev` and `tsc` against the real dependencies were therefore **NOT executed**.
> What *was* done: (1) `tsc --strict` over all project files with stand-in declarations for react/next/leaflet/lucide (0 errors; JSX attribute names are not checked by the stand-ins);
> (2) the real `app/page.tsx` bundled with esbuild (all imports resolve) and rendered in Chromium with mocked Open-Meteo data at 320, 360, 390 (RTL), 768, 1024 and 1440 px — no horizontal overflow; Leaflet and Lucide were stubbed there, so the map and icons were not visually verified;
> (3) `public/sw.js` tested in Chromium (precache, control, offline fallback); (4) `scripts/check-structure.mjs` passes.
> Run the steps below first and send back any build error.

> Full test report (what was and was not verified): see `VERIFICATION-REPORT.md`. Run `npm run verify:online` on a machine with internet to check every external API.

## Run locally (Node 18.17+; `.nvmrc` pins 20)
    npm install
    npm run typecheck     # tsc --noEmit
    npm run build         # runs scripts/check-structure.mjs first, then next build
    npm run dev           # http://localhost:3000   (or: npm start after build)

If the build prints type errors, send them back — they are most likely small prop/typing issues that could not be caught offline.

## Put it on GitHub
    git init
    git add .
    git commit -m "Complete Morocco Weather Today redesign"
    git branch -M main
    git remote add origin YOUR_GITHUB_REPOSITORY_URL
    git push -u origin main

## Deploy on Vercel
1. vercel.com → Add New → Project → import the GitHub repo.
2. Framework preset: Next.js (auto-detected). Install command `npm install`, build command `npm run build`, output directory default. Root Directory empty.
3. No environment variables are needed (Open-Meteo, RainViewer, CARTO and Esri tiles are keyless).
4. Deploy. `app/api/wind/route.ts` runs as a serverless route and caches the upstream call for 30 minutes.

## v2.1 additions
- **PWA:** `public/manifest.webmanifest`, icons in `public/icons/` (192, 512, maskable 512, apple-touch 180, favicon), `public/sw.js` (app shell + static assets only; weather data, tiles and `/api/*` are never cached), `public/offline.html` (EN/FR/AR), `components/RegisterSW.tsx` (production only), cache headers in `next.config.mjs`.
- **Map resilience:** base-map fallback chain (CARTO → OpenStreetMap; Esri → CARTO → OSM), notices on tile/overlay failure, RainViewer fetch timeout + validation + retry, `MapBoundary` error boundary, wind-API timeout/shape check, place-search error message.
- **RainViewer:** it discontinued satellite/infrared data on 1 Jan 2026, so the *Clouds* layer shows a notice unless the API advertises frames again.
- **Layout fixes:** grid blowout that caused horizontal scrolling on phones, cities list overflowing below `xl`, header controls and 14-day rows at 320–360 px.
- `next/font/google` downloads fonts at build time, so the build needs internet access (Vercel has it).

## What changed in v2.0
**New:** `components/WeeklyForecast.tsx`, `RainChanceChart.tsx`, `CitiesPanel.tsx`, `LangSwitch.tsx`, `lib/format.ts`, `lib/useTheme.ts`.
**Rewritten:** `components/Header.tsx`, `components/WeatherMap.tsx`, `app/page.tsx`, `app/map/page.tsx`, `lib/cities.ts`, `lib/i18n.ts`, `lib/useLang.ts`.
**Edited:** `lib/weather.ts` (validation + typed errors; same Open-Meteo request), `app/globals.css` (new theme layer appended), `app/layout.tsx`, `components/FullMap.tsx`, `CurrentCard`, `ThunderCard`, `AlertsCard`, `DailyCard`, `HourlyCard`, `LocationPanel`, `WeatherIcon`, `scripts/check-structure.mjs`, `package.json` (+`typecheck` script), `README.md`.
**Removed:** `components/Overview.tsx` — superseded by the Moroccan cities panel.
**Untouched:** `app/api/wind/route.ts`, `lib/windField.ts`, `lib/windParticles.ts`, `Dock`, `SunCard`, `MetricsGrid`, `Glass`, `/map` route.

## Features
- Dark near-black dashboard shell, rounded navigation bar, light-blue highlighted current day (follows the supplied reference layout).
- Navigation: logo, selected-city location pill, autocomplete search (English/French/Arabic names, accent-insensitive, arrow-key navigation), notification bell (real derived alerts), light/dark switch, EN/FR/AR selector, full-screen map link.
- Seven-day horizontal forecast: day, icon, max, min, precipitation probability; today card adds feels-like, wind, pressure, humidity, sunrise, sunset. Tabs: Today / Tomorrow / Next 7 days.
- Rain chart: hourly precipitation probability for the chosen day, or daily maximum for the week; hover/tap tooltips (probability + mm).
- Map: Leaflet, dark tiles, Morocco-centred; weather-condition markers with temperature, popups, layers (map, satellite, precipitation, clouds, wind, temperature). Existing `/map` full-screen wind-particle map unchanged.
- 21 cities (all those requested, plus Essaouira and Taroudant) loaded in one Open-Meteo request; selecting one updates the whole dashboard.
- Existing 14-day list, hourly strip, atmosphere metrics, sunrise/sunset, thunderstorm tracker and alerts are kept below the new top section.
- English, French, Arabic (RTL); preference saved in localStorage; switching does not reload.
- Errors: loading skeletons, retry, rate-limit (429) message, invalid-response message, "last data shown" banner on a failed refresh, auto-retry when the browser comes back online. No fabricated data: missing values render as "–".

## Known limitations
- Everything above is **untested** at runtime (see status).
- The reference's "Air quality" toggle and avatar are not implemented (no air-quality data source in the project).
- The reference's "Explore global map / Get started" overlay card is not included.
- Light theme is a best-effort remap of the original white-alpha utility classes; expect small contrast issues until it has been checked in a browser. Map tiles stay dark in both themes.
- Weather icons are Lucide line icons, not the 3-D icons of the reference. Map markers use emoji.
- Alerts are derived from forecast thresholds, not official warnings (see marocmeteo.ma).
- The 21-location, 14-day request is large; Open-Meteo's free tier may rate-limit heavy use (the UI shows a message if it does).
