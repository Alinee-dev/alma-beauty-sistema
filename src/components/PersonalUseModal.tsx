import React, { useState, useEffect } from 'react';
import type { Product, PersonalUseItem, BusinessSettings } from '../types';
import { X, Heart, Sparkles, History, RotateCcw, PackageCheck } from 'lucide-react';

interface PersonalUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  productToTake?: Product | null;
  personalUseItems: PersonalUseItem[];
  onConfirmTake: (productId: string, quantity: number, reason?: string) => void;
  onUndoTake: (personalUseId: string) => void;
  settings: BusinessSettings;
  initialTab?: 'take' | 'history';
}

export const PersonalUseModal: React.FC<PersonalUseModalProps> = ({
  isOpen,
  onClose,
  products,
  productToTake,
  personalUseItems,
  onConfirmTake,
  onUndoTake,
  settings: _settings,
  initialTab = 'take',
}) => {
  const [activeTab, setActiveTab] = useState<'take' | 'history'>(initialTab);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    if (productToTake) {
      setSelectedProductId(productToTake.id);
      setActiveTab('take');
      setQuantity(1);
      setReason('');
    } else if (products.length > 0 && !selectedProductId) {
      const firstAvailable = products.find((p) => p.stock > 0) || products[0];
      if (firstAvailable) setSelectedProductId(firstAvailable.id);
    }
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [productToTake, isOpen, initialTab, products]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId);
  const availableStock = currentProduct ? currentProduct.stock : 0;

  const handleTakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    if (quantity <= 0) {
      alert('La cantidad debe ser al menos 1.');
      return;
    }

    if (quantity > availableStock) {
      alert(`Solo dispones de ${availableStock} unidades en stock.`);
      return;
    }

    onConfirmTake(currentProduct.id, quantity, reason.trim() || undefined);
    onClose();
  };

  const totalUnitsTaken = personalUseItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-panel" 
        style={{ width: '100%', maxWidth: '600px', padding: '1.8rem', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
            }}>
              <Heart size={20} color="#ffffff" fill="#ffffff" />
            </div>
            <div>
              <h3 className="font-serif text-gradient" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
                Para Mí (Uso Personal)
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Quedate con productos sin registrar ventas ni pagos
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.4rem', backgroundColor: 'var(--bg-surface-inner)', padding: '5px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('take')}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'take' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'take' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
          >
            <Sparkles size={16} />
            <span>Quedarme un Producto</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'history' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'history' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
          >
            <History size={16} />
            <span>Lo que me quedé ({totalUnitsTaken})</span>
          </button>
        </div>

        {/* TAB 1: RETIRAR PRODUCTO */}
        {activeTab === 'take' && (
          <form onSubmit={handleTakeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* Info Notice Banner con texto oscuro y alto contraste */}
            <div style={{
              backgroundColor: 'rgba(252, 231, 243, 0.7)',
              border: '1.5px solid rgba(244, 114, 182, 0.4)',
              borderRadius: '12px',
              padding: '0.9rem 1.1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.8rem'
            }}>
              <Sparkles size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
                <strong style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: '2px' }}>
                  ¡100% Sin costo ni cobro!
                </strong>
                <span style={{ color: 'var(--text-muted)' }}>
                  No se registra ninguna venta ni cobro de dinero. Solo se descuenta del stock de tu inventario físico para que siempre sepas exactamente cuántas unidades te quedan.
                </span>
              </div>
            </div>

            {/* Product Selector */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                Producto a retirar
              </label>
              <select
                className="glass-input"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setQuantity(1);
                }}
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                    {p.name} {p.stock <= 0 ? '(Sin stock)' : `(Stock actual: ${p.stock})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Product Card Preview */}
            {currentProduct && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.9rem',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-surface-inner)',
                border: '1px solid var(--border-color)'
              }}>
                <img
                  src={currentProduct.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200'}
                  alt={currentProduct.name}
                  style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    {currentProduct.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Categoría: {currentProduct.category}
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.35rem', alignItems: 'center' }}>
                    <span className="badge badge-pink" style={{ fontSize: '0.72rem' }}>
                      Stock actual: {currentProduct.stock} un.
                    </span>
                    {quantity > 0 && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700 }}>
                        Quedarán: {Math.max(0, currentProduct.stock - quantity)} un.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                ¿Cuántas unidades te quedás?
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-color)',
                  overflow: 'hidden'
                }}>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-main)',
                      padding: '0.6rem 1rem',
                      cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      opacity: quantity <= 1 ? 0.3 : 1
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={availableStock || 1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(availableStock || 1, Number(e.target.value) || 1)))}
                    style={{
                      width: '60px',
                      textAlign: 'center',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-main)',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    disabled={quantity >= availableStock}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-main)',
                      padding: '0.6rem 1rem',
                      cursor: quantity >= availableStock ? 'not-allowed' : 'pointer',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      opacity: quantity >= availableStock ? 0.3 : 1
                    }}
                  >
                    +
                  </button>
                </div>

                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  (Máximo disponible: {availableStock})
                </span>
              </div>
            </div>

            {/* Optional Reason / Note */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                Nota / Motivo (Opcional)
              </label>
              <input
                type="text"
                className="glass-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Para mi bolso, probando tono, regalo personal..."
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.8rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!currentProduct || availableStock <= 0}
                style={{ opacity: !currentProduct || availableStock <= 0 ? 0.5 : 1 }}
              >
                <Heart size={17} fill="#ffffff" />
                <span>Confirmar y Quedármelo</span>
              </button>
            </div>

          </form>
        )}

        {/* TAB 2: HISTORIAL DE LO QUE ME QUEDÉ */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Total retirado para vos: <strong style={{ color: 'var(--primary)' }}>{totalUnitsTaken} unidades</strong>
              </span>
            </div>

            {personalUseItems.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <PackageCheck size={44} style={{ opacity: 0.3, margin: '0 auto 0.8rem auto' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Aún no registraste productos para uso personal
                </h4>
                <p style={{ fontSize: '0.82rem', marginTop: '0.4rem', maxWidth: '340px', margin: '0.4rem auto 0 auto' }}>
                  Cuando te quedes con algún labial, brocha o maquillaje, podés registrarlo desde la pestaña de al lado.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '50vh', overflowY: 'auto' }}>
                {personalUseItems.map((item) => {
                  const formattedDate = new Date(item.date).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div 
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        backgroundColor: 'var(--bg-surface-inner)',
                        border: '1px solid var(--border-color)',
                        gap: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0, flex: 1 }}>
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200'}
                          alt={item.productName}
                          style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.productName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '2px' }}>
                            <span>{formattedDate}</span>
                            {item.reason && (
                              <>
                                <span>•</span>
                                <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>"{item.reason}"</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span className="badge badge-pink" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                          {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}
                        </span>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                          title="Devolver al stock si no lo usaste"
                          onClick={() => {
                            if (confirm(`¿Querés devolver ${item.quantity} un. de "${item.productName}" al stock del inventario?`)) {
                              onUndoTake(item.id);
                            }
                          }}
                        >
                          <RotateCcw size={14} style={{ marginRight: '4px' }} />
                          <span>Devolver</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.8rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
