"use client";
import dynamic from "next/dynamic";
import { MapBoundary } from "@/components/MapBoundary";
import { T } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import { useTheme } from "@/lib/useTheme";

const FullMap = dynamic(() => import("@/components/FullMap"), { ssr: false, loading: () => <div className="skeleton fixed inset-3" /> });

export default function MapPage() {
  const [lang, setLang] = useLang();
  useTheme(); // applies the saved light/dark theme to this route as well
  return <main className="fixed inset-0"><MapBoundary t={T[lang]}><FullMap lang={lang} t={T[lang]} onLang={setLang} /></MapBoundary></main>;
}
