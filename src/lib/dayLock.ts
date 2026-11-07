export type DayLockStatus = 'none' | 'pending_approval' | 'approved' | 'rejected';

/**
 * A locked day, or a day whose close is waiting on the Principal, cannot take new money.
 * A rejected close can be corrected, so entries are allowed again.
 */
export function dayEntryBlockMessage(status: DayLockStatus | null | undefined): string | null {
  if (status === 'approved') {
    return 'এই তারিখের দিন ক্লোজ (লক) হয়ে গেছে। নতুন বিক্রি বা ইনকাম এন্ট্রি নেওয়া যাবে না।';
  }
  if (status === 'pending_approval') {
    return 'এই তারিখের দিন ক্লোজ Principal-এর অনুমোদনের অপেক্ষায়। নতুন বিক্রি বা ইনকাম এন্ট্রি নেওয়া যাবে না।';
  }
  return null;
}
