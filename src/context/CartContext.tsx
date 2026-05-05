import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Category, FlavorKey, calcUnitPrice, formatBRL } from "@/data/menu";

export interface CartItem {
  id: string;
  categorySlug: string;
  categoryName: string;
  size: string;
  grams?: number;
  flavor: FlavorKey;
  flavorName: string;
  premium: boolean;
  unitPrice: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  totalLabel: string;
  add: (input: {
    category: Category;
    flavor: FlavorKey;
    flavorName: string;
    premium: boolean;
    size: string;
    grams?: number;
  }) => void;
  updateQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "cdc:cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const total = items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
    const count = items.reduce((acc, it) => acc + it.quantity, 0);

    return {
      items,
      count,
      total,
      totalLabel: formatBRL(total),
      add: ({ category, flavor, flavorName, premium, size, grams }) => {
        const unitPrice = calcUnitPrice(category, flavor, grams);
        const id = `${category.slug}__${flavor}__${size}`;
        setItems((prev) => {
          const existing = prev.find((i) => i.id === id);
          if (existing) {
            return prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
          }
          return [
            ...prev,
            {
              id,
              categorySlug: category.slug,
              categoryName: category.name,
              size,
              grams,
              flavor,
              flavorName,
              premium,
              unitPrice,
              quantity: 1,
            },
          ];
        });
      },
      updateQty: (id, qty) => {
        if (qty <= 0) {
          setItems((prev) => prev.filter((i) => i.id !== id));
        } else {
          setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
        }
      },
      remove: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
