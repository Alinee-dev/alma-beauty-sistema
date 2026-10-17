import { useState } from 'react';
import type { PaymentMethod, Sale } from '../types';
import { X } from 'lucide-react';
import { getSaleOutstanding } from '../services/salePayments';
import { roundPesos } from '../services/money';

type CollectionMethod = Exclude<PaymentMethod, 'Fiado'>;

interface FiadoAccountModalProps {
  sales: Sale[];
  currency: string;
  onClose: () => void;
  onCollect: (amount: number, paymentMethod: CollectionMethod, date: string) => void;
}

const getTodayInputDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toPaymentDate = (date: string): string =>
  new Date(`${date}T12:00:00`).toISOString();

export const FiadoAccountModal: React.FC<FiadoAccountModalProps> = ({
  sales,
  currency,
  onClose,
  onCollect,
}) => {
  const [collectionType, setCollectionType] = useState<'installment' | 'full'>('installment');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<CollectionMethod>('Efectivo');
  const [date, setDate] = useState(getTodayInputDate);
  const [error, setError] = useState('');

  const outstanding = sales.reduce(
    (total, sale) => total + getSaleOutstanding(sale),
    0
  );
  const amountToCollect = collectionType === 'full'
    ? roundPesos(outstanding)
    : Number(amount);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!Number.isFinite(amountToCollect) || !Number.isInteger(amountToCollect) || amountToCollect <= 0) {
      setError('Ingresá un monto de abono mayor que cero.');
      return;
    }
    if (amountToCollect > outstanding) {
      setError(`El monto no puede superar la deuda de ${currency} ${outstanding.toLocaleString()}.`);
      return;
    }
    if (!date) {
      setError('Seleccioná la fecha en que recibiste el pago.');
      return;
    }

    onCollect(amountToCollect, paymentMethod, toPaymentDate(date));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="glass-panel"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '1.5rem',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
          <div>
            <h3 className="font-serif text-gradient" style={{ fontSize: '1.35rem', fontWeight: 700 }}>
              Cobrar cuenta fiada
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
              {sales[0]?.customerName || 'Cliente'} · {sales.length} tickets agrupados
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="btn btn-secondary">
            <X size={18} />
          </button>
        </div>

        <div style={{ margin: '1rem 0', padding: '0.9rem', borderRadius: '10px', background: 'rgba(248, 113, 113, 0.1)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Saldo pendiente de la cuenta</div>
          <strong style={{ fontSize: '1.35rem', color: '#f87171' }}>
            {currency} {outstanding.toLocaleString()}
          </strong>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
          <button
            type="button"
            className={`btn ${collectionType === 'installment' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setCollectionType('installment');
              setError('');
            }}
          >
            Abono
          </button>
          <button
            type="button"
            className={`btn ${collectionType === 'full' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setCollectionType('full');
              setError('');
            }}
          >
            Cobro completo
          </button>
        </div>

        {collectionType === 'installment' && (
          <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Monto del abono ({currency})
            <input
              autoFocus
              type="number"
              className="glass-input"
              min="1"
              max={outstanding}
              step="1"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError('');
              }}
              required
              style={{ marginTop: '0.3rem' }}
            />
          </label>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Método de pago
            <select
              className="glass-input"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as CollectionMethod)}
              style={{ marginTop: '0.3rem' }}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="MercadoPago">MercadoPago</option>
            </select>
          </label>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Fecha del cobro
            <input
              type="date"
              className="glass-input"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              style={{ marginTop: '0.3rem' }}
            />
          </label>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginBottom: '0.9rem' }}>
          El abono se aplicará primero a los tickets más antiguos.
        </p>

        {error && <p role="alert" style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '0.8rem' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">
            Registrar {collectionType === 'full' ? 'cobro completo' : 'abono'}
            {collectionType === 'full'
              ? ` · ${currency} ${outstanding.toLocaleString()}`
              : ''}
          </button>
        </div>
      </form>
    </div>
  );
};
