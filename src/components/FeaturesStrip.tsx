import { Award, ChefHat, Heart } from "lucide-react";
import { SpotlightCard } from "./SpotlightCard";

const items = [
  {
    icon: Award,
    title: "Ingredientes selecionados",
    text: "Só usamos matéria-prima de alta qualidade — sem atalhos no sabor.",
  },
  {
    icon: ChefHat,
    title: "Produção artesanal",
    text: "Cada cookie é assado com cuidado, em pequenos lotes, no nosso ritmo.",
  },
  {
    icon: Heart,
    title: "Feito com amor",
    text: "A receita da casa tem um ingrediente extra: carinho em cada mordida.",
  },
];

export function FeaturesStrip() {
  return (
    <section id="sobre" className="container py-16">
      <div className="grid gap-6 md:grid-cols-3">
          <SpotlightCard
            key={item.title}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-gold text-primary shadow-glow">
              <item.icon className="h-7 w-7" />
            </div>
            <h3 className="mb-2 font-display text-xl text-primary">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.text}</p>
          </SpotlightCard>
      </div>
    </section>
  );
}
