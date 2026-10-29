import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore';

const GDOM = 'guardians.al-noor-int-school.local';
let env;
const ctx = {};

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-an-noor',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
after(async () => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await setDoc(doc(db, 'users/principalUid'), { role: 'principal', email: 'p@school.com' });
    await setDoc(doc(db, 'users/teacherUid'), { role: 'teacher', email: 't@school.com' });
    await setDoc(doc(db, 'staffAccess/acc@school.com'), { role: 'accounts', status: 'active', email: 'acc@school.com' });
    await setDoc(doc(db, 'staffAccess/revoked@school.com'), { role: 'accounts', status: 'revoked' });
    await setDoc(doc(db, 'guardians/grd-01711111111'), { mobile: '01711111111', authEmail: `g01711111111@${GDOM}`, studentIds: ['STU-1'] });
    await setDoc(doc(db, 'students/STU-1'), { studentId: 'STU-1', name: 'Own child' });
    await setDoc(doc(db, 'students/STU-2'), { studentId: 'STU-2', name: 'Other child' });
    await setDoc(doc(db, 'studentInvoices/inv-1'), { id: 'inv-1', studentId: 'STU-1', status: 'pending', paidAmount: 0 });
    await setDoc(doc(db, 'studentInvoices/inv-2'), { id: 'inv-2', studentId: 'STU-2', status: 'pending', paidAmount: 0 });
    await setDoc(doc(db, 'admissions/adm-1'), { status: 'pending_approval', approvals: [{ status: 'pending' }], grandTotal: 100 });
    await setDoc(doc(db, 'incomeEntries/inc-1'), { approvalStatus: 'pending', amount: 50 });
    await setDoc(doc(db, 'expenses/exp-1'), { approvalStatus: 'pending', amount: 50 });
    await setDoc(doc(db, 'ledgerEntries/le-1'), { amount: 50, type: 'credit' });
    await setDoc(doc(db, 'schoolStaff/stf-1'), { status: 'pending_approval', name: 'New Teacher' });
    await setDoc(doc(db, 'schoolSettings/main'), { name: 'An-Noor' });
  });
  ctx.admin = env.authenticatedContext('adminUid', { email: 'chotan4480+admin@gmail.com' }).firestore();
  ctx.principal = env.authenticatedContext('principalUid', { email: 'p@school.com' }).firestore();
  ctx.accounts = env.authenticatedContext('accUid', { email: 'acc@school.com' }).firestore();
  ctx.revoked = env.authenticatedContext('revUid', { email: 'revoked@school.com' }).firestore();
  ctx.teacher = env.authenticatedContext('teacherUid', { email: 't@school.com' }).firestore();
  ctx.guardian = env.authenticatedContext('gUid', { email: `g01711111111@${GDOM}` }).firestore();
  ctx.stranger = env.authenticatedContext('xUid', { email: 'random@gmail.com' }).firestore();
  ctx.anon = env.unauthenticatedContext().firestore();
});

describe('login / role resolution', () => {
  it('user reads own users doc', () => assertSucceeds(getDoc(doc(ctx.teacher, 'users/teacherUid'))));
  it('accounts reads own staffAccess grant', () => assertSucceeds(getDoc(doc(ctx.accounts, 'staffAccess/acc@school.com'))));
  it('guardian finds own guardian doc by authEmail query', () =>
    assertSucceeds(getDocs(query(collection(ctx.guardian, 'guardians'), where('authEmail', '==', `g01711111111@${GDOM}`)))));
  it('guardian reads own guardian doc by id', () => assertSucceeds(getDoc(doc(ctx.guardian, 'guardians/grd-01711111111'))));
  it('stranger cannot write own users doc role (no self-escalation)', () =>
    assertFails(setDoc(doc(ctx.stranger, 'users/xUid'), { role: 'super_admin' })));
  it('accounts cannot grant access', () => assertFails(setDoc(doc(ctx.accounts, 'staffAccess/new@x.com'), { role: 'accounts', status: 'active' })));
  it('principal can grant access', () => assertSucceeds(setDoc(doc(ctx.principal, 'staffAccess/new@x.com'), { role: 'accounts', status: 'active' })));
});

