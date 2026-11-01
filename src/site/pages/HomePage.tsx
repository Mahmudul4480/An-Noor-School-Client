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
import { ArchFrame, BlobFrame, Float, JoyLink, SoftCard, Sticker, Wave } from '../components/kit';
import { Reveal } from '../components/ui';

const factTones = [
  { bg: 'bg-sun', text: 'text-navy-deep' },
  { bg: 'bg-sky', text: 'text-navy-deep' },
  { bg: 'bg-leaf', text: 'text-white' },
  { bg: 'bg-sun', text: 'text-navy-deep' },
] as const;
const programArt: Record<string, { art: ArtName; tone: string; border: string }> = {
  islamic: { art: 'crescent', tone: 'bg-sun', border: 'border-sun' },
  hifz: { art: 'quran', tone: 'bg-[#e7f6ee]', border: 'border-leaf' },
  arabic: { art: 'book', tone: 'bg-sky/40', border: 'border-sky' },
  english: { art: 'pencil', tone: 'bg-orange/25', border: 'border-orange' },
};
const stepColors = ['bg-sun', 'bg-sky', 'bg-sun', 'bg-sky', 'bg-sun', 'bg-sky', 'bg-sun', 'bg-sky', 'bg-sun'];

export default function HomePage() {
  return (
    <>
      <Seo title={seo.home.title} description={seo.home.description} path={seo.home.path} />
      <section className="relative overflow-hidden bg-gradient-to-b from-sky to-cream">
        <Decorations />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pb-8 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:pb-4">
          <div>
            <p lang="ar" dir="rtl" className="font-arabic text-2xl text-navy sm:text-3xl">
              {site.bismillah}
            </p>
            <div className="mt-4">
              <Sticker rotate={-2}>{site.sessionLabel}</Sticker>
            </div>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.05] text-navy-deep sm:text-6xl">
              {site.name}
            </h1>
            <p className="mt-3 max-w-lg text-lg font-semibold text-navy">{site.tagline}</p>
            <p lang="bn" className="font-bn mt-1 text-base text-navy/80">
              {site.taglineBn}
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-navy-deep/80">{home.lede}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <JoyLink
                to="/admission"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-orange px-5 py-3 text-base font-bold text-navy-deep shadow-[0_6px_0_0_#2A2C89]"
              >
                {home.primaryCta} <span lang="bn" className="font-bn">/ {home.primaryCtaBn}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </JoyLink>
              <Link
                to="/about"
                className="inline-flex min-h-11 items-center rounded-full border-2 border-navy bg-white px-5 py-3 text-base font-bold text-navy"
              >
                {home.secondaryCta}
              </Link>
            </div>
          </div>
          <ArchFrame className="mx-auto w-full max-w-md lg:max-w-none">
            <img
              src={photos.hero.src}
              srcSet="/site/hero-800.webp 800w, /site/hero.webp 1920w"
              sizes="(max-width: 768px) 100vw, 560px"
              alt={photos.hero.alt}
              width={photos.hero.width}
              height={photos.hero.height}
              fetchPriority="high"
              decoding="async"
              className="aspect-[4/5] w-full object-cover sm:aspect-[5/4]"
            />
          </ArchFrame>
        </div>
        <Wave fill="#FFF7E3" />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((item, index) => (
            <li key={item.id}>
              <Reveal delay={index * 0.04}>
                <div className={`flex min-h-28 flex-col justify-center rounded-full px-4 py-5 text-center shadow-[0_8px_0_0_rgba(42,44,137,0.15)] ${factTones[index].bg} ${factTones[index].text}`}>
                  <p className="text-2xl font-semibold sm:text-3xl">
                    {item.value === null ? item.pending : item.value}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide">{item.label}</p>
                  <p lang="bn" className="font-bn text-sm">{item.bn}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <Reveal>
          <h2 className="text-3xl font-semibold text-navy-deep sm:text-4xl">{home.programsTitle}</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy-deep/75">{home.programsText}</p>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {programs.map((program) => {
            const look = programArt[program.id] ?? programArt.english;
            return (
              <article key={program.id} className={`rounded-[28px] border-4 bg-white p-5 ${look.border}`}>
                <div className={`mb-3 inline-flex rounded-2xl p-2 ${look.tone}`}>
                  <Art name={look.art} className="h-12 w-12 text-navy" />
                </div>
                <p lang="ar" dir="rtl" className="font-arabic text-2xl text-navy">{program.titleAr}</p>
                <h3 className="text-2xl font-semibold text-navy-deep">{program.title}</h3>
                <p lang="bn" className="font-bn text-sm font-semibold text-navy">{program.titleBn}</p>
                <p className="mt-2 text-sm leading-relaxed text-navy-deep/75">{program.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-semibold text-navy-deep sm:text-4xl">{home.pathTitle}</h2>
          <p className="mt-3 max-w-2xl text-navy-deep/75">{home.pathText}</p>
          <ol className="mt-8 space-y-3">
            {classes.map((item, index) => (
              <li key={item.id} style={{ marginLeft: `${Math.min(index, 8) * 10}px` }} className="max-w-xl">
                <div className={`rounded-[24px] px-4 py-3 text-navy-deep shadow-[0_6px_0_0_rgba(42,44,137,0.12)] ${stepColors[index]}`}>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-bold">{String(index + 1).padStart(2, '0')}</span>
                    <h3 className="text-xl font-semibold">{item.name}</h3>
                  </div>
                  {item.sections.length > 0 && (
                    <p className="mt-1 text-sm font-semibold">{item.sections.join(' · ')}</p>
                  )}
                  <p className="mt-1 text-sm leading-relaxed opacity-90">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-navy-deep/60">{home.pathFootnote}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Sticker rotate={1.5}>Placeholder</Sticker>
        <h2 className="mt-4 text-3xl font-semibold text-navy-deep">{dayAtSchool.title}</h2>
        <p lang="bn" className="font-bn text-lg font-semibold text-navy">{dayAtSchool.kickerBn}</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-deep/75">{dayAtSchool.note}</p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dayAtSchool.steps.map((step, index) => (
            <li key={step.label} className="rounded-[24px] border-4 border-dashed border-navy/30 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-navy">0{index + 1}</p>
              <h3 className="mt-1 text-lg font-semibold text-navy-deep">{step.label}</h3>
              <p className="mt-1 text-sm text-navy-deep/70">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-semibold text-navy-deep">{home.momentsTitle}</h2>
          <p lang="bn" className="font-bn text-lg font-semibold text-navy">{home.momentsKickerBn}</p>
          <div className="mt-6">
            <MomentsCarousel />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[240px_1fr]">
        <BlobFrame className="mx-auto w-56">
          <img
            src={site.principal.photo}
            alt={`Portrait of ${site.principal.name}, ${site.principal.title}.`}
            width={site.principal.photoWidth}
            height={site.principal.photoHeight}
            className="aspect-[3/4] w-full object-cover object-top"
            loading="lazy"
          />
        </BlobFrame>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-navy">{home.principalKicker}</p>
          <h2 className="mt-1 text-3xl font-semibold text-navy-deep">{home.principalTitle}</h2>
          <p className="text-sm font-semibold text-navy">{site.principal.title}</p>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-navy-deep/80">{home.principalNote}</p>
        </div>
      </section>

      <section className="bg-orange/20 py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold text-navy-deep">{home.admissionTitle}</h2>
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

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-3xl font-semibold text-navy-deep">{noticesPage.title}</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {noticesPage.notices.map((notice) => (
            <li key={notice.id} className="rotate-[-1deg] rounded-[24px] bg-sun p-5 shadow-[6px_6px_0_0_#2A2C89]">
              <p className="text-xs font-bold uppercase tracking-wide text-navy">{notice.date}</p>
              <h3 className="mt-1 text-xl font-semibold text-navy-deep">{notice.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-deep/80">{notice.body}</p>
              {notice.href && (
                <Link to={notice.href} className="mt-3 inline-flex min-h-11 items-center font-bold text-navy">
                  Admission details
                </Link>
              )}
            </li>
          ))}
          <li className="rotate-[1.5deg] rounded-[24px] bg-coral/15 p-5">
            <h3 className="text-xl font-semibold text-navy-deep">{noticesPage.eventsTitle}</h3>
            <p className="mt-2 text-sm text-navy-deep/75">{noticesPage.eventsNote}</p>
          </li>
        </ul>
      </section>
    </>
  );
}

function Decorations() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <Float duration={8} className="absolute left-2 top-4">
        <Art name="cloud" className="h-12 w-12 text-navy sm:h-16 sm:w-16" />
      </Float>
      <Float duration={7} className="absolute right-6 top-8 hidden md:inline-block">
        <Art name="star" className="h-10 w-10 text-navy" />
      </Float>
      <Float duration={9} className="absolute bottom-16 right-4 hidden md:inline-block">
        <Art name="balloon" className="h-14 w-14 text-navy" />
      </Float>
      <Float duration={6} className="absolute right-24 top-6 hidden lg:inline-block">
        <Art name="crescent" className="h-12 w-12 text-navy" />
      </Float>
    </div>
  );
}
