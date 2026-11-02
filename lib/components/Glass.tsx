import { ReactNode } from "react";
export function Glass({ children, className = "", delay = 0, id }: { children: ReactNode; className?: string; delay?: number; id?: string }) {
  return <section id={id} className={`glass rise p-5 sm:p-6 ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</section>;
}
export const H = ({ children }: { children: ReactNode }) => <h2 className="mb-4 text-base font-semibold tracking-tight text-white/90">{children}</h2>;
