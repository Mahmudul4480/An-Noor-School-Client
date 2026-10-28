import React from 'react';
import { subscribeToasts, type ToastItem } from '../../lib/toast';

export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  React.useEffect(() => subscribeToasts((t) => {
    setItems((prev) => [...prev, t]);
    setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 6000);
  }), []);
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" role="status" aria-live="assertive">
      {items.map((t) => (
        <div
          key={t.id}
          onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
          className={
            'cursor-pointer rounded-2xl shadow-xl border px-4 py-3 ' +
            (t.kind === 'error' ? 'bg-red-600 border-red-700 text-white' : t.kind === 'warning' ? 'bg-amber-500 border-amber-600 text-white' : 'bg-emerald-600 border-emerald-700 text-white')
          }
        >
          <p className="text-sm font-bold">{t.title}</p>
          {t.detail && <p className="text-[11px] opacity-90 mt-0.5">{t.detail}</p>}
        </div>
      ))}
    </div>
  );
}
