import React from 'react';
import type { Product, Sale, Expense, BusinessSettings, ActiveTab } from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  PackageCheck, 
  AlertTriangle, 
  ShoppingCart, 
  PlusCircle, 
  Store,
  Calendar,
  CreditCard,
  Sparkles,
  ArrowRight,
  Flame,
  Clock
} from 'lucide-react';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  settings: BusinessSettings;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddProduct: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  sales,
  expenses,
  settings,
  setActiveTab,
  onOpenAddProduct,
}) => {
  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.date.startsWith(todayStr));
  
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  
  const totalGrossProfit = sales.reduce((acc, s) => acc + s.profit, 0);
  const totalExpensesAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalNetProfit = totalGrossProfit - totalExpensesAmount;

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const totalProductsCount = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);

  // Calculate top selling products
  const productSalesMap: Record<string, { product: Product; quantity: number; totalRevenue: number }> = {};
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          product: prod || {
            id: item.productId,
            name: item.productName,
            category: item.category,
            costPrice: item.costPrice,
            salePrice: item.unitPrice,
            stock: 0,
            minStock: 0,
            createdAt: ''
          },
          quantity: 0,
          totalRevenue: 0,
        };
      }
      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].totalRevenue += item.total;
    });
  });

  const topSellers = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 4);

  const recentSales = [...sales].reverse().slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel" style={{ padding: '1.8rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '220px',
          height: '220px',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 2 }}>
          <div>
            <span className="badge badge-pink" style={{ marginBottom: '0.6rem' }}>
              <Sparkles size={13} /> Sistema de Control Beauty POS
            </span>
            <h2 className="font-serif text-gradient" style={{ fontSize: '1.9rem', fontWeight: 700, marginTop: '0.2rem' }}>
              ¡Hola! Bienvenido a {settings.name}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.3rem' }}>
              Resumen ejecutivo de tu inventario, ventas y ganancias en tiempo real.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setActiveTab('pos')}>
              <ShoppingCart size={18} />
              <span>Nueva Venta (POS)</span>
            </button>
            <button className="btn btn-secondary" onClick={onOpenAddProduct}>
              <PlusCircle size={18} />
              <span>Agregar Producto</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveTab('catalog')}>
              <Store size={18} />
              <span>Ver Catálogo</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
        
        {/* Card 1: Today Sales */}
        <div className="glass-panel-interactive" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ventas de Hoy</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {settings.currency} {todayRevenue.toLocaleString()}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {todaySales.length} {todaySales.length === 1 ? 'transacción hoy' : 'transacciones hoy'}
          </p>
        </div>

        {/* Card 2: Total Net Profit */}
        <div className="glass-panel-interactive" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ganancia Neta (Caja Real)</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: totalNetProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {settings.currency} {totalNetProfit.toLocaleString()}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.3 }}>
            Ganancia bruta: {settings.currency} {totalGrossProfit.toLocaleString()} <br/>
            Gastos restados: {settings.currency} {totalExpensesAmount.toLocaleString()}
          </p>
        </div>

        {/* Card 3: Total Inventory */}
        <div className="glass-panel-interactive" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Inventario Total</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackageCheck size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {totalProductsCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>productos</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {totalStockUnits} unidades físicas disponibles
          </p>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div 
          className="glass-panel-interactive" 
          style={{ padding: '1.4rem', cursor: 'pointer', border: lowStockProducts.length > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : undefined }}
          onClick={() => setActiveTab('inventory')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Alertas de Stock</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: lowStockProducts.length > 0 ? '#f87171' : '#34d399' }}>
            {lowStockProducts.length}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {lowStockProducts.length > 0 ? 'Requieren reposición urgente' : 'Todo el stock con nivel óptimo'}
          </p>
        </div>

      </div>

      {/* Main Content Grid: Top Sellers + Recent Sales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Top Selling Products */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h3 className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Flame size={20} color="var(--primary)" /> Productos Más Vendidos
            </h3>
            <button 
              onClick={() => setActiveTab('inventory')} 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              Ver todos <ArrowRight size={14} />
            </button>
          </div>

          {topSellers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '1.5rem 0', textAlign: 'center' }}>
              Aún no hay registradas ventas suficientes para calcular más vendidos.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {topSellers.map((item, idx) => (
                <div 
                  key={item.product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.9rem',
                    padding: '0.7rem 0.9rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(15, 10, 21, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#b45309',
                    color: '#000',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {idx + 1}
                  </div>

                  {item.product.imageUrl && (
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                      style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.product.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.product.category}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.9rem' }}>
                      {item.quantity} un.
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {settings.currency} {item.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity / Sales */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h3 className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={20} color="var(--primary)" /> Últimas Ventas
            </h3>
            <button 
              onClick={() => setActiveTab('sales')} 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              Historial completo <ArrowRight size={14} />
            </button>
          </div>

          {recentSales.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '1.5rem 0', textAlign: 'center' }}>
              Registra tu primera venta desde el Punto de Venta (POS).
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {recentSales.map((sale) => {
                const formattedDate = new Date(sale.date).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div 
                    key={sale.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(15, 10, 21, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      gap: '0.8rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {sale.customerName || 'Cliente Ocasional'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        <span><Calendar size={12} style={{ display: 'inline', marginRight: '2px' }} />{formattedDate}</span>
                        <span>•</span>
                        <span className="badge badge-pink" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          <CreditCard size={10} /> {sale.paymentMethod}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>
                        {settings.currency} {sale.total.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
