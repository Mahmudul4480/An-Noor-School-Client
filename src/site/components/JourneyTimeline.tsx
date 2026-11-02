import { motion, useReducedMotion } from 'motion/react';
import { journey } from '../content';

/** A quiet vertical timeline. No tilt, no sticky stack. */
export function JourneyTimeline() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-white py-16 sm:py-24" aria-labelledby="journey-title">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="text-sm font-semibold text-navy">
          {journey.kicker}
          <span lang="bn" className="font-bn ml-2 font-medium text-navy-deep/70">
            {journey.kickerBn}
          </span>
        </p>
        <h2 id="journey-title" className="mt-3 text-3xl font-semibold tracking-tight text-navy-deep sm:text-4xl">
          {journey.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-navy-deep/85">{journey.lede}</p>
      </div>

      <ol className="relative mx-auto mt-14 max-w-3xl px-4 sm:px-6">
        <div className="absolute bottom-2 left-[7px] top-2 w-px bg-navy/15" aria-hidden="true" />
        {journey.milestones.map((step, index) => (
          <li key={step.no} className="relative pb-8 pl-10 last:pb-0">
            <span className="absolute left-0 top-6 h-[15px] w-[15px] rounded-full border-2 border-navy bg-white" aria-hidden="true" />
            <motion.article
              className="site-card p-6 sm:p-7"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              whileHover={reduce ? undefined : { y: -4, boxShadow: '0 10px 24px rgba(20,21,63,0.08)' }}
              whileTap={reduce ? undefined : { y: -1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold text-navy">{step.no}</p>
                <p className="text-sm font-medium text-navy-deep/70">{step.year}</p>
                {step.placeholder && (
                  <span className="rounded-full bg-sun px-2.5 py-1 text-sm font-semibold text-navy-deep">
                    To be written
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-xl text-navy-deep">{step.title}</h3>
              <p className="mt-2 max-w-prose text-base leading-relaxed text-navy-deep/85">{step.text}</p>
            </motion.article>
          </li>
        ))}
      </ol>
    </section>
  );
}
