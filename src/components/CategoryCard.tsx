import { Plus, Cookie, Package, Cake, Gift, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { Category, formatBRL, calcUnitPrice, calcToppingProductPrice, ToppingProduct } from "@/data/menu";
import { SpotlightCard } from "@/components/SpotlightCard";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useMenu } from "@/context/MenuContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProductionConfig } from "@/pages/Admin";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "bola-cookie": Cookie,
  "mini-bola-cookie": Cookie,
  "marmita-200g": Package,
  "marmita-500g": Package,
  "torta-cookie": Cake,
};

interface Props {
  category: Category;
  productionConfig?: ProductionConfig;
}

/** Sub-component for Kit Topping Product */
function KitToppingCard({ product, category }: { product: ToppingProduct; category: Category }) {
  const { addKit } = useCart();
  const [mainTopping, setMainTopping] = useState<string>(
    product.toppings.find(t => t.available)?.key || ""
  );
  const [extraToppings, setExtraToppings] = useState<string[]>([]);
  const [showExtraSelector, setShowExtraSelector] = useState(false);

  const availableToppings = product.toppings.filter(t => t.available);
  const mainToppingObj = availableToppings.find(t => t.key === mainTopping);
  
  const extraToppingObjs = extraToppings
    .map(key => availableToppings.find(t => t.key === key))
    .filter(Boolean) as typeof availableToppings;

  const totalPrice = calcToppingProductPrice(product, extraToppings.length);

  const handleAddExtra = (key: string) => {
    if (!extraToppings.includes(key)) {
      setExtraToppings(prev => [...prev, key]);
    }
    setShowExtraSelector(false);
  };

  const handleRemoveExtra = (key: string) => {
    setExtraToppings(prev => prev.filter(k => k !== key));
  };

  const handleAddToCart = () => {
    if (!mainToppingObj) {
      toast.error("Selecione um topping!");
      return;
    }
    addKit({
      category,
      product,
      mainTopping: { key: mainToppingObj.key, name: mainToppingObj.name },
      extraToppings: extraToppingObjs.map(t => ({ key: t.key, name: t.name })),
    });
    toast.success("Kit adicionado ao pedido! 🍪", {
      description: `${product.name} — Topping: ${mainToppingObj.name}${
        extraToppingObjs.length > 0 ? ` + ${extraToppingObjs.map(t => t.name).join(", ")}` : ""
      }`,
    });
    // Reset extras after adding
    setExtraToppings([]);
  };

  return (
    <li className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/40">
      {/* Badge "Novidade!" */}
      {product.badge && (
        <div className="absolute -right-8 top-3 rotate-45 bg-gradient-to-r from-emerald-500 to-emerald-600 px-10 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
          {product.badge}
        </div>
      )}

      {/* Header */}
      <div className="mb-3 flex items-center gap-3 pr-16">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-display text-lg font-bold text-primary leading-tight">{product.name}</h4>
          {product.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{product.description}</p>
          )}
        </div>
      </div>

      {/* Topping Principal */}
      <div className="mb-3">
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Escolha o sabor do Topping
        </label>
        <div className="flex flex-wrap gap-1.5">
          {availableToppings.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setMainTopping(t.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                mainTopping === t.key
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-white text-foreground hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Toppings Extras */}
      <div className="mb-4 rounded-lg border border-dashed border-secondary/40 bg-secondary/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground/70">
            Topping Adicional
          </span>
          <span className="text-[10px] font-medium text-muted-foreground">
            +{formatBRL(product.extraToppingPrice)} cada
            {product.extraToppingDiscount > 0 && (
              <span className="ml-1 text-emerald-600">
                (2º em diante: {formatBRL(product.extraToppingPrice - product.extraToppingDiscount)})
              </span>
            )}
          </span>
        </div>

        {/* Existing extra toppings */}
        {extraToppingObjs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {extraToppingObjs.map((t, idx) => (
              <span
                key={t.key}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {t.name}
                <span className="text-[9px] text-muted-foreground">
                  (+{formatBRL(idx === 0 ? product.extraToppingPrice : product.extraToppingPrice - product.extraToppingDiscount)})
                </span>
                <button
                  onClick={() => handleRemoveExtra(t.key)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add extra button / selector */}
        {!showExtraSelector ? (
          <button
            onClick={() => setShowExtraSelector(true)}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary/70 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all w-full justify-center"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar topping extra
          </button>
        ) : (
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-medium">Escolha um sabor adicional:</p>
            <div className="flex flex-wrap gap-1.5">
              {availableToppings
                .filter(t => t.key !== mainTopping && !extraToppings.includes(t.key))
                .map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleAddExtra(t.key)}
                    className="rounded-full border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    {t.name}
                  </button>
                ))}
              <button
                onClick={() => setShowExtraSelector(false)}
                className="rounded-full border border-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Price + Add to Cart */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-display font-bold text-primary">
            {formatBRL(totalPrice)}
          </span>
          {extraToppings.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              Base {formatBRL(product.basePrice)} + {extraToppings.length} adicional(is)
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleAddToCart}
          disabled={!mainTopping}
          className="h-9 gap-1.5 rounded-full bg-gradient-to-r from-primary to-amber-700 px-5 font-bold text-primary-foreground shadow-glow hover:brightness-110 transition-all"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>
    </li>
  );
}

export function CategoryCard({ category, productionConfig }: Props) {
  const Icon = ICONS[category.slug] ?? Cookie;
  const { add } = useCart();
  const { flavors, toppingProducts } = useMenu();
  const [selectedSize, setSelectedSize] = useState<string>(
    category.pricing === "per_kg" ? category.sizes![0].label : category.size!,
  );
  const [selectedBrownie, setSelectedBrownie] = useState("sem-cobertura");

  const currentGrams =
    category.pricing === "per_kg"
      ? category.sizes!.find((s) => s.label === selectedSize)?.grams
      : undefined;

  const handleAdd = (flavorKey: string, flavorName: string, premium: boolean) => {
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

  // Get topping products for this category
  const categoryToppingProducts = toppingProducts.filter(
    tp => tp.categorySlug === category.slug && tp.enabled
  );

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
            {category.sizes.filter(s => !productionConfig?.disabled_sizes.includes(`${category.slug}|${s.label}`)).map((s) => (
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
        {/* Topping Products (Kits) */}
        {categoryToppingProducts.map(tp => (
          <KitToppingCard key={tp.id} product={tp} category={category} />
        ))}

        {/* Regular flavors */}
        {[...flavors.filter((f) => {
          const price = category.prices[f.key];
          return price !== undefined && price > 0;
        }).map((f) => ({
          f,
          price: calcUnitPrice(category, f.key, currentGrams),
          isSoldOut: category.unavailableFlavors?.includes(f.key) || (productionConfig?.disabled_flavors.includes(`${category.slug}|${f.key}`) ?? false),
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
              <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-foreground">
                {f.name}
                {f.premium && (
                  <span className="rounded-full bg-secondary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                    Premium
                  </span>
                )}
                {f.badge && (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    {f.badge}
                  </span>
                )}
              </span>
              <span className="text-sm font-bold text-primary mt-1">
                {formatBRL(price)}
                {category.pricing === "per_kg" && (
                  <span className="ml-1 text-[10px] font-medium uppercase text-muted-foreground">
                    ({formatBRL(category.prices[f.key])}/kg)
                  </span>
                )}
              </span>
              {f.description && (
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground/70">
                  {f.description}
                </p>
              )}
              {isSoldOut && (
                <span className="mt-1 text-[10px] font-medium italic text-muted-foreground">
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

    </SpotlightCard>
  );
}
