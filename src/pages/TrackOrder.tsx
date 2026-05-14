import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Package, Clock, CheckCircle2, XCircle, MessageCircle, ArrowLeft, Truck, Instagram, ChevronRight } from "lucide-react";
import { formatBRL } from "@/data/menu";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_INFO = {
  novo: {
    label: "Recebido",
    description: "Pedido recebido! Estamos conferindo os detalhes para começar a preparar.",
    icon: Clock,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  em_producao: {
    label: "Em Produção",
    description: "Em preparação! Seus cookies estão sendo preparados com todo carinho.",
    icon: Package,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  saiu_para_entrega: {
    label: "Saiu para Entrega",
    description: "Seu pedido saiu para entrega! Prepare o café que os cookies estão chegando.",
    icon: Truck,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  entregue: {
    label: "Entregue",
    description: "Pedido finalizado! Esperamos que você aproveite cada mordida.",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  cancelado: {
    label: "Cancelado",
    description: "Pedido cancelado. Se tiver alguma dúvida, entre em contato conosco.",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
};

const PERIOD_LABELS: Record<string, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

export default function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderIdParam = searchParams.get("id") || "";
  // Mostra apenas os 8 primeiros caracteres no campo de busca para o cliente
  const [orderId, setOrderId] = useState(orderIdParam.length > 8 ? orderIdParam.slice(0, 8).toUpperCase() : orderIdParam);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrder = async (id: string) => {
    if (!id) return;
    const cleanId = id.trim().toLowerCase().replace("#", "");
    setLoading(true);
    
    // Busca os últimos 500 pedidos e filtra no cliente para suportar código curto em coluna UUID
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    setLoading(false);
    if (error) {
      console.error("Erro Supabase:", error);
      toast.error("Erro ao conectar com o servidor");
      return;
    }

    if (!data || data.length === 0) {
      toast.error("Nenhum pedido encontrado no sistema");
      return;
    }

    const found = data.find(o => {
      const orderIdText = o.id.toLowerCase();
      return orderIdText === cleanId || 
             orderIdText.startsWith(cleanId) || 
             orderIdText.includes(cleanId);
    });

    if (!found) {
      toast.error("Pedido não encontrado");
      setOrder(null);
      return;
    }
    setOrder(found);
  };

  useEffect(() => {
    if (orderIdParam) {
      // Sincroniza o campo de busca para mostrar sempre o código curto amigável
      setOrderId(orderIdParam.length > 8 ? orderIdParam.slice(0, 8).toUpperCase() : orderIdParam);
      fetchOrder(orderIdParam);
    }
  }, [orderIdParam]);

  // Atualização em tempo real via Supabase Realtime
  useEffect(() => {
    if (!order?.id) return;

    const channel = supabase
      .channel(`order-status-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          setOrder(payload.new);
          toast.success("O status do seu pedido foi atualizado!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      setSearchParams({ id: orderId.trim() });
      fetchOrder(orderId.trim());
    }
  };

  const status = order ? STATUS_INFO[order.status as keyof typeof STATUS_INFO] : null;

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <SiteHeader />
      
      <main className="container py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl text-primary">Acompanhar Pedido</h1>
            <p className="mt-2 text-muted-foreground">Consulte o status em tempo real da sua encomenda.</p>
          </div>

          <form onSubmit={handleSearch} className="mb-12 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-12 h-14 rounded-2xl border-secondary/30 bg-card/50 shadow-soft focus-visible:ring-secondary"
                placeholder="Digite o código do pedido (Ex: #A1B2C3D4)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-14 rounded-2xl bg-gradient-chocolate px-8 font-bold shadow-glow" disabled={loading}>
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </form>

          {order && status && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="rounded-[2.5rem] border border-secondary/20 bg-gradient-card p-8 md:p-12 shadow-warm text-center">
                <div className="mb-8 flex flex-col items-center">
                  <div className={cn("mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] shadow-glow animate-float", status.bg, status.color)}>
                    <status.icon className="h-12 w-12" />
                  </div>
                  <Badge variant="outline" className={cn("mb-4 px-6 py-1.5 text-xs font-black uppercase tracking-[0.2em]", status.color, "border-current bg-white/50")}>
                    {status.label}
                  </Badge>
                  <h2 className="font-display text-3xl text-primary leading-tight">{status.description}</h2>
                  <p className="mt-4 text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    Código: <span className="font-mono font-black text-primary">#{order.id.slice(0, 8).toUpperCase()}</span>
                  </p>
                </div>

                <div className="mb-8">
                  <div className="rounded-2xl bg-secondary/5 p-4 border border-secondary/10 w-full">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Entrega prevista</p>
                    <p className="font-bold text-primary">{order.delivery_date.split('-').reverse().join('/')}</p>
                  </div>
                </div>

                {(() => {
                  let parsedItems: any[] = [];
                  try {
                    if (Array.isArray(order.items)) parsedItems = order.items;
                    else if (typeof order.items === 'string') parsedItems = JSON.parse(order.items);
                  } catch (e) {
                    parsedItems = [];
                  }

                  return (
                    <div className="mb-8 rounded-2xl bg-background/50 p-5 text-left border border-border/50">
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
                      <div className="mt-6 flex flex-col gap-3 border-t border-border/50 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Endereço</span>
                          <span className="text-sm font-medium text-foreground text-right max-w-[60%] leading-tight">{order.delivery_address || "Retirada no local"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Pagamento</span>
                          <Badge variant="outline" className="font-bold border-secondary/30">{order.payment_method.toUpperCase()}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                          <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Geral</span>
                          <span className="font-display text-2xl font-bold text-primary">{formatBRL(Number(order.total))}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                  <div className="flex flex-col gap-3">
                    <Button asChild className="h-14 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black gap-3 shadow-soft hover:scale-[1.02] transition-transform">
                      <a href="https://wa.me/5543988100558" target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-6 w-6 shrink-0" />
                        <span className="text-sm sm:text-lg">Falar no WhatsApp</span>
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="h-14 rounded-2xl border-primary/20 hover:bg-primary/5 text-primary font-black gap-3 shadow-soft hover:scale-[1.02] transition-transform">
                      <a href="https://instagram.com/caradecooky" target="_blank" rel="noopener noreferrer">
                        <Instagram className="h-6 w-6 shrink-0" />
                        <span className="text-sm sm:text-lg">Siga-nos no Instagram</span>
                      </a>
                    </Button>
                    <Button variant="ghost" asChild className="h-12 rounded-xl gap-2 text-muted-foreground hover:text-primary">
                    <Link to="/">
                      <ArrowLeft className="h-4 w-4" />
                      Voltar para a Loja
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!order && !loading && orderIdParam && (
             <div className="rounded-3xl border border-dashed border-secondary/30 bg-card/50 p-16 text-center text-muted-foreground animate-in fade-in duration-300">
               <XCircle className="mx-auto mb-4 h-12 w-12 opacity-20" />
               <p className="font-medium">Ops! Não encontramos nenhum pedido com esse código.</p>
               <p className="text-xs mt-1">Verifique se o código está correto e tente novamente.</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
