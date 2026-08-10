import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Admission, LedgerAccount } from '../types';

export const SCHOOL_LOGO_URL =
  'https://i.postimg.cc/pLTT4Msw/An-Noor-Logo-png-202608110031.jpg';

export const SCHOOL_NAME = 'An-Noor International School';
export const SCHOOL_ADDRESS = 'Rahamatgong, Chattogram';

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildFeeRows(data: AdmissionReceiptData): string {
  return data.feeItems
    .map((item) => {
      const discount = data.discounts.find((d) => d.itemKey === item.key);
      return `<tr>
        <td>${escapeHtml(item.label)}</td>
        <td class="right">${formatCurrency(item.amount)}</td>
        <td class="right discount">${discount ? `− ${formatCurrency(discount.amount)}` : '—'}</td>
      </tr>`;
    })
    .join('');
}

export function buildReceiptHtml(data: AdmissionReceiptData, autoPrint = false): string {
  const receiptDate = formatReceiptDate(data.issuedAt);
  const classLabel = `${escapeHtml(data.classApplied)}${data.section ? ` (${escapeHtml(data.section)})` : ''}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt ${escapeHtml(data.receiptNumber)}</title>
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
    .header img {
      width: 88px;
      height: 88px;
      object-fit: contain;
      border-radius: 50%;
      background: #fff;
      padding: 4px;
      margin-bottom: 12px;
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
      <img src="${SCHOOL_LOGO_URL}" alt="${SCHOOL_NAME} Logo" />
      <h1>${SCHOOL_NAME}</h1>
      <p class="address">${SCHOOL_ADDRESS}</p>
      <p class="doc-title">Admission Fee Receipt</p>
    </div>
    <div class="meta">
      <div><span>Receipt No</span><strong>${escapeHtml(data.receiptNumber)}</strong></div>
      <div style="text-align:right"><span>Date</span><strong>${receiptDate}</strong></div>
    </div>
    <div class="body">
      <div class="info-grid">
        <div><label>Form Serial</label>${escapeHtml(data.formSerial)}</div>
        <div><label>Academic Year</label>${escapeHtml(data.academicYear)}</div>
        <div><label>Student Name</label>${escapeHtml(data.studentName)}</div>
        <div><label>Class</label>${classLabel}</div>
        <div><label>Guardian</label>${escapeHtml(data.guardianName)}</div>
        <div><label>Contact</label>${escapeHtml(data.guardianContact)}</div>
        <div style="grid-column: span 2"><label>Received In Account</label>${escapeHtml(data.accountName)}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Fee Item</th>
            <th class="right">Amount</th>
            <th class="right">Discount</th>
          </tr>
        </thead>
        <tbody>${buildFeeRows(data)}</tbody>
      </table>
      <div class="totals">
        <p>Gross Total: ${formatCurrency(data.grossTotal)}</p>
        <p>Total Discount: ${formatCurrency(data.totalDiscount)}</p>
        <p class="grand">Grand Total: ${formatCurrency(data.grandTotal)}</p>
      </div>
      <div class="note">${escapeHtml(data.statusNote)}</div>
    </div>
    <div class="footer">Thank you — ${SCHOOL_NAME}</div>
  </div>
  ${autoPrint ? '<script>window.onload=()=>window.print()</script>' : ''}
</body>
</html>`;
}

export function printAdmissionReceipt(data: AdmissionReceiptData): void {
  const win = window.open('', '_blank', 'width=800,height=960');
  if (!win) return;
  win.document.write(buildReceiptHtml(data, true));
  win.document.close();
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

export async function downloadAdmissionReceiptPdf(data: AdmissionReceiptData): Promise<void> {
  const docPdf = new jsPDF();
  const logo = await loadLogoDataUrl();
  const receiptDate = formatReceiptDate(data.issuedAt);
  const pageWidth = docPdf.internal.pageSize.getWidth();

  docPdf.setFillColor(...BRAND.blueRgb);
  docPdf.rect(0, 0, pageWidth, 42, 'F');
  docPdf.setFillColor(...BRAND.goldRgb);
  docPdf.rect(0, 42, pageWidth, 2, 'F');

  if (logo) {
    docPdf.addImage(logo, 'JPEG', pageWidth / 2 - 14, 6, 28, 28);
  }

  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(14);
  docPdf.text(SCHOOL_NAME, pageWidth / 2, logo ? 40 : 16, { align: 'center' });

  if (!logo) {
    docPdf.setFontSize(10);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(SCHOOL_ADDRESS, pageWidth / 2, 24, { align: 'center' });
  }

  docPdf.setTextColor(...BRAND.blueRgb);
  docPdf.setFontSize(10);
  docPdf.setFont('helvetica', 'normal');
  const startY = logo ? 52 : 36;
  docPdf.text(SCHOOL_ADDRESS, 14, startY);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(12);
  docPdf.text('Admission Fee Receipt', 14, startY + 8);

  docPdf.setFont('helvetica', 'normal');
  docPdf.setFontSize(10);
  docPdf.text(`Receipt No: ${data.receiptNumber}`, 14, startY + 16);
  docPdf.text(`Date: ${receiptDate}`, pageWidth - 14, startY + 16, { align: 'right' });

  const infoY = startY + 24;
  docPdf.setFontSize(9);
  const infoLines = [
    `Form Serial: ${data.formSerial}`,
    `Student: ${data.studentName}`,
    `Class: ${data.classApplied}${data.section ? ` (${data.section})` : ''}`,
    `Guardian: ${data.guardianName} • ${data.guardianContact}`,
    `Academic Year: ${data.academicYear}`,
    `Received In: ${data.accountName}`,
  ];
  infoLines.forEach((line, index) => {
    docPdf.text(line, 14, infoY + index * 5);
  });

  autoTable(docPdf, {
    startY: infoY + infoLines.length * 5 + 4,
    head: [['Fee Item', 'Amount', 'Discount']],
    body: data.feeItems.map((item) => {
      const discount = data.discounts.find((d) => d.itemKey === item.key);
      return [
        item.label,
        formatCurrency(item.amount),
        discount ? `− ${formatCurrency(discount.amount)}` : '—',
      ];
    }),
    theme: 'grid',
    headStyles: { fillColor: BRAND.blueRgb, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const afterTableY = (docPdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(10);
  docPdf.text(`Gross Total: ${formatCurrency(data.grossTotal)}`, pageWidth - 14, afterTableY, { align: 'right' });
  docPdf.text(`Discount: ${formatCurrency(data.totalDiscount)}`, pageWidth - 14, afterTableY + 6, { align: 'right' });
  docPdf.setFontSize(13);
  docPdf.setTextColor(...BRAND.blueRgb);
  docPdf.text(`Grand Total: ${formatCurrency(data.grandTotal)}`, pageWidth - 14, afterTableY + 14, { align: 'right' });

  docPdf.setFont('helvetica', 'normal');
  docPdf.setFontSize(8);
  docPdf.setTextColor(100, 100, 100);
  docPdf.text(data.statusNote, 14, afterTableY + 24, { maxWidth: pageWidth - 28 });

  docPdf.save(`${data.receiptNumber}.pdf`);
}
