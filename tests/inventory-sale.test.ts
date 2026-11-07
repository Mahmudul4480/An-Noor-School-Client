import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dayEntryBlockMessage } from '../src/lib/dayLock.ts';
import {
  defaultSalePrice,
  parseSaleQuantity,
  planInventorySale,
} from '../src/lib/inventoryQuantity.ts';

describe('inventory sale', () => {
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
