export type Category = 
  | 'Maquillaje'
  | 'Cuidado Facial'
  | 'Labios'
  | 'Ojos'
  | 'Brochas y Esponjas'
  | 'Accesorios'
  | 'Joyería'
  | 'Perfumes'
  | 'Kits y Combos';

export interface Product {
  id: string;
  name: string;
  category: Category;
  costPrice: number;
  salePrice: number;
  offerPrice?: number;
  isOfferActive?: boolean;
  stock: number;
  minStock: number;
  description?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercentage?: number;
}

export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'MercadoPago' | 'Fiado';

export interface SaleItem {
  productId: string;
  productName: string;
  category: Category;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  total: number;
}

export interface SalePayment {
  id: string;
  date: string;
  amount: number;
  paymentMethod: Exclude<PaymentMethod, 'Fiado'>;
}

export interface Sale {
  id: string;
  date: string; // ISO string
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  profit: number;
  paymentMethod: PaymentMethod;
  payments?: SalePayment[];
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  isSurpriseBag?: boolean;
}

export interface BusinessSettings {
  name: string;
  subtitle: string;
  phone: string;
  whatsapp: string;
  address: string;
  currency: string;
  instagram: string;
  logoUrl?: string;
  lastCashCut?: string;
  companyCapital?: number;
}

export type ExpenseCategory = 'Bolsas/Empaques' | 'Publicidad/Marketing' | 'Envíos/Cadetería' | 'Compra Mercadería (Inversión)' | 'Ingreso / Aporte al Pozo' | 'Alquiler/Servicios' | 'Retiro (Sueldo Personal)' | 'Otros';

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
}

export interface PersonalUseItem {
  id: string;
  productId: string;
  productName: string;
  category: Category;
  costPrice: number;
  salePrice: number;
  quantity: number;
  date: string;
  reason?: string;
  imageUrl?: string;
}

export type ActiveTab = 'dashboard' | 'pos' | 'inventory' | 'sales' | 'expenses' | 'catalog';
