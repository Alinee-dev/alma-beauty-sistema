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

export interface Sale {
  id: string;
  date: string; // ISO string
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  profit: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
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
}

export type ExpenseCategory = 'Bolsas/Empaques' | 'Publicidad/Marketing' | 'Envíos/Cadetería' | 'Mercadería/Insumos' | 'Alquiler/Servicios' | 'Otros';

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
}

export type ActiveTab = 'dashboard' | 'pos' | 'inventory' | 'sales' | 'expenses' | 'catalog';
