import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-secondary/30 bg-secondary/10 backdrop-blur-md supports-[backdrop-filter]:bg-secondary/5 shadow-sm">
      <div className="container flex h-16 items-center gap-4">
        {/* Lado Esquerdo: Logo */}
        <div className="flex flex-1 items-center justify-start">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-10 w-10 object-contain drop-shadow-md"
            />
            <span className="font-logo text-base sm:text-lg font-medium uppercase tracking-[0.2em] animate-shine-text whitespace-nowrap">
              Cara de Cooky
            </span>
          </Link>
        </div>
 
        {/* Centro: Links */}
        <nav className="hidden items-center gap-8 text-sm font-bold uppercase tracking-widest md:flex">
          <Link to="/#cardapio" className="text-muted-foreground transition-colors hover:text-secondary">
            Cardápio
          </Link>
          <Link to="/#sobre" className="text-muted-foreground transition-colors hover:text-secondary">
            Sobre
          </Link>
          <Link to="/#contato" className="text-muted-foreground transition-colors hover:text-secondary">
            Contato
          </Link>
        </nav>
 
        {/* Lado Direito: Botão Pedido */}
        <div className="flex flex-1 items-center justify-end">
          <Button asChild className="relative gap-2 bg-gradient-gold text-primary hover:brightness-110 border-0 shadow-glow font-bold">
            <Link to="/checkout" aria-label={`Carrinho com ${count} ${count === 1 ? "item" : "itens"}`}>
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Pedido</span>
              {count > 0 && (
                <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
