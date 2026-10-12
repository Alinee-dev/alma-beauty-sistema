import { useState, useEffect, useCallback } from 'react';
import type { Product, Sale, BusinessSettings, ActiveTab, Expense, PersonalUseItem } from './types';
import { 
  getProducts, 
  saveProducts, 
  getSales, 
  saveSales, 
  getSettings, 
  saveSettings, 
  getExpenses, 
  saveExpenses, 
  getPersonalUse, 
  savePersonalUse 
} from './services/storage';

import { 
  supabase, 
  isSupabaseConfigured, 
  getSession, 
  signOut as supabaseSignOut 
} from './services/supabase';
import type { User } from '@supabase/supabase-js';

import {
  fetchAllCloudData,
  syncProductToCloud,
  deleteProductFromCloud,
  syncSaleToCloud,
  deleteSaleFromCloud,
  syncExpenseToCloud,
  deleteExpenseFromCloud,
  syncPersonalUseToCloud,
  deletePersonalUseFromCloud,
  syncSettingsToCloud,
  uploadLocalDataToSupabase,
} from './services/cloudStorage';

import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { SalesHistory } from './components/SalesHistory';
import { CustomerCatalog } from './components/CustomerCatalog';
import { Expenses } from './components/Expenses';
import { AuthScreen } from './components/AuthScreen';

import { ProductModal } from './components/ProductModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SettingsModal } from './components/SettingsModal';
import { EditSaleModal } from './components/EditSaleModal';
import { PersonalUseModal } from './components/PersonalUseModal';
import { LogIn } from 'lucide-react';

