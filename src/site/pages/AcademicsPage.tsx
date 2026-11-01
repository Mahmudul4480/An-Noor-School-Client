import { academics, classes, programs, seo, site } from '../content';
import { Seo } from '../seo';
import { PageHero, SectionHeading } from '../components/ui';

export default function AcademicsPage() {
  const early = classes.filter((item) => item.stage === 'Early years');
  const primary = classes.filter((item) => item.stage === 'Primary');

  return (
    <>
      <Seo title={seo.academics.title} description={seo.academics.description} path={seo.academics.path} />
      <PageHero kicker={academics.kicker} title={academics.title} titleBn={academics.titleBn} lede={academics.lede} />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-navy-deep to-navy p-6 text-white shadow-[0_22px_50px_-28px_rgba(20,21,63,0.55)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{academics.bannerTitle}</p>
          <p className="mt-3 text-2xl font-semibold sm:text-3xl">{site.curriculumLine}</p>
          <p className="mt-2 text-cream/85">{site.curriculumBlend}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((program) => (
            <article key={program.id} className="rounded-3xl bg-gradient-to-br from-[#fffaf0] to-cream p-6 ring-1 ring-navy/10">
              <p lang="ar" dir="rtl" className="font-arabic text-3xl text-navy">
                {program.titleAr}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-navy-deep">{program.title}</h2>
              <p lang="bn" className="font-bn text-sm text-crest">
                {program.titleBn}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink/80">{program.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionHeading kicker="Classes" kickerBn="শ্রেণি" title={academics.classesTitle} text={academics.classesText} />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {early.map((item) => (
            <article key={item.id} className="rounded-3xl bg-gradient-to-br from-navy to-navy-soft p-6 text-white shadow-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-gold">{item.stage}</p>
              <h3 className="mt-2 text-2xl font-semibold">{item.name}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {item.sections.map((section) => (
                  <li key={section} className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-navy-deep">
                    {section}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-white/80">{item.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {primary.map((item) => (
            <article key={item.id} className="rounded-3xl bg-gradient-to-br from-[#fffaf0] to-cream p-5 ring-1 ring-navy/10">
              <h3 className="text-lg font-semibold text-navy-deep">{item.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{item.text}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm leading-relaxed text-ink/70">{academics.syllabusNote}</p>
      </section>
    </>
  );
}
