import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, BookOpen, GraduationCap, Languages, MoonStar } from 'lucide-react';
import {
  admission,
  classes,
  home,
  photos,
  programs,
  seo,
  site,
  stats,
  values,
} from '../content';
import { Seo } from '../seo';
import { HeroFloaters } from '../components/HeroFloaters';
import { InquiryForm } from '../components/InquiryForm';
import { JourneyTimeline } from '../components/JourneyTimeline';
import { MomentsCarousel } from '../components/MomentsCarousel';
import { Bounce, CreamCard, Reveal, Ribbon, SectionHeading, StatGrid, Wiggle } from '../components/ui';

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
      <section className="relative overflow-hidden bg-navy-deep text-white">
        <img
          src={photos.hero.src}
          alt={photos.hero.alt}
          width={photos.hero.width}
          height={photos.hero.height}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/95 via-navy/82 to-navy-deep/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f6f1e4] via-transparent to-navy-deep/30" />
        <HeroFloaters />
        <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-24">
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
            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.08] sm:text-6xl">
              An-Noor
              <span className="mt-1 block text-3xl font-medium text-cream sm:text-5xl">International School</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/90">{site.tagline}</p>
            <p lang="bn" className="font-bn mt-1 text-base text-cream/90">
              {site.taglineBn}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">{home.lede}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Bounce>
                <Link
                  to="/admission"
                  className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-bold text-navy-deep shadow-lg shadow-black/20"
                >
                  {home.primaryCta} <span lang="bn" className="font-bn">/ {home.primaryCtaBn}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </Bounce>
              <Bounce>
                <Link
                  to="/about"
                  className="inline-flex items-center rounded-full border border-white/35 px-5 py-3 text-sm font-semibold text-white hover:border-gold hover:text-gold"
                >
                  {home.secondaryCta}
                </Link>
              </Bounce>
            </div>
          </div>
          <motion.blockquote
            className="relative rounded-[2rem] bg-gradient-to-br from-cream to-[#fff4c4] p-6 text-navy-deep shadow-[0_24px_50px_-24px_rgba(0,0,0,0.55)] sm:p-8"
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
              <Reveal delay={index * 0.06}>
                <Bounce className="h-full">
                <article className="h-full rounded-3xl bg-gradient-to-br from-[#fffaf0] to-cream p-6 shadow-[0_18px_40px_-28px_rgba(20,21,63,0.7)] ring-1 ring-navy/10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p lang="ar" dir="rtl" className="font-arabic text-2xl text-navy">
                        {program.titleAr}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold text-navy-deep">{program.title}</h3>
                      <p lang="bn" className="font-bn text-sm text-crest">
                        {program.titleBn}
                      </p>
                    </div>
                    <Wiggle className="h-11 w-11 items-center justify-center rounded-2xl bg-navy text-gold">
                      <Icon size={20} aria-hidden="true" />
                    </Wiggle>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-ink/80">{program.text}</p>
                </article>
                </Bounce>
              </Reveal>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-navy-deep via-navy to-navy-soft py-16 text-white sm:py-20">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            light
            kicker={home.pathKicker}
            kickerBn={home.pathKickerBn}
            title={home.pathTitle}
            text={home.pathText}
          />
          <ol className="mt-10 space-y-4">
            {early.map((item, index) => (
              <li key={item.id} className="grid gap-4 rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy-deep">
                  {index + 1}
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-xl font-semibold">{item.name}</h3>
                    <span className="text-xs uppercase tracking-[0.16em] text-cream/70">{item.stage}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.sections.map((section) => (
                      <span key={section} className="rounded-full bg-cream/15 px-3 py-1 text-xs font-medium text-cream">
                        {section}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/75">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {primary.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white/10 px-3 py-4 text-center ring-1 ring-white/15">
                <p className="text-sm font-semibold text-gold">{item.name}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-cream/70">Primary</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-cream/70">{home.pathFootnote}</p>
          <Link to="/academics" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold">
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
                      className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-navy to-navy-soft px-5 py-3 text-white shadow-md"
                    >
                      <span lang="ar" className="font-arabic text-xl text-gold">
                        {value.ar}
                      </span>
                      <span className="text-sm font-semibold">{value.en}</span>
                      <span lang="bn" className="font-bn text-sm text-cream">
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
            className="mx-auto aspect-[3/4] w-full max-w-[240px] rounded-[1.6rem] object-cover object-top shadow-lg ring-1 ring-navy/10"
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
        <div className="grid overflow-hidden rounded-[2rem] bg-navy-deep shadow-[0_30px_60px_-36px_rgba(20,21,63,0.85)] lg:grid-cols-2">
          <div className="relative bg-gradient-to-br from-navy-deep to-navy-soft p-7 text-white sm:p-10">
            <div className="relative">
              <Ribbon>{home.admissionKicker}</Ribbon>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">{home.admissionTitle}</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">{home.admissionText}</p>
              <p className="mt-6 text-sm text-cream/80">{site.address.line}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#fffaf0] to-cream p-7 sm:p-10">
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
