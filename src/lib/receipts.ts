import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Admission, Expense, IncomeEntry, LedgerAccount, StudentInvoice } from '../types';

export const SCHOOL_LOGO_URL =
  'https://i.postimg.cc/pLTT4Msw/An-Noor-Logo-png-202608110031.jpg';

export const SCHOOL_NAME = 'An-Noor International School';
export const SCHOOL_ADDRESS = 'Rahamatgong, Chattogram';

export function getSchoolName(): string {
  try {
    const cached = JSON.parse(localStorage.getItem('an-noor-school-settings-cache') || 'null') as { schoolName?: string } | null;
    return cached?.schoolName?.trim() || SCHOOL_NAME;
  } catch {
    return SCHOOL_NAME;
  }
}

export function getSchoolAddress(): string {
  try {
    const cached = JSON.parse(localStorage.getItem('an-noor-school-settings-cache') || 'null') as { address?: string } | null;
    return cached?.address?.trim() || SCHOOL_ADDRESS;
  } catch {
    return SCHOOL_ADDRESS;
  }
}

export const BRAND = {
  blue: '#26338B',
  blueRgb: [38, 51, 139] as [number, number, number],
  gold: '#F8A41C',
  goldRgb: [248, 164, 28] as [number, number, number],
};

export function generateReceiptNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(now.getTime()).slice(-4);
  return `RCP-${datePart}-${seq}`;
}

export function formatCurrency(amount: number): string {
  return `৳ ${amount.toLocaleString('en-BD')}`;
}

export function formatReceiptDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export interface AdmissionReceiptData {
  receiptNumber: string;
  formSerial: string;
  studentName: string;
  classApplied: string;
  section?: string;
  guardianName: string;
  guardianContact: string;
  academicYear: string;
  accountName: string;
  grossTotal: number;
  totalDiscount: number;
  grandTotal: number;
  feeItems: Admission['feeItems'];
  discounts: Admission['discounts'];
  issuedAt: string;
  statusNote: string;
}

export function buildAdmissionReceipt(
  admission: Admission,
  account?: LedgerAccount,
): AdmissionReceiptData {
  return {
    receiptNumber: admission.receiptNumber ?? generateReceiptNumber(),
    formSerial: admission.formSerial,
    studentName: admission.studentName,
    classApplied: admission.classApplied,
    section: admission.section,
    guardianName: admission.guardianName,
    guardianContact: admission.guardianContact,
    academicYear: admission.academicYear,
    accountName: account?.name ?? '—',
    grossTotal: admission.grossTotal,
    totalDiscount: admission.totalDiscount,
    grandTotal: admission.grandTotal,
    feeItems: admission.feeItems,
    discounts: admission.discounts,
    issuedAt: admission.createdAt ?? new Date().toISOString(),
    statusNote:
      admission.status === 'approved'
        ? `Student ID issued: ${admission.studentId ?? '—'}`
        : 'Pending department approval. Student ID will be issued after final approval.',
  };
}

export interface InvoiceReceiptData {
  docTitle: string;
  receiptNumber: string;
  invoiceNumber: string;
  issuedAt: string;
  studentName: string;
  studentId: string;
  className: string;
  section?: string;
  guardianName?: string;
  guardianContact: string;
  academicYear: string;
  billingMonthLabel: string;
  accountName: string;
  paymentMethod: string;
  paymentReference?: string;
  note?: string;
  lineItems: { label: string; amount: number }[];
  totalAmount: number;
  paidAmount: number;
  statusNote: string;
}

function billingMonthLabel(billingMonth: string): string {
  const [year, month] = billingMonth.split('-').map(Number);
  if (!year || !month) return billingMonth;
  return new Date(year, month - 1, 1).toLocaleDateString('en-BD', { month: 'long', year: 'numeric' });
}

function paymentMethodLabel(method?: string): string {
  const labels: Record<string, string> = {
    cash: 'Cash',
    bank: 'Bank Transfer',
    mobile: 'Mobile Banking',
    online: 'Online',
    gateway: 'Payment Gateway',
  };
  return method ? labels[method] ?? method : '—';
}

export function buildInvoiceReceipt(
  invoice: StudentInvoice,
  account?: LedgerAccount,
  guardianName?: string,
): InvoiceReceiptData {
  return {
    docTitle: 'Fee Payment Receipt',
    receiptNumber: invoice.receiptNumber ?? generateReceiptNumber(),
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.paidAt ?? invoice.generatedAt ?? new Date().toISOString(),
    studentName: invoice.studentName,
    studentId: invoice.studentId,
    className: invoice.className,
    section: invoice.section,
    guardianName,
    guardianContact: invoice.guardianContact,
    academicYear: invoice.academicYear,
    billingMonthLabel: billingMonthLabel(invoice.billingMonth),
    accountName: account?.name ?? '—',
    paymentMethod: paymentMethodLabel(invoice.paymentMethod),
    paymentReference: invoice.paymentReference || invoice.gatewayRef,
    note: invoice.note,
    lineItems: invoice.lineItems,
    totalAmount: invoice.totalAmount,
    paidAmount: invoice.paidAmount,
    statusNote:
      invoice.status === 'paid'
        ? 'Payment received in full. This receipt is valid for school records.'
        : `Partial payment recorded. Remaining due: ${formatCurrency(Math.max(0, invoice.totalAmount - invoice.paidAmount))}.`,
  };
}

