import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Art, DriftingButterfly, SwayingFlower, type ArtName } from '../art';
import {
  admission,
  classes,
  dayAtSchool,
  home,
  noticesPage,
  photos,
  programs,
  seo,
  site,
  stats,
} from '../content';
import { Seo } from '../seo';
import { InquiryForm } from '../components/InquiryForm';
import { MomentsCarousel } from '../components/MomentsCarousel';
import { useReducedMotion, motion } from 'motion/react';
import { ArchFrame, HoverCard, JoyLink, SoftCard, Sticker } from '../components/kit';
import { Reveal } from '../components/ui';

const programArt: Record<string, { art: ArtName; tone: string }> = {
  islamic: { art: 'crescent', tone: 'bg-sun' },
  hifz: { art: 'quran', tone: 'bg-[#e7f6ee]' },
  arabic: { art: 'book', tone: 'bg-sky/25' },
  english: { art: 'pencil', tone: 'bg-orange/20' },
};

export default function HomePage() {
  const reduce = useReducedMotion();
  return (
    <>
      <Seo title={seo.home.title} description={seo.home.description} path={seo.home.path} />
      <section className="relative overflow-hidden bg-white">
        <Decorations />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div>
            <p lang="ar" dir="rtl" className="font-arabic w-fit text-3xl leading-relaxed text-navy">
              {site.bismillah}
            </p>
            <div className="mt-5">
              <Sticker>{site.sessionLabel}</Sticker>
            </div>
            <h1 className="mt-5 max-w-xl text-4xl text-navy-deep sm:text-6xl">{site.name}</h1>
            <p className="mt-4 max-w-lg text-lg font-semibold text-navy">{site.tagline}</p>
            <p lang="bn" className="font-bn mt-1 text-base text-navy">
              {site.taglineBn}
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-navy-deep/85">{home.lede}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <JoyLink
                to="/admission"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-orange px-5 py-3 text-base font-semibold text-navy-deep"
              >
                {home.primaryCta} <span lang="bn" className="font-bn">/ {home.primaryCtaBn}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </JoyLink>
              <JoyLink
                to="/about"
                className="inline-flex min-h-11 items-center rounded-full border border-navy/15 bg-white px-5 py-3 text-base font-semibold text-navy"
              >
                {home.secondaryCta}
              </JoyLink>
            </div>
          </div>
          <ArchFrame className="relative w-full">
            <motion.img
              src={photos.hero.src}
              srcSet="/site/hero-800.webp 960w, /site/hero.webp 1920w"
              sizes="(max-width: 1024px) 100vw, 560px"
              alt={photos.hero.alt}
              width={photos.hero.width}
              height={photos.hero.height}
              fetchPriority="high"
              decoding="async"
              className="aspect-[16/10] w-full origin-center object-cover"
              animate={reduce ? undefined : { scale: [1, 1.03] }}
              transition={reduce ? undefined : { duration: 28, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            />
          </ArchFrame>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((item, index) => (
            <li key={item.id}>
              <Reveal delay={index * 0.04}>
                <HoverCard className="site-card flex min-h-36 flex-col items-center justify-center px-4 py-8 text-center">
                  <p className={item.value === null ? 'text-xl font-semibold leading-snug text-navy sm:text-2xl' : 'text-3xl font-semibold text-navy sm:text-4xl'}>
                    {item.value === null ? item.pending : item.value}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-navy-deep">{item.label}</p>
                  <p lang="bn" className="font-bn text-sm text-navy">{item.bn}</p>
                </HoverCard>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6 sm:pb-20">
        <Reveal>
          <h2 className="text-3xl text-navy-deep sm:text-4xl">{home.programsTitle}</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy-deep/85">{home.programsText}</p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {programs.map((program) => {
            const look = programArt[program.id] ?? programArt.english;
            return (
              <HoverCard key={program.id} className="site-card h-full p-6 sm:p-8">
                <div className={`mb-4 inline-flex rounded-2xl p-2 ${look.tone}`}>
                  <Art name={look.art} className="h-10 w-10 text-navy" />
                </div>
                <p lang="ar" dir="rtl" className="font-arabic w-fit text-xl leading-relaxed text-navy">{program.titleAr}</p>
                <h3 className="mt-1 text-xl text-navy-deep">{program.title}</h3>
                <p lang="bn" className="font-bn text-sm font-semibold text-navy">{program.titleBn}</p>
                <p className="mt-3 text-base leading-relaxed text-navy-deep/85">{program.text}</p>
              </HoverCard>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <h2 className="text-3xl text-navy-deep sm:text-4xl">{home.pathTitle}</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy-deep/85">{home.pathText}</p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((item, index) => (
              <li key={item.id}>
                <HoverCard className="site-card h-full px-5 py-5 text-navy-deep">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-semibold text-navy">{String(index + 1).padStart(2, '0')}</span>
                    <h3 className="text-xl">{item.name}</h3>
                  </div>
                  {item.sections.length > 0 && (
                    <p className="mt-2 text-sm font-semibold text-navy">{item.sections.join(' · ')}</p>
                  )}
                  <p className="mt-2 text-base leading-relaxed text-navy-deep/85">{item.text}</p>
                </HoverCard>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-navy-deep/70">{home.pathFootnote}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
        <Sticker>Placeholder</Sticker>
        <h2 className="mt-4 text-3xl text-navy-deep">{dayAtSchool.title}</h2>
        <p lang="bn" className="font-bn text-lg font-semibold text-navy">{dayAtSchool.kickerBn}</p>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-navy-deep/85">{dayAtSchool.note}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dayAtSchool.steps.map((step, index) => (
            <HoverCard key={step.label} className="site-card p-5">
              <p className="text-sm font-semibold text-navy">0{index + 1}</p>
              <h3 className="mt-1 text-lg text-navy-deep">{step.label}</h3>
              <p className="mt-2 text-base leading-relaxed text-navy-deep/80">{step.text}</p>
            </HoverCard>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <h2 className="text-3xl text-navy-deep">{home.momentsTitle}</h2>
          <p lang="bn" className="font-bn text-lg font-semibold text-navy">{home.momentsKickerBn}</p>
          <div className="mt-8">
            <MomentsCarousel />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[220px_1fr]">
        <img
          src={site.principal.photo}
          alt={`Portrait of ${site.principal.name}, ${site.principal.title}.`}
          width={site.principal.photoWidth}
          height={site.principal.photoHeight}
          className="mx-auto aspect-[3/4] w-52 rounded-[28px] border border-navy/10 object-cover object-top shadow-[0_8px_24px_rgba(20,21,63,0.06)]"
          loading="lazy"
        />
        <div>
          <p className="text-sm font-semibold text-navy">{home.principalKicker}</p>
          <h2 className="mt-2 text-3xl text-navy-deep">{home.principalTitle}</h2>
          <p className="text-base font-semibold text-navy">{site.principal.title}</p>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-navy-deep/85">{home.principalNote}</p>
        </div>
      </section>

      <section className="border-y border-navy/10 bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl text-navy-deep">{home.admissionTitle}</h2>
            <p className="mt-3 text-base leading-relaxed text-navy-deep/85">{home.admissionText}</p>
            <ol className="mt-8 space-y-4">
              {admission.steps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange text-base font-semibold text-navy-deep">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg text-navy-deep">{step.title}</h3>
                    <p className="text-base leading-relaxed text-navy-deep/80">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <SoftCard accent="orange">
            <h3 className="text-2xl text-navy-deep">{admission.formTitle}</h3>
            <div className="mt-3">
              <InquiryForm />
            </div>
          </SoftCard>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-3xl text-navy-deep">{noticesPage.title}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {noticesPage.notices.map((notice) => (
            <HoverCard key={notice.id} className="site-card">
              <div className="border-l-4 border-sun p-6">
              <p className="text-sm font-semibold text-navy">{notice.date}</p>
              <h3 className="mt-1 text-xl text-navy-deep">{notice.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-navy-deep/85">{notice.body}</p>
              {notice.href && (
                <Link to={notice.href} className="mt-3 inline-flex min-h-11 items-center font-semibold text-navy">
                  Admission details
                </Link>
              )}
              </div>
            </HoverCard>
          ))}
          <HoverCard className="site-card p-6">
            <h3 className="text-xl text-navy-deep">{noticesPage.eventsTitle}</h3>
            <p className="mt-2 text-base leading-relaxed text-navy-deep/85">{noticesPage.eventsNote}</p>
          </HoverCard>
        </div>
      </section>
    </>
  );
}

function Decorations() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <SwayingFlower className="absolute bottom-12 left-4 hidden h-8 w-8 opacity-40 lg:block" />
      <DriftingButterfly className="absolute right-6 top-10 hidden opacity-45 lg:inline-block" duration={28} size="h-8 w-8" />
    </div>
  );
}
