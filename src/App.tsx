import { useState } from 'react';
import type { Product, Sale, BusinessSettings, ActiveTab, Expense } from './types';
import { getProducts, saveProducts, getSales, saveSales, getSettings, saveSettings, getExpenses, saveExpenses } from './services/storage';

import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { SalesHistory } from './components/SalesHistory';
import { CustomerCatalog } from './components/CustomerCatalog';
import { Expenses } from './components/Expenses';

import { ProductModal } from './components/ProductModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SettingsModal } from './components/SettingsModal';
import { EditSaleModal } from './components/EditSaleModal';

export function App() {
  const [products, setProducts] = useState<Product[]>(getProducts());
  const [sales, setSales] = useState<Sale[]>(getSales());
  const [expenses, setExpenses] = useState<Expense[]>(getExpenses());
  const [settings, setSettings] = useState<BusinessSettings>(getSettings());

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [isNewSaleReceipt, setIsNewSaleReceipt] = useState(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Sync state to LocalStorage
  const handleReloadAll = () => {
    setProducts(getProducts());
    setSales(getSales());
    setExpenses(getExpenses());
    setSettings(getSettings());
  };

  // Product CRUD
  const handleSaveProduct = (product: Product) => {
    let updatedProducts: Product[];
    const exists = products.some((p) => p.id === product.id);

    if (exists) {
      updatedProducts = products.map((p) => (p.id === product.id ? product : p));
    } else {
      updatedProducts = [product, ...products];
    }

    setProducts(updatedProducts);
    saveProducts(updatedProducts);
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    const updated = products.map((p) => (p.id === productId ? { ...p, stock: newStock } : p));
    setProducts(updated);
    saveProducts(updated);
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveProducts(updated);
  };

  // Sales Handling & Inventory Stock Reduction
  const handleCompleteSale = (sale: Sale) => {
    // 1. Save Sale
    const updatedSales = [sale, ...sales];
    setSales(updatedSales);
    saveSales(updatedSales);

    // 2. Reduce Stock of purchased products
    const updatedProducts = products.map((product) => {
      const soldItem = sale.items.find((item) => item.productId === product.id);
      if (soldItem) {
        return {
          ...product,
          stock: Math.max(0, product.stock - soldItem.quantity),
        };
      }
      return product;
    });

    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    // 3. Open Receipt Modal with Confetti
    setReceiptSale(sale);
    setIsNewSaleReceipt(true);
    setIsReceiptModalOpen(true);
  };

  // Refund / Cancel Sale & Stock Restoration
  const handleCancelSale = (saleId: string) => {
    const saleToCancel = sales.find((s) => s.id === saleId);
    if (!saleToCancel) return;

    // Restore stock
    const updatedProducts = products.map((product) => {
      const soldItem = saleToCancel.items.find((item) => item.productId === product.id);
      if (soldItem) {
        return {
          ...product,
          stock: product.stock + soldItem.quantity,
        };
      }
      return product;
    });

    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    // Remove sale
    const updatedSales = sales.filter((s) => s.id !== saleId);
    setSales(updatedSales);
    saveSales(updatedSales);
  };

  const handleEditSale = (updatedSale: Sale) => {
    const updatedSales = sales.map((s) => (s.id === updatedSale.id ? updatedSale : s));
    setSales(updatedSales);
    saveSales(updatedSales);
  };

  const handleSaveExpense = (expense: Expense) => {
    const updated = [expense, ...expenses];
    setExpenses(updated);
    saveExpenses(updated);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    saveExpenses(updated);
  };

  const handleSaveSettings = (newSettings: BusinessSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        lowStockCount={lowStockCount}
      />

      {/* Main View Container */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {activeTab === 'dashboard' && (
          <Dashboard
            products={products}
            sales={sales}
            expenses={expenses}
            settings={settings}
            setActiveTab={setActiveTab}
            onOpenAddProduct={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
          />
        )}

        {activeTab === 'pos' && (
          <POS
            products={products}
            settings={settings}
            onCompleteSale={handleCompleteSale}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory
            products={products}
            settings={settings}
            onOpenAddModal={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            onOpenEditModal={(product) => {
              setEditingProduct(product);
              setIsProductModalOpen(true);
            }}
            onUpdateStock={handleUpdateStock}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'sales' && (
          <SalesHistory
            sales={sales}
            settings={settings}
            onViewReceipt={(sale) => {
              setReceiptSale(sale);
              setIsNewSaleReceipt(false);
              setIsReceiptModalOpen(true);
            }}
            onCancelSale={handleCancelSale}
            onEditSale={(sale) => {
              setEditingSale(sale);
              setIsEditSaleModalOpen(true);
            }}
          />
        )}

        {activeTab === 'catalog' && (
          <CustomerCatalog
            products={products}
            settings={settings}
          />
        )}

        {activeTab === 'expenses' && (
          <Expenses
            expenses={expenses}
            settings={settings}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
      </main>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
        settings={settings}
      />

      <ReceiptModal
        sale={receiptSale}
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptSale(null);
        }}
        settings={settings}
        isNewSale={isNewSaleReceipt}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onDataReload={handleReloadAll}
      />

      <EditSaleModal
        isOpen={isEditSaleModalOpen}
        onClose={() => setIsEditSaleModalOpen(false)}
        sale={editingSale}
        settings={settings}
        onSave={handleEditSale}
      />

    </div>
  );
}

export default App;
