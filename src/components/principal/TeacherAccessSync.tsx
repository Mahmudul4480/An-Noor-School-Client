import React from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchStudents } from '../../lib/students';
import { fetchStaffMembers } from '../../lib/staff';
import { syncAllTeacherAccess } from '../../lib/teacherAccess';
import { showToast } from '../../lib/toast';
import { userErrorMessage } from '../../lib/errorMessages';

/** Principal-only: rebuild teacher roster + class access (only adds/overwrites derived docs; source records untouched). */
export function TeacherAccessSync() {
  const [busy, setBusy] = React.useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const [students, staff] = await Promise.all([fetchStudents(), fetchStaffMembers()]);
      const r = await syncAllTeacherAccess(students, staff);
      showToast('success', 'শিক্ষকদের ক্লাস অ্যাক্সেস হালনাগাদ হয়েছে', `${r.students} জন ছাত্র, ${r.teachers} জন স্টাফ`);
    } catch (e) {
      showToast('error', 'শিক্ষকদের অ্যাক্সেস হালনাগাদ করা যায়নি', userErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-school-border font-bn">
      <p className="text-[11px] font-bold text-school-muted">
        শিক্ষকরা শুধু নিজের ক্লাস/সেকশনের ছাত্র দেখেন। পুরনো ছাত্র বা দায়িত্ব শিক্ষকের তালিকায় না এলে একবার চাপুন।
      </p>
      <button onClick={run} disabled={busy}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-school-blue text-white text-[11px] font-black disabled:opacity-50">
        <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
        {busy ? 'হালনাগাদ হচ্ছে…' : 'শিক্ষকদের ক্লাস অ্যাক্সেস সিঙ্ক'}
      </button>
    </div>
  );
}
