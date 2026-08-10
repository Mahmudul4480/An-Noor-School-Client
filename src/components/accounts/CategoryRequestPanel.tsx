import React from 'react';
import { motion } from 'motion/react';
import { Plus, Loader2, Tag } from 'lucide-react';
import { fetchApprovedCategories, fetchCategoryRequests, requestCategory } from '../../lib/categories';
import type { CategoryType } from '../../types';

export function CategoryRequestPanel() {
  const [incomeCategories, setIncomeCategories] = React.useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = React.useState<string[]>([]);
  const [pending, setPending] = React.useState<Awaited<ReturnType<typeof fetchCategoryRequests>>>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [type, setType] = React.useState<CategoryType>('expense');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [income, expense, requests] = await Promise.all([
        fetchApprovedCategories('income'),
        fetchApprovedCategories('expense'),
        fetchCategoryRequests(),
      ]);
      setIncomeCategories(income);
      setExpenseCategories(expense);
      setPending(requests.filter((request) => request.status === 'pending'));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await requestCategory({ type, name, requestedBy: 'Accounts Dept.' });
      setName('');
      setMessage('Category request sent to Principal for approval.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-6 flex items-center gap-2">
          <Plus size={16} className="text-school-gold" /> Request New Category
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(['income', 'expense'] as CategoryType[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                  type === option ? 'bg-school-blue text-white border-school-blue' : 'bg-slate-50 text-school-muted border-slate-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
            required
          />
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          {message && <p className="text-xs font-bold text-emerald-600">{message}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Send to Principal'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-6 flex items-center gap-2">
          <Tag size={16} className="text-school-gold" /> Approved Categories
        </h3>
        {loading ? (
          <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-school-blue" /></div>
        ) : (
          <div className="space-y-6">
            <CategoryList title="Income" items={incomeCategories} />
            <CategoryList title="Expense" items={expenseCategories} />
            {pending.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mb-2">Pending Approval</p>
                <div className="space-y-2">
                  {pending.map((request) => (
                    <div key={request.id} className="p-3 bg-amber-50 rounded-xl text-[11px] font-bold text-amber-800">
                      {request.type.toUpperCase()}: {request.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-school-blue uppercase">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CategoryApprovalPanel() {
  const [requests, setRequests] = React.useState<Awaited<ReturnType<typeof fetchCategoryRequests>>>([]);
  const [loading, setLoading] = React.useState(true);
  const [actingId, setActingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const all = await fetchCategoryRequests();
    setRequests(all.filter((request) => request.status === 'pending'));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleReview = async (request: Awaited<ReturnType<typeof fetchCategoryRequests>>[number], action: 'approved' | 'rejected') => {
    setActingId(request.id);
    try {
      const { reviewCategoryRequest } = await import('../../lib/categories');
      await reviewCategoryRequest({ request, action, reviewedBy: 'Principal Office' });
      await load();
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
      <h3 className="text-lg font-black text-school-blue uppercase tracking-tight mb-2">Category Approvals</h3>
      <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mb-6">
        Income & Expense categories — approve to show in Accounts dropdown
      </p>

      {loading ? (
        <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto text-school-blue" /></div>
      ) : requests.length === 0 ? (
        <p className="text-sm text-school-muted font-medium py-8 text-center">No pending category requests.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black text-school-gold uppercase tracking-widest">{request.type} Category</p>
                <p className="text-sm font-black text-school-blue uppercase mt-1">{request.name}</p>
                <p className="text-[10px] text-school-muted font-bold mt-1">Requested by {request.requestedBy}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={actingId === request.id}
                  onClick={() => handleReview(request, 'approved')}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={actingId === request.id}
                  onClick={() => handleReview(request, 'rejected')}
                  className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
