import React from 'react';
import type { ActiveTab, BusinessSettings } from '../types';
import { 
  Sparkles, 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Store, 
  Settings,
  AlertTriangle,
  Wallet
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: BusinessSettings;
  onOpenSettings: () => void;
  lowStockCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  onOpenSettings,
  lowStockCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'pos', label: 'Punto de Venta', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventario', icon: Package, badge: lowStockCount },
    { id: 'sales', label: 'Ventas', icon: History },
    { id: 'expenses', label: 'Gastos', icon: Wallet },
    { id: 'catalog', label: 'Catálogo Cliente', icon: Store },
  ];

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(236, 72, 153, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Sparkles size={24} color="#ffffff" />
          </div>
          <div>
            <h1 className="font-serif text-gradient" style={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1 }}>
              {settings.name}
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {settings.subtitle}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(15, 10, 21, 0.6)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-color)', overflowX: 'auto', flex: 1, margin: '0 1rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1rem',
                  borderRadius: '999px',
                  border: 'none',
                  whiteSpace: 'nowrap',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '999px',
                    padding: '1px 6px',
                    lineHeight: 1.2,
                    marginLeft: '2px'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {lowStockCount > 0 && (
            <div 
              onClick={() => setActiveTab('inventory')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer'
              }}
              title="Ver productos con stock bajo en Inventario"
            >
              <AlertTriangle size={15} />
              <span>{lowStockCount} Stock Bajo</span>
            </div>
          )}

          <button
            onClick={onOpenSettings}
            className="btn btn-secondary"
            style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem' }}
            title="Configuración de Tienda y Respaldo"
          >
            <Settings size={18} />
            <span style={{ display: 'inline' }}>Ajustes</span>
          </button>
        </div>

      </div>
    </header>
  );
};
