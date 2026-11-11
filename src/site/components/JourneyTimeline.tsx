import { motion, useReducedMotion } from 'motion/react';
import { journey } from '../content';

/** A quiet vertical timeline. No tilt, no sticky stack. */
export function JourneyTimeline() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-gradient-to-b from-[#E9EBFF] via-white to-[#FFF6D6] py-16 sm:py-24" aria-labelledby="journey-title">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy">
          {journey.kicker}
          <span lang="bn" className="font-bn ml-2 normal-case tracking-normal text-crest">
            {journey.kickerBn}
          </span>
        </p>
        <h2 id="journey-title" className="mt-3 text-3xl font-semibold tracking-tight text-navy-deep sm:text-4xl">
          {journey.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink/70 sm:text-base">{journey.lede}</p>
      </div>

      <ol className="relative mx-auto mt-14 max-w-3xl px-4 sm:px-6">
        <div className="absolute bottom-2 left-[6px] top-2 w-[3px] rounded-full bg-gradient-to-b from-sun via-orange to-leaf" aria-hidden="true" />
        {journey.milestones.map((step, index) => (
          <li key={step.no} className="relative pb-8 pl-10 last:pb-0">
            <span className="absolute left-0 top-6 h-[15px] w-[15px] rounded-full border-[3px] border-navy bg-sun shadow-[0_0_0_4px_rgba(255,201,40,0.35)]" aria-hidden="true" />
            <motion.article
              className="rounded-2xl border-t-4 border-sun bg-gradient-to-br from-white to-[#E6E8FF] p-6 shadow-[0_14px_32px_-18px_rgba(42,44,137,0.55)] ring-1 ring-navy/15 sm:p-7"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              whileHover={reduce ? undefined : { y: -8, scale: 1.02, boxShadow: '0 18px 36px rgba(42,44,137,0.28)' }}
              whileTap={reduce ? undefined : { scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <p className="rounded-full bg-gradient-to-br from-navy to-navy-deep px-2.5 py-1 text-xs font-bold tracking-[0.16em] text-sun">{step.no}</p>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy">{step.year}</p>
                {step.placeholder && (
                  <span className="rounded-full bg-sun/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-navy-deep">
                    To be written
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-navy">{step.title}</h3>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink/70">{step.text}</p>
            </motion.article>
          </li>
        ))}
      </ol>
    </section>
  );
}
