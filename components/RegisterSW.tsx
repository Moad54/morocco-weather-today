"use client";
import { useEffect } from "react";

/** Registers /sw.js in production only (a service worker in `next dev` would cache stale dev bundles). Failures are ignored: the app works without it. */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const register = () => { navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => { /* unsupported or blocked */ }); };
    if (document.readyState === "complete") register();
    else { window.addEventListener("load", register, { once: true }); return () => window.removeEventListener("load", register); }
  }, []);
  return null;
}
