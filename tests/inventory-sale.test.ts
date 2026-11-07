import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dayEntryBlockMessage } from '../src/lib/dayLock.ts';
import { buildInventorySaleReceiptHtml } from '../src/lib/inventorySaleReceipt.ts';
import {
  creditInventorySaleNow,
  defaultSalePrice,
  liveSaleTotal,
  parseSaleQuantity,
  planInventorySale,
} from '../src/lib/inventoryQuantity.ts';

describe('inventory sale', () => {
  it('grows the total when quantity grows, including Bangla digits', () => {
    assert.equal(liveSaleTotal('1', '60').total, 60);
    assert.equal(liveSaleTotal('2', '60').total, 120);
    assert.equal(liveSaleTotal('৫', '৬০').total, 300);
    assert.equal(liveSaleTotal('', '60').total, 0);
    const shown = liveSaleTotal('২', '৬০');
    const saved = planInventorySale({
      name: 'Khata',
      unit: 'pcs',
      soldQty: 0,
      quantity: shown.quantity,
      unitPrice: shown.unitPrice,
    });
    assert.equal(saved.income?.amount, shown.total);
    const credited = creditInventorySaleNow(
      {
        category: 'ইনভেন্টরি বিক্রয়',
        createdBy: 'Accounts',
        createdAt: '2026-11-07T06:09:00.000Z',
        approvalStatus: 'pending',
        amount: shown.total,
      },
      { itemName: 'Khata', quantity: shown.quantity, unit: 'pcs', unitPrice: shown.unitPrice, movementId: 'mov-1' },
    );
    assert.equal(credited.approvalStatus, 'approved');
    assert.equal(credited.amount, shown.total);
    const html = buildInventorySaleReceiptHtml({
      receiptNumber: 'INC-1',
      issuedAt: '2026-11-07T06:09:00.000Z',
      buyerName: 'করিম',
      itemName: 'Khata',
      quantity: 2,
      unit: 'pcs',
      unitPrice: 60,
      total: 120,
      accountName: 'Main Cash',
      paymentMethod: 'ক্যাশ',
      receivedBy: 'Accounts',
    });
    assert.match(html, /গ্রাহক কপি/);
    assert.match(html, /Customer Copy/);
    assert.match(html, /অফিস কপি/);
    assert.match(html, /Office Copy/);
    assert.match(html, /মোট দাম/);
    assert.match(html, /12:09\s*PM/);
    assert.match(html, /page-break-inside:\s*avoid/);
    assert.equal((html.match(/class="copy"/g) || []).length, 2);
    assert.equal((html.match(/class="page"/g) || []).length, 1);
  });

  it('defaults the price to the selling price', () => {
    assert.equal(defaultSalePrice({ studentPrice: 120, costRate: 80 }), 120);
    assert.equal(defaultSalePrice({ studentPrice: 0, costRate: 80 }), 80);
  });

  it('accepts a Bangla quantity that is still in stock', () => {
    const parsed = parseSaleQuantity('২', 'box', 5);
    assert.equal(parsed.ok && parsed.value, 2);
  });

  it('rejects an empty quantity, zero, a decimal unit, and more than stock', () => {
    assert.equal(parseSaleQuantity('', 'pcs', 5).ok, false);
    assert.equal(parseSaleQuantity('০', 'pcs', 5).ok, false);
    assert.equal(parseSaleQuantity('1.5', 'pcs', 5).ok, false);
    const over = parseSaleQuantity('6', 'box', 5);
    assert.equal(over.ok, false);
    if (!over.ok) assert.match(over.message, /স্টকে মাত্র 5/);
  });

  it('plans a stock drop and an income row with the item name and quantity', () => {
    const plan = planInventorySale({
      name: 'Photocopier Toner',
      unit: 'box',
      soldQty: 1,
      quantity: 2,
      unitPrice: 150,
      buyerName: 'করিম',
      note: 'দোকান',
    });
    assert.equal(plan.soldQty, 3);
    assert.equal(plan.total, 300);
    assert.equal(plan.income?.category, 'ইনভেন্টরি বিক্রয়');
    assert.equal(plan.income?.source, 'করিম');
    assert.equal(plan.income?.description, 'Photocopier Toner × 2 box');
    assert.equal(plan.income?.amount, 300);
    assert.equal(plan.income?.note, 'দোকান');
  });

  it('uses a counter sale when no buyer is named and skips income when the total is zero', () => {
    const named = planInventorySale({ name: 'Khata', unit: 'pcs', soldQty: 0, quantity: 1, unitPrice: 40 });
    assert.equal(named.income?.source, 'কাউন্টার বিক্রি');
    const free = planInventorySale({ name: 'Khata', unit: 'pcs', soldQty: 0, quantity: 1, unitPrice: 0 });
    assert.equal(free.total, 0);
    assert.equal(free.income, null);
    assert.equal(free.soldQty, 1);
  });
});

describe('closed day', () => {
  it('blocks a locked day and a day waiting for the Principal', () => {
    assert.match(dayEntryBlockMessage('approved') ?? '', /লক/);
    assert.match(dayEntryBlockMessage('pending_approval') ?? '', /অনুমোদন/);
    assert.equal(dayEntryBlockMessage('none'), null);
    assert.equal(dayEntryBlockMessage('rejected'), null);
  });
});
