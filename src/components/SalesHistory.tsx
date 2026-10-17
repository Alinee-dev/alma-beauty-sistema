import React, { useState } from 'react';
import type { PaymentMethod, Sale, BusinessSettings } from '../types';
import { 
  Search, 
  Receipt, 
  Trash2, 
  Calendar, 
  CreditCard, 
  FileSpreadsheet,
  Edit,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from 'lucide-react';
import {
  getSaleOutstanding,
  getSalePaidAmount,
  getSalePayments,
  getSalePaymentMethods,
} from '../services/salePayments';
import { FiadoAccountModal } from './FiadoAccountModal';

interface SalesHistoryProps {
  sales: Sale[];
  settings: BusinessSettings;
  onViewReceipt: (sale: Sale) => void;
  onCancelSale: (saleId: string) => void;
  onEditSale: (sale: Sale) => void;
  onCollectAccount: (
    sales: Sale[],
    amount: number,
    paymentMethod: Exclude<PaymentMethod, 'Fiado'>,
    date: string
  ) => void;
}

type SortBy = 'newest' | 'oldest' | 'highest' | 'lowest';

interface FiadoAccount {
  key: string;
  customerName: string;
  customerPhone?: string;
  sales: Sale[];
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({
  sales,
  settings,
  onViewReceipt,
  onCancelSale,
  onEditSale,
  onCollectAccount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [collectingAccount, setCollectingAccount] = useState<FiadoAccount | null>(null);

  const getPaymentMethodStyle = (method: string) => {
    switch (method) {
      case 'Fiado':
        return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }; // Rojo
      case 'Efectivo':
        return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }; // Verde
      case 'Transferencia':
        return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }; // Amarillo
      case 'Tarjeta':
        return { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }; // Azul
      case 'MercadoPago':
        return { backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)' }; // Celeste
      default:
        return { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' };
    }
  };

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.customerPhone && s.customerPhone.includes(searchTerm));
    const matchesPayment =
      paymentFilter === 'Todos' ||
      getSalePaymentMethods(s).includes(paymentFilter as PaymentMethod);
    return matchesSearch && matchesPayment;
  });

  const sortedAndFilteredSales = [...filteredSales]
    .filter((sale) =>
      sale.paymentMethod !== 'Fiado' || getSaleOutstanding(sale) === 0
    )
    .sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'highest') return b.total - a.total;
    if (sortBy === 'lowest') return a.total - b.total;
    return 0;
  });

  const accountMap = new Map<string, FiadoAccount>();
  for (const sale of sales.filter(
    (item) => item.paymentMethod === 'Fiado' && getSaleOutstanding(item) > 0
  )) {
    const normalizedName = sale.customerName?.trim().toLocaleLowerCase('es')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const key = normalizedName ? `name:${normalizedName}` : `sale:${sale.id}`;
    const account = accountMap.get(key) ?? {
      key,
      customerName: sale.customerName?.trim() || 'Cliente sin nombre',
      customerPhone: sale.customerPhone,
      sales: [],
    };
    account.sales.push(sale);
    account.customerPhone ||= sale.customerPhone;
    accountMap.set(key, account);
  }

  const accountMatchesSearch = (account: FiadoAccount): boolean => {
    const term = searchTerm.trim().toLocaleLowerCase('es');
    if (!term) return true;
    return account.sales.some((sale) =>
      sale.id.toLocaleLowerCase('es').includes(term) ||
      (sale.customerName?.toLocaleLowerCase('es').includes(term) ?? false) ||
      (sale.customerPhone?.includes(term) ?? false)
    );
  };

  const sortedAccounts = [...accountMap.values()]
    .filter((account) =>
      (paymentFilter === 'Todos' || paymentFilter === 'Fiado') &&
      accountMatchesSearch(account)
    )
    .sort((a, b) => {
      const aTotal = a.sales.reduce((total, sale) => total + sale.total, 0);
      const bTotal = b.sales.reduce((total, sale) => total + sale.total, 0);
      const aDate = Math.max(...a.sales.map((sale) => new Date(sale.date).getTime()));
      const bDate = Math.max(...b.sales.map((sale) => new Date(sale.date).getTime()));
      if (sortBy === 'oldest') return aDate - bDate;
      if (sortBy === 'highest') return bTotal - aTotal;
      if (sortBy === 'lowest') return aTotal - bTotal;
      return bDate - aDate;
    });

  const getAccountOutstanding = (account: FiadoAccount): number =>
    account.sales.reduce((total, sale) => total + getSaleOutstanding(sale), 0);
  const pendingAccounts = sortedAccounts.filter(
    (account) => getAccountOutstanding(account) > 0
  );
  const createAccountTicket = (account: FiadoAccount): Sale => ({
    id: `CUENTA-${account.sales[0].id}`,
    date: account.sales.reduce(
      (oldest, sale) => sale.date < oldest ? sale.date : oldest,
      account.sales[0].date
    ),
    items: account.sales.flatMap((sale) => sale.items),
    subtotal: account.sales.reduce((total, sale) => total + sale.subtotal, 0),
    discount: account.sales.reduce((total, sale) => total + sale.discount, 0),
    total: account.sales.reduce((total, sale) => total + sale.total, 0),
    profit: account.sales.reduce((total, sale) => total + sale.profit, 0),
    paymentMethod: 'Fiado',
    payments: account.sales.flatMap(getSalePayments),
    customerName: account.customerName,
    customerPhone: account.customerPhone,
    notes: `Cuenta consolidada de ${account.sales.length} tickets fiados.`,
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

        <select
          className="glass-input"
          style={{ width: '180px', cursor: 'pointer' }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
        >
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguas</option>
          <option value="highest">Mayor total</option>
          <option value="lowest">Menor total</option>
        </select>
      </div>

      {pendingAccounts.length > 0 && (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0.5rem' }}>
          <div style={{ padding: '0.8rem 0.9rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Cuentas pendientes por cliente</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
              Los tickets fiados de una persona se agrupan en una sola cuenta.
            </p>
          </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem' }}>Cliente / tickets</th>
                  <th style={{ padding: '0.75rem' }}>Total fiado</th>
                  <th style={{ padding: '0.75rem' }}>Cobrado</th>
                  <th style={{ padding: '0.75rem' }}>Pendiente</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendingAccounts.map((account) => {
                  const accountTotal = account.sales.reduce((total, sale) => total + sale.total, 0);
                  const accountPaid = account.sales.reduce((total, sale) => total + getSalePaidAmount(sale), 0);
                  const accountOutstanding = account.sales.reduce((total, sale) => total + getSaleOutstanding(sale), 0);
                  const isExpanded = expandedAccount === account.key;

                  return (
                    <React.Fragment key={account.key}>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.8rem' }}>
                          <div style={{ fontWeight: 700 }}>{account.customerName}</div>
                          {account.customerPhone && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{account.customerPhone}</div>
                          )}
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                            {account.sales.length} tickets · {account.sales.reduce((count, sale) => count + sale.items.length, 0)} líneas de productos
                          </div>
                        </td>
                        <td style={{ padding: '0.8rem', fontWeight: 700 }}>
                          {settings.currency} {accountTotal.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.8rem', color: '#34d399' }}>
                          {settings.currency} {accountPaid.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.8rem', color: accountOutstanding > 0 ? '#f87171' : '#34d399', fontWeight: 700 }}>
                          {settings.currency} {accountOutstanding.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                              onClick={() => onViewReceipt(createAccountTicket(account))}
                              title="Ver o imprimir el ticket consolidado"
                            >
                              <Receipt size={15} /> Ticket
                            </button>
                            {accountOutstanding > 0 && (
                              <button
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                                onClick={() => setCollectingAccount(account)}
                              >
                                <DollarSign size={15} /> Cobrar
                              </button>
                            )}
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem 0.55rem' }}
                              aria-label={isExpanded ? 'Ocultar tickets' : 'Ver tickets'}
                              onClick={() => setExpandedAccount(isExpanded ? null : account.key)}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} style={{ padding: '0.6rem 0.9rem 1rem' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                              Detalle de tickets incluidos en esta cuenta
                            </div>
                            {account.sales
                              .slice()
                              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .map((sale) => (
                                <div
                                  key={sale.id}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', padding: '0.6rem 0' }}
                                >
                                  <div style={{ fontSize: '0.8rem' }}>
                                    <strong>{sale.id}</strong> · {new Date(sale.date).toLocaleDateString('es-AR')} ·{' '}
                                    {settings.currency} {sale.total.toLocaleString()} · Pendiente:{' '}
                                    {settings.currency} {getSaleOutstanding(sale).toLocaleString()}
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem' }} onClick={() => onViewReceipt(sale)} title="Ver ticket original">
                                      <Receipt size={14} />
                                    </button>
                                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem' }} onClick={() => onEditSale(sale)} title="Editar ticket original">
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      className="btn btn-danger"
                                      style={{ padding: '0.35rem 0.5rem' }}
                                      onClick={() => {
                                        if (confirm(`¿Anular venta ${sale.id}? Se devuelven los productos al inventario.`)) {
                                          onCancelSale(sale.id);
                                        }
                                      }}
                                      title="Anular ticket original"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
        </div>
      )}

      {/* Sales List Table */}
      {sortedAndFilteredSales.length === 0 && pendingAccounts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Receipt size={44} style={{ opacity: 0.4, marginBottom: '0.6rem' }} />
          <p style={{ fontSize: '1rem' }}>No se encontraron registros de ventas.</p>
        </div>
      ) : sortedAndFilteredSales.length > 0 ? (
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
              {sortedAndFilteredSales.map((sale) => {
                const outstanding = getSaleOutstanding(sale);
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
                      {getSalePaymentMethods(sale).map((method) => (
                        <span
                          key={method}
                          className="badge"
                          style={{ fontSize: '0.72rem', ...getPaymentMethodStyle(method) }}
                        >
                          <CreditCard size={11} /> {method}
                        </span>
                      ))}
                      {sale.paymentMethod === 'Fiado' && outstanding > 0 && (
                        <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '0.25rem' }}>
                          Cobrado: {settings.currency} {getSalePaidAmount(sale).toLocaleString()} · Pendiente: {settings.currency} {outstanding.toLocaleString()}
                        </div>
                      )}
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
                          title="Editar datos de la venta"
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
      ) : null}

      {collectingAccount && (
        <FiadoAccountModal
          sales={collectingAccount.sales}
          currency={settings.currency}
          onClose={() => setCollectingAccount(null)}
          onCollect={(amount, paymentMethod, date) => {
            onCollectAccount(collectingAccount.sales, amount, paymentMethod, date);
            setCollectingAccount(null);
          }}
        />
      )}
    </div>
  );
};
