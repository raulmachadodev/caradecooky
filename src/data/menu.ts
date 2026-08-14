// Catálogo da Cara de Cooky Gourmet — extraído do cardápio oficial.

// FlavorKey agora é string para suportar sabores dinâmicos criados pelo admin
export type FlavorKey = string;

export interface Flavor {
  key: FlavorKey;
  name: string;
  premium?: boolean;
  description?: string;
  badge?: string;
}

export interface CategorySize {
  /** rótulo curto (ex: "100g", "1kg") */
  label: string;
  /** peso em gramas — usado para calcular total quando o preço é por kg */
  grams?: number;
}

export interface Category {
  slug: string;
  name: string;
  /** descrição curta para o card */
  tagline: string;
  /** "fixed" = preço por sabor; "per_kg" = preço por kg, total = preço/kg * (grams/1000) */
  pricing: "fixed" | "per_kg";
  /** apenas quando pricing = "fixed" */
  size?: string;
  /** opções de tamanho (apenas quando per_kg) */
  sizes?: CategorySize[];
  /** preços por sabor (em reais). Quando per_kg, é o preço/kg */
  prices: Record<string, number>;
  unavailableFlavors?: string[];
  /** flag para categorias criadas pelo admin */
  isCustom?: boolean;
}

/** Produto especial com seleção de toppings (ex: Kit 7 Mini-Cookies + Topping) */
export interface ToppingOption {
  key: string;
  name: string;
  available: boolean;
}

export interface ToppingProduct {
  id: string;
  name: string;
  badge?: string;
  description?: string;
  /** slug da categoria onde este produto aparece */
  categorySlug: string;
  /** preço base do kit (inclui 1 topping) */
  basePrice: number;
  /** preço do 1° topping adicional */
  extraToppingPrice: number;
  /** desconto por topping adicional a partir do 2° extra */
  extraToppingDiscount: number;
  /** toppings disponíveis */
  toppings: ToppingOption[];
  enabled: boolean;
}

/** Categoria criada pelo admin */
export interface CustomCategory {
  slug: string;
  name: string;
  tagline: string;
  pricing: "fixed" | "per_kg";
  size?: string;
  sizes?: CategorySize[];
}

export const FLAVORS: Flavor[] = [
  { key: "nutella", name: "Nutella", description: "Massa tradicional crocante por fora e macia por dentro, com gotas de chocolate nobre meio amargo." },
  { key: "rafaello", name: "Raffaello", premium: true, description: "Massa tradicional crocante por fora e macia por dentro, com chocolate branco nobre, decorado com Raffaello e coco por cima." },
  { key: "pistache", name: "Pistache", description: "Massa tradicional crocante por fora e macia por dentro, com chocolate branco nobre, decorado com granulado." },
  { key: "moca_brigadeiro", name: "Moça Brigadeiro", description: "Massa crocante por fora e macia por dentro." },
  { key: "cappuccino", name: "Dark Cappuccino", description: "Massa dark crocante por fora e macia por dentro, com cacau 100%." },
  { key: "kinder", name: "Kinder", premium: true, description: "Massa tradicional crocante por fora e macia por dentro, com gotas de chocolate nobre meio amargo, decorado com granulados e Kinder por cima." },
  { key: "buenotella", name: "Buenotella", premium: true, description: "Massa crocante por fora e macia por dentro." },
  { key: "mini_bola", name: "Mini (5 unidades)", description: "Massa crocante por fora e macia por dentro." },
];

export const CATEGORIES: Category[] = [
  {
    slug: "bola-cookie",
    name: "Bola Cookie",
    tagline: "O clássico recheado.",
    pricing: "fixed",
    size: "100g",
    prices: { nutella: 15.0, rafaello: 0, pistache: 0, cappuccino: 0, kinder: 0, moca_brigadeiro: 0, buenotella: 0, mini_bola: 9.90 } as Record<string, number>,
  },
  {
    slug: "marmita-200g",
    name: "Marmita Pequena",
    tagline: "Massa de cookie + recheio cremoso. Pra dividir... ou não.",
    pricing: "fixed",
    size: "Pequena",
    prices: { nutella: 18.5, rafaello: 27.0, pistache: 18.0, cappuccino: 17.0, kinder: 30.0, moca_brigadeiro: 16.50, buenotella: 25.0, mini_bola: 0 } as Record<string, number>,
    unavailableFlavors: ["cappuccino", "moca_brigadeiro"],
  },
  {
    slug: "marmita-500g",
    name: "Marmita Grande",
    tagline: "Versão família — pura indulgência.",
    pricing: "fixed",
    size: "Grande",
    prices: { nutella: 25.0, rafaello: 37.0, pistache: 20.0, cappuccino: 19.0, kinder: 42.0, moca_brigadeiro: 19.90, buenotella: 35.0, mini_bola: 0 } as Record<string, number>,
    unavailableFlavors: ["cappuccino", "moca_brigadeiro"],
  },
  {
    slug: "torta-cookie",
    name: "Torta Cookie",
    tagline: "Torta inteira de cookie pra comemorar do seu jeito.",
    pricing: "per_kg",
    sizes: [
      { label: "500g", grams: 500 },
      { label: "1kg", grams: 1000 },
      { label: "1,5kg", grams: 1500 },
    ],
    prices: { nutella: 120.0, rafaello: 190.0, pistache: 100.0, cappuccino: 100.0, kinder: 230.0, moca_brigadeiro: 0, buenotella: 180.0, mini_bola: 0 } as Record<string, number>,
    unavailableFlavors: ["cappuccino", "kinder"],
  },
];

export const BASE_TOPPING_PRODUCTS: ToppingProduct[] = [
  {
    id: "kit-7-mini-cookies-topping",
    name: "Kit 7 mini-cookies + Topping",
    badge: "Novidade!",
    description: "Escolha o sabor do seu topping (o 1º está incluso no kit). Toppings adicionais saem por R$ 7,00 cada.",
    categorySlug: "bola-cookie",
    basePrice: 30.0,
    extraToppingPrice: 7.0,
    extraToppingDiscount: 0.0,
    enabled: true,
    toppings: [
      { key: "nutella", name: "Nutella", available: true },
      { key: "kinder_bueno_white", name: "Kinder Bueno White", available: true },
      { key: "pistache", name: "Pistache", available: true },
      { key: "chocolate_amargo", name: "Chocolate Meio Amargo", available: true },
    ],
  }
];

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getFlavor(key: string) {
  return FLAVORS.find((f) => f.key === key)!;
}

/** Calcula o preço unitário considerando tamanho (caso per_kg). */
export function calcUnitPrice(category: Category, flavor: string, grams?: number) {
  const base = category.prices[flavor] ?? 0;
  if (category.pricing === "per_kg") {
    if (!grams) return 0;
    return (base * grams) / 1000;
  }
  return base;
}

/** Calcula o preço total de um Kit com toppings */
export function calcToppingProductPrice(product: ToppingProduct, extraToppingsCount: number): number {
  if (extraToppingsCount <= 0) return product.basePrice;
  // 1° adicional: preço cheio, 2° em diante: preço com desconto
  const firstExtra = product.extraToppingPrice;
  const remainingExtras = Math.max(0, extraToppingsCount - 1) * (product.extraToppingPrice - product.extraToppingDiscount);
  return product.basePrice + firstExtra + remainingExtras;
}
