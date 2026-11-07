import {
  BRAND,
  escapeHtml,
  formatCurrency,
  formatReceiptDate,
  getSchoolAddress,
  getSchoolLogoCircle,
  getSchoolName,
  SCHOOL_LOGO_URL,
} from './receipts';
import type { IncomeEntry, LedgerAccount } from '../types';

const PAGE_MARGIN_MM = 6;
const CUT_MM = 9;
const COPY_H_MM = (297 - PAGE_MARGIN_MM * 2 - CUT_MM) / 2;
const PAGE_W_MM = 210 - PAGE_MARGIN_MM * 2;

const COPIES = [
  { en: 'Customer Copy', bn: 'গ্রাহক কপি' },
  { en: 'Office Copy', bn: 'অফিস কপি' },
];

export interface InventorySaleReceiptData {
  receiptNumber: string;
  issuedAt: string;
  buyerName: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  accountName: string;
  paymentMethod: string;
  receivedBy: string;
}

function methodLabel(method?: string): string {
  if (method === 'bank') return 'ব্যাংক';
  if (method === 'mobile') return 'মোবাইল ব্যাংকিং';
  return 'ক্যাশ';
}

export function inventoryReceiptFromIncome(entry: IncomeEntry, account?: LedgerAccount): InventorySaleReceiptData {
  const quantity = entry.saleQuantity && entry.saleQuantity > 0 ? entry.saleQuantity : 1;
  const unitPrice = entry.saleUnitPrice ?? Math.round((entry.amount / quantity) * 100) / 100;
  return {
    receiptNumber: entry.receiptNumber,
    issuedAt: entry.createdAt || entry.reviewedAt || entry.date,
    buyerName: entry.source || 'কাউন্টার বিক্রি',
    itemName: entry.saleItemName || entry.description,
    quantity,
    unit: entry.saleUnit || 'pcs',
    unitPrice,
    total: entry.amount,
    accountName: account?.name || entry.accountId,
    paymentMethod: methodLabel(entry.paymentMethod),
    receivedBy: entry.createdBy || 'Accounts',
  };
}

function copyHtml(data: InventorySaleReceiptData, logo: string, label: { en: string; bn: string }): string {
  return `<section class="copy"><div class="card">
    <div class="hd">
      <img src="${logo}" alt="" />
      <div class="hd-t">
        <h1>${escapeHtml(getSchoolName())}</h1>
        <p class="addr">${escapeHtml(getSchoolAddress())}</p>
        <p class="dt">ইনভেন্টরি বিক্রয়</p>
      </div>
      <div class="tag">${escapeHtml(label.bn)}<small>${escapeHtml(label.en)}</small></div>
    </div>
    <div class="meta">
      <div><span>রসিদ নং</span><b>${escapeHtml(data.receiptNumber)}</b></div>
      <div class="r"><span>তারিখ ও সময়</span><b>${escapeHtml(formatReceiptDate(data.issuedAt))}</b></div>
    </div>
    <div class="bd">
      <div class="info">
        <div class="f"><span>ক্রেতা</span><b>${escapeHtml(data.buyerName)}</b></div>
        <div class="f"><span>অ্যাকাউন্ট</span><b>${escapeHtml(data.accountName)}</b></div>
        <div class="f"><span>পেমেন্ট</span><b>${escapeHtml(data.paymentMethod)}</b></div>
        <div class="f"><span>গ্রহণকারী</span><b>${escapeHtml(data.receivedBy)}</b></div>
      </div>
      <table>
        <thead><tr><th>আইটেম</th><th class="r">পরিমাণ</th><th class="r">প্রতি পিসের দাম</th><th class="r">মোট দাম</th></tr></thead>
        <tbody><tr>
          <td>${escapeHtml(data.itemName)}</td>
          <td class="r">${data.quantity} ${escapeHtml(data.unit)}</td>
          <td class="r">${formatCurrency(data.unitPrice)}</td>
          <td class="r">${formatCurrency(data.total)}</td>
        </tr></tbody>
      </table>
      <div class="tot"><p class="grand">মোট দাম: ${formatCurrency(data.total)}</p></div>
      <div class="sig"><div>গ্রাহকের স্বাক্ষর</div><div>গ্রহণকারীর স্বাক্ষর</div></div>
    </div>
  </div></section>`;
}

