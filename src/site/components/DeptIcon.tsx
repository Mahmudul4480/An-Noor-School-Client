import { Art } from '../art';

const badge: Record<string, string> = {
  islamic: 'bg-sun text-navy-deep',
  hifz: 'bg-[#cdeedb] text-navy',
  arabic: 'bg-sky/50 text-navy-deep',
  english: 'bg-orange/30 text-navy-deep',
};

/** One recognisable mark per department: a mosque, the Qur'an on its stand, an Arabic letter, English letters. */
export function DeptIcon({ id, className = '', small = false }: { id: string; className?: string; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl shadow-[0_6px_14px_rgba(42,44,137,0.14)] ${
        small ? 'h-14 w-14' : 'h-16 w-16'
      } ${badge[id] ?? badge.english} ${className}`}
    >
      {id === 'islamic' && (
        <svg viewBox="0 0 64 64" className="h-11 w-11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M34 5a4.5 4.5 0 1 0 3.5 7.2A5.5 5.5 0 0 1 34 5Z" fill="#2A2C89" />
          <path d="M32 15v4" />
          <path d="M17 37c0-9 7-13 15-18 8 5 15 9 15 18" fill="#FFFFFF" />
          <path d="M13 37h38v19H13z" fill="#FFFFFF" />
          <path d="M27 56V46a5 5 0 0 1 10 0v10" fill="#2A2C89" />
          <path d="M6 56V27l2.5-5 2.5 5v29M53 56V27l2.5-5 2.5 5v29" />
          <path d="M4 56h56" />
        </svg>
      )}
      {id === 'hifz' && <Art name="quran" className="h-12 w-12 text-navy" />}
      {id === 'arabic' && (
        <span lang="ar" className="font-bismillah text-4xl" style={{ lineHeight: 1 }}>
          ع
        </span>
      )}
      {id !== 'islamic' && id !== 'hifz' && id !== 'arabic' && (
        <span className="font-display text-2xl leading-none tracking-wide">Abc</span>
      )}
    </span>
  );
}
