import React from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Users } from 'lucide-react';
import { db } from '../../lib/firebase';
import { CLASS_OPTIONS, CLASS_SECTIONS } from '../../lib/schoolConstants';
import { showToast } from '../../lib/toast';

const BN_CLASS: Record<string, string> = {
  Play: 'প্লে', Nursery: 'নার্সারি', KG: 'কেজি',
  'Class 1': '১ম শ্রেণি', 'Class 2': '২য় শ্রেণি', 'Class 3': '৩য় শ্রেণি',
  'Class 4': '৪র্থ শ্রেণি', 'Class 5': '৫ম শ্রেণি', 'Class 6': '৬ষ্ঠ শ্রেণি',
};
const bn = (n: number) => n.toLocaleString('bn-BD');
const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();

type Counts = { total: number; byClass: Record<string, { total: number; sections: Record<string, number> }> };

/**
 * Live class/section-wise count of ENROLLED students (students.status === 'Active').
 * "অপেক্ষমাণ" = admissions with status 'pending_approval'.
 */
export function ClassCountCards() {
  const [counts, setCounts] = React.useState<Counts | null>(null);
  const [pending, setPending] = React.useState<Record<string, number>>({});
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const fail = () => {
      setError(true);
      showToast('error', 'ছাত্র সংখ্যা লোড করা যায়নি', 'ইন্টারনেট সংযোগ বা অনুমতি পরীক্ষা করুন, তারপর পাতা রিফ্রেশ করুন।');
    };
    const unsubS = onSnapshot(query(collection(db, 'students'), where('status', '==', 'Active')), (snap) => {
      const c: Counts = { total: 0, byClass: {} };
      CLASS_OPTIONS.forEach((k) => { c.byClass[k] = { total: 0, sections: {} }; });
      snap.docs.forEach((d) => {
        const data = d.data();
        const cls = CLASS_OPTIONS.find((k) => norm(k) === norm(data.class)) ?? 'অন্যান্য';
        c.byClass[cls] ??= { total: 0, sections: {} };
        c.byClass[cls].total += 1;
        const sec = (CLASS_SECTIONS[cls] ?? []).find((s) => norm(s) === norm(data.section));
        const key = sec ?? (CLASS_SECTIONS[cls] ? 'সেকশন নেই' : '');
        if (key) c.byClass[cls].sections[key] = (c.byClass[cls].sections[key] ?? 0) + 1;
        c.total += 1;
      });
      setCounts(c); setError(false);
    }, fail);
    const unsubA = onSnapshot(query(collection(db, 'admissions'), where('status', '==', 'pending_approval')), (snap) => {
      const p: Record<string, number> = { __total: 0 };
      snap.docs.forEach((d) => {
        const cls = CLASS_OPTIONS.find((k) => norm(k) === norm(d.data().classApplied)) ?? 'অন্যান্য';
        p[cls] = (p[cls] ?? 0) + 1; p.__total += 1;
      });
      setPending(p);
    }, () => setPending({}));
    return () => { unsubS(); unsubA(); };
  }, []);

  const classes = counts ? Object.keys(counts.byClass) : [...CLASS_OPTIONS];
  return (
    <div className="space-y-3" style={{ fontFamily: "'Anek Bangla', sans-serif" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-school-blue">শ্রেণিভিত্তিক ছাত্র-ছাত্রী (লাইভ)</h3>
        {error && <span className="text-xs font-bold text-rose-500">লোড করা যায়নি</span>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
        <div className="rounded-[1.5rem] p-5 bg-school-blue text-white shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold opacity-80"><Users size={16} /> মোট ছাত্র-ছাত্রী</div>
          <div className="text-3xl font-black mt-2">{counts ? bn(counts.total) : '…'}</div>
          {!!pending.__total && <div className="text-xs mt-1 text-school-gold font-bold">অপেক্ষমাণ: {bn(pending.__total)}</div>}
        </div>
        {classes.map((cls) => {
          const row = counts?.byClass[cls];
          return (
            <div key={cls} className="rounded-[1.5rem] p-5 bg-white border border-school-border shadow-sm">
              <div className="text-xs font-bold text-school-muted">{BN_CLASS[cls] ?? cls}</div>
              <div className="text-2xl font-black text-school-blue mt-1">{row ? bn(row.total) : '…'}</div>
              {row && Object.keys(row.sections).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {[...(CLASS_SECTIONS[cls] ?? []), ...Object.keys(row.sections).filter((s) => !(CLASS_SECTIONS[cls] ?? []).includes(s))].map((s) => (
                    <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-school-blue font-bold">{s}: {bn(row.sections[s] ?? 0)}</span>
                  ))}
                </div>
              )}
              {!!pending[cls] && <div className="text-[11px] mt-1 text-amber-600 font-bold">অপেক্ষমাণ: {bn(pending[cls])}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
