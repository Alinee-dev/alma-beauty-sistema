-- ==============================================================================
-- ALINE BEAUTY & ACCESORIOS - ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase (https://supabase.com/dashboard)
-- 2. En el menú lateral izquierdo, haz clic en "SQL Editor"
-- 3. Crea una "New query", pega todo este contenido y presiona "Run"
-- ==============================================================================

-- 1. TABLA: PRODUCTOS
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  offer_price NUMERIC(12, 2),
  is_offer_active BOOLEAN DEFAULT false,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 2,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. TABLA: VENTAS
CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  profit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'Efectivo',
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. TABLA: GASTOS DEL NEGOCIO
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Otros',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 4. TABLA: USO PERSONAL (PRODUCTOS RETIRADOS PARA SÍ MISMA)
CREATE TABLE IF NOT EXISTS public.personal_use (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  reason TEXT,
  image_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 5. TABLA: CONFIGURACIÓN DEL NEGOCIO
CREATE TABLE IF NOT EXISTS public.business_settings (
  id TEXT PRIMARY KEY DEFAULT 'main_settings',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Aline Beauty',
  subtitle TEXT DEFAULT 'Maquillaje y Accesorios',
  phone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  address TEXT DEFAULT '',
  currency TEXT DEFAULT '$',
  instagram TEXT DEFAULT '',
  logo_url TEXT,
  last_cash_cut TIMESTAMPTZ,
  company_capital NUMERIC(12, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- HABILITAR REALTIME (Sincronización instantánea entre celular y PC)
-- ==============================================================================
BEGIN;
  -- Asegurar que la publicación realtime existe y agregar las tablas
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.products, 
    public.sales, 
    public.expenses, 
    public.personal_use, 
    public.business_settings;
COMMIT;

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- Permite que los usuarios autenticados gestionen sus propios datos,
-- y permite lectura pública de productos para el catálogo de clientes.
-- ==============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_use ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para PRODUCTOS:
-- Cualquiera (clientes públicos) puede ver productos si visita el catálogo:
CREATE POLICY "Permitir lectura de productos a todos" 
  ON public.products FOR SELECT 
  USING (true);

-- Solo usuarios autenticados pueden crear, modificar o eliminar productos:
CREATE POLICY "Permitir inserción de productos a autenticados" 
  ON public.products FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir actualización de productos a autenticados" 
  ON public.products FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir eliminación de productos a autenticados" 
  ON public.products FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Políticas para VENTAS:
CREATE POLICY "Acceso total a ventas para autenticados" 
  ON public.sales FOR ALL 
  USING (auth.role() = 'authenticated');

-- Políticas para GASTOS:
CREATE POLICY "Acceso total a gastos para autenticados" 
  ON public.expenses FOR ALL 
  USING (auth.role() = 'authenticated');

-- Políticas para USO PERSONAL:
CREATE POLICY "Acceso total a uso personal para autenticados" 
  ON public.personal_use FOR ALL 
  USING (auth.role() = 'authenticated');

-- Políticas para CONFIGURACIÓN:
CREATE POLICY "Lectura pública de configuración (para nombre de tienda en catálogo)" 
  ON public.business_settings FOR SELECT 
  USING (true);

CREATE POLICY "Modificación de configuración para autenticados" 
  ON public.business_settings FOR ALL 
  USING (auth.role() = 'authenticated');
