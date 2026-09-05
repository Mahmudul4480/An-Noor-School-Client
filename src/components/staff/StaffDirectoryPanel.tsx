import React from 'react';
import { Loader2, UserRound } from 'lucide-react';
import { fetchStaffMembers, statusLabel } from '../../lib/staff';
import { StaffProfileModal } from './StaffProfileModal';
import type { StaffMember, StaffTrack } from '../../types';

export function StaffDirectoryPanel({
  viewer,
  reloadToken = 0,
}: {
  viewer: 'accounts' | 'principal';
  reloadToken?: number;
}) {
  const [people, setPeople] = React.useState<StaffMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [track, setTrack] = React.useState<StaffTrack>('teacher');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setPeople(await fetchStaffMembers());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load, reloadToken]);

  const list = people.filter((person) => person.track === track && (viewer === 'accounts' || person.status !== 'rejected'));
  const selected = people.find((person) => person.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-white p-2 rounded-[1.5rem] border border-school-border w-fit">
        {(['teacher', 'staff'] as StaffTrack[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTrack(item)}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
              track === item ? 'bg-school-blue text-white' : 'text-school-muted'
            }`}
          >
            {item === 'teacher' ? 'Teachers' : 'Staff'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-school-blue uppercase tracking-tight">
              {track === 'teacher' ? 'Teachers List' : 'Staff List'}
            </h3>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
              {list.filter((person) => person.status === 'active').length} onboarded
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-school-muted font-bold">
            <Loader2 size={22} className="animate-spin mx-auto mb-2" /> Loading…
          </div>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-sm font-bold text-school-muted">
            এই লিস্টে এখনো কেউ নেই। Accounts নিয়োগ দিলে Principal approve করার পর এখানে আসবে।
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => setSelectedId(person.id)}
                className="text-left p-5 rounded-[2rem] border border-slate-100 hover:border-school-gold bg-slate-50/50"
              >
                <div className="flex items-center gap-4">
                  {person.photoUrl ? (
                    <img src={person.photoUrl} alt="" className="w-14 h-16 object-cover rounded-xl" />
                  ) : (
                    <div className="w-14 h-16 rounded-xl bg-white border border-school-border flex items-center justify-center text-school-muted">
                      <UserRound size={22} />
                    </div>
                  )}
                  <div>
                    <p className="font-black text-school-blue uppercase tracking-tight">{person.name}</p>
                    <p className="text-[10px] font-bold text-school-muted uppercase tracking-widest mt-1">
                      {person.employeeId} • {person.designation}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-emerald-600">
                      {statusLabel(person.status)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <StaffProfileModal
          person={selected}
          viewer={viewer}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
