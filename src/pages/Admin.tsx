import { useEffect, useState, memo } from "react";
import { Navigate, Link } from "react-router-dom";
import { LogOut, Cookie, RefreshCw, Calendar, Clock, Inbox, ChevronRight, Truck, Settings, X, Plus, Trash2, Bell, BellOff, Pencil } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMenu } from "@/context/MenuContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { SpotlightCard } from "@/components/SpotlightCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBRL, CATEGORIES, FLAVORS } from "@/data/menu";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const PERIOD_LABELS: Record<string, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

interface OrderItem {
  category: string;
  size: string;
  flavor: string;
  premium?: boolean;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface OrderRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  delivery_date: string;
  delivery_time: string;
  payment_method: string;
  items: OrderItem[];
  notes: string | null;
  delivery_fee_note: string | null;
  total: number;
  status: OrderStatus;
  created_at: string;
}

interface DeliveryConfig {
  allowed_weekdays: number[]; // 0-6
  blocked_dates: string[];    // YYYY-MM-DD
}

export interface ProductionConfig {
  disabled_categories: string[];
  disabled_sizes: string[];
  disabled_flavors: string[];
}

const WEEKDAYS = [
  { id: 0, label: "Domingo" },
  { id: 1, label: "Segunda" },
  { id: 2, label: "Terça" },
  { id: 3, label: "Quarta" },
  { id: 4, label: "Quinta" },
  { id: 5, label: "Sexta" },
  { id: 6, label: "Sábado" },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  novo: "Novo",
  em_producao: "Em produção",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  novo: "default",
  em_producao: "secondary",
  saiu_para_entrega: "secondary",
  entregue: "outline",
  cancelado: "destructive",
};

const STATUS_ORDER: Record<OrderStatus, number> = {
  novo: 1,
  em_producao: 2,
  saiu_para_entrega: 3,
  entregue: 4,
  cancelado: 5
};

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  novo: "em_producao",
  em_producao: "saiu_para_entrega",
  saiu_para_entrega: "entregue",
  entregue: null,
  cancelado: null,
};