interface SchoolReceiptDocument {
  docTitle: string;
  receiptNumber: string;
  /** Caption above the receipt number, e.g. "Receipt No" or "Voucher No" */
  numberLabel?: string;
  issuedAt: string;
  info: { label: string; value: string }[];
  lineItems: { label: string; amount: number }[];
  /** Header of the first table column, e.g. "Fee Item" or "Particulars" */
  itemColumnLabel?: string;
  totalsHtml: string;
  totalsPdf: { label: string; value: string; tone?: 'muted' | 'discount' | 'grand' }[];
  statusNote: string;
}

function admissionToDocument(data: AdmissionReceiptData): SchoolReceiptDocument {
  const classLabel = `${data.classApplied}${data.section ? ` (${data.section})` : ''}`;
  const overall = data.discounts.find((d) => d.itemKey === 'overall');
  const concession =
    data.totalDiscount > 0
      ? `Concession: − ${formatCurrency(data.totalDiscount)}${overall?.reason ? ` (${overall.reason})` : ''}`
      : null;

  return {
    docTitle: 'Admission Fee Receipt',
    receiptNumber: data.receiptNumber,
    issuedAt: data.issuedAt,
    info: [
      { label: 'Form Serial', value: data.formSerial },
      { label: 'Academic Year', value: data.academicYear },
      { label: 'Student Name', value: data.studentName },
      { label: 'Class', value: classLabel },
      { label: 'Guardian', value: data.guardianName },
      { label: 'Contact', value: data.guardianContact },
      { label: 'Received In Account', value: data.accountName },
    ],
    lineItems: data.feeItems.map((item) => ({ label: item.label, amount: item.amount })),
    totalsHtml: `
        <p>Gross Total: ${formatCurrency(data.grossTotal)}</p>
        ${concession ? `<p class="discount">${escapeHtml(concession)}</p>` : ''}
        <p class="grand">Grand Total: ${formatCurrency(data.grandTotal)}</p>`,
    totalsPdf: [
      { label: 'Gross Total', value: formatCurrency(data.grossTotal), tone: 'muted' },
      ...(concession ? [{ label: 'Concession', value: concession, tone: 'discount' as const }] : []),
      { label: 'Grand Total', value: formatCurrency(data.grandTotal), tone: 'grand' },
    ],
    statusNote: data.statusNote,
  };
}

function invoiceToDocument(data: InvoiceReceiptData): SchoolReceiptDocument {
  const classLabel = `${data.className}${data.section ? ` (${data.section})` : ''}`;
  return {
    docTitle: data.docTitle,
    receiptNumber: data.receiptNumber,
    issuedAt: data.issuedAt,
    info: [
      { label: 'Invoice No', value: data.invoiceNumber },
      { label: 'Student ID', value: data.studentId },
      { label: 'Student Name', value: data.studentName },
      { label: 'Class', value: classLabel },
      { label: 'Guardian', value: data.guardianName || '—' },
      { label: 'Contact', value: data.guardianContact },
      { label: 'Billing Month', value: data.billingMonthLabel },
      { label: 'Academic Year', value: data.academicYear },
      { label: 'Payment Method', value: data.paymentMethod },
      ...(data.paymentReference ? [{ label: 'Deposit Slip / Txn No', value: data.paymentReference }] : []),
      { label: 'Received In Account', value: data.accountName },
      ...(data.note ? [{ label: 'Note', value: data.note }] : []),
    ],
    lineItems: data.lineItems,
    totalsHtml: `
        <p>Invoice Total: ${formatCurrency(data.totalAmount)}</p>
        <p class="grand">Amount Paid: ${formatCurrency(data.paidAmount)}</p>`,
    totalsPdf: [
      { label: 'Invoice Total', value: formatCurrency(data.totalAmount), tone: 'muted' },
      { label: 'Amount Paid', value: formatCurrency(data.paidAmount), tone: 'grand' },
    ],
    statusNote: data.statusNote,
  };
}

export interface ExpenseVoucherData {
  voucherNumber: string;
  issuedAt: string;
  expenseDate: string;
  category: string;
  description: string;
  amount: number;
  accountName: string;
  note?: string;
  requestedBy: string;
  approvedBy: string;
  approvedAt?: string;
}

