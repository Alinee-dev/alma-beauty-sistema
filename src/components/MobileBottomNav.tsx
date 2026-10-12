import React from 'react';
import type { ActiveTab } from '../types';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Store, 
  Wallet 
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lowStockCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
}) => {
  const items = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'pos', label: 'Cobrar', icon: ShoppingCart },
    { id: 'inventory', label: 'Stock', icon: Package, badge: lowStockCount },
    { id: 'sales', label: 'Ventas', icon: History },
    { id: 'expenses', label: 'Gastos', icon: Wallet },
    { id: 'catalog', label: 'Catálogo', icon: Store },
  ];

  return (
    <div 
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0.45rem 0.25rem calc(0.45rem + env(safe-area-inset-bottom, 0px)) 0.25rem',
        zIndex: 999,
        boxShadow: '0 -4px 20px rgba(236, 72, 153, 0.08)'
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as ActiveTab)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              background: 'none',
              border: 'none',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.68rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              padding: '0.3rem 0.4rem',
              borderRadius: '8px',
              transition: 'var(--transition)',
              position: 'relative',
              flex: 1
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {Boolean(item.badge && item.badge > 0) && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  borderRadius: '999px',
                  padding: '1px 4px',
                  lineHeight: 1
                }}>
                  {item.badge}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
