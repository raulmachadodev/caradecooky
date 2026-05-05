import { useRef, MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
}

/**
 * Card com efeito spotlight que segue o mouse — herdado do projeto CBLOW.
 * Define as variáveis CSS --mouse-x / --mouse-y consumidas em index.css.
 */
export function SpotlightCard({ children, className, as: Tag = "div" }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      onMouseMove={handleMouseMove}
      className={cn(
        "spotlight-card group relative rounded-2xl border border-border bg-gradient-card p-6 shadow-soft hover-lift",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
