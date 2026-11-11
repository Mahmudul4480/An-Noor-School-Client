import { about, moments, seo, site, teachersPage } from '../content';
import { Seo } from '../seo';
import { CreamCard, PageHero } from '../components/ui';

export default function TeachersPage() {
  return (
    <>
      <Seo title={seo.teachers.title} description={seo.teachers.description} path={seo.teachers.path} />
      <PageHero tone="sun" art="star"
        kicker={teachersPage.kicker}
        title={teachersPage.title}
        titleBn={teachersPage.titleBn}
        lede={teachersPage.lede}
      />
      <section className="mx-auto grid max-w-[1200px] gap-5 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <CreamCard className="grid gap-5 sm:grid-cols-[180px_1fr] sm:items-center">
          <img
            src={site.principal.photo}
            alt={`Portrait of ${site.principal.name}, Principal.`}
            width={site.principal.photoWidth}
            height={site.principal.photoHeight}
            className="aspect-[3/4] w-full rounded-2xl object-cover object-top"
            loading="lazy"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-crest">{site.principal.title}</p>
            <h2 className="mt-1 text-2xl font-semibold text-navy-deep">{site.principal.name}</h2>
          </div>
        </CreamCard>
        <CreamCard className="flex flex-col justify-center">
          <img
            src={site.managingPartner.photo}
            alt={`Portrait of ${site.managingPartner.name}, ${site.managingPartner.title}.`}
            width={site.managingPartner.photoWidth}
            height={site.managingPartner.photoHeight}
            className="aspect-[3/4] w-full max-w-[260px] rounded-2xl object-cover object-top"
            loading="lazy"
          />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-crest">{site.managingPartner.title}</p>
          <h2 className="mt-1 text-2xl font-semibold text-navy-deep">{site.managingPartner.name}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">{about.partnerNote}</p>
        </CreamCard>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <CreamCard>
          <h2 className="text-2xl font-semibold text-navy-deep">{teachersPage.directoryTitle}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/75">{teachersPage.directoryNote}</p>
        </CreamCard>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-semibold text-navy-deep">{teachersPage.galleryTitle}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {moments.map((photo) => (
            <figure key={photo.id} className="overflow-hidden rounded-[1.6rem] bg-navy-deep shadow-lg ring-1 ring-navy/10">
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                className="aspect-[16/10] w-full object-cover"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-sm text-cream">{photo.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
