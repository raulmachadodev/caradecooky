import { CATEGORIES } from "@/data/menu";
import { CategoryCard } from "@/components/CategoryCard";
import { BrownieCard } from "@/components/BrownieCard";
import { FeaturesStrip } from "@/components/FeaturesStrip";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useCart } from "@/context/CartContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Instagram, MessageCircle, ShoppingBag } from "lucide-react";

const Index = () => {
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to Admin if launched in standalone PWA mode on an admin device
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isAdminDevice = localStorage.getItem("is_admin_device") === "true";
    if (isStandalone && isAdminDevice) {
      navigate("/admin");
    }
  }, [navigate]);

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

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
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">Acompanhe no Instagram</span>
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
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .014 5.398 0 12.037c0 2.125.556 4.2 1.611 6.062L0 24l6.105-1.603a11.803 11.803 0 005.94 1.597h.005c6.637 0 12.036-5.399 12.04-12.038a11.82 11.82 0 00-3.576-8.513"/>
                  </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">Fale conosco</span>
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
            <BrownieCard />
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
