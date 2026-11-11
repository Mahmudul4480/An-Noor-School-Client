import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Art, type ArtName } from '../art';
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
import { BlobFrame, HoverCard, JoyLink, SoftCard, Sticker } from '../components/kit';
import { ImageReveal, ParallaxPhoto, SplitText } from '../components/motion';
import { Reveal } from '../components/ui';

const heroEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const programArt: Record<string, { art: ArtName; tone: string; border: string; wash: string }> = {
  islamic: { art: 'crescent', tone: 'bg-sun', border: 'border-sun', wash: 'from-[#FFF3C4]' },
  hifz: { art: 'quran', tone: 'bg-[#cdeedb]', border: 'border-leaf', wash: 'from-[#DDF3E6]' },
  arabic: { art: 'book', tone: 'bg-sky/40', border: 'border-sky', wash: 'from-[#DCEFFD]' },
  english: { art: 'pencil', tone: 'bg-orange/25', border: 'border-orange', wash: 'from-[#FFE6C7]' },
};
export default function HomePage() {
  const reduce = useReducedMotion();
  return (
    <>
      <Seo title={seo.home.title} description={seo.home.description} path={seo.home.path} />
      <section className="relative overflow-hidden bg-white">
        <div className="relative">
          <ParallaxPhoto>
            <motion.img
              src={photos.hero.src}
              srcSet="/site/hero-800.webp 960w, /site/hero.webp 1920w"
              sizes="100vw"
              alt={photos.hero.alt}
              width={photos.hero.width}
              height={photos.hero.height}
              fetchPriority="high"
              decoding="async"
              className="block h-auto w-full origin-center lg:max-h-[calc(100vh-11rem)] lg:object-cover lg:object-[center_40%]"
              initial={reduce ? false : { scale: 1.12 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.8, ease: heroEase }}
            />
          </ParallaxPhoto>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent sm:h-28"
          />
        </div>
        <div className="relative mx-auto -mt-6 max-w-[1100px] px-4 pb-10 sm:-mt-16 sm:px-6 lg:-mt-24">
          <motion.div
            className="rounded-[32px] border border-navy/10 bg-white/95 p-6 shadow-[0_24px_60px_rgba(20,21,63,0.18)] backdrop-blur sm:p-10 lg:grid lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:gap-10"
            initial={reduce ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: heroEase }}
          >
            <div className="mb-6 flex items-center justify-center gap-4 lg:col-span-2">
              <span aria-hidden="true" className="hidden h-px flex-1 bg-gradient-to-r from-transparent to-sun sm:block" />
              <p lang="ar" dir="rtl" className="font-bismillah text-center text-3xl text-navy sm:text-4xl lg:text-5xl">
                {site.bismillahPlain}
              </p>
              <span aria-hidden="true" className="hidden h-px flex-1 bg-gradient-to-l from-transparent to-sun sm:block" />
            </div>
            <div>
              <div>
                <Sticker rotate={-2}>{site.sessionLabel}</Sticker>
              </div>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.08] text-navy-deep sm:text-6xl">
                <SplitText text={site.name} immediate delay={0.45} stagger={0.09} />
              </h1>
              <p className="text-shine mt-3 text-2xl font-bold leading-snug sm:text-3xl lg:text-4xl">{site.tagline}</p>
              <p lang="bn" className="font-bn mt-1 text-base leading-relaxed text-navy/80">
                <SplitText text={site.taglineBn} immediate delay={0.9} />
              </p>
            </div>
            <div className="mt-5 lg:mt-0">
              <p className="text-base leading-relaxed text-navy-deep/80">{home.lede}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <JoyLink
                  to="/admission"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-orange px-5 py-3 text-base font-bold text-navy-deep shadow-[0_8px_20px_rgba(42,44,137,0.12)]"
                >
                  {home.primaryCta} <span lang="bn" className="font-bn">/ {home.primaryCtaBn}</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </JoyLink>
                <JoyLink
                  to="/about"
                  className="inline-flex min-h-11 items-center rounded-full border border-navy/20 bg-white px-5 py-3 text-base font-bold text-navy"
                >
                  {home.secondaryCta}
                </JoyLink>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((item, index) => (
            <li key={item.id} className="h-full">
              <Reveal className="h-full" delay={index * 0.04}>
                <HoverCard className="flex h-full min-h-36 flex-col items-center justify-center rounded-[24px] border border-sun/60 bg-gradient-to-br from-navy to-navy-deep px-4 py-5 text-center text-white shadow-[0_12px_26px_rgba(20,21,63,0.25)]">
                  {item.value === null ? (
                    <p className="text-lg font-bold leading-tight text-sun sm:text-xl">{item.pending}</p>
                  ) : (
                    <p className="font-display text-4xl leading-none tracking-wide text-sun sm:text-5xl">{item.value}</p>
                  )}
                  <p className="mt-2 text-sm font-semibold leading-snug text-white/90">{item.label}</p>
                  <p lang="bn" className="font-bn mt-0.5 text-base font-semibold leading-relaxed text-sun">{item.bn}</p>
                </HoverCard>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-16">
        <Reveal>
          <h2 className="text-3xl font-semibold text-navy-deep sm:text-4xl">
            <SplitText text={home.programsTitle} />
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy-deep/75">{home.programsText}</p>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {programs.map((program, index) => {
            const look = programArt[program.id] ?? programArt.english;
            return (
              <div key={program.id} className="h-full">
              <Reveal className="h-full" delay={index * 0.08}>
              <HoverCard className={`h-full rounded-[28px] border-2 bg-gradient-to-br to-white p-6 shadow-[0_10px_26px_rgba(42,44,137,0.10)] ${look.border} ${look.wash}`}>
                <div className={`mb-3 inline-flex rounded-2xl p-2 ${look.tone}`}>
                  <Art name={look.art} className="h-12 w-12 text-navy" />
                </div>
                <p lang="ar" dir="rtl" className="font-arabic text-3xl font-bold leading-[1.7] text-navy">{program.titleAr}</p>
                <h3 className="mt-1 text-2xl text-navy-deep">{program.title}</h3>
                <p lang="bn" className="font-bn mt-0.5 text-base font-semibold leading-relaxed text-navy">{program.titleBn}</p>
                <p className="mt-2 text-base leading-relaxed text-navy-deep/80">{program.text}</p>
              </HoverCard>
              </Reveal>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#E9EBFF] to-white py-12 sm:py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <h2 className="text-3xl font-semibold text-navy-deep sm:text-4xl">
            <SplitText text={home.pathTitle} />
          </h2>
          <p className="mt-3 max-w-2xl text-navy-deep/75">{home.pathText}</p>
          <ol className="mt-8 space-y-3">
            {classes.map((item, index) => (
              <li key={item.id} style={{ marginLeft: `${Math.min(index, 8) * 10}px` }} className="max-w-xl">
                <Reveal delay={Math.min(index, 6) * 0.05}>
                <HoverCard
                  className={`rounded-[24px] border-2 bg-gradient-to-r to-white px-4 py-4 text-navy-deep shadow-[0_8px_20px_rgba(42,44,137,0.10)] ${
                    item.stage === 'Early years' ? 'border-sun from-[#FFF0B8]' : 'border-navy/25 from-[#DFE2FF]'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy to-navy-deep text-sm font-bold text-sun">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-xl font-semibold text-navy">{item.name}</h3>
                    <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-bold text-navy">{item.stage}</span>
                  </div>
                  {item.sections.length > 0 && (
                    <p className="mt-2 text-base font-semibold text-navy">{item.sections.join(' · ')}</p>
                  )}
                  <p className="mt-1 text-base leading-relaxed text-navy-deep/80">{item.text}</p>
                </HoverCard>
                </Reveal>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-navy-deep/60">{home.pathFootnote}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
        <Sticker rotate={1.5}>Placeholder</Sticker>
        <h2 className="mt-4 text-3xl font-semibold text-navy-deep">
          <SplitText text={dayAtSchool.title} />
        </h2>
        <p lang="bn" className="font-bn text-lg font-semibold text-navy">{dayAtSchool.kickerBn}</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-deep/75">{dayAtSchool.note}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dayAtSchool.steps.map((step, index) => (
            <HoverCard key={step.label} className="rounded-[24px] border border-dashed border-navy/30 bg-gradient-to-br from-[#E9EBFF] to-white p-5">
              <p className="inline-flex rounded-full bg-sun px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-navy-deep">0{index + 1}</p>
              <h3 className="mt-1 text-lg font-semibold text-navy-deep">{step.label}</h3>
              <p className="mt-1 text-sm text-navy-deep/70">{step.text}</p>
            </HoverCard>
          ))}
        </div>
      </section>

      <section className="bg-[#F3F5FF] py-12 sm:py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <h2 className="text-3xl font-semibold text-navy-deep">
            <SplitText text={home.momentsTitle} />
          </h2>
          <p lang="bn" className="font-bn text-lg font-semibold text-navy">{home.momentsKickerBn}</p>
          <div className="mt-6">
            <MomentsCarousel />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[240px_1fr]">
        <BlobFrame className="mx-auto w-56">
          <ImageReveal>
            <img
              src={site.principal.photo}
              alt={`Portrait of ${site.principal.name}, ${site.principal.title}.`}
              width={site.principal.photoWidth}
              height={site.principal.photoHeight}
              className="aspect-[3/4] w-full object-cover object-top"
              loading="lazy"
            />
          </ImageReveal>
        </BlobFrame>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-navy">{home.principalKicker}</p>
          <h2 className="mt-1 text-3xl font-semibold text-navy-deep">
            <SplitText text={home.principalTitle} />
          </h2>
          <p className="text-sm font-semibold text-navy">{site.principal.title}</p>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-navy-deep/80">{home.principalNote}</p>
        </div>
      </section>

      <section className="bg-orange/20 py-12 sm:py-16">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold text-navy-deep">
              <SplitText text={home.admissionTitle} />
            </h2>
            <p className="mt-3 text-navy-deep/80">{home.admissionText}</p>
            <ol className="mt-6 space-y-3">
              {admission.steps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange text-base font-bold text-navy-deep">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-navy-deep">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-navy-deep/75">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <SoftCard accent="orange">
            <h3 className="text-2xl font-semibold text-navy-deep">{admission.formTitle}</h3>
            <div className="mt-3">
              <InquiryForm />
            </div>
          </SoftCard>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
        <h2 className="text-3xl font-semibold text-navy-deep">
          <SplitText text={noticesPage.title} />
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {noticesPage.notices.map((notice) => (
            <HoverCard key={notice.id} className="rounded-[24px] border border-sun bg-sun/40 p-5 shadow-[0_8px_20px_rgba(42,44,137,0.06)]">
              <p className="text-xs font-bold uppercase tracking-wide text-navy">{notice.date}</p>
              <h3 className="mt-1 text-xl font-semibold text-navy-deep">{notice.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-deep/80">{notice.body}</p>
              {notice.href && (
                <Link to={notice.href} className="mt-3 inline-flex min-h-11 items-center font-bold text-navy">
                  Admission details
                </Link>
              )}
            </HoverCard>
          ))}
          <HoverCard className="rounded-[24px] border border-navy/10 bg-white p-5">
            <h3 className="text-xl font-semibold text-navy-deep">{noticesPage.eventsTitle}</h3>
            <p className="mt-2 text-sm text-navy-deep/75">{noticesPage.eventsNote}</p>
          </HoverCard>
        </div>
      </section>
    </>
  );
}
