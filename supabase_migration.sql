-- ═══════════════════════════════════════════════════════════
--  VIERAFRIK — Migration Supabase Complète
--  Exécuter dans : Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── Extensions ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. PROFILES ──
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  business_name TEXT DEFAULT 'Mon Entreprise',
  country       TEXT DEFAULT 'CI',
  currency      TEXT DEFAULT 'XOF',
  phone         TEXT DEFAULT '',
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','business')),
  goal_amount   NUMERIC DEFAULT 2500000,
  accent_color  TEXT DEFAULT '#00d478',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, business_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'business_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. CLIENTS ──
CREATE TABLE IF NOT EXISTS public.clients (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT DEFAULT '',
  email      TEXT DEFAULT '',
  country    TEXT DEFAULT 'CI',
  category   TEXT DEFAULT 'Commerce',
  status     TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  total_ca   NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_own" ON public.clients FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS clients_user_idx ON public.clients(user_id);

-- ── 3. TRANSACTIONS ──
CREATE TABLE IF NOT EXISTS public.transactions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('sale','expense')),
  amount     NUMERIC NOT NULL CHECK (amount > 0),
  category   TEXT NOT NULL,
  who        TEXT DEFAULT '',
  note       TEXT DEFAULT '',
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_own" ON public.transactions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS transactions_user_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON public.transactions(date);

-- ── 4. INVOICES ──
CREATE TABLE IF NOT EXISTS public.invoices (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id        UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_number   TEXT NOT NULL,
  client_name      TEXT NOT NULL,
  client_phone     TEXT DEFAULT '',
  status           TEXT DEFAULT 'pending' CHECK (status IN ('paid','pending','overdue')),
  issue_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date         DATE,
  subtotal         NUMERIC DEFAULT 0,
  tax              NUMERIC DEFAULT 0,
  total            NUMERIC DEFAULT 0,
  notes            TEXT DEFAULT '',
  pdf_url          TEXT DEFAULT '',
  payment_provider TEXT DEFAULT '',
  payment_status   TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','failed')),
  payment_reference TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, invoice_number)
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_own" ON public.invoices FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS invoices_user_idx ON public.invoices(user_id);

-- ── 5. INVOICE_ITEMS ──
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  qty        NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  line_total NUMERIC GENERATED ALWAYS AS (qty * unit_price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_own" ON public.invoice_items FOR ALL USING (
  invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid())
) WITH CHECK (
  invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid())
);

-- ── 6. GOALS ──
CREATE TABLE IF NOT EXISTS public.goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month         TEXT NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 2500000,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_own" ON public.goals FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 7. PAYMENTS (anti double-paiement) ──
CREATE TABLE IF NOT EXISTS public.payments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  provider   TEXT NOT NULL,
  reference  TEXT NOT NULL UNIQUE,
  amount     NUMERIC NOT NULL,
  status     TEXT DEFAULT 'paid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_own" ON public.payments FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

SELECT 'Migration VierAfrik OK ✅' AS status;
