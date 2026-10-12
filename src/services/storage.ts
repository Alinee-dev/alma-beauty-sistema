import type { Product, Sale, BusinessSettings, Expense, PersonalUseItem } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from '../data/initialData';

const KEYS = {
  PRODUCTS: 'aline_beauty_products_v2',
  SALES: 'aline_beauty_sales_v2',
  SETTINGS: 'aline_beauty_settings_v2',
  EXPENSES: 'aline_beauty_expenses_v2',
  PERSONAL_USE: 'aline_beauty_personal_use_v2',
};

// --- PRODUCTS ---
export const getProducts = (): Product[] => {
  try {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    if (!data) {
      saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_PRODUCTS;
  } catch (error) {
    console.error('Error loading products from localStorage:', error);
    return INITIAL_PRODUCTS;
  }
};

export const saveProducts = (products: Product[]): void => {
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
};

// --- SALES ---
export const getSales = (): Sale[] => {
  try {
    const data = localStorage.getItem(KEYS.SALES);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading sales from localStorage:', error);
    return [];
  }
};

export const saveSales = (sales: Sale[]): void => {
  localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
};

// --- SETTINGS ---
export const getSettings = (): BusinessSettings => {
  try {
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (!data) {
      saveSettings(INITIAL_SETTINGS);
      return INITIAL_SETTINGS;
    }
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object' && parsed.name) {
      if (parsed.companyCapital === undefined) {
        parsed.companyCapital = 43580;
      }
      return parsed;
    }
    return INITIAL_SETTINGS;
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
    return INITIAL_SETTINGS;
  }
};

export const saveSettings = (settings: BusinessSettings): void => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

// --- BACKUP & RESTORE ---
export const exportDataJSON = (): string => {
  const data = {
    products: getProducts(),
    sales: getSales(),
    expenses: getExpenses(),
    personalUse: getPersonalUse(),
    settings: getSettings(),
    exportDate: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
};

export const importDataJSON = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.products && Array.isArray(data.products)) saveProducts(data.products);
    if (data.sales && Array.isArray(data.sales)) saveSales(data.sales);
    if (data.expenses && Array.isArray(data.expenses)) saveExpenses(data.expenses);
    if (data.personalUse && Array.isArray(data.personalUse)) savePersonalUse(data.personalUse);
    if (data.settings && typeof data.settings === 'object') saveSettings(data.settings);
    return true;
  } catch (error) {
    console.error('Error importing backup:', error);
    return false;
  }
};

export const resetToDefaultData = (): void => {
  saveProducts(INITIAL_PRODUCTS);
  saveSales([]);
  saveExpenses([]);
  savePersonalUse([]);
  saveSettings(INITIAL_SETTINGS);
};

// --- EXPENSES ---
export const getExpenses = (): Expense[] => {
  try {
    const data = localStorage.getItem(KEYS.EXPENSES);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading expenses from localStorage:', error);
    return [];
  }
};

export const saveExpenses = (expenses: Expense[]): void => {
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
};

// --- PERSONAL USE (USO PERSONAL / PARA MÍ) ---
export const getPersonalUse = (): PersonalUseItem[] => {
  try {
    const data = localStorage.getItem(KEYS.PERSONAL_USE);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading personal use items from localStorage:', error);
    return [];
  }
};

export const savePersonalUse = (items: PersonalUseItem[]): void => {
  localStorage.setItem(KEYS.PERSONAL_USE, JSON.stringify(items));
};
