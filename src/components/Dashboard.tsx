import React, { useState } from 'react';
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
  Clock,
  PieChart
} from 'lucide-react';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  settings: BusinessSettings;
  onSaveSettings: (newSettings: BusinessSettings) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddProduct: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  sales,
  expenses,
  settings,
  onSaveSettings,
  setActiveTab,
  onOpenAddProduct,
}) => {
  const [personalSplit, setPersonalSplit] = useState(30);
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'today'>('month');

  const getPaymentMethodStyle = (method: string) => {
    switch (method) {
      case 'Fiado':
        return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'Efectivo':
        return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'Transferencia':
        return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'Tarjeta':
        return { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'MercadoPago':
        return { backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)' };
      default:
        return { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' };
    }
  };

  // Filtro de Tiempo
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
  const todayStr = now.toISOString().split('T')[0];
  
  // Lógica del Corte de Caja (Oculta ventas/gastos pasados para cálculos del mes)
  const lastCutTime = settings.lastCashCut ? new Date(settings.lastCashCut).getTime() : 0;

  const periodSales = sales.filter(s => {
    if (timeFilter === 'month') return s.date.startsWith(currentMonthStr);
    if (timeFilter === 'today') return s.date.startsWith(todayStr);
    return true;
  });

  const periodExpenses = expenses.filter(e => {
    if (timeFilter === 'month') return e.date.startsWith(currentMonthStr);
    if (timeFilter === 'today') return e.date.startsWith(todayStr);
    return true;
  });

  // Ventas y Gastos POSTERIORES al Corte de Caja (Exclusivo para calcular el Sueldo/Pozo nuevo)
  const cutSales = periodSales.filter(s => new Date(s.date).getTime() > lastCutTime);
  const cutExpenses = periodExpenses.filter(e => new Date(e.date).getTime() > lastCutTime);

  // Separar ventas pagadas de las fiadas DEL PERIODO
  const paidSales = periodSales.filter((s) => s.paymentMethod !== 'Fiado');
  const fiadoSales = periodSales.filter((s) => s.paymentMethod === 'Fiado');

  // Ventas globales de hoy (para la tarjeta de KPI)
  const todayPaidSales = sales.filter((s) => s.paymentMethod !== 'Fiado' && s.date.startsWith(todayStr));
  const todayRevenue = todayPaidSales.reduce((acc, s) => acc + s.total, 0);

  // Cálculos del Periodo
  const totalRevenue = paidSales.reduce((acc, s) => acc + s.total, 0);
  const totalGrossProfit = paidSales.reduce((acc, s) => acc + s.profit, 0);
  
  const isCapitalContribution = (e: Expense) => 
    e.category === 'Ingreso / Aporte al Pozo' || 
    e.description.toLowerCase().includes('ingreso al pozo') ||
    e.description.toLowerCase().includes('aporte al pozo') ||
    e.description.toLowerCase().includes('aporte pozo');

  // Los retiros de sueldo, compras de mercadería y aportes al pozo no son gastos operativos puros.
  const operatingExpenses = periodExpenses.filter(e => 
    e.category !== 'Retiro (Sueldo Personal)' && 
    e.category !== 'Compra Mercadería (Inversión)' &&
    e.category !== 'Mercadería/Insumos' &&
    !isCapitalContribution(e)
  );
  const withdrawnSalary = periodExpenses
    .filter(e => e.category === 'Retiro (Sueldo Personal)')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalExpensesAmount = operatingExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalNetProfit = totalGrossProfit - totalExpensesAmount;

  const periodInventoryPurchases = periodExpenses
    .filter(e => (e.category === 'Compra Mercadería (Inversión)' || e.category === 'Mercadería/Insumos') && !isCapitalContribution(e))
    .reduce((acc, e) => acc + e.amount, 0);

  // Aportes de capital directos ingresados al pozo
  const capitalContributions = periodExpenses
    .filter(isCapitalContribution)
    .reduce((acc, e) => acc + e.amount, 0);

  // Dinero en la calle (Fiado)
  const totalFiado = fiadoSales.reduce((acc, s) => acc + s.total, 0);

  // Investment Recovery (FULL PERIOD)
  const totalRecoveredInvestment = (totalRevenue - totalGrossProfit) - periodInventoryPurchases;
  
  // ==========================================
  // CÁLCULOS EXCLUSIVOS PARA SUELDO Y POZO (Ciclo post-corte)
  // ==========================================
  const cutPaidSales = cutSales.filter(s => s.paymentMethod !== 'Fiado');
  const cutGrossProfit = cutPaidSales.reduce((acc, s) => acc + s.profit, 0);
  const cutOperatingExpenses = cutExpenses.filter(e => 
    e.category !== 'Retiro (Sueldo Personal)' && 
    e.category !== 'Compra Mercadería (Inversión)' &&
    e.category !== 'Mercadería/Insumos' &&
    !isCapitalContribution(e)
  );
  const cutWithdrawnSalary = cutExpenses
    .filter(e => e.category === 'Retiro (Sueldo Personal)')
    .reduce((acc, e) => acc + e.amount, 0);
  const cutExpensesAmount = cutOperatingExpenses.reduce((acc, e) => acc + e.amount, 0);
  const cutNetProfit = cutGrossProfit - cutExpensesAmount;

  // Tu Sueldo en este ciclo
  const personalAmount = (cutNetProfit * personalSplit) / 100;
  const availableSalary = Math.max(0, personalAmount - cutWithdrawnSalary);

  // Aumento de Pozo en este ciclo (lo que se sumará a la tarjeta morada al hacer corte)
  const cyclePozo = (cutNetProfit * (100 - personalSplit)) / 100;

  // Compras de mercadería en este ciclo (descuentan del capital actual)
  const cycleInventoryPurchases = cutExpenses
    .filter(e => (e.category === 'Compra Mercadería (Inversión)' || e.category === 'Mercadería/Insumos') && !isCapitalContribution(e))
    .reduce((acc, e) => acc + e.amount, 0);

  // Aportes directos al pozo en este ciclo
  const cycleContributions = cutExpenses
    .filter(isCapitalContribution)
    .reduce((acc, e) => acc + e.amount, 0);

  // Capital de la Empresa base (por defecto 43.580)
  const baseCompanyCapital = settings.companyCapital ?? 43580;

  // Capital de la Empresa actual
  const totalCajaFisica = baseCompanyCapital + cycleContributions - cycleInventoryPurchases;

  const handleCashCut = () => {
    const pozoToAdd = Math.max(0, cyclePozo);
    const newCapital = totalCajaFisica + pozoToAdd;

    const confirmMsg = `¿Estás segura de hacer un Corte de Caja ahora?\n\n` +
      `• Se transferirán ${settings.currency} ${pozoToAdd.toLocaleString()} de Aumento de Pozo a la tarjeta morada de Capital de la Empresa (quedando en ${settings.currency} ${newCapital.toLocaleString()}).\n` +
      `• Tu Sueldo disponible y el Aumento de Pozo se reiniciarán a $0 para comenzar tu nuevo ciclo de ventas.`;

    if (confirm(confirmMsg)) {
      onSaveSettings({
        ...settings,
        lastCashCut: new Date().toISOString(),
        companyCapital: newCapital
      });
    }
  };

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const totalProductsCount = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);

  // Calculate top selling products (based on period)
  const productSalesMap: Record<string, { product: Product; quantity: number; totalRevenue: number }> = {};
  periodSales.forEach((sale) => {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
                Mostrando datos de:
              </p>
              <select 
                className="glass-input" 
                style={{ padding: '0.3rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', width: 'auto', backgroundColor: 'rgba(0,0,0,0.3)' }}
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
              >
                <option value="month">Este Mes</option>
                <option value="today">Solo Hoy</option>
                <option value="all">Histórico Completo</option>
              </select>
            </div>
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
            {todayPaidSales.length} {todayPaidSales.length === 1 ? 'venta cobrada hoy' : 'ventas cobradas hoy'}
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

        {/* Card 5: Fiado (Por Cobrar) */}
        <div className="glass-panel-interactive" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Por Cobrar (Fiado)</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: totalFiado > 0 ? '#c084fc' : 'var(--text-muted)' }}>
            {settings.currency} {totalFiado.toLocaleString()}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {fiadoSales.length} {fiadoSales.length === 1 ? 'venta pendiente de pago' : 'ventas pendientes de pago'}
          </p>
        </div>

      </div>

      {/* Profit Split Strategy Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h3 className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
              <PieChart size={20} /> Estrategia de Crecimiento (Tu Pozo)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              Define qué porcentaje de tu <strong>Ganancia Neta</strong> es para tu sueldo y cuánto se reinvierte en comprar más mercadería.
            </p>
            <button 
               className="btn btn-secondary" 
               style={{ marginTop: '0.8rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
               onClick={handleCashCut}
            >
               Hacer Corte de Caja (Transferir Pozo y Reiniciar Sueldo)
            </button>
          </div>
          <div style={{ background: 'rgba(15, 10, 21, 0.6)', padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
             <div style={{ textAlign: 'center' }}>
               <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Para Ti</span>
               <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f472b6' }}>{personalSplit}%</span>
             </div>
             <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>
             <div style={{ textAlign: 'center' }}>
               <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Para el Pozo</span>
               <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>{100 - personalSplit}%</span>
             </div>
          </div>
        </div>

        {/* Slider */}
        <div style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
           <input 
             type="range" 
             min="0" 
             max="100" 
             step="5"
             value={personalSplit}
             onChange={(e) => setPersonalSplit(parseInt(e.target.value))}
             style={{ 
               width: '100%', 
               accentColor: 'var(--primary)',
               cursor: 'pointer'
             }} 
           />
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
             <span>0% (Full Crecimiento)</span>
             <span>50/50 (Estabilidad)</span>
             <span>100% (Vivir de las ganancias)</span>
           </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          
          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
               Ventas ({timeFilter === 'all' ? 'Histórico' : timeFilter === 'month' ? 'Mes' : 'Hoy'})
             </div>
             <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{settings.currency} {totalRevenue.toLocaleString()}</div>
             <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Total ingresado</div>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #60a5fa' }}>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Recuperación Inversión</div>
             <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#60a5fa' }}>{settings.currency} {totalRecoveredInvestment.toLocaleString()}</div>
             <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Costo de los productos. Reponer stock.</div>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #f472b6' }}>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Tu Sueldo Total ({personalSplit}%)</div>
             <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f472b6', textDecoration: cutWithdrawnSalary > personalAmount ? 'line-through' : 'none', opacity: cutWithdrawnSalary > personalAmount ? 0.6 : 1 }}>
                {settings.currency} {Math.max(0, personalAmount).toLocaleString()}
             </div>
             {availableSalary > 0 && (
               <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f472b6', marginTop: '0.2rem' }}>
                 {settings.currency} {availableSalary.toLocaleString()} <span style={{fontSize:'0.7rem', fontWeight:400, color:'var(--text-muted)'}}>Disponible</span>
               </div>
             )}
             <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
               {cutWithdrawnSalary > 0 ? `Ya retiraste ${settings.currency} ${cutWithdrawnSalary.toLocaleString()}` : 'Aún no has registrado retiros'}
             </div>
             {lastCutTime > 0 && (
               <div style={{ fontSize: '0.65rem', color: '#f472b6', marginTop: '0.4rem', opacity: 0.8 }}>
                 *Calculado desde tu último Corte de Caja
               </div>
             )}
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #34d399' }}>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Aumento Pozo ({100 - personalSplit}%)</div>
             <div style={{ fontSize: '1.2rem', fontWeight: 700, color: cyclePozo < 0 ? '#ef4444' : '#34d399' }}>
               {settings.currency} {cyclePozo.toLocaleString()}
             </div>
             <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
               Se sumará a la tarjeta morada al hacer Corte de Caja
             </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.4)', borderLeft: '4px solid #a855f7' }}>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>Capital de la Empresa</div>
             <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#a855f7' }}>
               {settings.currency} {totalCajaFisica.toLocaleString()}
             </div>
             <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
               Fondo intocable del negocio para mercadería y crecimiento
             </div>
          </div>

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
                        <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', ...getPaymentMethodStyle(sale.paymentMethod) }}>
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
