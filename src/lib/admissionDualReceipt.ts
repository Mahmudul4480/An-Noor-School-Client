import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  BRAND,
  admissionToDocument,
  escapeHtml,
  formatCurrency,
  formatReceiptDate,
  getSchoolAddress,
  getSchoolLogoCircle,
  getSchoolName,
  SCHOOL_LOGO_URL,
  type AdmissionReceiptData,
} from './receipts';

/**
 * One A4 page, two identical copies (Guardian on top, Office below) with a
 * dashed cut line in the middle. Each copy is locked to half a page and the
 * font shrinks automatically until the content fits, so nothing ever spills
 * onto a second page.
 */
const PAGE_MARGIN_MM = 6;
const CUT_MM = 9;
const COPY_H_MM = (297 - PAGE_MARGIN_MM * 2 - CUT_MM) / 2; // ≈ 138mm
const PAGE_W_MM = 210 - PAGE_MARGIN_MM * 2;

const COPIES = [
  { en: 'GUARDIAN COPY', bn: 'অভিভাবকের কপি' },
  { en: 'OFFICE COPY', bn: 'অফিস কপি' },
];

function copyHtml(data: AdmissionReceiptData, logo: string, label: { en: string; bn: string }): string {
  const doc = admissionToDocument(data);
  const info = doc.info
    .map(
      (r) => `<div class="f${r.label === 'Received In Account' ? ' wide' : ''}"><span>${escapeHtml(r.label)}</span><b>${escapeHtml(r.value || '—')}</b></div>`,
    )
    .join('');
  const rows = doc.lineItems
    .map((i) => `<tr><td>${escapeHtml(i.label)}</td><td class="r">${formatCurrency(i.amount)}</td></tr>`)
    .join('');
  return `<section class="copy"><div class="card">
    <div class="hd">
      <img src="${logo}" alt="" />
      <div class="hd-t">
        <h1>${escapeHtml(getSchoolName())}</h1>
        <p class="addr">${escapeHtml(getSchoolAddress())}</p>
        <p class="dt">${escapeHtml(doc.docTitle)}</p>
      </div>
      <div class="tag">${label.en}<small>${label.bn}</small></div>
    </div>
    <div class="meta"><div><span>Receipt No</span><b>${escapeHtml(doc.receiptNumber)}</b></div><div class="r"><span>Date</span><b>${escapeHtml(formatReceiptDate(doc.issuedAt))}</b></div></div>
    <div class="bd">
      <div class="info">${info}</div>
      <table><thead><tr><th>Fee Item</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="tot">${doc.totalsHtml}</div>
      <div class="note">${escapeHtml(doc.statusNote)}</div>
      <div class="sig"><div>Guardian Signature</div><div>Received By / Accounts</div></div>
    </div>
    <div class="ft">Thank you — ${escapeHtml(getSchoolName())}</div>
  </div></section>`;
}

const css = () => `
@page { size: A4 portrait; margin: ${PAGE_MARGIN_MM}mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; padding: 0; background: #fff; }
body { font-family: Inter, 'Segoe UI', 'Noto Sans Bengali', 'Hind Siliguri', Arial, sans-serif; color: ${BRAND.blue}; }
.page { width: ${PAGE_W_MM}mm; height: ${297 - PAGE_MARGIN_MM * 2}mm; overflow: hidden; margin: 0 auto; }
.copy { height: ${COPY_H_MM}mm; overflow: hidden; font-size: 10px; }
.card { height: 100%; border: 1.5px solid ${BRAND.blue}; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; }
.hd { display: flex; align-items: center; gap: 1em; background: ${BRAND.blue}; color: #fff; padding: .6em 1em; border-bottom: 3px solid ${BRAND.gold}; }
.hd img { width: 4.2em; height: 4.2em; border-radius: 50%; background: #fff; object-fit: cover; flex-shrink: 0; }
.hd-t { flex: 1; min-width: 0; }
.hd h1 { margin: 0; font-size: 1.35em; font-weight: 900; letter-spacing: .03em; text-transform: uppercase; }
.hd .addr { margin: .15em 0 0; font-size: .9em; font-weight: 700; color: ${BRAND.gold}; }
.hd .dt { margin: .2em 0 0; font-size: .8em; letter-spacing: .18em; text-transform: uppercase; opacity: .9; }
.tag { background: ${BRAND.gold}; color: ${BRAND.blue}; font-weight: 900; font-size: .85em; letter-spacing: .06em; padding: .45em .8em; border-radius: 4px; text-align: center; white-space: nowrap; }
.tag small { display: block; font-size: 1em; letter-spacing: 0; margin-top: .1em; }
.meta { display: flex; justify-content: space-between; padding: .35em 1em; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.meta span, .f span { display: block; font-size: .72em; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #94a3b8; }
.meta b { color: ${BRAND.gold}; font-size: 1.05em; }
.r { text-align: right; }
.bd { flex: 1; padding: .5em 1em; display: flex; flex-direction: column; gap: .45em; min-height: 0; }
.info { display: grid; grid-template-columns: repeat(4, 1fr); gap: .3em .8em; }
.f.wide { grid-column: span 2; }
.f b { font-size: .95em; font-weight: 700; word-break: break-word; }
table { width: 100%; border-collapse: collapse; font-size: .95em; }
th { background: ${BRAND.blue}; color: #fff; font-size: .8em; text-transform: uppercase; letter-spacing: .08em; text-align: left; padding: .3em .6em; }
th.r { text-align: right; }
td { padding: .22em .6em; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
tbody tr:nth-child(even) { background: #f8fafc; }
.tot { border: 1.5px solid ${BRAND.gold}; background: #fff8eb; border-radius: 4px; padding: .3em .8em; text-align: right; }
.tot p { margin: .1em 0; font-size: .9em; }
.tot .grand { font-size: 1.25em; font-weight: 900; }
.tot .discount { color: #dc2626; font-weight: 600; }
.note { background: #fff8eb; border-left: 3px solid ${BRAND.gold}; padding: .3em .7em; font-size: .82em; color: #92400e; }
.sig { display: flex; justify-content: space-between; gap: 2em; margin-top: auto; padding-top: 1.6em; font-size: .8em; color: #64748b; }
.sig div { flex: 1; border-top: 1px solid #94a3b8; padding-top: .2em; text-align: center; }
.ft { background: ${BRAND.blue}; color: #fff; text-align: center; font-size: .75em; letter-spacing: .1em; text-transform: uppercase; padding: .35em; }
.cut { height: ${CUT_MM}mm; display: flex; align-items: center; gap: 2mm; color: #64748b; font-size: 9px; font-weight: 700; }
.cut .line { flex: 1; border-top: 1.5px dashed #64748b; }
.cut svg { width: 4.5mm; height: 4.5mm; }
@media screen { body { background: #e2e8f0; padding: 12px 0; } .page { background: #fff; box-shadow: 0 6px 18px rgba(15,23,42,.15); padding: 0; } }
@media print { body { background: #fff; padding: 0; } .page { box-shadow: none; } }
`;

