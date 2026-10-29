// Reproduces the drill-down with real Firestore shapes (Timestamp createdAt) and renders every view.
import React from 'react';
import { renderToString } from 'react-dom/server';
import { sanitizePrincipalData, moneyRows, type PrincipalData } from '../src/lib/principalOverview';
import { PrincipalDetailModal } from '../src/components/principal/PrincipalDetailModal';

const ts = (iso: string) => ({ seconds: Date.parse(iso) / 1000, nanoseconds: 0, toDate: () => new Date(iso) });
const today = new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10);
const raw: any = {
  accounts: [{ id: 'main-cash', name: 'Main Cash', type: 'cash', openingBalance: 0 }, { id: 'petty-cash' }],
  entries: [
    { id: 'led-1', accountId: 'main-cash', type: 'credit', amount: 14800, date: today, reference: 'Admission Fee — Aariz', relatedType: 'admission', relatedId: 'adm-1', createdAt: ts(`${today}T03:32:07.604Z`) },
    { id: 'led-2', accountId: 'main-cash', type: 'debit', amount: 200, date: today, reference: 'Expense — GATE', relatedType: 'expense', relatedId: 'exp-1', createdAt: ts(`${today}T03:35:13.007Z`) },
    { accountId: 'acc-missing', type: 'credit', amount: '50', date: ts(`${today}T05:00:00Z`) },
  ],
  expenses: [{ id: 'exp-1', date: today, amount: 200, createdAt: ts(`${today}T03:35:00Z`) }, { id: 'exp-2', date: ts(`${today}T08:00:00Z`), amount: 75 }],
  incomeEntries: [], admissions: [{ id: 'adm-1', status: 'approved', studentId: 'S1', dueAmount: 500 }],
  invoices: [{ id: 'inv-1', studentId: 'S1', status: 'pending', totalAmount: 1000, paidAmount: 0, lineItems: [{ label: 'Tuition' }], generatedAt: ts(`${today}T01:00:00Z`) }, { status: 'overdue', totalAmount: 300 }],
  students: [{ status: 'Active', class: 'Play' }], assets: [{ name: 'Fan', purchaseValue: 3000, createdAt: ts(`${today}T01:00:00Z`) }, {}],
};
// old behaviour: unsanitized sort on Timestamp createdAt
try { moneyRows(raw as PrincipalData, today, today); console.log('UNSANITIZED: no crash'); } catch (e) { console.log('UNSANITIZED reproduces crash:', (e as Error).message); }
const data = sanitizePrincipalData(raw);
for (const kind of ['money', 'liquidity', 'dues', 'assets'] as const) {
  const html = renderToString(<PrincipalDetailModal kind={kind} data={data} onClose={() => {}} />);
  console.log(kind, 'OK', html.length, 'chars');
}
