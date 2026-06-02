// Catálogo da Cara de Cooky Gourmet — extraído do cardápio oficial.

export type FlavorKey = "nutella" | "rafaello" | "pistache" | "cappuccino" | "kinder" | "moca_brigadeiro" | "buenotella" | "mini_bola";

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
  prices: Record<FlavorKey, number>;
  unavailableFlavors?: FlavorKey[];
}

export const FLAVORS: Flavor[] = [
  { key: "nutella", name: "Nutella", description: "Massa tradicional crocante por fora e macia por dentro, com gotas de chocolate nobre meio amargo." },
  { key: "rafaello", name: "Raffaello", premium: true, description: "Massa tradicional crocante por fora e macia por dentro, com chocolate branco nobre, decorado com Raffaello e coco por cima." },
  { key: "pistache", name: "Pistache", description: "Massa tradicional crocante por fora e macia por dentro, com chocolate branco nobre, decorado com granulado." },
  { key: "moca_brigadeiro", name: "Moça Brigadeiro", description: "Massa crocante por fora e macia por dentro." },
  { key: "cappuccino", name: "Dark Cappuccino", description: "Massa dark crocante por fora e macia por dentro, com cacau 100%." },
  { key: "kinder", name: "Kinder", premium: true, description: "Massa tradicional crocante por fora e macia por dentro, com gotas de chocolate nobre meio amargo, decorado com granulados e Kinder por cima." },
  { key: "buenotella", name: "Buenotella", premium: true, description: "Massa crocante por fora e macia por dentro." },
  { key: "mini_bola", name: "Mini (5 unidades)", badge: "Valor promocional de lançamento", description: "Massa crocante por fora e macia por dentro." },
];

export const CATEGORIES: Category[] = [
  {
    slug: "bola-cookie",
    name: "Bola Cookie",
    tagline: "O clássico recheado.",
    pricing: "fixed",
    size: "100g",
    prices: { nutella: 15.0, rafaello: 0, pistache: 0, cappuccino: 0, kinder: 0, moca_brigadeiro: 0, buenotella: 0, mini_bola: 9.90 },
  },
  {
    slug: "marmita-200g",
    name: "Marmita Pequena",
    tagline: "Massa de cookie + recheio cremoso. Pra dividir... ou não.",
    pricing: "fixed",
    size: "Pequena",
    prices: { nutella: 18.5, rafaello: 27.0, pistache: 18.0, cappuccino: 17.0, kinder: 30.0, moca_brigadeiro: 16.50, buenotella: 25.0, mini_bola: 0 },
    unavailableFlavors: ["cappuccino", "moca_brigadeiro"],
  },
  {
    slug: "marmita-500g",
    name: "Marmita Grande",
    tagline: "Versão família — pura indulgência.",
    pricing: "fixed",
    size: "Grande",
    prices: { nutella: 25.0, rafaello: 37.0, pistache: 20.0, cappuccino: 19.0, kinder: 42.0, moca_brigadeiro: 19.90, buenotella: 35.0, mini_bola: 0 },
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
    prices: { nutella: 120.0, rafaello: 190.0, pistache: 100.0, cappuccino: 100.0, kinder: 230.0, moca_brigadeiro: 0, buenotella: 180.0, mini_bola: 0 },
    unavailableFlavors: ["cappuccino", "kinder"],
  },
];

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getFlavor(key: FlavorKey) {
  return FLAVORS.find((f) => f.key === key)!;
}

/** Calcula o preço unitário considerando tamanho (caso per_kg). */
export function calcUnitPrice(category: Category, flavor: FlavorKey, grams?: number) {
  const base = category.prices[flavor];
  if (category.pricing === "per_kg") {
    if (!grams) return 0;
    return (base * grams) / 1000;
  }
  return base;
}