describe('admissions', () => {
  it('accounts creates pending admission', () =>
    assertSucceeds(setDoc(doc(ctx.accounts, 'admissions/adm-2'), { status: 'pending_approval', approvals: [], grandTotal: 1 })));
  it('accounts cannot create approved admission', () =>
    assertFails(setDoc(doc(ctx.accounts, 'admissions/adm-3'), { status: 'approved' })));
  it('accounts cannot approve admission', () =>
    assertFails(updateDoc(doc(ctx.accounts, 'admissions/adm-1'), { status: 'approved', approvals: [{ status: 'approved' }] })));
  it('accounts can cancel admission', () =>
    assertSucceeds(updateDoc(doc(ctx.accounts, 'admissions/adm-1'), { status: 'cancelled', cancelReason: 'x' })));
  it('principal approves admission + creates student + ledger credit', async () => {
    await assertSucceeds(updateDoc(doc(ctx.principal, 'admissions/adm-1'), { status: 'approved', approvals: [{ status: 'approved' }], paymentRecorded: true }));
    await assertSucceeds(setDoc(doc(ctx.principal, 'students/STU-9'), { studentId: 'STU-9' }));
    await assertSucceeds(addDoc(collection(ctx.principal, 'ledgerEntries'), { amount: 100, type: 'credit' }));
    await assertSucceeds(setDoc(doc(ctx.principal, 'guardians/grd-0199'), { mobile: '0199', studentIds: ['STU-9'] }));
  });
  it('master admin approves admission', () =>
    assertSucceeds(updateDoc(doc(ctx.admin, 'admissions/adm-1'), { status: 'approved' })));
  it('accounts can create admission with partial payment + tuition reduction', () =>
    assertSucceeds(setDoc(doc(ctx.accounts, 'admissions/adm-4'), { status: 'pending_approval', approvals: [], grandTotal: 1000, paidAmount: 600, dueAmount: 400,
      tuitionReduction: { standardAmount: 4500, reducedAmount: 4000, reason: 'x', reducedBy: 'y', reducedAt: 'z' } })));
  it('accounts cannot change paid/due/tuition reduction after submit', async () => {
    await assertFails(updateDoc(doc(ctx.accounts, 'admissions/adm-1'), { paidAmount: 1 }));
    await assertFails(updateDoc(doc(ctx.accounts, 'admissions/adm-1'), { dueAmount: 0 }));
    await assertFails(updateDoc(doc(ctx.accounts, 'admissions/adm-1'), { tuitionReduction: { reducedAmount: 1 } }));
  });
  it('teacher cannot read admissions', () => assertFails(getDoc(doc(ctx.teacher, 'admissions/adm-1'))));
});

describe('invoices', () => {
  it('accounts creates invoice', () =>
    assertSucceeds(setDoc(doc(ctx.accounts, 'studentInvoices/inv-3'), { studentId: 'STU-1', status: 'pending', paidAmount: 0 })));
  it('accounts requests payment approval', () =>
    assertSucceeds(updateDoc(doc(ctx.accounts, 'studentInvoices/inv-1'), { paymentApprovalStatus: 'pending', pendingPaymentAmount: 10 })));
  it('accounts cannot mark invoice paid', () =>
    assertFails(updateDoc(doc(ctx.accounts, 'studentInvoices/inv-1'), { status: 'paid', paidAmount: 100, paymentApprovalStatus: 'approved' })));
  it('principal approves payment', () =>
    assertSucceeds(updateDoc(doc(ctx.principal, 'studentInvoices/inv-1'), { status: 'paid', paidAmount: 100, paymentApprovalStatus: 'approved' })));
  it('guardian lists own child invoices (studentId query)', () =>
    assertSucceeds(getDocs(query(collection(ctx.guardian, 'studentInvoices'), where('studentId', '==', 'STU-1')))));
  it('guardian cannot list other child invoices', () =>
    assertFails(getDocs(query(collection(ctx.guardian, 'studentInvoices'), where('studentId', '==', 'STU-2')))));
  it('guardian cannot list all invoices', () => assertFails(getDocs(collection(ctx.guardian, 'studentInvoices'))));
  it('guardian cannot mark own invoice paid', () =>
    assertFails(updateDoc(doc(ctx.guardian, 'studentInvoices/inv-1'), { status: 'paid' })));
  it('guardian reads own child', () => assertSucceeds(getDoc(doc(ctx.guardian, 'students/STU-1'))));
  it('guardian cannot read other child', () => assertFails(getDoc(doc(ctx.guardian, 'students/STU-2'))));
  it('guardian cannot list all students', () => assertFails(getDocs(collection(ctx.guardian, 'students'))));
});

