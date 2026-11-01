import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, BookOpen, GraduationCap, Languages, MoonStar } from 'lucide-react';
import {
  admission,
  classes,
  home,
  programs,
  seo,
  site,
  stats,
  values,
} from '../content';
import { Seo } from '../seo';
import { HeroSlideshow } from '../components/HeroSlideshow';
import { InquiryForm } from '../components/InquiryForm';
import { JourneyTimeline } from '../components/JourneyTimeline';
import { MomentsCarousel } from '../components/MomentsCarousel';
import { CreamCard, Lift, Reveal, Ribbon, SectionHeading, StatGrid } from '../components/ui';

const programIcons = {
  islamic: MoonStar,
  hifz: BookOpen,
  arabic: Languages,
  english: GraduationCap,
} as const;

export default function HomePage() {
  const reduce = useReducedMotion();
  const early = classes.filter((item) => item.stage === 'Early years');
  const primary = classes.filter((item) => item.stage === 'Primary');

  return (
    <>
      <Seo title={seo.home.title} description={seo.home.description} path={seo.home.path} />
      <section className="relative min-h-[88svh] overflow-hidden bg-navy text-white md:min-h-[78vh]">
        <HeroSlideshow />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/70 to-navy-deep/25 md:bg-gradient-to-r md:from-navy-deep/90 md:via-navy-deep/55 md:to-navy-deep/15" />
        <div className="relative z-10 mx-auto flex min-h-[88svh] max-w-6xl flex-col justify-end gap-10 px-4 pb-16 pt-28 sm:px-6 md:min-h-[78vh] md:justify-center md:py-24 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <motion.p
              lang="ar"
              dir="rtl"
              className="font-arabic text-2xl text-gold sm:text-3xl"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {site.bismillah}
            </motion.p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-cream">{home.kicker}</p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              An-Noor
              <span className="mt-1 block text-3xl font-medium text-cream sm:text-5xl">International School</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/90">{site.tagline}</p>
            <p lang="bn" className="font-bn mt-1 text-base text-cream/90">
              {site.taglineBn}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">{home.lede}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/admission"
                className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-navy-deep transition-colors hover:bg-cream"
              >
                {home.primaryCta} <span lang="bn" className="font-bn">/ {home.primaryCtaBn}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
              >
                {home.secondaryCta}
              </Link>
            </div>
          </div>
          <motion.blockquote
            className="relative rounded-2xl bg-white/95 p-6 text-navy-deep shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)] sm:p-8"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Ribbon>Session {site.sessionShort}</Ribbon>
            <p lang="ar" dir="rtl" className="font-arabic mt-4 text-4xl leading-relaxed sm:text-5xl">
              {site.verse.arabic}
            </p>
            <p className="mt-3 text-base font-medium">{site.verse.translation}</p>
            <footer className="mt-2 text-xs uppercase tracking-[0.18em] text-navy/60">{site.verse.source}</footer>
          </motion.blockquote>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-8 max-w-6xl px-4 sm:px-6">
        <StatGrid items={stats} />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <SectionHeading
            kicker={home.programsKicker}
            kickerBn={home.programsKickerBn}
            title={home.programsTitle}
            text={home.programsText}
          />
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {programs.map((program, index) => {
            const Icon = programIcons[program.id as keyof typeof programIcons];
            return (
              <div key={program.id}>
              <Reveal delay={index * 0.04}>
                <Lift className="h-full">
                <article className="h-full rounded-2xl bg-white p-6 shadow-[0_10px_30px_-18px_rgba(20,21,63,0.35)] ring-1 ring-navy/10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p lang="ar" dir="rtl" className="font-arabic text-2xl text-navy">
                        {program.titleAr}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold tracking-tight text-navy-deep">{program.title}</h3>
                      <p lang="bn" className="font-bn text-sm text-crest">
                        {program.titleBn}
                      </p>
                    </div>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-ink/75">{program.text}</p>
                </article>
                </Lift>
              </Reveal>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            kicker={home.pathKicker}
            kickerBn={home.pathKickerBn}
            title={home.pathTitle}
            text={home.pathText}
          />
          <ol className="mt-10 space-y-4">
            {early.map((item, index) => (
              <li key={item.id} className="grid gap-4 rounded-2xl bg-[#f7f6f2] p-5 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-xl font-semibold tracking-tight text-navy-deep">{item.name}</h3>
                    <span className="text-xs uppercase tracking-[0.16em] text-navy/45">{item.stage}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.sections.map((section) => (
                      <span key={section} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-navy ring-1 ring-navy/10">
                        {section}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/70">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {primary.map((item) => (
              <div key={item.id} className="rounded-2xl bg-[#f7f6f2] px-3 py-4 text-center">
                <p className="text-sm font-semibold text-navy-deep">{item.name}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-navy/45">Primary</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink/60">{home.pathFootnote}</p>
          <Link to="/academics" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy">
            See the classes <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <JourneyTimeline />

      <section className="py-10" aria-label={home.valuesTitle}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading kicker={home.valuesKicker} title={home.valuesTitle} />
        </div>
        <div className="mt-6 overflow-hidden">
          <p className="sr-only">{values.map((value) => `${value.en}, ${value.bn}`).join('. ')}</p>
          <div className="overflow-hidden" aria-hidden="true">
            <div className="site-marquee flex w-max gap-3 py-2">
              {[0, 1].map((copy) => (
                <div key={copy} className={copy === 1 ? 'site-marquee-copy flex gap-3 pr-3' : 'flex gap-3 pr-3'}>
                  {values.map((value) => (
                    <span
                      key={`${copy}-${value.en}`}
                      className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-navy shadow-sm ring-1 ring-navy/10"
                    >
                      <span lang="ar" className="font-arabic text-xl text-navy">
                        {value.ar}
                      </span>
                      <span className="text-sm font-semibold">{value.en}</span>
                      <span lang="bn" className="font-bn text-sm text-ink/60">
                        {value.bn}
                      </span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <SectionHeading kicker={home.momentsKicker} kickerBn={home.momentsKickerBn} title={home.momentsTitle} />
        <div className="mt-8">
          <MomentsCarousel />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <CreamCard className="grid items-center gap-8 lg:grid-cols-[240px_1fr]">
          <img
            src={site.principal.photo}
            alt={`Portrait of ${site.principal.name}, ${site.principal.title} of ${site.name}.`}
            width={site.principal.photoWidth}
            height={site.principal.photoHeight}
            className="mx-auto aspect-[3/4] w-full max-w-[240px] rounded-2xl object-cover object-top ring-1 ring-navy/10"
            loading="lazy"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-soft">{home.principalKicker}</p>
            <h2 className="mt-2 text-3xl font-semibold text-navy-deep">{home.principalTitle}</h2>
            <p className="mt-1 text-sm text-crest">{site.principal.title}</p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/80">{home.principalNote}</p>
            <Link to="/about" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy">
              About the school <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </CreamCard>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid overflow-hidden rounded-2xl bg-navy shadow-[0_18px_40px_-24px_rgba(20,21,63,0.45)] lg:grid-cols-2">
          <div className="bg-navy p-7 text-white sm:p-10">
            <div className="relative">
              <Ribbon>{home.admissionKicker}</Ribbon>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">{home.admissionTitle}</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">{home.admissionText}</p>
              <p className="mt-6 text-sm text-cream/80">{site.address.line}</p>
            </div>
          </div>
          <div className="bg-white p-7 sm:p-10">
            <h3 className="text-xl font-semibold text-navy-deep">{admission.formTitle}</h3>
            <div className="mt-4">
              <InquiryForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
