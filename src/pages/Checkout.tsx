import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Trash2, Minus, Plus, ArrowLeft, CheckCircle2, User, RefreshCw, Package } from "lucide-react";
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
    .max(100, "Nome muito longo")
    .regex(/^[\p{L}\s'-]+$/u, "Use apenas letras"),
  customer_phone: z
    .string()
    .trim()
    .min(10, "Telefone inválido")
    .max(20, "Telefone inválido")
    .regex(/^[\d\s()+-]+$/, "Telefone inválido"),
  cep: z.string().min(8, "CEP inválido").max(10),
  street: z.string().min(3, "Rua obrigatória"),
  number: z.string().min(1, "Número obrigatório"),
  neighborhood: z.string().min(2, "Bairro obrigatório"),
  complement: z.string().optional(),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().min(2, "UF obrigatória"),
  delivery_date: z.string().min(1, "Escolha a data"),
  delivery_time: z.string().min(1, "Escolha o período"),
  payment_method: z.enum(["pix", "credito", "debito", "dinheiro"]),
  notes: z.string().trim().max(500, "Observação muito longa").optional(),
});

const Checkout = () => {
  const { items, total, totalLabel, updateQty, remove, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [phone, setPhone] = useState("");

  const formatPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 10) {
      return v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (v.length > 6) {
      return v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else if (v.length > 2) {
      return v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    }
    return v;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const [address, setAddress] = useState({
    cep: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
  });
  const [loadingCEP, setLoadingCEP] = useState(false);

  const formatCEP = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 8) v = v.substring(0, 8);
    return v.replace(/^(\d{5})(\d)/, "$1-$2");
  };

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setAddress(prev => ({ ...prev, cep: formatCEP(e.target.value) }));

    if (rawValue.length === 8) {
      setLoadingCEP(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${rawValue}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setAddress(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          }));
          toast.success("Endereço localizado!");
        } else {
          toast.error("CEP não encontrado.");
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP.");
      } finally {
        setLoadingCEP(false);
      }
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
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
            <p className="mt-3 text-muted-foreground">
              Sua encomenda foi registrada com sucesso. Em breve entraremos em contato pelo WhatsApp
              para combinar a entrega e o pagamento.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Código do pedido: <strong className="text-primary">{confirmed.slice(0, 8)}</strong>
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild className="gap-2 bg-gradient-gold text-primary hover:brightness-110 border-0 shadow-glow font-bold">
                <Link to={`/track?id=${confirmed}`}>
                  <Package className="h-4 w-4" />
                  Acompanhar meu pedido
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="outline">
                <Link to="/">Voltar ao cardápio</Link>
              </Button>
              <Button asChild className="bg-gradient-chocolate">
                <a
                  href="https://wa.me/5543988100558"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Carrinho vazio", { description: "Adicione pelo menos um item." });
      return;
    }

    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const parsed = checkoutSchema.safeParse(raw);

    if (!parsed.success) {
      toast.error("Confira os dados", {
        description: parsed.error.errors[0]?.message ?? "Dados inválidos",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_name: parsed.data.customer_name,
          customer_phone: parsed.data.customer_phone,
          delivery_address: `${parsed.data.street}, ${parsed.data.number}${parsed.data.complement ? ` - ${parsed.data.complement}` : ""} - ${parsed.data.neighborhood}, ${parsed.data.city}/${parsed.data.state} (CEP: ${parsed.data.cep})`,
          delivery_date: parsed.data.delivery_date,
          delivery_time: parsed.data.delivery_time,
          payment_method: parsed.data.payment_method,
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
          delivery_fee_note: parsed.data.delivery_fee_note || null,
          total,
        })
        .select()
        .single();

      if (error) throw error;

      clear();
      if (data) setConfirmed(data.id);
    } catch (error: any) {
      console.error("Erro no checkout:", error);
      toast.error("Erro ao enviar", {
        description: error.message || "Ocorreu um erro inesperado. Verifique sua conexão.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <SiteHeader />
      <main className="container py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Continuar comprando
        </button>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Resumo do pedido */}
          <section className="rounded-2xl border border-border bg-gradient-card p-6 shadow-soft">
            <h1 className="mb-6 font-display text-3xl text-primary">Seu pedido</h1>

            {items.length === 0 ? (
              <p className="rounded-lg bg-muted/40 p-8 text-center text-muted-foreground">
                Seu carrinho está vazio.{" "}
                <Link to="/" className="font-semibold text-primary underline">
                  Ver cardápio
                </Link>
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-primary">
                        {item.categoryName} <span className="text-muted-foreground">· {item.size}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Sabor {item.flavorName}
                        {item.premium && (
                          <span className="ml-2 rounded-full bg-secondary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">
                            Premium
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm font-bold text-primary">
                        {formatBRL(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-border bg-background p-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => remove(item.id)}
                      aria-label="Remover item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {items.length > 0 && (
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <span className="font-display text-xl text-primary">Total</span>
                <span className="font-display text-2xl font-bold text-primary">{totalLabel}</span>
              </div>
            )}
          </section>

          {/* Formulário */}
          <section className="rounded-2xl border border-border bg-gradient-card p-6 shadow-soft">
            <h2 className="mb-6 font-display text-2xl text-primary">Dados para entrega</h2>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="customer_name">Nome e sobrenome</Label>
                <Input id="customer_name" name="customer_name" required maxLength={100} />
              </div>

              <div>
                <Label htmlFor="customer_phone">WhatsApp</Label>
                <Input
                  id="customer_phone"
                  name="customer_phone"
                  required
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(43) 99999-9999"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      name="cep"
                      required
                      value={address.cep}
                      onChange={handleCEPChange}
                      placeholder="00000-000"
                      className={loadingCEP ? "pr-10" : ""}
                    />
                    {loadingCEP && (
                      <div className="absolute right-3 top-2.5">
                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="street">Rua / Logradouro</Label>
                  <Input
                    id="street"
                    name="street"
                    required
                    value={address.street}
                    onChange={handleAddressChange}
                    placeholder="Ex: Rua das Flores"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input id="number" name="number" required placeholder="123" />
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input id="complement" name="complement" placeholder="Apt 402" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    required
                    value={address.neighborhood}
                    onChange={handleAddressChange}
                    placeholder="Centro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    name="city"
                    required
                    value={address.city}
                    onChange={handleAddressChange}
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="state">UF</Label>
                  <Input
                    id="state"
                    name="state"
                    required
                    maxLength={2}
                    value={address.state}
                    onChange={handleAddressChange}
                    className="uppercase"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                <div className="flex-1">
                  <Label htmlFor="delivery_date">Data de entrega</Label>
                  <Input
                    id="delivery_date"
                    name="delivery_date"
                    type="date"
                    required
                    min={today}
                    className="h-12 w-full bg-background/50 rounded-xl border-secondary/30"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="delivery_time">Período preferencial</Label>
                  <Select name="delivery_time" defaultValue="tarde">
                    <SelectTrigger id="delivery_time" className="h-12 bg-background/50 rounded-xl border-secondary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manha">Manhã (08h - 12h)</SelectItem>
                      <SelectItem value="tarde">Tarde (13h - 18h)</SelectItem>
                      <SelectItem value="noite">Noite (18h - 22h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="payment_method">Forma de pagamento</Label>
                <Select name="payment_method" defaultValue="pix">
                  <SelectTrigger id="payment_method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credito">Cartão de crédito</SelectItem>
                    <SelectItem value="debito">Cartão de débito</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="delivery_fee_note">Taxa de entrega</Label>
                <Input
                  id="delivery_fee_note"
                  name="delivery_fee_note"
                  placeholder="A combinar conforme a região"
                  defaultValue="A combinar"
                  maxLength={100}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  A taxa será confirmada por WhatsApp conforme o bairro.
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  maxLength={500}
                  placeholder="Ex: Entregar até as 21h (se possível), alérgico a nozes, tocar a campainha, etc..."
                />
              </div>

              <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
                <p className="mb-1 font-semibold text-foreground">Orientações de pagamento</p>
                <ul className="space-y-1">
                  <li>• Chave PIX (e-mail): isabellyfr2000@gmail.com</li>
                  <li>• Envie o comprovante após o pagamento</li>
                  <li>• Para cartão de crédito, podemos enviar o link de pagamento ou pagamento na entrega</li>
                  <li>• Pagamento até 1h antes do horário de entrega (se possível)</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="h-12 w-full bg-gradient-chocolate text-base"
                disabled={submitting || items.length === 0}
              >
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