export function buildExpenseVoucher(expense: Expense, account?: LedgerAccount): ExpenseVoucherData {
  return {
    voucherNumber: expense.voucherNumber ?? generateReceiptNumber().replace('RCP', 'EXV'),
    issuedAt: expense.reviewedAt ?? expense.createdAt ?? new Date().toISOString(),
    expenseDate: expense.date,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    accountName: account?.name ?? expense.accountId,
    note: expense.note,
    requestedBy: expense.createdBy ?? 'Accounts Department',
    approvedBy: expense.reviewedBy ?? 'Principal Office',
    approvedAt: expense.reviewedAt,
  };
}

function expenseToDocument(data: ExpenseVoucherData): SchoolReceiptDocument {
  return {
    docTitle: 'Expense Payment Voucher',
    receiptNumber: data.voucherNumber,
    numberLabel: 'Voucher No',
    issuedAt: data.issuedAt,
    info: [
      { label: 'Expense Date', value: formatReceiptDate(data.expenseDate) },
      { label: 'Category', value: data.category },
      { label: 'Requested By', value: data.requestedBy },
      { label: 'Approved By', value: data.approvedBy },
      ...(data.approvedAt ? [{ label: 'Approved On', value: formatReceiptDate(data.approvedAt) }] : []),
      { label: 'Paid From Account', value: data.accountName },
      ...(data.note ? [{ label: 'Note', value: data.note }] : []),
    ],
    lineItems: [{ label: data.description, amount: data.amount }],
    itemColumnLabel: 'Particulars',
    totalsHtml: `<p class="grand">Total Paid: ${formatCurrency(data.amount)}</p>`,
    totalsPdf: [{ label: 'Total Paid', value: formatCurrency(data.amount), tone: 'grand' }],
    statusNote:
      'Approved by the Principal and posted to the ledger. Keep this voucher with the bill or money receipt.',
  };
}

export interface IncomeReceiptData {
  receiptNumber: string;
  issuedAt: string;
  entryDate: string;
  category: string;
  source: string;
  description: string;
  amount: number;
  accountName: string;
  paymentMethod: string;
  reference?: string;
  note?: string;
  receivedBy: string;
  approvedBy: string;
  approvedAt?: string;
}

export function buildIncomeReceipt(entry: IncomeEntry, account?: LedgerAccount): IncomeReceiptData {
  return {
    receiptNumber: entry.receiptNumber,
    issuedAt: entry.reviewedAt ?? entry.createdAt ?? new Date().toISOString(),
    entryDate: entry.date,
    category: entry.category,
    source: entry.source,
    description: entry.description,
    amount: entry.amount,
    accountName: account?.name ?? entry.accountId,
    paymentMethod: paymentMethodLabel(entry.paymentMethod),
    reference: entry.reference,
    note: entry.note,
    receivedBy: entry.createdBy ?? 'Accounts Department',
    approvedBy: entry.reviewedBy ?? 'Principal Office',
    approvedAt: entry.reviewedAt,
  };
}

function incomeToDocument(data: IncomeReceiptData): SchoolReceiptDocument {
  return {
    docTitle: 'Money Receipt',
    receiptNumber: data.receiptNumber,
    issuedAt: data.issuedAt,
    info: [
      { label: 'Received Date', value: formatReceiptDate(data.entryDate) },
      { label: 'Income Category', value: data.category },
      { label: 'Received From', value: data.source },
      { label: 'Payment Method', value: data.paymentMethod },
      ...(data.reference ? [{ label: 'Deposit Slip / Txn No', value: data.reference }] : []),
      { label: 'Received By', value: data.receivedBy },
      { label: 'Approved By', value: data.approvedBy },
      { label: 'Deposited In Account', value: data.accountName },
      ...(data.note ? [{ label: 'Note', value: data.note }] : []),
    ],
    lineItems: [{ label: data.description, amount: data.amount }],
    itemColumnLabel: 'Particulars',
    totalsHtml: `<p class="grand">Total Received: ${formatCurrency(data.amount)}</p>`,
    totalsPdf: [{ label: 'Total Received', value: formatCurrency(data.amount), tone: 'grand' }],
    statusNote:
      'Received with thanks and approved by the Principal. This money receipt is valid for school records.',
  };
}

export function printIncomeReceipt(data: IncomeReceiptData): void {
  printSchoolReceipt(incomeToDocument(data));
}

export async function downloadIncomeReceiptPdf(data: IncomeReceiptData): Promise<void> {
  await downloadSchoolReceiptPdf(incomeToDocument(data));
}

