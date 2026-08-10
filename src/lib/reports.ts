import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchAdmissions } from './admissions';
import { fetchExpenses } from './expenses';
import { computeAllBalances, fetchAccounts, fetchEntries } from './ledger';
import type { Admission, Expense, FinancialSummary } from '../types';

function inRange(dateIso: string, from: string, to: string): boolean {
  const date = dateIso.slice(0, 10);
  return date >= from && date <= to;
}

export async function getFinancialSummary(from: string, to: string): Promise<FinancialSummary> {
  const [admissions, expenses, accounts, entries] = await Promise.all([
    fetchAdmissions(),
    fetchExpenses(),
    fetchAccounts(),
    fetchEntries(),
  ]);

  const admissionsInRange = admissions.filter(
    (admission) => admission.status === 'approved' && inRange(admission.updatedAt, from, to),
  );
  const expensesInRange = expenses.filter((expense) => inRange(expense.date, from, to));

  const totalCollections = admissionsInRange.reduce((sum, a) => sum + a.grandTotal, 0);
  const totalDiscountsGiven = admissionsInRange.reduce((sum, a) => sum + a.totalDiscount, 0);
  const totalExpenses = expensesInRange.reduce((sum, e) => sum + e.amount, 0);
  const netCashFlow = totalCollections - totalExpenses;

  const accountBalances = computeAllBalances(accounts, entries);

  return {
    from,
    to,
    totalCollections,
    totalDiscountsGiven,
    totalExpenses,
    netCashFlow,
    accountBalances,
    admissionsInRange,
    expensesInRange,
  };
}

function formatCurrency(amount: number): string {
  return `Tk ${amount.toLocaleString('en-BD')}`;
}

export function exportSummaryToPdf(summary: FinancialSummary, options: { schoolName?: string; label?: string } = {}) {
  const docPdf = new jsPDF();
  const schoolName = options.schoolName ?? 'An-Noor International School';
  const label = options.label ?? `${summary.from} to ${summary.to}`;

  docPdf.setFontSize(16);
  docPdf.setFont('helvetica', 'bold');
  docPdf.text(schoolName, 14, 18);

  docPdf.setFontSize(11);
  docPdf.setFont('helvetica', 'normal');
  docPdf.text('Financial Report for Director Review', 14, 26);
  docPdf.text(`Period: ${label}`, 14, 32);
  docPdf.text(`Generated: ${new Date().toLocaleString('en-BD')}`, 14, 38);

  autoTable(docPdf, {
    startY: 46,
    head: [['Metric', 'Amount']],
    body: [
      ['Total Collections (Admissions)', formatCurrency(summary.totalCollections)],
      ['Total Discounts Given', formatCurrency(summary.totalDiscountsGiven)],
      ['Total Expenses', formatCurrency(summary.totalExpenses)],
      ['Net Cash Flow', formatCurrency(summary.netCashFlow)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138] },
  });

  const afterSummaryY = (docPdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  autoTable(docPdf, {
    startY: afterSummaryY,
    head: [['Account', 'Type', 'Balance']],
    body: summary.accountBalances.map(({ account, balance }) => [account.name, account.type.toUpperCase(), formatCurrency(balance)]),
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138] },
  });

  const afterAccountsY = (docPdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  autoTable(docPdf, {
    startY: afterAccountsY,
    head: [['Form Serial', 'Student', 'Class', 'Gross', 'Discount', 'Net']],
    body: summary.admissionsInRange.map((a: Admission) => [
      a.formSerial,
      a.studentName,
      a.classApplied,
      formatCurrency(a.grossTotal),
      formatCurrency(a.totalDiscount),
      formatCurrency(a.grandTotal),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138] },
    didDrawPage: (data) => {
      if (data.pageNumber === 1) {
        docPdf.setFontSize(11);
        docPdf.setFont('helvetica', 'bold');
      }
    },
  });

  const afterAdmissionsY = (docPdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  autoTable(docPdf, {
    startY: afterAdmissionsY,
    head: [['Date', 'Category', 'Description', 'Amount']],
    body: summary.expensesInRange.map((e: Expense) => [
      e.date.slice(0, 10),
      e.category,
      e.description,
      formatCurrency(e.amount),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138] },
  });

  docPdf.save(`An-Noor-Financial-Report-${summary.from}-to-${summary.to}.pdf`);
}
