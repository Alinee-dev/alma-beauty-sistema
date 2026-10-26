-- Ejecutar en Supabase SQL Editor para habilitar el sitio público del catálogo.
-- La vista pública solo expone productos disponibles y campos necesarios para vender.

DROP POLICY IF EXISTS "Permitir lectura de productos a todos" ON public.products;
DROP POLICY IF EXISTS "Permitir lectura de productos a autenticados" ON public.products;
CREATE POLICY "Permitir lectura de productos a autenticados"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.products FROM PUBLIC, anon;
GRANT SELECT ON public.products TO authenticated;

DROP POLICY IF EXISTS "Lectura pública de configuración (para nombre de tienda en catálogo)"
  ON public.business_settings;
REVOKE SELECT ON public.business_settings FROM PUBLIC, anon;
GRANT SELECT ON public.business_settings TO authenticated;

CREATE OR REPLACE VIEW public.catalog_public_products
  WITH (security_barrier = true)
AS
  SELECT
    id,
    name,
    category,
    sale_price,
    description,
    image_url,
    stock,
    offer_price,
    is_offer_active
  FROM public.products
  WHERE stock > 0;

CREATE OR REPLACE VIEW public.catalog_public_business
  WITH (security_barrier = true)
AS
  SELECT
    name,
    subtitle,
    whatsapp,
    currency,
    instagram
  FROM public.business_settings
  WHERE id = 'main_settings';

REVOKE ALL ON public.catalog_public_products FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.catalog_public_business FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.catalog_public_products TO anon, authenticated;
GRANT SELECT ON public.catalog_public_business TO anon, authenticated;
