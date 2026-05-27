import { Plus, Cookie, Package, Cake } from "lucide-react";
import { useState } from "react";
import { Category, FLAVORS, formatBRL, calcUnitPrice } from "@/data/menu";
import { SpotlightCard } from "@/components/SpotlightCard";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "bola-cookie": Cookie,
  "marmita-200g": Package,
  "marmita-500g": Package,
  "torta-cookie": Cake,
};

interface Props {
  category: Category;
}

export function CategoryCard({ category }: Props) {
  const Icon = ICONS[category.slug] ?? Cookie;
  const { add, items } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>(
    category.pricing === "per_kg" ? category.sizes![0].label : category.size!,
  );

  const currentGrams =
    category.pricing === "per_kg"
      ? category.sizes!.find((s) => s.label === selectedSize)?.grams
      : undefined;

  const handleAdd = (flavorKey: typeof FLAVORS[number]["key"], flavorName: string, premium: boolean) => {
    add({
      category,
      flavor: flavorKey,
      flavorName,
      premium,
      size: category.pricing === "per_kg" ? selectedSize : category.size!,
      grams: currentGrams,
    });
    toast.success("Adicionado ao pedido!", {
      description: `${category.name} de ${flavorName}${
        category.pricing === "per_kg" ? ` (${selectedSize})` : ""
      }`,
    });
  };

  return (
    <SpotlightCard className="flex flex-col">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold text-primary shadow-soft">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display text-2xl text-primary">{category.name}</h3>
          {category.pricing === "fixed" && (
            <p className="text-xs font-medium uppercase tracking-wider text-accent">{category.size}</p>
          )}
        </div>
      </div>

      <p className="mb-5 text-sm text-muted-foreground">{category.tagline}</p>

      {category.pricing === "per_kg" && category.sizes && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tamanho
          </p>
          <div className="flex flex-wrap gap-2">
            {category.sizes.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setSelectedSize(s.label)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
                  selectedSize === s.label
                    ? "border-primary bg-primary text-primary-foreground shadow-soft"
                    : "border-border bg-card text-foreground hover:border-primary/50",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {(() => {
          const listItems = FLAVORS.filter((f) => {
            const price = category.prices[f.key];
            return price !== undefined && price > 0;
          }).map((f) => {
            const price = calcUnitPrice(category, f.key, currentGrams);
            const isSoldOut = category.unavailableFlavors?.includes(f.key) ?? false;
            return {
              key: f.key,
              name: f.name,
              description: undefined as string | undefined,
              price,
              premium: !!f.premium,
              isSoldOut,
              onAdd: () => handleAdd(f.key, f.name, !!f.premium),
              isPerKg: category.pricing === "per_kg",
              basePrice: category.prices[f.key]
            };
          });

          if (category.slug === "bola-cookie") {
            const brownieInCart = items
              .filter((i) => i.categoryName === "Brownie Meio Amargo")
              .reduce((acc, i) => acc + i.quantity, 0);
            const remaining = Math.max(0, 3 - brownieInCart);
            const brownieSoldOut = remaining === 0;

            listItems.push(
              {
                key: "brownie-sem-cobertura",
                name: "Brownie Sem Cobertura",
                description: "Brownie puro meio amargo — intenso e direto ao ponto.",
                price: 12.00,
                premium: false,
                isSoldOut: brownieSoldOut,
                onAdd: () => {
                  add({
                    category: {
                      slug: "brownie",
                      name: "Brownie Meio Amargo",
                      tagline: "Brownie artesanal meio amargo.",
                      pricing: "fixed",
                      size: "Unidade",
                      prices: { nutella: 12.00, rafaello: 12.00, pistache: 12.00, cappuccino: 12.00, kinder: 12.00, moca_brigadeiro: 0, buenotella: 0 },
                    },
                    flavor: "nutella",
                    flavorName: "Sem Cobertura",
                    premium: false,
                    size: "Unidade",
                  });
                  toast.success("Brownie adicionado! 🍫", {
                    description: "Sem Cobertura",
                  });
                },
                isPerKg: false,
                basePrice: 0
              },
              {
                key: "brownie-com-cobertura",
                name: "Brownie Com Cobertura",
                description: "Com cobertura à sua escolha (a combinar).",
                price: 12.00,
                premium: false,
                isSoldOut: brownieSoldOut,
                onAdd: () => {
                  add({
                    category: {
                      slug: "brownie",
                      name: "Brownie Meio Amargo",
                      tagline: "Brownie artesanal meio amargo.",
                      pricing: "fixed",
                      size: "Unidade",
                      prices: { nutella: 12.00, rafaello: 12.00, pistache: 12.00, cappuccino: 12.00, kinder: 12.00, moca_brigadeiro: 0, buenotella: 0 },
                    },
                    flavor: "nutella",
                    flavorName: "Com Cobertura",
                    premium: false,
                    size: "Unidade",
                  });
                  toast.success("Brownie adicionado! 🍫", {
                    description: "Com Cobertura — a combinar via WhatsApp",
                  });
                },
                isPerKg: false,
                basePrice: 0
              }
            );
          }

          const sortedItems = [...listItems].sort((a, b) => {
            if (a.isSoldOut && !b.isSoldOut) return 1;
            if (!a.isSoldOut && b.isSoldOut) return -1;
            return 0;
          });

          return sortedItems.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 transition-colors hover:bg-muted"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {item.name}
                  {item.premium && (
                    <span className="ml-2 rounded-full bg-secondary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                      Premium
                    </span>
                  )}
                </span>
                {item.description && (
                  <span className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                    {item.description}
                  </span>
                )}
                <span className="text-sm font-bold text-primary mt-0.5">
                  {formatBRL(item.price)}
                  {item.isPerKg && (
                    <span className="ml-1 text-[10px] font-medium uppercase text-muted-foreground">
                      ({formatBRL(item.basePrice)}/kg)
                    </span>
                  )}
                </span>
                {item.isSoldOut && (
                  <span className="mt-0.5 text-[10px] font-medium italic text-muted-foreground">
                    Esgotado ou indisponível
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={item.isSoldOut}
                onClick={item.onAdd}
                className={cn(
                  "h-8 shrink-0 gap-1.5 rounded-full px-4 font-semibold transition-colors",
                  item.isSoldOut
                    ? "bg-muted text-muted-foreground cursor-not-allowed opacity-90 grayscale-[0.5] hover:bg-muted hover:text-muted-foreground"
                    : "text-primary hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </li>
          ));
        })()}
      </ul>
    </SpotlightCard>
  );
}