// Componente para o Card de Pedido (Otimizado)
const OrderCard = memo(({ o, changeStatus, deleteOrder, sendWhatsAppConfirmation }: { 
  o: OrderRow, 
  changeStatus: (id: string, s: OrderStatus) => void,
  deleteOrder: (id: string) => void,
  sendWhatsAppConfirmation: (o: OrderRow) => void
}) => {
  const nextStatus = NEXT_STATUS[o.status];
  return (
    <SpotlightCard
      as="article"
      className="p-0 overflow-hidden"
    >
      <div className="p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-soft",
              o.status === 'novo' ? "bg-gradient-gold text-primary" : "bg-muted text-muted-foreground"
            )}>
              <Cookie className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl text-primary">{o.customer_name}</h2>
                <Button 
                  size="sm" 
                  onClick={() => sendWhatsAppConfirmation(o)}
                  className="h-8 w-8 rounded-full bg-[#25D366] p-0 hover:bg-[#128C7E] text-white shadow-glow shrink-0"
                  title="Confirmar via WhatsApp"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .014 5.398 0 12.037c0 2.125.556 4.2 1.611 6.062L0 24l6.105-1.603a11.803 11.803 0 005.94 1.597h.005c6.637 0 12.036-5.399 12.04-12.038a11.82 11.82 0 00-3.576-8.513"/>
                  </svg>
                </Button>
                <Badge variant={STATUS_VARIANT[o.status]} className="font-bold uppercase tracking-wider">
                  {STATUS_LABEL[o.status]}
                </Badge>
                {o.status === 'novo' && (
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {o.customer_phone} · ID: <span className="font-mono text-xs font-bold text-primary">#{o.id.slice(0, 8).toUpperCase()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-2 min-w-[150px]">
              {nextStatus && (
                <Button 
                  onClick={() => changeStatus(o.id, nextStatus)}
                  className="bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px] h-8 shadow-glow"
                >
                  Avançar: {STATUS_LABEL[nextStatus]}
                </Button>
              )}
              <Select
                value={o.status}
                onValueChange={(v) => changeStatus(o.id, v as OrderStatus)}
              >
                <SelectTrigger className="h-7 rounded-xl border-secondary/30 bg-background/50 text-[10px] font-bold uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="em_producao">Em produção</SelectItem>
                  <SelectItem value="saiu_para_entrega">Saiu para entrega</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="mt-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O pedido de <strong>{o.customer_name}</strong> será removido permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteOrder(o.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {(() => {
          let parsedItems: any[] = [];
          try {
            if (Array.isArray(o.items)) parsedItems = o.items;
            else if (typeof o.items === 'string') parsedItems = JSON.parse(o.items);
          } catch (e) {
            parsedItems = [];
          }

          return (
            <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl bg-background/30 p-5 border border-border/50">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                  <ChevronRight className="h-3 w-3 text-primary" /> Detalhes do Pedido
                </p>
                <ul className="space-y-3">
                  {parsedItems.map((it: any, idx: number) => (
                    <li key={idx} className="flex justify-between gap-4 border-b border-border/30 pb-3 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">
                          {it.quantity}× {it.category}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {it.size} · {it.flavor}
                          {it.premium && (
                            <span className="ml-2 rounded-full bg-gradient-gold/20 px-2 py-0.5 text-[8px] font-bold uppercase text-primary">
                              Premium
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="font-bold text-primary">{formatBRL(it.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Geral</span>
                  <span className="font-display text-2xl font-bold text-primary">{formatBRL(Number(o.total))}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-2xl bg-secondary/5 p-5 border border-secondary/20">
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-secondary" /> Agendamento e Entrega
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Data:</span>
                      <span className="font-bold text-primary">{o.delivery_date.split('-').reverse().join('/')}</span>
                    </div>
                    <div className="border-t border-border/30 pt-3">
                      <span className="text-muted-foreground font-medium block mb-1">Endereço:</span>
                      <span className="font-bold text-foreground block leading-tight">{o.delivery_address || "Retirada no local"}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/30 pt-3">
                      <span className="text-muted-foreground font-medium">Pagamento:</span>
                      <Badge variant="outline" className="font-bold border-secondary/30">{o.payment_method.toUpperCase()}</Badge>
                    </div>
                  </div>
                </div>

                {o.notes && (
                  <div className="rounded-2xl bg-accent/5 p-4 border border-accent/20">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-accent">Observações do Cliente</p>
                    <p className="text-xs text-foreground italic leading-relaxed">"{o.notes}"</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </SpotlightCard>
  );
});

OrderCard.displayName = "OrderCard";

// PushButton — manages Web Push subscription state
function PushButton() {
  const { status, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  if (status === "unsupported") return null;

  if (isSubscribed) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={unsubscribe}
        className="gap-2 border-secondary/30 text-primary"
        title="Desativar notificações push"
      >
        <BellOff className="h-4 w-4 text-muted-foreground" />
        <span className="hidden sm:inline text-xs">Notificações</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={subscribe}
      disabled={status === "loading" || status === "denied"}
      title={
        status === "denied"
          ? "Permissão negada — acesse as configurações do Safari"
          : "Ativar notificações de novos pedidos"
      }
      className="gap-2 border-amber-500/40 text-amber-700 hover:bg-amber-50"
    >
      <Bell className="h-4 w-4" />
      <span className="hidden sm:inline text-xs">
        {status === "denied" ? "Bloqueado" : "Ativar alertas"}
      </span>
    </Button>
  );
}

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const { flavors: menuFlavors, categories: menuCategories, menuConfig, updateMenuConfig } = useMenu();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<"todos" | "hoje" | "ontem" | "agendados">("todos");
  const [statusFilter, setStatusFilter] = useState<"todos" | OrderStatus>("todos");

  // Configurações de entrega e produção
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({
    allowed_weekdays: [1, 2, 3, 4, 5, 6],
    blocked_dates: [],
  });
  const [productionConfig, setProductionConfig] = useState<ProductionConfig>({
    disabled_categories: [],
    disabled_sizes: [],
    disabled_flavors: [],
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [activeTab, setActiveTab] = useState<"entregas" | "producao" | "sabores">("producao");
  const [flavorModalOpen, setFlavorModalOpen] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState<{
    key: string;
    isNew: boolean;
    name: string;
    description: string;
    badge: string;
    premium: boolean;
    prices: Record<string, string>;
  } | null>(null);

  async function loadConfig() {
    const { data: deliveryData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "delivery_config")
      .maybeSingle();
    
    if (deliveryData?.value) {
      setDeliveryConfig(deliveryData.value as unknown as DeliveryConfig);
    }

    const { data: prodData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "production_config")
      .maybeSingle();

    if (prodData?.value) {
      setProductionConfig(prodData.value as unknown as ProductionConfig);
    }
  }

  async function saveConfig() {
    setIsSavingConfig(true);
    const { error: e1 } = await supabase
      .from("site_settings")
      .upsert({ id: "delivery_config", value: deliveryConfig as any });
    
    const { error: e2 } = await supabase
      .from("site_settings")
      .upsert({ id: "production_config", value: productionConfig as any });
    
    setIsSavingConfig(false);
    if (e1 || e2) {
      toast.error("Erro ao salvar", { description: (e1 || e2)?.message });
    } else {
      toast.success("Configurações salvas!");
    }
  }

  async function saveFlavorEdit() {
    if (!editingFlavor || !editingFlavor.name.trim()) {
      toast.error("O nome do sabor é obrigatório.");
      return;
    }

    const key = editingFlavor.isNew
      ? editingFlavor.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "")
      : editingFlavor.key;

    const newFlavors: Record<string, any> = {
      ...(menuConfig.flavors || {}),
      [key]: {
        key,
        name: editingFlavor.name.trim(),
        ...(editingFlavor.description.trim() ? { description: editingFlavor.description.trim() } : {}),
        ...(editingFlavor.badge.trim() ? { badge: editingFlavor.badge.trim() } : {}),
        ...(editingFlavor.premium ? { premium: true } : {}),
      },
    };

    const newCategoryPrices: Record<string, Record<string, number>> = {
      ...(menuConfig.categoryPrices || {}),
    };
    for (const cat of CATEGORIES) {
      const priceStr = editingFlavor.prices[cat.slug] || "";
      const price = parseFloat(priceStr.replace(",", "."));
      newCategoryPrices[cat.slug] = {
        ...(newCategoryPrices[cat.slug] || {}),
        [key]: isNaN(price) ? 0 : price,
      };
    }

    await updateMenuConfig({ flavors: newFlavors, categoryPrices: newCategoryPrices });
    setFlavorModalOpen(false);
    setEditingFlavor(null);
    toast.success(editingFlavor.isNew ? "Sabor criado com sucesso! 🍪" : "Sabor atualizado!");
  }

  async function removeFlavorFromCategory(flavorKey: string, categorySlug: string) {
    const newCategoryPrices: Record<string, Record<string, number>> = {
      ...(menuConfig.categoryPrices || {}),
    };

    newCategoryPrices[categorySlug] = {
      ...(newCategoryPrices[categorySlug] || {}),
      [flavorKey]: 0,
    };

    await updateMenuConfig({
      flavors: menuConfig.flavors || {},
      categoryPrices: newCategoryPrices,
    });
    toast.success("Sabor removido com sucesso!");
  }

  function openNewFlavor() {
    setEditingFlavor({
      key: "",
      isNew: true,
      name: "",
      description: "",
      badge: "",
      premium: false,
      prices: Object.fromEntries(CATEGORIES.map((c) => [c.slug, ""])),
    });
    setFlavorModalOpen(true);
  }

  function openEditFlavor(flavor: any) {
    setEditingFlavor({
      key: flavor.key,
      isNew: false,
      name: flavor.name,
      description: flavor.description || "",
      badge: flavor.badge || "",
      premium: !!flavor.premium,
      prices: Object.fromEntries(
        CATEGORIES.map((c) => {
          const overridePrice = (menuConfig.categoryPrices?.[c.slug] as any)?.[flavor.key];
          const basePrice = (c.prices as any)[flavor.key];
          const price = overridePrice ?? basePrice ?? 0;
          return [c.slug, price > 0 ? String(price) : ""];
        })
      ),
    });
    setFlavorModalOpen(true);
  }

  async function load() {
    setRefreshing(true);
    loadConfig();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setRefreshing(false);
    if (error) {
      toast.error("Erro ao carregar", { description: error.message });
      return;
    }
    setOrders((data ?? []) as unknown as OrderRow[]);
  }

  useEffect(() => {
    if (!user || !isAdmin) return;

    localStorage.setItem("is_admin_device", "true");
    load();

    // Set up realtime listener for orders table
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as OrderRow;
            // Add new order at the top of the list
            setOrders((prev) => [newOrder, ...prev]);
            toast.success(`🍪 Novo pedido de ${newOrder.customer_name}!`, {
              description: `Valor: ${Number(newOrder.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
              duration: 8000,
            });
            // Play sweet notification sound
            try {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav");
              audio.volume = 0.5;
              audio.play();
            } catch (_) {}
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as OrderRow;
            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setOrders((prev) => prev.filter((o) => o.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  // Dynamically swap manifest for admin PWA install
  useEffect(() => {
    const link = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
    if (link) {
      link.href = "/admin-manifest.json";
    }
    return () => {
      if (link) {
        link.href = "/manifest.json";
      }
    };
  }, []);

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;

  async function changeStatus(id: string, status: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast.error("Erro", { description: error.message });
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  async function deleteOrder(id: string) {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir", { description: error.message });
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== id));
    toast.success("Pedido excluído com sucesso!");
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  function sendWhatsAppConfirmation(o: OrderRow) {
    let parsedItems: any[] = [];
    try {
      if (Array.isArray(o.items)) parsedItems = o.items;
      else if (typeof o.items === 'string') parsedItems = JSON.parse(o.items);
    } catch (e) {
      parsedItems = [];
    }

    const itemsList = parsedItems.map((i: any) =>
      `* ${i.quantity}x ${i.category} (${i.flavor}${i.premium ? ' Premium' : ''}) - ${formatBRL(i.subtotal)}`
    ).join('\n');

    const firstName = o.customer_name.split(' ')[0];
    const deliveryDate = o.delivery_date.split('-').reverse().join('/');
    const pixInfo = o.payment_method.toLowerCase() === 'pix' ? ' (Chave: isabellyfr2000@gmail.com)' : '';
    const paymentLabel = o.payment_method.toUpperCase();

    const lines = [
      `Ola ${firstName}!`,
      `Sou da Cara de Cooky Gourmet e estou passando para confirmar seu pedido:`,
      ``,
      itemsList,
      ``,
      `Total: ${formatBRL(o.total)}`,
      `Pagamento: ${paymentLabel}${pixInfo}`,
      `Entrega: ${deliveryDate} (a partir das 18h)`,
      ``,
      `Endereco:`,
      `${o.delivery_address || 'Retirada no local'}`,
      ``,
      `Caso queira acompanhar o pedido pelo site:`,
      `https://caradecooky.com.br/track?id=${o.id.slice(0, 8).toUpperCase()}`,
    ];

    const message = lines.join('\n');

    const encodedMessage = encodeURIComponent(message);
    const phone = o.customer_phone.replace(/\D/g, '');
    const finalPhone = phone.length === 11 ? `55${phone}` : phone;
    
    window.open(`https://wa.me/${finalPhone}?text=${encodedMessage}`, '_blank');
  }

  // Lógica de Datas
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA');

  let filteredOrders = orders.filter(o => {
    if (dateFilter === 'hoje' && o.delivery_date !== todayStr) return false;
    if (dateFilter === 'ontem' && o.delivery_date !== yesterdayStr) return false;
    if (dateFilter === 'agendados' && o.delivery_date <= todayStr) return false;
    
    if (statusFilter !== 'todos' && o.status !== statusFilter) return false;
    return true;
  });

  filteredOrders.sort((a, b) => {
    if (STATUS_ORDER[a.status] !== STATUS_ORDER[b.status]) {
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const counts = {
    todos: orders.length,
    hoje: orders.filter(o => o.delivery_date === todayStr).length,
    ontem: orders.filter(o => o.delivery_date === yesterdayStr).length,
    agendados: orders.filter(o => o.delivery_date > todayStr).length,
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <header className="sticky top-0 z-30 border-b border-secondary/30 bg-secondary/10 backdrop-blur-md shadow-sm">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain drop-shadow-md" />
            <span className="font-logo text-base sm:text-lg font-medium uppercase tracking-[0.2em] whitespace-nowrap">
              Cara de Cooky
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <PushButton />
            <Button className="gap-2 bg-gradient-gold text-primary shadow-glow font-bold" size="sm" onClick={load} disabled={refreshing}>
              <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-secondary/30 text-primary bg-background/50 hover:bg-secondary/10 hover:text-primary">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Configurar Produção</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Configurar Loja e Produção</DialogTitle>
                  <DialogDescription>Gerencie o estoque e as datas de entrega.</DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 border-b border-border/50 pb-2 flex-wrap">
                  <button
                    onClick={() => setActiveTab("producao")}
                    className={cn("px-4 py-2 text-sm font-bold rounded-t-xl transition-all", activeTab === "producao" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
                  >
                    Estoque & Produtos
                  </button>
                  <button
                    onClick={() => setActiveTab("sabores")}
                    className={cn("px-4 py-2 text-sm font-bold rounded-t-xl transition-all", activeTab === "sabores" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
                  >
                    Sabores & Preços
                  </button>
                  <button
                    onClick={() => setActiveTab("entregas")}
                    className={cn("px-4 py-2 text-sm font-bold rounded-t-xl transition-all", activeTab === "entregas" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
                  >
                    Dias de Entrega
                  </button>
                </div>

                <div className="py-4">
                  {activeTab === "entregas" ? (
                    <div className="space-y-6">
                      <div>
                        <Label className="mb-3 block font-bold text-primary uppercase tracking-widest text-[10px]">Dias da Semana</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {WEEKDAYS.map((day) => (
                            <div key={day.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`day-${day.id}`} 
                                checked={deliveryConfig.allowed_weekdays.includes(day.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) setDeliveryConfig(prev => ({ ...prev, allowed_weekdays: [...prev.allowed_weekdays, day.id].sort() }));
                                  else setDeliveryConfig(prev => ({ ...prev, allowed_weekdays: prev.allowed_weekdays.filter(d => d !== day.id) }));
                                }}
                              />
                              <Label htmlFor={`day-${day.id}`} className="text-sm font-medium cursor-pointer">{day.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="border-t pt-6">
                        <Label className="mb-3 block font-bold text-primary uppercase tracking-widest text-[10px]">Datas Bloqueadas</Label>
                        <div className="flex gap-2 mb-4">
                          <Input type="date" value={newBlockedDate} onChange={(e) => setNewBlockedDate(e.target.value)} className="flex-1" />
                          <Button size="sm" onClick={() => {
                            if (newBlockedDate && !deliveryConfig.blocked_dates.includes(newBlockedDate)) {
                              setDeliveryConfig(prev => ({ ...prev, blocked_dates: [...prev.blocked_dates, newBlockedDate].sort() }));
                              setNewBlockedDate("");
                            }
                          }}><Plus className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto pr-2">
                          {deliveryConfig.blocked_dates.map(date => (
                            <Badge key={date} variant="secondary" className="gap-1 pr-1 font-mono">
                              {date.split('-').reverse().join('/')}
                              <button onClick={() => setDeliveryConfig(prev => ({ ...prev, blocked_dates: prev.blocked_dates.filter(d => d !== date) }))} className="ml-1 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : activeTab === "sabores" ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="font-bold text-primary uppercase tracking-widest text-[10px]">Sabores do Cardápio</Label>
                        <Button size="sm" className="h-8 gap-1 text-xs" onClick={openNewFlavor}>
                          <Plus className="h-3.5 w-3.5" /> Novo Sabor
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {menuFlavors.map((flavor) => (
                          <div key={flavor.key} className="flex items-start justify-between rounded-xl border border-border/50 p-3 bg-card/50 gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-foreground">{flavor.name}</span>
                                {flavor.premium && (
                                  <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Premium</span>
                                )}
                                {flavor.badge && (
                                  <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{flavor.badge}</span>
                                )}
                              </div>
                              {flavor.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{flavor.description}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
                              onClick={() => openEditFlavor(flavor)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="rounded-xl border border-amber-900/20 bg-amber-50 p-4">
                        <Label className="mb-3 block font-bold text-amber-900 uppercase tracking-widest text-[10px]">Brownies</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="prod-brownie" 
                            checked={!productionConfig.disabled_categories.includes("brownie")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setProductionConfig(prev => ({ ...prev, disabled_categories: prev.disabled_categories.filter(c => c !== "brownie") }));
                              } else {
                                setProductionConfig(prev => ({ ...prev, disabled_categories: [...prev.disabled_categories, "brownie"] }));
                              }
                            }}
                          />
                          <Label htmlFor="prod-brownie" className="text-sm font-bold text-amber-900 cursor-pointer">Brownie Meio Amargo Disponível</Label>
                        </div>
                      </div>

                      {menuCategories.map(cat => (
                        <div key={cat.slug} className="rounded-xl border p-4 bg-card/50">
                          <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                            <Label className="font-bold text-primary uppercase tracking-widest text-[10px]">{cat.name}</Label>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`cat-${cat.slug}`} 
                                checked={!productionConfig.disabled_categories.includes(cat.slug)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setProductionConfig(prev => ({ ...prev, disabled_categories: prev.disabled_categories.filter(c => c !== cat.slug) }));
                                  } else {
                                    setProductionConfig(prev => ({ ...prev, disabled_categories: [...prev.disabled_categories, cat.slug] }));
                                  }
                                }}
                              />
                              <Label htmlFor={`cat-${cat.slug}`} className="text-xs font-bold cursor-pointer">Ativo</Label>
                            </div>
                          </div>
                          
                          <div className={cn("space-y-4 transition-opacity", productionConfig.disabled_categories.includes(cat.slug) && "opacity-50 pointer-events-none")}>
                            {cat.sizes && (
                              <div>
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Tamanhos</Label>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                  {cat.sizes.map(size => {
                                    const sizeKey = `${cat.slug}|${size.label}`;
                                    return (
                                      <div key={sizeKey} className="flex items-center space-x-2">
                                        <Checkbox 
                                          id={`size-${sizeKey}`} 
                                          checked={!productionConfig.disabled_sizes.includes(sizeKey)}
                                          onCheckedChange={(checked) => {
                                            if (checked) setProductionConfig(prev => ({ ...prev, disabled_sizes: prev.disabled_sizes.filter(s => s !== sizeKey) }));
                                            else setProductionConfig(prev => ({ ...prev, disabled_sizes: [...prev.disabled_sizes, sizeKey] }));
                                          }}
                                        />
                                        <Label htmlFor={`size-${sizeKey}`} className="text-xs font-medium cursor-pointer">{size.label}</Label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div>
                              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Sabores</Label>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {menuFlavors.filter(f => {
                                  const price = (cat.prices as any)[f.key];
                                  return price !== undefined && price > 0;
                                }).map(f => {
                                  const flavorKey = `${cat.slug}|${f.key}`;
                                  return (
                                    <div key={flavorKey} className="flex items-center justify-between rounded-md bg-muted/30 p-1.5 gap-2">
                                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                                        <Checkbox 
                                          id={`flavor-${flavorKey}`} 
                                          checked={!productionConfig.disabled_flavors.includes(flavorKey)}
                                          onCheckedChange={(checked) => {
                                            if (checked) setProductionConfig(prev => ({ ...prev, disabled_flavors: prev.disabled_flavors.filter(k => k !== flavorKey) }));
                                            else setProductionConfig(prev => ({ ...prev, disabled_flavors: [...prev.disabled_flavors, flavorKey] }));
                                          }}
                                        />
                                        <Label htmlFor={`flavor-${flavorKey}`} className="text-xs font-medium cursor-pointer truncate flex-1">{f.name}</Label>
                                      </div>
                                      
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                            title={`Remover ${f.name} de ${cat.name}`}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-white">
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Remover sabor da caixinha?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Esta ação removerá o sabor <strong>{f.name}</strong> da categoria <strong>{cat.name}</strong>. Para adicioná-lo de volta, você precisará definir um preço para ele em "Sabores & Preços".
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction 
                                              onClick={() => removeFlavorFromCategory(f.key, cat.slug)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Remover
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <DialogFooter className="border-t border-border/50 pt-4 mt-2">
                  <Button className="w-full bg-gradient-chocolate shadow-glow font-bold" onClick={saveConfig} disabled={isSavingConfig}>
                    {isSavingConfig ? "Salvando..." : "Salvar Alterações Globais"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={logout} className="gap-2 border-secondary/30 text-primary">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl text-primary">Painel de Pedidos</h1>
            <p className="mt-1 text-muted-foreground text-sm uppercase tracking-widest font-bold">Gerencie suas entregas gourmet</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "todos", label: "Todas Datas", count: counts.todos, icon: Inbox },
                { id: "hoje", label: "Hoje", count: counts.hoje, icon: Clock },
                { id: "ontem", label: "Ontem", count: counts.ontem, icon: Clock },
                { id: "agendados", label: "Agendados", count: counts.agendados, icon: Calendar },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDateFilter(f.id as any)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all shadow-sm",
                    dateFilter === f.id ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border bg-card/50 text-muted-foreground hover:border-secondary/50"
                  )}
                >
                  <f.icon className="h-4 w-4" />
                  {f.label}
                  <span className={cn("ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px]", dateFilter === f.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground")}>{f.count}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "todos", label: "Todos Status" },
                { id: "novo", label: "Novos" },
                { id: "em_producao", label: "Em Produção" },
                { id: "saiu_para_entrega", label: "Saiu p/ Entrega" },
                { id: "entregue", label: "Entregues" },
                { id: "cancelado", label: "Cancelados" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id as any)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-sm",
                    statusFilter === s.id ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border bg-card/50 text-muted-foreground hover:border-secondary/50"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-16 text-center text-muted-foreground shadow-inner">
            <Inbox className="mx-auto mb-4 h-12 w-12 opacity-20" />
            Nenhum pedido encontrado.
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOrders.map((o) => (
              <OrderCard 
                key={o.id} 
                o={o} 
                changeStatus={changeStatus} 
                deleteOrder={deleteOrder}
                sendWhatsAppConfirmation={sendWhatsAppConfirmation}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal de edição/criação de sabor */}
      <Dialog open={flavorModalOpen} onOpenChange={(open) => { if (!open) { setFlavorModalOpen(false); setEditingFlavor(null); } }}>
        <DialogContent className="max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFlavor?.isNew ? "Novo Sabor" : "Editar Sabor"}</DialogTitle>
            <DialogDescription>Configure nome, descrição e preços por categoria.</DialogDescription>
          </DialogHeader>
          {editingFlavor && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">Nome do Sabor</Label>
                  <Input
                    value={editingFlavor.name}
                    onChange={(e) => setEditingFlavor((prev) => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Ex: Brigadeiro"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">Descrição (exibida no cardápio)</Label>
                  <Input
                    value={editingFlavor.description}
                    onChange={(e) => setEditingFlavor((prev) => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Ex: Massa crocante com recheio cremoso..."
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">Etiqueta Promocional</Label>
                  <Input
                    value={editingFlavor.badge}
                    onChange={(e) => setEditingFlavor((prev) => prev ? { ...prev, badge: e.target.value } : null)}
                    placeholder="Ex: Novo! ou Promoção de lançamento"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox
                    id="flavor-premium"
                    checked={editingFlavor.premium}
                    onCheckedChange={(checked) => setEditingFlavor((prev) => prev ? { ...prev, premium: !!checked } : null)}
                  />
                  <Label htmlFor="flavor-premium" className="text-sm font-bold cursor-pointer">Premium</Label>
                </div>
              </div>
              <div className="border-t pt-4">
                <Label className="text-xs font-bold text-primary uppercase tracking-widest mb-1 block">Preços por Categoria (R$)</Label>
                <p className="text-[10px] text-muted-foreground mb-3">Deixe em branco para não vender nessa categoria.</p>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => (
                    <div key={cat.slug} className="flex items-center gap-3">
                      <Label className="text-xs font-medium w-36 shrink-0 text-muted-foreground">{cat.name}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-8 text-sm"
                        value={editingFlavor.prices[cat.slug] || ""}
                        onChange={(e) => setEditingFlavor((prev) => prev ? {
                          ...prev,
                          prices: { ...prev.prices, [cat.slug]: e.target.value },
                        } : null)}
                        placeholder="0,00"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => { setFlavorModalOpen(false); setEditingFlavor(null); }}>Cancelar</Button>
            <Button className="bg-gradient-chocolate shadow-glow font-bold" onClick={saveFlavorEdit}>
              {editingFlavor?.isNew ? "Criar Sabor" : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
