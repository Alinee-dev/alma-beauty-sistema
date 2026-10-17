import type { Sale, SalePayment } from '../types';

export interface SaleReceipt {
  sale: Sale;
  payment: SalePayment;
}

export const getSalePayments = (sale: Sale): SalePayment[] => {
  if (sale.payments) return sale.payments;
  if (sale.paymentMethod === 'Fiado') return [];

  return [{
    id: `legacy-${sale.id}`,
    date: sale.date,
    amount: sale.total,
    paymentMethod: sale.paymentMethod,
  }];
};

export const getSalePaidAmount = (sale: Sale): number =>
  getSalePayments(sale).reduce((total, payment) => total + payment.amount, 0);

export const getSaleOutstanding = (sale: Sale): number =>
  Math.max(0, sale.total - getSalePaidAmount(sale));

export const getSaleReceipts = (sales: Sale[]): SaleReceipt[] =>
  sales.flatMap((sale) =>
    getSalePayments(sale).map((payment) => ({ sale, payment }))
  );

export const getReceiptProfit = ({ sale, payment }: SaleReceipt): number =>
  sale.total > 0
    ? sale.profit * Math.min(payment.amount, sale.total) / sale.total
    : 0;

export const getReceiptProductCost = ({ sale, payment }: SaleReceipt): number => {
  if (sale.total <= 0) return 0;

  const saleProductCost = sale.items.reduce(
    (total, item) => total + item.costPrice * item.quantity,
    0
  );

  return saleProductCost * Math.min(payment.amount, sale.total) / sale.total;
};
