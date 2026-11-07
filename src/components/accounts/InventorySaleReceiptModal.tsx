import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { buildInventorySaleReceiptHtml, inventoryReceiptFromIncome, printInventorySaleReceipt } from '../../lib/inventorySaleReceipt';
import { getSchoolLogoCircle } from '../../lib/receipts';
import type { IncomeEntry, LedgerAccount } from '../../types';

export function InventorySaleReceiptModal({
  entry,
  account,
  autoPrint = false,
  onClose,
}: {
  entry: IncomeEntry;
  account?: LedgerAccount;
  autoPrint?: boolean;
  onClose: () => void;
}) {
  const data = React.useMemo(() => inventoryReceiptFromIncome(entry, account), [entry, account]);
  const [html, setHtml] = React.useState('');
  const printed = React.useRef(false);

  React.useEffect(() => {
    let stop = false;
    getSchoolLogoCircle().then((logo) => {
      if (!stop) setHtml(buildInventorySaleReceiptHtml(data, logo));
    });
    if (autoPrint && !printed.current) {
      printed.current = true;
      printInventorySaleReceipt(data);
    }
    return () => { stop = true; };
  }, [autoPrint, data]);

  return createPortal(
    <div className="fixed inset-0 z-[80] bg-slate-900/50 flex items-center justify-center p-4" style={{ fontFamily: "'Anek Bangla', sans-serif" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-school-blue">বিক্রির রসিদ</h3>
            <p className="text-[11px] font-bold text-school-muted">এক পাতায় গ্রাহক কপি ও অফিস কপি</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100 p-3">
          {html ? <iframe title="বিক্রির রসিদ" className="w-full h-[70vh] bg-white border-0" srcDoc={html} /> : <p className="p-6 text-sm font-bold">রসিদ তৈরি হচ্ছে...</p>}
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-black">বন্ধ</button>
          <button type="button" onClick={() => printInventorySaleReceipt(data)} className="px-4 py-2 rounded-xl bg-school-blue text-white text-sm font-black">প্রিন্ট</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
