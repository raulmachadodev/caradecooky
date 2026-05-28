import { Plus, Cookie, Package, Cake, Flame } from "lucide-react";
import { useState } from "react";
import { Category, FLAVORS, formatBRL, calcUnitPrice } from "@/data/menu";
import { SpotlightCard } from "@/components/SpotlightCard";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STOCK_LIMIT = 3;
const BROWNIE_PRICE = 12.0;

const BROWNIE_OPTIONS = [
  {
    id: "sem-cobertura",
    label: "Sem Cobertura",
    description: "Brownie puro meio amargo — intenso e direto ao ponto.",
    priceLabel: "R$ 12,00",
  },
  {
    id: "com-cobertura",
    label: "Com Cobertura",
    description: "Brownie meio amargo com cobertura à sua escolha.",
    priceLabel: "A combinar",
  },
];

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
  const [selectedBrownie, setSelectedBrownie] = useState("sem-cobertura");

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

  // Brownie state (only used in bola-cookie card)
  const brownieInCart = items
    .filter((i) => i.categoryName === "Brownie Meio Amargo")
    .reduce((acc, i) => acc + i.quantity, 0);
  const brownieOutOfStock = brownieInCart >= STOCK_LIMIT;

  const handleAddBrownie = () => {
    if (brownieOutOfStock) {
      toast.error("Estoque esgotado!", {
        description: "Só temos 3 unidades disponíveis e você já as adicionou ao carrinho.",
      });
      return;
    }
    const option = BROWNIE_OPTIONS.find((o) => o.id === selectedBrownie)!;
    add({
      category: {
        slug: "brownie",
        name: "Brownie Meio Amargo",
        tagline: "Brownie artesanal meio amargo.",
        pricing: "fixed",
        size: "Unidade",
        prices: { nutella: BROWNIE_PRICE, rafaello: BROWNIE_PRICE, pistache: BROWNIE_PRICE, cappuccino: BROWNIE_PRICE, kinder: BROWNIE_PRICE, moca_brigadeiro: 0, buenotella: 0 },
      },
      flavor: "nutella",
      flavorName: option.label,
      premium: false,
      size: "Unidade",
      grams: undefined,
    });
    toast.success("Brownie adicionado! 🍫", {
      description: `${option.label}${option.id === "com-cobertura" ? " — cobertura a combinar via WhatsApp" : ""}`,
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

      {/* Cookie flavor list */}
      <ul className="space-y-2">
        {[...FLAVORS.filter((f) => {
          const price = category.prices[f.key];
          return price !== undefined && price > 0;
        }).map((f) => ({
          f,
          price: calcUnitPrice(category, f.key, currentGrams),
          isSoldOut: category.unavailableFlavors?.includes(f.key) ?? false,
        }))].sort((a, b) => {
          if (a.isSoldOut && !b.isSoldOut) return 1;
          if (!a.isSoldOut && b.isSoldOut) return -1;
          return 0;
        }).map(({ f, price, isSoldOut }) => (
          <li
            key={f.key}
            className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 transition-colors hover:bg-muted"
          >
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {f.name}
                {f.premium && (
                  <span className="ml-2 rounded-full bg-secondary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                    Premium
                  </span>
                )}
              </span>
              <span className="text-sm font-bold text-primary">
                {formatBRL(price)}
                {category.pricing === "per_kg" && (
                  <span className="ml-1 text-[10px] font-medium uppercase text-muted-foreground">
                    ({formatBRL(category.prices[f.key])}/kg)
                  </span>
                )}
              </span>
              {isSoldOut && (
                <span className="mt-0.5 text-[10px] font-medium italic text-muted-foreground">
                  Esgotado ou indisponível
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={isSoldOut}
              onClick={() => handleAdd(f.key, f.name, !!f.premium)}
              className={cn(
                "h-8 shrink-0 gap-1.5 rounded-full px-4 font-semibold transition-colors",
                isSoldOut
                  ? "bg-muted text-muted-foreground cursor-not-allowed opacity-90 grayscale-[0.5] hover:bg-muted hover:text-muted-foreground"
                  : "text-primary hover:bg-primary hover:text-primary-foreground"
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          </li>
        ))}
      </ul>

      {/* Brownie block — original design, shown only in Bola Cookie & Brownie card */}
      {category.slug === "bola-cookie" && (
        <div className="mt-5 rounded-2xl bg-gradient-to-br from-amber-950/80 to-stone-800/80 p-4 border border-amber-900/30">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-900 to-stone-800 text-amber-200">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-100">Brownie Meio Amargo</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-amber-400">Unidade · 1 brownie</p>
            </div>
          </div>

          <p className="mb-3 text-xs text-amber-200/70">
            Brownie artesanal de chocolate meio amargo, sem recheio — denso, fudgy e irresistível. Com opção de cobertura.
          </p>

          <ul className="space-y-2 mb-4">
            {BROWNIE_OPTIONS.map((opt) => {
              const isSelected = selectedBrownie === opt.id;
              return (
                <li
                  key={opt.id}
                  onClick={() => !brownieOutOfStock && setSelectedBrownie(opt.id)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-all",
                    isSelected
                      ? "border-amber-600/60 bg-amber-900/30 shadow-sm"
                      : "border-amber-900/30 bg-stone-900/20 hover:bg-amber-900/20",
                    brownieOutOfStock && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          isSelected ? "border-amber-500 bg-amber-500" : "border-amber-700/40 bg-transparent"
                        )}
                      >
                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="text-sm font-semibold text-amber-100">{opt.label}</span>
                    </div>
                    <span className="ml-6 text-xs text-amber-300/60">{opt.description}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-bold text-amber-300">{opt.priceLabel}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          <Button
            disabled={brownieOutOfStock}
            onClick={handleAddBrownie}
            className={cn(
              "h-10 w-full gap-2 rounded-full font-semibold transition-all",
              brownieOutOfStock
                ? "bg-stone-700/50 text-stone-400 cursor-not-allowed opacity-70"
                : "bg-gradient-to-r from-amber-900 to-stone-700 text-amber-100 hover:brightness-110 shadow-soft"
            )}
          >
            <Plus className="h-4 w-4" />
            {brownieOutOfStock ? "Esgotado" : "Adicionar brownie"}
          </Button>
        </div>
      )}
    </SpotlightCard>
  );
}
