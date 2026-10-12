import React, { useState, useEffect } from 'react';
import type { Product, Category, BusinessSettings } from '../types';
import { X, Save, Sparkles } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
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



export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  settings,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Maquillaje');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [offerPrice, setOfferPrice] = useState<number | ''>('');
  const [isOfferActive, setIsOfferActive] = useState<boolean>(false);
  const [stock, setStock] = useState<number | ''>('');
  const [minStock, setMinStock] = useState<number | ''>(3);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setCostPrice(productToEdit.costPrice);
      setSalePrice(productToEdit.salePrice);
      setOfferPrice(productToEdit.offerPrice || '');
      setIsOfferActive(productToEdit.isOfferActive || false);
      setStock(productToEdit.stock);
      setMinStock(productToEdit.minStock);
      setDescription(productToEdit.description || '');
      setImageUrl(productToEdit.imageUrl || '');
    } else {
      setName('');
      setCategory('Maquillaje');
      setCostPrice('');
      setSalePrice('');
      setOfferPrice('');
      setIsOfferActive(false);
      setStock(10);
      setMinStock(3);
      setDescription('');
      setImageUrl('');
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const cost = Number(costPrice) || 0;
  const price = Number(salePrice) || 0;
  const profit = price - cost;
  const marginPct = price > 0 ? Math.round((profit / price) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return alert('Por favor ingresa el nombre del producto.');
    if (price <= 0) return alert('El precio de venta debe ser mayor a 0.');

    const newProduct: Product = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      name: name.trim(),
      category,
      costPrice: cost,
      salePrice: price,
      offerPrice: offerPrice === '' ? undefined : Number(offerPrice),
      isOfferActive,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 3,
      description: description.trim() || undefined,
      imageUrl: imageUrl || undefined,
      createdAt: productToEdit ? productToEdit.createdAt : new Date().toISOString(),
    };

    onSave(newProduct);
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-panel" 
        style={{ width: '100%', maxWidth: '650px', padding: '1.8rem', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={22} color="var(--primary)" />
            <h3 className="font-serif text-gradient" style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {productToEdit ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Row 1: Category */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              Categoría
            </label>
              <select
                className="glass-input"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

          {/* Row 2: Name */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              Nombre del Producto *
            </label>
            <input
              type="text"
              className="glass-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Paleta de Sombras Satinadas Rose Glam"
              required
            />
          </div>

          {/* Row 3: Pricing & Profit Preview */}
          <div style={{ backgroundColor: 'rgba(15, 10, 21, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.8rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Costo de Compra ({settings.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  className="glass-input"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--primary-light)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Precio de Venta Público * ({settings.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  className="glass-input"
                  style={{ borderColor: 'var(--primary)', fontWeight: 700 }}
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            {price > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ganancia estimada por unidad:</span>
                <span style={{ fontWeight: 800, color: '#34d399' }}>
                  +{settings.currency} {profit.toLocaleString()} ({marginPct}% margen)
                </span>
              </div>
            )}
          </div>

          {/* Row 4: Stocks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                Cantidad en Stock Inicial
              </label>
              <input
                type="number"
                min="0"
                className="glass-input"
                value={stock}
                onChange={(e) => setStock(e.target.value ? Number(e.target.value) : '')}
                placeholder="10"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                Alerta de Stock Mínimo
              </label>
              <input
                type="number"
                min="1"
                className="glass-input"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value ? Number(e.target.value) : '')}
                placeholder="3"
              />
            </div>
          </div>

          {/* Row 5: Description */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              Descripción / Detalles
            </label>
            <textarea
              className="glass-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles de tonos, fórmula, volumen o material..."
            />
          </div>

          {/* Row 6: Image Selection */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              Imagen del Producto
            </label>
            <input
              type="file"
              accept="image/*"
              className="glass-input"
              onChange={handleImageUpload}
              style={{ marginBottom: '0.6rem' }}
            />
            {imageUrl && (
              <div style={{ marginTop: '0.5rem' }}>
                <img src={imageUrl} alt="Vista previa" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              <span>Guardar Producto</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
