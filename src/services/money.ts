import type {
  BusinessSettings,
  Expense,
  PersonalUseItem,
  Product,
  Sale,
} from '../types';

export const roundPesos = (amount: number): number => Math.round(amount);

export const normalizeProductMoney = (product: Product): Product => ({
  ...product,
  costPrice: roundPesos(product.costPrice),
  salePrice: roundPesos(product.salePrice),
  offerPrice:
    product.offerPrice === undefined ? undefined : roundPesos(product.offerPrice),
});

export const normalizeSaleMoney = (sale: Sale): Sale => ({
  ...sale,
  items: sale.items.map((item) => ({
    ...item,
    unitPrice: roundPesos(item.unitPrice),
    costPrice: roundPesos(item.costPrice),
    total: roundPesos(item.total),
  })),
  subtotal: roundPesos(sale.subtotal),
  discount: roundPesos(sale.discount),
  total: roundPesos(sale.total),
  profit: roundPesos(sale.profit),
  payments: sale.payments?.map((payment) => ({
    ...payment,
    amount: roundPesos(payment.amount),
  })),
});

export const normalizeExpenseMoney = (expense: Expense): Expense => ({
  ...expense,
  amount: roundPesos(expense.amount),
});

export const normalizePersonalUseMoney = (
  item: PersonalUseItem
): PersonalUseItem => ({
  ...item,
  costPrice: roundPesos(item.costPrice),
  salePrice: roundPesos(item.salePrice),
});

export const normalizeSettingsMoney = (
  settings: BusinessSettings
): BusinessSettings => ({
  ...settings,
  companyCapital:
    settings.companyCapital === undefined
      ? undefined
      : roundPesos(settings.companyCapital),
});
