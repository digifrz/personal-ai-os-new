import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Download,
  Calendar,
  CreditCard,
  PieChart,
  Repeat,
  AlertCircle,
  X,
  Check,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FinanceTransactionItem } from '../types';
import { createTransaction, deleteTransaction } from '../services/db';

interface FinanceViewProps {
  transactions: FinanceTransactionItem[];
}

const CATEGORIES = [
  { id: 'housing', label: 'Housing & Rent', color: 'bg-indigo-500' },
  { id: 'food', label: 'Food & Groceries', color: 'bg-emerald-500' },
  { id: 'transport', label: 'Transit & Travel', color: 'bg-cyan-500' },
  { id: 'tech', label: 'Software & Tech', color: 'bg-violet-500' },
  { id: 'entertainment', label: 'Leisure & Fun', color: 'bg-amber-500' },
  { id: 'health', label: 'Health & Wellness', color: 'bg-rose-500' },
  { id: 'savings', label: 'Investments & Savings', color: 'bg-blue-500' },
  { id: 'income', label: 'Salary / Client Revenue', color: 'bg-teal-500' },
  { id: 'other', label: 'General Overhead', color: 'bg-zinc-500' },
];

export const FinanceView: React.FC<FinanceViewProps> = ({ transactions }) => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState<FinanceTransactionItem['category']>('food');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txNote, setTxNote] = useState('');
  const [txRecurring, setTxRecurring] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metrics computation
  const { totalIncome, totalExpense, netBalance, savingsRate } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') inc += t.amount || 0;
      else exp += t.amount || 0;
    });
    const net = inc - exp;
    const rate = inc > 0 ? Math.max(0, Math.round((net / inc) * 100)) : 0;
    return {
      totalIncome: inc,
      totalExpense: exp,
      netBalance: net,
      savingsRate: rate,
    };
  }, [transactions]);

  // Recurring subscriptions breakdown
  const recurringSubscriptions = useMemo(() => {
    return transactions.filter((t) => t.recurring && t.type === 'expense');
  }, [transactions]);

  const monthlyRecurringTotal = useMemo(() => {
    return recurringSubscriptions.reduce((acc, t) => acc + (t.amount || 0), 0);
  }, [recurringSubscriptions]);

  // Category breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
      });

    return Array.from(map.entries())
      .map(([catId, amount]) => {
        const meta = CATEGORIES.find((c) => c.id === catId) || { label: catId, color: 'bg-zinc-500' };
        const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
        return { catId, label: meta.label, color: meta.color, amount, percent };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, totalExpense]);

  const filteredTransactions = useMemo(() => {
    if (filterType === 'all') return transactions;
    return transactions.filter((t) => t.type === filterType);
  }, [transactions, filterType]);

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(txAmount);
    if (isNaN(parsed) || parsed <= 0 || !txNote.trim()) return;

    try {
      await createTransaction({
        userId: user?.uid || 'guest_user',
        type: txType,
        amount: parsed,
        category: txType === 'income' ? 'income' : txCategory,
        date: txDate,
        note: txNote.trim(),
        recurring: txRecurring,
      });

      setTxAmount('');
      setTxNote('');
      setIsModalOpen(false);
      showToast(`${txType === 'income' ? 'Income' : 'Expense'} of $${parsed.toFixed(2)} logged.`);
    } catch (e) {
      console.warn('Create transaction error:', e);
    }
  };

  const handleDelete = async (id: string, note: string) => {
    if (!confirm(`Delete transaction "${note}"?`)) return;
    try {
      await deleteTransaction(id);
      showToast('Transaction removed.');
    } catch (e) {
      console.warn('Delete transaction error:', e);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Note', 'Recurring'];
    const rows = transactions.map((t) => [
      t.date,
      t.type,
      t.category,
      t.amount.toFixed(2),
      `"${t.note.replace(/"/g, '""')}"`,
      t.recurring ? 'Yes' : 'No',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `personal_os_financial_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Financial ledger exported as CSV.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-16 right-6 z-50 rounded-2xl border border-emerald-500/40 bg-zinc-900/95 backdrop-blur-xl px-4 py-3 text-xs font-bold text-emerald-300 shadow-2xl animate-fade-in flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] font-medium">
            <span>Personal Ledger</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-400 font-bold">Net Balance: ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-400 font-bold">{savingsRate}% Savings Rate</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text)] mt-1">
            Personal Finance &amp; Budget Ledger
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            Track income velocity, monthly burn rate, recurring subscriptions, and export receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] hover:bg-white/5 disabled:opacity-40 transition-all shrink-0"
            title="Export CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-[var(--color-muted)]" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-2 text-xs font-black text-white shadow-lg hover:brightness-110 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </header>

      {/* Metric Highlights */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <span className="text-[11px] font-semibold text-[var(--color-muted)]">Total Inflow</span>
          <p className="text-2xl font-black font-mono text-emerald-400 mt-1 tabular-nums">
            ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-400/80 flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight className="w-3 h-3" /> Income recorded
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <span className="text-[11px] font-semibold text-[var(--color-muted)]">Total Outflow</span>
          <p className="text-2xl font-black font-mono text-rose-400 mt-1 tabular-nums">
            ${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-rose-400/80 flex items-center gap-0.5 mt-0.5">
            <ArrowDownRight className="w-3 h-3" /> Expenses recorded
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <span className="text-[11px] font-semibold text-[var(--color-muted)]">Net Cash Flow</span>
          <p className={`text-2xl font-black font-mono mt-1 tabular-nums ${netBalance >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
            ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-[var(--color-muted)]">Total retained</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <span className="text-[11px] font-semibold text-[var(--color-muted)]">Recurring Subscriptions</span>
          <p className="text-2xl font-black font-mono text-indigo-400 mt-1 tabular-nums">
            ${monthlyRecurringTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-indigo-400/80">{recurringSubscriptions.length} active recurring</span>
        </div>
      </section>

      {/* Middle Layout: Category Breakdown & Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category Breakdown (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--color-text)]">Expense Category Breakdown</h2>
            <span className="text-[11px] font-mono text-[var(--color-muted)]">{categoryBreakdown.length} active categories</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {categoryBreakdown.map((item) => (
              <div key={item.catId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--color-text)]">{item.label}</span>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <span className="text-[var(--color-muted)]">{item.percent}%</span>
                    <span className="font-bold text-[var(--color-text)]">${item.amount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}

            {categoryBreakdown.length === 0 && (
              <p className="text-xs text-[var(--color-muted)] py-4 text-center">
                No expense entries yet. Add entries to analyze category distribution.
              </p>
            )}
          </div>
        </div>

        {/* Recurring Subscriptions & Overhead (1 Col) */}
        <div className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-1.5">
              <Repeat className="w-4 h-4 text-indigo-400" />
              <span>Subscriptions</span>
            </h2>
            <span className="text-[11px] font-mono text-indigo-400 font-bold">${monthlyRecurringTotal}/mo</span>
          </div>

          <div className="space-y-2">
            {recurringSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-[var(--color-text)] truncate">{sub.note}</p>
                  <span className="text-[10px] text-[var(--color-muted)] capitalize">{sub.category}</span>
                </div>
                <span className="font-mono font-bold text-rose-400 shrink-0 ml-2">
                  ${sub.amount.toFixed(2)}
                </span>
              </div>
            ))}

            {recurringSubscriptions.length === 0 && (
              <p className="text-xs text-[var(--color-muted)] py-6 text-center">
                No recurring items flagged. Check "Recurring" on any entry to track regular monthly bills.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table with Filter Controls */}
      <section className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-[var(--color-text)]">Transaction History Ledger</h2>

          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] self-start sm:self-auto">
            {(['all', 'income', 'expense'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterType(mode)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all capitalize ${
                  filterType === mode
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Dense Financial Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)] font-mono text-[11px]">
                <th className="pb-2 font-semibold">Date</th>
                <th className="pb-2 font-semibold">Description</th>
                <th className="pb-2 font-semibold">Category</th>
                <th className="pb-2 font-semibold">Type</th>
                <th className="pb-2 font-semibold text-right">Amount</th>
                <th className="pb-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]/50">
              {filteredTransactions.map((tx) => {
                const isInc = tx.type === 'income';
                return (
                  <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 font-mono text-[var(--color-muted)] whitespace-nowrap">{tx.date}</td>
                    <td className="py-2.5 font-medium text-[var(--color-text)] pr-2">
                      <div className="flex items-center gap-1.5">
                        <span>{tx.note}</span>
                        {tx.recurring && (
                          <span className="text-[10px] text-indigo-400 font-mono" title="Recurring subscription">
                            [repeat]
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 text-[var(--color-muted)] capitalize whitespace-nowrap">{tx.category}</td>
                    <td className="py-2.5 whitespace-nowrap">
                      <span className={`text-[10px] font-bold ${isInc ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isInc ? '+ Inflow' : '- Outflow'}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono font-bold text-right tabular-nums whitespace-nowrap">
                      <span className={isInc ? 'text-emerald-400' : 'text-rose-400'}>
                        {isInc ? '+' : '-'}${tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap pl-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(tx.id, tx.note)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--color-muted)] hover:text-red-400 transition-opacity"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredTransactions.length === 0 && (
            <p className="text-xs text-[var(--color-muted)] py-8 text-center">
              No transactions match this filter. Tap "Add Entry" to record income or expenses.
            </p>
          )}
        </div>
      </section>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-base font-bold text-[var(--color-text)]">Record Financial Transaction</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="flex rounded-2xl bg-[var(--color-bg-secondary)] p-1 border border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    txType === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  Expense (- Outflow)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    txType === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  Income (+ Inflow)
                </button>
              </div>

              <div>
                <label className="block font-bold text-[var(--color-text)] mb-1">Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-sm font-mono font-bold text-[var(--color-text)] outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--color-text)] mb-1">Description / Note</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Cloud servers, Grocery run, Client payment"
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--color-text)] outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {txType === 'expense' && (
                  <div>
                    <label className="block font-bold text-[var(--color-text)] mb-1">Category</label>
                    <select
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value as any)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none"
                    >
                      {CATEGORIES.filter((c) => c.id !== 'income').map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={txType === 'income' ? 'col-span-2' : ''}>
                  <label className="block font-bold text-[var(--color-text)] mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs font-mono text-[var(--color-text)] outline-none"
                  />
                </div>
              </div>

              {txType === 'expense' && (
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={txRecurring}
                    onChange={(e) => setTxRecurring(e.target.checked)}
                    className="rounded border-[var(--color-border)] text-indigo-500"
                  />
                  <span className="font-semibold text-[var(--color-text)]">
                    Recurring monthly subscription / bill
                  </span>
                </label>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-muted)] hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
