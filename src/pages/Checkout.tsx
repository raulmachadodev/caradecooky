import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Trash2, Minus, Plus, ArrowLeft, CheckCircle2, User, RefreshCw, Package, CreditCard, Coins, QrCode } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/data/menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnimatedBackground } from "@/components/AnimatedBackground";

// validação anti-injeção / formato
const checkoutSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo")
    .max(30, "Nome deve ter no máximo 30 caracteres")
    .regex(/^[\p{L}\s'-]+$/u, "Use apenas letras"),
  customer_phone: z
    .string()
    .trim()
    .min(10, "Telefone inválido")
    .max(20, "Telefone inválido")
    .regex(/^[\d\s()+-]+$/, "Telefone inválido"),
  cep: z.string().min(8, "CEP inválido").max(10),
  address_combined: z.string().min(5, "Endereço obrigatório"),
  complement: z.string().optional(),
  delivery_date: z.string().min(1, "Escolha a data"),
  notes: z.string().trim().max(500, "Observação muito longa").optional(),
});

interface DeliveryConfig {
  allowed_weekdays: number[];
  blocked_dates: string[];
}

const Checkout = () => {
  const { items, total, totalLabel, updateQty, remove, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credito" | "debito" | "dinheiro">("pix");

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("id", "delivery_config")
        .maybeSingle();
        
      if (data?.value) {
        const config = data.value as unknown as DeliveryConfig;
        setDeliveryConfig(config);

        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 30; i++) {
          const yyyy = currentDate.getFullYear();
          const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
          const dd = String(currentDate.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;
          const weekday = currentDate.getDay();

          if (config.allowed_weekdays.includes(weekday) && !config.blocked_dates.includes(dateStr)) {
            setSelectedDate(dateStr);
            break;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }
    loadConfig();
  }, []);

  const formatPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 10) return v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (v.length > 6) return v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    return v;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const [address, setAddress] = useState({
    cep: "",
    address_combined: "",
  });
  const [loadingCEP, setLoadingCEP] = useState(false);

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setAddress(prev => ({ ...prev, cep: rawValue.replace(/^(\d{5})(\d)/, "$1-$2").substring(0, 9) }));

    if (rawValue.length === 8) {
      setLoadingCEP(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${rawValue}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setAddress(prev => ({
            ...prev,
            address_combined: `${data.logradouro}, ${data.localidade}/${data.uf}, ${data.bairro}`
          }));
        }
      } catch (error) { /* ignore */ } finally { setLoadingCEP(false); }
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    
    if (!newDate || !deliveryConfig) return;

    const dateObj = new Date(newDate + 'T00:00:00');
    const weekday = dateObj.getDay();

    if (!deliveryConfig.allowed_weekdays.includes(weekday)) {
      toast.error("Não realizamos entregas neste dia da semana.");
      setSelectedDate("");
      return;
    }

    if (deliveryConfig.blocked_dates.includes(newDate)) {
      toast.error("Esta data específica não está disponível para entregas.");
      setSelectedDate("");
      return;
    }
  };

  if (confirmed) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <SiteHeader />
        <main className="container py-16">
          <div className="mx-auto max-w-xl rounded-3xl border border-border bg-gradient-card p-10 text-center shadow-warm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-gold">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary">Pedido recebido!</h1>
            <p className="mt-3 text-muted-foreground">Sua encomenda foi registrada com sucesso. Em breve entraremos em contato pelo WhatsApp.</p>
            <p className="mt-2 text-xs text-muted-foreground">Código: <strong className="text-primary">{confirmed.slice(0, 8)}</strong></p>
            <div className="mt-6 flex justify-center">
              <Button asChild className="gap-2 bg-gradient-gold text-primary shadow-glow font-bold"><Link to={`/track?id=${confirmed}`}><Package className="h-4 w-4" />Acompanhar pedido</Link></Button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) return toast.error("Carrinho vazio");

    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const parsed = checkoutSchema.safeParse(raw);

    if (!parsed.success) {
      toast.error("Confira os dados", { description: parsed.error.errors[0]?.message });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("orders").insert({
        customer_name: parsed.data.customer_name,
        customer_phone: parsed.data.customer_phone,
        delivery_address: `${parsed.data.address_combined}${parsed.data.complement ? ` - ${parsed.data.complement}` : ""}`,
        delivery_date: parsed.data.delivery_date,
        delivery_time: "tarde",
        payment_method: paymentMethod,
        items: items.map((i) => ({
          category: i.categoryName,
          size: i.size,
          flavor: i.flavorName,
          premium: i.premium,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          subtotal: i.unitPrice * i.quantity,
        })),
        notes: parsed.data.notes || null,
        delivery_fee_note: "A combinar",
        total,
      }).select().single();

      if (error) throw error;
      clear();
      if (data) setConfirmed(data.id);
    } catch (error: any) {
      toast.error("Erro ao enviar", { description: error.message });
    } finally { setSubmitting(false); }
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <SiteHeader />
      <main className="container py-10">
        <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Continuar comprando
        </button>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-border bg-gradient-card p-6 shadow-soft">
            <h1 className="mb-6 font-display text-3xl text-primary">Seu pedido</h1>
            {items.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">Vazio. <Link to="/" className="text-primary underline">Ver cardápio</Link></p>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-primary">{item.categoryName} · {item.size}</p>
                      <p className="text-sm text-muted-foreground">{item.flavorName} {item.premium && <span className="text-accent font-bold">Premium</span>}</p>
                      <p className="text-sm font-bold text-primary">{formatBRL(item.unitPrice * item.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-border bg-background p-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <span className="font-display text-xl text-primary">Total</span>
              <span className="font-display text-2xl font-bold text-primary">{totalLabel}</span>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-gradient-card p-6 shadow-soft">
            <h2 className="mb-6 font-display text-2xl text-primary">Dados para entrega</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="customer_name">Seu nome</Label>
                <Input id="customer_name" name="customer_name" required maxLength={30} placeholder="Digite seu nome" />
              </div>
              <div>
                <Label htmlFor="customer_phone">WhatsApp</Label>
                <Input id="customer_phone" name="customer_phone" required type="tel" value={phone} onChange={handlePhoneChange} placeholder="(43) 99999-9999" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" name="cep" required value={address.cep} onChange={handleCEPChange} placeholder="00000-000" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address_combined">Endereço</Label>
                  <Textarea id="address_combined" name="address_combined" required value={address.address_combined} onChange={handleAddressChange} placeholder="Rua, Número, Cidade/UF, Bairro" rows={1} className="resize-none" />
                </div>
              </div>
              <div className="w-full">
                <Input id="complement" name="complement" placeholder="Complemento (Opcional, ex: Bloco 2, Apto 34)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Data de Entrega</Label>
                <Input id="delivery_date" name="delivery_date" type="date" required min={today} value={selectedDate} onChange={handleDateChange} className="h-12 rounded-xl border-secondary/30" />
                <div className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3">
                  <p className="text-sm text-amber-900 font-semibold leading-relaxed">
                    Nossas entregas do dia s&atilde;o realizadas <strong className="text-amber-950">a partir das 18h</strong>.
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Caso precise receber mais cedo, pedimos que fa&ccedil;a sua encomenda com um dia de anteced&ecirc;ncia para prepararmos tudo com carinho. &hearts;
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pix")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-all duration-300 ${
                      paymentMethod === "pix"
                        ? "bg-gradient-gold text-primary shadow-glow font-bold border-transparent scale-[1.02]"
                        : "border-border bg-background text-primary hover:bg-muted/20"
                    }`}
                  >
                    <QrCode className="h-5 w-5 shrink-0" />
                    <span className="text-sm">PIX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("debito")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-all duration-300 ${
                      paymentMethod === "debito"
                        ? "bg-gradient-gold text-primary shadow-glow font-bold border-transparent scale-[1.02]"
                        : "border-border bg-background text-primary hover:bg-muted/20"
                    }`}
                  >
                    <CreditCard className="h-5 w-5 shrink-0" />
                    <span className="text-sm">Débito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("credito")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-all duration-300 ${
                      paymentMethod === "credito"
                        ? "bg-gradient-gold text-primary shadow-glow font-bold border-transparent scale-[1.02]"
                        : "border-border bg-background text-primary hover:bg-muted/20"
                    }`}
                  >
                    <CreditCard className="h-5 w-5 shrink-0" />
                    <span className="text-sm">Crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("dinheiro")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-all duration-300 ${
                      paymentMethod === "dinheiro"
                        ? "bg-gradient-gold text-primary shadow-glow font-bold border-transparent scale-[1.02]"
                        : "border-border bg-background text-primary hover:bg-muted/20"
                    }`}
                  >
                    <Coins className="h-5 w-5 shrink-0" />
                    <span className="text-sm">Dinheiro</span>
                  </button>
                </div>
              </div>

              <Textarea id="notes" name="notes" rows={2} maxLength={500} placeholder="Observações (ex: troco, ponto de referência)" />
              
              <div className="rounded-xl bg-muted/40 p-4 text-[11px] text-muted-foreground border border-border/50">
                <p className="mb-2 font-bold text-primary uppercase tracking-widest text-[10px]">Forma de Pagamento e Entrega</p>
                <ul className="space-y-1">
                  {paymentMethod === "pix" && (
                    <>
                      <li>• <strong>Chave PIX para pagamento:</strong> isabellyfr2000@gmail.com</li>
                      <li>• Envie o comprovante via WhatsApp após finalizar o pedido</li>
                    </>
                  )}
                  <li>• <strong>Horario de Entrega:</strong> A partir das 18h</li>
                  <li>• <strong>Taxa de Entrega:</strong> A combinar de acordo com a regiao</li>
                </ul>
              </div>

              <Button type="submit" className="h-12 w-full bg-gradient-chocolate text-base font-bold shadow-glow" disabled={submitting || items.length === 0}>
                {submitting ? "Enviando..." : `Confirmar pedido · ${totalLabel}`}
              </Button>
            </form>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Checkout;
