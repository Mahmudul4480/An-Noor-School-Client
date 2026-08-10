import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { recordInvoicePayment } from './invoices';
import { ONLINE_PAYMENT_ACCOUNT_ID } from './ledger';
import { omitUndefined } from './utils';
import type { PaymentGatewayProvider, PaymentIntent, StudentInvoice } from '../types';

const PAYMENT_INTENTS_COLLECTION = 'paymentIntents';
const LOCAL_PAYMENT_INTENTS_KEY = 'an-noor-payment-intents';

export const PAYMENT_GATEWAY_ENABLED = import.meta.env.VITE_PAYMENT_GATEWAY_ENABLED === 'true';
export const PAYMENT_GATEWAY_PROVIDER = (import.meta.env.VITE_PAYMENT_GATEWAY_PROVIDER ?? 'sslcommerz') as PaymentGatewayProvider;

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return (JSON.parse(raw) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isPaymentGatewayConfigured(): boolean {
  return PAYMENT_GATEWAY_ENABLED && Boolean(import.meta.env.VITE_PAYMENT_GATEWAY_KEY);
}

export async function fetchPaymentIntents(invoiceId?: string): Promise<PaymentIntent[]> {
  let intents: PaymentIntent[];

  if (isDemoLoginEnabled) {
    intents = readLocal<PaymentIntent[]>(LOCAL_PAYMENT_INTENTS_KEY, []);
  } else {
    await waitForAuthUser();
    const snapshot = await getDocs(query(collection(db, PAYMENT_INTENTS_COLLECTION)));
    intents = snapshot.docs.map((document) => document.data() as PaymentIntent);
  }

  if (invoiceId) {
    intents = intents.filter((intent) => intent.invoiceId === invoiceId);
  }

  return intents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function savePaymentIntent(intent: PaymentIntent): Promise<PaymentIntent> {
  if (isDemoLoginEnabled) {
    const all = readLocal<PaymentIntent[]>(LOCAL_PAYMENT_INTENTS_KEY, []);
    const index = all.findIndex((item) => item.id === intent.id);
    if (index >= 0) all[index] = intent;
    else all.push(intent);
    writeLocal(LOCAL_PAYMENT_INTENTS_KEY, all);
    return intent;
  }

  await waitForAuthUser();
  await setDoc(
    doc(db, PAYMENT_INTENTS_COLLECTION, intent.id),
    omitUndefined({ ...intent, createdAt: serverTimestamp() }),
    { merge: true },
  );
  return intent;
}

export interface InitiateOnlinePaymentResult {
  intent: PaymentIntent;
  redirectUrl?: string;
  message: string;
}

export async function initiateOnlinePayment(invoice: StudentInvoice): Promise<InitiateOnlinePaymentResult> {
  const dueAmount = invoice.totalAmount - invoice.paidAmount;
  if (dueAmount <= 0) throw new Error('This invoice is already paid.');

  const provider = PAYMENT_GATEWAY_PROVIDER;
  const sessionId = generateId('pgw');

  const intent: PaymentIntent = {
    id: generateId('pay'),
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    studentId: invoice.studentId,
    studentName: invoice.studentName,
    amount: dueAmount,
    provider,
    status: 'pending',
    gatewaySessionId: sessionId,
    createdAt: new Date().toISOString(),
  };

  if (isPaymentGatewayConfigured()) {
    intent.redirectUrl = `${window.location.origin}/payment/checkout?session=${sessionId}&invoice=${invoice.id}`;
    await savePaymentIntent(intent);
    return {
      intent,
      redirectUrl: intent.redirectUrl,
      message: 'Redirecting to payment gateway...',
    };
  }

  await savePaymentIntent(intent);
  return {
    intent,
    message:
      'Payment gateway is not configured yet. Payment intent saved — complete via gateway webhook or accounts verification.',
  };
}

export async function completeOnlinePayment(params: {
  intentId: string;
  gatewayTransactionId: string;
}): Promise<{ intent: PaymentIntent; invoice: StudentInvoice }> {
  const intents = await fetchPaymentIntents();
  const intent = intents.find((item) => item.id === params.intentId);
  if (!intent) throw new Error('Payment intent not found.');
  if (intent.status === 'completed') throw new Error('Payment already completed.');

  const invoice = await recordInvoicePayment({
    invoiceId: intent.invoiceId,
    amount: intent.amount,
    accountId: ONLINE_PAYMENT_ACCOUNT_ID,
    paymentMethod: 'gateway',
    gatewayRef: params.gatewayTransactionId,
    gatewayProvider: intent.provider,
  });

  const updatedIntent: PaymentIntent = {
    ...intent,
    status: 'completed',
    gatewayTransactionId: params.gatewayTransactionId,
    completedAt: new Date().toISOString(),
  };

  if (isDemoLoginEnabled) {
    await savePaymentIntent(updatedIntent);
  } else {
    await waitForAuthUser();
    await updateDoc(doc(db, PAYMENT_INTENTS_COLLECTION, intent.id), omitUndefined({
      status: 'completed',
      gatewayTransactionId: params.gatewayTransactionId,
      completedAt: serverTimestamp(),
    }));
  }

  return { intent: updatedIntent, invoice };
}

/** Demo / manual online payment when gateway is not live yet */
export async function simulateOnlinePayment(invoice: StudentInvoice): Promise<StudentInvoice> {
  const dueAmount = invoice.totalAmount - invoice.paidAmount;
  if (dueAmount <= 0) throw new Error('Invoice already paid.');

  const intent = await initiateOnlinePayment(invoice);
  const transactionId = `SIM-${Date.now()}`;
  const result = await completeOnlinePayment({
    intentId: intent.intent.id,
    gatewayTransactionId: transactionId,
  });
  return result.invoice;
}

export function getOnlinePaymentAccountLabel(): string {
  return 'Online Payment';
}
