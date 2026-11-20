import { about, home, photos, seo, site } from '../content';
import { Seo } from '../seo';
import { JourneyTimeline } from '../components/JourneyTimeline';
import { CreamCard, PageHero, Reveal } from '../components/ui';

export default function AboutPage() {
  return (
    <>
      <Seo title={seo.about.title} description={seo.about.description} path={seo.about.path} />
      <PageHero kicker={about.kicker} title={about.title} titleBn={about.titleBn} lede={about.lede} tone="navy" art="lantern" />
      <section className="mx-auto grid max-w-[1200px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-navy-deep">{about.storyTitle}</h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-navy-deep/85">
            {about.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <blockquote className="site-card mt-6 border-l-4 border-l-navy p-6">
            <p className="text-lg font-semibold text-navy-deep">{site.curriculumLine}</p>
            <p className="mt-2 text-base text-navy-deep/80">{site.curriculumBlend}</p>
          </blockquote>
        </div>
        <figure className="site-card">
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

      <JourneyTimeline />

      <section className="mx-auto grid max-w-[1200px] gap-4 px-4 sm:px-6 md:grid-cols-2">
        <Reveal>
          <CreamCard className="h-full">
            <h2 className="text-lg font-semibold text-navy-deep">{about.missionTitle}</h2>
            <p className="mt-3 text-base leading-relaxed text-navy-deep/85">{about.missionNote}</p>
          </CreamCard>
        </Reveal>
        <Reveal delay={0.08}>
          <CreamCard className="h-full">
            <h2 className="text-lg font-semibold text-navy-deep">{about.visionTitle}</h2>
            <p className="mt-3 text-base leading-relaxed text-navy-deep/85">{about.visionNote}</p>
          </CreamCard>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-semibold text-navy-deep">{about.leadershipTitle}</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy-deep/85">{about.leadershipText}</p>
        <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-2">
          <CreamCard className="flex h-full flex-col">
            <img
              src={site.managingPartner.photo}
              alt={`Portrait of ${site.managingPartner.name}, ${site.managingPartner.title}.`}
              width={site.managingPartner.photoWidth}
              height={site.managingPartner.photoHeight}
              className="h-72 w-full rounded-2xl object-cover object-center sm:h-80"
              loading="lazy"
            />
            <p className="mt-4 text-sm font-semibold text-navy">{site.managingPartner.title}</p>
            <h3 className="mt-1 text-2xl font-semibold text-navy-deep">{site.managingPartner.name}</h3>
            <p className="mt-3 text-base leading-relaxed text-navy-deep/85">{about.partnerNote}</p>
          </CreamCard>
          <CreamCard className="flex h-full flex-col">
            <img
              src={site.principal.photo}
              alt={`Portrait of ${site.principal.name}, Principal.`}
              width={site.principal.photoWidth}
              height={site.principal.photoHeight}
              className="h-72 w-full rounded-2xl object-cover object-center sm:h-80"
              loading="lazy"
            />
            <p className="mt-4 text-sm font-semibold text-navy">{site.principal.title}</p>
            <h3 className="mt-1 text-2xl font-semibold text-navy-deep">{site.principal.name}</h3>
            <p className="mt-3 text-base leading-relaxed text-navy-deep/85">{home.principalNote}</p>
          </CreamCard>
        </div>
      </section>
    </>
  );
}

