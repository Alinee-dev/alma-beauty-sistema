import React, { useState } from 'react';
import type { Product, Category, BusinessSettings, Sale } from '../types';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Package, 
  Grid,
  List as ListIcon,
  Heart
} from 'lucide-react';

interface InventoryProps {
  products: Product[];
  sales: Sale[];
  settings: BusinessSettings;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenPersonalUse: (product?: Product, initialTab?: 'take' | 'history') => void;
  personalUseCount: number;
}

const CATEGORIES: Category[] = [
  'Maquillaje',
  'Cuidado Facial',
  'Labios',
  'Ojos',
  'Brochas y Esponjas',
  'Accesorios',
  'Joyería',
  'Perfumes',
  'Kits y Combos',
];

export const Inventory: React.FC<InventoryProps> = ({
  products,
  sales,
  settings,
  onOpenAddModal,
  onOpenEditModal,
  onUpdateStock,
  onDeleteProduct,
  onOpenPersonalUse,
  personalUseCount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filtering logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesLowStock = onlyLowStock ? p.stock <= p.minStock : true;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Financial statistics
  const totalCostValue = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0);
  const totalSaleValue = products.reduce((acc, p) => acc + p.salePrice * p.stock, 0);
  const projectedProfit = totalSaleValue - totalCostValue;

  const totalCostOfSoldItems = sales.reduce((acc, sale) => 
    acc + sale.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0)
  , 0);
  const totalHistoricalInvestment = totalCostValue + totalCostOfSoldItems;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
      
      {/* Top Banner: Financial & Inventory Summary */}
      <div className="glass-panel" style={{ padding: '1.4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.2rem' }}>
        
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Catálogo Registrado</span>
          <h4 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {products.length} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>variedades</span>
          </h4>
        </div>

        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1.2 }}>Inversión Stock Actual<br/><span style={{fontSize: '0.65rem', opacity: 0.7}}>Solo mercadería física</span></span>
          <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {settings.currency} {totalCostValue.toLocaleString()}
          </h4>
        </div>

        <div style={{ borderLeft: '3px solid #a855f7', paddingLeft: '0.8rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1.2 }}>Inversión Total Histórica<br/><span style={{fontSize: '0.65rem', opacity: 0.7}}>Stock actual + Ya vendido</span></span>
          <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a855f7', marginTop: '0.2rem' }}>
            {settings.currency} {totalHistoricalInvestment.toLocaleString()}
          </h4>
        </div>

        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Valor Estimado en Ventas</span>
          <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)' }}>
            {settings.currency} {totalSaleValue.toLocaleString()}
          </h4>
        </div>

        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ganancia Potencial Esperada</span>
          <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
            {settings.currency} {projectedProfit.toLocaleString()}
          </h4>
        </div>

      </div>

      {/* Control Toolbar */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          
          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '0.8rem', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
            
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="glass-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="Buscar por producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="glass-input"
              style={{ width: '180px', cursor: 'pointer' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="Todos">Todas las categorías</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: onlyLowStock ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255,255,255,0.15)',
                backgroundColor: onlyLowStock ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                color: onlyLowStock ? '#f87171' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <AlertTriangle size={16} /> Stock Bajo ({products.filter((p) => p.stock <= p.minStock).length})
            </button>
          </div>

          {/* Right Actions & View mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ display: 'flex', backgroundColor: 'rgba(15, 10, 21, 0.6)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  cursor: 'pointer'
                }}
                title="Vista Lista"
              >
                <ListIcon size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  cursor: 'pointer'
                }}
                title="Vista Cuadrícula"
              >
                <Grid size={16} />
              </button>
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={() => onOpenPersonalUse(undefined, 'history')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                borderColor: 'rgba(236, 72, 153, 0.4)', 
                color: '#f472b6',
                backgroundColor: 'rgba(236, 72, 153, 0.1)'
              }}
              title="Ver historial de productos que te quedaste para vos"
            >
              <Heart size={16} fill="rgba(236, 72, 153, 0.4)" />
              <span>Para Mí {personalUseCount > 0 ? `(${personalUseCount})` : ''}</span>
            </button>

            <button className="btn btn-primary" onClick={onOpenAddModal}>
              <Plus size={18} />
              <span>Nuevo Producto</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      {filteredProducts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Package size={48} style={{ opacity: 0.4, marginBottom: '0.8rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No hay productos coincidentes</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Intenta ajustar tus filtros de búsqueda o agrega un nuevo producto.</p>
        </div>
      ) : viewMode === 'table' ? (
        
        /* TABLE VIEW */
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '1rem' }}>Producto</th>
                <th style={{ padding: '1rem' }}>Categoría</th>
                <th style={{ padding: '1rem' }}>Costo</th>
                <th style={{ padding: '1rem' }}>Precio Venta</th>
                <th style={{ padding: '1rem' }}>Margen</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Stock</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const currentPrice = product.salePrice;
                const profit = currentPrice - product.costPrice;
                const marginPct = currentPrice > 0 ? Math.round((profit / currentPrice) * 100) : 0;
                const isOut = product.stock <= 0;
                const isLow = product.stock <= product.minStock && !isOut;

                return (
                  <tr 
                    key={product.id}
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Item info */}
                    <td style={{ padding: '0.8rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <img
                          src={product.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200'}
                          alt={product.name}
                          style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{product.name}</div>
                          {product.description && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.8rem 1rem' }}>
                      <span className="badge badge-pink" style={{ fontSize: '0.7rem' }}>
                        {product.category}
                      </span>
                    </td>

                    <td style={{ padding: '0.8rem 1rem', color: 'var(--text-muted)' }}>
                      {settings.currency} {product.costPrice.toLocaleString()}
                    </td>

                    <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                      {settings.currency} {product.salePrice.toLocaleString()}
                    </td>

                    <td style={{ padding: '0.8rem 1rem' }}>
                      <span style={{ color: '#34d399', fontWeight: 600, fontSize: '0.82rem' }}>
                        +{marginPct}% ({settings.currency} {profit.toLocaleString()})
                      </span>
                    </td>

                    {/* Stock inline controls */}
                    <td style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(15, 10, 21, 0.6)', padding: '2px 6px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <button
                          onClick={() => onUpdateStock(product.id, Math.max(0, product.stock - 1))}
                          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 5px', fontSize: '0.9rem', fontWeight: 800 }}
                          title="Restar stock (-1)"
                        >
                          -
                        </button>
                        <span style={{ 
                          fontWeight: 800, 
                          padding: '0 4px', 
                          fontSize: '0.9rem', 
                          color: isOut ? '#f87171' : isLow ? '#fbbf24' : 'var(--text-main)' 
                        }}>
                          {product.stock}
                        </span>
                        <button
                          onClick={() => onUpdateStock(product.id, product.stock + 1)}
                          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 5px', fontSize: '0.9rem', fontWeight: 800 }}
                          title="Sumar stock (+1)"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ 
                            padding: '0.4rem 0.6rem',
                            color: '#f472b6',
                            borderColor: 'rgba(236, 72, 153, 0.35)',
                            backgroundColor: 'rgba(236, 72, 153, 0.08)',
                            opacity: product.stock <= 0 ? 0.35 : 1,
                            cursor: product.stock <= 0 ? 'not-allowed' : 'pointer'
                          }}
                          disabled={product.stock <= 0}
                          onClick={() => onOpenPersonalUse(product, 'take')}
                          title={product.stock <= 0 ? 'Sin stock' : 'Quedármelo para mí (Uso personal sin costo)'}
                        >
                          <Heart size={15} fill={product.stock > 0 ? "rgba(236, 72, 153, 0.4)" : "none"} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.6rem' }}
                          onClick={() => onOpenEditModal(product)}
                          title="Editar Producto"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.4rem 0.6rem' }}
                          onClick={() => {
                            if (confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
                              onDeleteProduct(product.id);
                            }
                          }}
                          title="Eliminar Producto"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      ) : (

        /* GRID VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.2rem' }}>
          {filteredProducts.map((product) => {
            const isOut = product.stock <= 0;
            const isLow = product.stock <= product.minStock && !isOut;

            return (
              <div key={product.id} className="glass-panel-interactive" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ height: '180px', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.9rem', position: 'relative' }}>
                    <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                      {isOut ? (
                        <span className="badge badge-red">Sin Stock</span>
                      ) : isLow ? (
                        <span className="badge badge-gold">Stock bajo ({product.stock})</span>
                      ) : (
                        <span className="badge badge-green">Stock ({product.stock})</span>
                      )}
                    </div>
                  </div>

                  <span className="badge badge-pink" style={{ fontSize: '0.7rem' }}>{product.category}</span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.4rem 0 0.2rem 0' }}>{product.name}</h4>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Costo: {settings.currency}{product.costPrice}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                      {settings.currency} {product.salePrice.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ 
                        padding: '0.4rem',
                        color: '#f472b6',
                        borderColor: 'rgba(236, 72, 153, 0.35)',
                        backgroundColor: 'rgba(236, 72, 153, 0.08)',
                        opacity: product.stock <= 0 ? 0.35 : 1,
                        cursor: product.stock <= 0 ? 'not-allowed' : 'pointer'
                      }}
                      disabled={product.stock <= 0}
                      onClick={() => onOpenPersonalUse(product, 'take')}
                      title={product.stock <= 0 ? 'Sin stock' : 'Quedármelo para mí'}
                    >
                      <Heart size={15} fill={product.stock > 0 ? "rgba(236, 72, 153, 0.4)" : "none"} />
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => onOpenEditModal(product)} title="Editar Producto">
                      <Edit3 size={15} />
                    </button>
                    <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => onDeleteProduct(product.id)} title="Eliminar Producto">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      )}

    </div>
  );
};
