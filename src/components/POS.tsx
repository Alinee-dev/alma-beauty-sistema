import React, { useState } from 'react';
import type { Product, CartItem, PaymentMethod, Sale, Category, BusinessSettings } from '../types';
import { roundPesos } from '../services/money';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  Phone, 
  CheckCircle2, 
  Tag,
  X
} from 'lucide-react';

interface POSProps {
  products: Product[];
  settings: BusinessSettings;
  onCompleteSale: (sale: Sale) => void | Promise<void>;
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

export const POS: React.FC<POSProps> = ({ products, settings, onCompleteSale }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [notes, setNotes] = useState('');
  const [isCompletingSale, setIsCompletingSale] = useState(false);
  // Mobile cart sheet toggle
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`No hay suficiente stock. Stock máximo: ${product.stock}`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Only open cart automatically on the FIRST item added
        if (prevCart.length === 0) setIsCartOpen(true);
        return [...prevCart, { product: { ...product }, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              alert(`Máximo stock disponible: ${item.product.stock}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    setCart((prevCart) => prevCart.map((item) => {
      if (item.product.id === productId) {
        return {
          ...item,
          product: { ...item.product, salePrice: roundPesos(newPrice) }
        };
      }
      return item;
    }));
  };

  const toggleOfferItem = (productId: string) => {
    setCart((prevCart) => prevCart.map((item) => {
      if (item.product.id === productId) {
        const isCurrentlyOffer = item.product.name.includes(' (Oferta)');
        return {
          ...item,
          product: { 
            ...item.product, 
            name: isCurrentlyOffer ? item.product.name.replace(' (Oferta)', '') : `${item.product.name} (Oferta)`
          }
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const updated = prevCart.filter((item) => item.product.id !== productId);
      if (updated.length === 0) setIsCartOpen(false);
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountPercent(0);
    setNotes('');
    setIsCartOpen(false);
  };

  // Calculations
  const rawSubtotal = roundPesos(cart.reduce((acc, item) => acc + item.product.salePrice * item.quantity, 0));
  const discountAmount = Math.round((rawSubtotal * (discountPercent || 0)) / 100);
  const totalAmount = roundPesos(rawSubtotal - discountAmount);

  const totalCost = roundPesos(cart.reduce((acc, item) => acc + item.product.costPrice * item.quantity, 0));
  const netProfit = roundPesos(totalAmount - totalCost);

  const handleCheckout = async () => {
    if (cart.length === 0 || isCompletingSale) return;
    setIsCompletingSale(true);

    const saleDate = new Date().toISOString();
    const saleId = `SALE-${crypto.randomUUID()}`;
    const saleItems = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      category: item.product.category,
      unitPrice: item.product.salePrice,
      costPrice: item.product.costPrice,
      quantity: item.quantity,
      total: roundPesos(item.product.salePrice * item.quantity),
    }));

    const newSale: Sale = {
      id: saleId,
      date: saleDate,
      items: saleItems,
      subtotal: rawSubtotal,
      discount: discountAmount,
      total: totalAmount,
      profit: netProfit,
      paymentMethod,
      payments: paymentMethod === 'Fiado'
        ? []
        : [{
            id: `payment-${saleId}`,
            date: saleDate,
            amount: totalAmount,
            paymentMethod,
          }],
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      await onCompleteSale(newSale);
      clearCart();
    } catch (error) {
      console.error('Error completing sale:', error);
      alert('No se pudo completar la venta. El carrito sigue disponible para intentar nuevamente.');
    } finally {
      setIsCompletingSale(false);
    }
  };

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', minHeight: 'calc(100vh - 120px)' }}>

      {/* Mobile overlay: closes cart when tapped outside */}
      {isCartOpen && cart.length > 0 && (
        <div
          className="pos-cart-overlay"
          onClick={() => setIsCartOpen(false)}
          style={{
            display: 'none', // shown via CSS on mobile only
            position: 'fixed', inset: 0,
            background: 'rgba(51, 26, 36, 0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 499,
          }}
        />
      )}

      {/* LEFT COLUMN: Product Catalog & Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: '1 1 600px', minWidth: 0 }}>
        
        {/* Search & Category Filter Header */}
        <div className="glass-panel" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="glass-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="Buscar producto por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

          </div>

          {/* Categories Horizontal Scroll */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
            <button
              onClick={() => setSelectedCategory('Todos')}
              className={`badge ${selectedCategory === 'Todos' ? 'badge-pink' : 'badge-secondary'}`}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                backgroundColor: selectedCategory === 'Todos' ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                color: selectedCategory === 'Todos' ? '#fff' : 'var(--text-muted)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              Todos ({products.length})
            </button>

            {CATEGORIES.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    borderRadius: '999px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid */}
        <div className="pos-product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', overflowY: 'auto', maxHeight: 'calc(100vh - 240px)', paddingRight: '0.2rem' }}>
          {filteredProducts.length === 0 ? (
            <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1.1rem' }}>No se encontraron productos que coincidan.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isOut = product.stock <= 0;
              const isLow = product.stock <= product.minStock && !isOut;

              return (
                <div
                  key={product.id}
                  className="glass-panel-interactive"
                  style={{
                    padding: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    opacity: isOut ? 0.6 : 1,
                    position: 'relative'
                  }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', height: '140px', width: '100%', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.75rem', backgroundColor: '#000' }}>
                    <img
                      src={product.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400'}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    
                    {/* Stock Badge */}
                    <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                      {isOut ? (
                        <span className="badge badge-red">Sin Stock</span>
                      ) : isLow ? (
                        <span className="badge badge-gold">Stock: {product.stock}</span>
                      ) : (
                        <span className="badge badge-pink">Stock: {product.stock}</span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                      {product.category}
                    </span>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0.2rem 0 0.5rem 0', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', height: '2.6em' }}>
                      {product.name}
                    </h4>
                  </div>

                  {/* Price & Add button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                        {settings.currency} {product.salePrice.toLocaleString()}
                      </span>
                    </div>
                    <button
                      className="btn btn-primary"
                      disabled={isOut}
                      onClick={() => addToCart(product)}
                      style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '999px', boxShadow: '0 4px 10px rgba(236, 72, 153, 0.3)' }}
                    >
                      <Plus size={16} /> Agregar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Floating cart badge (mobile only) */}
      {cart.length > 0 && (
        <button
          className="pos-cart-fab"
          onClick={() => setIsCartOpen((v) => !v)}
          style={{ display: 'none' }} // shown via CSS
          aria-label="Ver carrito"
        >
          <ShoppingCart size={22} color="#fff" />
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#fff', color: 'var(--primary)',
            fontSize: '0.72rem', fontWeight: 800,
            borderRadius: '999px', width: '20px', height: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1
          }}>{totalCartItems}</span>
        </button>
      )}

      {/* RIGHT COLUMN: Shopping Cart & Checkout */}
      {cart.length > 0 && (
        <div
          className={`glass-panel pos-cart-sheet${isCartOpen ? ' pos-cart-open' : ''}`}
          style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', flex: '1 1 340px', maxWidth: '100%', minWidth: '300px' }}
        >
          {/* Drag handle + close – only visible on mobile via CSS */}
          <div className="pos-cart-sheet-handle" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <div style={{ width: '40px', height: '4px', background: 'rgba(219, 39, 119, 0.35)', borderRadius: '2px', margin: '0 auto' }} />
            <button
              onClick={() => setIsCartOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', position: 'absolute', right: '1rem', top: '0.8rem', padding: '4px' }}
              aria-label="Cerrar carrito"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Cart Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
            <ShoppingCart size={22} color="var(--primary)" style={{ flexShrink: 0 }} />
            <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Carrito de Venta
            </h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Trash2 size={14} /> Vaciar
            </button>
          )}
        </div>

        {/* Customer Info (Optional) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Cliente (Opcional)</label>
            <div style={{ position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="glass-input"
                style={{ paddingLeft: '1.8rem', fontSize: '0.82rem', padding: '0.4rem 0.6rem 0.4rem 1.8rem' }}
                placeholder="Nombre cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Teléfono / WhatsApp</label>
            <div style={{ position: 'relative' }}>
              <Phone size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="glass-input"
                style={{ paddingLeft: '1.8rem', fontSize: '0.82rem', padding: '0.4rem 0.6rem 0.4rem 1.8rem' }}
                placeholder="11 2345 6789"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

          {/* Cart Item List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem', paddingRight: '0.2rem' }}>
            {cart.map((item) => (
              <div
                key={item.product.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(15, 10, 21, 0.5)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                {/* Thumbnail */}
                <img
                  src={item.product.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200'}
                  alt={item.product.name}
                  style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                />

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-start' }}>
                  <h5 style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                    {item.product.name}
                  </h5>
                  <button 
                    onClick={() => toggleOfferItem(item.product.id)}
                    style={{ background: 'none', border: 'none', color: item.product.name.includes(' (Oferta)') ? '#ec4899' : 'var(--text-muted)', fontSize: '0.65rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}
                  >
                    <Tag size={10} /> {item.product.name.includes(' (Oferta)') ? 'Quitar etiqueta' : 'Marcar como Oferta'}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--primary-light)', fontSize: '0.8rem', fontWeight: 700 }}>
                    {settings.currency} 
                    <input 
                      type="number"
                      min="0"
                      step="1"
                      value={item.product.salePrice === 0 ? '' : item.product.salePrice}
                      onChange={(e) => updateItemPrice(item.product.id, Number(e.target.value))}
                      style={{ 
                        background: 'rgba(255,255,255,0.4)', 
                        border: '1px solid rgba(244, 114, 182, 0.4)', 
                        color: 'var(--primary-light)', 
                        fontWeight: 700, 
                        width: '65px', 
                        padding: '2px 4px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                      title="Editar precio para esta venta"
                    />
                  </div>
                </div>

                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '2px' }}>
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                  >
                    <Minus size={13} />
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                  title="Eliminar del carrito"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Payment Method & Discount Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.9rem' }}>
            
            {/* Payment Methods */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Método de Pago
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                {(['Efectivo', 'Transferencia', 'Tarjeta', 'MercadoPago', 'Fiado'] as PaymentMethod[]).map((method) => {
                  const isSelected = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      style={{
                        padding: '0.4rem 0.2rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: isSelected ? 'rgba(236, 72, 153, 0.25)' : 'rgba(15, 10, 21, 0.4)',
                        color: isSelected ? '#ffffff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {method}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discount % */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Tag size={14} /> Descuento (%)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                className="glass-input"
                style={{ width: '80px', padding: '0.3rem 0.5rem', textAlign: 'center', fontSize: '0.85rem' }}
                value={discountPercent || ''}
                onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                placeholder="0"
              />
            </div>

            {/* Totals Summary */}
            <div style={{ backgroundColor: 'rgba(15, 10, 21, 0.6)', padding: '0.8rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                <span>Subtotal:</span>
                <span>{settings.currency} {rawSubtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#f472b6', marginBottom: '0.2rem' }}>
                  <span>Descuento ({discountPercent}%):</span>
                  <span>- {settings.currency} {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                <span>TOTAL:</span>
                <span style={{ color: '#34d399' }}>{settings.currency} {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              className="btn btn-primary"
              onClick={handleCheckout}
              disabled={isCompletingSale}
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, borderRadius: '10px' }}
            >
              <CheckCircle2 size={20} />
              <span>
                {isCompletingSale
                  ? 'GUARDANDO VENTA...'
                  : `COMPLETAR VENTA (${settings.currency} ${totalAmount.toLocaleString()})`}
              </span>
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
