import type { BusinessSettings, Product } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

interface PublicProductRow {
  id: string;
  name: string;
  category: string;
  sale_price: number;
  description: string | null;
  image_url: string | null;
  stock: number;
  offer_price?: number | null;
  is_offer_active?: boolean | null;
}

interface PublicBusinessRow {
  name: string;
  subtitle: string | null;
  whatsapp: string | null;
  currency: string | null;
  instagram: string | null;
}

export interface PublicCatalogData {
  products: Product[];
  settings: BusinessSettings;
}

export const fetchPublicCatalog = async (): Promise<PublicCatalogData> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Falta configurar la conexión pública con Supabase.');
  }

  const [initialProductsResult, businessResult] = await Promise.all([
    supabase
      .from('catalog_public_products')
      .select('id, name, category, sale_price, description, image_url, stock, offer_price, is_offer_active')
      .order('name', { ascending: true }),
    supabase
      .from('catalog_public_business')
      .select('name, subtitle, whatsapp, currency, instagram')
      .maybeSingle(),
  ]);

  let productRows: PublicProductRow[];
  if (
    initialProductsResult.error?.code === '42703' &&
    /offer_price|is_offer_active/.test(initialProductsResult.error.message)
  ) {
    console.warn(
      'La vista pública de productos aún no incluye los precios de oferta. Ejecuta nuevamente supabase_public_catalog.sql para habilitarlos.'
    );
    const compatibleProductsResult = await supabase
      .from('catalog_public_products')
      .select('id, name, category, sale_price, description, image_url, stock')
      .order('name', { ascending: true });
    if (compatibleProductsResult.error) throw compatibleProductsResult.error;
    productRows = (compatibleProductsResult.data ?? []) as PublicProductRow[];
  } else {
    if (initialProductsResult.error) throw initialProductsResult.error;
    productRows = (initialProductsResult.data ?? []) as PublicProductRow[];
  }

  if (businessResult.error) throw businessResult.error;
  if (!businessResult.data) {
    throw new Error('No se encontró la configuración de la tienda en Supabase.');
  }

  const business = businessResult.data as PublicBusinessRow;
  const products = productRows.map((product) => {
    return {
      id: product.id,
      name: product.name,
      category: product.category as Product['category'],
      costPrice: 0,
      salePrice: Number(product.sale_price),
      offerPrice: product.offer_price == null ? undefined : Number(product.offer_price),
      isOfferActive: Boolean(product.is_offer_active),
      stock: Number(product.stock),
      minStock: 0,
      description: product.description ?? undefined,
      imageUrl: product.image_url ?? undefined,
      createdAt: '',
    };
  });

  return {
    products,
    settings: {
      name: business.name,
      subtitle: business.subtitle ?? '',
      phone: '',
      whatsapp: business.whatsapp ?? '',
      address: '',
      currency: business.currency || '$',
      instagram: business.instagram ?? '',
    },
  };
};
