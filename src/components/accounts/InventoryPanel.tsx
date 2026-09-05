import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Boxes,
  Plus,
  Loader2,
  X,
  AlertTriangle,
  ShoppingCart,
  PackagePlus,
  PackageMinus,
  Pencil,
  TrendingUp,
  Layers,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  archiveInventoryItem,
  computeInventoryStats,
  fetchInventoryItems,
  fetchInventoryLots,
  fetchInventoryMovements,
  findLowStockItems,
  fifoCostTotal,
  INVENTORY_CLASS_OPTIONS,
  INVENTORY_PURPOSE_OPTIONS,
  INVENTORY_UNIT_OPTIONS,
  itemPurpose,
  issueInventoryStock,
  purposeLabel,
  openLots,
  previewFifoConsumption,
  recordInventorySale,
  remainingStock,
  restockInventoryItem,
  restoreInventoryItem,
  saveInventoryItem,
  stockValue,
} from '../../lib/inventory';
import { fetchAccounts, ONLINE_PAYMENT_ACCOUNT_ID } from '../../lib/ledger';
import { fetchStudents } from '../../lib/students';
import type {
  InventoryBuyerType,
  InventoryItem,
  InventoryPurpose,
  InventoryLot,
  InventoryMovement,
  LedgerAccount,
  Student,
} from '../../types';

