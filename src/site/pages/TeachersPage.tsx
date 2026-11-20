import { about, moments, seo, site, teachersPage } from '../content';
import { Seo } from '../seo';
import { CreamCard, PageHero } from '../components/ui';

const portraitFrame =
  'relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#e8ebf8] to-[#fff6df]';

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
      <section className="mx-auto grid max-w-[1200px] items-stretch gap-5 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <CreamCard className="flex h-full flex-col">
          <div className={portraitFrame}>
            <img
              src={site.managingPartner.photo}
              alt={`Portrait of ${site.managingPartner.name}, ${site.managingPartner.title}.`}
              width={site.managingPartner.photoWidth}
              height={site.managingPartner.photoHeight}
              className="absolute inset-0 h-full w-full object-cover object-[center_15%]"
              loading="lazy"
            />
          </div>
          <p className="mt-4 text-sm font-semibold text-navy">{site.managingPartner.title}</p>
          <h2 className="mt-1 text-2xl font-semibold text-navy-deep">{site.managingPartner.name}</h2>
          <p className="mt-3 text-base leading-relaxed text-navy-deep/85">{about.partnerNote}</p>
        </CreamCard>
        <CreamCard className="flex h-full flex-col">
          <div className={portraitFrame}>
            <img
              src="/site/principal-card.webp"
              alt={`Portrait of ${site.principal.name}, Principal.`}
              width={900}
              height={1158}
              className="absolute inset-x-[8%] top-[5%] bottom-[8%] object-contain object-center"
              loading="lazy"
            />
          </div>
          <p className="mt-4 text-sm font-semibold text-navy">{site.principal.title}</p>
          <h2 className="mt-1 text-2xl font-semibold text-navy-deep">{site.principal.name}</h2>
        </CreamCard>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <CreamCard>
          <h2 className="text-2xl font-semibold text-navy-deep">{teachersPage.directoryTitle}</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy-deep/85">{teachersPage.directoryNote}</p>
        </CreamCard>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-semibold text-navy-deep">{teachersPage.galleryTitle}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {moments.map((photo) => (
            <figure key={photo.id} className="site-card">
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                className="aspect-[16/10] w-full object-cover"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-base text-navy-deep">{photo.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
