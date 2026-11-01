import type { ReactElement, ReactNode } from 'react';

/**
 * Flat object illustrations for the public site.
 * Two or three tones, rounded caps, a shared 3px stroke. No faces.
 */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 3,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export type ArtName =
  | 'crescent'
  | 'star'
  | 'book'
  | 'pencil'
  | 'lantern'
  | 'rainbow'
  | 'balloon'
  | 'planet'
  | 'quran'
  | 'cloud';

export function Art({ name, className = 'h-12 w-12 text-navy' }: { name: ArtName; className?: string }) {
  const Icon = icons[name];
  return (
    <span aria-hidden="true" className={`inline-flex ${className}`}>
      <Icon />
    </span>
  );
}

const icons: Record<ArtName, () => ReactElement> = {
  crescent: Crescent,
  star: Star,
  book: Book,
  pencil: Pencil,
  lantern: Lantern,
  rainbow: Rainbow,
  balloon: Balloon,
  planet: Planet,
  quran: QuranStand,
  cloud: Cloud,
};

function Frame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
      {children}
    </svg>
  );
}

function Crescent() {
  return (
    <Frame>
      <path d="M36 10a20 20 0 1 0 0 44 16 16 0 1 1 0-44Z" fill="#FFC928" />
      <path d="M36 10a20 20 0 1 0 0 44 16 16 0 1 1 0-44Z" {...stroke} stroke="#2A2C89" />
    </Frame>
  );
}

function Star() {
  return (
    <Frame>
      <path
        d="M32 8l5.2 14.2L52 24.2 41.2 33l3.6 15L32 40.8 19.2 48l3.6-15L12 24.2l14.8-2Z"
        fill="#FFC928"
        stroke="#2A2C89"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </Frame>
  );
}

function Book() {
  return (
    <Frame>
      <path d="M12 16h18v34H16a4 4 0 0 1-4-4V16Z" fill="#5CB8F5" stroke="#2A2C89" strokeWidth="3" strokeLinejoin="round" />
      <path d="M34 16h18v30a4 4 0 0 1-4 4H34V16Z" fill="#FFF7E3" stroke="#2A2C89" strokeWidth="3" strokeLinejoin="round" />
      <path d="M34 16v34" stroke="#2A2C89" strokeWidth="3" />
    </Frame>
  );
}

function Pencil() {
  return (
    <Frame>
      <path d="M22 10h12v32H22Z" fill="#FFC928" stroke="#2A2C89" strokeWidth="3" strokeLinejoin="round" />
      <path d="M22 42h12l-6 12-6-12Z" fill="#F7931E" stroke="#2A2C89" strokeWidth="3" strokeLinejoin="round" />
      <path d="M22 10h12l-6-4-6 4Z" fill="#1F8F4A" stroke="#2A2C89" strokeWidth="3" strokeLinejoin="round" />
    </Frame>
  );
}

function Lantern() {
  return (
    <Frame>
      <path d="M26 8h12" {...stroke} stroke="#2A2C89" />
      <path d="M32 8v6" {...stroke} stroke="#2A2C89" />
      <path d="M20 18h24l-3 28H23L20 18Z" fill="#FFC928" stroke="#2A2C89" strokeWidth="3" strokeLinejoin="round" />
      <path d="M24 32h16" {...stroke} stroke="#2A2C89" />
      <path d="M26 46h12l-2 8h-8l-2-8Z" fill="#F7931E" stroke="#2A2C89" strokeWidth="3" strokeLinejoin="round" />
    </Frame>
  );
}

function Rainbow() {
  return (
    <Frame>
      <path d="M10 44a22 22 0 0 1 44 0" {...stroke} stroke="#F0443A" />
      <path d="M16 44a16 16 0 0 1 32 0" {...stroke} stroke="#FFC928" />
      <path d="M22 44a10 10 0 0 1 20 0" {...stroke} stroke="#1F8F4A" />
    </Frame>
  );
}

function Balloon() {
  return (
    <Frame>
      <ellipse cx="32" cy="24" rx="14" ry="16" fill="#5CB8F5" stroke="#2A2C89" strokeWidth="3" />
      <path d="M32 40c0 6-4 8-2 14" {...stroke} stroke="#2A2C89" />
      <path d="M28 40h8l-4 4-4-4Z" fill="#FFC928" stroke="#2A2C89" strokeWidth="3" strokeLinejoin="round" />
    </Frame>
  );
}

function Planet() {
  return (
    <Frame>
      <circle cx="32" cy="32" r="12" fill="#5CB8F5" stroke="#2A2C89" strokeWidth="3" />
      <ellipse cx="32" cy="32" rx="22" ry="8" transform="rotate(-20 32 32)" {...stroke} stroke="#FFC928" />
    </Frame>
  );
}

function QuranStand() {
  return (
    <Frame>
      <path d="M12 46h40" {...stroke} stroke="#2A2C89" />
      <path d="M20 46 32 18l12 28" {...stroke} stroke="#2A2C89" />
      <path d="M18 28h28" fill="#FFF7E3" stroke="#2A2C89" strokeWidth="3" strokeLinejoin="round" />
      <path d="M24 28 32 18l8 10" fill="#1F8F4A" stroke="#2A2C89" strokeWidth="3" strokeLinejoin="round" />
    </Frame>
  );
}

function Cloud() {
  return (
    <Frame>
      <path
        d="M18 42h28a10 10 0 0 0 2-20 12 12 0 0 0-23-3 8 8 0 0 0-7 23Z"
        fill="#FFF7E3"
        stroke="#2A2C89"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </Frame>
  );
}
