// Catálogo da Cara de Cooky Gourmet — extraído do cardápio oficial.

export type FlavorKey = "nutella" | "rafaello" | "pistache" | "cappuccino" | "kinder" | "moca_brigadeiro";

export interface Flavor {
  key: FlavorKey;
  name: string;
  premium?: boolean;
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
}

export const FLAVORS: Flavor[] = [
  { key: "nutella", name: "Nutella" },
  { key: "rafaello", name: "Rafaello", premium: true },
  { key: "pistache", name: "Pistache" },
  { key: "moca_brigadeiro", name: "Moça Brigadeiro" },
  { key: "cappuccino", name: "Dark Cappuccino" },
  { key: "kinder", name: "Kinder", premium: true },
];

export const CATEGORIES: Category[] = [
  {
    slug: "bola-cookie",
    name: "Bola Cookie",
    tagline: "O clássico recheado, no tamanho perfeito pra um café.",
    pricing: "fixed",
    size: "100g",
    prices: { nutella: 12.0, rafaello: 13.0, pistache: 9.9, cappuccino: 7.99, kinder: 16.0, moca_brigadeiro: 0 },
  },
  {
    slug: "marmita-200g",
    name: "Marmita",
    tagline: "Massa de cookie + recheio cremoso. Pra dividir... ou não.",
    pricing: "fixed",
    size: "200g",
    prices: { nutella: 18.5, rafaello: 20.0, pistache: 18.0, cappuccino: 17.0, kinder: 26.0, moca_brigadeiro: 16.50 },
  },
  {
    slug: "marmita-500g",
    name: "Marmita Grande",
    tagline: "Versão família — pura indulgência.",
    pricing: "fixed",
    size: "400g a 500g",
    prices: { nutella: 25.0, rafaello: 28.0, pistache: 20.0, cappuccino: 19.0, kinder: 37.0, moca_brigadeiro: 19.90 },
  },
  {
    slug: "torta-cookie",
    name: "Torta Cookie",
    tagline: "Torta inteira de cookie pra comemorar do seu jeito.",
    pricing: "per_kg",
    sizes: [
      { label: "400g a 500g", grams: 500 },
      { label: "1kg", grams: 1000 },
      { label: "1,5kg", grams: 1500 },
    ],
    prices: { nutella: 120.0, rafaello: 190.0, pistache: 100.0, cappuccino: 100.0, kinder: 230.0, moca_brigadeiro: 0 },
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
