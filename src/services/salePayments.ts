import type { PaymentMethod, Sale, SalePayment } from '../types';
import { roundPesos } from './money';

export interface SaleReceipt {
  sale: Sale;
  payment: SalePayment;
}

export const getSalePayments = (sale: Sale): SalePayment[] => {
  if (sale.payments?.length) {
    return sale.payments.map((payment) => ({
      ...payment,
      amount: roundPesos(payment.amount),
    }));
  }
  if (sale.paymentMethod === 'Fiado') return [];

  return [{
    id: `legacy-${sale.id}`,
    date: sale.date,
    amount: roundPesos(sale.total),
    paymentMethod: sale.paymentMethod,
  }];
};

export const getSalePaidAmount = (sale: Sale): number =>
  getSalePayments(sale).reduce((total, payment) => total + payment.amount, 0);

export const getSaleOutstanding = (sale: Sale): number =>
  Math.max(0, sale.total - getSalePaidAmount(sale));

export const getSalePaymentMethods = (sale: Sale): PaymentMethod[] => {
  if (sale.paymentMethod !== 'Fiado' || getSaleOutstanding(sale) > 0) {
    return [sale.paymentMethod];
  }

  return [...new Set(getSalePayments(sale).map((payment) => payment.paymentMethod))];
};

export const getSaleReceipts = (sales: Sale[]): SaleReceipt[] =>
  sales.flatMap((sale) =>
    getSalePayments(sale).map((payment) => ({ sale, payment }))
  );

export const getReceiptProfit = ({ sale, payment }: SaleReceipt): number =>
  sale.total > 0
    ? roundPesos(sale.profit * Math.min(payment.amount, sale.total) / sale.total)
    : 0;

export const getReceiptProductCost = ({ sale, payment }: SaleReceipt): number => {
  if (sale.total <= 0) return 0;

  const saleProductCost = sale.items.reduce(
    (total, item) => total + item.costPrice * item.quantity,
    0
  );

  return roundPesos(
    saleProductCost * Math.min(payment.amount, sale.total) / sale.total
  );
};
