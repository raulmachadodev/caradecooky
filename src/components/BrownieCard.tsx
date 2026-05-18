import { Plus, Flame } from "lucide-react";
import { useState } from "react";
import { SpotlightCard } from "@/components/SpotlightCard";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STOCK_LIMIT = 3;
const BROWNIE_PRICE = 12.0;

interface BrownieOption {
  id: string;
  label: string;
  description: string;
  price: number;
  priceLabel: string;
}

const OPTIONS: BrownieOption[] = [
  {
    id: "sem-cobertura",
    label: "Sem Cobertura",
    description: "Brownie puro meio amargo — intenso e direto ao ponto.",
    price: BROWNIE_PRICE,
    priceLabel: "R$ 12,00",
  },
  {
    id: "com-cobertura",
    label: "Com Cobertura",
    description: "Brownie meio amargo com cobertura à sua escolha.",
    price: BROWNIE_PRICE,
    priceLabel: "A combinar",
  },
];

export function BrownieCard() {
  const { add, items } = useCart();
  const [selectedOption, setSelectedOption] = useState<string>("sem-cobertura");

  // Count how many brownies are already in cart
  const brownieInCart = items
    .filter((i) => i.categoryName === "Brownie Meio Amargo")
    .reduce((acc, i) => acc + i.quantity, 0);

  const remaining = Math.max(0, STOCK_LIMIT - brownieInCart);
  const outOfStock = remaining === 0;

  const handleAdd = () => {
    if (outOfStock) {
      toast.error("Estoque esgotado!", {
        description: "Só temos 3 unidades disponíveis e você já as adicionou ao carrinho.",
      });
      return;
    }

    const option = OPTIONS.find((o) => o.id === selectedOption)!;

    add({
      category: {
        slug: "brownie",
        name: "Brownie Meio Amargo",
        tagline: "Brownie artesanal meio amargo.",
        pricing: "fixed",
        size: "Unidade",
        prices: { nutella: BROWNIE_PRICE, rafaello: BROWNIE_PRICE, pistache: BROWNIE_PRICE, cappuccino: BROWNIE_PRICE, kinder: BROWNIE_PRICE },
      },
      flavor: "nutella", // placeholder key — display name overrides in cart
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
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-900 to-stone-800 text-amber-200 shadow-soft">
          <Flame className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display text-2xl text-primary">Brownie Meio Amargo</h3>
          <p className="text-xs font-medium uppercase tracking-wider text-accent">Unidade · 1 brownie</p>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Brownie artesanal de chocolate meio amargo, sem recheio — denso, fudgy e irresistível.
        Com opção de cobertura.
      </p>

      {/* Stock badge */}
      <div
        className={cn(
          "mb-5 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold",
          outOfStock
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : remaining === 1
            ? "border-orange-400/50 bg-orange-400/10 text-orange-600"
            : "border-amber-500/40 bg-amber-500/10 text-amber-700"
        )}
      >
        <span
          className={cn(
            "flex h-2 w-2 rounded-full",
            outOfStock ? "bg-destructive" : "bg-amber-500 animate-pulse"
          )}
        />
        {outOfStock
          ? "Esgotado no carrinho (máx. 3 unidades)"
          : `⚠️ Estoque limitado — apenas ${remaining} unidade${remaining !== 1 ? "s" : ""} disponível${remaining !== 1 ? "s" : ""}!`}
      </div>

      {/* Options */}
      <ul className="space-y-2">
        {OPTIONS.map((opt) => {
          const isSelected = selectedOption === opt.id;
          return (
            <li
              key={opt.id}
              onClick={() => !outOfStock && setSelectedOption(opt.id)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-all",
                isSelected
                  ? "border-primary/50 bg-primary/5 shadow-sm"
                  : "border-border bg-muted/40 hover:bg-muted",
                outOfStock && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  {/* Radio indicator */}
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/40 bg-transparent"
                    )}
                  >
                    {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                </div>
                <span className="ml-6 text-xs text-muted-foreground">{opt.description}</span>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-sm font-bold text-primary">{opt.priceLabel}</span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Add button */}
      <Button
        disabled={outOfStock}
        onClick={handleAdd}
        className={cn(
          "mt-5 h-10 w-full gap-2 rounded-full font-semibold transition-all",
          outOfStock
            ? "bg-muted text-muted-foreground cursor-not-allowed opacity-70"
            : "bg-gradient-to-r from-amber-900 to-stone-700 text-amber-100 hover:brightness-110 shadow-soft"
        )}
      >
        <Plus className="h-4 w-4" />
        {outOfStock ? "Esgotado" : "Adicionar brownie"}
      </Button>
    </SpotlightCard>
  );
}
