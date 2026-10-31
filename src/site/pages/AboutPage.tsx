import { about, home, photos, seo, site } from '../content';
import { Seo } from '../seo';
import { CreamCard, PageHero } from '../components/ui';

export default function AboutPage() {
  return (
    <>
      <Seo title={seo.about.title} description={seo.about.description} path={seo.about.path} />
      <PageHero kicker={about.kicker} title={about.title} titleBn={about.titleBn} lede={about.lede} />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-navy-deep">{about.storyTitle}</h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-ink/80">
            {about.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <blockquote className="mt-6 rounded-3xl bg-gradient-to-br from-navy to-navy-soft p-6 text-white shadow-lg">
            <p className="text-lg font-semibold">{site.curriculumLine}</p>
            <p className="mt-2 text-sm text-cream/85">{site.curriculumBlend}</p>
          </blockquote>
        </div>
        <figure className="overflow-hidden rounded-[2rem] shadow-[0_24px_50px_-28px_rgba(20,21,63,0.7)] ring-1 ring-navy/10">
          <img
            src={photos.building.src}
            alt={photos.building.alt}
            width={photos.building.width}
            height={photos.building.height}
            className="aspect-[16/10] w-full object-cover"
            loading="lazy"
          />
        </figure>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-3">
        <CreamCard>
          <h2 className="text-lg font-semibold text-navy-deep">{about.historyTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/75">{about.historyNote}</p>
        </CreamCard>
        <CreamCard>
          <h2 className="text-lg font-semibold text-navy-deep">{about.missionTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/75">{about.missionNote}</p>
        </CreamCard>
        <CreamCard>
          <h2 className="text-lg font-semibold text-navy-deep">{about.visionTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/75">{about.visionNote}</p>
        </CreamCard>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-semibold text-navy-deep">{about.leadershipTitle}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/75">{about.leadershipText}</p>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
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
              <h3 className="mt-1 text-2xl font-semibold text-navy-deep">{site.principal.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/75">{home.principalNote}</p>
            </div>
          </CreamCard>
          <CreamCard className="flex flex-col justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy text-xl font-semibold text-gold" aria-hidden="true">
              MK
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-crest">
              {site.managingPartner.title}
            </p>
            <h3 className="mt-1 text-2xl font-semibold text-navy-deep">{site.managingPartner.name}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">{about.partnerNote}</p>
          </CreamCard>
        </div>
      </section>
    </>
  );
}

