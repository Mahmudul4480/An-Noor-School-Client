import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

type Floater = {
  id: string;
  className: string;
  duration: number;
  delay: number;
  mobile?: boolean;
  node: ReactNode;
};

const floaters: Floater[] = [
  { id: 'sun', className: 'left-[3%] top-[6%] h-12 w-12 sm:h-16 sm:w-16', duration: 7, delay: 0, node: <Sun /> },
  { id: 'cloud', className: 'right-[4%] top-[7%] h-10 w-16 sm:h-14 sm:w-24', duration: 8, delay: 0.4, node: <Cloud /> },
  { id: 'balloon', className: 'right-[3%] top-[34%] hidden h-20 w-12 md:block', duration: 6.5, delay: 0.2, node: <Balloon /> },
  { id: 'pencil', className: 'bottom-[8%] left-[2%] hidden h-16 w-7 sm:block', duration: 5.5, delay: 0.6, node: <Pencil /> },
  { id: 'book', className: 'bottom-[10%] left-[10%] hidden h-14 w-14 lg:block', duration: 6, delay: 0.8, node: <Book /> },
  { id: 'abc', className: 'left-[3%] top-[28%] hidden h-12 w-12 lg:block', duration: 5, delay: 0.3, node: <LetterBlock letters="ABC" /> },
  { id: 'bn', className: 'left-[3%] top-[48%] hidden h-12 w-12 xl:block', duration: 5.8, delay: 1, node: <LetterBlock letters="অআই" bangla /> },
  { id: 'ar', className: 'right-[14%] top-[8%] hidden h-12 w-14 xl:block', duration: 6.2, delay: 0.5, node: <LetterBlock letters="ابت" arabic /> },
];

export function HeroFloaters() {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      {floaters.map((item) => (
        <motion.div
          key={item.id}
          className={`absolute ${item.className}`}
          animate={reduce ? undefined : { y: [0, -12, 0] }}
          transition={
            reduce
              ? undefined
              : { duration: item.duration, delay: item.delay, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          {item.node}
        </motion.div>
      ))}
    </div>
  );
}

function Sun() {
  return (
    <svg viewBox="0 0 80 80" className="h-full w-full drop-shadow">
      <circle cx="40" cy="40" r="16" fill="#F5C518" />
      {Array.from({ length: 8 }).map((_, index) => (
        <rect
          key={index}
          x="37"
          y="6"
          width="6"
          height="12"
          rx="3"
          fill="#FEEDAF"
          transform={`rotate(${index * 45} 40 40)`}
        />
      ))}
    </svg>
  );
}

function Cloud() {
  return (
    <svg viewBox="0 0 120 70" className="h-full w-full">
      <ellipse cx="46" cy="42" rx="28" ry="18" fill="#fffaf0" opacity="0.92" />
      <ellipse cx="70" cy="36" rx="24" ry="16" fill="#fff" opacity="0.95" />
      <ellipse cx="88" cy="44" rx="18" ry="12" fill="#FEEDAF" />
    </svg>
  );
}

function Balloon() {
  return (
    <svg viewBox="0 0 70 120" className="h-full w-full">
      <ellipse cx="35" cy="36" rx="22" ry="28" fill="#1F8F4A" />
      <ellipse cx="28" cy="28" rx="6" ry="8" fill="#fff" opacity="0.35" />
      <path d="M35 64 C35 80 28 90 35 108" fill="none" stroke="#FEEDAF" strokeWidth="2" />
      <polygon points="31,64 39,64 35,72" fill="#F5C518" />
    </svg>
  );
}

function Pencil() {
  return (
    <svg viewBox="0 0 40 100" className="h-full w-full">
      <rect x="12" y="18" width="16" height="58" rx="2" fill="#F5C518" />
      <polygon points="12,76 28,76 20,96" fill="#FEEDAF" />
      <rect x="12" y="10" width="16" height="10" fill="#2A2C89" />
      <polygon points="12,10 28,10 20,2" fill="#1F8F4A" />
    </svg>
  );
}

function Book() {
  return (
    <svg viewBox="0 0 80 64" className="h-full w-full">
      <path d="M8 12 H40 V54 H12 Q8 54 8 48 Z" fill="#2A2C89" />
      <path d="M40 12 H72 V48 Q72 54 68 54 H40 Z" fill="#3F4190" />
      <path d="M40 12 V54" stroke="#F5C518" strokeWidth="3" />
      <path d="M16 24 H32 M16 32 H30" stroke="#FEEDAF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function LetterBlock({ letters, bangla, arabic }: { letters: string; bangla?: boolean; arabic?: boolean }) {
  return (
    <svg viewBox="0 0 72 72" className="h-full w-full">
      <rect x="6" y="8" width="58" height="54" rx="12" fill="#FEEDAF" />
      <rect x="10" y="12" width="50" height="46" rx="10" fill="#2A2C89" />
      <text
        x="35"
        y={arabic ? 44 : 46}
        textAnchor="middle"
        fill="#F5C518"
        fontSize={arabic ? 22 : bangla ? 16 : 18}
        fontFamily={arabic ? 'Amiri, serif' : bangla ? 'Anek Bangla, sans-serif' : 'Poppins, sans-serif'}
        fontWeight="700"
      >
        {letters}
      </text>
    </svg>
  );
}
