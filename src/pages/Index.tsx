import { CATEGORIES } from "@/data/menu";
import { CategoryCard } from "@/components/CategoryCard";
import { FeaturesStrip } from "@/components/FeaturesStrip";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnimatedBackground } from "@/components/AnimatedBackground";

const Index = () => {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <SiteHeader />
      <main>
        <section id="cardapio" className="container pt-8 pb-12 md:pt-12 md:pb-16">
          <header className="mx-auto mb-12 flex max-w-2xl flex-col items-center text-center">
            <div className="mb-6 h-32 w-32 overflow-hidden rounded-full border-4 border-secondary/20 bg-background p-2 shadow-soft animate-float md:h-40 md:w-40">
              <img
                src="/logo.png"
                alt="Logo Cara de Cooky"
                className="h-full w-full object-contain animate-coin-spin drop-shadow-lg"
              />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Nosso cardápio
            </span>
            <h2 className="mt-3 font-display text-4xl text-primary md:text-5xl">
              Escolha o seu favorito
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sabores inesquecíveis, diversos tamanhos. O toque gourmet que faltava no seu dia.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.slug} category={cat} />
            ))}
          </div>
        </section>

        <FeaturesStrip />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
