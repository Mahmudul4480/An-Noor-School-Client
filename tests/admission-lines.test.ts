import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  admissionStockError,
  feeAccountPostings,
  inventoryLineDescription,
  inventoryLineTotal,
} from '../src/lib/admissionLines.ts';

describe('admission fee accounts', () => {
  it('keeps an older admission on its single account', () => {
    const postings = feeAccountPostings(
      [
        { label: 'Admission Fee', amount: 10000 },
        { label: 'Tuition Fee (Monthly)', amount: 4500 },
      ],
      14500,
      'main-cash',
    );
    assert.deepEqual(postings, [{ accountId: 'main-cash', amount: 14500, label: 'Admission Fee' }]);
  });

  it('posts each line to its own account and fills a partial payment from the top', () => {
    const postings = feeAccountPostings(
      [
        { label: 'Admission Fee', amount: 10000, accountId: 'cash' },
        { label: 'Book (1 Year)', amount: 2000, accountId: 'bank' },
        { label: 'Copy (1 Year)', amount: 0, accountId: 'cash' },
      ],
      11000,
      'cash',
    );
    assert.deepEqual(postings, [
      { accountId: 'cash', amount: 10000, label: 'Admission Fee' },
      { accountId: 'bank', amount: 1000, label: 'Book (1 Year)' },
    ]);
  });
});

describe('admission inventory stock', () => {
  it('blocks a sale when live stock is missing, empty, or too small', () => {
    assert.match(admissionStockError(1, null, 'pcs') ?? '', /দেখা যাচ্ছে না/);
    assert.match(admissionStockError(1, 0, 'pcs') ?? '', /শেষ/);
    assert.match(admissionStockError(3, 2, 'copy') ?? '', /মাত্র 2 copy/);
    assert.equal(admissionStockError(2, 2, 'pcs'), null);
  });

  it('describes the income line like an inventory sale', () => {
    assert.equal(inventoryLineDescription({ itemName: 'Bangla Khata', quantity: 4, unit: 'copy' }), 'Bangla Khata × 4 copy');
    assert.equal(inventoryLineTotal(4, 25), 100);
  });
});