const SCISSORS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>`;

/** Shrinks each copy's font until its content fits inside the half-page box. */
const FIT_SCRIPT = `function __fit(){document.querySelectorAll('.copy').forEach(function(c){var fs=10;c.style.fontSize=fs+'px';var card=c.querySelector('.card');while((card.scrollHeight>c.clientHeight+1||c.querySelector('.bd').scrollHeight>c.querySelector('.bd').clientHeight+1)&&fs>5){fs-=0.25;c.style.fontSize=fs+'px';}});}`;

export function buildAdmissionDualReceiptHtml(data: AdmissionReceiptData, logoSrc?: string | null, autoPrint = false): string {
  const logo = logoSrc ?? SCHOOL_LOGO_URL;
  const cut = `<div class="cut"><div class="line"></div>${SCISSORS}<span>এখান থেকে কাটুন</span><div class="line"></div></div>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${escapeHtml(data.receiptNumber)}</title>
<style>${css()}</style></head><body>
<div class="page">${copyHtml(data, logo, COPIES[0])}${cut}${copyHtml(data, logo, COPIES[1])}</div>
<script>${FIT_SCRIPT}
function __ready(){__fit();window.__fitDone=true;${autoPrint ? 'setTimeout(function(){window.print()},150);' : ''}}
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){window.addEventListener('load',__ready);if(document.readyState==='complete')__ready();});}else{window.addEventListener('load',__ready);}
</script></body></html>`;
}

export function printAdmissionReceipt(data: AdmissionReceiptData): void {
  const win = window.open('', '_blank', 'width=820,height=1000');
  if (!win) return;
  getSchoolLogoCircle().then((logo) => {
    win.document.write(buildAdmissionDualReceiptHtml(data, logo, true));
    win.document.close();
  });
}

export async function downloadAdmissionReceiptPdf(data: AdmissionReceiptData): Promise<void> {
  const logo = await getSchoolLogoCircle();
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:820px;height:1200px;border:0;';
  document.body.appendChild(iframe);
  try {
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = buildAdmissionDualReceiptHtml(data, logo);
    });
    const win = iframe.contentWindow as (Window & { __fitDone?: boolean; __fit?: () => void }) | null;
    const idoc = iframe.contentDocument;
    if (!win || !idoc) throw new Error('Receipt render failed');
    for (let i = 0; i < 40 && !win.__fitDone; i += 1) await new Promise((r) => setTimeout(r, 50));
    win.__fit?.();
    idoc.body.style.background = '#fff';
    idoc.body.style.padding = '0';
    const page = idoc.querySelector('.page') as HTMLElement;
    page.style.boxShadow = 'none';
    const canvas = await html2canvas(page, { scale: 2.5, backgroundColor: '#ffffff', useCORS: true });
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', PAGE_MARGIN_MM, PAGE_MARGIN_MM, PAGE_W_MM, 297 - PAGE_MARGIN_MM * 2);
    pdf.save(`${data.receiptNumber}.pdf`);
  } finally {
    iframe.remove();
  }
}
