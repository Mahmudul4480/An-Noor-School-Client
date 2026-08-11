import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchAdmissions } from './admissions';
import { fetchAssets } from './assets';
import { fetchExpenses } from './expenses';
import { fetchInvoices } from './invoices';
import { computeAllBalances, fetchAccounts, fetchEntries } from './ledger';
import type { Admission, Expense, FinancialOverview, FinancialSummary, StudentInvoice } from '../types';

function inRange(dateIso: string, from: string, to: string): boolean {
  const date = dateIso.slice(0, 10);
  return date >= from && date <= to;
}

function monthRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export async function getFinancialOverview(): Promise<FinancialOverview> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const { from: monthFrom, to: monthTo } = monthRange(currentYear, currentMonth);

  const [admissions, expenses, invoices, accounts, entries, assets] = await Promise.all([
    fetchAdmissions(),
    fetchExpenses(),
    fetchInvoices(),
    fetchAccounts(),
    fetchEntries(),
    fetchAssets(),
  ]);

  const accountBalances = computeAllBalances(accounts, entries);
  const netLiquidity = accountBalances.reduce((sum, { balance }) => sum + balance, 0);

  const monthlyExpense = expenses
    .filter(
      (expense) =>
        inRange(expense.date, monthFrom, monthTo) &&
        (expense.approvalStatus === 'approved' || expense.approvalStatus === undefined),
    )
    .reduce((sum, expense) => sum + expense.amount, 0);

  const uncollectedDues = invoices
    .filter((invoice) => invoice.status !== 'cancelled' && invoice.status !== 'paid')
    .reduce((sum, invoice) => sum + Math.max(0, invoice.totalAmount - invoice.paidAmount), 0);

  const assetValue = assets
    .filter((asset) => asset.condition !== 'disposed')
    .reduce((sum, asset) => sum + (asset.purchaseValue || 0), 0);

  const monthlyFlow: FinancialOverview['monthlyFlow'] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(currentYear, currentMonth - 1 - offset, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const { from, to } = monthRange(year, month);
    const name = date.toLocaleDateString('en-BD', { month: 'short' });

    const admissionRevenue = admissions
      .filter((admission) => admission.status === 'approved' && inRange(admission.updatedAt, from, to))
      .reduce((sum, admission) => sum + admission.grandTotal, 0);

    const feeRevenue = invoices
      .filter(
        (invoice) =>
          invoice.status === 'paid' &&
          invoice.paidAmount > 0 &&
          inRange(invoice.paidAt ?? invoice.generatedAt, from, to),
      )
      .reduce((sum, invoice) => sum + invoice.paidAmount, 0);

    const monthExpense = expenses
      .filter(
        (expense) =>
          inRange(expense.date, from, to) &&
          (expense.approvalStatus === 'approved' || expense.approvalStatus === undefined),
      )
      .reduce((sum, expense) => sum + expense.amount, 0);

    monthlyFlow.push({
      name,
      revenue: admissionRevenue + feeRevenue,
      expense: monthExpense,
    });
  }

  return {
    netLiquidity,
    monthlyExpense,
    uncollectedDues,
    assetValue,
    monthlyFlow,
    accountBalances,
  };
}

export function buildReportLabel(from: string, to: string, mode: 'month' | 'year' | 'custom'): string {
  if (mode === 'month') {
    const [year, month] = from.split('-').map(Number);
    const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-BD', { month: 'long', year: 'numeric' });
    return `Masik Report — ${monthName}`;
  }
  if (mode === 'year') {
    return `Batsorik Report — ${from.slice(0, 4)}`;
  }
  return `${from} to ${to}`;
}