const css = () => `
@page { size: A4 portrait; margin: ${PAGE_MARGIN_MM}mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; padding: 0; background: #fff; }
body { font-family: 'Anek Bangla', 'Noto Sans Bengali', Inter, Arial, sans-serif; color: ${BRAND.blue}; }
.page { width: ${PAGE_W_MM}mm; height: ${297 - PAGE_MARGIN_MM * 2}mm; overflow: hidden; margin: 0 auto; page-break-inside: avoid; break-inside: avoid; page-break-after: avoid; break-after: avoid; }
.copy { height: ${COPY_H_MM}mm; overflow: hidden; font-size: 11px; page-break-inside: avoid; break-inside: avoid; }
.card { height: 100%; border: 1.5px solid ${BRAND.blue}; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; }
.hd { display: flex; align-items: center; gap: 1em; background: ${BRAND.blue}; color: #fff; padding: .55em 1em; border-bottom: 3px solid ${BRAND.gold}; }
.hd img { width: 3.6em; height: 3.6em; border-radius: 50%; background: #fff; object-fit: cover; flex-shrink: 0; }
.hd-t { flex: 1; min-width: 0; }
.hd h1 { margin: 0; font-size: 1.25em; font-weight: 900; }
.hd .addr { margin: .1em 0 0; font-size: .85em; font-weight: 700; color: ${BRAND.gold}; }
.hd .dt { margin: .15em 0 0; font-size: .8em; letter-spacing: .12em; }
.tag { background: ${BRAND.gold}; color: ${BRAND.blue}; font-weight: 900; font-size: .9em; padding: .4em .7em; border-radius: 4px; text-align: center; }
.tag small { display: block; font-weight: 700; }
.meta { display: flex; justify-content: space-between; padding: .35em 1em; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.meta span, .f span { display: block; font-size: .72em; font-weight: 700; letter-spacing: .08em; color: #64748b; }
.meta b { color: ${BRAND.gold}; }
.r { text-align: right; }
.bd { flex: 1; padding: .55em 1em; display: flex; flex-direction: column; gap: .4em; }
.info { display: grid; grid-template-columns: 1fr 1fr; gap: .25em .8em; }
.f b { font-size: .95em; }
table { width: 100%; border-collapse: collapse; }
th { background: ${BRAND.blue}; color: #fff; text-align: left; padding: .3em .5em; font-size: .85em; }
td { padding: .3em .5em; border-bottom: 1px solid #e2e8f0; font-weight: 700; }
.tot { border: 1.5px solid ${BRAND.gold}; background: #fff8eb; border-radius: 4px; padding: .35em .7em; text-align: right; }
.tot .grand { margin: 0; font-size: 1.2em; font-weight: 900; }
.sig { display: flex; justify-content: space-between; gap: 2em; margin-top: auto; padding-top: 1.4em; font-size: .85em; color: #64748b; }
.sig div { flex: 1; border-top: 1px solid #94a3b8; padding-top: .25em; text-align: center; }
.cut { height: ${CUT_MM}mm; display: flex; align-items: center; gap: 2mm; color: #64748b; font-size: 9px; font-weight: 700; page-break-before: avoid; page-break-after: avoid; break-before: avoid; break-after: avoid; }
.cut .line { flex: 1; border-top: 1.5px dashed #64748b; }
@media print { html, body, .page, .copy { page-break-inside: avoid; break-inside: avoid; } body { background: #fff; } }
`;

const SCISSORS = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>`;

export function buildInventorySaleReceiptHtml(data: InventorySaleReceiptData, logoSrc?: string | null, autoPrint = false): string {
  const logo = logoSrc ?? SCHOOL_LOGO_URL;
  const cut = `<div class="cut"><div class="line"></div>${SCISSORS}<span>এখান থেকে কাটুন</span><div class="line"></div></div>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;600;700;800&display=swap" rel="stylesheet" /><title>${escapeHtml(data.receiptNumber)}</title>
<style>${css()}</style></head><body>
<div class="page">${copyHtml(data, logo, COPIES[0])}${cut}${copyHtml(data, logo, COPIES[1])}</div>
${autoPrint ? '<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},200)});</script>' : ''}
</body></html>`;
}

export function printInventorySaleReceipt(data: InventorySaleReceiptData): void {
  const win = window.open('', '_blank', 'width=820,height=1000');
  if (!win) return;
  getSchoolLogoCircle().then((logo) => {
    win.document.write(buildInventorySaleReceiptHtml(data, logo, true));
    win.document.close();
  });
}
