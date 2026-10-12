import { supabase, isSupabaseConfigured } from './supabase';
import type { Product, Sale, Expense, PersonalUseItem, BusinessSettings } from '../types';
import { 
  getProducts as getLocalProducts, 
  saveProducts as saveLocalProducts,
  getSales as getLocalSales,
  saveSales as saveLocalSales,
  getExpenses as getLocalExpenses,
  saveExpenses as saveLocalExpenses,
  getPersonalUse as getLocalPersonalUse,
  savePersonalUse as saveLocalPersonalUse,
  getSettings as getLocalSettings,
  saveSettings as saveLocalSettings
} from './storage';

// --- MAPPERS: TypeScript (camelCase) <-> Supabase (snake_case) ---

interface DbProduct {
  id: string;
  name: string;
  category: string;
  cost_price: number;
  sale_price: number;
  offer_price?: number | null;
  is_offer_active?: boolean | null;
  stock: number;
  min_stock: number;
  description?: string | null;
  image_url?: string | null;
  created_at: string;
  user_id?: string | null;
}

interface DbSale {
  id: string;
  date: string;
  items: unknown;
  subtotal: number;
  discount: number;
  total: number;
  profit: number;
  payment_method: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  notes?: string | null;
  user_id?: string | null;
}

interface DbExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  user_id?: string | null;
}

interface DbPersonalUse {
  id: string;
  product_id: string;
  product_name: string;
  category: string;
  cost_price: number;
  sale_price: number;
  quantity: number;
  date: string;
  reason?: string | null;
  image_url?: string | null;
  user_id?: string | null;
}

interface DbSettings {
  id?: string;
  name: string;
  subtitle?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  currency?: string | null;
  instagram?: string | null;
  logo_url?: string | null;
  last_cash_cut?: string | null;
  company_capital?: number | null;
  user_id?: string | null;
}

export const mapProductFromDb = (item: DbProduct): Product => ({
  id: item.id,
  name: item.name,
  category: item.category as Product['category'],
  costPrice: Number(item.cost_price || 0),
  salePrice: Number(item.sale_price || 0),
  offerPrice: item.offer_price ? Number(item.offer_price) : undefined,
  isOfferActive: Boolean(item.is_offer_active),
  stock: Number(item.stock || 0),
  minStock: Number(item.min_stock || 2),
  description: item.description || undefined,
  imageUrl: item.image_url || undefined,
  createdAt: item.created_at || new Date().toISOString(),
});

export const mapProductToDb = (p: Product, userId?: string): DbProduct => ({
  id: p.id,
  name: p.name,
  category: p.category,
  cost_price: p.costPrice,
  sale_price: p.salePrice,
  offer_price: p.offerPrice ?? null,
  is_offer_active: Boolean(p.isOfferActive),
  stock: p.stock,
  min_stock: p.minStock,
  description: p.description ?? null,
  image_url: p.imageUrl ?? null,
  created_at: p.createdAt,
  user_id: userId ?? null,
});

export const mapSaleFromDb = (item: DbSale): Sale => ({
  id: item.id,
  date: item.date,
  items: Array.isArray(item.items) ? item.items : [],
  subtotal: Number(item.subtotal || 0),
  discount: Number(item.discount || 0),
  total: Number(item.total || 0),
  profit: Number(item.profit || 0),
  paymentMethod: item.payment_method as Sale['paymentMethod'],
  customerName: item.customer_name || undefined,
  customerPhone: item.customer_phone || undefined,
  notes: item.notes || undefined,
});

export const mapSaleToDb = (s: Sale, userId?: string): DbSale => ({
  id: s.id,
  date: s.date,
  items: s.items,
  subtotal: s.subtotal,
  discount: s.discount,
  total: s.total,
  profit: s.profit,
  payment_method: s.paymentMethod,
  customer_name: s.customerName ?? null,
  customer_phone: s.customerPhone ?? null,
  notes: s.notes ?? null,
  user_id: userId ?? null,
});

export const mapExpenseFromDb = (item: DbExpense): Expense => ({
  id: item.id,
  date: item.date,
  description: item.description,
  amount: Number(item.amount || 0),
  category: item.category as Expense['category'],
});