function buildExpenseVoucherViewHtml(data: ExpenseVoucherData, logoSrc?: string | null): string {
  const logo = logoSrc ?? SCHOOL_LOGO_URL;
  const approvedOn = data.approvedAt
    ? `<div>
        <span style="display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;font-weight:700">Approved On</span>
        ${escapeHtml(formatReceiptDate(data.approvedAt))}
      </div>`
    : '';
  const note = data.note
    ? `<div style="grid-column:1 / -1">
        <span style="display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;font-weight:700">Note</span>
        ${escapeHtml(data.note)}
      </div>`
    : '';

  return `<div style="width:680px;border:3px solid #26338B;overflow:hidden;box-shadow:0 10px 24px rgba(15,23,42,.12);background:#fff;font-family:Inter,Segoe UI,Arial,sans-serif">
    <div style="background:linear-gradient(160deg,#26338B 0%,#1a2560 100%);color:#fff;text-align:center;padding:22px 24px;border-bottom:4px solid #F8A41C">
      <div style="width:80px;height:80px;border-radius:50%;overflow:hidden;margin:0 auto 12px;background:#fff;border:3px solid #F8A41C">
        <img src="${logo}" alt="" style="width:100%;height:100%;object-fit:cover;display:block" />
      </div>
      <div style="font-size:16px;font-weight:900;letter-spacing:.04em;text-transform:uppercase">${escapeHtml(getSchoolName())}</div>
      <div style="font-size:12px;font-weight:700;color:#F8A41C;margin-top:4px">${escapeHtml(getSchoolAddress())}</div>
      <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;opacity:.9;margin-top:12px">Expense Payment Voucher</div>
    </div>
    <div style="display:flex;justify-content:space-between;gap:16px;padding:16px 24px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:12px">
      <div>
        <span style="display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;font-weight:700">Voucher No</span>
        <strong style="color:#F8A41C;font-weight:900">${escapeHtml(data.voucherNumber)}</strong>
      </div>
      <div style="text-align:right">
        <span style="display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;font-weight:700">Date</span>
        <strong style="color:#F8A41C;font-weight:900">${escapeHtml(formatReceiptDate(data.issuedAt))}</strong>
      </div>
    </div>
    <div style="padding:24px;color:#26338B;font-size:12px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div>
          <span style="display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;font-weight:700">Expense Date</span>
          ${escapeHtml(formatReceiptDate(data.expenseDate))}
        </div>
        <div>
          <span style="display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;font-weight:700">Category</span>
          ${escapeHtml(data.category)}
        </div>
        <div>
          <span style="display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;font-weight:700">Requested By</span>
          ${escapeHtml(data.requestedBy)}
        </div>
        <div>
          <span style="display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;font-weight:700">Approved By</span>
          ${escapeHtml(data.approvedBy)}
        </div>
        ${approvedOn}
        <div>
          <span style="display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;font-weight:700">Paid From Account</span>
          ${escapeHtml(data.accountName)}
        </div>
        ${note}
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #f1f5f9;border-radius:12px;overflow:hidden;font-size:11px">
        <thead>
          <tr style="background:#26338B;color:#fff">
            <th style="padding:12px;text-align:left;font-size:10px;letter-spacing:.08em;text-transform:uppercase">Particulars</th>
            <th style="padding:12px;text-align:right;font-size:10px;letter-spacing:.08em;text-transform:uppercase">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:12px;font-weight:700">${escapeHtml(data.description)}</td>
            <td style="padding:12px;text-align:right">${formatCurrency(data.amount)}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:16px;text-align:right;padding:16px;border:2px solid #F8A41C;border-radius:12px;background:linear-gradient(90deg,#fff8eb 0%,#fff 100%)">
        <div style="font-size:18px;font-weight:900;color:#26338B">Total Paid: ${formatCurrency(data.amount)}</div>
      </div>
      <div style="margin-top:16px;padding:12px;background:#fffbeb;border-left:4px solid #F8A41C;border-radius:0 12px 12px 0;font-size:11px;font-weight:700;color:#78350f">
        Approved by the Principal and posted to the ledger. Keep this voucher with the bill or money receipt.
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;padding-top:32px">
        <div style="border-top:1px solid #cbd5e1;padding-top:8px;text-align:center;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8">Accounts Signature</div>
        <div style="border-top:1px solid #cbd5e1;padding-top:8px;text-align:center;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8">Principal Signature</div>
      </div>
    </div>
    <div style="background:#26338B;color:#fff;text-align:center;padding:12px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:700">
      Thank you — ${escapeHtml(getSchoolName())}
    </div>
  </div>`;
}

async function renderVoucherCard(data: ExpenseVoucherData): Promise<HTMLElement> {
  const logo = await getSchoolLogoCircle();
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-12000px;top:0;width:720px;padding:16px;background:#fff;z-index:-1';
  host.innerHTML = buildExpenseVoucherViewHtml(data, logo);
  document.body.appendChild(host);
  const card = host.firstElementChild as HTMLElement;
  await Promise.all(
    Array.from(card.querySelectorAll('img')).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );
  return host;
}

