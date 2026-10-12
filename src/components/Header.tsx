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
  Wallet,
  LogOut,
  Cloud
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: BusinessSettings;
  onOpenSettings: () => void;
  lowStockCount: number;
  userEmail?: string | null;
  isCloudConnected: boolean;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  onOpenSettings,
  lowStockCount,
  userEmail,
  isCloudConnected,
  onSignOut,
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
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', minWidth: 'fit-content' }} onClick={() => setActiveTab('dashboard')}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(236, 72, 153, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            flexShrink: 0
          }}>
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h1 className="font-serif text-gradient" style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.1, margin: 0 }}>
                {settings.name}
              </h1>
              {/* Cloud pill */}
              <span 
                title={isCloudConnected ? "Conectado a la base de datos Supabase en la nube" : "Modo de almacenamiento local"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '999px',
                  backgroundColor: isCloudConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: isCloudConnected ? '#059669' : '#d97706',
                  border: `1px solid ${isCloudConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  fontWeight: 600
                }}
              >
                <Cloud size={11} />
                <span className="hide-on-mobile">{isCloudConnected ? 'Nube' : 'Local'}</span>
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              {settings.subtitle}
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Desktop only) */}
        <nav className="desktop-nav hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(252, 231, 243, 0.5)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border-color)', overflowX: 'auto', flex: 1, margin: '0 0.75rem' }}>
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
                  gap: '0.45rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '999px',
                  border: 'none',
                  whiteSpace: 'nowrap',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    borderRadius: '999px',
                    padding: '1px 5px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 'fit-content' }}>
          
          {/* Low Stock Indicator */}
          {lowStockCount > 0 && (
            <div 
              onClick={() => setActiveTab('inventory')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#dc2626',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer'
              }}
              title="Ver productos con stock bajo en Inventario"
            >
              <AlertTriangle size={14} />
              <span className="hide-on-mobile">{lowStockCount} Bajo</span>
              <span className="show-on-mobile">{lowStockCount}</span>
            </div>
          )}

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
            title="Configuración de Tienda y Respaldo"
          >
            <Settings size={16} />
            <span className="hide-on-mobile">Ajustes</span>
          </button>

          {/* Sign Out button */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              title={userEmail ? `Sesión iniciada como: ${userEmail}. Clic para salir.` : 'Cerrar sesión'}
            >
              <LogOut size={16} />
              <span className="hide-on-mobile">Salir</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