export const mapExpenseToDb = (e: Expense, userId?: string): DbExpense => ({
  id: e.id,
  date: e.date,
  description: e.description,
  amount: e.amount,
  category: e.category,
  user_id: userId ?? null,
});

export const mapPersonalUseFromDb = (item: DbPersonalUse): PersonalUseItem => ({
  id: item.id,
  productId: item.product_id,
  productName: item.product_name,
  category: item.category as PersonalUseItem['category'],
  costPrice: Number(item.cost_price || 0),
  salePrice: Number(item.sale_price || 0),
  quantity: Number(item.quantity || 1),
  date: item.date,
  reason: item.reason || undefined,
  imageUrl: item.image_url || undefined,
});

export const mapPersonalUseToDb = (p: PersonalUseItem, userId?: string): DbPersonalUse => ({
  id: p.id,
  product_id: p.productId,
  product_name: p.productName,
  category: p.category,
  cost_price: p.costPrice,
  sale_price: p.salePrice,
  quantity: p.quantity,
  date: p.date,
  reason: p.reason ?? null,
  image_url: p.imageUrl ?? null,
  user_id: userId ?? null,
});

export const mapSettingsFromDb = (item: DbSettings): BusinessSettings => ({
  name: item.name || 'Aline Beauty',
  subtitle: item.subtitle || 'Maquillaje y Accesorios',
  phone: item.phone || '',
  whatsapp: item.whatsapp || '',
  address: item.address || '',
  currency: item.currency || '$',
  instagram: item.instagram || '',
  logoUrl: item.logo_url || undefined,
  lastCashCut: item.last_cash_cut || undefined,
  companyCapital: Number(item.company_capital || 0),
});

export const mapSettingsToDb = (s: BusinessSettings, userId?: string): DbSettings => ({
  id: 'main_settings',
  name: s.name,
  subtitle: s.subtitle,
  phone: s.phone,
  whatsapp: s.whatsapp,
  address: s.address,
  currency: s.currency,
  instagram: s.instagram,
  logo_url: s.logoUrl ?? null,
  last_cash_cut: s.lastCashCut ?? null,
  company_capital: s.companyCapital ?? 0,
  user_id: userId ?? null,
});

// --- CLOUD FETCH FUNCTIONS ---

export const fetchAllCloudData = async () => {
  if (!isSupabaseConfigured()) return null;

  try {
    const [prodsRes, salesRes, expensesRes, personalRes, settingsRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('sales').select('*').order('date', { ascending: false }),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('personal_use').select('*').order('date', { ascending: false }),
      supabase.from('business_settings').select('*').limit(1).maybeSingle(),
    ]);

    if (prodsRes.error) throw prodsRes.error;
    if (salesRes.error) throw salesRes.error;
    if (expensesRes.error) throw expensesRes.error;
    if (personalRes.error) throw personalRes.error;

    const products = (prodsRes.data || []).map(mapProductFromDb);
    const sales = (salesRes.data || []).map(mapSaleFromDb);
    const expenses = (expensesRes.data || []).map(mapExpenseFromDb);
    const personalUse = (personalRes.data || []).map(mapPersonalUseFromDb);
    const settings = settingsRes.data ? mapSettingsFromDb(settingsRes.data) : null;

    // Cache locally as offline-first backup
    if (products.length > 0) saveLocalProducts(products);
    if (sales.length > 0) saveLocalSales(sales);
    if (expenses.length > 0) saveLocalExpenses(expenses);
    if (personalUse.length > 0) saveLocalPersonalUse(personalUse);
    if (settings) saveLocalSettings(settings);

    return { products, sales, expenses, personalUse, settings };
  } catch (error) {
    console.error('Error fetching data from Supabase:', error);
    return null;
  }
};

// --- CLOUD SYNC MUTATIONS ---

export const syncProductToCloud = async (product: Product, userId?: string) => {
  if (!isSupabaseConfigured()) return;
  try {
    const row = mapProductToDb(product, userId);
    await supabase.from('products').upsert(row);
  } catch (error) {
    console.error('Error syncing product to cloud:', error);
  }
};

