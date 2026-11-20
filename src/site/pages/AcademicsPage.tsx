import type { ComponentType } from 'react';
import {
  Award,
  Backpack,
  BookOpen,
  Building2,
  GraduationCap,
  Info,
  Library,
  NotebookPen,
  Palette,
  Pencil,
  School,
  Shapes,
  Sprout,
} from 'lucide-react';
import { academics, classes, programs, seo, site, type ClassBand } from '../content';
import { Seo } from '../seo';
import { DeptIcon } from '../components/DeptIcon';
import { AccentCard, HoverCard, IconBadge } from '../components/kit';
import { PageHero, SectionHeading } from '../components/ui';

const programLook: Record<string, { border: string; wash: string; label: string }> = {
  islamic: { border: 'border-sun', wash: 'from-[#FFF3C4]', label: 'bg-sun text-navy-deep' },
  hifz: { border: 'border-leaf', wash: 'from-[#DDF3E6]', label: 'bg-[#D4F0E2] text-navy' },
  arabic: { border: 'border-sky', wash: 'from-[#DCEFFD]', label: 'bg-[#D3EEFC] text-navy-deep' },
  english: { border: 'border-orange', wash: 'from-[#FFE6C7]', label: 'bg-[#FDE0C2] text-navy-deep' },
};

type ClassLook = {
  bar: string;
  wash: string;
  badge: string;
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' }>;
};

const classLook: Record<string, ClassLook> = {
  play: { bar: 'bg-sun', wash: 'from-[#FFF4C8]', badge: 'bg-sun text-navy-deep', icon: Shapes },
  nursery: { bar: 'bg-sky', wash: 'from-[#DDF3FF]', badge: 'bg-sky text-navy-deep', icon: Palette },
  kg: { bar: 'bg-leaf', wash: 'from-[#DDF3E6]', badge: 'bg-[#CDEEDB] text-navy', icon: Sprout },
  c1: { bar: 'bg-orange', wash: 'from-[#FFE6C7]', badge: 'bg-[#FDE0C2] text-navy-deep', icon: BookOpen },
  c2: { bar: 'bg-navy', wash: 'from-[#E4E6FF]', badge: 'bg-navy text-sun', icon: Pencil },
  c3: { bar: 'bg-coral', wash: 'from-[#FFE4E1]', badge: 'bg-[#F8D2CE] text-navy-deep', icon: Library },
  c4: { bar: 'bg-sun', wash: 'from-[#FFF6D8]', badge: 'bg-[#FFE8A3] text-navy-deep', icon: NotebookPen },
  c5: { bar: 'bg-sky', wash: 'from-[#E5F6FF]', badge: 'bg-[#D3EEFC] text-navy-deep', icon: School },
  c6: { bar: 'bg-leaf', wash: 'from-[#E5F7EE]', badge: 'bg-[#D4F0E2] text-navy', icon: Backpack },
  c7: { bar: 'bg-orange', wash: 'from-[#FFF0DE]', badge: 'bg-[#FFD7A8] text-navy-deep', icon: Award },
};

const classFallback: ClassLook = {
  bar: 'bg-navy',
  wash: 'from-[#E4E6FF]',
  badge: 'bg-[#E4E7FF] text-navy',
  icon: BookOpen,
};

export default function AcademicsPage() {
  const early = classes.filter((item) => item.stage === 'Early years');
  const primary = classes.filter((item) => item.stage === 'Primary');

  return (
    <>
      <Seo title={seo.academics.title} description={seo.academics.description} path={seo.academics.path} />
      <PageHero
        kicker={academics.kicker}
        title={academics.title}
        titleBn={academics.titleBn}
        lede={academics.lede}
        tone="leaf"
        art="book"
        band
      />

      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
        <HoverCard className="overflow-hidden rounded-[28px] border border-navy/10 bg-gradient-to-br from-[#FFF8E4] via-white to-[#E9EBFF] shadow-[0_14px_34px_rgba(42,44,137,0.12)]">
          <div className="h-1.5 bg-gradient-to-r from-navy via-sun to-orange" />
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:p-8">
            <IconBadge className="bg-navy text-sun">
              <Building2 size={22} aria-hidden="true" />
            </IconBadge>
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-wide text-navy">{academics.bannerTitle}</p>
              <p className="mt-2 text-2xl text-navy-deep sm:text-3xl">{site.curriculumLine}</p>
              <p className="mt-2 text-base leading-relaxed text-navy-deep/85">{site.curriculumBlend}</p>
            </div>
          </div>
        </HoverCard>
      </section>

      <section className="bg-gradient-to-b from-[#f5f7fb] to-white">
        <div className="mx-auto max-w-[1200px] px-4 pb-10 sm:px-6">
          <div className="grid gap-4 md:grid-cols-2">
            {programs.map((program) => {
              const look = programLook[program.id] ?? programLook.english;
              return (
                <HoverCard
                  key={program.id}
                  className={`flex h-full flex-col rounded-[28px] border-2 bg-gradient-to-br to-white p-6 shadow-[0_12px_28px_rgba(42,44,137,0.12)] ${look.border} ${look.wash}`}
                >
                  <DeptIcon id={program.id} />
                  <p lang="ar" dir="rtl" className="font-bismillah mt-3 w-full text-right text-3xl text-navy">
                    {program.titleAr}
                  </p>
                  <h2 className="mt-1 text-2xl text-navy-deep">{program.title}</h2>
                  <p lang="bn" className={`font-bn mt-2 inline-flex w-fit max-w-full rounded-full px-3 py-1 text-base font-semibold leading-relaxed ${look.label}`}>
                    {program.titleBn}
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-navy-deep/85">{program.text}</p>
                </HoverCard>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#E9EBFF] to-[#f5f7fb] py-14">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="flex items-start gap-4">
            <IconBadge className="mt-1 bg-navy text-sun">
              <GraduationCap size={22} aria-hidden="true" />
            </IconBadge>
            <SectionHeading kicker="Classes" kickerBn="শ্রেণি" title={academics.classesTitle} text={academics.classesText} />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {early.map((item) => (
              <ClassCard key={item.id} item={item} />
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {primary.map((item) => (
              <ClassCard key={item.id} item={item} />
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-4 rounded-[24px] border border-sky/50 bg-gradient-to-r from-[#E7F6FF] to-white p-5 shadow-[0_10px_24px_rgba(42,44,137,0.08)] sm:flex-row sm:items-start">
            <IconBadge className="bg-[#D3EEFC] text-navy">
              <Info size={22} aria-hidden="true" />
            </IconBadge>
            <p className="min-w-0 text-base leading-relaxed text-navy-deep/85">{academics.syllabusNote}</p>
          </div>
        </div>
      </section>
    </>
  );
}

function ClassCard({ item }: { item: ClassBand; key?: string }) {
  const look = classLook[item.id] ?? classFallback;
  const Icon = look.icon;
  return (
    <AccentCard barClass={look.bar} washClass={look.wash}>
      <div className="flex items-start justify-between gap-3">
        <IconBadge className={look.badge}>
          <Icon size={22} aria-hidden="true" />
        </IconBadge>
        <p className="rounded-full bg-white/90 px-2.5 py-1 text-sm font-semibold text-navy shadow-sm">{item.stage}</p>
      </div>
      <h3 className="mt-4 text-2xl text-navy-deep">{item.name}</h3>
      {item.sections.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {item.sections.map((section) => (
            <li
              key={section}
              className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-navy-deep shadow-sm ring-1 ring-navy/10"
            >
              {section}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-base leading-relaxed text-navy-deep/85">{item.text}</p>
    </AccentCard>
  );
}
