import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { LogOut, Cookie, RefreshCw, Calendar, Clock, Inbox, ChevronRight, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { formatBRL } from "@/data/menu";
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

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"todos" | "hoje" | "ontem" | "agendados">("todos");

  async function load() {
    setRefreshing(true);
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
    if (user && isAdmin) load();
  }, [user, isAdmin]);

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

    const itemsList = parsedItems.map(i => 
      `• ${i.quantity}x ${i.category} (${i.flavor}${i.premium ? ' Premium' : ''}) - ${formatBRL(i.subtotal)}`
    ).join('\n');

    const message = `Olá ${o.customer_name}! 🍪
Sou da *Cara de Cooky* e estou passando para confirmar seu pedido:

${itemsList}

*Total: ${formatBRL(o.total)}*
*Pagamento:* ${o.payment_method.toUpperCase()}
*Entrega:* ${o.delivery_date.split('-').reverse().join('/')} (${PERIOD_LABELS[o.delivery_time] || o.delivery_time})

📍 *Endereço:*
${o.delivery_address || 'Retirada no local'}

Podemos prosseguir com a produção?`;

    const encodedMessage = encodeURIComponent(message);
    const phone = o.customer_phone.replace(/\D/g, '');
    const finalPhone = phone.length === 11 ? `55${phone}` : phone;
    
    window.open(`https://wa.me/${finalPhone}?text=${encodedMessage}`, '_blank');
  }

  // Lógica de Datas (considerando fuso horário local)
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD local
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA');

  // Ordenação: Novo primeiro, depois por criação
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.status === 'novo' && b.status !== 'novo') return -1;
    if (a.status !== 'novo' && b.status === 'novo') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Filtragem
  const filteredOrders = sortedOrders.filter(o => {
    if (filter === 'todos') return true;
    if (filter === 'hoje') return o.delivery_date === todayStr;
    if (filter === 'ontem') return o.delivery_date === yesterdayStr;
    if (filter === 'agendados') return o.delivery_date > todayStr;
    return true;
  });

  // Contadores
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
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-10 w-10 object-contain drop-shadow-md"
            />
            <span className="font-logo text-base sm:text-lg font-medium uppercase tracking-[0.2em] animate-shine-text whitespace-nowrap">
              Cara de Cooky
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button 
              className="gap-2 bg-gradient-gold text-primary hover:brightness-110 border-0 shadow-glow font-bold"
              size="sm" 
              onClick={load} 
              disabled={refreshing}
            >
              <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
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
          
          <div className="flex flex-wrap gap-2">
            {[
              { id: "todos", label: "Todos", count: counts.todos, icon: Inbox },
              { id: "hoje", label: "Hoje", count: counts.hoje, icon: Clock },
              { id: "ontem", label: "Ontem", count: counts.ontem, icon: Clock },
              { id: "agendados", label: "Agendados", count: counts.agendados, icon: Calendar },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all shadow-sm",
                  filter === f.id 
                    ? "border-primary bg-primary text-primary-foreground shadow-glow" 
                    : "border-border bg-card/50 text-muted-foreground hover:border-secondary/50"
                )}
              >
                <f.icon className="h-4 w-4" />
                {f.label}
                <span className={cn(
                  "ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px]",
                  filter === f.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-16 text-center text-muted-foreground shadow-inner">
            <Inbox className="mx-auto mb-4 h-12 w-12 opacity-20" />
            Nenhum pedido encontrado para este filtro.
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOrders.map((o) => (
              <SpotlightCard
                key={o.id}
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
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="font-display text-2xl text-primary">{o.customer_name}</h2>
                          <Badge variant={STATUS_VARIANT[o.status]} className="font-bold uppercase tracking-wider">
                            {STATUS_LABEL[o.status]}
                          </Badge>
                          {o.status === 'novo' && (
                            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                          )}
                          
                          <Button 
                            size="sm" 
                            onClick={() => sendWhatsAppConfirmation(o)}
                            className="h-8 w-8 rounded-full bg-[#25D366] p-0 hover:bg-[#128C7E] text-white shadow-glow ml-auto"
                            title="Confirmar via WhatsApp"
                          >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .014 5.398 0 12.037c0 2.125.556 4.2 1.611 6.062L0 24l6.105-1.603a11.803 11.803 0 005.94 1.597h.005c6.637 0 12.036-5.399 12.04-12.038a11.82 11.82 0 00-3.576-8.513"/>
                            </svg>
                          </Button>
                        </div>
                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                          {o.customer_phone} · ID: <span className="font-mono text-xs font-bold text-primary">#{o.id.slice(0, 8).toUpperCase()}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[180px]">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Alterar Status</Label>
                      <Select
                        value={o.status}
                        onValueChange={(v) => changeStatus(o.id, v as OrderStatus)}
                      >
                        <SelectTrigger className="rounded-xl border-secondary/30 bg-background/50">
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
                                <span className="font-bold text-primary">{new Date(o.delivery_date).toLocaleDateString("pt-BR")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground font-medium">Período:</span>
                                <span className="font-bold text-primary uppercase">{PERIOD_LABELS[o.delivery_time] || o.delivery_time}</span>
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
