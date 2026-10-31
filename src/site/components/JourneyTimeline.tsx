import { useEffect, useRef } from 'react';
import { journey } from '../content';

/**
 * Numbered sticky cards with a scroll-scrubbed tilt, adapted from the
 * portfolio Experience section (data-exp-card + GSAP ScrollTrigger, scrub).
 * A gold line draws down the stack on the same scroll. Desktop only;
 * phones and reduced-motion get a quiet static list.
 */
export function JourneyTimeline() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktop = window.matchMedia('(min-width: 768px)');
    const line = root.querySelector<HTMLElement>('[data-journey-line]');

    if (reduce) {
      if (line) line.style.transform = 'scaleY(1)';
      return;
    }
    if (!desktop.matches) return;

    let revert: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled || !rootRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        const stack = root.querySelector<HTMLElement>('[data-journey-stack]');
        if (line && stack) {
          gsap.set(line, { scaleY: 0, transformOrigin: 'top center' });
          gsap.to(line, {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: stack,
              start: 'top 75%',
              end: 'bottom 55%',
              scrub: true,
            },
          });
        }

        root.querySelectorAll<HTMLElement>('[data-exp-card]').forEach((card, index) => {
          const rot = index % 2 === 0 ? -2.2 : 2.4;
          gsap.fromTo(
            card,
            { y: 90, rotate: rot * 3 },
            {
              y: 0,
              rotate: rot,
              ease: 'none',
              scrollTrigger: {
                trigger: card,
                start: 'top 92%',
                end: 'top 46%',
                scrub: true,
              },
            },
          );
        });
      }, root);

      revert = () => ctx.revert();
      requestAnimationFrame(() => ScrollTrigger.refresh());
    })();

    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return (
    <section className="h-exp" ref={rootRef} aria-labelledby="journey-title">
      <div className="h-exp-head">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-navy-soft">
          {journey.kicker}
          <span lang="bn" className="font-bn ml-2 normal-case tracking-normal text-crest">
            {journey.kickerBn}
          </span>
        </p>
        <h2 id="journey-title" className="mt-2 text-3xl font-semibold text-navy-deep sm:text-5xl">
          {journey.title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink/75 sm:text-base">{journey.lede}</p>
      </div>
      <div className="h-exp-stack" data-journey-stack>
        <div className="h-exp-line" data-journey-line aria-hidden="true" />
        {journey.milestones.map((step) => (
          <article key={step.no} className="h-exp-card" data-exp-card>
            <div className="flex flex-wrap items-center gap-3">
              <p className="h-exp-no">{step.no}</p>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-crest">{step.year}</p>
              {step.placeholder && (
                <span className="rounded-full bg-navy/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-navy">
                  To be written
                </span>
              )}
            </div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
