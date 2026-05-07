import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Cookie, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";

import { AnimatedBackground } from "@/components/AnimatedBackground";

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const AdminLogin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (loading) return null;
  if (user && isAdmin) return <Navigate to="/admin" replace />;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!captchaToken) {
      toast.error("Captcha necessário", { description: "Por favor, aguarde o captcha carregar." });
      return;
    }

    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd.entries()));
    if (!parsed.success) {
      toast.error("Dados inválidos", { description: parsed.error.errors[0].message });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        captchaToken: captchaToken,
      },
    });
    setSubmitting(false);
    if (error) {
      let msg = error.message;
      if (msg === "Invalid login credentials") {
        msg = "E-mail ou senha incorretos. (Ou você esqueceu de marcar a caixinha 'Auto Confirm User' ao criar o usuário lá no Supabase!)";
      } else if (msg === "Email not confirmed") {
        msg = "Usuário não confirmado! Exclua ele no Supabase e crie de novo MARCANDO a caixinha 'Auto Confirm User?'.";
      }
      toast.error("Não foi possível entrar", { description: msg });
      return;
    }
    navigate("/admin");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AnimatedBackground />
      <div className="premium-glass-card w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-secondary/20 bg-background/50 p-1 shadow-soft animate-float">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-full w-full object-contain animate-coin-spin"
            />
          </div>
          <h1 className="font-logo text-2xl font-medium uppercase tracking-[0.1em] text-primary">Área administrativa</h1>
          <p className="mt-1 text-sm text-muted-foreground font-medium uppercase tracking-wider">Acesso restrito · Cara de Cooky</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input 
                id="password" 
                name="password" 
                type={showPassword ? "text" : "password"} 
                required 
                autoComplete="current-password" 
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-center py-2">
            <Turnstile 
              siteKey="0x4AAAAAADJgFtG9Jtexvnvw" 
              onSuccess={(token) => setCaptchaToken(token)}
            />
          </div>

          <Button type="submit" className="h-11 w-full bg-gradient-chocolate" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
