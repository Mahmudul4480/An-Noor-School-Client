import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Facebook } from 'lucide-react';
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
      <SwayingFlower className="absolute -top-1 left-3 h-5 w-5 opacity-30 sm:left-8" />
      <SwayingFlower className="absolute -top-1 right-4 hidden h-5 w-5 opacity-30 md:block" delay={0.8} />
    </>
  );
}

export function Sticker({
  children,
  className = '',
  rotate = 0,
}: {
  children: ReactNode;
  className?: string;
  rotate?: number;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-sun px-3 py-1 text-sm font-semibold text-navy-deep ${className}`}
      style={rotate ? { rotate: `${rotate}deg` } : undefined}
    >
      {children}
    </span>
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
      whileHover={reduce ? undefined : { y: -2 }}
      whileTap={reduce ? undefined : { scale: 0.98, y: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
    >
      <Link to={to} className={className}>
        {children}
      </Link>
    </motion.span>
  );
}

/** Round Facebook button: a soft pulse ring, a small bob, and a wiggle on hover. */
export function FacebookButton({ href, label, className = '' }: { href: string; label: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-[0_8px_18px_rgba(24,119,242,0.45)] ${className}`}
      whileHover={reduce ? undefined : { scale: 1.15, rotate: [0, -12, 10, -6, 0] }}
      whileTap={reduce ? undefined : { scale: 0.92 }}
      transition={{ duration: 0.5 }}
    >
      {!reduce && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-[#7FB2FF]"
          animate={{ scale: [1, 1.65], opacity: [0.75, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <motion.span
        className="relative inline-flex"
        animate={reduce ? undefined : { y: [0, -2, 0] }}
        transition={reduce ? undefined : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Facebook size={20} aria-hidden="true" />
      </motion.span>
    </motion.a>
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
          : { y: -4, boxShadow: '0 10px 24px rgba(20,21,63,0.08)' }
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
      className={`arch-photo overflow-hidden border border-navy/10 bg-white shadow-[0_8px_24px_rgba(20,21,63,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

export function BlobFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`blob-photo overflow-hidden border border-navy/10 bg-white shadow-[0_8px_24px_rgba(20,21,63,0.06)] ${className}`}>
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
  const bar = {
    navy: 'bg-navy',
    leaf: 'bg-leaf',
    orange: 'bg-orange',
    sky: 'bg-sky',
    sun: 'bg-sun',
    coral: 'bg-coral',
  }[accent];
  return (
    <HoverCard className={`site-card ${className}`}>
      <div className={`h-1 ${bar}`} />
      <div className="p-6 sm:p-8">{children}</div>
    </HoverCard>
  );
}
