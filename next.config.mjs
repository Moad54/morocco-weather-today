/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      // The service worker must always be revalidated so updates roll out; it may control the whole origin.
      { source: "/sw.js", headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Service-Worker-Allowed", value: "/" },
      ] },
      { source: "/manifest.webmanifest", headers: [
        { key: "Content-Type", value: "application/manifest+json; charset=utf-8" },
        { key: "Cache-Control", value: "public, max-age=3600" },
      ] },
    ];
  },
};
export default nextConfig;
