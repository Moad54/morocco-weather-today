// Runs before `next build`. Fails with a clear message if project files are missing,
// and warns about stray page/layout files that TypeScript would still type-check.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const required = [
  "app/page.tsx", "app/layout.tsx", "app/globals.css",
  "lib/cities.ts", "lib/i18n.ts", "lib/weather.ts",
  ...["Glass", "WeatherIcon", "Header", "CurrentCard", "HourlyCard", "DailyCard", "MetricsGrid", "ThunderCard", "AlertsCard", "Overview", "WeatherMap", "Dock", "SunCard"].map((n) => `components/${n}.tsx`),
  "components/FullMap.tsx", "components/LocationPanel.tsx", "lib/windField.ts", "lib/windParticles.ts", "lib/useLang.ts", "app/map/page.tsx", "app/api/wind/route.ts",
  "tsconfig.json", "tailwind.config.ts", "postcss.config.mjs", "next.config.mjs",
];
const missing = required.filter((f) => !existsSync(f));
if (missing.length) {
  console.error("\n[check-structure] Missing project files:\n  - " + missing.join("\n  - ") + "\nUpload the complete project (see README) and redeploy.\n");
  process.exit(1);
}

const skip = new Set(["node_modules", ".next", ".git", ".vercel"]);
const stray = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const p = join(dir, e.name).replace(/\\/g, "/");
    if (e.isDirectory()) walk(p);
    else if (/^(page|layout)\.tsx$/.test(e.name) && !p.startsWith("app/")) stray.push(p);
  }
})(".");
if (stray.length) console.warn("\n[check-structure] WARNING: stray copies found (delete them from your repo): " + stray.join(", ") + "\n");
console.log("[check-structure] OK");
