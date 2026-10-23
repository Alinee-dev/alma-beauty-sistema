import { supabase, isSupabaseConfigured } from './supabase';
import type { Product, Sale, SalePayment, Expense, PersonalUseItem, BusinessSettings } from '../types';
import {
  normalizeExpenseMoney,
  normalizePersonalUseMoney,
  normalizeProductMoney,
  normalizeSaleMoney,
  normalizeSettingsMoney,
} from './money';
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

const PENDING_SALES_KEY = 'aline_beauty_pending_sales_v1';
const PENDING_SALE_DELETIONS_KEY = 'aline_beauty_pending_sale_deletions_v1';
const SURPRISE_BAG_NOTE_PREFIX = '[ALINE_SURPRISE_BAG]\n';

const isSale = (value: unknown): value is Sale => {
  if (!value || typeof value !== 'object') return false;
  const sale = value as Partial<Sale>;
  return (
    typeof sale.id === 'string' &&
    typeof sale.date === 'string' &&
    Array.isArray(sale.items) &&
    typeof sale.total === 'number'
  );
};

const getPendingSales = (): Sale[] => {
  try {
    const stored = localStorage.getItem(PENDING_SALES_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter(isSale).map(normalizeSaleMoney)
      : [];
  } catch (error) {
    console.error('Error loading pending sales:', error);
    return [];
  }
};

const savePendingSales = (sales: Sale[]): void => {
  localStorage.setItem(
    PENDING_SALES_KEY,
    JSON.stringify(sales.map(normalizeSaleMoney))
  );
};

const getPendingSaleDeletions = (): string[] => {
  try {
    const stored = localStorage.getItem(PENDING_SALE_DELETIONS_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((saleId): saleId is string => typeof saleId === 'string')
      : [];
  } catch (error) {
    console.error('Error loading pending sale deletions:', error);
    return [];
  }
};

const savePendingSaleDeletions = (saleIds: string[]): void => {
  localStorage.setItem(PENDING_SALE_DELETIONS_KEY, JSON.stringify(saleIds));
};

export interface CloudSyncResult {
  success: boolean;
  error?: string;
  warning?: string;
}

const getCloudErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : 'Error desconocido al sincronizar con la nube.';

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
  payments?: unknown;
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

export const mapProductFromDb = (item: DbProduct): Product => normalizeProductMoney({
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

export const mapProductToDb = (product: Product, userId?: string): DbProduct => {
  const p = normalizeProductMoney(product);
  return ({
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
};

export const mapSaleFromDb = (item: DbSale): Sale => {
  const storedNotes = item.notes || undefined;
  const isSurpriseBag = storedNotes?.startsWith(SURPRISE_BAG_NOTE_PREFIX) ?? false;
  const notes = isSurpriseBag
    ? (storedNotes ?? '').slice(SURPRISE_BAG_NOTE_PREFIX.length) || undefined
    : storedNotes;

  return normalizeSaleMoney({
    id: item.id,
    date: item.date,
    items: Array.isArray(item.items) ? item.items : [],
    subtotal: Number(item.subtotal || 0),
    discount: Number(item.discount || 0),
    total: Number(item.total || 0),
    profit: Number(item.profit || 0),
    paymentMethod: item.payment_method as Sale['paymentMethod'],
    payments: Array.isArray(item.payments)
      ? item.payments as SalePayment[]
      : undefined,
    customerName: item.customer_name || undefined,
    customerPhone: item.customer_phone || undefined,
    notes,
    isSurpriseBag,
  });
};

export const mapSaleToDb = (sale: Sale, userId?: string): DbSale => {
  const s = normalizeSaleMoney(sale);
  const notes = s.isSurpriseBag
    ? `${SURPRISE_BAG_NOTE_PREFIX}${s.notes ?? ''}`
    : s.notes ?? null;
  return ({
  id: s.id,
  date: s.date,
  items: s.items,
  subtotal: s.subtotal,
  discount: s.discount,
  total: s.total,
  profit: s.profit,
  payment_method: s.paymentMethod,
  payments: s.payments ?? [],
  customer_name: s.customerName ?? null,
  customer_phone: s.customerPhone ?? null,
  notes,
  user_id: userId ?? null,
  });
};

export const mapExpenseFromDb = (item: DbExpense): Expense => normalizeExpenseMoney({
  id: item.id,
  date: item.date,
  description: item.description,
  amount: Number(item.amount || 0),
  category: item.category as Expense['category'],
});

export const mapExpenseToDb = (expense: Expense, userId?: string): DbExpense => {
  const e = normalizeExpenseMoney(expense);
  return ({
  id: e.id,
  date: e.date,
  description: e.description,
  amount: e.amount,
  category: e.category,
  user_id: userId ?? null,
  });
};

export const mapPersonalUseFromDb = (item: DbPersonalUse): PersonalUseItem => normalizePersonalUseMoney({
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

export const mapPersonalUseToDb = (personalUse: PersonalUseItem, userId?: string): DbPersonalUse => {
  const p = normalizePersonalUseMoney(personalUse);
  return ({
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
};

export const mapSettingsFromDb = (item: DbSettings): BusinessSettings => normalizeSettingsMoney({
  name: item.name || 'Aline Beauty',
  subtitle: item.subtitle || 'Maquillaje y Accesorios',
  phone: item.phone || '',
  whatsapp: item.whatsapp || '',
  address: item.address || '',
  currency: item.currency || '$',
  instagram: item.instagram || '',
  logoUrl: item.logo_url || undefined,
  lastCashCut: item.last_cash_cut || undefined,
  companyCapital:
    item.company_capital == null ? undefined : Number(item.company_capital),
});

export const mapSettingsToDb = (settings: BusinessSettings, userId?: string): DbSettings => {
  const s = normalizeSettingsMoney(settings);
  return ({
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
};

// --- CLOUD FETCH FUNCTIONS ---

export const fetchAllCloudData = async (includeSettings = true) => {
  if (!isSupabaseConfigured()) return null;

  try {
    const [prodsRes, salesRes, expensesRes, personalRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('sales').select('*').order('date', { ascending: false }),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('personal_use').select('*').order('date', { ascending: false }),
    ]);

    if (prodsRes.error) throw prodsRes.error;
    if (salesRes.error) throw salesRes.error;
    if (expensesRes.error) throw expensesRes.error;
    if (personalRes.error) throw personalRes.error;

    const settingsRes = includeSettings
      ? await supabase.from('business_settings').select('*').limit(1).maybeSingle()
      : null;
    if (settingsRes?.error) throw settingsRes.error;

    const products = (prodsRes.data || []).map(mapProductFromDb);
    const pendingSaleDeletions = new Set(getPendingSaleDeletions());
    const cloudSales = (salesRes.data || [])
      .map(mapSaleFromDb)
      .filter((sale) => !pendingSaleDeletions.has(sale.id));
    const cloudSaleIds = new Set(cloudSales.map((sale) => sale.id));
    const pendingSales = getPendingSales();
    const localCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recoverableLocalSales = getLocalSales().filter(
      (sale) =>
        /^SALE-\d{6}$/.test(sale.id) &&
        new Date(sale.date).getTime() >= localCutoff &&
        !cloudSaleIds.has(sale.id) &&
        !pendingSales.some((pendingSale) => pendingSale.id === sale.id)
    );
    const allPendingSales = [...pendingSales, ...recoverableLocalSales];
    if (recoverableLocalSales.length > 0) {
      savePendingSales(allPendingSales);
    }
    const pendingCloudSales = allPendingSales.filter((sale) =>
      cloudSaleIds.has(sale.id)
    );
    const sales = [
      ...cloudSales,
      ...allPendingSales.filter((sale) => !cloudSaleIds.has(sale.id)),
    ];
    if (pendingCloudSales.length > 0) {
      const syncedIds = new Set(pendingCloudSales.map((sale) => sale.id));
      savePendingSales(allPendingSales.filter((sale) => !syncedIds.has(sale.id)));
    }
    const expenses = (expensesRes.data || []).map(mapExpenseFromDb);
    const personalUse = (personalRes.data || []).map(mapPersonalUseFromDb);
    const cloudSettings = settingsRes?.data
      ? mapSettingsFromDb(settingsRes.data)
      : null;
    const localSettings = getLocalSettings();
    const localCutTime = localSettings.lastCashCut
      ? new Date(localSettings.lastCashCut).getTime()
      : 0;
    const cloudCutTime = cloudSettings?.lastCashCut
      ? new Date(cloudSettings.lastCashCut).getTime()
      : 0;
    const settings = cloudSettings
      ? {
          ...cloudSettings,
          companyCapital:
            localCutTime > cloudCutTime
              ? localSettings.companyCapital
              : cloudSettings.companyCapital ?? localSettings.companyCapital,
          lastCashCut:
            localCutTime > cloudCutTime
              ? localSettings.lastCashCut
              : cloudSettings.lastCashCut,
        }
      : null;

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

export const syncProductToCloud = async (product: Product, userId?: string): Promise<CloudSyncResult> => {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const row = mapProductToDb(product, userId);
    const { error } = await supabase.from('products').upsert(row);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error syncing product to cloud:', error);
    return { success: false, error: getCloudErrorMessage(error) };
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

export const syncSaleToCloud = async (sale: Sale, userId?: string): Promise<CloudSyncResult> => {
  if (getPendingSaleDeletions().includes(sale.id)) return { success: true };
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const row = mapSaleToDb(sale, userId);
    let warning: string | undefined;
    let { error } = await supabase.from('sales').upsert(row);

    if (
      error &&
      error.message.includes("Could not find the 'payments' column of 'sales' in the schema cache")
    ) {
      const legacyRow = { ...row };
      delete legacyRow.payments;
      const retry = await supabase.from('sales').upsert(legacyRow);
      error = retry.error;
      if (!error) {
        warning =
          "La venta se guardó en la nube, pero los pagos aún no se sincronizaron. Ejecuta en Supabase: ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payments JSONB NOT NULL DEFAULT '[]'::jsonb;. La aplicación reintentará sincronizarlos después.";
      }
    }
    if (error) throw error;

    if (getPendingSaleDeletions().includes(sale.id)) {
      return deleteSaleFromCloud(sale.id);
    }
    if (!warning) {
      const pendingSales = getPendingSales().filter(
        (pendingSale) => pendingSale.id !== sale.id
      );
      savePendingSales(pendingSales);
    }
    return { success: true, warning };
  } catch (error) {
    console.error('Error syncing sale to cloud:', error);
    try {
      if (!getPendingSaleDeletions().includes(sale.id)) {
        const pendingSales = getPendingSales();
        savePendingSales([
          sale,
          ...pendingSales.filter((pendingSale) => pendingSale.id !== sale.id),
        ]);
      }
    } catch (storageError) {
      console.error('Error preserving unsynced sale locally:', storageError);
    }
    return { success: false, error: getCloudErrorMessage(error) };
  }
};

export const syncPendingSalesToCloud = async (userId?: string): Promise<void> => {
  for (const saleId of getPendingSaleDeletions()) {
    try {
      const { error } = await supabase.from('sales').delete().eq('id', saleId);
      if (error) throw error;
      savePendingSaleDeletions(
        getPendingSaleDeletions().filter((pendingSaleId) => pendingSaleId !== saleId)
      );
    } catch (error) {
      console.error('Error retrying pending sale deletion:', error);
    }
  }

  for (const sale of getPendingSales()) {
    await syncSaleToCloud(sale, userId);
  }
};

export const deleteSaleFromCloud = async (saleId: string): Promise<CloudSyncResult> => {
  try {
    const pendingSales = getPendingSales().filter(
      (pendingSale) => pendingSale.id !== saleId
    );
    savePendingSales(pendingSales);

    if (!isSupabaseConfigured()) return { success: true };
    savePendingSaleDeletions([
      ...new Set([...getPendingSaleDeletions(), saleId]),
    ]);

    const { error } = await supabase.from('sales').delete().eq('id', saleId);
    if (error) throw error;
    savePendingSaleDeletions(
      getPendingSaleDeletions().filter((pendingSaleId) => pendingSaleId !== saleId)
    );
    return { success: true };
  } catch (error) {
    console.error('Error deleting sale from cloud:', error);
    return { success: false, error: getCloudErrorMessage(error) };
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
