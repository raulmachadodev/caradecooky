import React, { useEffect, useState, memo } from "react";
import { Cookie, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: "cookie" | "sparkle";
  opacity: number;
}

export const AnimatedBackground = memo(() => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const count = 10; // Reduzido de 35 para 10 para ganho extremo de performance
    const newParticles: Particle[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * (45 - 20) + 20,
      duration: Math.random() * (22 - 12) + 12,
      delay: Math.random() * -20,
      type: Math.random() > 0.6 ? "cookie" : "sparkle",
      opacity: Math.random() * 0.3 + 0.4, // Opacidade levemente reduzida para ficar mais discreto
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none bg-background">
      {/* Static gradient mesh (removido blur e animação para evitar repaints no Safari) */}
      <div 
        className="absolute inset-0 opacity-40" 
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, hsl(var(--secondary) / 0.15) 0%, transparent 45%),
            radial-gradient(circle at 80% 70%, hsl(var(--accent) / 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.05) 0%, transparent 65%)
          `
        }}
      />

      {/* Itens caindo (removido drop-shadow-sm) */}
      {particles.map((p) => (
        <div
          key={p.id}
          className={cn(
            "absolute flex items-center justify-center",
            p.type === "cookie" ? "text-primary/40" : "text-secondary/60"
          )}
          style={{
            left: `${p.x}%`,
            top: `-10%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `fall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            willChange: "transform"
          }}
        >
          {p.type === "cookie" ? (
            <Cookie size={p.size} className="rotate-12" />
          ) : (
            <Sparkles size={p.size} />
          )}
        </div>
      ))}

      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0vh) translateX(0) rotate(0deg);
          }
          100% {
            transform: translateY(115vh) translateX(25px) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
});

AnimatedBackground.displayName = "AnimatedBackground";
