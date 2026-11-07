import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import type { Stat } from '../content';
import { Art, type ArtName } from '../art';
import { HoverCard, type SiteTone } from './kit';

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
  const accent = {
    navy: 'bg-navy',
    leaf: 'bg-leaf',
    orange: 'bg-orange',
    sky: 'bg-sky',
    sun: 'bg-sun',
    coral: 'bg-coral',
  }[tone];
  return (
    <section className="border-b border-navy/10 bg-white">
      <div className={`h-1 ${accent}`} />
      <div className="relative mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-sm font-semibold text-navy">{kicker}</p>
        <h1 className="mt-3 max-w-3xl text-4xl text-navy-deep sm:text-5xl">{title}</h1>
        {titleBn && (
          <p lang="bn" className="font-bn mt-2 text-lg text-navy">
            {titleBn}
          </p>
        )}
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-deep/85 sm:text-lg">{lede}</p>
        <Art name={art} className="absolute right-8 top-16 hidden h-12 w-12 opacity-30 lg:inline-flex" />
      </div>
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
      <p className={`text-sm font-semibold ${light ? 'text-gold' : 'text-navy'}`}>
        {kicker}
        {kickerBn && (
          <span lang="bn" className="font-bn ml-2 font-medium text-navy-deep/70">
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
    <span className="inline-flex items-center gap-2 rounded-full bg-sun px-3 py-1 text-sm font-semibold text-navy-deep">
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
        <Lift className="site-card relative h-full px-5 py-6">
          <dt className="text-sm font-semibold text-navy">
            {item.label}
            <span lang="bn" className="font-bn mt-0.5 block font-medium text-navy-deep/70">
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
    <figure className="site-card">
      <div className="flex aspect-[4/3] items-end bg-[#eef1f6] p-5">
        <p className="text-base font-medium text-navy">{title}</p>
      </div>
      <figcaption className="px-4 py-3 text-sm leading-relaxed text-navy-deep/70">{caption}</figcaption>
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
      className={`site-card p-6 sm:p-8 ${className}`}
    >
      {children}
    </HoverCard>
  );
}
