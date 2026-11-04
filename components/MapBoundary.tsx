"use client";
import { Component, ReactNode } from "react";
import { MapPinOff, RefreshCw } from "lucide-react";
import { Dict } from "@/lib/i18n";
import { Glass } from "./Glass";

interface Props { t: Dict; children: ReactNode }
interface State { failed: boolean }

/** Keeps a map crash (Leaflet error, failed chunk load) from taking down the whole dashboard. */
export class MapBoundary extends Component<Props, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error("[map]", error); }
  render() {
    if (!this.state.failed) return this.props.children;
    const { t } = this.props;
    return (
      <Glass id="map" className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center">
        <MapPinOff size={32} className="text-orange-300" />
        <p className="max-w-sm text-sm text-white/70" role="alert">{t.mapFail}</p>
        <button type="button" onClick={() => this.setState({ failed: false })} className="chip inline-flex items-center gap-2 px-5 py-2 text-sm"><RefreshCw size={14} />{t.retry}</button>
      </Glass>
    );
  }
}
