"use client";
import dynamic from "next/dynamic";
import { T } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

const FullMap = dynamic(() => import("@/components/FullMap"), { ssr: false, loading: () => <div className="skeleton fixed inset-3" /> });

export default function MapPage() {
  const [lang, setLang] = useLang();
  return <main className="fixed inset-0"><FullMap lang={lang} t={T[lang]} onLang={setLang} /></main>;
}