export function App() {
  const [products, setProducts] = useState<Product[]>(getProducts());
  const [sales, setSales] = useState<Sale[]>(getSales());
  const [expenses, setExpenses] = useState<Expense[]>(getExpenses());
  const [personalUseItems, setPersonalUseItems] = useState<PersonalUseItem[]>(getPersonalUse());
  const [settings, setSettings] = useState<BusinessSettings>(getSettings());

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Auth & Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLocalMode, setIsLocalMode] = useState<boolean>(() => {
    return localStorage.getItem('aline_local_mode_active') === 'true';
  });
  const [isGuestCatalog, setIsGuestCatalog] = useState<boolean>(() => {
    // Check if the URL requested catalog mode directly (e.g. ?catalog=true or #catalog)
    return window.location.hash === '#catalog' || window.location.search.includes('catalog=true');
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [isNewSaleReceipt, setIsNewSaleReceipt] = useState(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [isPersonalUseModalOpen, setIsPersonalUseModalOpen] = useState(false);
  const [personalUseProduct, setPersonalUseProduct] = useState<Product | null>(null);
  const [personalUseInitialTab, setPersonalUseInitialTab] = useState<'take' | 'history'>('take');

  const isCloudConnected = isSupabaseConfigured() && isAuthenticated;

  // Load cloud data, and auto-migrate local data if cloud is empty (first login)
  const loadCloudData = useCallback(async (userId?: string, autoMigrate = false) => {
    if (!isSupabaseConfigured()) return;
    try {
      const cloudData = await fetchAllCloudData();
      if (cloudData) {
        const cloudIsEmpty = cloudData.products.length === 0 && cloudData.sales.length === 0;

        if (autoMigrate && cloudIsEmpty) {
          // First login: silently upload all local data to the cloud
          await uploadLocalDataToSupabase(userId);
          // Then fetch again to get the migrated data back
          const freshData = await fetchAllCloudData();
          if (freshData) {
            if (freshData.products.length > 0) setProducts(freshData.products);
            if (freshData.sales.length >= 0) setSales(freshData.sales);
            if (freshData.expenses.length >= 0) setExpenses(freshData.expenses);
            if (freshData.personalUse.length >= 0) setPersonalUseItems(freshData.personalUse);
            if (freshData.settings) setSettings(freshData.settings);
          }
        } else {
          if (cloudData.products.length > 0) setProducts(cloudData.products);
          if (cloudData.sales.length >= 0) setSales(cloudData.sales);
          if (cloudData.expenses.length >= 0) setExpenses(cloudData.expenses);
          if (cloudData.personalUse.length >= 0) setPersonalUseItems(cloudData.personalUse);
          if (cloudData.settings) setSettings(cloudData.settings);
        }
      }
    } catch (error) {
      console.error('Error loading cloud data:', error);
    }
  }, []);

  // Check initial Auth session
  useEffect(() => {
    const initAuth = async () => {
      if (isSupabaseConfigured()) {
        try {
          const session = await getSession();
          if (session?.user) {
            setCurrentUser(session.user);
            setIsAuthenticated(true);
            // autoMigrate=true: on first login, upload local data if cloud is empty
            await loadCloudData(session.user.id, true);
          }
        } catch (err) {
          console.error('Failed to get Supabase session:', err);
        }
      }
      setIsLoadingAuth(false);
    };

    initAuth();

    // Listen for Supabase auth state changes (login from another tab/device)
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setCurrentUser(session.user);
          setIsAuthenticated(true);
          // autoMigrate=true on SIGNED_IN so first login on any device auto-migrates
          await loadCloudData(session.user.id, true);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setIsAuthenticated(false);
        } else if (session?.user) {
          // TOKEN_REFRESHED or other events — just refresh data without migration
          await loadCloudData(session.user.id, false);
        }
      });

      // Realtime listener: when a change is made on another device, sync silently
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          () => {
            loadCloudData();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
        supabase.removeChannel(channel);
      };
    }
  }, [loadCloudData]);

  // Sync state — always prefer cloud when connected
  const handleReloadAll = () => {
    if (isSupabaseConfigured() && isAuthenticated) {
      loadCloudData(currentUser?.id, false);
    } else {
      setProducts(getProducts());
      setSales(getSales());
      setExpenses(getExpenses());
      setPersonalUseItems(getPersonalUse());
      setSettings(getSettings());
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await supabaseSignOut();
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsLocalMode(false);
    localStorage.removeItem('aline_local_mode_active');
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

    // Sync to cloud
    if (isCloudConnected) {
      syncProductToCloud(product, currentUser?.id);
    }
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    const updated = products.map((p) => (p.id === productId ? { ...p, stock: newStock } : p));
    setProducts(updated);
    saveProducts(updated);

    const targetProduct = updated.find((p) => p.id === productId);
    if (targetProduct && isCloudConnected) {
      syncProductToCloud(targetProduct, currentUser?.id);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveProducts(updated);

    if (isCloudConnected) {
      deleteProductFromCloud(productId);
    }
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
        const newStock = Math.max(0, product.stock - soldItem.quantity);
        const updatedProd = { ...product, stock: newStock };
        if (isCloudConnected) {
          syncProductToCloud(updatedProd, currentUser?.id);
        }
        return updatedProd;
      }
      return product;
    });

    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    // Sync sale to cloud
    if (isCloudConnected) {
      syncSaleToCloud(sale, currentUser?.id);
    }

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
        const updatedProd = {
          ...product,
          stock: product.stock + soldItem.quantity,
        };
        if (isCloudConnected) {
          syncProductToCloud(updatedProd, currentUser?.id);
        }
        return updatedProd;
      }
      return product;
    });

    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    // Remove sale
    const updatedSales = sales.filter((s) => s.id !== saleId);
    setSales(updatedSales);
    saveSales(updatedSales);

    if (isCloudConnected) {
      deleteSaleFromCloud(saleId);
    }
  };

  const handleEditSale = (updatedSale: Sale) => {
    const updatedSales = sales.map((s) => (s.id === updatedSale.id ? updatedSale : s));
    setSales(updatedSales);
    saveSales(updatedSales);

    if (isCloudConnected) {
      syncSaleToCloud(updatedSale, currentUser?.id);
    }
  };

  const handleSaveExpense = (expense: Expense) => {
    const updated = [expense, ...expenses];
    setExpenses(updated);
    saveExpenses(updated);

    if (isCloudConnected) {
      syncExpenseToCloud(expense, currentUser?.id);
    }
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    saveExpenses(updated);

    if (isCloudConnected) {
      deleteExpenseFromCloud(id);
    }
  };

  const handleSaveSettings = (newSettings: BusinessSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);

    if (isCloudConnected) {
      syncSettingsToCloud(newSettings, currentUser?.id);
    }
  };

  // Personal Use Handlers
  const handleTakePersonalUse = (productId: string, quantity: number, reason?: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || prod.stock <= 0) return;

    const actualQty = Math.min(prod.stock, quantity);
    const newStock = Math.max(0, prod.stock - actualQty);

    // 1. Update product stock
    const updatedProducts = products.map((p) => (p.id === productId ? { ...p, stock: newStock } : p));
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    if (isCloudConnected) {
      const targetProd = updatedProducts.find((p) => p.id === productId);
      if (targetProd) syncProductToCloud(targetProd, currentUser?.id);
    }

    // 2. Add personal use record
    const newItem: PersonalUseItem = {
      id: `pu-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      costPrice: prod.costPrice,
      salePrice: prod.salePrice,
      quantity: actualQty,
      date: new Date().toISOString(),
      reason,
      imageUrl: prod.imageUrl,
    };

    const updatedPersonalUse = [newItem, ...personalUseItems];
    setPersonalUseItems(updatedPersonalUse);
    savePersonalUse(updatedPersonalUse);

    if (isCloudConnected) {
      syncPersonalUseToCloud(newItem, currentUser?.id);
    }
  };

  const handleUndoPersonalUse = (personalUseId: string) => {
    const item = personalUseItems.find((p) => p.id === personalUseId);
    if (!item) return;

    // 1. Restore product stock
    const updatedProducts = products.map((p) =>
      p.id === item.productId ? { ...p, stock: p.stock + item.quantity } : p
    );
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    if (isCloudConnected) {
      const targetProd = updatedProducts.find((p) => p.id === item.productId);
      if (targetProd) syncProductToCloud(targetProd, currentUser?.id);
    }

    // 2. Remove record
    const updatedPersonalUse = personalUseItems.filter((p) => p.id !== personalUseId);
    setPersonalUseItems(updatedPersonalUse);
    savePersonalUse(updatedPersonalUse);

    if (isCloudConnected) {
      deletePersonalUseFromCloud(personalUseId);
    }
  };

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  // Loading state while verifying auth session
  if (isLoadingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-main)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(244, 114, 182, 0.3)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando tienda...</p>
      </div>
    );
  }

  // Guest Customer Catalog Mode
  if (isGuestCatalog) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Guest Banner */}
        <div style={{
          backgroundColor: 'rgba(252, 231, 243, 0.9)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.6rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem'
        }}>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
            🛍️ Catálogo para Clientes de {settings.name}
          </span>
          <button
            onClick={() => {
              setIsGuestCatalog(false);
              window.location.hash = '';
            }}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            <LogIn size={14} />
            <span>Acceso Administradora</span>
          </button>
        </div>

        <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '1rem' }}>
          <CustomerCatalog products={products} settings={settings} />
        </main>
      </div>
    );
  }

  // Not authenticated and not local mode -> show Auth Screen
  if (!isAuthenticated && !isLocalMode) {
    return (
      <AuthScreen
        settings={settings}
        onLoginSuccess={() => {
          setIsAuthenticated(true);
        }}
        onEnterAsGuestCatalog={() => {
          setIsGuestCatalog(true);
        }}
        onContinueLocalMode={() => {
          setIsLocalMode(true);
          localStorage.setItem('aline_local_mode_active', 'true');
        }}
      />
    );
  }

  // Full Admin Application (Phone, Tablet, Desktop)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        lowStockCount={lowStockCount}
        userEmail={currentUser?.email || (isLocalMode ? 'Modo Local' : null)}
        isCloudConnected={isCloudConnected}
        onSignOut={handleSignOut}
      />

      {/* Main View Container */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {activeTab === 'dashboard' && (
          <Dashboard
            products={products}
            sales={sales}
            expenses={expenses}
            settings={settings}
            onSaveSettings={handleSaveSettings}
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
            sales={sales}
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
            onOpenPersonalUse={(product, tab = 'take') => {
              setPersonalUseProduct(product || null);
              setPersonalUseInitialTab(tab);
              setIsPersonalUseModalOpen(true);
            }}
            personalUseCount={personalUseItems.length}
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

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={lowStockCount}
      />

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
        userId={currentUser?.id}
      />

      <EditSaleModal
        isOpen={isEditSaleModalOpen}
        onClose={() => setIsEditSaleModalOpen(false)}
        sale={editingSale}
        settings={settings}
        onSave={handleEditSale}
      />

      <PersonalUseModal
        isOpen={isPersonalUseModalOpen}
        onClose={() => {
          setIsPersonalUseModalOpen(false);
          setPersonalUseProduct(null);
        }}
        products={products}
        productToTake={personalUseProduct}
        personalUseItems={personalUseItems}
        onConfirmTake={handleTakePersonalUse}
        onUndoTake={handleUndoPersonalUse}
        settings={settings}
        initialTab={personalUseInitialTab}
      />

    </div>
  );
}

export default App;
