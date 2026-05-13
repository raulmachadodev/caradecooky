import { CATEGORIES } from "@/data/menu";
import { CategoryCard } from "@/components/CategoryCard";
import { FeaturesStrip } from "@/components/FeaturesStrip";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { Instagram, MessageCircle, ShoppingBag } from "lucide-react";

const Index = () => {
  const { count } = useCart();
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <SiteHeader />
      <main>
        <section id="cardapio" className="container pt-8 pb-12 md:pt-12 md:pb-16">
          <header className="mx-auto mb-12 flex max-w-2xl flex-col items-center text-center">
            <div className="mb-6 flex items-center justify-center gap-6 sm:gap-12 w-full px-4">
              {/* Instagram */}
              <a 
                href="https://instagram.com/" 
                target="_blank" 
                rel="noreferrer"
                className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md hover:scale-110 transition-transform">
                  <Instagram className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">Fotos e Vídeos</span>
              </a>

              {/* Logo */}
              <div className="h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-secondary/20 bg-background p-2 shadow-soft animate-float md:h-40 md:w-40">
                <img
                  src="/logo.png"
                  alt="Logo Cara de Cooky"
                  className="h-full w-full object-contain animate-coin-spin drop-shadow-lg"
                />
              </div>

              {/* WhatsApp */}
              <a 
                href="https://wa.me/5543999999999" 
                target="_blank" 
                rel="noreferrer"
                className="flex flex-col items-center gap-2 text-muted-foreground hover:text-[#25D366] transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-glow hover:scale-110 transition-transform">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">Tirar Dúvidas</span>
              </a>
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

      {/* Floating Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none flex justify-center pb-6">
        <div className="w-full max-w-md pointer-events-auto">
          <Link
            to="/checkout"
            className={`flex items-center justify-between w-full p-4 rounded-2xl shadow-glow font-bold text-lg transition-all ${
              count > 0
                ? "bg-gradient-gold text-primary hover:brightness-110"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-90 grayscale-[0.5]"
            }`}
            onClick={(e) => count === 0 && e.preventDefault()}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Finalizar compra
            </span>
            {count > 0 && (
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                {count} {count === 1 ? "item" : "itens"}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
