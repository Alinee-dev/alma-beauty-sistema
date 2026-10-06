import React, { useState } from 'react';
import type { Expense, ExpenseCategory, BusinessSettings } from '../types';
import { Plus, Trash2, Calendar, Receipt, DollarSign } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  settings: BusinessSettings;
}

const CATEGORIES: ExpenseCategory[] = [
  'Bolsas/Empaques',
  'Publicidad/Marketing',
  'Envíos/Cadetería',
  'Mercadería/Insumos',
  'Alquiler/Servicios',
  'Otros'
];

export const Expenses: React.FC<ExpensesProps> = ({ expenses, onSaveExpense, onDeleteExpense, settings }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Mercadería/Insumos');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date,
      description,
      amount: Number(amount),
      category,
    };

    onSaveExpense(newExpense);
    setAmount('');
    setDescription('');
    setIsAdding(false);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="font-serif" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-hover)' }}>
            Registro de Gastos
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Controla tus egresos para calcular tu ganancia real.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
          <Plus size={18} /> Nuevo Gasto
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '1rem', borderRadius: '50%' }}>
          <DollarSign size={24} color="#dc2626" />
        </div>
        <div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Gastos Registrados</p>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>
            {settings.currency} {totalExpenses.toLocaleString()}
          </h3>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Agregar Gasto</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Fecha</label>
              <input type="date" className="glass-input" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Categoría</label>
              <select className="glass-input" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Monto ({settings.currency})</label>
              <input type="number" className="glass-input" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Descripción o Concepto</label>
            <input type="text" className="glass-input" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Ej: Pago de publicidad en Instagram" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Gasto</button>
          </div>
        </form>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-surface-inner)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Fecha</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Categoría</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Descripción</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Monto</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Receipt size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                  No hay gastos registrados.
                </td>
              </tr>
            ) : (
              expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                <tr key={expense.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Calendar size={14} /> {expense.date}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge badge-red">{expense.category}</span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{expense.description}</td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#dc2626' }}>
                    {settings.currency} {expense.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => onDeleteExpense(expense.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
