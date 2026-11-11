import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { SwayingFlower } from '../art';

export type SiteTone = 'navy' | 'leaf' | 'orange' | 'sky' | 'sun' | 'coral';

export const toneClass: Record<SiteTone, { bg: string; text: string; lede: string; wave: string }> = {
  navy: { bg: 'bg-navy', text: 'text-white', lede: 'text-white/85', wave: '#FFFFFF' },
  leaf: { bg: 'bg-leaf', text: 'text-white', lede: 'text-white/90', wave: '#FFFFFF' },
  orange: { bg: 'bg-orange', text: 'text-navy-deep', lede: 'text-navy-deep/80', wave: '#FFFFFF' },
  sky: { bg: 'bg-sky', text: 'text-navy-deep', lede: 'text-navy-deep/80', wave: '#FFFFFF' },
  sun: { bg: 'bg-sun', text: 'text-navy-deep', lede: 'text-navy-deep/80', wave: '#FFFFFF' },
  coral: { bg: 'bg-coral', text: 'text-white', lede: 'text-navy-deep', wave: '#FFFFFF' },
};

export function Wave({
  fill = '#FFFFFF',
  className = '',
  flip = false,
  flowers = false,
}: {
  fill?: string;
  className?: string;
  flip?: boolean;
  flowers?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        className={`block h-10 w-full sm:h-14 ${flip ? 'rotate-180' : ''}`}
      >
        <path
          fill={fill}
          d="M0 36c80 24 160-24 240 0s160 24 240 0 160-24 240 0 160 24 240 0 160-24 240 0 160 24 240 0v36H0Z"
        />
      </svg>
      {flowers && <WaveFlowers />}
    </div>
  );
}

function WaveFlowers() {
  return (
    <>
      <SwayingFlower className="absolute -top-2 left-2 h-7 w-7 opacity-80 sm:left-6 sm:h-9 sm:w-9" />
      <SwayingFlower className="absolute -top-3 right-3 hidden h-8 w-8 opacity-80 md:block" delay={0.6} />
    </>
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
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={`inline-flex items-center rounded-full border border-navy/15 bg-sun px-3 py-1 text-sm font-bold text-navy-deep shadow-[0_6px_16px_rgba(42,44,137,0.12)] ${className}`}
      style={{ rotate }}
      whileHover={reduce ? undefined : { rotate: rotate - 3 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.span>
  );
}

export function Float({
  children,
  className = '',
  duration = 7,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden="true"
      className={className}
      animate={reduce ? undefined : { y: [0, -8, 0] }}
      transition={reduce ? undefined : { duration, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.span>
  );
}

export function JoyLink({
  to,
  className = '',
  children,
}: {
  to: string;
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className="inline-flex"
      whileHover={reduce ? undefined : { y: -3, rotate: -2 }}
      whileTap={reduce ? undefined : { scale: 0.96, y: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
    >
      <Link to={to} className={className}>
        {children}
      </Link>
    </motion.span>
  );
}

const cardSpring = { type: 'spring' as const, stiffness: 280, damping: 20 };

/** Lift for every card: hover on pointer devices, a light press on touch. */
export function HoverCard({ children, className = '' }: { children: ReactNode; className?: string; key?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      whileHover={
        reduce
          ? undefined
          : { y: -8, scale: 1.015, boxShadow: '0 16px 32px rgba(42,44,137,0.12)' }
      }
      whileTap={reduce ? undefined : { y: -2, scale: 0.985 }}
      transition={cardSpring}
    >
      {children}
    </motion.div>
  );
}

export function ArchFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`arch-photo overflow-hidden border border-white bg-white shadow-[0_12px_28px_rgba(42,44,137,0.12)] ${className}`}
    >
      {children}
    </div>
  );
}

export function BlobFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`blob-photo overflow-hidden border border-white bg-white shadow-[0_12px_28px_rgba(42,44,137,0.12)] ${className}`}>
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
    <HoverCard className={`rounded-[28px] border bg-white p-6 shadow-[0_8px_24px_rgba(42,44,137,0.08)] ${border} ${className}`}>
      {children}
    </HoverCard>
  );
}
