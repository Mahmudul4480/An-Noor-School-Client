import type { ReactNode } from 'react';

export type SiteTone = 'navy' | 'leaf' | 'orange' | 'sky' | 'sun' | 'coral';

export const toneClass: Record<SiteTone, { bg: string; text: string; lede: string; wave: string }> = {
  navy: { bg: 'bg-navy', text: 'text-white', lede: 'text-white/85', wave: '#FFF7E3' },
  leaf: { bg: 'bg-leaf', text: 'text-white', lede: 'text-white/90', wave: '#FFF7E3' },
  orange: { bg: 'bg-orange', text: 'text-navy-deep', lede: 'text-navy-deep/80', wave: '#FFF7E3' },
  sky: { bg: 'bg-sky', text: 'text-navy-deep', lede: 'text-navy-deep/80', wave: '#FFF7E3' },
  sun: { bg: 'bg-sun', text: 'text-navy-deep', lede: 'text-navy-deep/80', wave: '#FFF7E3' },
  coral: { bg: 'bg-coral', text: 'text-white', lede: 'text-navy-deep', wave: '#FFF7E3' },
};

export function Wave({
  fill = '#FFF7E3',
  className = '',
  flip = false,
}: {
  fill?: string;
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 72"
      preserveAspectRatio="none"
      className={`block h-10 w-full sm:h-14 ${flip ? 'rotate-180' : ''} ${className}`}
    >
      <path
        fill={fill}
        d="M0 36c80 24 160-24 240 0s160 24 240 0 160-24 240 0 160 24 240 0 160-24 240 0 160 24 240 0v36H0Z"
      />
    </svg>
  );
}

export function Sticker({
  children,
  className = '',
  rotate = -2,
}: {
  children: ReactNode;
  className?: string;
  rotate?: number;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border-2 border-navy-deep bg-sun px-3 py-1 text-sm font-bold text-navy-deep shadow-[4px_4px_0_0_#2A2C89] ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}

export function ArchFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`arch-photo overflow-hidden border-[6px] border-white bg-white shadow-[0_14px_0_0_#FFC928] ${className}`}
    >
      {children}
    </div>
  );
}

export function BlobFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`blob-photo overflow-hidden border-[6px] border-white bg-white shadow-[0_12px_0_0_#5CB8F5] ${className}`}>
      {children}
    </div>
  );
}

export function SoftCard({
  children,
  className = '',
  accent = 'navy',
}: {
  children: ReactNode;
  className?: string;
  accent?: SiteTone;
}) {
  const border = {
    navy: 'border-navy',
    leaf: 'border-leaf',
    orange: 'border-orange',
    sky: 'border-sky',
    sun: 'border-sun',
    coral: 'border-coral',
  }[accent];
  return (
    <div className={`rounded-[28px] border-4 bg-white p-5 shadow-[0_14px_0_0_rgba(42,44,137,0.12)] ${border} ${className}`}>
      {children}
    </div>
  );
}
