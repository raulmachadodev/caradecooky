import { Sparkles } from "lucide-react";
import logo from "@/assets/logo-cara-de-cooky.png";
import mascote from "@/assets/mascote-cooky.png";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-warm">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, hsl(var(--secondary) / 0.15), transparent 40%), radial-gradient(circle at 80% 70%, hsl(var(--accent) / 0.12), transparent 45%)",
        }}
      />
      <div className="container relative grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary shadow-soft">
            <Sparkles className="h-3.5 w-3.5" /> Encomendas abertas
          </span>
          <img
            src={logo}
            alt="Cara de Cooky Gourmet"
            className="mt-6 h-32 w-auto mix-blend-multiply md:h-40"
          />
          <p className="mt-6 max-w-md font-display text-2xl italic text-primary/80 md:text-3xl">
            "Cada mordida, uma experiência inesquecível."
          </p>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Cookies artesanais, recheios cremosos e ingredientes selecionados. Escolha sua categoria,
            o sabor favorito e finalize seu pedido em poucos cliques.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#cardapio"
              className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-chocolate px-8 text-sm font-semibold text-primary-foreground shadow-warm transition-transform hover:scale-105"
            >
              Ver cardápio
            </a>
            <a
              href="https://wa.me/5543988100558"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-full border-2 border-primary/20 bg-card px-8 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
        <div className="relative flex justify-center">
          <div
            className="absolute inset-0 -z-10 mx-auto h-72 w-72 rounded-full blur-3xl md:h-96 md:w-96"
            style={{ background: "radial-gradient(circle, hsl(var(--secondary) / 0.45), transparent 70%)" }}
          />
          <img
            src={mascote}
            alt="Mascote Cooky, cookie sorridente"
            className="h-72 w-72 animate-float drop-shadow-2xl md:h-96 md:w-96"
          />
        </div>
      </div>
    </section>
  );
}
