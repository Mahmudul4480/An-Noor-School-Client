import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  INVENTORY_UNIT_OPTIONS,
  openingStockPlan,
  parseMoneyAmount,
  parseOpeningQuantity,
  parseOptionalWholeNumber,
  stockUnitAllowsDecimal,
} from '../src/lib/inventoryQuantity.ts';
import { formatDateTime, formatEntryDateTime } from '../src/lib/utils.ts';

describe('new stock item opening quantity', () => {
  it('keeps a quantity typed in western digits', () => {
    const parsed = parseOpeningQuantity('2', 'pcs');
    assert.equal(parsed.ok && parsed.value, 2);
  });

  it('treats Bangla digits as a quantity (parseInt used to turn them into 0)', () => {
    assert.equal(Number.isNaN(parseInt('১০', 10)), true);
    const parsed = parseOpeningQuantity('১০', 'box');
    assert.equal(parsed.ok && parsed.value, 10);
    const plan = openingStockPlan(parsed.ok ? parsed.value : 0, 'box');
    assert.equal(plan.purchasedQty, 10);
    assert.deepEqual(plan.movement, { type: 'purchase', quantity: 10, note: 'প্রাথমিক স্টক' });
  });

  it('allows an explicit zero and does not invent a stock-in', () => {
    const parsed = parseOpeningQuantity('০', 'pcs');
    assert.equal(parsed.ok && parsed.value, 0);
    const plan = openingStockPlan(0, 'pcs');
    assert.equal(plan.purchasedQty, 0);
    assert.equal(plan.movement, null);
  });

  it('asks for a quantity when the box is left empty', () => {
    const parsed = parseOpeningQuantity('   ', 'pcs');
    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.match(parsed.message, /প্রাথমিক পরিমাণ/);
  });

  it('rejects negatives and thousands-separators still count', () => {
    assert.equal(parseOpeningQuantity('-1', 'pcs').ok, false);
    const thousands = parseOpeningQuantity('১,০০০', 'pcs');
    assert.equal(thousands.ok && thousands.value, 1000);
  });

  it('rejects decimals for every store unit and allows them only for a continuous unit', () => {
    for (const unit of INVENTORY_UNIT_OPTIONS) {
      assert.equal(stockUnitAllowsDecimal(unit), false);
      assert.equal(parseOpeningQuantity('1.5', unit).ok, false);
    }
    const kg = parseOpeningQuantity('1.50', 'kg');
    assert.equal(kg.ok && kg.value, 1.5);
    assert.equal(openingStockPlan(1.5, 'kg').purchasedQty, 1.5);
    assert.equal(openingStockPlan(2.9, 'pcs').purchasedQty, 2);
  });

  it('reads Bangla money and a blank reorder level as zero', () => {
    const money = parseMoneyAmount('৫০০', 'ক্রয় মূল্য লিখুন।');
    assert.equal(money.ok && money.value, 500);
    const reorder = parseOptionalWholeNumber('', 'রিঅর্ডার লেভেল পূর্ণ সংখ্যায় লিখুন (০ বা তার বেশি)।');
    assert.equal(reorder.ok && reorder.value, 0);
    const banglaReorder = parseOptionalWholeNumber('২০', 'bad');
    assert.equal(banglaReorder.ok && banglaReorder.value, 20);
  });
});

describe('Bangladesh entry time', () => {
  it('shows 12:09 PM for 06:09 UTC', () => {
    const stamp = '2026-11-07T06:09:00.000Z';
    assert.match(formatDateTime(stamp), /12:09\s*PM/);
    assert.match(formatEntryDateTime('2026-11-07', stamp), /12:09\s*PM/);
  });
});
