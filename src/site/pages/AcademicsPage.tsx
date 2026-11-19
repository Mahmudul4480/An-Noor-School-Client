import { academics, classes, programs, seo, site } from '../content';
import { Seo } from '../seo';
import { HoverCard } from '../components/kit';
import { PageHero, SectionHeading } from '../components/ui';

export default function AcademicsPage() {
  const early = classes.filter((item) => item.stage === 'Early years');
  const primary = classes.filter((item) => item.stage === 'Primary');

  return (
    <>
      <Seo title={seo.academics.title} description={seo.academics.description} path={seo.academics.path} />
      <PageHero kicker={academics.kicker} title={academics.title} titleBn={academics.titleBn} lede={academics.lede} tone="leaf" art="book" />

      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
        <div className="site-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-navy">{academics.bannerTitle}</p>
          <p className="mt-3 text-2xl text-navy-deep sm:text-3xl">{site.curriculumLine}</p>
          <p className="mt-2 text-base text-navy-deep/85">{site.curriculumBlend}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((program) => (
            <HoverCard key={program.id} className="site-card p-6 sm:p-8">
              <p lang="ar" dir="rtl" className="font-arabic w-fit text-2xl leading-relaxed text-navy">
                {program.titleAr}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-navy-deep">{program.title}</h2>
              <p lang="bn" className="font-bn text-sm font-semibold text-navy">
                {program.titleBn}
              </p>
              <p className="mt-3 text-base leading-relaxed text-navy-deep/85">{program.text}</p>
            </HoverCard>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <SectionHeading kicker="Classes" kickerBn="শ্রেণি" title={academics.classesTitle} text={academics.classesText} />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {early.map((item) => (
            <HoverCard key={item.id} className="site-card p-6">
              <p className="text-sm font-semibold text-navy">{item.stage}</p>
              <h3 className="mt-2 text-2xl text-navy-deep">{item.name}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {item.sections.map((section) => (
                  <li key={section} className="rounded-full border border-navy/10 bg-[#f5f7fb] px-3 py-1 text-sm font-semibold text-navy-deep">
                    {section}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-base leading-relaxed text-navy-deep/85">{item.text}</p>
            </HoverCard>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {primary.map((item) => (
            <HoverCard key={item.id} className="site-card p-6">
              <h3 className="text-lg text-navy-deep">{item.name}</h3>
              <p className="mt-2 text-base leading-relaxed text-navy-deep/85">{item.text}</p>
            </HoverCard>
          ))}
        </div>
        <p className="mt-6 text-base leading-relaxed text-navy-deep/75">{academics.syllabusNote}</p>
      </section>
    </>
  );
}
