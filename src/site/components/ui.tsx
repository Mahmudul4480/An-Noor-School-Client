import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import type { Stat } from '../content';

export function PageHero({
  kicker,
  title,
  titleBn,
  lede,
}: {
  kicker: string;
  title: string;
  titleBn?: string;
  lede: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-deep via-navy to-navy-soft text-white">
      <GeoBackdrop />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{kicker}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.12] sm:text-5xl">{title}</h1>
        {titleBn && (
          <p lang="bn" className="font-bn mt-3 text-xl text-cream sm:text-2xl">
            {titleBn}
          </p>
        )}
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">{lede}</p>
      </div>
      <div className="h-1.5 bg-gradient-to-r from-gold via-cream to-crest" />
    </section>
  );
}

export function GeoBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.18]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(245,197,24,0.55) 0 1px, transparent 1.5px), radial-gradient(circle at 70% 60%, rgba(254,237,175,0.4) 0 1px, transparent 1.5px)',
        backgroundSize: '28px 28px, 36px 36px',
      }}
    />
  );
}

export function SectionHeading({
  kicker,
  kickerBn,
  title,
  text,
  light = false,
}: {
  kicker: string;
  kickerBn?: string;
  title: string;
  text?: string;
  light?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${light ? 'text-gold' : 'text-navy-soft'}`}>
        {kicker}
        {kickerBn && (
          <span lang="bn" className="font-bn ml-2 normal-case tracking-normal text-crest">
            {kickerBn}
          </span>
        )}
      </p>
      <h2 className={`mt-2 text-3xl font-semibold leading-tight sm:text-4xl ${light ? 'text-white' : 'text-navy-deep'}`}>
        {title}
      </h2>
      {text && (
        <p className={`mt-3 text-base leading-relaxed ${light ? 'text-white/75' : 'text-ink/80'}`}>{text}</p>
      )}
    </div>
  );
}

export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function Ribbon({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-navy-deep shadow-sm">
      {children}
    </span>
  );
}

export function StatGrid({ items }: { items: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#fffaf0] to-cream px-4 py-5 shadow-[0_18px_40px_-24px_rgba(20,21,63,0.65)] ring-1 ring-navy/10"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold via-cream to-crest" />
          <dt className="text-xs font-medium uppercase tracking-wider text-navy/70">
            {item.label}
            <span lang="bn" className="font-bn mt-0.5 block normal-case tracking-normal text-crest">
              {item.bn}
            </span>
          </dt>
          <dd className="mt-3 font-semibold text-navy-deep">
            {item.value === null ? (
              <span className="block text-lg leading-snug text-navy/70">{item.pending}</span>
            ) : (
              <span className="block text-3xl sm:text-4xl">
                <CountUp value={item.value} />
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [current, setCurrent] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) {
      setCurrent(value);
      return;
    }
    const start = performance.now();
    const duration = 1100;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setCurrent(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduce, value]);

  const text = current >= 10000 ? current.toLocaleString('en-BD') : String(current);
  return <span ref={ref}>{text}</span>;
}

export function PlaceholderCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure className="overflow-hidden rounded-3xl bg-gradient-to-br from-navy-deep to-navy shadow-[0_20px_40px_-24px_rgba(20,21,63,0.8)] ring-1 ring-white/10">
      <div className="aspect-[4/3]">{children}</div>
      <figcaption className="space-y-1 px-4 py-4 text-white">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs leading-relaxed text-cream/80">{caption}</p>
      </figcaption>
    </figure>
  );
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 font-semibold text-navy underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export function CreamCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl bg-gradient-to-br from-[#fffaf0] via-[#fff8e8] to-cream p-6 shadow-[0_22px_50px_-28px_rgba(20,21,63,0.55)] ring-1 ring-navy/10 sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}