export const deleteProductFromCloud = async (productId: string) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('products').delete().eq('id', productId);
  } catch (error) {
    console.error('Error deleting product from cloud:', error);
  }
};

export const syncSaleToCloud = async (sale: Sale, userId?: string) => {
  if (!isSupabaseConfigured()) return;
  try {
    const row = mapSaleToDb(sale, userId);
    await supabase.from('sales').upsert(row);
  } catch (error) {
    console.error('Error syncing sale to cloud:', error);
  }
};

export const deleteSaleFromCloud = async (saleId: string) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('sales').delete().eq('id', saleId);
  } catch (error) {
    console.error('Error deleting sale from cloud:', error);
  }
};

export const syncExpenseToCloud = async (expense: Expense, userId?: string) => {
  if (!isSupabaseConfigured()) return;
  try {
    const row = mapExpenseToDb(expense, userId);
    await supabase.from('expenses').upsert(row);
  } catch (error) {
    console.error('Error syncing expense to cloud:', error);
  }
};

export const deleteExpenseFromCloud = async (expenseId: string) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('expenses').delete().eq('id', expenseId);
  } catch (error) {
    console.error('Error deleting expense from cloud:', error);
  }
};

export const syncPersonalUseToCloud = async (item: PersonalUseItem, userId?: string) => {
  if (!isSupabaseConfigured()) return;
  try {
    const row = mapPersonalUseToDb(item, userId);
    await supabase.from('personal_use').upsert(row);
  } catch (error) {
    console.error('Error syncing personal use to cloud:', error);
  }
};

export const deletePersonalUseFromCloud = async (itemId: string) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('personal_use').delete().eq('id', itemId);
  } catch (error) {
    console.error('Error deleting personal use from cloud:', error);
  }
};

export const syncSettingsToCloud = async (settings: BusinessSettings, userId?: string) => {
  if (!isSupabaseConfigured()) return;
  try {
    const row = mapSettingsToDb(settings, userId);
    await supabase.from('business_settings').upsert(row);
  } catch (error) {
    console.error('Error syncing settings to cloud:', error);
  }
};

// --- MIGRATION TOOL: Upload local data to Supabase ---
export const uploadLocalDataToSupabase = async (userId?: string): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase no está configurado.' };
  }

  try {
    const localProducts = getLocalProducts();
    const localSales = getLocalSales();
    const localExpenses = getLocalExpenses();
    const localPersonalUse = getLocalPersonalUse();
    const localSettings = getLocalSettings();

    // 1. Upload products
    if (localProducts.length > 0) {
      const dbProds = localProducts.map(p => mapProductToDb(p, userId));
      const { error: pErr } = await supabase.from('products').upsert(dbProds);
      if (pErr) throw pErr;
    }

    // 2. Upload sales
    if (localSales.length > 0) {
      const dbSales = localSales.map(s => mapSaleToDb(s, userId));
      const { error: sErr } = await supabase.from('sales').upsert(dbSales);
      if (sErr) throw sErr;
    }

    // 3. Upload expenses
    if (localExpenses.length > 0) {
      const dbExp = localExpenses.map(e => mapExpenseToDb(e, userId));
      const { error: eErr } = await supabase.from('expenses').upsert(dbExp);
      if (eErr) throw eErr;
    }

    // 4. Upload personal use
    if (localPersonalUse.length > 0) {
      const dbPu = localPersonalUse.map(pu => mapPersonalUseToDb(pu, userId));
      const { error: puErr } = await supabase.from('personal_use').upsert(dbPu);
      if (puErr) throw puErr;
    }

    // 5. Upload settings
    if (localSettings) {
      const dbSett = mapSettingsToDb(localSettings, userId);
      const { error: settErr } = await supabase.from('business_settings').upsert(dbSett);
      if (settErr) throw settErr;
    }

    return { 
      success: true, 
      message: `¡Migración exitosa! Se subieron ${localProducts.length} productos, ${localSales.length} ventas y ${localExpenses.length} gastos a la nube.` 
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error al subir datos a la nube';
    return { success: false, message: errorMsg };
  }
};
