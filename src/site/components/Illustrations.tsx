import { useId } from 'react';
import type { PlaceholderKind } from '../content';

const star =
  '36,8 40.7,27.2 60,18.5 46.2,33.2 64,40 46.2,46.8 60,61.5 40.7,52.8 36,72 31.3,52.8 12,61.5 25.8,46.8 8,40 25.8,33.2 12,18.5 31.3,27.2';

export function Illustration({
  variant,
  title,
}: {
  variant: PlaceholderKind;
  title: string;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 640 480" role="img" aria-label={title} className="h-full w-full">
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14153F" />
          <stop offset="0.55" stopColor="#2A2C89" />
          <stop offset="1" stopColor="#3F4190" />
        </linearGradient>
        <pattern id={`${uid}-geo`} width="48" height="48" patternUnits="userSpaceOnUse">
          <polygon points="24,6 28,18 40,14 32,24 42,30 32,34 38,46 24,38 10,46 16,34 6,30 16,24 8,14 20,18" fill="#F5C518" opacity="0.18" />
        </pattern>
      </defs>
      <rect width="640" height="480" fill={`url(#${uid}-sky)`} />
      <rect width="640" height="480" fill={`url(#${uid}-geo)`} />
      <path d="M80 430 V250 Q320 40 560 250 V430 Z" fill="#FEEDAF" opacity="0.12" />
      <path d="M120 430 V270 Q320 90 520 270 V430" fill="none" stroke="#F5C518" strokeWidth="3" />
      {variant === 'lesson' && <LessonMotif />}
      {variant === 'hifz' && <HifzMotif />}
      {variant === 'play' && <PlayMotif />}
      {variant === 'arabic' && <ArabicMotif />}
      <polygon points={star} fill="#F5C518" transform="translate(520 48) scale(0.7)" />
    </svg>
  );
}

function LessonMotif() {
  return (
    <g>
      <rect x="210" y="250" width="220" height="150" rx="18" fill="#FEEDAF" />
      <path d="M230 320 H410 M230 348 H380 M230 376 H350" stroke="#2A2C89" strokeWidth="6" strokeLinecap="round" />
      <path d="M250 250 V210 H390 V250" fill="none" stroke="#1F8F4A" strokeWidth="8" />
      <circle cx="320" cy="196" r="10" fill="#F5C518" />
    </g>
  );
}

function HifzMotif() {
  return (
    <g>
      <rect x="220" y="230" width="200" height="160" rx="16" fill="#FEEDAF" />
      <rect x="236" y="246" width="168" height="128" rx="10" fill="#14153F" />
      <text
        x="320"
        y="328"
        textAnchor="middle"
        fill="#F5C518"
        fontFamily="Amiri, serif"
        fontSize="64"
      >
        حفظ
      </text>
    </g>
  );
}

function PlayMotif() {
  return (
    <g>
      <circle cx="250" cy="300" r="46" fill="#1F8F4A" />
      <circle cx="360" cy="280" r="62" fill="#FEEDAF" />
      <circle cx="450" cy="330" r="36" fill="#F5C518" />
      <path d="M180 390 H480" stroke="#FEEDAF" strokeWidth="8" strokeLinecap="round" />
      <path d="M300 180 L330 240 L270 240 Z" fill="#F5C518" />
    </g>
  );
}

function ArabicMotif() {
  return (
    <text
      x="320"
      y="340"
      textAnchor="middle"
      fill="#FEEDAF"
      fontFamily="Amiri, serif"
      fontSize="120"
    >
      ع
    </text>
  );
}

export function GeoPattern({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg aria-hidden="true" className={`pointer-events-none ${className}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={id} width="88" height="88" patternUnits="userSpaceOnUse">
          <polygon points="44,16 47,32 64,26 53,40 68,46 53,52 64,66 47,58 44,74 41,58 24,66 35,52 20,46 35,40 24,26 41,32" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
