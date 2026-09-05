import React from 'react';
import { AlertTriangle, Loader2, PackageSearch } from 'lucide-react';
import { fetchLowStockAlerts, itemPurpose, purposeLabel, remainingStock } from '../lib/inventory';
import type { InventoryStockAlert } from '../types';

/**
 * Purchase alert shown to both the Principal and Accounts whenever a stock item
 * drops to its reorder level. Derived live from stock, so it clears itself on restock.
 */
export function LowStockAlertCard() {
  const [alerts, setAlerts] = React.useState<InventoryStockAlert[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    fetchLowStockAlerts()
      .then((data) => {
        if (active) setAlerts(data);
      })
      .catch(() => {
        if (active) setAlerts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] p-8 border border-school-border shadow-sm text-center">
        <Loader2 size={22} className="animate-spin mx-auto text-school-blue" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-8 border border-school-border shadow-sm">
        <h4 className="text-xs font-black text-school-blue uppercase tracking-widest mb-2 flex items-center gap-2">
          <PackageSearch size={16} className="text-emerald-500" /> Inventory Status
        </h4>
        <p className="text-sm text-school-muted font-medium">
          সব stock item reorder level-এর উপরে আছে। এখন কিছু কেনার দরকার নেই।
        </p>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-100 rounded-[2rem] p-8">
      <h4 className="text-xs font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-2">
        <AlertTriangle size={16} /> Purchase Alert — {alerts.length} item
      </h4>
      <p className="text-[11px] font-bold text-red-500 mb-5">
        নিচের item গুলো reorder level-এ নেমে গেছে। Accounts-কে purchase করতে বলুন।
      </p>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.item.id}
            className="p-4 bg-white rounded-2xl border border-red-100 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <p className="text-xs font-black text-school-blue uppercase">{alert.item.name}</p>
              <p className="text-[10px] font-bold text-school-muted mt-0.5">
                {purposeLabel(itemPurpose(alert.item))} • {alert.item.className}
              </p>
            </div>
            <p className="text-[11px] font-black text-red-600">
              Remaining {remainingStock(alert.item)} {alert.item.unit} / Reorder at {alert.item.lowStockThreshold}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
