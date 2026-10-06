import React, { useState, useEffect } from 'react';
import type { Sale, SaleItem, PaymentMethod, BusinessSettings } from '../types';
import { X, Save, DollarSign, User, CreditCard } from 'lucide-react';

interface EditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings: BusinessSettings;
  onSave: (updatedSale: Sale) => void;
}

export const EditSaleModal: React.FC<EditSaleModalProps> = ({
  isOpen,
  onClose,
  sale,
  settings,
  onSave,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [total, setTotal] = useState<number>(0);
  const [items, setItems] = useState<SaleItem[]>([]);

  useEffect(() => {
    if (sale) {
      setCustomerName(sale.customerName || '');
      setPaymentMethod(sale.paymentMethod);
      setTotal(sale.total);
      // deep copy items so we don't mutate original sale props directly
      setItems(sale.items.map(i => ({ ...i })));
    }
  }, [sale]);

  if (!isOpen || !sale) return null;

  const handleUpdateItemPrice = (index: number, newUnitPrice: number) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index] };
    item.unitPrice = newUnitPrice;
    item.total = newUnitPrice * item.quantity;
    updatedItems[index] = item;
    setItems(updatedItems);

    const newSubtotal = updatedItems.reduce((acc, i) => acc + i.total, 0);
    setTotal(newSubtotal);
  };

  const handleSave = () => {
    const newSubtotal = items.reduce((acc, i) => acc + i.total, 0);
    const totalCost = items.reduce((acc, item) => acc + item.costPrice * item.quantity, 0);
    const newDiscount = Math.max(0, newSubtotal - total);
    const newProfit = total - totalCost;

    const updatedSale: Sale = {
      ...sale,
      items,
      subtotal: newSubtotal,
      customerName: customerName.trim() || undefined,
      paymentMethod,
      total: total,
      discount: newDiscount,
      profit: newProfit
    };

    onSave(updatedSale);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', position: 'relative' }}>
        
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <h3 className="font-serif text-gradient" style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem' }}>
          Editar Venta
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          ID: {sale.id}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Customer */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Cliente
            </label>
            <input
              type="text"
              className="glass-input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nombre del cliente"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              <CreditCard size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Método de Pago
            </label>
            <select
              className="glass-input"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="MercadoPago">MercadoPago</option>
              <option value="Fiado">Fiado</option>
            </select>
          </div>

          {/* Items Edit */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              Productos
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '150px', overflowY: 'auto' }}>
              {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                    <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.quantity}x {item.productName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {settings.currency}
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice === 0 ? '' : item.unitPrice}
                      onChange={(e) => handleUpdateItemPrice(index, Number(e.target.value))}
                      style={{ 
                        width: '60px', 
                        padding: '2px 4px', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '4px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        background: '#ffffff'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              <DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Precio Total Cobrado
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>
                {settings.currency}
              </span>
              <input
                type="number"
                className="glass-input"
                style={{ paddingLeft: '2.5rem', fontWeight: 800, color: 'var(--primary-light)' }}
                value={total === 0 ? '' : total}
                onChange={(e) => setTotal(Number(e.target.value))}
                min="0"
              />
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
              Subtotal original de productos: {settings.currency} {items.reduce((acc, i) => acc + i.total, 0).toLocaleString()}
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSave}
            style={{ marginTop: '0.5rem', padding: '0.75rem', fontSize: '0.9rem', borderRadius: '10px' }}
          >
            <Save size={18} /> Guardar Cambios
          </button>

        </div>

      </div>
    </div>
  );
};
