import { facilities, photoPlaceholders, seo } from '../content';
import { Seo } from '../seo';
import { HoverCard } from '../components/kit';
import { PageHero, PlaceholderCard, SectionHeading } from '../components/ui';

export default function FacilitiesPage() {
  return (
    <>
      <Seo title={seo.facilities.title} description={seo.facilities.description} path={seo.facilities.path} />
      <PageHero kicker={facilities.kicker} title={facilities.title} titleBn={facilities.titleBn} lede={facilities.lede} tone="sky" art="cloud" />
      <section className="mx-auto grid max-w-[1200px] gap-5 px-4 py-14 sm:px-6 md:grid-cols-2">
        {facilities.real.map((item) => (
          <HoverCard key={item.title} className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_-18px_rgba(20,21,63,0.35)] ring-1 ring-navy/10">
            <img
              src={item.photo.src}
              alt={item.photo.alt}
              width={item.photo.width}
              height={item.photo.height}
              className="aspect-[16/10] w-full object-cover"
              loading="lazy"
            />
            <div className="p-6">
              <h2 className="text-xl font-semibold text-navy-deep">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{item.text}</p>
            </div>
          </HoverCard>
        ))}
      </section>
      <section className="mx-auto max-w-[1200px] px-4 pb-8 sm:px-6">
        <SectionHeading kicker="Photographs" title={facilities.awaitingTitle} text={facilities.awaitingText} />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {photoPlaceholders.map((item) => (
            <div key={item.id}>
              <PlaceholderCard title={item.title} caption={item.caption} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