export function InventoryPanel() {
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [lots, setLots] = React.useState<InventoryLot[]>([]);
  const [movements, setMovements] = React.useState<InventoryMovement[]>([]);
  const [accounts, setAccounts] = React.useState<LedgerAccount[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [purposeFilter, setPurposeFilter] = React.useState<'all' | InventoryPurpose>('all');
  const [classFilter, setClassFilter] = React.useState('all');
  const [issueItem, setIssueItem] = React.useState<InventoryItem | null>(null);
  const [showArchived, setShowArchived] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const [editItem, setEditItem] = React.useState<InventoryItem | null>(null);
  const [showItemForm, setShowItemForm] = React.useState(false);
  const [saleItem, setSaleItem] = React.useState<InventoryItem | null>(null);
  const [restockItem, setRestockItem] = React.useState<InventoryItem | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [itemData, movementData, lotData, accountData, studentData] = await Promise.all([
        fetchInventoryItems({ includeArchived: true }),
        fetchInventoryMovements(),
        fetchInventoryLots(),
        fetchAccounts(),
        fetchStudents(),
      ]);
      setItems(itemData);
      setMovements(movementData);
      setLots(lotData);
      setAccounts(accountData);
      setStudents(studentData.filter((student) => student.status === 'Active'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const activeItems = items.filter((item) => !item.archived);
  const archivedItems = items.filter((item) => item.archived);
  const stats = computeInventoryStats(activeItems, movements, lots);
  const lowStock = findLowStockItems(activeItems);
  const collectionAccounts = accounts.filter((account) => account.id !== ONLINE_PAYMENT_ACCOUNT_ID);

  const classOptions = ['all', ...new Set(activeItems.map((item) => item.className))];
  const purposeItems = activeItems.filter(
    (item) => purposeFilter === 'all' || itemPurpose(item) === purposeFilter,
  );
  const visibleItems = (showArchived ? archivedItems : purposeItems).filter(
    (item) =>
      (purposeFilter === 'all' || itemPurpose(item) === purposeFilter) &&
      (classFilter === 'all' || item.className === classFilter),
  );
  const studentStore = activeItems.filter((item) => itemPurpose(item) === 'student');
  const schoolStore = activeItems.filter((item) => itemPurpose(item) === 'school');

  const sheetTotals = visibleItems.reduce(
    (acc, item) => ({
      quantity: acc.quantity + item.purchasedQty,
      sold: acc.sold + item.soldQty,
      remaining: acc.remaining + remainingStock(item),
      value: acc.value + stockValue(item, lots),
    }),
    { quantity: 0, sold: 0, remaining: 0, value: 0 },
  );

  const handleArchiveToggle = async (item: InventoryItem) => {
    setBusyId(item.id);
    setError('');
    try {
      if (item.archived) await restoreInventoryItem(item);
      else await archiveInventoryItem(item);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Stock Items" value={String(stats.itemCount)} icon={<Layers size={18} />} tone="blue" />
        <StatCard label="For Student" value={`${studentStore.length} • ৳ ${Math.round(computeInventoryStats(studentStore, movements, lots).stockValue).toLocaleString('en-BD')}`} icon={<ShoppingCart size={18} />} tone="emerald" />
        <StatCard label="For School" value={`${schoolStore.length} • ৳ ${Math.round(computeInventoryStats(schoolStore, movements, lots).stockValue).toLocaleString('en-BD')}`} icon={<Boxes size={18} />} tone="amber" />
        <StatCard label="Low Stock Alerts" value={String(stats.lowStockCount)} icon={<AlertTriangle size={18} />} tone="red" />
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-[2rem] p-6">
          <h4 className="text-xs font-black text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> Purchase Alert — {lowStock.length} item reorder level-এ নেমেছে
          </h4>
          <p className="text-[11px] font-bold text-red-500 mb-4">
            এই alert Principal ও Accounts দুই dashboard-এই দেখাচ্ছে। Stock কিনে Restock দিলে alert সরে যাবে।
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((alert) => (
              <div key={alert.item.id} className="p-4 bg-white rounded-2xl border border-red-100">
                <p className="text-xs font-black text-school-blue uppercase">{alert.item.name}</p>
                <p className="text-[10px] font-bold text-school-muted mt-0.5">
                  {purposeLabel(itemPurpose(alert.item))} • {alert.item.className}
                </p>
                <p className="text-[11px] font-black text-red-600 mt-2">
                  Remaining {alert.remaining} / Reorder at {alert.item.lowStockThreshold} {alert.item.unit}
                </p>
                <button
                  type="button"
                  onClick={() => setRestockItem(alert.item)}
                  className="mt-3 w-full py-2 bg-school-blue text-white rounded-xl text-[9px] font-black uppercase tracking-widest"
                >
                  Restock Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-school-blue uppercase tracking-tight flex items-center gap-2">
              <Boxes size={18} className="text-school-gold" /> Inventory / Store
            </h3>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
              দুই store: For Student (বিক্রি) ও For School (স্কুল ব্যবহার) — হিসাব ও শেলফ আলাদা
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowArchived((prev) => !prev)}
              className={cn(
                'px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border',
                showArchived
                  ? 'bg-school-blue text-white border-school-blue'
                  : 'bg-slate-50 text-school-blue border-slate-100',
              )}
            >
              <Archive size={14} /> Archived ({archivedItems.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setEditItem(null);
                setShowItemForm(true);
              }}
              className="px-5 py-2.5 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              <Plus size={14} /> New Item
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">{error}</div>
        )}
        {message && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-bold text-emerald-700">
            {message}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {([{ id: 'all', label: 'All stores' }, ...INVENTORY_PURPOSE_OPTIONS] as const).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPurposeFilter(option.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border',
                purposeFilter === option.id
                  ? 'bg-school-blue text-white border-school-blue'
                  : 'bg-slate-50 text-school-muted border-slate-100',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {classOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setClassFilter(option)}
              className={cn(
                'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest',
                classFilter === option ? 'bg-school-blue text-white' : 'bg-slate-50 text-school-muted',
              )}
            >
              {option === 'all' ? 'All Classes' : option}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 size={28} className="animate-spin mx-auto text-school-blue mb-3" />
            <p className="text-xs font-black text-school-muted uppercase tracking-widest">Loading stock...</p>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="py-16 text-center text-school-muted font-medium text-sm">
            {showArchived ? 'কোনো archived item নেই।' : 'কোনো stock item নেই। New Item চাপুন।'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                  <th className="pb-4">SL</th>
                  <th className="pb-4">Details</th>
                  <th className="pb-4">Store</th>
                  <th className="pb-4">Class</th>
                  <th className="pb-4 text-right">Quantity</th>
                  <th className="pb-4 text-right">Rate</th>
                  <th className="pb-4 text-right">Student ৳</th>
                  <th className="pb-4 text-right">Out</th>
                  <th className="pb-4 text-right">Remaining</th>
                  <th className="pb-4 text-right">Amount</th>
                  <th className="pb-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visibleItems.map((item, index) => {
                  const remaining = remainingStock(item);
                  const low = item.lowStockThreshold > 0 && remaining <= item.lowStockThreshold;
                  const itemLots = openLots(lots.filter((lot) => lot.itemId === item.id));
                  const nextLot = itemLots[0];
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-bold text-school-muted">{index + 1}</td>
                      <td className="py-4">
                        <p className="font-black text-school-blue uppercase">{item.name}</p>
                        {item.note && <p className="text-[10px] text-school-muted">{item.note}</p>}
                        {itemLots.length > 0 && (
                          <p className="text-[9px] font-bold text-school-gold uppercase mt-0.5">
                            FIFO {itemLots.length} lot • next {nextLot.receivedDate}
                          </p>
                        )}
                      </td>
                      <td className="py-4">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest',
                            itemPurpose(item) === 'school'
                              ? 'bg-amber-50 text-school-gold'
                              : 'bg-emerald-50 text-emerald-600',
                          )}
                        >
                          {purposeLabel(itemPurpose(item))}
                        </span>
                      </td>
                      <td className="py-4 font-bold text-slate-500">{item.className}</td>
                      <td className="py-4 text-right font-bold text-school-blue">{item.purchasedQty}</td>
                      <td className="py-4 text-right font-bold text-slate-500">
                        {nextLot ? nextLot.unitCost : item.costRate}
                        <span className="block text-[9px] font-bold text-school-muted uppercase">FIFO out</span>
                      </td>
                      <td className="py-4 text-right font-bold text-school-gold">
                        {itemPurpose(item) === 'school' ? '—' : item.studentPrice}
                      </td>
                      <td className="py-4 text-right font-bold text-slate-500">{item.soldQty}</td>
                      <td className={cn('py-4 text-right font-black', low ? 'text-red-500' : 'text-emerald-600')}>
                        {remaining}
                        {low && <span className="block text-[9px] uppercase">Reorder</span>}
                      </td>
                      <td className="py-4 text-right font-black text-school-blue">
                        {Math.round(stockValue(item, lots)).toLocaleString('en-BD')}
                      </td>
                      <td className="py-4">
                        <div className="flex justify-end gap-1.5">
                          {!item.archived && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  itemPurpose(item) === 'school' ? setIssueItem(item) : setSaleItem(item)
                                }
                                disabled={remaining <= 0}
                                className="p-2 rounded-lg bg-emerald-50 text-emerald-600 disabled:opacity-40"
                                title={itemPurpose(item) === 'school' ? 'Issue to school' : 'Sell'}
                              >
                                {itemPurpose(item) === 'school' ? <PackageMinus size={14} /> : <ShoppingCart size={14} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRestockItem(item)}
                                className="p-2 rounded-lg bg-blue-50 text-school-blue"
                                title="Restock"
                              >
                                <PackagePlus size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditItem(item);
                                  setShowItemForm(true);
                                }}
                                className="p-2 rounded-lg bg-slate-50 text-school-blue"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleArchiveToggle(item)}
                            disabled={busyId === item.id}
                            className="p-2 rounded-lg bg-red-50 text-red-500 disabled:opacity-40"
                            title={item.archived ? 'Restore' : 'Archive'}
                          >
                            {busyId === item.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : item.archived ? (
                              <RotateCcw size={14} />
                            ) : (
                              <Archive size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-school-border font-black text-school-blue">
                  <td className="pt-4" colSpan={4}>
                    Total
                  </td>
                  <td className="pt-4 text-right">{sheetTotals.quantity.toLocaleString('en-BD')}</td>
                  <td className="pt-4" />
                  <td className="pt-4" />
                  <td className="pt-4 text-right">{sheetTotals.sold.toLocaleString('en-BD')}</td>
                  <td className="pt-4 text-right">{sheetTotals.remaining.toLocaleString('en-BD')}</td>
                  <td className="pt-4 text-right">{Math.round(sheetTotals.value).toLocaleString('en-BD')}</td>
                  <td className="pt-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h3 className="text-xs font-black text-school-blue uppercase tracking-widest">Stock Movement Log</h3>
          <p className="text-[10px] font-bold text-school-muted uppercase tracking-widest">
            This month sale: ৳ {Math.round(stats.monthSaleAmount).toLocaleString('en-BD')} • {stats.monthSaleQty} units
          </p>
        </div>

        {movements.length === 0 ? (
          <p className="py-10 text-center text-sm text-school-muted font-medium">এখনো কোনো stock movement নেই।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Item</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Buyer / Note</th>
                  <th className="pb-3 text-right">Qty</th>
                  <th className="pb-3 text-right">Unit ৳</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {movements.slice(0, 40).map((movement) => (
                  <tr key={movement.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 font-bold text-school-blue">{movement.date}</td>
                    <td className="py-3.5 font-black text-school-blue uppercase">{movement.itemName}</td>
                    <td className="py-3.5">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-lg text-[9px] font-black uppercase',
                          movement.type === 'sale'
                            ? 'bg-emerald-50 text-emerald-600'
                            : movement.type === 'issue'
                              ? 'bg-amber-50 text-school-gold'
                            : movement.type === 'purchase'
                              ? 'bg-blue-50 text-school-blue'
                              : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {movement.type}
                        {movement.buyerType ? ` • ${movement.buyerType}` : ''}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500 font-medium">
                      {movement.buyerName ?? movement.note ?? '—'}
                      {movement.studentId && <span className="block text-[10px]">{movement.studentId}</span>}
                    </td>
                    <td className="py-3.5 text-right font-bold text-school-blue">{movement.quantity}</td>
                    <td className="py-3.5 text-right font-bold text-slate-500">{movement.unitPrice}</td>
                    <td className="py-3.5 text-right font-black text-school-blue">
                      ৳ {movement.totalAmount.toLocaleString('en-BD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm"
      >
        <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-2">FIFO Lots — Oldest First</h3>
        <p className="text-[10px] font-bold text-school-muted uppercase tracking-widest mb-6">
          প্রতিটি purchase আলাদা lot • বিক্রি সবচেয়ে পুরনো lot থেকে কাটা হয়
        </p>
        {openLots(lots).length === 0 ? (
          <p className="py-8 text-center text-sm text-school-muted font-medium">কোনো open FIFO lot নেই। Restock দিয়ে নতুন lot ঢোকান।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                  <th className="pb-3">Received</th>
                  <th className="pb-3">Item</th>
                  <th className="pb-3 text-right">Lot Qty</th>
                  <th className="pb-3 text-right">Remaining</th>
                  <th className="pb-3 text-right">Cost ৳</th>
                  <th className="pb-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {openLots(lots).map((lot, index) => (
                  <tr key={lot.id} className="hover:bg-slate-50">
                    <td className="py-3.5 font-bold text-school-blue">
                      {lot.receivedDate}
                      {index === 0 && (
                        <span className="ml-2 text-[9px] font-black uppercase text-school-gold">Next out</span>
                      )}
                    </td>
                    <td className="py-3.5 font-black text-school-blue uppercase">{lot.itemName}</td>
                    <td className="py-3.5 text-right font-bold">{lot.quantity}</td>
                    <td className="py-3.5 text-right font-black text-emerald-600">{lot.remainingQty}</td>
                    <td className="py-3.5 text-right font-bold">{lot.unitCost}</td>
                    <td className="py-3.5 text-slate-500">{lot.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showItemForm && (
          <ItemFormModal
            item={editItem}
            onClose={() => setShowItemForm(false)}
            onSaved={async (savedName) => {
              setShowItemForm(false);
              setMessage(`"${savedName}" save হয়েছে।`);
              await load();
            }}
          />
        )}

        {saleItem && (
          <SaleModal
            item={saleItem}
            lots={lots.filter((lot) => lot.itemId === saleItem.id)}
            accounts={collectionAccounts}
            students={students}
            onClose={() => setSaleItem(null)}
            onSold={async (text) => {
              setSaleItem(null);
              setMessage(text);
              await load();
            }}
          />
        )}

        {issueItem && (
          <IssueModal
            item={issueItem}
            lots={lots.filter((lot) => lot.itemId === issueItem.id)}
            onClose={() => setIssueItem(null)}
            onIssued={async (text) => {
              setIssueItem(null);
              setMessage(text);
              await load();
            }}
          />
        )}

        {restockItem && (
          <RestockModal
            item={restockItem}
            lots={lots.filter((lot) => lot.itemId === restockItem.id)}
            accounts={collectionAccounts}
            onClose={() => setRestockItem(null)}
            onDone={async (text) => {
              setRestockItem(null);
              setMessage(text);
              await load();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ItemFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: InventoryItem | null;
  onClose: () => void;
  onSaved: (name: string) => void | Promise<void>;
}) {
  const [form, setForm] = React.useState({
    name: item?.name ?? '',
    purpose: (item ? itemPurpose(item) : 'student') as InventoryPurpose,
    className: item?.className ?? 'All',
    unit: item?.unit ?? 'pcs',
    costRate: item ? String(item.costRate) : '',
    studentPrice: item ? String(item.studentPrice) : '',
    openingQty: '',
    lowStockThreshold: item ? String(item.lowStockThreshold) : '20',
    note: item?.note ?? '',
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await saveInventoryItem({
        id: item?.id,
        name: form.name,
        purpose: form.purpose,
        className: form.className,
        unit: form.unit,
        costRate: parseFloat(form.costRate) || 0,
        studentPrice: parseFloat(form.studentPrice) || parseFloat(form.costRate) || 0,
        openingQty: item ? undefined : parseInt(form.openingQty, 10) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 0,
        note: form.note || undefined,
      });
      await onSaved(form.name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save item.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={item ? 'Edit Stock Item' : 'New Stock Item'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Store">
          <div className="grid grid-cols-2 gap-2">
            {INVENTORY_PURPOSE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setForm({ ...form, purpose: option.id })}
                className={cn(
                  'py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border',
                  form.purpose === option.id
                    ? 'bg-school-blue text-white border-school-blue'
                    : 'bg-slate-50 text-school-muted border-slate-100',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-bold text-school-muted mt-2">
            {form.purpose === 'school'
              ? 'School office / class / cleaning stock — issue করলে টাকা আসে না'
              : 'Student shop — বিক্রি হলে ledger-এ টাকা ঢোকে'}
          </p>
        </Field>

        <Field label="Item Name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Bengali Letter Khata"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Class">
            <select
              value={form.className}
              onChange={(e) => setForm({ ...form, className: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
            >
              {INVENTORY_CLASS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Unit">
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
            >
              {INVENTORY_UNIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={form.purpose === 'school' ? 'Cost Rate ৳' : 'Cost Rate ৳ (Staff price)'}>
            <input
              type="number"
              min={0}
              value={form.costRate}
              onChange={(e) => setForm({ ...form, costRate: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
              required
            />
          </Field>
          {form.purpose === 'student' && (
            <Field label="Student Price ৳">
              <input
                type="number"
                min={0}
                value={form.studentPrice}
                onChange={(e) => setForm({ ...form, studentPrice: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                required
              />
            </Field>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {!item && (
            <Field label="Opening Quantity">
              <input
                type="number"
                min={0}
                value={form.openingQty}
                onChange={(e) => setForm({ ...form, openingQty: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
              />
            </Field>
          )}
          <Field label="Reorder Level (alert)">
            <input
              type="number"
              min={0}
              value={form.lowStockThreshold}
              onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
            />
          </Field>
        </div>

        <Field label="Note (optional)">
          <input
            type="text"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
          />
        </Field>

        <p className="text-[10px] font-bold text-school-muted">
          Remaining stock reorder level-এ নামলে Principal ও Accounts-এ purchase alert যাবে। Opening qty FIFO lot হিসেবে ঢুকবে।
        </p>

        {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">{error}</div>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-6 py-3 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-60 flex items-center gap-2"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {item ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SaleModal({
  item,
  lots,
  accounts,
  students,
  onClose,
  onSold,
}: {
  item: InventoryItem;
  lots: InventoryLot[];
  accounts: LedgerAccount[];
  students: Student[];
  onClose: () => void;
  onSold: (message: string) => void | Promise<void>;
}) {
  const [buyerType, setBuyerType] = React.useState<InventoryBuyerType>('student');
  const [studentId, setStudentId] = React.useState('');
  const [buyerName, setBuyerName] = React.useState('');
  const [quantity, setQuantity] = React.useState('1');
  const [accountId, setAccountId] = React.useState(
    accounts.find((account) => account.id === 'main-cash')?.id ?? accounts[0]?.id ?? '',
  );
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const available = remainingStock(item);
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const slices = previewFifoConsumption(lots, qty);
  const fifoCost = fifoCostTotal(slices);
  const unitPrice =
    buyerType === 'staff' ? (qty > 0 ? Math.round((fifoCost / qty) * 100) / 100 : 0) : item.studentPrice;
  const total = Math.round(qty * unitPrice * 100) / 100;
  const selectedStudent = students.find((student) => student.studentId === studentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await recordInventorySale({
        itemId: item.id,
        quantity: qty,
        buyerType,
        buyerName: buyerType === 'student' ? selectedStudent?.name ?? '' : buyerName,
        studentId: buyerType === 'student' ? studentId : undefined,
        className: buyerType === 'student' ? selectedStudent?.class : undefined,
        accountId,
        note: note || undefined,
      });
      await onSold(
        `${item.name} × ${qty} বিক্রি হয়েছে — ৳ ${total.toLocaleString('en-BD')} ledger-এ credit হয়েছে।`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sale failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Sell From Stock" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-sm font-black text-school-blue uppercase">{item.name}</p>
          <p className="text-[10px] font-bold text-school-muted mt-0.5">
            {item.className} • Available {available} {item.unit}
          </p>
          <p className="text-[10px] font-bold text-school-muted mt-1">
            Student ৳ {item.studentPrice} • Staff FIFO cost of oldest lots
          </p>
        </div>

        {openLots(lots).length > 0 && (
          <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-2">
            <p className="text-[10px] font-black text-school-muted uppercase tracking-widest">FIFO queue (oldest first)</p>
            {slices.map((slice) => (
              <p key={slice.lotId} className="text-[11px] font-bold text-school-blue">
                {slice.lotDate} — {slice.quantity} {item.unit} @ ৳ {slice.unitCost}
              </p>
            ))}
            {buyerType === 'staff' && (
              <p className="text-[10px] font-bold text-school-gold">Staff pay FIFO cost ৳ {fifoCost.toLocaleString('en-BD')}</p>
            )}
          </div>
        )}

        <Field label="Buyer Type">
          <div className="grid grid-cols-2 gap-2">
            {(['student', 'staff'] as InventoryBuyerType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBuyerType(type)}
                className={cn(
                  'py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border',
                  buyerType === type
                    ? 'bg-school-blue text-white border-school-blue'
                    : 'bg-slate-50 text-school-muted border-slate-100',
                )}
              >
                {type === 'student' ? 'Student' : 'Teacher / Staff'}
              </button>
            ))}
          </div>
        </Field>

        {buyerType === 'student' ? (
          <Field label="Student">
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
              required
            >
              <option value="">Select student...</option>
              {students.map((student) => (
                <option key={student.studentId} value={student.studentId}>
                  {student.studentId} — {student.name} ({student.class})
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Teacher / Staff Name">
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="e.g. Mr. Karim (Teacher)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
              required
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity">
            <input
              type="number"
              min={1}
              max={available}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
            />
          </Field>
          <Field label="Received In Account">
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Note (optional)">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
          />
        </Field>

        <div className="p-4 rounded-2xl border-2 border-school-gold bg-amber-50 flex items-center justify-between">
          <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">
            {qty} × ৳ {unitPrice}
          </span>
          <span className="text-lg font-black text-school-blue">৳ {total.toLocaleString('en-BD')}</span>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">{error}</div>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || available <= 0}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-60 flex items-center gap-2"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            Confirm Sale
          </button>
        </div>
      </form>
    </Modal>
  );
}

function IssueModal({
  item,
  lots,
  onClose,
  onIssued,
}: {
  item: InventoryItem;
  lots: InventoryLot[];
  onClose: () => void;
  onIssued: (message: string) => void | Promise<void>;
}) {
  const [issuedTo, setIssuedTo] = React.useState('');
  const [quantity, setQuantity] = React.useState('1');
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const available = remainingStock(item);
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const slices = previewFifoConsumption(lots, qty);
  const fifoCost = fifoCostTotal(slices);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await issueInventoryStock({
        itemId: item.id,
        quantity: qty,
        issuedTo,
        note: note || undefined,
      });
      await onIssued(`${item.name} × ${qty} school-এ issue হয়েছে — FIFO cost ৳ ${fifoCost.toLocaleString('en-BD')} (টাকা আসেনি)।`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Issue failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Issue For School" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
          <p className="text-sm font-black text-school-blue uppercase">{item.name}</p>
          <p className="text-[10px] font-bold text-school-muted mt-0.5">
            For School • Available {available} {item.unit}
          </p>
          <p className="text-[10px] font-bold text-school-gold mt-1">
            School use — ledger-এ sale credit হবে না
          </p>
        </div>

        {openLots(lots).length > 0 && (
          <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-2">
            <p className="text-[10px] font-black text-school-muted uppercase tracking-widest">FIFO queue</p>
            {slices.map((slice) => (
              <p key={slice.lotId} className="text-[11px] font-bold text-school-blue">
                {slice.lotDate} — {slice.quantity} {item.unit} @ ৳ {slice.unitCost}
              </p>
            ))}
          </div>
        )}

        <Field label="Issued to">
          <input
            type="text"
            value={issuedTo}
            onChange={(e) => setIssuedTo(e.target.value)}
            placeholder="Office / Class 3 / Cleaning / Principal room"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
            required
          />
        </Field>
        <Field label="Quantity">
          <input
            type="number"
            min={1}
            max={available}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
            required
          />
        </Field>
        <Field label="Note (optional)">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
          />
        </Field>

        {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">{error}</div>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || available <= 0}
            className="px-6 py-3 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase disabled:opacity-60 flex items-center gap-2"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            Confirm Issue
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RestockModal({
  item,
  lots,
  accounts,
  onClose,
  onDone,
}: {
  item: InventoryItem;
  lots: InventoryLot[];
  accounts: LedgerAccount[];
  onClose: () => void;
  onDone: (message: string) => void | Promise<void>;
}) {
  const [quantity, setQuantity] = React.useState('');
  const [unitCost, setUnitCost] = React.useState(String(item.costRate));
  const [receivedDate, setReceivedDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [recordAsExpense, setRecordAsExpense] = React.useState(true);
  const [accountId, setAccountId] = React.useState(
    accounts.find((account) => account.id === 'main-cash')?.id ?? accounts[0]?.id ?? '',
  );
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const qty = parseInt(quantity, 10) || 0;
  const cost = parseFloat(unitCost) || 0;
  const total = Math.round(qty * cost * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await restockInventoryItem({
        itemId: item.id,
        quantity: qty,
        unitCost: cost,
        date: receivedDate,
        recordAsExpense,
        accountId: recordAsExpense ? accountId : undefined,
        note: note || undefined,
      });
      await onDone(
        recordAsExpense
          ? `FIFO lot ${receivedDate}: ${qty} ${item.unit} যোগ। ৳ ${total.toLocaleString('en-BD')} expense Principal-এ গেছে।`
          : `FIFO lot ${receivedDate}: ${qty} ${item.unit} যোগ হয়েছে।`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restock failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Restock — New FIFO Lot" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-sm font-black text-school-blue uppercase">{item.name}</p>
          <p className="text-[10px] font-bold text-school-muted mt-0.5">
            {item.className} • Remaining {remainingStock(item)} {item.unit} • Manual lot, FIFO order by received date
          </p>
        </div>

        {openLots(lots).length > 0 && (
          <div className="p-4 rounded-2xl border border-slate-100 space-y-1">
            <p className="text-[10px] font-black text-school-muted uppercase tracking-widest">Existing lots (oldest first)</p>
            {openLots(lots).slice(0, 5).map((lot, index) => (
              <p key={lot.id} className="text-[11px] font-bold text-school-blue">
                {lot.receivedDate} — {lot.remainingQty}/{lot.quantity} @ ৳ {lot.unitCost}
                {index === 0 ? ' • next out' : ''}
              </p>
            ))}
          </div>
        )}

        <Field label="Lot Received Date *">
          <input
            type="date"
            value={receivedDate}
            onChange={(e) => setReceivedDate(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity Purchased">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
              required
            />
          </Field>
          <Field label="Purchase Rate ৳">
            <input
              type="number"
              min={0}
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
            />
          </Field>
        </div>

        <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer">
          <input
            type="checkbox"
            checked={recordAsExpense}
            onChange={(e) => setRecordAsExpense(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-[11px] font-bold text-school-blue">
            Ledger-এ expense হিসেবে record করুন
            <span className="block text-[10px] font-medium text-school-muted mt-0.5">
              Expense Principal approve করলে টাকা account থেকে debit হবে। Bill আগেই পরিশোধ হলে uncheck করুন।
            </span>
          </span>
        </label>

        {recordAsExpense && (
          <Field label="Paid From Account">
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Note (optional)">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Supplier — Boighor Press"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
          />
        </Field>

        <div className="p-4 rounded-2xl border-2 border-school-gold bg-amber-50 flex items-center justify-between">
          <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Purchase Total</span>
          <span className="text-lg font-black text-school-blue">৳ {total.toLocaleString('en-BD')}</span>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">{error}</div>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-6 py-3 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-60 flex items-center gap-2"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            Add To Stock
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[2rem] border border-school-border shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col"
      >
        <div className="p-6 border-b border-school-border flex items-center justify-between shrink-0">
          <h3 className="text-lg font-black text-school-blue uppercase">{title}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'blue' | 'emerald' | 'amber' | 'red';
}) {
  const tones = {
    blue: 'bg-blue-50 border-blue-100 text-school-blue',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-school-gold',
    red: 'bg-red-50 border-red-100 text-red-600',
  };

  return (
    <div className={cn('p-5 rounded-[1.5rem] border', tones[tone])}>
      <div className="flex justify-between items-start mb-2">
        {icon}
        <span className="text-lg font-black">{value}</span>
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{label}</p>
    </div>
  );
}
