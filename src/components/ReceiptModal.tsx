import React, { useEffect } from 'react';
import type { Sale, BusinessSettings } from '../types';
import * as confettiPkg from 'canvas-confetti';
const confetti = confettiPkg.default || confettiPkg;
import { X, Printer, MessageCircle, CheckCircle2, Sparkles, Heart } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  isNewSale?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  isOpen,
  onClose,
  settings,
  isNewSale = false,
}) => {
  useEffect(() => {
    if (isOpen && sale && isNewSale) {
      // Trigger festive celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#f472b6', '#fbbf24', '#34d399']
      });
    }
  }, [sale, isOpen, isNewSale]);

  if (!isOpen || !sale) return null;

  const formattedDate = new Date(sale.date).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!sale.customerPhone) {
      alert('Por favor agrega un número de teléfono en la venta para enviar por WhatsApp.');
      return;
    }

    let text = `✨ *COMPROBANTE DE COMPRA - ${settings.name}* ✨\n`;
    text += `Ticket: *${sale.id}*\n`;
    text += `Fecha: ${formattedDate}\n`;
    if (sale.customerName) text += `Cliente: ${sale.customerName}\n`;
    text += `-----------------------------------\n`;

    sale.items.forEach((item) => {
      text += `• ${item.quantity}x ${item.productName} = ${settings.currency} ${item.total.toLocaleString()}\n`;
    });

    text += `-----------------------------------\n`;
    if (sale.discount > 0) text += `Descuento: -${settings.currency} ${sale.discount.toLocaleString()}\n`;
    text += `*TOTAL PAGADO:* ${settings.currency} ${sale.total.toLocaleString()}\n`;
    text += `Método de pago: ${sale.paymentMethod}\n\n`;
    text += `¡Muchas gracias por tu compra en ${settings.name}! 💖`;

    const encodedText = encodeURIComponent(text);
    const cleanPhone = sale.customerPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-panel" 
        style={{ width: '100%', maxWidth: '480px', padding: '1.8rem', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399' }}>
            <CheckCircle2 size={22} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>
              {isNewSale ? '¡Venta Registrada con Éxito!' : 'Comprobante de Venta'}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* PRINTABLE RECEIPT CONTAINER */}
        <div 
          id="printable-receipt"
          style={{
            backgroundColor: '#ffffff',
            color: '#111827',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            fontFamily: 'monospace',
            fontSize: '0.85rem'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1px dashed #ccc', paddingBottom: '0.8rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
              {settings.name}
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>{settings.subtitle}</div>
            <div style={{ fontSize: '0.75rem', color: '#374151', marginTop: '4px' }}>Tel: {settings.phone}</div>
            <div style={{ fontSize: '0.75rem', color: '#374151' }}>{settings.address}</div>
          </div>

          {/* Metadata */}
          <div style={{ marginBottom: '0.8rem', fontSize: '0.78rem' }}>
            <div><b>Ticket #:</b> {sale.id}</div>
            <div><b>Fecha:</b> {formattedDate}</div>
            {sale.customerName && <div><b>Cliente:</b> {sale.customerName}</div>}
            {sale.customerPhone && <div><b>Teléfono:</b> {sale.customerPhone}</div>}
            <div><b>Forma de Pago:</b> {sale.paymentMethod}</div>
          </div>

          {/* Table Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                <th style={{ padding: '4px 0' }}>Cant.</th>
                <th style={{ padding: '4px 0' }}>Detalle</th>
                <th style={{ padding: '4px 0', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '4px 0', verticalAlign: 'top', fontWeight: 700 }}>{item.quantity}x</td>
                  <td style={{ padding: '4px 0' }}>{item.productName}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', verticalAlign: 'top' }}>
                    {settings.currency} {item.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ borderTop: '1px dashed #000', paddingTop: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Subtotal:</span>
              <span>{settings.currency} {sale.subtotal.toLocaleString()}</span>
            </div>
            {sale.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Descuento:</span>
                <span>- {settings.currency} {sale.discount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #000' }}>
              <span>TOTAL:</span>
              <span>{settings.currency} {sale.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
            ¡Gracias por tu compra! <Sparkles size={14} style={{ display: 'inline' }} /><br />
            {settings.instagram}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '1.2rem' }}>
          <button className="btn btn-secondary" onClick={handlePrint} style={{ width: '100%' }}>
            <Printer size={18} /> Imprimir Ticket
          </button>
          <button className="btn btn-success" onClick={handleWhatsAppShare} style={{ width: '100%' }}>
            <MessageCircle size={18} /> Enviar WhatsApp
          </button>
        </div>

      </div>
    </div>
  );
};
