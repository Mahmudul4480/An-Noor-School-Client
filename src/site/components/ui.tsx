import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import type { Stat } from '../content';
import { Art, DriftingButterfly, type ArtName } from '../art';
import { HoverCard, toneClass, Wave, type SiteTone } from './kit';

export function PageHero({
  kicker,
  title,
  titleBn,
  lede,
  tone = 'navy',
  art = 'star',
}: {
  kicker: string;
  title: string;
  titleBn?: string;
  lede: string;
  tone?: SiteTone;
  art?: ArtName;
}) {
  const theme = toneClass[tone];
  const titleOnCoral = tone === 'coral' ? 'text-white' : theme.text;
  return (
    <section className={`relative overflow-hidden ${theme.bg} ${theme.text}`}>
      <div className="relative mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 py-12 sm:px-6 sm:py-16">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${theme.lede}`}>{kicker}</p>
          <h1 className={`mt-2 max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-5xl ${titleOnCoral}`}>{title}</h1>
          {titleBn && (
            <p lang="bn" className={`font-bn mt-2 text-xl sm:text-2xl ${theme.lede}`}>
              {titleBn}
            </p>
          )}
          <p className={`mt-4 max-w-2xl text-base leading-relaxed sm:text-lg ${theme.lede}`}>{lede}</p>
        </div>
        <Art name={art} className="hidden h-20 w-20 shrink-0 sm:inline-flex" />
        <DriftingButterfly className="absolute right-8 top-6 hidden h-12 w-12 md:inline-block" duration={17} />
      </div>
      <Wave fill={theme.wave} flowers />
    </section>
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
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-24px' }}
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

export function Lift({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function StatGrid({ items }: { items: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.id}>
        <Lift className="relative h-full overflow-hidden rounded-2xl bg-white px-4 py-5 shadow-[0_10px_30px_-18px_rgba(20,21,63,0.35)] ring-1 ring-navy/10">
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
        </Lift>
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

export function PlaceholderCard({ title, caption }: { title: string; caption: string }) {
  return (
    <HoverCard>
    <figure className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_-18px_rgba(20,21,63,0.35)] ring-1 ring-navy/10">
      <div className="flex aspect-[4/3] items-end bg-gradient-to-br from-[#e8e7f0] via-[#f6f4ee] to-[#d5d8e4] p-5">
        <p className="text-sm font-medium text-navy/75">{title}</p>
      </div>
      <figcaption className="px-4 py-3 text-xs leading-relaxed text-ink/60">{caption}</figcaption>
    </figure>
    </HoverCard>
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
    <HoverCard
      className={`rounded-2xl bg-white p-6 shadow-[0_10px_30px_-18px_rgba(20,21,63,0.35)] ring-1 ring-navy/10 sm:p-8 ${className}`}
    >
      {children}
    </HoverCard>
  );
}
