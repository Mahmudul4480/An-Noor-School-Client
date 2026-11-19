import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';
import {
  admission,
  classes,
  dayAtSchool,
  departmentNews,
  departmentsPage,
  home,
  moments,
  noticesPage,
  photos,
  programs,
  seo,
  site,
  stats,
} from '../content';
import { Seo } from '../seo';
import { DeptIcon } from '../components/DeptIcon';
import { InquiryForm } from '../components/InquiryForm';
import { MomentsCarousel } from '../components/MomentsCarousel';
import { useReducedMotion, motion } from 'motion/react';
import { BlobFrame, HoverCard, JoyLink, SoftCard, Sticker } from '../components/kit';
import { Art, SwayingFlower } from '../art';
import { ImageReveal, ParallaxPhoto, SplitText } from '../components/motion';
import { Reveal } from '../components/ui';

const heroEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const programArt: Record<string, { border: string; wash: string }> = {
  islamic: { border: 'border-sun', wash: 'from-[#FFF3C4]' },
  hifz: { border: 'border-leaf', wash: 'from-[#DDF3E6]' },
  arabic: { border: 'border-sky', wash: 'from-[#DCEFFD]' },
  english: { border: 'border-orange', wash: 'from-[#FFE6C7]' },
};
export default function HomePage() {
  const reduce = useReducedMotion();
  const featuredNews = departmentNews.filter((item) => item.featured);
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
        <div className="relative mx-auto -mt-6 max-w-[1100px] px-4 pb-10 sm:-mt-16 sm:px-6 lg:-mt-16 lg:pt-20">
          <motion.div
            className="relative"
            initial={reduce ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: heroEase }}
          >
          <div className="ribbon-frame rounded-[34px] p-[5px] shadow-[0_24px_60px_rgba(20,21,63,0.22)]">
          <div className="rounded-[29px] bg-gradient-to-br from-white via-[#F1F3FF] to-[#FFF4CC] px-6 pt-6 sm:px-8 sm:pt-8 lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(260px,1.08fr)] lg:items-end lg:gap-4 lg:px-8 lg:pt-6">
            <div className="pb-6 lg:pb-8">
              <p lang="ar" dir="rtl" className="font-bismillah w-fit text-3xl text-navy sm:text-4xl">
                {site.bismillahPlain}
              </p>
              <div className="mt-4">
                <Sticker rotate={-2}>{site.sessionLabel}</Sticker>
              </div>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.05] text-navy-deep sm:text-5xl lg:max-w-[20rem] lg:text-[2.65rem]">
                <SplitText text={site.name} immediate delay={0.45} stagger={0.09} />
              </h1>
              <p className="text-shine mt-3 max-w-xl text-2xl font-bold leading-snug lg:max-w-[20rem] lg:text-[1.65rem]">{site.tagline}</p>
              <p lang="bn" className="font-bn mt-1 max-w-xl text-base leading-relaxed text-navy lg:max-w-[22rem]">
                <SplitText text={site.taglineBn} immediate delay={0.9} />
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-navy-deep/80 lg:max-w-[18.5rem]">{home.lede}</p>
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
                  className="inline-flex min-h-11 items-center rounded-full bg-gradient-to-r from-navy to-navy-deep px-5 py-3 text-base font-bold text-white shadow-[0_8px_20px_rgba(20,21,63,0.25)]"
                >
                  {home.secondaryCta}
                </JoyLink>
              </div>
            </div>
            <HeroStudents reduce={reduce} />
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
              <Link to={`/departments/${program.id}`} className="block h-full rounded-[28px]">
              <HoverCard className={`flex h-full flex-col rounded-[28px] border-2 bg-gradient-to-br to-white p-6 shadow-[0_10px_26px_rgba(42,44,137,0.10)] ${look.border} ${look.wash}`}>
                <DeptIcon id={program.id} className="mb-3" />
                <p lang="ar" dir="rtl" className="font-bismillah text-3xl text-navy">{program.titleAr}</p>
                <h3 className="mt-1 text-2xl text-navy-deep">{program.title}</h3>
                <p lang="bn" className="font-bn mt-0.5 text-base font-semibold leading-relaxed text-navy">{program.titleBn}</p>
                <p className="mt-2 text-base leading-relaxed text-navy-deep/80">{program.text}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-4 text-base font-bold text-navy">
                  {departmentsPage.cardCta} <ArrowRight size={18} aria-hidden="true" />
                </span>
              </HoverCard>
              </Link>
              </Reveal>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-12 sm:px-6 sm:pb-16">
        <h2 className="text-3xl font-semibold text-navy-deep sm:text-4xl">
          <SplitText text={departmentsPage.featuredTitle} />
        </h2>
        <p lang="bn" className="font-bn mt-1 text-lg font-semibold text-navy">
          {departmentsPage.featuredTitleBn}
        </p>
        {featuredNews.length === 0 ? (
          <div className="ribbon-frame mt-6 rounded-[26px] p-[3px]">
            <div className="rounded-[23px] bg-gradient-to-br from-white to-[#FFF6D6] p-6 text-base leading-relaxed text-navy-deep/80">
              {departmentsPage.featuredEmpty}
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredNews.map((item) => (
              <Link key={item.id} to={`/departments/${item.department}`} className="block h-full rounded-[24px]">
                <HoverCard className="h-full overflow-hidden rounded-[24px] border border-navy/15 bg-white shadow-[0_10px_26px_rgba(42,44,137,0.10)]">
                  {item.photo && (
                    <ImageReveal>
                      <img
                        src={item.photo.src}
                        alt={item.photo.alt}
                        width={item.photo.width}
                        height={item.photo.height}
                        className="aspect-[16/10] w-full object-cover"
                        loading="lazy"
                      />
                    </ImageReveal>
                  )}
                  <div className="p-5">
                    <p className="inline-flex rounded-full bg-sun px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-navy-deep">{item.date}</p>
                    <h3 className="mt-2 text-xl text-navy">{item.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-navy-deep/80">{item.body}</p>
                  </div>
                </HoverCard>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-gradient-to-b from-[#E9EBFF] to-white py-12 sm:py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <h2 className="text-3xl font-semibold text-navy-deep sm:text-4xl">
            <SplitText text={home.pathTitle} />
          </h2>
          <p className="mt-3 max-w-2xl text-navy-deep/75">{home.pathText}</p>
          <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <ol className="space-y-3">
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
          <aside className="lg:sticky lg:top-28">
            <h3 className="text-2xl text-navy">{home.pathGalleryTitle}</h3>
            <p lang="bn" className="font-bn text-base font-semibold text-navy/80">
              {home.pathGalleryTitleBn}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {moments.slice(0, 4).map((photo, index) => (
                <Link
                  key={photo.id}
                  to="/gallery"
                  className={`block overflow-hidden border-2 border-sun shadow-[0_10px_24px_rgba(42,44,137,0.18)] ${
                    index % 3 === 0 ? 'rounded-[90px_90px_20px_20px]' : 'rounded-[20px]'
                  } ${index % 2 === 1 ? 'mt-6' : ''}`}
                >
                  <ImageReveal>
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      className="aspect-[4/5] w-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </ImageReveal>
                </Link>
              ))}
            </div>
            <div className="mt-6">
              <JoyLink
                to="/gallery"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-navy to-navy-deep px-5 py-3 text-base font-bold text-white shadow-[0_8px_20px_rgba(20,21,63,0.25)]"
              >
                {home.pathGalleryCta} <ArrowRight size={18} aria-hidden="true" />
              </JoyLink>
            </div>
          </aside>
          </div>
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
          <HoverCard className="rounded-[24px] border border-sun/60 bg-gradient-to-br from-navy to-navy-deep p-5 text-white shadow-[0_12px_26px_rgba(20,21,63,0.25)]">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sun text-navy-deep">
              <CalendarDays size={22} aria-hidden="true" />
            </span>
            <h3 className="mt-3 text-xl font-semibold text-sun">{noticesPage.eventsTitle}</h3>
            <p className="mt-2 text-base leading-relaxed text-white/85">{noticesPage.eventsNote}</p>
          </HoverCard>
        </div>
      </section>
    </>
  );
}

function HeroStudents({ reduce }: { reduce: boolean | null }) {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const apply = () => setWide(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);
  const float = wide ? (reduce ? -36 : [-28, -44, -28]) : reduce ? 0 : [0, -8, 0];
  return (
    <div className="relative mt-8 h-64 sm:h-72 lg:mt-0 lg:h-[20rem]">
      <motion.div
        className="pointer-events-none absolute bottom-0 left-1/2 z-10 w-max -translate-x-1/2 lg:left-auto lg:-right-3 lg:translate-x-0"
        animate={{ y: float }}
        transition={reduce ? { duration: 0 } : { duration: 5.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <picture className="block h-full">
          <source srcSet="/site/hero-students.webp" type="image/webp" />
          <img
            src="/site/hero-students.png"
            alt="An-Noor students in school uniform"
            width={831}
            height={740}
            decoding="async"
            className="h-auto w-[min(18.5rem,calc(100vw-3.5rem))] sm:w-[22rem] lg:h-[38rem] lg:w-auto"
          />
        </picture>
        <SwayingFlower className="absolute bottom-20 right-2 h-7 w-7 opacity-75" />
        <motion.span
          aria-hidden="true"
          className="absolute left-1 top-1"
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={reduce ? undefined : { duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Art name="butterfly" className="h-8 w-8 opacity-80" />
        </motion.span>
      </motion.div>
    </div>
  );
}