async function captureVoucherCanvas(data: ExpenseVoucherData): Promise<HTMLCanvasElement> {
  const host = await renderVoucherCard(data);
  try {
    const card = host.firstElementChild as HTMLElement;
    return await html2canvas(card, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
  } finally {
    host.remove();
  }
}

export function printExpenseVoucher(data: ExpenseVoucherData): void {
  const win = window.open('', '_blank', 'width=800,height=960');
  if (!win) return;
  getSchoolLogoCircle().then((logo) => {
    win.document.write(`<!doctype html><html><head><title>${escapeHtml(data.voucherNumber)}</title>
      <style>@page{margin:12mm}body{margin:0;padding:16px;background:#fff}</style></head>
      <body>${buildExpenseVoucherViewHtml(data, logo)}</body></html>`);
    win.document.close();
    win.onload = () => win.print();
  });
}

export async function downloadExpenseVoucherPdf(data: ExpenseVoucherData): Promise<void> {
  const canvas = await captureVoucherCanvas(data);
  const image = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const ratio = canvas.height / canvas.width;
  let renderW = maxW;
  let renderH = renderW * ratio;
  if (renderH > maxH) {
    renderH = maxH;
    renderW = renderH / ratio;
  }
  const x = (pageW - renderW) / 2;
  pdf.addImage(image, 'PNG', x, margin, renderW, renderH, undefined, 'FAST');
  pdf.save(`${data.voucherNumber}.pdf`);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildFeeRows(items: { label: string; amount: number }[]): string {
  return items
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.label)}</td>
        <td class="right">${formatCurrency(item.amount)}</td>
      </tr>`,
    )
    .join('');
}

function buildSchoolReceiptHtml(
  doc: SchoolReceiptDocument,
  autoPrint = false,
  logoSrc?: string | null,
): string {
  const receiptDate = formatReceiptDate(doc.issuedAt);
  const infoHtml = doc.info
    .map(
      (row) =>
        `<div${row.label === 'Received In Account' ? ' style="grid-column: span 2"' : ''}><label>${escapeHtml(row.label)}</label>${escapeHtml(row.value)}</div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt ${escapeHtml(doc.receiptNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: ${BRAND.blue};
      background: #fff;
    }
    .receipt {
      max-width: 720px;
      margin: 0 auto;
      border: 3px solid ${BRAND.blue};
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(38, 51, 139, 0.12);
    }
    .header {
      background: linear-gradient(135deg, ${BRAND.blue} 0%, #1a2560 100%);
      color: #fff;
      padding: 24px 28px;
      text-align: center;
      border-bottom: 4px solid ${BRAND.gold};
    }
    .header .logo-wrap {
      width: 92px;
      height: 92px;
      margin: 0 auto 12px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid ${BRAND.gold};
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* the pre-rendered logo already carries its own white circle and gold ring */
    .header .logo-wrap.bare {
      background: transparent;
      border: 0;
    }
    .header img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header .address {
      margin: 6px 0 0;
      font-size: 13px;
      color: ${BRAND.gold};
      font-weight: 600;
    }
    .header .doc-title {
      margin: 14px 0 0;
      font-size: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      opacity: 0.9;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 28px;
      background: #f8f9fc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    .meta strong { color: ${BRAND.gold}; }
    .meta span { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .body { padding: 24px 28px; }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
      margin-bottom: 20px;
      font-size: 13px;
    }
    .info-grid label {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    thead th {
      background: ${BRAND.blue};
      color: #fff;
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    thead th.right, td.right { text-align: right; }
    tbody td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    tbody tr:nth-child(even) { background: #f8fafc; }
    td.discount { color: #dc2626; font-weight: 600; }
    .totals {
      margin-top: 16px;
      padding: 16px;
      background: linear-gradient(90deg, #fff8eb 0%, #fff 100%);
      border: 2px solid ${BRAND.gold};
      border-radius: 12px;
      text-align: right;
    }
    .totals p { margin: 4px 0; font-size: 13px; }
    .totals .grand {
      font-size: 20px;
      font-weight: 800;
      color: ${BRAND.blue};
      margin-top: 8px;
    }
    .totals .discount { color: #dc2626; font-weight: 600; }
    .note {
      margin-top: 20px;
      padding: 12px 16px;
      background: #fff8eb;
      border-left: 4px solid ${BRAND.gold};
      font-size: 12px;
      color: #92400e;
    }
    .footer {
      padding: 14px 28px;
      background: ${BRAND.blue};
      color: #fff;
      text-align: center;
      font-size: 10px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    @media print {
      body { padding: 0; }
      .receipt { box-shadow: none; border-width: 2px; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo-wrap${logoSrc ? ' bare' : ''}">
        <img src="${logoSrc ?? SCHOOL_LOGO_URL}" alt="${getSchoolName()} Logo" />
      </div>
      <h1>${getSchoolName()}</h1>
      <p class="address">${getSchoolAddress()}</p>
      <p class="doc-title">${escapeHtml(doc.docTitle)}</p>
    </div>
    <div class="meta">
      <div><span>${escapeHtml(doc.numberLabel ?? 'Receipt No')}</span><strong>${escapeHtml(doc.receiptNumber)}</strong></div>
      <div style="text-align:right"><span>Date</span><strong>${receiptDate}</strong></div>
    </div>
    <div class="body">
      <div class="info-grid">${infoHtml}</div>
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(doc.itemColumnLabel ?? 'Fee Item')}</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>${buildFeeRows(doc.lineItems)}</tbody>
      </table>
      <div class="totals">${doc.totalsHtml}</div>
      <div class="note">${escapeHtml(doc.statusNote)}</div>
    </div>
    <div class="footer">Thank you — ${getSchoolName()}</div>
  </div>
  ${autoPrint ? '<script>window.onload=()=>window.print()</script>' : ''}
</body>
</html>`;
}

export function buildReceiptHtml(data: AdmissionReceiptData, autoPrint = false): string {
  return buildSchoolReceiptHtml(admissionToDocument(data), autoPrint);
}

export function buildInvoiceReceiptHtml(data: InvoiceReceiptData, autoPrint = false): string {
  return buildSchoolReceiptHtml(invoiceToDocument(data), autoPrint);
}

export function printAdmissionReceipt(data: AdmissionReceiptData): void {
  printSchoolReceipt(admissionToDocument(data));
}

export function printInvoiceReceipt(data: InvoiceReceiptData): void {
  printSchoolReceipt(invoiceToDocument(data));
}

function printSchoolReceipt(doc: SchoolReceiptDocument): void {
  // opened before awaiting the logo so the popup stays tied to the click
  const win = window.open('', '_blank', 'width=800,height=960');
  if (!win) return;
  getSchoolLogoCircle().then((logo) => {
    win.document.write(buildSchoolReceiptHtml(doc, true, logo));
    win.document.close();
  });
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch(SCHOOL_LOGO_URL);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Fraction of the artwork height taken by the atom emblem below the crest. */
const LOGO_BOTTOM_TRIM = 0.135;

/**
 * Trims the emblem below the crest, drops the flattened dark background, then
 * scales the remaining artwork so it exactly fills a gold-ringed circle.
 */
function renderLogoCircle(img: HTMLImageElement, size: number): string | null {
  const sourceW = img.naturalWidth || img.width;
  const sourceH = img.naturalHeight || img.height;
  if (!sourceW || !sourceH) return null;

  const art = document.createElement('canvas');
  art.width = sourceW;
  art.height = Math.round(sourceH * (1 - LOGO_BOTTOM_TRIM));
  const artCtx = art.getContext('2d');
  if (!artCtx) return null;
  artCtx.drawImage(img, 0, 0);

  const image = artCtx.getImageData(0, 0, art.width, art.height);
  const px = image.data;
  for (let i = 0; i < px.length; i += 4) {
    const max = Math.max(px[i], px[i + 1], px[i + 2]);
    const min = Math.min(px[i], px[i + 1], px[i + 2]);
    if (max - min < 34 && max < 118) {
      px[i] = 255;
      px[i + 1] = 255;
      px[i + 2] = 255;
      px[i + 3] = 255;
    }
  }
  artCtx.putImageData(image, 0, 0);

  const isInk = (index: number) =>
    px[index + 3] > 12 && (px[index] < 246 || px[index + 1] < 246 || px[index + 2] < 246);

  let minX = art.width;
  let minY = art.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < art.height; y += 1) {
    for (let x = 0; x < art.width; x += 1) {
      if (!isInk((y * art.width + x) * 4)) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;

  const artCenterX = (minX + maxX + 1) / 2;
  const artCenterY = (minY + maxY + 1) / 2;
  let reach = 1;
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (!isInk((y * art.width + x) * 4)) continue;
      const distance = Math.hypot(x + 0.5 - artCenterX, y + 0.5 - artCenterY);
      if (distance > reach) reach = distance;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const ring = Math.max(2, size * 0.045);
  const radius = size / 2 - ring / 2;
  // 1.08 lets the crest hug the ring; only the laurel tips graze the edge
  const scale = ((radius - ring / 2) / reach) * 1.08;

  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(
    art,
    size / 2 - artCenterX * scale,
    size / 2 - artCenterY * scale,
    art.width * scale,
    art.height * scale,
  );
  ctx.restore();

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
  ctx.lineWidth = ring;
  ctx.strokeStyle = BRAND.gold;
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

let logoCirclePromise: Promise<string | null> | null = null;

/** Circular, gold-ringed school logo shared by the on-screen, print and PDF receipts. */
export function getSchoolLogoCircle(): Promise<string | null> {
  if (!logoCirclePromise) {
    logoCirclePromise = (async () => {
      const source = await loadLogoDataUrl();
      if (!source) return null;
      return new Promise<string | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(renderLogoCircle(img, 512));
        img.onerror = () => resolve(null);
        img.src = source;
      });
    })().catch(() => null);
  }
  return logoCirclePromise;
}

async function loadLogoCircle(): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
  const circle = await getSchoolLogoCircle();
  if (circle) return { dataUrl: circle, format: 'PNG' };
  const raw = await loadLogoDataUrl();
  return raw ? { dataUrl: raw, format: 'JPEG' } : null;
}

function formatPdfCurrency(amount: number): string {
  return `Tk ${amount.toLocaleString('en-BD')}`;
}

function pdfMoney(value: string): string {
  return value.replace(/৳/g, 'Tk');
}

export async function downloadAdmissionReceiptPdf(data: AdmissionReceiptData): Promise<void> {
  await downloadSchoolReceiptPdf(admissionToDocument(data));
}

export async function downloadInvoiceReceiptPdf(data: InvoiceReceiptData): Promise<void> {
  await downloadSchoolReceiptPdf(invoiceToDocument(data));
}

async function downloadSchoolReceiptPdf(doc: SchoolReceiptDocument): Promise<void> {
  const docPdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const logo = await loadLogoCircle();
  const receiptDate = formatReceiptDate(doc.issuedAt);
  const pageWidth = docPdf.internal.pageSize.getWidth();
  const pageHeight = docPdf.internal.pageSize.getHeight();

  const margin = 12;
  const cardX = margin;
  const cardW = pageWidth - margin * 2;
  const cardY = margin;
  const centerX = pageWidth / 2;

  docPdf.setDrawColor(...BRAND.blueRgb);
  docPdf.setLineWidth(1.1);
  docPdf.roundedRect(cardX, cardY, cardW, pageHeight - margin * 2, 3, 3, 'S');

  const headerH = 58;
  docPdf.setFillColor(...BRAND.blueRgb);
  docPdf.rect(cardX + 0.6, cardY + 0.6, cardW - 1.2, headerH, 'F');
  docPdf.setFillColor(...BRAND.goldRgb);
  docPdf.rect(cardX + 0.6, cardY + headerH, cardW - 1.2, 3.2, 'F');

  const logoSize = 22;
  const logoX = centerX - logoSize / 2;
  const logoY = cardY + 5;

  if (logo) {
    docPdf.addImage(logo.dataUrl, logo.format, logoX, logoY, logoSize, logoSize);
  } else {
    docPdf.setFillColor(255, 255, 255);
    docPdf.circle(centerX, logoY + logoSize / 2, logoSize / 2, 'F');
  }

  let textY = logoY + logoSize + 7;
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(13);
  docPdf.text(getSchoolName().toUpperCase(), centerX, textY, { align: 'center' });

  textY += 6;
  docPdf.setTextColor(...BRAND.goldRgb);
  docPdf.setFontSize(9);
  docPdf.text(getSchoolAddress(), centerX, textY, { align: 'center' });

  textY += 6;
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont('helvetica', 'normal');
  docPdf.setFontSize(8);
  docPdf.text(doc.docTitle.toUpperCase(), centerX, textY, { align: 'center' });

  const metaY = cardY + headerH + 3.2;
  const metaH = 14;
  docPdf.setFillColor(248, 249, 252);
  docPdf.rect(cardX + 0.6, metaY, cardW - 1.2, metaH, 'F');
  docPdf.setDrawColor(226, 232, 240);
  docPdf.setLineWidth(0.2);
  docPdf.line(cardX + 0.6, metaY + metaH, cardX + cardW - 0.6, metaY + metaH);

  docPdf.setFontSize(7);
  docPdf.setTextColor(100, 116, 139);
  docPdf.setFont('helvetica', 'bold');
  docPdf.text((doc.numberLabel ?? 'Receipt No').toUpperCase(), cardX + 8, metaY + 5);
  docPdf.text('DATE', cardX + cardW - 8, metaY + 5, { align: 'right' });
  docPdf.setFontSize(10);
  docPdf.setTextColor(...BRAND.goldRgb);
  docPdf.text(doc.receiptNumber, cardX + 8, metaY + 11);
  docPdf.text(receiptDate, cardX + cardW - 8, metaY + 11, { align: 'right' });

  const innerX = cardX + 8;
  const innerW = cardW - 16;
  const colGap = 8;
  const colW = (innerW - colGap) / 2;
  let infoY = metaY + metaH + 8;

  const fullWidthLabels = new Set(['Received In Account']);
  const rows = doc.info.map((row) => ({
    ...row,
    span: fullWidthLabels.has(row.label) ? 2 : 1,
  }));

  for (let i = 0; i < rows.length; ) {
    const current = rows[i];
    const next = rows[i + 1];
    const useTwo = current.span === 1 && next && next.span === 1;

    const drawField = (field: { label: string; value: string }, x: number, width: number) => {
      docPdf.setFontSize(7);
      docPdf.setTextColor(100, 116, 139);
      docPdf.setFont('helvetica', 'bold');
      docPdf.text(field.label.toUpperCase(), x, infoY);
      docPdf.setFontSize(9);
      docPdf.setTextColor(...BRAND.blueRgb);
      docPdf.setFont('helvetica', 'normal');
      const lines = docPdf.splitTextToSize(field.value || '—', width) as string[];
      docPdf.text(lines, x, infoY + 5);
      return lines.length;
    };

    if (useTwo) {
      const leftLines = drawField(current, innerX, colW);
      const rightLines = drawField(next, innerX + colW + colGap, colW);
      infoY += Math.max(leftLines, rightLines) * 4.2 + 8;
      i += 2;
    } else {
      const lineCount = drawField(current, innerX, innerW);
      infoY += lineCount * 4.2 + 8;
      i += 1;
    }
  }

  autoTable(docPdf, {
    startY: infoY,
    margin: { left: innerX, right: margin + 8 },
    tableWidth: innerW,
    head: [[doc.itemColumnLabel ?? 'Fee Item', 'Amount']],
    body: doc.lineItems.map((item) => [item.label, formatPdfCurrency(item.amount)]),
    theme: 'grid',
    headStyles: {
      fillColor: BRAND.blueRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: innerW * 0.68, fontStyle: 'bold', textColor: BRAND.blueRgb },
      1: { cellWidth: innerW * 0.32, halign: 'right', textColor: BRAND.blueRgb },
    },
    styles: { fontSize: 9, cellPadding: 2.4, overflow: 'linebreak' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const afterTableY = (docPdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  const totalsH = 16 + doc.totalsPdf.length * 6;
  docPdf.setFillColor(255, 248, 235);
  docPdf.setDrawColor(...BRAND.goldRgb);
  docPdf.setLineWidth(0.7);
  docPdf.roundedRect(innerX, afterTableY, innerW, totalsH, 2, 2, 'FD');

  let totalY = afterTableY + 7;
  for (const row of doc.totalsPdf) {
    if (row.tone === 'discount') {
      docPdf.setFontSize(9);
      docPdf.setFont('helvetica', 'bold');
      docPdf.setTextColor(220, 38, 38);
      docPdf.text(pdfMoney(row.value), innerX + innerW - 5, totalY, { align: 'right' });
    } else if (row.tone === 'grand') {
      docPdf.setFontSize(12);
      docPdf.setFont('helvetica', 'bold');
      docPdf.setTextColor(...BRAND.blueRgb);
      docPdf.text(`${row.label}: ${pdfMoney(row.value)}`, innerX + innerW - 5, totalY + 1, { align: 'right' });
      totalY += 2;
    } else {
      docPdf.setFontSize(9);
      docPdf.setFont('helvetica', 'bold');
      docPdf.setTextColor(100, 116, 139);
      docPdf.text(`${row.label}: ${pdfMoney(row.value)}`, innerX + innerW - 5, totalY, { align: 'right' });
    }
    totalY += 6;
  }

  const noteY = afterTableY + totalsH + 6;
  docPdf.setFillColor(255, 248, 235);
  docPdf.rect(innerX, noteY, innerW, 14, 'F');
  docPdf.setFillColor(...BRAND.goldRgb);
  docPdf.rect(innerX, noteY, 1.6, 14, 'F');
  docPdf.setFont('helvetica', 'normal');
  docPdf.setFontSize(8);
  docPdf.setTextColor(146, 64, 14);
  const noteLines = docPdf.splitTextToSize(doc.statusNote, innerW - 10) as string[];
  docPdf.text(noteLines, innerX + 5, noteY + 6);

  const footerH = 10;
  const footerY = pageHeight - margin - footerH;
  docPdf.setFillColor(...BRAND.blueRgb);
  docPdf.rect(cardX + 0.6, footerY, cardW - 1.2, footerH - 0.4, 'F');
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(8);
  docPdf.text(`THANK YOU — ${getSchoolName().toUpperCase()}`, centerX, footerY + 6.2, { align: 'center' });

  docPdf.save(`${doc.receiptNumber}.pdf`);
}
