import React, { useState } from 'react';
import type { Sale, SaleItem, PaymentMethod, BusinessSettings } from '../types';
import { X, Save, DollarSign, User, CreditCard, Tag } from 'lucide-react';
import { getSaleOutstanding, getSalePayments } from '../services/salePayments';
import { roundPesos } from '../services/money';

const toLocalDateInputValue = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  return toLocalDateInputValueFromDate(date);
};

const toLocalDateInputValueFromDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toPaymentDate = (date: string): string =>
  new Date(`${date}T12:00:00`).toISOString();

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
  ...props
}) => {
  if (!isOpen || !sale) return null;

  return (
    <EditSaleForm
      key={sale.id}
      sale={sale}
      onClose={onClose}
      {...props}
    />
  );
};

type EditSaleFormProps = Omit<EditSaleModalProps, 'isOpen' | 'sale'> & { sale: Sale };

const EditSaleForm: React.FC<EditSaleFormProps> = ({
  onClose,
  sale,
  settings,
  onSave,
}) => {
  const [customerName, setCustomerName] = useState(sale.customerName || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(sale.paymentMethod);
  const [total, setTotal] = useState<number>(sale.total);
  const [items, setItems] = useState<SaleItem[]>(() => sale.items.map((item) => ({ ...item })));
  const [saleDateStr, setSaleDateStr] = useState<string>(
    sale.date.includes('T') ? sale.date.split('T')[0] : sale.date
  );
  const existingPayments = getSalePayments(sale);
  const hasLegacyPayment =
    existingPayments.length === 1 &&
    existingPayments[0].id.startsWith('legacy-');
  const [paymentDateStr, setPaymentDateStr] = useState<string>(
    existingPayments[0] && !hasLegacyPayment
      ? toLocalDateInputValue(existingPayments[0].date)
      : toLocalDateInputValueFromDate(new Date())
  );
  const [paymentDateError, setPaymentDateError] = useState('');

  const handleUpdateItemPrice = (index: number, newUnitPrice: number) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index] };
    item.unitPrice = roundPesos(newUnitPrice);
    item.total = roundPesos(item.unitPrice * item.quantity);
    updatedItems[index] = item;
    setItems(updatedItems);

    const newSubtotal = roundPesos(updatedItems.reduce((acc, i) => acc + i.total, 0));
    setTotal(newSubtotal);
  };

  const handleToggleOfferLabel = (index: number) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index] };
    if (item.productName.includes(' (Oferta)')) {
      item.productName = item.productName.replace(' (Oferta)', '');
    } else {
      item.productName = `${item.productName} (Oferta)`;
    }
    updatedItems[index] = item;
    setItems(updatedItems);
  };

  const handleSave = () => {
    const newSubtotal = roundPesos(items.reduce((acc, i) => acc + i.total, 0));
    const totalCost = roundPesos(items.reduce((acc, item) => acc + item.costPrice * item.quantity, 0));
    const normalizedTotal = roundPesos(total);
    const newDiscount = Math.max(0, newSubtotal - normalizedTotal);
    const newProfit = roundPesos(normalizedTotal - totalCost);

    const needsPaymentDate =
      paymentMethod !== 'Fiado' &&
      (sale.paymentMethod === 'Fiado' || hasLegacyPayment);
    if (needsPaymentDate && !paymentDateStr) {
      setPaymentDateError('Seleccioná la fecha en que recibiste el pago.');
      return;
    }

    const originalTime = sale.date.includes('T')
      ? sale.date.split('T')[1].slice(0, 8)
      : '12:00:00';
    const isCollectingFiado = sale.paymentMethod === 'Fiado' && paymentMethod !== 'Fiado';
    const paymentDate = paymentDateStr ? toPaymentDate(paymentDateStr) : '';
    const newDate = saleDateStr === sale.date.split('T')[0]
      ? sale.date
      : new Date(`${saleDateStr}T${originalTime}`).toISOString();
    const currentPayments = existingPayments;
    const payments = isCollectingFiado
      ? [
          ...currentPayments,
          ...(getSaleOutstanding(sale) > 0
            ? [{
                id: `payment-${sale.id}-${currentPayments.length + 1}`,
                date: paymentDate,
                amount: roundPesos(getSaleOutstanding(sale)),
                paymentMethod,
              }]
            : []),
        ]
      : paymentMethod === 'Fiado' && sale.paymentMethod !== 'Fiado'
        ? []
        : currentPayments.map((payment) => ({
            ...payment,
            ...(hasLegacyPayment ? { date: paymentDate } : {}),
            paymentMethod: paymentMethod === 'Fiado'
              ? payment.paymentMethod
              : paymentMethod,
          }));

    const updatedSale: Sale = {
      ...sale,
      date: newDate,
      items,
      subtotal: newSubtotal,
      customerName: customerName.trim() || undefined,
      paymentMethod,
      payments,
      total: normalizedTotal,
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

          {/* Date */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              Fecha de Venta
            </label>
            <input
              type="date"
              className="glass-input"
              value={saleDateStr}
              onChange={(e) => setSaleDateStr(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              <CreditCard size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Método de Pago
            </label>
            <select
              className="glass-input"
              value={paymentMethod}
              onChange={(e) => {
                const nextPaymentMethod = e.target.value as PaymentMethod;
                if (sale.paymentMethod === 'Fiado' && nextPaymentMethod !== 'Fiado') {
                  setPaymentDateStr(toLocalDateInputValueFromDate(new Date()));
                }
                setPaymentMethod(nextPaymentMethod);
              }}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="MercadoPago">MercadoPago</option>
              <option value="Fiado">Fiado</option>
            </select>
            {paymentMethod !== 'Fiado' &&
              (sale.paymentMethod === 'Fiado' || hasLegacyPayment) && (
              <div style={{ marginTop: '0.8rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Fecha de cobro
                </label>
                <input
                  type="date"
                  className="glass-input"
                  value={paymentDateStr}
                  onChange={(e) => {
                    setPaymentDateStr(e.target.value);
                    setPaymentDateError('');
                  }}
                  required
                />
                {paymentDateError && (
                  <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: '0.35rem 0 0' }}>
                    {paymentDateError}
                  </p>
                )}
              </div>
            )}
            {sale.paymentMethod === 'Fiado' && paymentMethod !== 'Fiado' && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                Se registrará el saldo como cobrado el {paymentDateStr} por {paymentMethod}.
              </p>
            )}
          </div>

          {/* Items Edit */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              Productos
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '150px', overflowY: 'auto' }}>
              {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, paddingRight: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{item.quantity}x {item.productName}</span>
                    <button 
                      onClick={() => handleToggleOfferLabel(index)}
                      style={{ background: 'none', border: 'none', color: item.productName.includes(' (Oferta)') ? '#ec4899' : 'var(--text-muted)', fontSize: '0.65rem', cursor: 'pointer', padding: 0, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}
                    >
                      <Tag size={10} /> {item.productName.includes(' (Oferta)') ? 'Quitar etiqueta' : 'Marcar como Oferta'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {settings.currency}
                    <input
                      type="number"
                      min="0"
                      step="1"
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
                onChange={(e) => setTotal(e.target.value ? roundPesos(Number(e.target.value)) : 0)}
                min="0"
                step="1"
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
