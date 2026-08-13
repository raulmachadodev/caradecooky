import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Category, Flavor, FLAVORS as BASE_FLAVORS, CATEGORIES as BASE_CATEGORIES, ToppingProduct, CustomCategory } from "@/data/menu";
import { supabase } from "@/integrations/supabase/client";

export interface MenuConfig {
  flavors: Record<string, Flavor>;
  categoryPrices: Record<string, Record<string, number>>;
  customCategories?: CustomCategory[];
  toppingProducts?: ToppingProduct[];
}

interface MenuContextValue {
  flavors: Flavor[];
  categories: Category[];
  toppingProducts: ToppingProduct[];
  loadingMenu: boolean;
  menuConfig: MenuConfig;
  updateMenuConfig: (newConfig: MenuConfig) => Promise<void>;
}

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menuConfig, setMenuConfig] = useState<MenuConfig>({
    flavors: {},
    categoryPrices: {},
    customCategories: [],
    toppingProducts: [],
  });
  const [loadingMenu, setLoadingMenu] = useState(true);

  useEffect(() => {
    async function fetchMenuConfig() {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("id", "menu_config")
        .maybeSingle();

      if (data?.value) {
        setMenuConfig(data.value as unknown as MenuConfig);
      }
      setLoadingMenu(false);
    }
    fetchMenuConfig();
  }, []);

  const updateMenuConfig = async (newConfig: MenuConfig) => {
    setMenuConfig(newConfig);
    await supabase.from("site_settings").upsert({
      id: "menu_config",
      key: "menu_config",
      value: newConfig as any
    });
  };

  // Merge the base data with the config from Supabase
  const allFlavorKeys = new Set([
    ...BASE_FLAVORS.map(f => f.key),
    ...Object.keys(menuConfig.flavors || {})
  ]);

  const flavors = Array.from(allFlavorKeys).map(key => {
    const base = BASE_FLAVORS.find(f => f.key === key) || { key, name: "Novo Sabor" };
    const override = (menuConfig.flavors || {})[key] || {};
    return { ...base, ...override } as Flavor;
  });

  // Merge base categories with overrides
  const baseCategories = BASE_CATEGORIES.map(c => {
    const overridePrices = (menuConfig.categoryPrices || {})[c.slug] || {};
    return {
      ...c,
      prices: {
        ...c.prices,
        ...overridePrices
      }
    };
  });

  // Add custom categories created via admin
  const customCategories: Category[] = (menuConfig.customCategories || []).map(cc => {
    const overridePrices = (menuConfig.categoryPrices || {})[cc.slug] || {};
    return {
      ...cc,
      prices: { ...overridePrices },
      isCustom: true,
    };
  });

  const categories = [...baseCategories, ...customCategories];

  // Topping products from config
  const toppingProducts = menuConfig.toppingProducts || [];

  return (
    <MenuContext.Provider value={{ flavors, categories, toppingProducts, loadingMenu, menuConfig, updateMenuConfig }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu deve ser usado dentro de um <MenuProvider>");
  return ctx;
}