describe('income / expense / ledger', () => {
  it('accounts creates pending income', () =>
    assertSucceeds(setDoc(doc(ctx.accounts, 'incomeEntries/inc-2'), { approvalStatus: 'pending', amount: 1 })));
  it('accounts cannot create approved income', () =>
    assertFails(setDoc(doc(ctx.accounts, 'incomeEntries/inc-3'), { approvalStatus: 'approved', amount: 1 })));
  it('accounts cannot approve income', () =>
    assertFails(updateDoc(doc(ctx.accounts, 'incomeEntries/inc-1'), { approvalStatus: 'approved' })));
  it('principal approves income', () =>
    assertSucceeds(updateDoc(doc(ctx.principal, 'incomeEntries/inc-1'), { approvalStatus: 'approved' })));
  it('accounts creates pending expense', () =>
    assertSucceeds(setDoc(doc(ctx.accounts, 'expenses/exp-2'), { approvalStatus: 'pending', amount: 1 })));
  it('accounts posts auto-approved transfer charge', () =>
    assertSucceeds(setDoc(doc(ctx.accounts, 'expenses/exp-3'), { approvalStatus: 'approved', category: 'Bank / MFS Charge', amount: 1 })));
  it('accounts cannot approve expense', () =>
    assertFails(updateDoc(doc(ctx.accounts, 'expenses/exp-1'), { approvalStatus: 'approved' })));
  it('principal approves expense', () =>
    assertSucceeds(updateDoc(doc(ctx.principal, 'expenses/exp-1'), { approvalStatus: 'approved' })));
  it('accounts appends ledger entry', () => assertSucceeds(addDoc(collection(ctx.accounts, 'ledgerEntries'), { amount: 1 })));
  it('ledger entry amount cannot be edited', () =>
    assertFails(updateDoc(doc(ctx.admin, 'ledgerEntries/le-1'), { amount: 999 })));
  it('ledger entry cannot be deleted', () => assertFails(deleteDoc(doc(ctx.admin, 'ledgerEntries/le-1'))));
  it('principal marks entry reversed', () =>
    assertSucceeds(updateDoc(doc(ctx.principal, 'ledgerEntries/le-1'), { reversed: true })));
  it('guardian cannot write ledger', () => assertFails(addDoc(collection(ctx.guardian, 'ledgerEntries'), { amount: 1 })));
  it('guardian cannot read ledger accounts', () => assertFails(getDocs(collection(ctx.guardian, 'ledgerAccounts'))));
  it('revoked accounts user cannot read income', () => assertFails(getDocs(collection(ctx.revoked, 'incomeEntries'))));
});

describe('staff hiring / coordinators', () => {
  it('accounts submits hire', () =>
    assertSucceeds(setDoc(doc(ctx.accounts, 'schoolStaff/stf-2'), { status: 'pending_approval', name: 'x' })));
  it('accounts cannot activate hire', () =>
    assertFails(updateDoc(doc(ctx.accounts, 'schoolStaff/stf-1'), { status: 'active' })));
  it('principal activates hire + writes teacher role', async () => {
    await assertSucceeds(updateDoc(doc(ctx.principal, 'schoolStaff/stf-1'), { status: 'active' }));
    await assertSucceeds(setDoc(doc(ctx.principal, 'users/newTeacher'), { role: 'teacher' }));
  });
  it('teacher reads staff + writes evaluation', async () => {
    await assertSucceeds(getDocs(collection(ctx.teacher, 'schoolStaff')));
    await assertSucceeds(setDoc(doc(ctx.teacher, 'coordinatorEvaluations/e1'), { score: 1 }));
  });
  it('teacher cannot write staff', () => assertFails(updateDoc(doc(ctx.teacher, 'schoolStaff/stf-1'), { status: 'active' })));
});

