import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic" });

export const viewport: Viewport = { viewportFit: "cover", themeColor: "#050b1f", width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  title: "Morocco Weather Today",
  description: "Live weather, forecasts, radar and alerts across Morocco. Powered by Open-Meteo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${arabic.variable}`}>
      <body><div className="bg-orbs" />{children}</body>
    </html>
  );
}