export async function getFinancialSummary(
  from: string,
  to: string,
  mode: 'month' | 'year' | 'custom' = 'custom',
): Promise<FinancialSummary> {
  const [admissions, expenses, invoices, accounts, entries] = await Promise.all([
    fetchAdmissions(),
    fetchExpenses(),
    fetchInvoices(),
    fetchAccounts(),
    fetchEntries(),
  ]);

  const admissionsInRange = admissions.filter(
    (admission) => admission.status === 'approved' && inRange(admission.updatedAt, from, to),
  );
  const invoicesInRange = invoices.filter(
    (invoice) =>
      invoice.status === 'paid' &&
      invoice.paidAmount > 0 &&
      inRange(invoice.paidAt ?? invoice.generatedAt, from, to),
  );
  const expensesInRange = expenses.filter(
    (expense) =>
      inRange(expense.date, from, to) &&
      (expense.approvalStatus === 'approved' || expense.approvalStatus === undefined),
  );

  const admissionCollections = admissionsInRange.reduce((sum, admission) => sum + admission.grandTotal, 0);
  const feeCollections = invoicesInRange.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const totalCollections = admissionCollections + feeCollections;
  const totalDiscountsGiven = admissionsInRange.reduce((sum, admission) => sum + admission.totalDiscount, 0);
  const totalExpenses = expensesInRange.reduce((sum, expense) => sum + expense.amount, 0);
  const netCashFlow = totalCollections - totalExpenses;
  const accountBalances = computeAllBalances(accounts, entries);

  return {
    from,
    to,
    reportLabel: buildReportLabel(from, to, mode),
    totalCollections,
    admissionCollections,
    feeCollections,
    totalDiscountsGiven,
    totalExpenses,
    netCashFlow,
    accountBalances,
    admissionsInRange,
    invoicesInRange,
    expensesInRange,
  };
}

function formatCurrency(amount: number): string {
  return `Tk ${amount.toLocaleString('en-BD')}`;
}

export function exportSummaryToPdf(summary: FinancialSummary) {
  const docPdf = new jsPDF();
  const schoolName = 'An-Noor International School';

  docPdf.setFontSize(16);
  docPdf.setFont('helvetica', 'bold');
  docPdf.text(schoolName, 14, 18);

  docPdf.setFontSize(11);
  docPdf.setFont('helvetica', 'normal');
  docPdf.text(summary.reportLabel, 14, 26);
  docPdf.text(`Period: ${summary.from} to ${summary.to}`, 14, 32);
  docPdf.text(`Generated: ${new Date().toLocaleString('en-BD')}`, 14, 38);

  autoTable(docPdf, {
    startY: 46,
    head: [['Metric', 'Amount']],
    body: [
      ['Admission Collections', formatCurrency(summary.admissionCollections)],
      ['Fee / Invoice Collections', formatCurrency(summary.feeCollections)],
      ['Total Collections', formatCurrency(summary.totalCollections)],
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
    body: summary.accountBalances.map(({ account, balance }) => [
      account.name,
      account.type.toUpperCase(),
      formatCurrency(balance),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138] },
  });

  const afterAccountsY = (docPdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  autoTable(docPdf, {
    startY: afterAccountsY,
    head: [['Invoice', 'Student', 'Month', 'Paid']],
    body: summary.invoicesInRange.map((invoice: StudentInvoice) => [
      invoice.invoiceNumber,
      invoice.studentName,
      invoice.billingMonth,
      formatCurrency(invoice.paidAmount),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138] },
  });

  const afterInvoicesY = (docPdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  autoTable(docPdf, {
    startY: afterInvoicesY,
    head: [['Form Serial', 'Student', 'Class', 'Net']],
    body: summary.admissionsInRange.map((admission: Admission) => [
      admission.formSerial,
      admission.studentName,
      admission.classApplied,
      formatCurrency(admission.grandTotal),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138] },
  });

  const afterAdmissionsY = (docPdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  autoTable(docPdf, {
    startY: afterAdmissionsY,
    head: [['Date', 'Category', 'Description', 'Amount']],
    body: summary.expensesInRange.map((expense: Expense) => [
      expense.date.slice(0, 10),
      expense.category,
      expense.description,
      formatCurrency(expense.amount),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138] },
  });

  docPdf.save(`An-Noor-${summary.reportLabel.replace(/\s+/g, '-')}-${summary.from}-to-${summary.to}.pdf`);
}
