import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Megaphone } from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import type { Stat } from '../content';
import { Art, type ArtName } from '../art';
import { HoverCard, type SiteTone } from './kit';
import { SplitText } from './motion';

const toneBar: Record<SiteTone, string> = {
  navy: 'bg-navy',
  leaf: 'bg-leaf',
  orange: 'bg-orange',
  sky: 'bg-sky',
  sun: 'bg-sun',
  coral: 'bg-coral',
};

const bandWash: Record<SiteTone, string> = {
  navy: 'bg-gradient-to-br from-[#E7E9FF] via-white to-[#F7F8FF]',
  leaf: 'bg-gradient-to-br from-[#E5F6EC] via-white to-[#FFF8E4]',
  orange: 'bg-gradient-to-br from-[#FFF1E2] via-white to-[#FFF8DC]',
  sky: 'bg-gradient-to-br from-[#E7F5FE] via-white to-[#F7F8FF]',
  sun: 'bg-gradient-to-br from-[#FFF6D4] via-white to-white',
  coral: 'bg-gradient-to-br from-[#FFE8E4] via-white to-[#FFF8F6]',
};

const bandEdge: Record<SiteTone, string> = {
  navy: 'bg-gradient-to-r from-navy via-sky to-sun',
  leaf: 'bg-gradient-to-r from-leaf via-sun to-navy',
  orange: 'bg-gradient-to-r from-orange via-sun to-navy',
  sky: 'bg-gradient-to-r from-sky via-navy to-sun',
  sun: 'bg-gradient-to-r from-sun via-orange to-navy',
  coral: 'bg-gradient-to-r from-coral via-orange to-navy',
};

export function PageHero({
  kicker,
  title,
  titleBn,
  lede,
  tone = 'navy',
  art = 'star',
  band = false,
  ribbon = false,
}: {
  kicker: string;
  title: string;
  titleBn?: string;
  lede: string;
  tone?: SiteTone;
  art?: ArtName;
  /** Soft branded wash, icon badge, and a coloured kicker. Opt-in so other pages stay as they are. */
  band?: boolean;
  /** Amber gradient banner for the title and Bangla line. Implies `band`. */
  ribbon?: boolean;
}) {
  if (!band && !ribbon) {
    return (
      <section className="border-b border-navy/10 bg-white">
        <div className={`h-1 ${toneBar[tone]}`} />
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

  return (
    <section className={`relative overflow-hidden border-b border-navy/10 ${bandWash[tone]}`}>
      <div className={`h-1.5 ${bandEdge[tone]}`} />
      <div className="relative mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_8px_20px_rgba(42,44,137,0.12)]">
          <Art name={art} className="h-9 w-9" />
        </span>
        <p className="mt-4 inline-flex rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-navy shadow-sm">
          {kicker}
        </p>
        {ribbon ? (
          <div className="mt-5 rounded-[28px] bg-gradient-to-r from-navy via-sun to-orange p-[3px] shadow-[0_16px_36px_rgba(247,147,30,0.28)]">
            <div className="flex items-start gap-4 rounded-[25px] bg-gradient-to-br from-[#FFE9A8] via-[#FFC928] to-[#FFB347] px-4 py-5 sm:px-7 sm:py-6">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-sun shadow-[0_8px_16px_rgba(20,21,63,0.25)]">
                <Megaphone size={22} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h1 className="text-3xl text-navy-deep sm:text-5xl">{title}</h1>
                {titleBn && (
                  <p lang="bn" className="font-bn mt-2 text-2xl font-bold leading-snug text-navy-deep sm:text-3xl">
                    {titleBn}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1 className="mt-4 max-w-3xl text-4xl text-navy-deep sm:text-5xl">{title}</h1>
            {titleBn && (
              <p lang="bn" className="font-bn mt-3 inline-flex max-w-full rounded-full bg-white/90 px-3 py-1 text-lg font-semibold text-navy shadow-sm">
                {titleBn}
              </p>
            )}
          </>
        )}
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-navy-deep/85 sm:text-lg">{lede}</p>
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
        <SplitText text={title} />
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
