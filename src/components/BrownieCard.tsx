import { Plus, Flame } from "lucide-react";
import { useState } from "react";
import { SpotlightCard } from "@/components/SpotlightCard";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProductionConfig } from "@/pages/Admin";

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

interface Props {
  productionConfig?: ProductionConfig;
}

export function BrownieCard({ productionConfig }: Props) {
  const { add, items } = useCart();
  const [selectedBrownie, setSelectedBrownie] = useState("sem-cobertura");

  const brownieInCart = items
    .filter((i) => i.categoryName === "Brownie Meio Amargo")
    .reduce((acc, i) => acc + i.quantity, 0);
  const brownieDisabled = productionConfig?.disabled_categories.includes("brownie") ?? false;
  const brownieOutOfStock = brownieInCart >= STOCK_LIMIT || brownieDisabled;

  const handleAddBrownie = () => {
    if (brownieDisabled) {
      toast.error("Indisponível", { description: "O brownie está esgotado no momento." });
      return;
    }
    if (brownieInCart >= STOCK_LIMIT) {
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

  if (brownieDisabled) {
    // We could hide it entirely or just show it disabled. The user wanted it below, in another box.
    // Let's show it disabled but it's up to you.
    // Let's show it, but disabled.
  }

  return (
    <SpotlightCard 
      as="article" 
      className="!bg-gradient-to-br !from-[#2a1708] !to-[#1a1412] !border-amber-900/40 flex flex-col shadow-xl"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-900 to-stone-800 text-amber-200 shadow-soft">
          <Flame className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display text-2xl text-amber-100">Brownie Meio Amargo</h3>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400">Unidade · 1 brownie</p>
        </div>
      </div>

      <p className="mb-5 text-sm text-amber-200/70">
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
          "mt-auto h-10 w-full gap-2 rounded-full font-semibold transition-all",
          brownieOutOfStock
            ? "bg-stone-700/50 text-stone-400 cursor-not-allowed opacity-70"
            : "bg-gradient-to-r from-amber-900 to-stone-700 text-amber-100 hover:brightness-110 shadow-soft"
        )}
      >
        <Plus className="h-4 w-4" />
        {brownieDisabled ? "Esgotado" : (brownieOutOfStock ? "Limite Atingido" : "Adicionar brownie")}
      </Button>
    </SpotlightCard>
  );
}