describe('inventory / assets', () => {
  it('accounts writes inventory item + movement', async () => {
    await assertSucceeds(setDoc(doc(ctx.accounts, 'inventoryItems/i1'), { name: 'Khata' }));
    await assertSucceeds(setDoc(doc(ctx.accounts, 'inventoryMovements/m1'), { qty: 1 }));
  });
  it('inventory movement is append-only', async () => {
    await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'inventoryMovements/m0'), { qty: 1 }));
    await assertFails(updateDoc(doc(ctx.accounts, 'inventoryMovements/m0'), { qty: 5 }));
  });
  it('accounts writes asset + location log', async () => {
    await assertSucceeds(setDoc(doc(ctx.accounts, 'schoolAssets/a1'), { name: 'Desk' }));
    await assertSucceeds(setDoc(doc(ctx.accounts, 'assetLocationLogs/l1'), { to: 'Room 1' }));
  });
  it('guardian cannot read inventory', () => assertFails(getDocs(collection(ctx.guardian, 'inventoryItems'))));
});

describe('settings & defaults', () => {
  it('signed-in user reads settings', () => assertSucceeds(getDoc(doc(ctx.guardian, 'schoolSettings/main'))));
  it('accounts cannot change settings', () => assertFails(setDoc(doc(ctx.accounts, 'schoolSettings/main'), { name: 'X' })));
  it('master admin changes settings', () => assertSucceeds(setDoc(doc(ctx.admin, 'schoolSettings/main'), { name: 'X' })));
  it('unauthenticated cannot read anything', async () => {
    await assertFails(getDoc(doc(ctx.anon, 'schoolSettings/main')));
    await assertFails(getDoc(doc(ctx.anon, 'students/STU-1')));
    await assertFails(getDocs(collection(ctx.anon, 'ledgerEntries')));
  });
  it('signed-in stranger gets nothing', async () => {
    await assertFails(getDocs(collection(ctx.stranger, 'students')));
    await assertFails(getDocs(collection(ctx.stranger, 'incomeEntries')));
  });
  it('unknown collection denied even for admin', () => assertFails(setDoc(doc(ctx.admin, 'randomStuff/x'), { a: 1 })));
});

describe('day close needs principal approval', () => {
  const req = { date: '2026-10-29', status: 'pending_approval', requestedBy: 'acc', requestedAt: 'x', totalIncome: 1 };
  it('accounts submits a pending close request', () =>
    assertSucceeds(setDoc(doc(ctx.accounts, 'dayCloseRecords/day-2026-10-29'), req)));
  it('accounts cannot create an approved close', () =>
    assertFails(setDoc(doc(ctx.accounts, 'dayCloseRecords/day-2026-10-30'), { ...req, status: 'approved' })));
  it('accounts cannot sneak approvedBy into a request', () =>
    assertFails(setDoc(doc(ctx.accounts, 'dayCloseRecords/day-2026-10-31'), { ...req, approvedBy: 'acc' })));
  it('accounts cannot self-approve a pending request', async () => {
    await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'dayCloseRecords/d1'), req));
    await assertFails(updateDoc(doc(ctx.accounts, 'dayCloseRecords/d1'), { status: 'approved', approvedBy: 'acc', approvedAt: 'y' }));
  });
  it('accounts resubmits a rejected request', async () => {
    await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'dayCloseRecords/d2'), { ...req, status: 'rejected', rejectReason: 'fix' }));
    await assertSucceeds(updateDoc(doc(ctx.accounts, 'dayCloseRecords/d2'), { status: 'pending_approval', requestedAt: 'z' }));
  });
  it('accounts cannot change an approved (legacy) close', async () => {
    await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'dayCloseRecords/d3'), { date: '2026-10-01', closedBy: 'x' }));
    await assertFails(updateDoc(doc(ctx.accounts, 'dayCloseRecords/d3'), { status: 'pending_approval' }));
  });
  it('principal approves', async () => {
    await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'dayCloseRecords/d4'), req));
    await assertSucceeds(updateDoc(doc(ctx.principal, 'dayCloseRecords/d4'), { status: 'approved', approvedBy: 'p', approvedAt: 'y', closedBy: 'p', closedAt: 'y' }));
  });
  it('master admin rejects', async () => {
    await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'dayCloseRecords/d5'), req));
    await assertSucceeds(updateDoc(doc(ctx.admin, 'dayCloseRecords/d5'), { status: 'rejected', rejectReason: 'r' }));
  });
  it('teacher cannot read day close', () => assertFails(getDocs(collection(ctx.teacher, 'dayCloseRecords'))));
});
