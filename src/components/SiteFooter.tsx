import { Heart, Phone, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer id="contato" className="mt-24 border-t border-border bg-gradient-chocolate text-primary-foreground">
      <div className="container grid gap-8 py-12 md:grid-cols-3">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-10 w-10 object-contain rounded-full shadow-glow"
            />
            <h3 className="font-logo text-xl font-medium uppercase tracking-[0.2em] animate-shine-text">
              Cara de Cooky
            </h3>
          </div>
          <p className="max-w-xs text-sm text-primary-foreground/80">
            Cookies gourmet artesanais. Cada mordida, uma experiência inesquecível.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="mb-1 font-display text-lg">Contato</h4>
          <a
            href="https://wa.me/5543988100558"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary-foreground/90 transition-colors hover:text-secondary"
          >
            <Phone className="h-4 w-4" />
            (43) 98810-0558
          </a>
          <a
            href="https://instagram.com/caradecooky"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary-foreground/90 transition-colors hover:text-secondary"
          >
            <Instagram className="h-4 w-4" />
            @caradecooky
          </a>
        </div>
        <div>
          <h4 className="mb-3 font-display text-lg">Nossa promessa</h4>
          <ul className="space-y-1 text-sm text-primary-foreground/80">
            <li>• Ingredientes selecionados e de alta qualidade</li>
            <li>• Produção artesanal, feita com amor</li>
            <li>• Sabor que marca</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-6 text-center text-xs text-primary-foreground/60">
        <div className="flex flex-col items-center gap-2">
          <span className="inline-flex items-center gap-1">
            Feito com <Heart className="h-3 w-3 fill-secondary text-secondary" /> pela Cara de Cooky
          </span>
          <p className="mt-1">
            © 2024 Cara de Cooky Gourmet® · Todos os direitos reservados.
          </p>
          <Link to="/admin" className="mt-1 text-[10px] text-primary-foreground/40 hover:text-secondary transition-colors underline">
            Painel do Administrador
          </Link>
        </div>
      </div>
    </footer>
  );
}
