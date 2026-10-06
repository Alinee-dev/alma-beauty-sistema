import React, { useState } from 'react';
import type { Sale, BusinessSettings } from '../types';
import { 
  Search, 
  Receipt, 
  Trash2, 
  Calendar, 
  CreditCard, 
  FileSpreadsheet,
  Edit
} from 'lucide-react';

interface SalesHistoryProps {
  sales: Sale[];
  settings: BusinessSettings;
  onViewReceipt: (sale: Sale) => void;
  onCancelSale: (saleId: string) => void;
  onEditSale: (sale: Sale) => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({
  sales,
  settings,
  onViewReceipt,
  onCancelSale,
  onEditSale,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('Todos');

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.customerPhone && s.customerPhone.includes(searchTerm));
    const matchesPayment = paymentFilter === 'Todos' || s.paymentMethod === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  const totalFilteredRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalFilteredProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);

  // CSV Export functionality
  const handleExportCSV = () => {
    if (sales.length === 0) return alert('No hay ventas registradas para exportar.');

    const headers = ['ID Venta', 'Fecha', 'Cliente', 'Telefono', 'Metodo Pago', 'Items Cantidad', 'Subtotal', 'Descuento', 'Total', 'Ganancia Neta'];
    const rows = sales.map((s) => [
      s.id,
      new Date(s.date).toLocaleString('es-AR'),
      `"${s.customerName || 'Cliente Ocasional'}"`,
      `"${s.customerPhone || ''}"`,
      s.paymentMethod,
      s.items.reduce((acc, item) => acc + item.quantity, 0),
      s.subtotal,
      s.discount,
      s.total,
      s.profit
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ventas_${settings.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
      
      {/* Top Banner & Stats */}
      <div className="glass-panel" style={{ padding: '1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 className="font-serif text-gradient" style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            Historial de Ventas
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Registro detallado de transacciones, tickets y exportación a Excel / CSV.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Filtrado ({filteredSales.length} ventas)</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
              {settings.currency} {totalFilteredRevenue.toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Ganancia: {settings.currency}{totalFilteredProfit.toLocaleString()})</span>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <FileSpreadsheet size={17} color="#34d399" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="glass-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Buscar por ID de venta, cliente o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="glass-input"
          style={{ width: '180px', cursor: 'pointer' }}
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="Todos">Todos los métodos</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Tarjeta">Tarjeta</option>
          <option value="MercadoPago">MercadoPago</option>
          <option value="Fiado">Fiado</option>
        </select>
      </div>

      {/* Sales List Table */}
      {filteredSales.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Receipt size={44} style={{ opacity: 0.4, marginBottom: '0.6rem' }} />
          <p style={{ fontSize: '1rem' }}>No se encontraron registros de ventas.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.9rem' }}>Fecha & Hora</th>
                <th style={{ padding: '0.9rem' }}>Cliente</th>
                <th style={{ padding: '0.9rem' }}>Productos</th>
                <th style={{ padding: '0.9rem' }}>Método Pago</th>
                <th style={{ padding: '0.9rem' }}>Total</th>
                <th style={{ padding: '0.9rem' }}>Ganancia</th>
                <th style={{ padding: '0.9rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => {
                const dateObj = new Date(sale.date);
                const formattedDate = dateObj.toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr 
                    key={sale.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <td style={{ padding: '0.8rem 0.9rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      {formattedDate}
                    </td>

                    <td style={{ padding: '0.8rem 0.9rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {sale.customerName || 'Cliente Ocasional'}
                      </div>
                      {sale.customerPhone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          📞 {sale.customerPhone}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.8rem 0.9rem' }}>
                      <div style={{ fontSize: '0.85rem' }}>
                        {sale.items.length} {sale.items.length === 1 ? 'producto' : 'productos'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </div>
                    </td>

                    <td style={{ padding: '0.8rem 0.9rem' }}>
                      <span className="badge badge-pink" style={{ fontSize: '0.72rem' }}>
                        <CreditCard size={11} /> {sale.paymentMethod}
                      </span>
                    </td>

                    <td style={{ padding: '0.8rem 0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {settings.currency} {sale.total.toLocaleString()}
                    </td>

                    <td style={{ padding: '0.8rem 0.9rem', color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}>
                      +{settings.currency} {sale.profit.toLocaleString()}
                    </td>

                    <td style={{ padding: '0.8rem 0.9rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
                          onClick={() => onViewReceipt(sale)}
                          title="Ver / Imprimir Comprobante"
                        >
                          <Receipt size={15} /> Ticket
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
                          onClick={() => onEditSale(sale)}
                          title="Editar precio, cliente o método de pago"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.4rem 0.6rem' }}
                          onClick={() => {
                            if (confirm(`¿Anular venta ${sale.id}? Se devuelven los productos al inventario.`)) {
                              onCancelSale(sale.id);
                            }
                          }}
                          title="Anular venta y reponer stock"
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
      )}

    </div>
  );
};
