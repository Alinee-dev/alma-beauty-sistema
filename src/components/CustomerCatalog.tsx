import React, { useState } from 'react';
import type { Product, Category, BusinessSettings } from '../types';
import { Search, Sparkles, MessageCircle, ShoppingBag, Check, Camera, CheckCircle2 } from 'lucide-react';

interface CustomerCatalogProps {
  products: Product[];
  settings: BusinessSettings;
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

export const CustomerCatalog: React.FC<CustomerCatalogProps> = ({ products, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [cartCount, setCartCount] = useState<Record<string, number>>({});

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory && p.stock > 0; // Show available stock items in catalog
  });

  const toggleAddToCart = (product: Product) => {
    setCartCount((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
  };

  const handleWhatsAppOrder = (product?: Product) => {
    let text = `¡Hola *${settings.name}*! 👋 Me gustaría hacer un pedido:\n\n`;

    if (product) {
      text += `• *${product.name}* (${settings.currency} ${product.salePrice.toLocaleString()})\n`;
    } else {
      const selectedItems = Object.entries(cartCount)
        .map(([id, qty]) => {
          const p = products.find((prod) => prod.id === id);
          if (!p || qty <= 0) return null;
          return `• ${qty}x *${p.name}* - ${settings.currency} ${(p.salePrice * qty).toLocaleString()}`;
        })
        .filter(Boolean);

      if (selectedItems.length === 0) {
        alert('Selecciona al menos un producto para pedir por WhatsApp.');
        return;
      }
      text += selectedItems.join('\n');
    }

    text += `\n\n¿Tienen disponibilidad y medios de pago? ¡Muchas gracias!`;

    const encodedText = encodeURIComponent(text);
    const cleanPhone = settings.whatsapp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
  };

  const totalSelectedItems = Object.values(cartCount).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Showcase Banner */}
      <div 
        className="glass-panel"
        style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(26, 18, 36, 0.8) 100%)',
          border: '1px solid var(--border-color-strong)',
          borderRadius: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <span className="badge badge-gold" style={{ marginBottom: '0.6rem' }}>
          <Sparkles size={13} /> Catálogo Online Oficial
        </span>
        <h2 className="font-serif text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>
          {settings.name}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0.4rem auto 0 auto' }}>
          Descubre nuestra colección exclusiva de maquillaje, cosmética y accesorios. ¡Elige tus favoritos y realiza tu pedido directo por WhatsApp!
        </p>

        {settings.instagram && (
          <div style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: '#db2777', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <Camera size={15} /> Siguenos en Instagram: <u>{settings.instagram}</u>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="glass-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Buscar por nombre de labial, paleta, serum, accesorio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          <button
            onClick={() => setSelectedCategory('Todos')}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.82rem',
              borderRadius: '999px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: selectedCategory === 'Todos' ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
              color: selectedCategory === 'Todos' ? '#fff' : 'var(--text-muted)',
              whiteSpace: 'nowrap'
            }}
          >
            Ver Todo ({products.filter((p) => p.stock > 0).length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = products.filter((p) => p.category === cat && p.stock > 0).length;
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.82rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: isSel ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                  color: isSel ? '#fff' : 'var(--text-muted)',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Order Cart Button if items selected */}
      {totalSelectedItems > 0 && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 900 }}>
          <button
            className="btn btn-success"
            onClick={() => handleWhatsAppOrder()}
            style={{
              padding: '0.9rem 1.6rem',
              fontSize: '1rem',
              borderRadius: '999px',
              boxShadow: '0 8px 30px rgba(16, 185, 129, 0.5)'
            }}
          >
            <MessageCircle size={22} />
            <span>Enviar Pedido en WhatsApp ({totalSelectedItems} items)</span>
          </button>
        </div>
      )}

      {/* Catalog Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.4rem' }}>
        {filteredProducts.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No se encontraron productos disponibles en esta categoría.</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const selectedQty = cartCount[product.id] || 0;

            return (
              <div 
                key={product.id}
                className="glass-panel-interactive"
                style={{
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '16px'
                }}
              >
                <div>
                  <div style={{ height: '220px', width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '0.9rem', position: 'relative' }}>
                    <img 
                      src={product.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400'} 
                      alt={product.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <span className="badge badge-pink" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(236, 72, 153, 0.85)' }}>
                        {product.category}
                      </span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.2rem 0 0.4rem 0', color: '#ffffff' }}>
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.8rem' }}>
                      {product.description}
                    </p>
                  )}
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                      {settings.currency} {product.salePrice.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <CheckCircle2 size={14} /> En Stock ({product.stock} un.)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleWhatsAppOrder(product)}
                      style={{ fontSize: '0.82rem', padding: '0.6rem' }}
                    >
                      <MessageCircle size={16} /> Consultar / Pedir
                    </button>

                    <button
                      className={`btn ${selectedQty > 0 ? 'btn-success' : 'btn-secondary'}`}
                      onClick={() => toggleAddToCart(product)}
                      style={{ padding: '0.6rem 0.8rem', fontSize: '0.82rem' }}
                      title="Agregar a lista de pedido"
                    >
                      {selectedQty > 0 ? <Check size={16} /> : <ShoppingBag size={16} />}
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
