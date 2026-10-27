import React, { useEffect, useState } from 'react';
import type { Product, Category, BusinessSettings } from '../types';
import { Search, Sparkles, MessageCircle, ShoppingBag, Camera, CheckCircle2, Minus, Plus, Trash2, X, Heart } from 'lucide-react';
import { ProductImageGallery } from './ProductImageGallery';

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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const savedFavorites: unknown = JSON.parse(localStorage.getItem('aline_catalog_favorites') || '[]');
      return Array.isArray(savedFavorites)
        ? savedFavorites.filter((id): id is string => typeof id === 'string')
        : [];
    } catch (error) {
      console.error('Error al cargar favoritos del catálogo:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aline_catalog_favorites', JSON.stringify(favoriteIds));
    } catch (error) {
      console.error('Error al guardar favoritos del catálogo:', error);
    }
  }, [favoriteIds]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Favoritos'
      ? favoriteIds.includes(p.id)
      : selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory && p.stock > 0; // Show available stock items in catalog
  });
  const availableFavoriteCount = products.filter(
    (product) => product.stock > 0 && favoriteIds.includes(product.id)
  ).length;

  const toggleFavorite = (productId: string) => {
    setFavoriteIds((previous) => previous.includes(productId)
      ? previous.filter((id) => id !== productId)
      : [...previous, productId]);
  };

  const toggleAddToCart = (product: Product) => {
    const selectedQuantity = cartCount[product.id] || 0;
    if (selectedQuantity >= product.stock) {
      setCartNotice(`No puedes agregar más "${product.name}": no hay más stock disponible.`);
      return;
    }

    setCartNotice(null);
    setCartCount((prev) => {
      const latestQuantity = prev[product.id] || 0;
      if (latestQuantity >= product.stock) return prev;
      return { ...prev, [product.id]: latestQuantity + 1 };
    });
  };

  const getAvailableCartQuantity = (product: Product, quantity = cartCount[product.id] || 0) =>
    Math.min(Math.max(quantity, 0), Math.max(product.stock, 0));

  const getDisplayPrice = (product: Product) =>
    product.isOfferActive &&
    product.offerPrice !== undefined &&
    product.offerPrice > 0 &&
    product.offerPrice < product.salePrice
      ? product.offerPrice
      : product.salePrice;

  const updateCartQuantity = (product: Product, quantity: number) => {
    if (quantity > product.stock) {
      setCartNotice(`No puedes agregar más "${product.name}": no hay más stock disponible.`);
      return;
    }
    const nextQuantity = getAvailableCartQuantity(product, quantity);
    setCartNotice(null);
    setCartCount((prev) => {
      if (nextQuantity === 0) {
        return Object.fromEntries(
          Object.entries(prev).filter(([productId]) => productId !== product.id)
        );
      }
      return { ...prev, [product.id]: nextQuantity };
    });
  };

  const cartProducts = products
    .map((product) => ({
      product,
      quantity: getAvailableCartQuantity(product),
    }))
    .filter((item) => item.quantity > 0);
  const cartTotal = cartProducts.reduce(
    (total, item) => total + getDisplayPrice(item.product) * item.quantity,
    0
  );

  const handleWhatsAppOrder = (product?: Product) => {
    let text = `¡Hola *${settings.name}*! 👋 Me gustaría hacer un pedido:\n\n`;

    if (product) {
      const currentPrice = getDisplayPrice(product);
      text += `• *${product.name}* (${settings.currency} ${currentPrice.toLocaleString()})\n`;
    } else {
      const selectedItems = Object.entries(cartCount)
        .map(([id, qty]) => {
          const p = products.find((prod) => prod.id === id);
          if (!p) return null;
          const availableQuantity = getAvailableCartQuantity(p, qty);
          if (availableQuantity <= 0) return null;
          const currentPrice = getDisplayPrice(p);
          return `• ${availableQuantity}x *${p.name}* - ${settings.currency} ${(currentPrice * availableQuantity).toLocaleString()}`;
        })
        .filter(Boolean);

      if (selectedItems.length === 0) {
        alert('Selecciona al menos un producto para pedir por WhatsApp.');
        return;
      }
      text += `${selectedItems.join('\n')}\n\n*Total: ${settings.currency} ${cartTotal.toLocaleString()}*`;
    }

    text += `\n\n¿Tienen disponibilidad y medios de pago? ¡Muchas gracias!`;

    const encodedText = encodeURIComponent(text);
    const cleanPhone = settings.whatsapp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
  };

  const totalSelectedItems = products.reduce(
    (total, product) => total + getAvailableCartQuantity(product),
    0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Showcase Banner */}
      <div 
        className="glass-panel catalog-hero"
        style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(252, 231, 243, 0.96) 0%, rgba(255, 255, 255, 0.98) 100%)',
          border: '1px solid var(--border-color-strong)',
          borderRadius: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <span className="badge badge-gold" style={{ marginBottom: '0.6rem', color: '#92400e', backgroundColor: '#fff7ed', borderColor: '#fed7aa' }}>
          <Sparkles size={13} /> Catálogo Online Oficial
        </span>
        <h2 className="font-serif text-gradient catalog-hero-title" style={{ fontSize: '2.2rem', fontWeight: 800 }}>
          {settings.name}
        </h2>
        <p className="catalog-hero-description" style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0.4rem auto 0 auto' }}>
          Descubre nuestra colección exclusiva de maquillaje, cosmética y accesorios. ¡Elige tus favoritos y realiza tu pedido directo por WhatsApp!
        </p>

        {settings.instagram && (
          <div className="catalog-hero-social" style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: '#db2777', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <Camera size={15} /> Siguenos en Instagram: <u>{settings.instagram}</u>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-panel catalog-filters" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

        <div className="catalog-category-section">
          <div className="catalog-category-heading">
            <span>Categorías</span>
            <span className="catalog-category-hint">Desliza para explorar</span>
          </div>
          <div className="catalog-category-filters" role="group" aria-label="Filtrar productos por categoría">
            <button
              type="button"
              className={`catalog-category-chip${selectedCategory === 'Todos' ? ' is-selected' : ''}`}
              onClick={() => setSelectedCategory('Todos')}
              aria-pressed={selectedCategory === 'Todos'}
            >
              <span>Todos</span>
              <span className="catalog-category-count">{products.filter((p) => p.stock > 0).length}</span>
            </button>
            <button
              type="button"
              className={`catalog-category-chip catalog-favorites-chip${selectedCategory === 'Favoritos' ? ' is-selected' : ''}`}
              onClick={() => setSelectedCategory('Favoritos')}
              aria-pressed={selectedCategory === 'Favoritos'}
            >
              <Heart size={14} fill={selectedCategory === 'Favoritos' ? 'currentColor' : 'none'} />
              <span>Favoritos</span>
              <span className="catalog-category-count">{availableFavoriteCount}</span>
            </button>
            {CATEGORIES.map((cat) => {
              const count = products.filter((p) => p.category === cat && p.stock > 0).length;
              if (count === 0) return null;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`catalog-category-chip${isSelected ? ' is-selected' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={isSelected}
                >
                  <span>{cat}</span>
                  <span className="catalog-category-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      {cartNotice && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            right: '24px',
            bottom: totalSelectedItems > 0 ? '96px' : '24px',
            zIndex: 1100,
            maxWidth: 'min(420px, calc(100vw - 2rem))',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            background: '#fff7ed',
            border: '1px solid #fdba74',
            color: '#9a3412',
            boxShadow: '0 8px 24px rgba(51, 26, 36, 0.16)',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {cartNotice}
        </div>
      )}

      {totalSelectedItems > 0 && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 900 }}>
          <button
            className="btn btn-success"
            onClick={() => setIsCartOpen(true)}
            style={{
              padding: '0.9rem 1.6rem',
              fontSize: '1rem',
              borderRadius: '999px',
              boxShadow: '0 8px 30px rgba(16, 185, 129, 0.5)',
              maxWidth: 'calc(100vw - 2rem)',
            }}
          >
            <ShoppingBag size={21} />
            <span>Ver carrito ({totalSelectedItems}) · {settings.currency} {cartTotal.toLocaleString()}</span>
          </button>
        </div>
      )}

      {isCartOpen && (
        <div
          onClick={() => setIsCartOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(51, 26, 36, 0.45)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-cart-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(100%, 460px)',
              height: '100%',
              background: 'var(--bg-main)',
              boxShadow: '-12px 0 35px rgba(51, 26, 36, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.25rem',
            }}
          >
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 id="catalog-cart-title" style={{ color: 'var(--text-main)', fontSize: '1.35rem' }}>Tu carrito</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{totalSelectedItems} productos</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                aria-label="Cerrar carrito"
                onClick={() => setIsCartOpen(false)}
                style={{ padding: '0.55rem' }}
              >
                <X size={20} />
              </button>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
              {cartProducts.map(({ product, quantity }) => (
                <article
                  key={product.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '64px minmax(0, 1fr) auto',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 0',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <ProductImageGallery
                    product={product}
                    showControls={false}
                    containerStyle={{ width: '64px', height: '64px', borderRadius: '10px', flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.35 }}>{product.name}</h3>
                    <p style={{ color: 'var(--primary-hover)', fontWeight: 700, marginTop: '0.25rem' }}>
                      {settings.currency} {getDisplayPrice(product).toLocaleString()}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        aria-label={`Quitar una unidad de ${product.name}`}
                        onClick={() => updateCartQuantity(product, quantity - 1)}
                        style={{ padding: '0.25rem' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span aria-live="polite" style={{ minWidth: '1rem', textAlign: 'center', color: 'var(--text-main)', fontWeight: 700 }}>
                        {quantity}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        aria-label={`Agregar una unidad de ${product.name}`}
                        onClick={() => updateCartQuantity(product, quantity + 1)}
                        style={{ padding: '0.25rem' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.65rem' }}>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {settings.currency} {(getDisplayPrice(product) * quantity).toLocaleString()}
                    </strong>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      aria-label={`Eliminar ${product.name} del carrito`}
                      onClick={() => updateCartQuantity(product, 0)}
                      style={{ padding: '0.3rem', color: 'var(--danger)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <footer style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span>{settings.currency} {cartTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: 800 }}>
                <span>Total</span>
                <span>{settings.currency} {cartTotal.toLocaleString()}</span>
              </div>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => handleWhatsAppOrder()}
                disabled={cartProducts.length === 0}
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
              >
                <MessageCircle size={20} />
                <span>Continuar por WhatsApp</span>
              </button>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.6rem' }}>
                El stock se confirma al coordinar tu pedido.
              </p>
            </footer>
          </section>
        </div>
      )}

      {/* Catalog Grid */}
      <div className="catalog-product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.4rem' }}>
        {filteredProducts.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No se encontraron productos disponibles en esta categoría.</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const selectedQty = getAvailableCartQuantity(product);
            const isAtStockLimit = selectedQty >= product.stock;

            return (
              <div 
                key={product.id}
                className="glass-panel-interactive catalog-product-card"
                style={{
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '16px'
                }}
              >
                <div>
                  <ProductImageGallery
                    product={product}
                    containerStyle={{ height: '220px', width: '100%', borderRadius: '12px', marginBottom: '0.9rem' }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFavorite(product.id)}
                      aria-label={favoriteIds.includes(product.id)
                        ? `Quitar ${product.name} de favoritos`
                        : `Agregar ${product.name} a favoritos`}
                      aria-pressed={favoriteIds.includes(product.id)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '30px',
                        height: '30px',
                        display: 'grid',
                        placeItems: 'center',
                        border: 'none',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.88)',
                        color: favoriteIds.includes(product.id) ? 'var(--primary-hover)' : '#db2777',
                        boxShadow: '0 1px 5px rgba(51, 26, 36, 0.12)',
                        cursor: 'pointer',
                      }}
                    >
                      <Heart size={16} fill={favoriteIds.includes(product.id) ? 'currentColor' : 'none'} />
                    </button>
                  </ProductImageGallery>

                  <h3 className="catalog-product-name" style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.2rem 0 0.4rem 0', color: 'var(--text-main)' }}>
                    {product.name}
                  </h3>

                  <span
                    className="catalog-product-category"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.22rem 0.6rem',
                      marginBottom: '0.45rem',
                      borderRadius: '999px',
                      background: 'rgba(219, 39, 119, 0.09)',
                      color: 'var(--primary-hover)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      lineHeight: 1.4,
                    }}
                  >
                    {product.category}
                  </span>
                  
                  {product.description && (
                    <p className="catalog-product-description" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.8rem' }}>
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="catalog-product-footer" style={{ marginTop: '0.55rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)' }}>
                  <div className="catalog-product-price-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {settings.currency} {getDisplayPrice(product).toLocaleString()}
                      </span>
                      {getDisplayPrice(product) < product.salePrice && (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                          MRP <s>{settings.currency} {product.salePrice.toLocaleString()}</s>
                        </span>
                      )}
                    </div>
                    {selectedQty > 0 ? (
                      <div className="catalog-quantity-control" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <button
                          type="button"
                          className="catalog-quantity-button"
                          onClick={() => updateCartQuantity(product, selectedQty - 1)}
                          aria-label={`Quitar una unidad de ${product.name}`}
                          style={{
                            width: '34px',
                            height: '34px',
                            display: 'grid',
                            placeItems: 'center',
                            border: '1px solid var(--border-color)',
                            borderRadius: '50%',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                          }}
                        >
                          <Minus size={15} />
                        </button>
                        <span aria-live="polite" style={{ minWidth: '1.25rem', textAlign: 'center', color: 'var(--text-main)', fontWeight: 700 }}>
                          {selectedQty}
                        </span>
                        <button
                          type="button"
                          className="catalog-add-button"
                          onClick={() => toggleAddToCart(product)}
                          aria-label={`Agregar una unidad de ${product.name}`}
                          title={isAtStockLimit ? 'No hay más stock disponible' : 'Agregar al carrito'}
                          style={{
                            width: '38px',
                            height: '38px',
                            display: 'grid',
                            placeItems: 'center',
                            border: 'none',
                            borderRadius: '50%',
                            background: '#1f2937',
                            color: '#fff',
                            boxShadow: '0 3px 8px rgba(31, 41, 55, 0.25)',
                            cursor: 'pointer',
                          }}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="catalog-add-button"
                        onClick={() => toggleAddToCart(product)}
                        aria-label={`Agregar ${product.name} al carrito`}
                        title="Agregar al carrito"
                        style={{
                          width: '40px',
                          height: '40px',
                          display: 'grid',
                          placeItems: 'center',
                          border: 'none',
                          borderRadius: '50%',
                          background: '#1f2937',
                          color: '#fff',
                          boxShadow: '0 3px 8px rgba(31, 41, 55, 0.25)',
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={19} />
                      </button>
                    )}
                  </div>
                  <span className="catalog-availability" style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.35rem' }}>
                    <CheckCircle2 size={13} /> Disponible
                  </span>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
