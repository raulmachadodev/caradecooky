-- SCRIPT COMPLETO DE CONFIGURAÇÃO DO BANCO DE DADOS E DO ADMINISTRADOR

-- Passo 1: Criar as tabelas e permissões (se ainda não existirem)
-- Rode o bloco abaixo no SQL Editor do Supabase primeiro:

CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins podem ver papéis"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem gerenciar papéis"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Se a tabela de pedidos ainda não existir, crie ela também:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM ('novo', 'em_producao', 'entregue', 'cancelado');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT,
  delivery_date DATE NOT NULL,
  delivery_time TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  items JSONB NOT NULL,
  notes TEXT,
  delivery_fee_note TEXT,
  total NUMERIC(10,2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'novo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Qualquer um pode criar pedido') THEN
        CREATE POLICY "Qualquer um pode criar pedido" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
        CREATE POLICY "Admins veem pedidos" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
        CREATE POLICY "Admins atualizam pedidos" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
        CREATE POLICY "Admins deletam pedidos" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;


-- Passo 2: Transformar seu usuário em Admin
-- Depois de rodar o código acima com sucesso, substitua 'COLOQUE-O-UID-AQUI' pelo seu User UID copiado no Supabase e rode esta linha:

INSERT INTO public.user_roles (user_id, role)
VALUES ('COLOQUE-O-UID-AQUI', 'admin');
